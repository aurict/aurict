import { describe, expect, test } from "bun:test"
import { createApp } from "../src/app"
import type { BackendDb } from "../src/db/client"
import { loadEnv } from "../src/env"
import { createMemoryStore } from "../src/store/memory"
import { createMemoryRepository } from "../src/store/repository"
import { createMemoryRateLimiter } from "../src/middleware/rate-limit"
import { deviceKeyFingerprint, secretClaimPayload, secretTransferPayload, trustGrantPayload } from "../src/crypto/signatures"

const env = loadEnv({
  NODE_ENV: "test",
  JWT_SECRET: "test-secret-test-secret-test-secret-test-secret",
})

const firebaseEnv = loadEnv({
  NODE_ENV: "test",
  JWT_SECRET: "test-secret-test-secret-test-secret-test-secret",
  FIREBASE_PROJECT_ID: "aurict-test",
})

const remoteEnv = loadEnv({
  NODE_ENV: "test",
  JWT_SECRET: "test-secret-test-secret-test-secret-test-secret",
  REMOTE_MAX_ACTIVE_SESSIONS: "1",
  REMOTE_MAX_IDLE_SECONDS: "1",
  TURN_URIS: "turn:turn.aurict.test:3478,turns:turn.aurict.test:5349",
  TURN_SHARED_SECRET: "turn-shared-secret-for-tests",
})

function testApp() {
  const store = createMemoryStore()
  return { app: createApp({ env, store }), store }
}

function testAppWithEnv(appEnv: typeof env) {
  const store = createMemoryStore()
  return { app: createApp({ env: appEnv, store }), store }
}

async function json(res: Response) {
  return await res.json() as Record<string, any>
}

async function register(app: ReturnType<typeof createApp>) {
  const res = await app.request("/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "User@Example.com", password: "correct horse battery" }),
  })
  expect(res.status).toBe(201)
  return json(res)
}

function firebaseToken(claims: { uid: string; email: string; emailVerified: boolean; signInProvider?: string; authTime?: number }) {
  const withAuthTime = { authTime: Math.floor(Date.now() / 1000), ...claims }
  return `test.${Buffer.from(JSON.stringify(withAuthTime)).toString("base64url")}`
}

const deviceKeys = new Map<string, CryptoKey>()

async function deviceKeyMaterial() {
  const pair = await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"]) as unknown as CryptoKeyPair
  const exported = await crypto.subtle.exportKey("jwk", pair.publicKey)
  const publicJwk = JSON.stringify({ kty: "OKP", crv: "Ed25519", x: exported.x, ext: true, key_ops: ["verify"] })
  return { privateKey: pair.privateKey, publicJwk, fingerprint: await deviceKeyFingerprint(publicJwk) }
}

async function signWith(privateKey: CryptoKey, payload: string) {
  const sig = await crypto.subtle.sign({ name: "Ed25519" }, privateKey, new TextEncoder().encode(payload))
  return Buffer.from(sig).toString("base64url")
}

async function signAs(device: Record<string, any>, payload: string) {
  const key = deviceKeys.get(device.id)
  if (!key) throw new Error(`No test key for device ${device.id}`)
  return await signWith(key, payload)
}

async function addDevice(app: ReturnType<typeof createApp>, token: string, platform: "mobile" | "cli", name: string, verify = true) {
  const keys = await deviceKeyMaterial()
  const res = await app.request("/devices/register", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify({
      name,
      platform,
      encryptionPublicKey: keys.publicJwk,
      signingPublicKey: keys.publicJwk,
      signingKeyFingerprint: keys.fingerprint,
    }),
  })
  expect(res.status).toBe(201)
  const body = await json(res)
  deviceKeys.set(body.device.id, keys.privateKey)
  if (!verify) return body.device
  const verified = await app.request(`/devices/${body.device.id}/verify`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify({
      challenge: body.verification.challenge,
      signature: await signWith(keys.privateKey, body.verification.challenge),
      algorithm: "ed25519",
    }),
  })
  expect(verified.status).toBe(200)
  return (await json(verified)).device
}

async function userIdOf(app: ReturnType<typeof createApp>, token: string) {
  const res = await app.request("/auth/me", { headers: { authorization: `Bearer ${token}` } })
  return (await json(res)).user.id as string
}

/** Body for POST /devices/:target/trust, signed by the target device as the API requires. */
async function trustBody(app: ReturnType<typeof createApp>, token: string, target: Record<string, any>, source: Record<string, any>, scope: string, issuedAt = new Date().toISOString()) {
  const payload = trustGrantPayload({
    userId: await userIdOf(app, token),
    sourceDeviceId: source.id,
    sourceFingerprint: source.signingKeyFingerprint,
    targetDeviceId: target.id,
    targetFingerprint: target.signingKeyFingerprint,
    scope,
    issuedAt,
  })
  return JSON.stringify({ sourceDeviceId: source.id, scope, grant: { issuedAt, signature: await signAs(target, payload) } })
}

async function claimBody(transferId: string, recipient: Record<string, any>, issuedAt = new Date().toISOString()) {
  const signature = await signAs(recipient, secretClaimPayload({ transferId, recipientDeviceId: recipient.id, issuedAt }))
  return JSON.stringify({ deviceId: recipient.id, issuedAt, signature })
}

async function secretEnvelope(sender: Record<string, any>, recipient: Record<string, any>, provider = "OpenCode") {
  const envelope = {
    version: 1,
    algorithm: "xchacha20-poly1305",
    nonce: "nonce_nonce",
    ciphertext: "ciphertext_payload_payload",
    recipientKeyFingerprint: recipient.signingKeyFingerprint,
    senderKeyFingerprint: sender.signingKeyFingerprint,
  }
  const signed = secretTransferPayload({ senderDeviceId: sender.id, recipientDeviceId: recipient.id, provider, ...envelope })
  return { ...envelope, senderSignature: await signAs(sender, signed) }
}

async function offerEnvelope(device: Record<string, any>, transport = "webrtc") {
  const payload = "signed_offer_payload_payload"
  return {
    version: 1,
    type: "offer",
    transport,
    payload,
    signingKeyFingerprint: device.signingKeyFingerprint,
    signature: await signAs(device, payload),
  }
}

async function answerEnvelope(device: Record<string, any>, suffix = "a", transport = "webrtc") {
  const payload = `signed_answer_payload_payload_${suffix}`
  return {
    version: 1,
    type: "answer",
    transport,
    payload,
    signingKeyFingerprint: device.signingKeyFingerprint,
    signature: await signAs(device, payload),
  }
}

describe("backend auth", () => {
  test("production env rejects unsafe defaults", () => {
    expect(() => loadEnv({ NODE_ENV: "production" })).toThrow("JWT_SECRET")
    expect(() => loadEnv({
      NODE_ENV: "production",
      JWT_SECRET: "prod-secret-prod-secret-prod-secret-prod-secret",
    })).toThrow("DATABASE_URL")
    expect(loadEnv({
      NODE_ENV: "production",
      JWT_SECRET: "prod-secret-prod-secret-prod-secret-prod-secret",
      DATABASE_URL: "postgres://aurict:aurict@example.com:5432/aurict",
      CORS_ORIGINS: "https://app.aurict.com",
    }).NODE_ENV).toBe("production")
  })

  test("register login me and refresh rotation work without plaintext refresh storage", async () => {
    const { app, store } = testApp()
    const registered = await register(app)
    expect(registered.accessToken).toBeString()
    expect(registered.refreshToken).toBeString()
    expect([...store.refreshTokens.values()][0]?.tokenHash).not.toBe(registered.refreshToken)

    const me = await app.request("/auth/me", {
      headers: { authorization: `Bearer ${registered.accessToken}` },
    })
    expect(me.status).toBe(200)
    expect((await json(me)).user.email).toBe("user@example.com")

    const refreshed = await app.request("/auth/refresh", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refreshToken: registered.refreshToken }),
    })
    expect(refreshed.status).toBe(200)
    const refreshedBody = await json(refreshed)
    expect(refreshedBody.refreshToken).not.toBe(registered.refreshToken)

    const replay = await app.request("/auth/refresh", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refreshToken: registered.refreshToken }),
    })
    expect(replay.status).toBe(401)
    expect((await json(replay)).error.code).toBe("refresh_reuse_detected")
    expect(store.auditLogs.some((log) => log.event === "refresh.reuse_detected")).toBe(true)
    expect([...store.refreshTokens.values()].every((token) => token.revokedAt)).toBe(true)
  })

  test("authenticated users can submit privacy-scoped feedback reports", async () => {
    const { app, store } = testApp()
    const registered = await register(app)
    const unauthorized = await app.request("/feedback/reports", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        reason: "incorrect",
        assistantMessage: "Wrong answer",
      }),
    })
    expect(unauthorized.status).toBe(401)

    const created = await app.request("/feedback/reports", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${registered.accessToken}` },
      body: JSON.stringify({
        reason: "hallucination",
        note: "It cited a fake SDK token=super-secret-token-value",
        userMessage: "Which SDK should I use?",
        assistantMessage: "Use sk-test-secret-value and an imaginary SDK.",
        provider: "OpenCode",
        model: "zen-test",
        appVersion: "1.0.0+1",
        platform: "mobile",
        toolSummary: [{ name: "answer_verifier", status: "completed", ok: true }],
        metadata: { messageStatus: "done", toolCount: 1, ignored: "nope" },
      }),
    })
    expect(created.status).toBe(201)
    const body = await json(created)
    expect(body.report.id).toStartWith("fbr_")
    const report = [...store.feedbackReports.values()][0]
    expect(report).toBeDefined()
    if (!report) throw new Error("expected feedback report")
    expect(report.reason).toBe("hallucination")
    expect(report.note).toContain("[redacted-secret]")
    expect(report.assistantMessage).toContain("[redacted-secret]")
    expect(report.metadataJson).toContain("messageStatus")
    expect(report.metadataJson).not.toContain("ignored")
  })

  test("firebase auth requires backend configuration", async () => {
    const { app } = testApp()
    const res = await app.request("/auth/firebase", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        idToken: firebaseToken({
          uid: "firebase-user-1".repeat(8),
          email: "firebase@example.com",
          emailVerified: true,
        }),
      }),
    })
    expect(res.status).toBe(503)
    expect((await json(res)).error.code).toBe("firebase_not_configured")
  })

  test("firebase auth creates and reuses verified social account", async () => {
    const store = createMemoryStore()
    const app = createApp({ env: firebaseEnv, store })
    const token = firebaseToken({
      uid: "firebase-user-2".repeat(8),
      email: "Firebase@Example.com",
      emailVerified: true,
      signInProvider: "google.com",
    })
    const created = await app.request("/auth/firebase", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ idToken: token }),
    })
    expect(created.status).toBe(201)
    expect((await json(created)).accessToken).toBeString()
    expect([...store.users.values()][0]?.email).toBe("firebase@example.com")
    expect([...store.identities.values()][0]?.providerSubject).toBe("firebase-user-2".repeat(8))

    const loggedIn = await app.request("/auth/firebase", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ idToken: token }),
    })
    expect(loggedIn.status).toBe(200)
    expect(store.auditLogs.some((log) => log.event === "auth.firebase.login.success")).toBe(true)
  })

  test("firebase auth links existing password account only with verified email", async () => {
    const store = createMemoryStore()
    const app = createApp({ env: firebaseEnv, store })
    await register(app)

    const unverified = await app.request("/auth/firebase", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        idToken: firebaseToken({
          uid: "firebase-user-3".repeat(8),
          email: "user@example.com",
          emailVerified: false,
        }),
      }),
    })
    expect(unverified.status).toBe(409)

    const linked = await app.request("/auth/firebase", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        idToken: firebaseToken({
          uid: "firebase-user-3".repeat(8),
          email: "user@example.com",
          emailVerified: true,
          signInProvider: "apple.com",
        }),
      }),
    })
    expect(linked.status).toBe(200)
    expect([...store.identities.values()].some((identity) =>
      identity.provider === "firebase" && identity.providerSubject === "firebase-user-3".repeat(8),
    )).toBe(true)
    expect([...store.users.values()][0]?.emailVerifiedAt).toBeInstanceOf(Date)
  })

  test("firebase link to an unverified password account revokes the pre-existing credentials", async () => {
    const store = createMemoryStore()
    const app = createApp({ env: firebaseEnv, store })
    const squatter = await register(app)
    const device = await addDevice(app, squatter.accessToken, "cli", "squatter")

    const linked = await app.request("/auth/firebase", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        idToken: firebaseToken({ uid: "firebase-owner".repeat(8), email: "user@example.com", emailVerified: true }),
      }),
    })
    expect(linked.status).toBe(200)

    const passwordLogin = await app.request("/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "user@example.com", password: "correct horse battery" }),
    })
    expect(passwordLogin.status).toBe(401)
    const refreshed = await app.request("/auth/refresh", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refreshToken: squatter.refreshToken }),
    })
    expect(refreshed.status).toBe(401)
    expect(store.devices.get(device.id)?.revokedAt).toBeInstanceOf(Date)
  })

  test("firebase link keeps the password of an already verified account", async () => {
    const store = createMemoryStore()
    const app = createApp({ env: firebaseEnv, store })
    await register(app)
    const user = [...store.users.values()][0]!
    user.emailVerifiedAt = new Date()

    const linked = await app.request("/auth/firebase", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        idToken: firebaseToken({ uid: "firebase-owner2".repeat(8), email: "user@example.com", emailVerified: true }),
      }),
    })
    expect(linked.status).toBe(200)
    const passwordLogin = await app.request("/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "user@example.com", password: "correct horse battery" }),
    })
    expect(passwordLogin.status).toBe(200)
  })

  test("browser based CLI device login approves via authenticated web session", async () => {
    const { app, store } = testApp()
    const auth = await register(app)

    const started = await app.request("/auth/device/start", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ clientName: "Aurict CLI on debian" }),
    })
    expect(started.status).toBe(201)
    const startedBody = await json(started)
    expect(startedBody.deviceCode).toBeString()
    expect(startedBody.userCode).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/)
    expect(startedBody.verificationUriComplete).toContain(encodeURIComponent(startedBody.userCode))
    expect([...store.deviceLoginFlows.values()][0]?.deviceCodeHash).not.toBe(startedBody.deviceCode)

    const pending = await app.request("/auth/device/poll", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ deviceCode: startedBody.deviceCode }),
    })
    expect(pending.status).toBe(200)
    expect((await json(pending)).status).toBe("pending")

    const approved = await app.request("/auth/device/approve", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${auth.accessToken}` },
      body: JSON.stringify({ userCode: startedBody.userCode.toLowerCase().replace("-", " ") }),
    })
    expect(approved.status).toBe(200)
    expect((await json(approved)).status).toBe("approved")

    const consumed = await app.request("/auth/device/poll", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ deviceCode: startedBody.deviceCode }),
    })
    expect(consumed.status).toBe(200)
    const consumedBody = await json(consumed)
    expect(consumedBody.status).toBe("approved")
    expect(consumedBody.accessToken).toBeString()
    expect(consumedBody.refreshToken).toBeString()

    const replay = await app.request("/auth/device/poll", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ deviceCode: startedBody.deviceCode }),
    })
    expect(replay.status).toBe(409)
    expect((await json(replay)).error.code).toBe("device_code_consumed")
    expect(store.auditLogs.some((log) => log.event === "auth.device.approved")).toBe(true)
    expect(store.auditLogs.some((log) => log.event === "auth.device.consumed")).toBe(true)
  })

  test("browser based CLI device login can be denied", async () => {
    const { app } = testApp()
    const auth = await register(app)
    const started = await app.request("/auth/device/start", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ clientName: "Aurict CLI" }),
    })
    const startedBody = await json(started)

    const denied = await app.request("/auth/device/deny", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${auth.accessToken}` },
      body: JSON.stringify({ userCode: startedBody.userCode }),
    })
    expect(denied.status).toBe(200)

    const polled = await app.request("/auth/device/poll", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ deviceCode: startedBody.deviceCode }),
    })
    expect(polled.status).toBe(403)
    expect((await json(polled)).error.code).toBe("access_denied")
  })

  test("refresh token rotation is single-use under concurrent requests", async () => {
    const { app } = testApp()
    const registered = await register(app)
    const requests = await Promise.all([
      app.request("/auth/refresh", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ refreshToken: registered.refreshToken }),
      }),
      app.request("/auth/refresh", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ refreshToken: registered.refreshToken }),
      }),
    ])
    expect(requests.map((res) => res.status).sort()).toEqual([200, 401])
  })

  test("email verification password reset sessions export and account deletion work", async () => {
    const { app, store } = testApp()
    const auth = await register(app)

    const requestedVerification = await app.request("/auth/email-verification/request", {
      method: "POST",
      headers: { authorization: `Bearer ${auth.accessToken}` },
    })
    expect(requestedVerification.status).toBe(200)
    const verificationBody = await json(requestedVerification)
    expect(verificationBody.token).toBeString()

    const confirmedVerification = await app.request("/auth/email-verification/confirm", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token: verificationBody.token }),
    })
    expect(confirmedVerification.status).toBe(200)
    expect([...store.users.values()][0]?.emailVerifiedAt).toBeInstanceOf(Date)

    const sessions = await app.request("/auth/sessions", {
      headers: { authorization: `Bearer ${auth.accessToken}` },
    })
    expect(sessions.status).toBe(200)
    expect((await json(sessions)).sessions.length).toBeGreaterThan(0)

    const exported = await app.request("/auth/export", {
      headers: { authorization: `Bearer ${auth.accessToken}` },
    })
    expect(exported.status).toBe(200)
    expect((await json(exported)).export.user.email).toBe("user@example.com")

    const resetRequested = await app.request("/auth/password-reset/request", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "user@example.com" }),
    })
    expect(resetRequested.status).toBe(200)
    const resetBody = await json(resetRequested)
    expect(resetBody.token).toBeString()

    const resetConfirmed = await app.request("/auth/password-reset/confirm", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token: resetBody.token, password: "new correct horse battery" }),
    })
    expect(resetConfirmed.status).toBe(200)

    const login = await app.request("/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "user@example.com", password: "new correct horse battery" }),
    })
    expect(login.status).toBe(200)
    const loginBody = await json(login)

    const deleted = await app.request("/auth/account", {
      method: "DELETE",
      headers: { "content-type": "application/json", authorization: `Bearer ${loginBody.accessToken}` },
      body: JSON.stringify({ confirmation: "user@example.com", password: "new correct horse battery" }),
    })
    expect(deleted.status).toBe(200)
    const deletedUser = [...store.users.values()][0]
    expect(deletedUser?.disabledAt).toBeInstanceOf(Date)
    expect(deletedUser?.email).toStartWith("deleted+")
    expect([...store.refreshTokens.values()].every((token) => token.revokedAt)).toBe(true)
    expect([...store.authTokens.values()].every((token) => token.consumedAt)).toBe(true)
    expect([...store.identities.values()].every((identity) => !identity.passwordHash && !identity.providerSubject)).toBe(true)
    expect(store.auditLogs.some((log) => log.event === "account.deleted")).toBe(true)

    const meAfterDelete = await app.request("/auth/me", {
      headers: { authorization: `Bearer ${loginBody.accessToken}` },
    })
    expect(meAfterDelete.status).toBe(401)
  })

  test("firebase account deletion accepts matching provider re-authentication", async () => {
    const store = createMemoryStore()
    const app = createApp({ env: firebaseEnv, store })
    const idToken = firebaseToken({
      uid: "firebase-delete-user".repeat(6),
      email: "delete@example.com",
      emailVerified: true,
      signInProvider: "github.com",
    })
    const login = await app.request("/auth/firebase", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ idToken }),
    })
    expect(login.status).toBe(201)
    const loginBody = await json(login)

    const missingReauth = await app.request("/auth/account", {
      method: "DELETE",
      headers: { "content-type": "application/json", authorization: `Bearer ${loginBody.accessToken}` },
      body: JSON.stringify({ confirmation: "delete@example.com" }),
    })
    expect(missingReauth.status).toBe(401)
    expect((await json(missingReauth)).error.code).toBe("reauthentication_required")

    const deleted = await app.request("/auth/account", {
      method: "DELETE",
      headers: { "content-type": "application/json", authorization: `Bearer ${loginBody.accessToken}` },
      body: JSON.stringify({ confirmation: "delete@example.com", firebaseIdToken: idToken }),
    })
    expect(deleted.status).toBe(200)
    expect([...store.users.values()][0]?.disabledAt).toBeInstanceOf(Date)
    expect([...store.users.values()][0]?.email).toStartWith("deleted+")
    expect([...store.identities.values()][0]?.providerSubject).toBeUndefined()
    expect([...store.refreshTokens.values()].every((token) => token.revokedAt)).toBe(true)
    expect(store.auditLogs.some((log) => log.event === "account.deleted")).toBe(true)
  })
})

describe("devices trust and encrypted relay", () => {
  test("security headers and allowlisted CORS are applied", async () => {
    const store = createMemoryStore()
    const app = createApp({
      env: loadEnv({
        NODE_ENV: "test",
        JWT_SECRET: "test-secret-test-secret-test-secret-test-secret",
        CORS_ORIGINS: "https://app.aurict.com",
      }),
      store,
    })
    const res = await app.request("/health", { headers: { origin: "https://app.aurict.com" } })
    expect(res.headers.get("x-content-type-options")).toBe("nosniff")
    expect(res.headers.get("cache-control")).toBe("no-store")
    expect(res.headers.get("access-control-allow-origin")).toBe("https://app.aurict.com")

    const blocked = await app.request("/health", { headers: { origin: "https://evil.example" } })
    expect(blocked.headers.get("access-control-allow-origin")).toBeNull()
  })

  test("production metrics and openapi are not public by default", async () => {
    const store = createMemoryStore()
    const db = { async ping() {}, async close() {} } as BackendDb
    const app = createApp({
      env: loadEnv({
        NODE_ENV: "production",
        JWT_SECRET: "prod-secret-prod-secret-prod-secret-prod-secret",
        DATABASE_URL: "postgres://aurict:aurict@example.com:5432/aurict",
        CORS_ORIGINS: "https://app.aurict.com",
      }),
      store,
      db,
      repo: createMemoryRepository(store),
    })
    expect((await app.request("/metrics")).status).toBe(404)
    expect((await app.request("/openapi.json")).status).toBe(404)
  })

  test("request body limit rejects oversized content-length", async () => {
    const app = createApp({
      env: loadEnv({
        NODE_ENV: "test",
        JWT_SECRET: "test-secret-test-secret-test-secret-test-secret",
        REQUEST_BODY_LIMIT_BYTES: "10",
      }),
    })
    const res = await app.request("/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json", "content-length": "100" },
      body: JSON.stringify({ email: "large@example.com", password: "correct horse battery" }),
    })
    expect(res.status).toBe(413)
  })

  test("rate limiter is injectable and sets rate limit headers", async () => {
    const store = createMemoryStore()
    const app = createApp({
      env,
      store,
      repo: createMemoryRepository(store),
      rateLimiter: {
        async check() {
          return { allowed: true, remaining: 4, resetAt: 2_000_000 }
        },
      },
    })
    const res = await app.request("/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "limit@example.com", password: "correct horse battery" }),
    })
    expect(res.status).toBe(201)
    expect(res.headers.get("x-ratelimit-remaining")).toBe("4")
  })

  test("auth abuse endpoints reject over-limit attempts", async () => {
    const { app } = testApp()
    for (let i = 0; i < 10; i++) {
      const res = await app.request("/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: `abuse-${i}@example.com`, password: "correct horse battery" }),
      })
      expect(res.status).toBe(201)
    }
    const limited = await app.request("/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "abuse-limited@example.com", password: "correct horse battery" }),
    })
    expect(limited.status).toBe(429)
    expect((await json(limited)).error.code).toBe("rate_limited")
  })

  test("ready endpoint reports database health when db client is configured", async () => {
    let pinged = false
    const db = {
      async ping() {
        pinged = true
      },
    } as BackendDb
    const store = createMemoryStore()
    const app = createApp({ env, store, db, repo: createMemoryRepository(store) })
    const res = await app.request("/ready")
    expect(res.status).toBe(200)
    expect(await json(res)).toEqual({ ok: true, db: "ok" })
    expect(pinged).toBe(true)
  })

  test("metrics and openapi endpoints are available", async () => {
    const { app } = testApp()
    await app.request("/health")
    const auth = await register(app)
    const device = await addDevice(app, auth.accessToken, "mobile", "metrics-phone")
    await app.request(`/devices/${device.id}`, {
      headers: { authorization: `Bearer ${auth.accessToken}` },
    })
    const metrics = await app.request("/metrics")
    expect(metrics.status).toBe(200)
    const metricsBody = await json(metrics)
    expect(metricsBody.metrics.requestsTotal).toBeGreaterThan(0)
    expect(metricsBody.metrics.responsesByRoute[`GET /devices/${device.id}`]).toBeUndefined()
    expect(metricsBody.metrics.responsesByRoute["GET /devices/:id"]).toBe(1)

    const openapi = await app.request("/openapi.json")
    expect(openapi.status).toBe(200)
    expect((await json(openapi)).openapi).toBe("3.1.0")
  })

  test("trusted devices can create ciphertext-only secret transfer", async () => {
    const { app, store } = testApp()
    const auth = await register(app)
    const cli = await addDevice(app, auth.accessToken, "cli", "desktop")
    const mobile = await addDevice(app, auth.accessToken, "mobile", "phone")

    const trust = await app.request(`/devices/${mobile.id}/trust`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${auth.accessToken}` },
      body: await trustBody(app, auth.accessToken, mobile, cli, "all"),
    })
    expect(trust.status).toBe(201)
    expect(store.auditLogs.some((log) => log.event === "device.trust.created")).toBe(true)

    const untrust = await app.request(`/devices/${mobile.id}/untrust`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${auth.accessToken}` },
      body: JSON.stringify({ sourceDeviceId: cli.id }),
    })
    expect(untrust.status).toBe(200)
    expect(store.auditLogs.some((log) => log.event === "device.trust.revoked")).toBe(true)

    await app.request(`/devices/${mobile.id}/trust`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${auth.accessToken}` },
      body: await trustBody(app, auth.accessToken, mobile, cli, "all"),
    })

    const rejected = await app.request("/secrets/transfers", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${auth.accessToken}` },
      body: JSON.stringify({
        senderDeviceId: cli.id,
        recipientDeviceId: mobile.id,
        provider: "OpenCode",
        apiKey: "sk-plaintext-should-not-pass",
        envelope: await secretEnvelope(cli, mobile),
      }),
    })
    expect(rejected.status).toBe(400)

    const badEnvelope = await app.request("/secrets/transfers", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${auth.accessToken}` },
      body: JSON.stringify({
        senderDeviceId: cli.id,
        recipientDeviceId: mobile.id,
        provider: "OpenCode",
        envelope: { ...(await secretEnvelope(cli, mobile)), algorithm: "unsupported" },
      }),
    })
    expect(badEnvelope.status).toBe(400)

    const created = await app.request("/secrets/transfers", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${auth.accessToken}` },
      body: JSON.stringify({
        senderDeviceId: cli.id,
        recipientDeviceId: mobile.id,
        provider: "OpenCode",
        envelope: await secretEnvelope(cli, mobile),
      }),
    })
    expect(created.status).toBe(201)
    const transfer = (await json(created)).transfer
    // Ciphertext is only handed out by the claim, never by create, get or inbox.
    expect(transfer.envelope.ciphertext).toBeUndefined()
    const inbox = await json(await app.request(`/secrets/transfers/inbox?deviceId=${mobile.id}`, {
      headers: { authorization: `Bearer ${auth.accessToken}` },
    }))
    expect(inbox.transfers[0].envelope.ciphertext).toBeUndefined()

    // The sender cannot claim its own transfer, even with a valid signature of its own.
    const wrongDevice = await app.request(`/secrets/transfers/${transfer.id}/claim`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${auth.accessToken}` },
      body: await claimBody(transfer.id, cli),
    })
    expect(wrongDevice.status).toBe(404)

    const claimed = await app.request(`/secrets/transfers/${transfer.id}/claim`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${auth.accessToken}` },
      body: await claimBody(transfer.id, mobile),
    })
    expect(claimed.status).toBe(200)
    expect((await json(claimed)).transfer.envelope.ciphertext).toBe("ciphertext_payload_payload")
    expect(store.secretTransfers.get(transfer.id)!.ciphertext).toBe("")

    const replay = await app.request(`/secrets/transfers/${transfer.id}/claim`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${auth.accessToken}` },
      body: await claimBody(transfer.id, mobile),
    })
    expect(replay.status).toBe(409)
  })

  test("unverified devices cannot create trust", async () => {
    const { app } = testApp()
    const auth = await register(app)
    const cli = await addDevice(app, auth.accessToken, "cli", "desktop", false)
    const mobile = await addDevice(app, auth.accessToken, "mobile", "phone", false)
    const trust = await app.request(`/devices/${mobile.id}/trust`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${auth.accessToken}` },
      body: await trustBody(app, auth.accessToken, mobile, cli, "all"),
    })
    expect(trust.status).toBe(403)
    expect((await json(trust)).error.code).toBe("device_not_verified")
  })

  test("device verification challenge marks device verified", async () => {
    const { app, store } = testApp()
    const auth = await register(app)
    const cli = await addDevice(app, auth.accessToken, "cli", "desktop", false)
    expect(cli.verificationStatus).toBe("pending")
    const rawDevice = store.devices.get(cli.id)!

    const mismatch = await app.request(`/devices/${cli.id}/verify`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${auth.accessToken}` },
      body: JSON.stringify({
        challenge: "wrong_challenge_wrong_challenge",
        signature: "sig_" + "x".repeat(40),
        algorithm: "ed25519",
      }),
    })
    expect(mismatch.status).toBe(400)

    const forged = await app.request(`/devices/${cli.id}/verify`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${auth.accessToken}` },
      body: JSON.stringify({
        challenge: rawDevice.registrationChallenge,
        signature: "sig_" + "x".repeat(40),
        algorithm: "ed25519",
      }),
    })
    expect(forged.status).toBe(400)
    expect((await json(forged)).error.code).toBe("device_signature_invalid")

    const verified = await app.request(`/devices/${cli.id}/verify`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${auth.accessToken}` },
      body: JSON.stringify({
        challenge: rawDevice.registrationChallenge,
        signature: await signAs(cli, rawDevice.registrationChallenge!),
        algorithm: "ed25519",
      }),
    })
    expect(verified.status).toBe(200)
    expect((await json(verified)).device.verificationStatus).toBe("verified")
    expect(store.devices.get(cli.id)?.registrationChallenge).toBeUndefined()
    expect(store.auditLogs.some((log) => log.event === "device.verified")).toBe(true)
  })

  test("expired secret transfers cannot be claimed", async () => {
    const { app, store } = testApp()
    const auth = await register(app)
    const cli = await addDevice(app, auth.accessToken, "cli", "desktop")
    const mobile = await addDevice(app, auth.accessToken, "mobile", "phone")

    await app.request(`/devices/${mobile.id}/trust`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${auth.accessToken}` },
      body: await trustBody(app, auth.accessToken, mobile, cli, "secret_transfer"),
    })

    const created = await app.request("/secrets/transfers", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${auth.accessToken}` },
      body: JSON.stringify({
        senderDeviceId: cli.id,
        recipientDeviceId: mobile.id,
        provider: "OpenCode",
        envelope: await secretEnvelope(cli, mobile),
      }),
    })
    const transfer = (await json(created)).transfer
    store.secretTransfers.get(transfer.id)!.expiresAt = new Date(Date.now() - 1)

    const fetched = await app.request(`/secrets/transfers/${transfer.id}`, {
      headers: { authorization: `Bearer ${auth.accessToken}` },
    })
    expect((await json(fetched)).transfer.status).toBe("expired")

    const claimed = await app.request(`/secrets/transfers/${transfer.id}/claim`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${auth.accessToken}` },
      body: await claimBody(transfer.id, mobile),
    })
    expect(claimed.status).toBe(410)
  })

  test("secret transfer claim is single-use under concurrent requests", async () => {
    const { app } = testApp()
    const auth = await register(app)
    const cli = await addDevice(app, auth.accessToken, "cli", "desktop")
    const mobile = await addDevice(app, auth.accessToken, "mobile", "phone")

    await app.request(`/devices/${mobile.id}/trust`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${auth.accessToken}` },
      body: await trustBody(app, auth.accessToken, mobile, cli, "secret_transfer"),
    })

    const created = await app.request("/secrets/transfers", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${auth.accessToken}` },
      body: JSON.stringify({
        senderDeviceId: cli.id,
        recipientDeviceId: mobile.id,
        provider: "OpenCode",
        envelope: await secretEnvelope(cli, mobile),
      }),
    })
    const transfer = (await json(created)).transfer

    const requests = await Promise.all([
      app.request(`/secrets/transfers/${transfer.id}/claim`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${auth.accessToken}` }, body: await claimBody(transfer.id, mobile) }),
      app.request(`/secrets/transfers/${transfer.id}/claim`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${auth.accessToken}` }, body: await claimBody(transfer.id, mobile) }),
    ])
    expect(requests.map((res) => res.status).sort()).toEqual([200, 409])
  })

  test("remote sessions store signaling only and reject command payload", async () => {
    const { app } = testApp()
    const auth = await register(app)
    const cli = await addDevice(app, auth.accessToken, "cli", "desktop")
    const mobile = await addDevice(app, auth.accessToken, "mobile", "phone")

    await app.request(`/devices/${cli.id}/trust`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${auth.accessToken}` },
      body: await trustBody(app, auth.accessToken, cli, mobile, "remote"),
    })

    const rejected = await app.request("/remote/sessions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${auth.accessToken}` },
      body: JSON.stringify({
        desktopDeviceId: cli.id,
        connectionMode: "webrtc",
        signedOffer: "signed_offer_payload_payload",
        command: "ls -la",
      }),
    })
    expect(rejected.status).toBe(400)

    const created = await app.request("/remote/sessions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${auth.accessToken}` },
      body: JSON.stringify({
        desktopDeviceId: cli.id,
        connectionMode: "webrtc",
        signedOffer: await offerEnvelope(cli),
      }),
    })
    expect(created.status).toBe(201)
    const session = (await json(created)).session
    expect(session.signedOffer.payload).toBe("signed_offer_payload_payload")

    const mismatch = await app.request("/remote/sessions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${auth.accessToken}` },
      body: JSON.stringify({
        desktopDeviceId: cli.id,
        connectionMode: "webrtc",
        signedOffer: await offerEnvelope(cli, "tunnel"),
      }),
    })
    expect(mismatch.status).toBe(400)

    const accepted = await app.request(`/remote/sessions/${session.id}/accept`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${auth.accessToken}` },
      body: JSON.stringify({
        mobileDeviceId: mobile.id,
        signedAnswer: await answerEnvelope(mobile),
      }),
    })
    expect(accepted.status).toBe(200)
    const acceptedBody = await json(accepted)
    const acceptedSession = acceptedBody.session
    expect(acceptedSession.signedAnswer.payload).toBe("signed_answer_payload_payload_a")
    expect(acceptedSession.resumeAvailable).toBe(true)
    expect(acceptedBody.resumeToken).toBeString()
    expect(acceptedSession).not.toHaveProperty("command")
  })

  test("remote control plane enforces protocol policy without carrying data-plane events", async () => {
    const { app, store } = testAppWithEnv(remoteEnv)
    const auth = await register(app)
    const cli = await addDevice(app, auth.accessToken, "cli", "desktop")
    const mobile = await addDevice(app, auth.accessToken, "mobile", "phone")

    await app.request(`/devices/${cli.id}/trust`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${auth.accessToken}` },
      body: await trustBody(app, auth.accessToken, cli, mobile, "remote"),
    })

    const protocol = await app.request("/remote/protocol", {
      headers: { authorization: `Bearer ${auth.accessToken}` },
    })
    expect(protocol.status).toBe(200)
    expect((await json(protocol)).protocol.backendCarriesPayload).toBe(false)

    const badFingerprint = await app.request("/remote/sessions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${auth.accessToken}` },
      body: JSON.stringify({
        desktopDeviceId: cli.id,
        connectionMode: "webrtc",
        signedOffer: { ...(await offerEnvelope(cli)), signingKeyFingerprint: "wrong_fingerprint_value" },
      }),
    })
    expect(badFingerprint.status).toBe(400)
    expect((await json(badFingerprint)).error.code).toBe("remote_fingerprint_mismatch")

    const created = await app.request("/remote/sessions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${auth.accessToken}` },
      body: JSON.stringify({
        desktopDeviceId: cli.id,
        connectionMode: "webrtc",
        signedOffer: await offerEnvelope(cli),
      }),
    })
    expect(created.status).toBe(201)
    const session = (await json(created)).session
    expect(session.protocolVersion).toBe(1)
    expect(session.maxIdleSeconds).toBe(1)

    const second = await app.request("/remote/sessions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${auth.accessToken}` },
      body: JSON.stringify({
        desktopDeviceId: cli.id,
        connectionMode: "webrtc",
        signedOffer: await offerEnvelope(cli),
      }),
    })
    expect(second.status).toBe(409)
    expect((await json(second)).error.code).toBe("remote_session_limit")

    const accepted = await app.request(`/remote/sessions/${session.id}/accept`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${auth.accessToken}` },
      body: JSON.stringify({
        mobileDeviceId: mobile.id,
        signedAnswer: await answerEnvelope(mobile),
      }),
    })
    expect(accepted.status).toBe(200)
    const acceptedBody = await json(accepted)
    expect(acceptedBody.resumeToken).toBeString()
    expect(store.remoteSessions.get(session.id)?.resumeTokenHash).not.toBe(acceptedBody.resumeToken)

    const heartbeat = await app.request(`/remote/sessions/${session.id}/heartbeat`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${auth.accessToken}` },
      body: JSON.stringify({ deviceId: cli.id, lastSequence: 7 }),
    })
    expect(heartbeat.status).toBe(200)
    expect((await json(heartbeat)).session.lastSequence).toBe(7)

    const replayed = await app.request(`/remote/sessions/${session.id}/heartbeat`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${auth.accessToken}` },
      body: JSON.stringify({ deviceId: mobile.id, lastSequence: 6 }),
    })
    expect(replayed.status).toBe(409)
    expect((await json(replayed)).error.code).toBe("remote_sequence_replay")

    const resumed = await app.request(`/remote/sessions/${session.id}/resume`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${auth.accessToken}` },
      body: JSON.stringify({ deviceId: mobile.id, resumeToken: acceptedBody.resumeToken, lastSeenSequence: 8 }),
    })
    expect(resumed.status).toBe(200)
    expect((await json(resumed)).session.lastSequence).toBe(8)

    const turn = await app.request("/remote/turn-credentials", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${auth.accessToken}` },
      body: JSON.stringify({ deviceId: cli.id, sessionId: session.id }),
    })
    expect(turn.status).toBe(200)
    const turnBody = await json(turn)
    expect(turnBody.credential.urls).toEqual(["turn:turn.aurict.test:3478", "turns:turn.aurict.test:5349"])
    expect(turnBody.credential.username).toContain(session.id)
    expect(turnBody.credential.credential).toBeString()

    expect(store.auditLogs.some((log) => log.event === "remote.session.created")).toBe(true)
    expect(store.auditLogs.some((log) => log.event === "remote.session.accepted")).toBe(true)
    expect(store.auditLogs.some((log) => log.event === "remote.turn_credentials.minted")).toBe(true)

    store.remoteSessions.get(session.id)!.lastHeartbeatAt = new Date(Date.now() - 2_000)
    const idle = await app.request(`/remote/sessions/${session.id}/heartbeat`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${auth.accessToken}` },
      body: JSON.stringify({ deviceId: cli.id, lastSequence: 8 }),
    })
    expect(idle.status).toBe(410)
    expect((await json(idle)).error.code).toBe("remote_idle_timeout")
    expect(store.remoteSessions.get(session.id)?.status).toBe("expired")
  })

  test("expired remote sessions are not accepted", async () => {
    const { app, store } = testApp()
    const auth = await register(app)
    const cli = await addDevice(app, auth.accessToken, "cli", "desktop")
    const mobile = await addDevice(app, auth.accessToken, "mobile", "phone")

    await app.request(`/devices/${cli.id}/trust`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${auth.accessToken}` },
      body: await trustBody(app, auth.accessToken, cli, mobile, "remote"),
    })

    const created = await app.request("/remote/sessions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${auth.accessToken}` },
      body: JSON.stringify({
        desktopDeviceId: cli.id,
        connectionMode: "webrtc",
        signedOffer: await offerEnvelope(cli),
      }),
    })
    const session = (await json(created)).session
    store.remoteSessions.get(session.id)!.expiresAt = new Date(Date.now() - 1)

    const listed = await app.request("/remote/sessions", {
      headers: { authorization: `Bearer ${auth.accessToken}` },
    })
    expect((await json(listed)).sessions).toHaveLength(0)

    const accepted = await app.request(`/remote/sessions/${session.id}/accept`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${auth.accessToken}` },
      body: JSON.stringify({
        mobileDeviceId: mobile.id,
        signedAnswer: await answerEnvelope(mobile),
      }),
    })
    expect(accepted.status).toBe(410)
    expect(store.remoteSessions.get(session.id)?.status).toBe("expired")
  })

  test("remote session accept is single-use under concurrent requests", async () => {
    const { app } = testApp()
    const auth = await register(app)
    const cli = await addDevice(app, auth.accessToken, "cli", "desktop")
    const mobile = await addDevice(app, auth.accessToken, "mobile", "phone")

    await app.request(`/devices/${cli.id}/trust`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${auth.accessToken}` },
      body: await trustBody(app, auth.accessToken, cli, mobile, "remote"),
    })

    const created = await app.request("/remote/sessions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${auth.accessToken}` },
      body: JSON.stringify({
        desktopDeviceId: cli.id,
        connectionMode: "webrtc",
        signedOffer: await offerEnvelope(cli),
      }),
    })
    const session = (await json(created)).session

    const requests = await Promise.all([
      app.request(`/remote/sessions/${session.id}/accept`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${auth.accessToken}` },
        body: JSON.stringify({ mobileDeviceId: mobile.id, signedAnswer: await answerEnvelope(mobile, "a") }),
      }),
      app.request(`/remote/sessions/${session.id}/accept`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${auth.accessToken}` },
        body: JSON.stringify({ mobileDeviceId: mobile.id, signedAnswer: await answerEnvelope(mobile, "b") }),
      }),
    ])
    expect(requests.map((res) => res.status).sort()).toEqual([200, 409])
  })
})

describe("device signatures and trust (remote control)", () => {
  function authed(token: string) {
    return { "content-type": "application/json", authorization: `Bearer ${token}` }
  }

  test("registration derives the fingerprint from the key and rejects non-JWK keys", async () => {
    const { app } = testApp()
    const auth = await register(app)
    const keys = await deviceKeyMaterial()
    const other = await deviceKeyMaterial()

    const spoofed = await app.request("/devices/register", {
      method: "POST",
      headers: authed(auth.accessToken),
      body: JSON.stringify({ name: "spoof", platform: "mobile", encryptionPublicKey: keys.publicJwk, signingPublicKey: keys.publicJwk, signingKeyFingerprint: other.fingerprint }),
    })
    expect(spoofed.status).toBe(400)
    expect((await json(spoofed)).error.code).toBe("fingerprint_mismatch")

    const notJwk = await app.request("/devices/register", {
      method: "POST",
      headers: authed(auth.accessToken),
      body: JSON.stringify({ name: "raw", platform: "mobile", encryptionPublicKey: "x".repeat(40), signingPublicKey: "y".repeat(40), signingKeyFingerprint: "fp_" + "z".repeat(20) }),
    })
    expect(notJwk.status).toBe(400)
    expect((await json(notJwk)).error.code).toBe("invalid_signing_key")

    const privateJwk = JSON.stringify({ ...JSON.parse(keys.publicJwk), d: "A".repeat(43) })
    const withPrivate = await app.request("/devices/register", {
      method: "POST",
      headers: authed(auth.accessToken),
      body: JSON.stringify({ name: "leak", platform: "mobile", encryptionPublicKey: privateJwk, signingPublicKey: privateJwk, signingKeyFingerprint: await deviceKeyFingerprint(privateJwk) }),
    })
    expect(withPrivate.status).toBe(400)
  })

  test("a bearer token alone cannot make the desktop trust an attacker device", async () => {
    const { app } = testApp()
    const auth = await register(app)
    const desktop = await addDevice(app, auth.accessToken, "cli", "desktop")
    // An attacker with a stolen access token registers a phone with their own key.
    const attacker = await addDevice(app, auth.accessToken, "mobile", "attacker")

    const unsigned = await app.request(`/devices/${desktop.id}/trust`, {
      method: "POST",
      headers: authed(auth.accessToken),
      body: JSON.stringify({ sourceDeviceId: attacker.id, scope: "remote" }),
    })
    expect(unsigned.status).toBe(400)

    // Signing the grant with the attacker's own key does not help: the target must sign.
    const issuedAt = new Date().toISOString()
    const payload = trustGrantPayload({
      userId: await userIdOf(app, auth.accessToken),
      sourceDeviceId: attacker.id,
      sourceFingerprint: attacker.signingKeyFingerprint,
      targetDeviceId: desktop.id,
      targetFingerprint: desktop.signingKeyFingerprint,
      scope: "remote",
      issuedAt,
    })
    const selfSigned = await app.request(`/devices/${desktop.id}/trust`, {
      method: "POST",
      headers: authed(auth.accessToken),
      body: JSON.stringify({ sourceDeviceId: attacker.id, scope: "remote", grant: { issuedAt, signature: await signAs(attacker, payload) } }),
    })
    expect(selfSigned.status).toBe(403)
    expect((await json(selfSigned)).error.code).toBe("trust_grant_invalid")

    // A genuine grant for one scope cannot be replayed for a wider scope.
    const remoteGrant = JSON.parse(await trustBody(app, auth.accessToken, desktop, attacker, "remote"))
    const widened = await app.request(`/devices/${desktop.id}/trust`, {
      method: "POST",
      headers: authed(auth.accessToken),
      body: JSON.stringify({ ...remoteGrant, scope: "all" }),
    })
    expect(widened.status).toBe(403)

    const stale = await app.request(`/devices/${desktop.id}/trust`, {
      method: "POST",
      headers: authed(auth.accessToken),
      body: await trustBody(app, auth.accessToken, desktop, attacker, "remote", new Date(Date.now() - 10 * 60_000).toISOString()),
    })
    expect(stale.status).toBe(400)
    expect((await json(stale)).error.code).toBe("trust_grant_expired")

    // Without trust, the attacker phone cannot accept the desktop's session.
    const created = await app.request("/remote/sessions", {
      method: "POST",
      headers: authed(auth.accessToken),
      body: JSON.stringify({ desktopDeviceId: desktop.id, connectionMode: "webrtc", signedOffer: await offerEnvelope(desktop) }),
    })
    expect(created.status).toBe(201)
    const session = (await json(created)).session
    const accepted = await app.request(`/remote/sessions/${session.id}/accept`, {
      method: "POST",
      headers: authed(auth.accessToken),
      body: JSON.stringify({ mobileDeviceId: attacker.id, signedAnswer: await answerEnvelope(attacker) }),
    })
    expect(accepted.status).toBe(403)
    expect((await json(accepted)).error.code).toBe("device_not_trusted")
  })

  test("offers and answers must carry a valid signature from the named device", async () => {
    const { app } = testAppWithEnv(remoteEnv)
    const auth = await register(app)
    const desktop = await addDevice(app, auth.accessToken, "cli", "desktop")
    const phone = await addDevice(app, auth.accessToken, "mobile", "phone")
    const attacker = await addDevice(app, auth.accessToken, "mobile", "attacker")
    await app.request(`/devices/${desktop.id}/trust`, { method: "POST", headers: authed(auth.accessToken), body: await trustBody(app, auth.accessToken, desktop, phone, "remote") })

    // An offer that names the desktop's fingerprint but is signed by another key is rejected.
    const forgedOffer = { ...(await offerEnvelope(desktop)), signature: await signAs(attacker, "signed_offer_payload_payload") }
    const rejectedOffer = await app.request("/remote/sessions", {
      method: "POST",
      headers: authed(auth.accessToken),
      body: JSON.stringify({ desktopDeviceId: desktop.id, connectionMode: "webrtc", signedOffer: forgedOffer }),
    })
    expect(rejectedOffer.status).toBe(400)
    expect((await json(rejectedOffer)).error.code).toBe("remote_signature_invalid")

    const created = await app.request("/remote/sessions", {
      method: "POST",
      headers: authed(auth.accessToken),
      body: JSON.stringify({ desktopDeviceId: desktop.id, connectionMode: "webrtc", signedOffer: await offerEnvelope(desktop) }),
    })
    const session = (await json(created)).session

    // The trusted phone's id with an answer signed by the attacker is rejected.
    const forgedAnswer = { ...(await answerEnvelope(phone)), signature: await signAs(attacker, "signed_answer_payload_payload_a") }
    const rejectedAnswer = await app.request(`/remote/sessions/${session.id}/accept`, {
      method: "POST",
      headers: authed(auth.accessToken),
      body: JSON.stringify({ mobileDeviceId: phone.id, signedAnswer: forgedAnswer }),
    })
    expect(rejectedAnswer.status).toBe(400)
    expect((await json(rejectedAnswer)).error.code).toBe("remote_signature_invalid")

    const accepted = await app.request(`/remote/sessions/${session.id}/accept`, {
      method: "POST",
      headers: authed(auth.accessToken),
      body: JSON.stringify({ mobileDeviceId: phone.id, signedAnswer: await answerEnvelope(phone) }),
    })
    expect(accepted.status).toBe(200)

    // Heartbeats must name a participating device.
    const anonymous = await app.request(`/remote/sessions/${session.id}/heartbeat`, {
      method: "POST",
      headers: authed(auth.accessToken),
      body: JSON.stringify({ lastSequence: Number.MAX_SAFE_INTEGER }),
    })
    expect(anonymous.status).toBe(400)
    const outsider = await app.request(`/remote/sessions/${session.id}/heartbeat`, {
      method: "POST",
      headers: authed(auth.accessToken),
      body: JSON.stringify({ deviceId: attacker.id, lastSequence: Number.MAX_SAFE_INTEGER }),
    })
    expect(outsider.status).toBe(403)
  })

  test("secret transfers need the sender's signature and a fresh claim from the recipient", async () => {
    const { app } = testApp()
    const auth = await register(app)
    const cli = await addDevice(app, auth.accessToken, "cli", "desktop")
    const mobile = await addDevice(app, auth.accessToken, "mobile", "phone")
    await app.request(`/devices/${mobile.id}/trust`, { method: "POST", headers: authed(auth.accessToken), body: await trustBody(app, auth.accessToken, mobile, cli, "secret_transfer") })

    const envelope = await secretEnvelope(cli, mobile)
    const tampered = await app.request("/secrets/transfers", {
      method: "POST",
      headers: authed(auth.accessToken),
      body: JSON.stringify({ senderDeviceId: cli.id, recipientDeviceId: mobile.id, provider: "OpenCode", envelope: { ...envelope, ciphertext: "attacker_chosen_ciphertext" } }),
    })
    expect(tampered.status).toBe(400)
    expect((await json(tampered)).error.code).toBe("sender_signature_invalid")

    const created = await app.request("/secrets/transfers", {
      method: "POST",
      headers: authed(auth.accessToken),
      body: JSON.stringify({ senderDeviceId: cli.id, recipientDeviceId: mobile.id, provider: "OpenCode", envelope }),
    })
    expect(created.status).toBe(201)
    const transfer = (await json(created)).transfer

    const stale = await app.request(`/secrets/transfers/${transfer.id}/claim`, {
      method: "POST",
      headers: authed(auth.accessToken),
      body: await claimBody(transfer.id, mobile, new Date(Date.now() - 10 * 60_000).toISOString()),
    })
    expect(stale.status).toBe(400)

    // A claim naming the recipient but signed by another device is rejected.
    const issuedAt = new Date().toISOString()
    const forged = await app.request(`/secrets/transfers/${transfer.id}/claim`, {
      method: "POST",
      headers: authed(auth.accessToken),
      body: JSON.stringify({ deviceId: mobile.id, issuedAt, signature: await signAs(cli, secretClaimPayload({ transferId: transfer.id, recipientDeviceId: mobile.id, issuedAt })) }),
    })
    expect(forged.status).toBe(403)
    expect((await json(forged)).error.code).toBe("claim_signature_invalid")
  })
})

describe("access token revocation", () => {
  const authed = (token: string) => ({ "content-type": "application/json", authorization: `Bearer ${token}` })
  const me = (app: ReturnType<typeof createApp>, token: string) => app.request("/auth/me", { headers: { authorization: `Bearer ${token}` } })
  // iat has one-second resolution; wait past the second the token was issued in.
  const nextSecond = () => new Promise((resolve) => setTimeout(resolve, 1100))

  test("logout-all cuts off access tokens immediately", async () => {
    const { app } = testApp()
    const auth = await register(app)
    await nextSecond()
    expect((await app.request("/auth/logout-all", { method: "POST", headers: authed(auth.accessToken) })).status).toBe(200)
    expect((await me(app, auth.accessToken)).status).toBe(401)
    const login = await app.request("/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: "user@example.com", password: "correct horse battery" }) })
    expect((await me(app, (await json(login)).accessToken)).status).toBe(200)
  })

  test("password reset revokes access tokens and every other reset link", async () => {
    const { app } = testApp()
    const auth = await register(app)
    const request = () => app.request("/auth/password-reset/request", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: "user@example.com" }) })
    const first = (await json(await request())).token
    const second = (await json(await request())).token
    await nextSecond()
    const confirm = (token: string, password: string) => app.request("/auth/password-reset/confirm", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token, password }) })
    expect((await confirm(first, "a new strong passphrase")).status).toBe(200)
    expect((await me(app, auth.accessToken)).status).toBe(401)
    expect((await confirm(second, "attacker chosen passphrase")).status).toBe(400)
  })

  test("refresh token reuse cuts off access tokens", async () => {
    const { app } = testApp()
    const auth = await register(app)
    const refresh = (token: string) => app.request("/auth/refresh", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ refreshToken: token }) })
    expect((await refresh(auth.refreshToken)).status).toBe(200)
    await nextSecond()
    expect((await refresh(auth.refreshToken)).status).toBe(401)
    expect((await me(app, auth.accessToken)).status).toBe(401)
  })

  test("tokens for another issuer or audience are rejected", async () => {
    const { signAccessToken, verifyAccessToken } = await import("../src/crypto/tokens")
    const other = loadEnv({ NODE_ENV: "test", JWT_SECRET: "test-secret-test-secret-test-secret-test-secret", JWT_AUDIENCE: "aurict-gateway" })
    const token = await signAccessToken("usr_1", other)
    expect(await verifyAccessToken(token, other)).not.toBeNull()
    expect(await verifyAccessToken(token, env)).toBeNull()
  })
})

describe("email, login and limits", () => {
  test("verification and reset emails link to the web app with the token in the fragment", async () => {
    const { createRecordingMailer } = await import("../src/email/mailer")
    const mailer = createRecordingMailer()
    const app = createApp({ env, store: createMemoryStore(), mailer })
    const auth = await register(app)
    await app.request("/auth/email-verification/request", { method: "POST", headers: { authorization: `Bearer ${auth.accessToken}` } })
    await app.request("/auth/password-reset/request", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: "user@example.com" }) })
    expect(mailer.sent.map((m) => m.to)).toEqual(["user@example.com", "user@example.com"])
    expect(mailer.sent[0]!.text).toMatch(/https:\/\/aurict\.com\/auth\/verify-email#token=act_/)
    expect(mailer.sent[1]!.text).toMatch(/https:\/\/aurict\.com\/auth\/reset-password#token=act_/)
    const unknown = await app.request("/auth/password-reset/request", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: "nobody@example.com" }) })
    expect(unknown.status).toBe(200)
    expect(mailer.sent.length).toBe(2)
  })

  test("verification email needs a configured provider in production", async () => {
    const prod = loadEnv({ NODE_ENV: "production", JWT_SECRET: "prod-like-secret-prod-like-secret-prod-like", DATABASE_URL: "postgres://u:p@localhost:5432/db", CORS_ORIGINS: "https://aurict.com" })
    const store = createMemoryStore()
    const app = createApp({ env: prod, store, repo: createMemoryRepository(store), rateLimiter: createMemoryRateLimiter() })
    const auth = await register(app)
    const res = await app.request("/auth/email-verification/request", { method: "POST", headers: { authorization: `Bearer ${auth.accessToken}` } })
    expect(res.status).toBe(503)
    expect((await json(res)).error.code).toBe("email_not_configured")
  })

  test("login is limited per account even across client addresses", async () => {
    const { app } = testApp()
    await register(app)
    const statuses: number[] = []
    for (let i = 0; i < 11; i++) {
      const res = await app.request("/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json", "cf-connecting-ip": `203.0.113.${i}` },
        body: JSON.stringify({ email: "user@example.com", password: "wrong password here" }),
      })
      statuses.push(res.status)
    }
    expect(statuses.slice(0, 10).every((s) => s === 401)).toBe(true)
    expect(statuses[10]).toBe(429)
  })

  test("firebase re-authentication for deletion must be recent", async () => {
    const { app } = testAppWithEnv(firebaseEnv)
    const login = await app.request("/auth/firebase", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ idToken: firebaseToken({ uid: "fb-old-user-".repeat(8), email: "old@example.com", emailVerified: true }) }),
    })
    const auth = await json(login)
    const stale = await app.request("/auth/account", {
      method: "DELETE",
      headers: { "content-type": "application/json", authorization: `Bearer ${auth.accessToken}` },
      body: JSON.stringify({ confirmation: "old@example.com", firebaseIdToken: firebaseToken({ uid: "fb-old-user-".repeat(8), email: "old@example.com", emailVerified: true, authTime: Math.floor(Date.now() / 1000) - 3600 }) }),
    })
    expect(stale.status).toBe(401)
    expect((await json(stale)).error.code).toBe("reauthentication_required")
  })
})

describe("client address for rate limits", () => {
  test("normalises IPv6 to its /64 and unwraps IPv4-mapped addresses", async () => {
    const { normalizeIp } = await import("../src/middleware/rate-limit")
    expect(normalizeIp("2001:db8:1:2:aaaa::1")).toBe(normalizeIp("2001:db8:1:2:ffff:ffff:ffff:ffff"))
    expect(normalizeIp("2001:db8:1:2::1")).not.toBe(normalizeIp("2001:db8:1:3::1"))
    expect(normalizeIp("::ffff:198.51.100.7")).toBe("198.51.100.7")
  })

  test("the web app's forwarded address is trusted only with the shared secret", async () => {
    const secret = "proxy-secret-proxy-secret-proxy-secret-1"
    const proxied = loadEnv({ NODE_ENV: "test", JWT_SECRET: "test-secret-test-secret-test-secret-test-secret", TRUSTED_PROXY_SECRET: secret })
    const app = createApp({ env: proxied, store: createMemoryStore() })
    const attempt = (headers: Record<string, string>) => app.request("/auth/password-reset/request", {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify({ email: "x@example.com" }),
    })
    // Spoofed header without the secret: every request lands in the same bucket.
    for (let i = 0; i < 10; i++) expect((await attempt({ "x-aurict-client-ip": `198.51.100.${i}` })).status).toBe(200)
    expect((await attempt({ "x-aurict-client-ip": "198.51.100.99" })).status).toBe(429)
    // With the secret, each end user gets their own bucket.
    expect((await attempt({ "x-aurict-client-ip": "198.51.100.200", "x-aurict-proxy-secret": secret })).status).toBe(200)
  })
})

describe("request hygiene", () => {
  test("metrics label by route pattern, so random paths do not add series", async () => {
    const { createMemoryMetrics } = await import("../src/observability/metrics")
    const metrics = createMemoryMetrics()
    const app = createApp({ env, store: createMemoryStore(), metrics })
    for (let i = 0; i < 50; i++) await app.request(`/random-${crypto.randomUUID()}`)
    const auth = await register(app)
    await app.request("/auth/me", { headers: { authorization: `Bearer ${auth.accessToken}` } })
    const routes = Object.keys(metrics.snapshot().responsesByRoute)
    expect(routes).toContain("GET unmatched")
    expect(routes).toContain("GET /auth/me")
    expect(routes.length).toBeLessThan(6)
  })

  test("malformed JSON is a 400, not a 500", async () => {
    const { app } = testApp()
    const res = await app.request("/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: "{not json" })
    expect(res.status).toBe(400)
    expect((await json(res)).error.code).toBe("invalid_json")
  })

  test("bodies without content-length are limited while streaming", async () => {
    const small = loadEnv({ NODE_ENV: "test", JWT_SECRET: "test-secret-test-secret-test-secret-test-secret", REQUEST_BODY_LIMIT_BYTES: "1024" })
    const app = createApp({ env: small, store: createMemoryStore() })
    const chunk = new TextEncoder().encode("x".repeat(512))
    const body = new ReadableStream({ start(controller) { for (let i = 0; i < 8; i++) controller.enqueue(chunk); controller.close() } })
    const res = await app.request("/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body, duplex: "half" } as RequestInit)
    expect(res.status).toBe(413)
  })
})

describe("device login approval details", () => {
  test("lookup shows where the login started and whether it matches the approver's network", async () => {
    const proxied = loadEnv({ NODE_ENV: "test", JWT_SECRET: "test-secret-test-secret-test-secret-test-secret", TRUST_PROXY_HEADERS: "true" })
    const app = createApp({ env: proxied, store: createMemoryStore() })
    const auth = await register(app)
    const start = async (ip: string) => json(await app.request("/auth/device/start", {
      method: "POST",
      headers: { "content-type": "application/json", "cf-connecting-ip": ip, "cf-ipcountry": "TR" },
      body: JSON.stringify({ clientName: "Aurict CLI (linux)" }),
    }))
    const lookup = async (userCode: string, ip: string) => app.request("/auth/device/lookup", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${auth.accessToken}`, "cf-connecting-ip": ip },
      body: JSON.stringify({ userCode }),
    })
    const mine = await start("198.51.100.20")
    const same = await json(await lookup(mine.userCode, "198.51.100.77"))
    expect(same.request).toMatchObject({ clientName: "Aurict CLI (linux)", network: "198.51.100.0/24", country: "TR", sameNetworkAsYou: true })

    const foreign = await start("203.0.113.5")
    const other = await json(await lookup(foreign.userCode, "198.51.100.77"))
    expect(other.request.sameNetworkAsYou).toBe(false)

    expect((await lookup("ZZZZ-ZZZZ", "198.51.100.77")).status).toBe(404)
  })
})

describe("ed25519 access tokens", () => {
  const { generateKeyPairSync } = require("node:crypto") as typeof import("node:crypto")
  const pair = generateKeyPairSync("ed25519")
  const JWT_PRIVATE_KEY = Buffer.from(pair.privateKey.export({ type: "pkcs8", format: "der" })).toString("base64")
  const JWT_PUBLIC_KEY = Buffer.from(pair.publicKey.export({ type: "spki", format: "der" })).toString("base64")
  const keyedEnv = loadEnv({
    NODE_ENV: "test",
    JWT_SECRET: "test-secret-test-secret-test-secret-test-secret",
    JWT_PRIVATE_KEY,
    JWT_PUBLIC_KEY,
  })

  test("env rejects a private key without its public key", () => {
    expect(() => loadEnv({ NODE_ENV: "test", JWT_PRIVATE_KEY })).toThrow("JWT_PUBLIC_KEY")
    expect(() => loadEnv({ NODE_ENV: "test", JWT_PUBLIC_KEY })).toThrow("JWT_PUBLIC_KEY")
  })

  test("signs EdDSA tokens and verifies them", async () => {
    const { signAccessToken, verifyAccessToken } = await import("../src/crypto/tokens")
    const token = await signAccessToken("user_1", keyedEnv)
    const header = JSON.parse(Buffer.from(token.split(".")[0]!, "base64url").toString())
    expect(header.alg).toBe("EdDSA")
    expect(header.kid).toBeString()
    const claims = await verifyAccessToken(token, keyedEnv)
    expect(claims?.sub).toBe("user_1")
    expect(claims?.typ).toBe("access")
  })

  test("rejects HS256 tokens once an Ed25519 keypair is configured", async () => {
    const { signAccessToken, verifyAccessToken } = await import("../src/crypto/tokens")
    const legacyToken = await signAccessToken("user_legacy", env)
    expect(await verifyAccessToken(legacyToken, keyedEnv)).toBeNull()
    expect((await verifyAccessToken(legacyToken, env))?.sub).toBe("user_legacy")
  })

  test("rejects tampered EdDSA tokens and unknown algorithms", async () => {
    const { signAccessToken, verifyAccessToken } = await import("../src/crypto/tokens")
    const token = await signAccessToken("user_1", keyedEnv)
    const [header, payload] = token.split(".")
    const forgedPayload = Buffer.from(JSON.stringify({ sub: "user_2", typ: "access", iat: 0, exp: 4102444800 })).toString("base64url")
    expect(await verifyAccessToken(`${header}.${forgedPayload}.${token.split(".")[2]}`, keyedEnv)).toBeNull()
    const noneHeader = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url")
    expect(await verifyAccessToken(`${noneHeader}.${payload}.`, keyedEnv)).toBeNull()
  })

  test("rejects EdDSA tokens when no public key is configured", async () => {
    const { signAccessToken, verifyAccessToken } = await import("../src/crypto/tokens")
    const token = await signAccessToken("user_1", keyedEnv)
    expect(await verifyAccessToken(token, env)).toBeNull()
  })

  test("serves the public key at /.well-known/jwks.json", async () => {
    const { app } = testAppWithEnv(keyedEnv)
    const res = await app.request("/.well-known/jwks.json")
    expect(res.status).toBe(200)
    const body = await json(res)
    expect(body.keys).toHaveLength(1)
    expect(body.keys[0].kty).toBe("OKP")
    expect(body.keys[0].crv).toBe("Ed25519")
    expect(body.keys[0].alg).toBe("EdDSA")
    expect(Buffer.from(body.keys[0].x, "base64url")).toHaveLength(32)
  })

  test("jwks is empty when no keypair is configured", async () => {
    const { app } = testApp()
    const res = await app.request("/.well-known/jwks.json")
    expect(res.status).toBe(200)
    expect((await json(res)).keys).toHaveLength(0)
  })

  test("register and authenticated request work end-to-end with EdDSA", async () => {
    const { app } = testAppWithEnv(keyedEnv)
    const auth = await register(app)
    const res = await app.request("/auth/sessions", {
      headers: { authorization: `Bearer ${auth.accessToken}` },
    })
    expect(res.status).toBe(200)
  })
})

describe("security hardening", () => {
  const prodEnv = loadEnv({
    NODE_ENV: "production",
    JWT_SECRET: "prod-secret-prod-secret-prod-secret-prod-secret",
    DATABASE_URL: "postgres://aurict:aurict@example.com:5432/aurict",
    CORS_ORIGINS: "https://app.aurict.com",
    TRUST_PROXY_HEADERS: "true",
  })

  function prodApp() {
    const store = createMemoryStore()
    const db = { async ping() {}, async close() {} } as BackendDb
    return { app: createApp({ env: prodEnv, store, db, repo: createMemoryRepository(store), rateLimiter: createMemoryRateLimiter() }), store }
  }

  test("env defaults to production so a missing NODE_ENV never enables dev shortcuts", () => {
    expect(() => loadEnv({})).toThrow("JWT_SECRET")
  })

  test("rate limiting keys only on cf-connecting-ip, ignoring spoofable forwarding headers", async () => {
    const { app } = prodApp()
    for (let i = 0; i < 10; i++) {
      const res = await app.request("/auth/register", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "cf-connecting-ip": "198.51.100.1",
          "x-real-ip": `203.0.113.${i}`,
          "x-forwarded-for": `192.0.2.${i}`,
        },
        body: JSON.stringify({ email: `spoof-${i}@example.com`, password: "correct horse battery" }),
      })
      expect(res.status).toBe(201)
    }
    const limited = await app.request("/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json", "cf-connecting-ip": "198.51.100.1", "x-real-ip": "203.0.113.99" },
      body: JSON.stringify({ email: "spoof-limited@example.com", password: "correct horse battery" }),
    })
    expect(limited.status).toBe(429)
    const otherClient = await app.request("/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json", "cf-connecting-ip": "198.51.100.2" },
      body: JSON.stringify({ email: "other-client@example.com", password: "correct horse battery" }),
    })
    expect(otherClient.status).toBe(201)
  })

  test("password reset request does not reveal whether an account exists", async () => {
    const { app } = prodApp()
    await register(app)
    const request = (email: string) => app.request("/auth/password-reset/request", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
    })
    const existing = await request("user@example.com")
    const missing = await request("nobody@example.com")
    expect(existing.status).toBe(200)
    expect(await json(existing)).toEqual(await json(missing))
  })

  test("request ids from clients are only echoed when well-formed", async () => {
    const { app } = testApp()
    const bad = await app.request("/auth/refresh", {
      method: "POST",
      headers: { "content-type": "application/json", "x-request-id": "<script>alert(1)</script> " + "x".repeat(200) },
      body: JSON.stringify({ refreshToken: "x".repeat(40) }),
    })
    expect((await json(bad)).error.requestId).toStartWith("req_")
    const good = await app.request("/auth/refresh", {
      method: "POST",
      headers: { "content-type": "application/json", "x-request-id": "trace-123.abc" },
      body: JSON.stringify({ refreshToken: "x".repeat(40) }),
    })
    expect((await json(good)).error.requestId).toBe("trace-123.abc")
  })

  test("legal statute identifiers are validated before any upstream fetch", async () => {
    const { app } = testApp()
    const auth = await register(app)
    const res = await app.request("/legal/statute/TR/..%2F..%2Fetc", {
      headers: { authorization: `Bearer ${auth.accessToken}` },
    })
    expect(res.status).toBe(400)
    expect((await json(res)).error.code).toBe("invalid_identifier")
  })

  test("legal search escapes LIKE wildcards", async () => {
    const { escapeLikePattern } = await import("../src/legal/routes")
    expect(escapeLikePattern("50%_off\\")).toBe("50\\%\\_off\\\\")
  })
})
