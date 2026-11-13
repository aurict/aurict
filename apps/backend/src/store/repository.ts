import type {
  AuditLog,
  BackendStore,
  Device,
  DeviceTrust,
  RefreshTokenRecord,
  RemoteSession,
  SecretTransfer,
  TrustScope,
  User,
  AuthIdentity,
  AuthTokenRecord,
  AuthTokenPurpose,
  DeviceLoginFlow,
  FeedbackReport,
} from "./types"

export type BackendRepository = {
  getUser(id: string): Promise<User | undefined>
  getUserByEmail(email: string): Promise<User | undefined>
  getPasswordIdentity(userId: string): Promise<AuthIdentity | undefined>
  listAuthIdentities(userId: string): Promise<AuthIdentity[]>
  getIdentityByProviderSubject(provider: AuthIdentity["provider"], providerSubject: string): Promise<AuthIdentity | undefined>
  createUserWithIdentity(user: User, identity: AuthIdentity): Promise<void>
  createIdentity(identity: AuthIdentity): Promise<void>
  updateUser(user: User): Promise<void>
  updatePasswordIdentity(userId: string, passwordHash: string): Promise<void>
  deleteAccount(userId: string, deletedAt: Date): Promise<void>
  // Drops every credential and session created before the email was proven (password, refresh
  // tokens, pending action tokens, devices, trusts, transfers, remote sessions). Used when a
  // verified provider claims an unverified account, so a squatter who registered first loses access.
  revokePreVerificationAccess(userId: string, revokedAt: Date): Promise<void>
  touchUserPresence(userId: string, seenAt: Date): Promise<void>
  countActiveUsers(since: Date): Promise<number>

  addAuditLog(log: AuditLog): Promise<void>

  getRefreshTokenByHash(hash: string): Promise<RefreshTokenRecord | undefined>
  createRefreshToken(record: RefreshTokenRecord): Promise<void>
  updateRefreshToken(record: RefreshTokenRecord): Promise<void>
  rotateRefreshToken(current: RefreshTokenRecord, next: RefreshTokenRecord, revokedAt: Date): Promise<boolean>
  revokeRefreshTokenFamily(userId: string, familyId: string, revokedAt: Date, reuseDetectedAt?: Date): Promise<void>
  revokeRefreshTokenByHash(hash: string, revokedAt: Date): Promise<void>
  revokeUserRefreshTokens(userId: string, revokedAt: Date): Promise<void>
  listUserRefreshTokens(userId: string): Promise<RefreshTokenRecord[]>

  createAuthToken(record: AuthTokenRecord): Promise<void>
  getAuthTokenByHash(hash: string, purpose: AuthTokenPurpose): Promise<AuthTokenRecord | undefined>
  consumeAuthToken(id: string, consumedAt: Date): Promise<boolean>
  /** Marks every still-unused token of this purpose for the user as consumed. */
  consumeUserAuthTokens(userId: string, purpose: AuthTokenPurpose, consumedAt: Date): Promise<void>

  createDeviceLoginFlow(record: DeviceLoginFlow): Promise<void>
  getDeviceLoginFlowByUserCodeHash(hash: string): Promise<DeviceLoginFlow | undefined>
  approveDeviceLoginFlow(id: string, userId: string, approvedAt: Date): Promise<boolean>
  denyDeviceLoginFlow(id: string, deniedAt: Date): Promise<boolean>
  consumeDeviceLoginFlowByDeviceCodeHash(hash: string, consumedAt: Date): Promise<DeviceLoginPollResult>

  getDevice(userId: string, id: string): Promise<Device | undefined>
  findActiveDeviceByFingerprint(fingerprint: string): Promise<Device | undefined>
  listDevices(userId: string): Promise<Device[]>
  createDevice(device: Device): Promise<void>
  updateDevice(device: Device): Promise<void>
  revokeDeviceAndTrusts(userId: string, deviceId: string, revokedAt: Date): Promise<void>

  createTrust(trust: DeviceTrust): Promise<void>
  revokeTrusts(userId: string, sourceDeviceId: string, targetDeviceId: string, revokedAt: Date): Promise<void>
  listActiveTrusts(userId: string): Promise<DeviceTrust[]>
  hasTrust(userId: string, sourceDeviceId: string, targetDeviceId: string, scope: TrustScope): Promise<boolean>

  createSecretTransfer(transfer: SecretTransfer): Promise<void>
  listSecretInbox(userId: string, recipientDeviceId: string | undefined, at: Date): Promise<SecretTransfer[]>
  getSecretTransfer(userId: string, id: string): Promise<SecretTransfer | undefined>
  updateSecretTransfer(transfer: SecretTransfer): Promise<void>
  /** Atomically marks the transfer claimed by its recipient and wipes the stored ciphertext; the result carries it once. */
  claimSecretTransfer(userId: string, id: string, recipientDeviceId: string, claimedAt: Date): Promise<SecretClaimResult>
  /** Wipes ciphertext of transfers that were claimed, revoked or expired. */
  purgeSecretCiphertexts(at: Date): Promise<void>

  createRemoteSession(session: RemoteSession): Promise<void>
  countOpenRemoteSessions(userId: string, desktopDeviceId: string, at: Date): Promise<number>
  listAvailableRemoteSessions(userId: string, at: Date): Promise<RemoteSession[]>
  getRemoteSession(userId: string, id: string): Promise<RemoteSession | undefined>
  updateRemoteSession(session: RemoteSession): Promise<void>
  acceptRemoteSession(userId: string, id: string, mobileDeviceId: string, signedAnswer: string, resumeTokenHash: string, at: Date): Promise<RemoteAcceptResult>
  markExpiredRemoteSessions(at: Date): Promise<void>

  createFeedbackReport(report: FeedbackReport): Promise<void>
  /** Deletes feedback reports created before `before` (they can contain conversation text). */
  purgeFeedbackReports(before: Date): Promise<void>
}

export type SecretClaimResult =
  | { status: "claimed"; transfer: SecretTransfer }
  | { status: "not_found" | "revoked" | "already_claimed" | "expired" }

export type RemoteAcceptResult =
  | { status: "accepted"; session: RemoteSession }
  | { status: "not_found" | "expired" | "not_available" }

export type DeviceLoginPollResult =
  | { status: "approved"; flow: DeviceLoginFlow }
  | { status: "not_found" | "pending" | "denied" | "expired" | "consumed" }

export function createMemoryRepository(store: BackendStore): BackendRepository {
  return {
    async getUser(id) {
      return store.users.get(id)
    },
    async getUserByEmail(email) {
      const id = store.usersByEmail.get(email)
      return id ? store.users.get(id) : undefined
    },
    async getPasswordIdentity(userId) {
      return [...store.identities.values()].find((identity) => identity.userId === userId && identity.provider === "password")
    },
    async listAuthIdentities(userId) {
      return [...store.identities.values()].filter((identity) => identity.userId === userId)
    },
    async getIdentityByProviderSubject(provider, providerSubject) {
      return [...store.identities.values()].find((identity) =>
        identity.provider === provider && identity.providerSubject === providerSubject,
      )
    },
    async createUserWithIdentity(user, identity) {
      store.users.set(user.id, user)
      store.usersByEmail.set(user.email, user.id)
      store.identities.set(identity.id, identity)
    },
    async createIdentity(identity) {
      store.identities.set(identity.id, identity)
    },
    async updateUser(user) {
      store.users.set(user.id, user)
      store.usersByEmail.set(user.email, user.id)
    },
    async touchUserPresence(userId, seenAt) {
      store.userPresence.set(userId, seenAt)
    },
    async countActiveUsers(since) {
      let active = 0
      for (const seenAt of store.userPresence.values()) if (seenAt > since) active++
      return active
    },
    async updatePasswordIdentity(userId, passwordHash) {
      const identity = [...store.identities.values()].find((candidate) =>
        candidate.userId === userId && candidate.provider === "password",
      )
      if (identity) identity.passwordHash = passwordHash
    },
    async revokePreVerificationAccess(userId, revokedAt) {
      for (const identity of store.identities.values()) {
        if (identity.userId === userId && identity.provider === "password") delete identity.passwordHash
      }
      for (const token of store.refreshTokens.values()) {
        if (token.userId === userId) token.revokedAt ??= revokedAt
      }
      for (const token of store.authTokens.values()) {
        if (token.userId === userId) token.consumedAt ??= revokedAt
      }
      for (const device of store.devices.values()) {
        if (device.userId === userId) device.revokedAt ??= revokedAt
      }
      for (const trust of store.trusts.values()) {
        if (trust.userId === userId) trust.revokedAt ??= revokedAt
      }
      for (const transfer of store.secretTransfers.values()) {
        if (transfer.userId === userId) transfer.revokedAt ??= revokedAt
      }
      for (const session of store.remoteSessions.values()) {
        if (session.userId !== userId || session.closedAt) continue
        session.status = "closed"
        session.closedAt = revokedAt
      }
    },
    async deleteAccount(userId, deletedAt) {
      const user = store.users.get(userId)
      if (!user) return
      store.usersByEmail.delete(user.email)
      store.userPresence.delete(userId)
      user.email = deletedEmail(userId)
      user.disabledAt = deletedAt
      delete user.emailVerifiedAt
      store.usersByEmail.set(user.email, user.id)
      for (const identity of store.identities.values()) {
        if (identity.userId !== userId) continue
        delete identity.passwordHash
        delete identity.providerSubject
      }
      for (const token of store.refreshTokens.values()) {
        if (token.userId === userId) token.revokedAt = deletedAt
      }
      for (const token of store.authTokens.values()) {
        if (token.userId === userId) token.consumedAt = deletedAt
      }
      for (const device of store.devices.values()) {
        if (device.userId === userId) device.revokedAt = deletedAt
      }
      for (const trust of store.trusts.values()) {
        if (trust.userId === userId) trust.revokedAt = deletedAt
      }
      for (const transfer of store.secretTransfers.values()) {
        if (transfer.userId === userId) transfer.revokedAt = deletedAt
      }
      for (const session of store.remoteSessions.values()) {
        if (session.userId !== userId) continue
        session.status = "closed"
        session.closedAt = deletedAt
      }
      for (const flow of store.deviceLoginFlows.values()) {
        if (flow.approvedUserId === userId) flow.deniedAt = deletedAt
      }
    },
    async addAuditLog(log) {
      store.auditLogs.push(log)
    },
    async getRefreshTokenByHash(hash) {
      const id = store.refreshTokensByHash.get(hash)
      return id ? store.refreshTokens.get(id) : undefined
    },
    async createRefreshToken(record) {
      store.refreshTokens.set(record.id, record)
      store.refreshTokensByHash.set(record.tokenHash, record.id)
    },
    async updateRefreshToken(record) {
      store.refreshTokens.set(record.id, record)
      store.refreshTokensByHash.set(record.tokenHash, record.id)
    },
    async rotateRefreshToken(current, next, revokedAt) {
      const record = store.refreshTokens.get(current.id)
      if (!record || record.revokedAt || record.expiresAt <= revokedAt) return false
      record.revokedAt = revokedAt
      record.replacedByTokenId = next.id
      store.refreshTokens.set(next.id, next)
      store.refreshTokensByHash.set(next.tokenHash, next.id)
      return true
    },
    async revokeRefreshTokenFamily(userId, familyId, revokedAt, reuseDetectedAt) {
      for (const token of store.refreshTokens.values()) {
        if (token.userId === userId && token.familyId === familyId) {
          token.revokedAt = revokedAt
          if (reuseDetectedAt) token.reuseDetectedAt = reuseDetectedAt
        }
      }
    },
    async revokeRefreshTokenByHash(hash, revokedAt) {
      const id = store.refreshTokensByHash.get(hash)
      const record = id ? store.refreshTokens.get(id) : undefined
      if (record) record.revokedAt = revokedAt
    },
    async revokeUserRefreshTokens(userId, revokedAt) {
      for (const token of store.refreshTokens.values()) {
        if (token.userId === userId) token.revokedAt = revokedAt
      }
    },
    async listUserRefreshTokens(userId) {
      return [...store.refreshTokens.values()].filter((token) => token.userId === userId)
    },
    async createAuthToken(record) {
      store.authTokens.set(record.id, record)
      store.authTokensByHash.set(record.tokenHash, record.id)
    },
    async getAuthTokenByHash(hash, purpose) {
      const id = store.authTokensByHash.get(hash)
      const token = id ? store.authTokens.get(id) : undefined
      return token?.purpose === purpose ? token : undefined
    },
    async consumeAuthToken(id, consumedAt) {
      const token = store.authTokens.get(id)
      if (!token || token.consumedAt || token.expiresAt <= consumedAt) return false
      token.consumedAt = consumedAt
      return true
    },
    async consumeUserAuthTokens(userId, purpose, consumedAt) {
      for (const token of store.authTokens.values()) {
        if (token.userId === userId && token.purpose === purpose && !token.consumedAt) token.consumedAt = consumedAt
      }
    },
    async createDeviceLoginFlow(record) {
      store.deviceLoginFlows.set(record.id, record)
      store.deviceLoginFlowsByDeviceCodeHash.set(record.deviceCodeHash, record.id)
      store.deviceLoginFlowsByUserCodeHash.set(record.userCodeHash, record.id)
    },
    async getDeviceLoginFlowByUserCodeHash(hash) {
      const id = store.deviceLoginFlowsByUserCodeHash.get(hash)
      return id ? store.deviceLoginFlows.get(id) : undefined
    },
    async approveDeviceLoginFlow(id, userId, approvedAt) {
      const flow = store.deviceLoginFlows.get(id)
      if (!flow || flow.consumedAt || flow.deniedAt || flow.approvedAt || flow.expiresAt <= approvedAt) return false
      flow.approvedUserId = userId
      flow.approvedAt = approvedAt
      return true
    },
    async denyDeviceLoginFlow(id, deniedAt) {
      const flow = store.deviceLoginFlows.get(id)
      if (!flow || flow.consumedAt || flow.deniedAt || flow.approvedAt || flow.expiresAt <= deniedAt) return false
      flow.deniedAt = deniedAt
      return true
    },
    async consumeDeviceLoginFlowByDeviceCodeHash(hash, consumedAt) {
      const id = store.deviceLoginFlowsByDeviceCodeHash.get(hash)
      const flow = id ? store.deviceLoginFlows.get(id) : undefined
      if (!flow) return { status: "not_found" }
      flow.lastPolledAt = consumedAt
      if (flow.consumedAt) return { status: "consumed" }
      if (flow.deniedAt) return { status: "denied" }
      if (flow.expiresAt <= consumedAt) return { status: "expired" }
      if (!flow.approvedUserId || !flow.approvedAt) return { status: "pending" }
      flow.consumedAt = consumedAt
      return { status: "approved", flow }
    },
    async getDevice(userId, id) {
      const device = store.devices.get(id)
      return device?.userId === userId ? device : undefined
    },
    async findActiveDeviceByFingerprint(fingerprint) {
      return [...store.devices.values()].find((device) => device.signingKeyFingerprint === fingerprint && !device.revokedAt)
    },
    async listDevices(userId) {
      return [...store.devices.values()].filter((device) => device.userId === userId)
    },
    async createDevice(device) {
      store.devices.set(device.id, device)
    },
    async updateDevice(device) {
      store.devices.set(device.id, device)
    },
    async revokeDeviceAndTrusts(userId, deviceId, revokedAt) {
      const device = store.devices.get(deviceId)
      if (device?.userId === userId) device.revokedAt = revokedAt
      for (const trust of store.trusts.values()) {
        if (trust.userId === userId && (trust.sourceDeviceId === deviceId || trust.targetDeviceId === deviceId)) {
          trust.revokedAt = revokedAt
        }
      }
    },
    async createTrust(trust) {
      store.trusts.set(trust.id, trust)
    },
    async revokeTrusts(userId, sourceDeviceId, targetDeviceId, revokedAt) {
      for (const trust of store.trusts.values()) {
        if (trust.userId === userId && trust.sourceDeviceId === sourceDeviceId && trust.targetDeviceId === targetDeviceId) {
          trust.revokedAt = revokedAt
        }
      }
    },
    async listActiveTrusts(userId) {
      return [...store.trusts.values()].filter((trust) => trust.userId === userId && !trust.revokedAt)
    },
    async hasTrust(userId, sourceDeviceId, targetDeviceId, scope) {
      for (const trust of store.trusts.values()) {
        if (
          trust.userId === userId &&
          trust.sourceDeviceId === sourceDeviceId &&
          trust.targetDeviceId === targetDeviceId &&
          !trust.revokedAt &&
          (trust.scope === "all" || trust.scope === scope)
        ) return true
      }
      return false
    },
    async createSecretTransfer(transfer) {
      store.secretTransfers.set(transfer.id, transfer)
    },
    async listSecretInbox(userId, recipientDeviceId, at) {
      return [...store.secretTransfers.values()].filter((transfer) =>
        transfer.userId === userId &&
        (!recipientDeviceId || transfer.recipientDeviceId === recipientDeviceId) &&
        !transfer.revokedAt &&
        !transfer.claimedAt &&
        transfer.expiresAt > at,
      )
    },
    async getSecretTransfer(userId, id) {
      const transfer = store.secretTransfers.get(id)
      return transfer?.userId === userId ? transfer : undefined
    },
    async updateSecretTransfer(transfer) {
      store.secretTransfers.set(transfer.id, transfer)
    },
    async claimSecretTransfer(userId, id, recipientDeviceId, claimedAt) {
      const transfer = store.secretTransfers.get(id)
      if (!transfer || transfer.userId !== userId || transfer.recipientDeviceId !== recipientDeviceId) return { status: "not_found" }
      if (transfer.revokedAt) return { status: "revoked" }
      if (transfer.claimedAt) return { status: "already_claimed" }
      if (transfer.expiresAt <= claimedAt) return { status: "expired" }
      const claimed = { ...transfer, claimedAt }
      store.secretTransfers.set(id, { ...claimed, ciphertext: "" })
      return { status: "claimed", transfer: claimed }
    },
    async purgeSecretCiphertexts(at) {
      for (const transfer of store.secretTransfers.values()) {
        if (transfer.ciphertext && (transfer.claimedAt || transfer.revokedAt || transfer.expiresAt <= at)) transfer.ciphertext = ""
      }
    },
    async createRemoteSession(session) {
      store.remoteSessions.set(session.id, session)
    },
    async countOpenRemoteSessions(userId, desktopDeviceId, at) {
      return [...store.remoteSessions.values()].filter((session) =>
        session.userId === userId &&
        session.desktopDeviceId === desktopDeviceId &&
        session.expiresAt > at &&
        (session.status === "available" || session.status === "accepted"),
      ).length
    },
    async listAvailableRemoteSessions(userId, at) {
      return [...store.remoteSessions.values()].filter((session) =>
        session.userId === userId && session.status === "available" && session.expiresAt > at,
      )
    },
    async getRemoteSession(userId, id) {
      const session = store.remoteSessions.get(id)
      return session?.userId === userId ? session : undefined
    },
    async updateRemoteSession(session) {
      store.remoteSessions.set(session.id, session)
    },
    async acceptRemoteSession(userId, id, mobileDeviceId, signedAnswer, resumeTokenHash, at) {
      const session = store.remoteSessions.get(id)
      if (!session || session.userId !== userId) return { status: "not_found" }
      if (session.expiresAt <= at || session.status === "expired") {
        session.status = "expired"
        session.closedAt ??= at
        return { status: "expired" }
      }
      if (session.status !== "available") return { status: "not_available" }
      session.status = "accepted"
      session.acceptedByDeviceId = mobileDeviceId
      session.signedAnswer = signedAnswer
      session.resumeTokenHash = resumeTokenHash
      session.acceptedAt = at
      session.lastHeartbeatAt = at
      return { status: "accepted", session }
    },
    async markExpiredRemoteSessions(at) {
      for (const session of store.remoteSessions.values()) {
        if (session.status !== "closed" && session.expiresAt <= at) {
          session.status = "expired"
          session.closedAt ??= at
        }
      }
    },
    async purgeFeedbackReports(before) {
      for (const [id, report] of store.feedbackReports) if (report.createdAt < before) store.feedbackReports.delete(id)
    },
    async createFeedbackReport(report) {
      store.feedbackReports.set(report.id, report)
    },
  }
}

export function deletedEmail(userId: string) {
  return `deleted+${userId}@deleted.aurict.local`
}
