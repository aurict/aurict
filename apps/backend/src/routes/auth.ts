import { Hono } from "hono"
import type { Context } from "hono"
import { z } from "zod"
import { verifyFirebaseIdToken } from "../crypto/firebase"
import { addSeconds, newId, now } from "../crypto/ids"
import { hashPassword, verifyPassword } from "../crypto/password"
import { createRefreshToken, refreshTokenHash, signAccessToken } from "../crypto/tokens"
import { requireAuth } from "../middleware/auth"
import { ApiError } from "../middleware/errors"
import { rateLimit } from "../middleware/rate-limit"
import { normalizeEmail } from "../store/policy"
import type { AuditLog, RefreshTokenRecord, User } from "../store/types"
import type { AppBindings } from "../types"

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(10).max(256),
}).strict()

const refreshSchema = z.object({ refreshToken: z.string().min(32) }).strict()
const firebaseAuthSchema = z.object({ idToken: z.string().min(100) }).strict()
const tokenSchema = z.object({ token: z.string().min(32) }).strict()
const deviceLoginStartSchema = z.object({
  clientName: z.string().min(1).max(80).default("Aurict CLI"),
  platform: z.literal("cli").default("cli"),
}).strict()
const deviceLoginPollSchema = z.object({ deviceCode: z.string().min(64).max(512) }).strict()
const deviceLoginUserCodeSchema = z.object({ userCode: z.string().min(6).max(32) }).strict()
const passwordResetConfirmSchema = z.object({
  token: z.string().min(32),
  password: z.string().min(10).max(256),
}).strict()
const deleteAccountSchema = z.object({
  confirmation: z.string().min(1).max(254),
  password: z.string().min(10).max(256).optional(),
  firebaseIdToken: z.string().min(100).max(8192).optional(),
}).strict()
type DeleteAccountBody = z.infer<typeof deleteAccountSchema>

export const authRoutes = new Hono<AppBindings>()
  .post("/auth/register", rateLimit(10, 60_000, "register"), async (c) => {
    const body = authSchema.parse(await c.req.json())
    const email = normalizeEmail(body.email)
    const repo = c.get("repo")
    if (await repo.getUserByEmail(email)) throw new ApiError(409, "Email is already registered.", "email_taken")
    const createdAt = now()
    const user = { id: newId("usr"), email, createdAt }
    await repo.createUserWithIdentity(user, {
      id: newId("aid"),
      userId: user.id,
      provider: "password",
      passwordHash: await hashPassword(body.password),
      createdAt,
    })
    await repo.addAuditLog({ id: newId("aud"), userId: user.id, event: "user.registered", metadataJson: "{}", createdAt })
    return c.json(await authPayload(c, user.id), 201)
  })
  .post("/auth/login", rateLimit(20, 60_000, "login"), async (c) => {
    const body = authSchema.parse(await c.req.json())
    const email = normalizeEmail(body.email)
    const repo = c.get("repo")
    const user = await repo.getUserByEmail(email)
    const identity = user ? await repo.getPasswordIdentity(user.id) : undefined
    if (!user || !identity?.passwordHash || !(await verifyPassword(body.password, identity.passwordHash))) {
      throw new ApiError(401, "Invalid email or password.", "invalid_credentials")
    }
    await repo.addAuditLog({ id: newId("aud"), userId: user.id, event: "auth.login.success", metadataJson: "{}", createdAt: now() })
    return c.json(await authPayload(c, user.id))
  })
  .post("/auth/firebase", rateLimit(30, 60_000, "firebase-login"), async (c) => {
    const body = firebaseAuthSchema.parse(await c.req.json())
    const token = await verifyFirebaseIdToken(body.idToken, c.get("env"))
    const email = normalizeEmail(token.email)
    const repo = c.get("repo")
    const existingIdentity = await repo.getIdentityByProviderSubject("firebase", token.uid)
    if (existingIdentity) {
      const user = await repo.getUser(existingIdentity.userId)
      if (!user || user.disabledAt) throw new ApiError(403, "Account is disabled.", "account_disabled")
      await repo.addAuditLog({
        id: newId("aud"),
        userId: user.id,
        event: "auth.firebase.login.success",
        metadataJson: JSON.stringify({ signInProvider: token.signInProvider ?? "unknown" }),
        createdAt: now(),
      })
      return c.json(await authPayload(c, user.id))
    }

    const user = await repo.getUserByEmail(email)
    if (user) {
      if (user.disabledAt) throw new ApiError(403, "Account is disabled.", "account_disabled")
      if (!token.emailVerified) {
        throw new ApiError(409, "Verified email is required to link this provider.", "verified_email_required")
      }
      if (!user.emailVerifiedAt) {
        user.emailVerifiedAt = now()
        await repo.updateUser(user)
      }
      await repo.createIdentity({
        id: newId("aid"),
        userId: user.id,
        provider: "firebase",
        providerSubject: token.uid,
        createdAt: now(),
      })
      await repo.addAuditLog({
        id: newId("aud"),
        userId: user.id,
        event: "auth.firebase.linked",
        metadataJson: JSON.stringify({ signInProvider: token.signInProvider ?? "unknown" }),
        createdAt: now(),
      })
      return c.json(await authPayload(c, user.id))
    }

    if (!token.emailVerified) {
      throw new ApiError(403, "Verified email is required to create an account.", "verified_email_required")
    }
    const createdAt = now()
    const createdUser = { id: newId("usr"), email, emailVerifiedAt: createdAt, createdAt }
    await repo.createUserWithIdentity(createdUser, {
      id: newId("aid"),
      userId: createdUser.id,
      provider: "firebase",
      providerSubject: token.uid,
      createdAt,
    })
    await repo.addAuditLog({
      id: newId("aud"),
      userId: createdUser.id,
      event: "auth.firebase.registered",
      metadataJson: JSON.stringify({ signInProvider: token.signInProvider ?? "unknown" }),
      createdAt,
    })
    return c.json(await authPayload(c, createdUser.id), 201)
  })
  .post("/auth/device/start", rateLimit(20, 60_000, "device-login-start"), async (c) => {
    const body = deviceLoginStartSchema.parse(await c.req.json())
    const createdAt = now()
    const expiresAt = addSeconds(createdAt, c.get("env").DEVICE_LOGIN_TTL_SECONDS)
    const deviceCode = createDeviceCode()
    const userCode = createUserCode()
    await c.get("repo").createDeviceLoginFlow({
      id: newId("dlf"),
      deviceCodeHash: await refreshTokenHash(deviceCode),
      userCodeHash: await refreshTokenHash(normalizeUserCode(userCode)),
      clientName: body.clientName,
      platform: "cli",
      expiresAt,
      createdAt,
    })
    const verificationUri = c.get("env").DEVICE_LOGIN_VERIFICATION_URI
    await c.get("repo").addAuditLog({
      id: newId("aud"),
      event: "auth.device.started",
      metadataJson: JSON.stringify({ platform: body.platform, clientName: body.clientName }),
      createdAt,
    })
    return c.json({
      ok: true,
      deviceCode,
      userCode,
      verificationUri,
      verificationUriComplete: withUserCode(verificationUri, userCode),
      expiresAt: expiresAt.toISOString(),
      intervalSeconds: c.get("env").DEVICE_LOGIN_POLL_INTERVAL_SECONDS,
    }, 201)
  })
  .post("/auth/device/poll", rateLimit(120, 60_000, "device-login-poll"), async (c) => {
    const body = deviceLoginPollSchema.parse(await c.req.json())
    const result = await c.get("repo").consumeDeviceLoginFlowByDeviceCodeHash(
      await refreshTokenHash(body.deviceCode),
      now(),
    )
    if (result.status === "not_found") throw new ApiError(400, "Device code is invalid.", "invalid_device_code")
    if (result.status === "pending") {
      return c.json({ ok: true, status: "pending", intervalSeconds: c.get("env").DEVICE_LOGIN_POLL_INTERVAL_SECONDS })
    }
    if (result.status === "denied") throw new ApiError(403, "Device login was denied.", "access_denied")
    if (result.status === "expired") throw new ApiError(410, "Device login expired.", "device_login_expired")
    if (result.status === "consumed") throw new ApiError(409, "Device code was already consumed.", "device_code_consumed")
    if (result.status !== "approved") throw new ApiError(500, "Unexpected device login state.", "internal_error")
    if (!result.flow.approvedUserId) throw new ApiError(500, "Approved device login is missing user.", "internal_error")
    await c.get("repo").addAuditLog({
      id: newId("aud"),
      userId: result.flow.approvedUserId,
      event: "auth.device.consumed",
      metadataJson: JSON.stringify({ flowId: result.flow.id, clientName: result.flow.clientName }),
      createdAt: now(),
    })
    return c.json({ ...(await authPayload(c, result.flow.approvedUserId)), status: "approved" })
  })
  .post("/auth/device/approve", requireAuth, rateLimit(30, 60_000, "device-login-approve"), async (c) => {
    const body = deviceLoginUserCodeSchema.parse(await c.req.json())
    const user = c.get("user")!
    const flow = await c.get("repo").getDeviceLoginFlowByUserCodeHash(await refreshTokenHash(normalizeUserCode(body.userCode)))
    if (!flow) throw new ApiError(404, "Device login code not found.", "invalid_user_code")
    const timestamp = now()
    if (flow.expiresAt <= timestamp) throw new ApiError(410, "Device login expired.", "device_login_expired")
    if (flow.deniedAt) throw new ApiError(409, "Device login was already denied.", "device_login_denied")
    if (flow.consumedAt) throw new ApiError(409, "Device login was already consumed.", "device_code_consumed")
    if (flow.approvedAt) throw new ApiError(409, "Device login was already approved.", "device_login_approved")
    const approved = await c.get("repo").approveDeviceLoginFlow(flow.id, user.id, timestamp)
    if (!approved) throw new ApiError(409, "Device login can no longer be approved.", "device_login_unavailable")
    await c.get("repo").addAuditLog({
      id: newId("aud"),
      userId: user.id,
      event: "auth.device.approved",
      metadataJson: JSON.stringify({ flowId: flow.id, clientName: flow.clientName }),
      createdAt: timestamp,
    })
    return c.json({ ok: true, status: "approved", clientName: flow.clientName, expiresAt: flow.expiresAt.toISOString() })
  })
  .post("/auth/device/deny", requireAuth, rateLimit(30, 60_000, "device-login-deny"), async (c) => {
    const body = deviceLoginUserCodeSchema.parse(await c.req.json())
    const user = c.get("user")!
    const flow = await c.get("repo").getDeviceLoginFlowByUserCodeHash(await refreshTokenHash(normalizeUserCode(body.userCode)))
    if (!flow) throw new ApiError(404, "Device login code not found.", "invalid_user_code")
    const timestamp = now()
    if (flow.expiresAt <= timestamp) throw new ApiError(410, "Device login expired.", "device_login_expired")
    if (flow.approvedAt || flow.consumedAt) throw new ApiError(409, "Device login can no longer be denied.", "device_login_unavailable")
    const denied = await c.get("repo").denyDeviceLoginFlow(flow.id, timestamp)
    if (!denied) throw new ApiError(409, "Device login can no longer be denied.", "device_login_unavailable")
    await c.get("repo").addAuditLog({
      id: newId("aud"),
      userId: user.id,
      event: "auth.device.denied",
      metadataJson: JSON.stringify({ flowId: flow.id, clientName: flow.clientName }),
      createdAt: timestamp,
    })
    return c.json({ ok: true, status: "denied" })
  })
  .post("/auth/refresh", rateLimit(60, 60_000, "refresh"), async (c) => {
    const body = refreshSchema.parse(await c.req.json())
    const hash = await refreshTokenHash(body.refreshToken)
    const repo = c.get("repo")
    const record = await repo.getRefreshTokenByHash(hash)
    if (record?.revokedAt) {
      const detectedAt = now()
      await repo.revokeRefreshTokenFamily(record.userId, record.familyId, detectedAt, detectedAt)
      const log: AuditLog = {
        id: newId("aud"),
        userId: record.userId,
        event: "refresh.reuse_detected",
        metadataJson: JSON.stringify({ familyId: record.familyId, tokenId: record.id }),
        createdAt: detectedAt,
      }
      if (record.deviceId) log.deviceId = record.deviceId
      await repo.addAuditLog(log)
      throw new ApiError(401, "Refresh token reuse detected.", "refresh_reuse_detected")
    }
    if (!record || record.expiresAt <= now()) {
      throw new ApiError(401, "Refresh token is invalid.", "invalid_refresh")
    }
    const next = await createRefreshToken(c.get("env").REFRESH_TOKEN_TTL_SECONDS)
    const revokedAt = now()
    const nextRecord: RefreshTokenRecord = {
      id: next.id,
      userId: record.userId,
      tokenHash: next.hash,
      familyId: record.familyId,
      expiresAt: next.expiresAt,
      createdAt: now(),
    }
    if (record.deviceId) nextRecord.deviceId = record.deviceId
    const rotated = await repo.rotateRefreshToken(record, nextRecord, revokedAt)
    if (!rotated) throw new ApiError(401, "Refresh token is invalid.", "invalid_refresh")
    const log: AuditLog = {
      id: newId("aud"),
      userId: record.userId,
      event: "refresh.rotated",
      metadataJson: JSON.stringify({ familyId: record.familyId, tokenId: record.id, nextTokenId: next.id }),
      createdAt: revokedAt,
    }
    if (record.deviceId) log.deviceId = record.deviceId
    await repo.addAuditLog(log)
    return c.json({
      ok: true,
      accessToken: await signAccessToken(record.userId, c.get("env")),
      refreshToken: next.plaintext,
    })
  })
  .post("/auth/logout", async (c) => {
    const body = refreshSchema.parse(await c.req.json())
    const hash = await refreshTokenHash(body.refreshToken)
    await c.get("repo").revokeRefreshTokenByHash(hash, now())
    return c.json({ ok: true })
  })
  .post("/auth/logout-all", requireAuth, async (c) => {
    const user = c.get("user")!
    await c.get("repo").revokeUserRefreshTokens(user.id, now())
    return c.json({ ok: true })
  })
  .get("/auth/sessions", requireAuth, async (c) => {
    const tokens = await c.get("repo").listUserRefreshTokens(c.get("user")!.id)
    return c.json({
      ok: true,
      sessions: tokens.map((token) => ({
        id: token.id,
        deviceId: token.deviceId,
        familyId: token.familyId,
        expiresAt: token.expiresAt.toISOString(),
        revokedAt: token.revokedAt?.toISOString(),
        reuseDetectedAt: token.reuseDetectedAt?.toISOString(),
        createdAt: token.createdAt.toISOString(),
      })),
    })
  })
  .post("/auth/email-verification/request", requireAuth, async (c) => {
    const user = c.get("user")!
    if (user.emailVerifiedAt) return c.json({ ok: true, alreadyVerified: true })
    const issued = await createAuthActionToken(c, user.id, "email_verification", 60 * 60)
    await c.get("repo").addAuditLog({
      id: newId("aud"),
      userId: user.id,
      event: "email_verification.requested",
      metadataJson: "{}",
      createdAt: now(),
    })
    return c.json(includeActionToken(c, { ok: true, expiresAt: issued.expiresAt.toISOString() }, issued.plaintext))
  })
  .post("/auth/email-verification/confirm", async (c) => {
    const body = tokenSchema.parse(await c.req.json())
    const token = await consumeAuthActionToken(c, body.token, "email_verification")
    const user = token ? await c.get("repo").getUser(token.userId) : undefined
    if (!token || !user) throw new ApiError(400, "Verification token is invalid or expired.", "invalid_verification_token")
    user.emailVerifiedAt = now()
    await c.get("repo").updateUser(user)
    await c.get("repo").addAuditLog({
      id: newId("aud"),
      userId: user.id,
      event: "email_verification.confirmed",
      metadataJson: "{}",
      createdAt: user.emailVerifiedAt,
    })
    return c.json({ ok: true })
  })
  .post("/auth/password-reset/request", rateLimit(10, 60_000, "password-reset"), async (c) => {
    const body = z.object({ email: z.string().email() }).strict().parse(await c.req.json())
    const user = await c.get("repo").getUserByEmail(normalizeEmail(body.email))
    if (!user || user.disabledAt) return c.json({ ok: true })
    const issued = await createAuthActionToken(c, user.id, "password_reset", 60 * 30)
    await c.get("repo").addAuditLog({
      id: newId("aud"),
      userId: user.id,
      event: "password_reset.requested",
      metadataJson: "{}",
      createdAt: now(),
    })
    return c.json(includeActionToken(c, { ok: true, expiresAt: issued.expiresAt.toISOString() }, issued.plaintext))
  })
  .post("/auth/password-reset/confirm", rateLimit(20, 60_000, "password-reset-confirm"), async (c) => {
    const body = passwordResetConfirmSchema.parse(await c.req.json())
    const token = await consumeAuthActionToken(c, body.token, "password_reset")
    if (!token) throw new ApiError(400, "Password reset token is invalid or expired.", "invalid_reset_token")
    await c.get("repo").updatePasswordIdentity(token.userId, await hashPassword(body.password))
    await c.get("repo").revokeUserRefreshTokens(token.userId, now())
    await c.get("repo").addAuditLog({
      id: newId("aud"),
      userId: token.userId,
      event: "password_reset.confirmed",
      metadataJson: "{}",
      createdAt: now(),
    })
    return c.json({ ok: true })
  })
  .get("/auth/export", requireAuth, async (c) => {
    const user = c.get("user")!
    const devices = await c.get("repo").listDevices(user.id)
    const trusts = await c.get("repo").listActiveTrusts(user.id)
    const sessions = await c.get("repo").listUserRefreshTokens(user.id)
    return c.json({
      ok: true,
      export: {
        user: { id: user.id, email: user.email, emailVerifiedAt: user.emailVerifiedAt?.toISOString(), createdAt: user.createdAt.toISOString() },
        devices: devices.map((device) => ({ id: device.id, name: device.name, platform: device.platform, verifiedAt: device.verifiedAt?.toISOString(), createdAt: device.createdAt.toISOString() })),
        trusts: trusts.map((trust) => ({ id: trust.id, sourceDeviceId: trust.sourceDeviceId, targetDeviceId: trust.targetDeviceId, scope: trust.scope, createdAt: trust.createdAt.toISOString() })),
        sessions: sessions.map((session) => ({ id: session.id, deviceId: session.deviceId, familyId: session.familyId, expiresAt: session.expiresAt.toISOString(), revokedAt: session.revokedAt?.toISOString(), createdAt: session.createdAt.toISOString() })),
      },
    })
  })
  .delete("/auth/account", requireAuth, async (c) => {
    const body = deleteAccountSchema.parse(await c.req.json())
    const user = c.get("user")!
    if (normalizeEmail(body.confirmation) !== user.email) {
      throw new ApiError(400, "Account confirmation must match the account email.", "invalid_confirmation")
    }
    await authorizeAccountDeletion(c, user, body)
    const deletedAt = now()
    await c.get("repo").deleteAccount(user.id, deletedAt)
    await c.get("repo").addAuditLog({
      id: newId("aud"),
      userId: user.id,
      event: "account.deleted",
      metadataJson: "{}",
      createdAt: deletedAt,
    })
    return c.json({ ok: true })
  })
  .get("/auth/me", requireAuth, async (c) => {
    const user = c.get("user")!
    const identities = await c.get("repo").listAuthIdentities(user.id)
    return c.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        emailVerifiedAt: user.emailVerifiedAt?.toISOString(),
        createdAt: user.createdAt.toISOString(),
        providers: identities.map((identity) => identity.provider),
      },
    })
  })

async function authorizeAccountDeletion(c: Context<AppBindings>, user: User, body: DeleteAccountBody) {
  const identities = await c.get("repo").listAuthIdentities(user.id)
  const passwordIdentity = identities.find((identity) => identity.provider === "password")
  if (body.password && passwordIdentity?.passwordHash && await verifyPassword(body.password, passwordIdentity.passwordHash)) {
    return
  }

  const firebaseIdentity = identities.find((identity) => identity.provider === "firebase" && identity.providerSubject)
  if (body.firebaseIdToken && firebaseIdentity?.providerSubject) {
    const token = await verifyFirebaseIdToken(body.firebaseIdToken, c.get("env"))
    if (token.uid === firebaseIdentity.providerSubject && normalizeEmail(token.email) === user.email) return
    throw new ApiError(401, "Firebase re-authentication does not match this account.", "invalid_reauthentication")
  }

  if (passwordIdentity?.passwordHash) {
    throw new ApiError(401, "Invalid password.", "invalid_credentials")
  }
  if (firebaseIdentity) {
    throw new ApiError(401, "Recent provider verification is required.", "reauthentication_required")
  }
  throw new ApiError(409, "Account has no supported deletion verifier.", "unsupported_account_verifier")
}

async function createAuthActionToken(c: Context<AppBindings>, userId: string, purpose: "email_verification" | "password_reset", ttlSeconds: number) {
  const plaintext = `${newId("act")}.${crypto.randomUUID()}.${crypto.randomUUID()}`
  const createdAt = now()
  const expiresAt = addSeconds(createdAt, ttlSeconds)
  await c.get("repo").createAuthToken({
    id: newId("atk"),
    userId,
    purpose,
    tokenHash: await refreshTokenHash(plaintext),
    expiresAt,
    createdAt,
  })
  return { plaintext, expiresAt }
}

async function consumeAuthActionToken(c: Context<AppBindings>, plaintext: string, purpose: "email_verification" | "password_reset") {
  const token = await c.get("repo").getAuthTokenByHash(await refreshTokenHash(plaintext), purpose)
  if (!token || token.consumedAt || token.expiresAt <= now()) return undefined
  const consumed = await c.get("repo").consumeAuthToken(token.id, now())
  return consumed ? token : undefined
}

function includeActionToken<T extends Record<string, unknown>>(c: Context<AppBindings>, body: T, token: string): T & { token?: string } {
  if (c.get("env").NODE_ENV === "production") return body
  return { ...body, token }
}

function createDeviceCode() {
  return `${newId("dlc")}.${crypto.randomUUID()}.${crypto.randomUUID()}`
}

function createUserCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  const bytes = crypto.getRandomValues(new Uint8Array(8))
  const raw = [...bytes].map((byte) => alphabet[byte % alphabet.length]).join("")
  return `${raw.slice(0, 4)}-${raw.slice(4)}`
}

function normalizeUserCode(code: string) {
  return code.toUpperCase().replaceAll(/[^A-Z0-9]/g, "")
}

function withUserCode(verificationUri: string, userCode: string) {
  const url = new URL(verificationUri)
  url.searchParams.set("code", userCode)
  return url.toString()
}

async function authPayload(c: Context<AppBindings>, userId: string) {
  const refresh = await createRefreshToken(c.get("env").REFRESH_TOKEN_TTL_SECONDS)
  const user = await c.get("repo").getUser(userId)
  if (!user || user.disabledAt) throw new ApiError(403, "Account is disabled.", "account_disabled")
  await c.get("repo").createRefreshToken({
    id: refresh.id,
    userId,
    tokenHash: refresh.hash,
    familyId: newId("rtf"),
    expiresAt: refresh.expiresAt,
    createdAt: now(),
  })
  return {
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      emailVerifiedAt: user.emailVerifiedAt?.toISOString(),
      createdAt: user.createdAt.toISOString(),
    },
    accessToken: await signAccessToken(userId, c.get("env")),
    refreshToken: refresh.plaintext,
    tokenType: "Bearer",
  }
}
