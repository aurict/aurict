import { and, count, eq, gt, isNotNull, isNull, lte, ne, or } from "drizzle-orm"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import * as schema from "../db/schema"
import type {
  AuditLog,
  AuthIdentity,
  AuthTokenPurpose,
  AuthTokenRecord,
  DeviceLoginFlow,
  Device,
  DeviceTrust,
  FeedbackReport,
  RefreshTokenRecord,
  RemoteSession,
  SecretTransfer,
  TrustScope,
  User,
} from "./types"
import type { BackendRepository } from "./repository"
import { deletedEmail } from "./repository"

type Db = PostgresJsDatabase<typeof schema>

export function createPostgresRepository(db: Db): BackendRepository {
  return {
    async getUser(id) {
      const row = await db.query.users.findFirst({ where: eq(schema.users.id, id) })
      return row ? toUser(row) : undefined
    },
    async getUserByEmail(email) {
      const row = await db.query.users.findFirst({ where: eq(schema.users.email, email) })
      return row ? toUser(row) : undefined
    },
    async getPasswordIdentity(userId) {
      const row = await db.query.authIdentities.findFirst({
        where: and(eq(schema.authIdentities.userId, userId), eq(schema.authIdentities.provider, "password")),
      })
      return row ? toIdentity(row) : undefined
    },
    async listAuthIdentities(userId) {
      const rows = await db.select().from(schema.authIdentities).where(eq(schema.authIdentities.userId, userId))
      return rows.map(toIdentity)
    },
    async getIdentityByProviderSubject(provider, providerSubject) {
      const row = await db.query.authIdentities.findFirst({
        where: and(eq(schema.authIdentities.provider, provider), eq(schema.authIdentities.providerSubject, providerSubject)),
      })
      return row ? toIdentity(row) : undefined
    },
    async createUserWithIdentity(user, identity) {
      await db.transaction(async (tx) => {
        await tx.insert(schema.users).values(toUserInsert(user))
        await tx.insert(schema.authIdentities).values(toIdentityInsert(identity))
      })
    },
    async createIdentity(identity) {
      await db.insert(schema.authIdentities).values(toIdentityInsert(identity))
    },
    async updateUser(user) {
      await db.update(schema.users).set(toUserInsert(user)).where(eq(schema.users.id, user.id))
    },
    async touchUserPresence(userId, seenAt) {
      await db.insert(schema.userPresence)
        .values({ userId, lastSeenAt: seenAt })
        .onConflictDoUpdate({ target: schema.userPresence.userId, set: { lastSeenAt: seenAt } })
    },
    async countActiveUsers(since) {
      const rows = await db.select({ value: count() }).from(schema.userPresence)
        .where(gt(schema.userPresence.lastSeenAt, since))
      return Number(rows[0]?.value ?? 0)
    },
    async updatePasswordIdentity(userId, passwordHash) {
      await db.update(schema.authIdentities)
        .set({ passwordHash })
        .where(and(eq(schema.authIdentities.userId, userId), eq(schema.authIdentities.provider, "password")))
    },
    async revokePreVerificationAccess(userId, revokedAt) {
      await db.transaction(async (tx) => {
        await tx.update(schema.authIdentities)
          .set({ passwordHash: null })
          .where(and(eq(schema.authIdentities.userId, userId), eq(schema.authIdentities.provider, "password")))
        await tx.update(schema.refreshTokens)
          .set({ revokedAt })
          .where(and(eq(schema.refreshTokens.userId, userId), isNull(schema.refreshTokens.revokedAt)))
        await tx.update(schema.authTokens)
          .set({ consumedAt: revokedAt })
          .where(and(eq(schema.authTokens.userId, userId), isNull(schema.authTokens.consumedAt)))
        await tx.update(schema.devices)
          .set({ revokedAt })
          .where(and(eq(schema.devices.userId, userId), isNull(schema.devices.revokedAt)))
        await tx.update(schema.deviceTrusts)
          .set({ revokedAt })
          .where(and(eq(schema.deviceTrusts.userId, userId), isNull(schema.deviceTrusts.revokedAt)))
        await tx.update(schema.secretTransfers)
          .set({ revokedAt })
          .where(and(eq(schema.secretTransfers.userId, userId), isNull(schema.secretTransfers.revokedAt)))
        await tx.update(schema.remoteSessions)
          .set({ status: "closed", closedAt: revokedAt })
          .where(and(eq(schema.remoteSessions.userId, userId), isNull(schema.remoteSessions.closedAt)))
      })
    },
    async deleteAccount(userId, deletedAt) {
      await db.transaction(async (tx) => {
        await tx.update(schema.users)
          .set({ email: deletedEmail(userId), emailVerifiedAt: null, disabledAt: deletedAt })
          .where(eq(schema.users.id, userId))
        await tx.update(schema.authIdentities)
          .set({ passwordHash: null, providerSubject: null })
          .where(eq(schema.authIdentities.userId, userId))
        await tx.update(schema.refreshTokens)
          .set({ revokedAt: deletedAt })
          .where(eq(schema.refreshTokens.userId, userId))
        await tx.update(schema.authTokens)
          .set({ consumedAt: deletedAt })
          .where(eq(schema.authTokens.userId, userId))
        await tx.update(schema.devices)
          .set({ revokedAt: deletedAt })
          .where(eq(schema.devices.userId, userId))
        await tx.update(schema.deviceTrusts)
          .set({ revokedAt: deletedAt })
          .where(eq(schema.deviceTrusts.userId, userId))
        await tx.update(schema.secretTransfers)
          .set({ revokedAt: deletedAt })
          .where(eq(schema.secretTransfers.userId, userId))
        await tx.update(schema.remoteSessions)
          .set({ status: "closed", closedAt: deletedAt })
          .where(eq(schema.remoteSessions.userId, userId))
        await tx.delete(schema.userPresence).where(eq(schema.userPresence.userId, userId))
        await tx.update(schema.deviceLoginFlows)
          .set({ deniedAt: deletedAt })
          .where(eq(schema.deviceLoginFlows.approvedUserId, userId))
      })
    },
    async addAuditLog(log) {
      await db.insert(schema.auditLogs).values(toAuditInsert(log))
    },
    async getRefreshTokenByHash(hash) {
      const row = await db.query.refreshTokens.findFirst({ where: eq(schema.refreshTokens.tokenHash, hash) })
      return row ? toRefresh(row) : undefined
    },
    async createRefreshToken(record) {
      await db.insert(schema.refreshTokens).values(toRefreshInsert(record))
    },
    async updateRefreshToken(record) {
      await db.update(schema.refreshTokens).set(toRefreshInsert(record)).where(eq(schema.refreshTokens.id, record.id))
    },
    async rotateRefreshToken(current, next, revokedAt) {
      return await db.transaction(async (tx) => {
        const updated = await tx.update(schema.refreshTokens)
          .set({ revokedAt, replacedByTokenId: next.id })
          .where(and(
            eq(schema.refreshTokens.id, current.id),
            isNull(schema.refreshTokens.revokedAt),
            gt(schema.refreshTokens.expiresAt, revokedAt),
          ))
          .returning({ id: schema.refreshTokens.id })
        if (!updated[0]) return false
        await tx.insert(schema.refreshTokens).values(toRefreshInsert(next))
        return true
      })
    },
    async revokeRefreshTokenFamily(userId, familyId, revokedAt, reuseDetectedAt) {
      await db.update(schema.refreshTokens)
        .set({ revokedAt, reuseDetectedAt: reuseDetectedAt ?? null })
        .where(and(eq(schema.refreshTokens.userId, userId), eq(schema.refreshTokens.familyId, familyId)))
    },
    async revokeRefreshTokenByHash(hash, revokedAt) {
      await db.update(schema.refreshTokens).set({ revokedAt }).where(eq(schema.refreshTokens.tokenHash, hash))
    },
    async revokeUserRefreshTokens(userId, revokedAt) {
      await db.update(schema.refreshTokens).set({ revokedAt }).where(eq(schema.refreshTokens.userId, userId))
    },
    async listUserRefreshTokens(userId) {
      const rows = await db.select().from(schema.refreshTokens).where(eq(schema.refreshTokens.userId, userId))
      return rows.map(toRefresh)
    },
    async createAuthToken(record) {
      await db.insert(schema.authTokens).values(toAuthTokenInsert(record))
    },
    async getAuthTokenByHash(hash, purpose) {
      const row = await db.query.authTokens.findFirst({
        where: and(eq(schema.authTokens.tokenHash, hash), eq(schema.authTokens.purpose, purpose)),
      })
      return row ? toAuthToken(row) : undefined
    },
    async consumeAuthToken(id, consumedAt) {
      const updated = await db.update(schema.authTokens)
        .set({ consumedAt })
        .where(and(eq(schema.authTokens.id, id), isNull(schema.authTokens.consumedAt), gt(schema.authTokens.expiresAt, consumedAt)))
        .returning({ id: schema.authTokens.id })
      return !!updated[0]
    },
    async consumeUserAuthTokens(userId, purpose, consumedAt) {
      await db.update(schema.authTokens)
        .set({ consumedAt })
        .where(and(eq(schema.authTokens.userId, userId), eq(schema.authTokens.purpose, purpose), isNull(schema.authTokens.consumedAt)))
    },
    async createDeviceLoginFlow(record) {
      await db.insert(schema.deviceLoginFlows).values(toDeviceLoginFlowInsert(record))
    },
    async getDeviceLoginFlowByUserCodeHash(hash) {
      const row = await db.query.deviceLoginFlows.findFirst({ where: eq(schema.deviceLoginFlows.userCodeHash, hash) })
      return row ? toDeviceLoginFlow(row) : undefined
    },
    async approveDeviceLoginFlow(id, userId, approvedAt) {
      const updated = await db.update(schema.deviceLoginFlows)
        .set({ approvedUserId: userId, approvedAt })
        .where(and(
          eq(schema.deviceLoginFlows.id, id),
          isNull(schema.deviceLoginFlows.approvedAt),
          isNull(schema.deviceLoginFlows.deniedAt),
          isNull(schema.deviceLoginFlows.consumedAt),
          gt(schema.deviceLoginFlows.expiresAt, approvedAt),
        ))
        .returning({ id: schema.deviceLoginFlows.id })
      return !!updated[0]
    },
    async denyDeviceLoginFlow(id, deniedAt) {
      const updated = await db.update(schema.deviceLoginFlows)
        .set({ deniedAt })
        .where(and(
          eq(schema.deviceLoginFlows.id, id),
          isNull(schema.deviceLoginFlows.approvedAt),
          isNull(schema.deviceLoginFlows.deniedAt),
          isNull(schema.deviceLoginFlows.consumedAt),
          gt(schema.deviceLoginFlows.expiresAt, deniedAt),
        ))
        .returning({ id: schema.deviceLoginFlows.id })
      return !!updated[0]
    },
    async consumeDeviceLoginFlowByDeviceCodeHash(hash, consumedAt) {
      const updated = await db.update(schema.deviceLoginFlows)
        .set({ consumedAt, lastPolledAt: consumedAt })
        .where(and(
          eq(schema.deviceLoginFlows.deviceCodeHash, hash),
          isNull(schema.deviceLoginFlows.consumedAt),
          isNull(schema.deviceLoginFlows.deniedAt),
          gt(schema.deviceLoginFlows.expiresAt, consumedAt),
          isNotNull(schema.deviceLoginFlows.approvedUserId),
        ))
        .returning()
      if (updated[0]) return { status: "approved", flow: toDeviceLoginFlow(updated[0]) }

      const row = await db.query.deviceLoginFlows.findFirst({ where: eq(schema.deviceLoginFlows.deviceCodeHash, hash) })
      if (!row) return { status: "not_found" }
      await db.update(schema.deviceLoginFlows).set({ lastPolledAt: consumedAt }).where(eq(schema.deviceLoginFlows.id, row.id))
      const flow = toDeviceLoginFlow(row)
      if (flow.consumedAt) return { status: "consumed" }
      if (flow.deniedAt) return { status: "denied" }
      if (flow.expiresAt <= consumedAt) return { status: "expired" }
      return { status: "pending" }
    },
    async getDevice(userId, id) {
      const row = await db.query.devices.findFirst({ where: and(eq(schema.devices.userId, userId), eq(schema.devices.id, id)) })
      return row ? toDevice(row) : undefined
    },
    async findActiveDeviceByFingerprint(fingerprint) {
      const row = await db.query.devices.findFirst({
        where: and(eq(schema.devices.signingKeyFingerprint, fingerprint), isNull(schema.devices.revokedAt)),
      })
      return row ? toDevice(row) : undefined
    },
    async listDevices(userId) {
      const rows = await db.select().from(schema.devices).where(eq(schema.devices.userId, userId))
      return rows.map(toDevice)
    },
    async createDevice(device) {
      await db.insert(schema.devices).values(toDeviceInsert(device))
    },
    async updateDevice(device) {
      await db.update(schema.devices).set(toDeviceInsert(device)).where(eq(schema.devices.id, device.id))
    },
    async revokeDeviceAndTrusts(userId, deviceId, revokedAt) {
      await db.transaction(async (tx) => {
        await tx.update(schema.devices).set({ revokedAt }).where(and(eq(schema.devices.userId, userId), eq(schema.devices.id, deviceId)))
        await tx.update(schema.deviceTrusts).set({ revokedAt }).where(and(
          eq(schema.deviceTrusts.userId, userId),
          or(eq(schema.deviceTrusts.sourceDeviceId, deviceId), eq(schema.deviceTrusts.targetDeviceId, deviceId)),
        ))
      })
    },
    async createTrust(trust) {
      await db.insert(schema.deviceTrusts).values(toTrustInsert(trust))
    },
    async revokeTrusts(userId, sourceDeviceId, targetDeviceId, revokedAt) {
      await db.update(schema.deviceTrusts).set({ revokedAt }).where(and(
        eq(schema.deviceTrusts.userId, userId),
        eq(schema.deviceTrusts.sourceDeviceId, sourceDeviceId),
        eq(schema.deviceTrusts.targetDeviceId, targetDeviceId),
      ))
    },
    async listActiveTrusts(userId) {
      const rows = await db.select().from(schema.deviceTrusts).where(and(eq(schema.deviceTrusts.userId, userId), isNull(schema.deviceTrusts.revokedAt)))
      return rows.map(toTrust)
    },
    async hasTrust(userId, sourceDeviceId, targetDeviceId, scope) {
      const row = await db.query.deviceTrusts.findFirst({
        where: and(
          eq(schema.deviceTrusts.userId, userId),
          eq(schema.deviceTrusts.sourceDeviceId, sourceDeviceId),
          eq(schema.deviceTrusts.targetDeviceId, targetDeviceId),
          isNull(schema.deviceTrusts.revokedAt),
          or(eq(schema.deviceTrusts.scope, "all"), eq(schema.deviceTrusts.scope, scope)),
        ),
      })
      return !!row
    },
    async createSecretTransfer(transfer) {
      await db.insert(schema.secretTransfers).values(toSecretInsert(transfer))
    },
    async listSecretInbox(userId, recipientDeviceId, at) {
      const where = recipientDeviceId
        ? and(
          eq(schema.secretTransfers.userId, userId),
          eq(schema.secretTransfers.recipientDeviceId, recipientDeviceId),
          isNull(schema.secretTransfers.revokedAt),
          isNull(schema.secretTransfers.claimedAt),
          gt(schema.secretTransfers.expiresAt, at),
        )
        : and(
          eq(schema.secretTransfers.userId, userId),
          isNull(schema.secretTransfers.revokedAt),
          isNull(schema.secretTransfers.claimedAt),
          gt(schema.secretTransfers.expiresAt, at),
        )
      const rows = await db.select().from(schema.secretTransfers).where(where)
      return rows.map(toSecret)
    },
    async getSecretTransfer(userId, id) {
      const row = await db.query.secretTransfers.findFirst({ where: and(eq(schema.secretTransfers.userId, userId), eq(schema.secretTransfers.id, id)) })
      return row ? toSecret(row) : undefined
    },
    async updateSecretTransfer(transfer) {
      await db.update(schema.secretTransfers).set(toSecretInsert(transfer)).where(eq(schema.secretTransfers.id, transfer.id))
    },
    async claimSecretTransfer(userId, id, recipientDeviceId, claimedAt) {
      return await db.transaction(async (tx) => {
        const [row] = await tx.select().from(schema.secretTransfers)
          .where(and(
            eq(schema.secretTransfers.userId, userId),
            eq(schema.secretTransfers.id, id),
            eq(schema.secretTransfers.recipientDeviceId, recipientDeviceId),
          ))
          .for("update")
        if (!row) return { status: "not_found" as const }
        if (row.revokedAt) return { status: "revoked" as const }
        if (row.claimedAt) return { status: "already_claimed" as const }
        if (row.expiresAt <= claimedAt) return { status: "expired" as const }
        await tx.update(schema.secretTransfers)
          .set({ claimedAt, ciphertext: "" })
          .where(eq(schema.secretTransfers.id, id))
        return { status: "claimed" as const, transfer: toSecret({ ...row, claimedAt }) }
      })
    },
    async purgeSecretCiphertexts(at) {
      await db.update(schema.secretTransfers)
        .set({ ciphertext: "" })
        .where(and(
          ne(schema.secretTransfers.ciphertext, ""),
          or(isNotNull(schema.secretTransfers.claimedAt), isNotNull(schema.secretTransfers.revokedAt), lte(schema.secretTransfers.expiresAt, at)),
        ))
    },
    async createRemoteSession(session) {
      await db.insert(schema.remoteSessions).values(toRemoteInsert(session))
    },
    async countOpenRemoteSessions(userId, desktopDeviceId, at) {
      const rows = await db.select({ id: schema.remoteSessions.id }).from(schema.remoteSessions).where(and(
        eq(schema.remoteSessions.userId, userId),
        eq(schema.remoteSessions.desktopDeviceId, desktopDeviceId),
        gt(schema.remoteSessions.expiresAt, at),
        or(eq(schema.remoteSessions.status, "available"), eq(schema.remoteSessions.status, "accepted")),
      ))
      return rows.length
    },
    async listAvailableRemoteSessions(userId, at) {
      const rows = await db.select().from(schema.remoteSessions).where(and(
        eq(schema.remoteSessions.userId, userId),
        eq(schema.remoteSessions.status, "available"),
        gt(schema.remoteSessions.expiresAt, at),
      ))
      return rows.map(toRemote)
    },
    async getRemoteSession(userId, id) {
      const row = await db.query.remoteSessions.findFirst({ where: and(eq(schema.remoteSessions.userId, userId), eq(schema.remoteSessions.id, id)) })
      return row ? toRemote(row) : undefined
    },
    async updateRemoteSession(session) {
      await db.update(schema.remoteSessions).set(toRemoteInsert(session)).where(eq(schema.remoteSessions.id, session.id))
    },
    async acceptRemoteSession(userId, id, mobileDeviceId, signedAnswer, resumeTokenHash, at) {
      const updated = await db.update(schema.remoteSessions)
        .set({ status: "accepted", acceptedByDeviceId: mobileDeviceId, signedAnswer, resumeTokenHash, acceptedAt: at, lastHeartbeatAt: at })
        .where(and(
          eq(schema.remoteSessions.userId, userId),
          eq(schema.remoteSessions.id, id),
          eq(schema.remoteSessions.status, "available"),
          gt(schema.remoteSessions.expiresAt, at),
        ))
        .returning()
      if (updated[0]) return { status: "accepted", session: toRemote(updated[0]) }

      const existing = await this.getRemoteSession(userId, id)
      if (!existing) return { status: "not_found" }
      if (existing.expiresAt <= at || existing.status === "expired") {
        await db.update(schema.remoteSessions)
          .set({ status: "expired", closedAt: at })
          .where(and(eq(schema.remoteSessions.userId, userId), eq(schema.remoteSessions.id, id)))
        return { status: "expired" }
      }
      return { status: "not_available" }
    },
    async markExpiredRemoteSessions(at) {
      await db.update(schema.remoteSessions).set({ status: "expired", closedAt: at }).where(and(
        ne(schema.remoteSessions.status, "closed"),
        lte(schema.remoteSessions.expiresAt, at),
      ))
    },
    async createFeedbackReport(report) {
      await db.insert(schema.feedbackReports).values(toFeedbackReportInsert(report))
    },
  }
}

function toUser(row: typeof schema.users.$inferSelect): User {
  const user: User = { id: row.id, email: row.email, createdAt: row.createdAt }
  if (row.emailVerifiedAt) user.emailVerifiedAt = row.emailVerifiedAt
  if (row.disabledAt) user.disabledAt = row.disabledAt
  if (row.tokensValidAfter) user.tokensValidAfter = row.tokensValidAfter
  return user
}

function toUserInsert(user: User): typeof schema.users.$inferInsert {
  return {
    id: user.id,
    email: user.email,
    emailVerifiedAt: user.emailVerifiedAt ?? null,
    createdAt: user.createdAt,
    disabledAt: user.disabledAt ?? null,
    tokensValidAfter: user.tokensValidAfter ?? null,
  }
}

function toIdentity(row: typeof schema.authIdentities.$inferSelect): AuthIdentity {
  const identity: AuthIdentity = {
    id: row.id,
    userId: row.userId,
    provider: row.provider as AuthIdentity["provider"],
    createdAt: row.createdAt,
  }
  if (row.providerSubject) identity.providerSubject = row.providerSubject
  if (row.passwordHash) identity.passwordHash = row.passwordHash
  return identity
}

function toIdentityInsert(identity: AuthIdentity): typeof schema.authIdentities.$inferInsert {
  return {
    id: identity.id,
    userId: identity.userId,
    provider: identity.provider,
    providerSubject: identity.providerSubject ?? null,
    passwordHash: identity.passwordHash ?? null,
    createdAt: identity.createdAt,
  }
}

function toAuditInsert(log: AuditLog): typeof schema.auditLogs.$inferInsert {
  return {
    id: log.id,
    userId: log.userId ?? null,
    deviceId: log.deviceId ?? null,
    event: log.event,
    metadataJson: log.metadataJson,
    ipHash: log.ipHash ?? null,
    createdAt: log.createdAt,
  }
}

function toRefresh(row: typeof schema.refreshTokens.$inferSelect): RefreshTokenRecord {
  const record: RefreshTokenRecord = {
    id: row.id,
    userId: row.userId,
    tokenHash: row.tokenHash,
    familyId: row.familyId,
    expiresAt: row.expiresAt,
    createdAt: row.createdAt,
  }
  if (row.deviceId) record.deviceId = row.deviceId
  if (row.revokedAt) record.revokedAt = row.revokedAt
  if (row.replacedByTokenId) record.replacedByTokenId = row.replacedByTokenId
  if (row.reuseDetectedAt) record.reuseDetectedAt = row.reuseDetectedAt
  return record
}

function toRefreshInsert(record: RefreshTokenRecord): typeof schema.refreshTokens.$inferInsert {
  return {
    id: record.id,
    userId: record.userId,
    deviceId: record.deviceId ?? null,
    tokenHash: record.tokenHash,
    familyId: record.familyId,
    expiresAt: record.expiresAt,
    revokedAt: record.revokedAt ?? null,
    replacedByTokenId: record.replacedByTokenId ?? null,
    reuseDetectedAt: record.reuseDetectedAt ?? null,
    createdAt: record.createdAt,
  }
}

function toAuthToken(row: typeof schema.authTokens.$inferSelect): AuthTokenRecord {
  const token: AuthTokenRecord = {
    id: row.id,
    userId: row.userId,
    purpose: row.purpose as AuthTokenPurpose,
    tokenHash: row.tokenHash,
    expiresAt: row.expiresAt,
    createdAt: row.createdAt,
  }
  if (row.consumedAt) token.consumedAt = row.consumedAt
  return token
}

function toAuthTokenInsert(record: AuthTokenRecord): typeof schema.authTokens.$inferInsert {
  return {
    id: record.id,
    userId: record.userId,
    purpose: record.purpose,
    tokenHash: record.tokenHash,
    expiresAt: record.expiresAt,
    consumedAt: record.consumedAt ?? null,
    createdAt: record.createdAt,
  }
}

function toDeviceLoginFlow(row: typeof schema.deviceLoginFlows.$inferSelect): DeviceLoginFlow {
  const flow: DeviceLoginFlow = {
    id: row.id,
    deviceCodeHash: row.deviceCodeHash,
    userCodeHash: row.userCodeHash,
    clientName: row.clientName,
    platform: "cli",
    expiresAt: row.expiresAt,
    createdAt: row.createdAt,
  }
  if (row.approvedUserId) flow.approvedUserId = row.approvedUserId
  if (row.approvedAt) flow.approvedAt = row.approvedAt
  if (row.deniedAt) flow.deniedAt = row.deniedAt
  if (row.consumedAt) flow.consumedAt = row.consumedAt
  if (row.lastPolledAt) flow.lastPolledAt = row.lastPolledAt
  if (row.requesterNetwork) flow.requesterNetwork = row.requesterNetwork
  if (row.requesterCountry) flow.requesterCountry = row.requesterCountry
  return flow
}

function toDeviceLoginFlowInsert(record: DeviceLoginFlow): typeof schema.deviceLoginFlows.$inferInsert {
  return {
    id: record.id,
    deviceCodeHash: record.deviceCodeHash,
    userCodeHash: record.userCodeHash,
    clientName: record.clientName,
    platform: record.platform,
    expiresAt: record.expiresAt,
    approvedUserId: record.approvedUserId ?? null,
    approvedAt: record.approvedAt ?? null,
    deniedAt: record.deniedAt ?? null,
    consumedAt: record.consumedAt ?? null,
    lastPolledAt: record.lastPolledAt ?? null,
    requesterNetwork: record.requesterNetwork ?? null,
    requesterCountry: record.requesterCountry ?? null,
    createdAt: record.createdAt,
  }
}

function toDevice(row: typeof schema.devices.$inferSelect): Device {
  const device: Device = {
    id: row.id,
    userId: row.userId,
    name: row.name,
    platform: row.platform,
    encryptionPublicKey: row.encryptionPublicKey,
    signingPublicKey: row.signingPublicKey,
    signingKeyFingerprint: row.signingKeyFingerprint,
    lastSeenAt: row.lastSeenAt,
    createdAt: row.createdAt,
  }
  if (row.registrationChallenge) device.registrationChallenge = row.registrationChallenge
  if (row.registrationChallengeExpiresAt) device.registrationChallengeExpiresAt = row.registrationChallengeExpiresAt
  if (row.verifiedAt) device.verifiedAt = row.verifiedAt
  if (row.revokedAt) device.revokedAt = row.revokedAt
  return device
}

function toDeviceInsert(device: Device): typeof schema.devices.$inferInsert {
  return {
    id: device.id,
    userId: device.userId,
    name: device.name,
    platform: device.platform,
    encryptionPublicKey: device.encryptionPublicKey,
    signingPublicKey: device.signingPublicKey,
    signingKeyFingerprint: device.signingKeyFingerprint,
    registrationChallenge: device.registrationChallenge ?? null,
    registrationChallengeExpiresAt: device.registrationChallengeExpiresAt ?? null,
    verifiedAt: device.verifiedAt ?? null,
    lastSeenAt: device.lastSeenAt,
    revokedAt: device.revokedAt ?? null,
    createdAt: device.createdAt,
  }
}

function toTrust(row: typeof schema.deviceTrusts.$inferSelect): DeviceTrust {
  const trust: DeviceTrust = {
    id: row.id,
    userId: row.userId,
    sourceDeviceId: row.sourceDeviceId,
    targetDeviceId: row.targetDeviceId,
    scope: row.scope,
    createdAt: row.createdAt,
  }
  if (row.revokedAt) trust.revokedAt = row.revokedAt
  return trust
}

function toTrustInsert(trust: DeviceTrust): typeof schema.deviceTrusts.$inferInsert {
  return {
    id: trust.id,
    userId: trust.userId,
    sourceDeviceId: trust.sourceDeviceId,
    targetDeviceId: trust.targetDeviceId,
    scope: trust.scope,
    createdAt: trust.createdAt,
    revokedAt: trust.revokedAt ?? null,
  }
}

function toSecret(row: typeof schema.secretTransfers.$inferSelect): SecretTransfer {
  const transfer: SecretTransfer = {
    id: row.id,
    userId: row.userId,
    senderDeviceId: row.senderDeviceId,
    recipientDeviceId: row.recipientDeviceId,
    provider: row.provider,
    envelopeVersion: Number(row.envelopeVersion),
    ciphertext: row.ciphertext,
    nonce: row.nonce,
    algorithm: row.algorithm,
    recipientKeyFingerprint: row.recipientKeyFingerprint,
    senderKeyFingerprint: row.senderKeyFingerprint,
    senderSignature: row.senderSignature,
    expiresAt: row.expiresAt,
    createdAt: row.createdAt,
  }
  if (row.claimedAt) transfer.claimedAt = row.claimedAt
  if (row.revokedAt) transfer.revokedAt = row.revokedAt
  return transfer
}

function toSecretInsert(transfer: SecretTransfer): typeof schema.secretTransfers.$inferInsert {
  return {
    id: transfer.id,
    userId: transfer.userId,
    senderDeviceId: transfer.senderDeviceId,
    recipientDeviceId: transfer.recipientDeviceId,
    provider: transfer.provider,
    envelopeVersion: String(transfer.envelopeVersion),
    ciphertext: transfer.ciphertext,
    nonce: transfer.nonce,
    algorithm: transfer.algorithm,
    recipientKeyFingerprint: transfer.recipientKeyFingerprint,
    senderKeyFingerprint: transfer.senderKeyFingerprint,
    senderSignature: transfer.senderSignature,
    expiresAt: transfer.expiresAt,
    claimedAt: transfer.claimedAt ?? null,
    revokedAt: transfer.revokedAt ?? null,
    createdAt: transfer.createdAt,
  }
}

function toRemote(row: typeof schema.remoteSessions.$inferSelect): RemoteSession {
  const session: RemoteSession = {
    id: row.id,
    userId: row.userId,
    desktopDeviceId: row.desktopDeviceId,
    protocolVersion: row.protocolVersion,
    status: row.status,
    connectionMode: row.connectionMode,
    signedOffer: row.signedOffer,
    lastSequence: row.lastSequence,
    maxIdleSeconds: row.maxIdleSeconds,
    expiresAt: row.expiresAt,
    lastHeartbeatAt: row.lastHeartbeatAt,
    createdAt: row.createdAt,
  }
  if (row.acceptedByDeviceId) session.acceptedByDeviceId = row.acceptedByDeviceId
  if (row.signedAnswer) session.signedAnswer = row.signedAnswer
  if (row.resumeTokenHash) session.resumeTokenHash = row.resumeTokenHash
  if (row.acceptedAt) session.acceptedAt = row.acceptedAt
  if (row.closedAt) session.closedAt = row.closedAt
  return session
}

function toRemoteInsert(session: RemoteSession): typeof schema.remoteSessions.$inferInsert {
  return {
    id: session.id,
    userId: session.userId,
    desktopDeviceId: session.desktopDeviceId,
    protocolVersion: session.protocolVersion,
    status: session.status,
    connectionMode: session.connectionMode,
    signedOffer: session.signedOffer,
    acceptedByDeviceId: session.acceptedByDeviceId ?? null,
    signedAnswer: session.signedAnswer ?? null,
    resumeTokenHash: session.resumeTokenHash ?? null,
    lastSequence: session.lastSequence,
    maxIdleSeconds: session.maxIdleSeconds,
    expiresAt: session.expiresAt,
    lastHeartbeatAt: session.lastHeartbeatAt,
    createdAt: session.createdAt,
    acceptedAt: session.acceptedAt ?? null,
    closedAt: session.closedAt ?? null,
  }
}

function toFeedbackReportInsert(report: FeedbackReport): typeof schema.feedbackReports.$inferInsert {
  return {
    id: report.id,
    userId: report.userId,
    reason: report.reason,
    note: report.note ?? null,
    userMessage: report.userMessage ?? null,
    assistantMessage: report.assistantMessage,
    provider: report.provider ?? null,
    model: report.model ?? null,
    appVersion: report.appVersion ?? null,
    platform: report.platform,
    toolSummaryJson: report.toolSummaryJson,
    metadataJson: report.metadataJson,
    createdAt: report.createdAt,
  }
}
