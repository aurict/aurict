import { describe, expect, test } from "bun:test"
import { createApp } from "../src/app"
import type { BackendDb } from "../src/db/client"
import { loadEnv } from "../src/env"
import { createMemoryStore } from "../src/store/memory"
import { createMemoryRepository } from "../src/store/repository"
import { createMemoryRateLimiter } from "../src/middleware/rate-limit"

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

function firebaseToken(claims: { uid: string; email: string; emailVerified: boolean; signInProvider?: string }) {
  return `test.${Buffer.from(JSON.stringify(claims)).toString("base64url")}`
}

async function addDevice(app: ReturnType<typeof createApp>, token: string, platform: "mobile" | "cli", name: string, verify = true) {
  const res = await app.request("/devices/register", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify({
      name,
      platform,
      encryptionPublicKey: `enc_${name}_${"x".repeat(40)}`,
      signingPublicKey: `sig_${name}_${"y".repeat(40)}`,
      signingKeyFingerprint: `fp_${name}_${"z".repeat(20)}`,
    }),
  })
  expect(res.status).toBe(201)
  const body = await json(res)
  if (!verify) return body.device
  const verified = await app.request(`/devices/${body.device.id}/verify`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify({
      challenge: body.verification.challenge,
      signature: "sig_" + "v".repeat(40),
      algorithm: "ed25519",
    }),
  })
  expect(verified.status).toBe(200)
  return (await json(verified)).device
}

function secretEnvelope(sender: Record<string, any>, recipient: Record<string, any>) {
  return {
    version: 1,
    algorithm: "xchacha20-poly1305",
    nonce: "nonce_nonce",
    ciphertext: "ciphertext_payload_payload",
    recipientKeyFingerprint: recipient.signingKeyFingerprint,
    senderKeyFingerprint: sender.signingKeyFingerprint,
    senderSignature: "sig_" + "s".repeat(40),
  }
}

function offerEnvelope(device: Record<string, any>, transport = "webrtc") {
  return {
    version: 1,
    type: "offer",
    transport,
    payload: "signed_offer_payload_payload",
    signingKeyFingerprint: device.signingKeyFingerprint,
    signature: "sig_" + "o".repeat(40),
  }
}

function answerEnvelope(device: Record<string, any>, suffix = "a", transport = "webrtc") {
  return {
    version: 1,
    type: "answer",
    transport,
    payload: `signed_answer_payload_payload_${suffix}`,
    signingKeyFingerprint: device.signingKeyFingerprint,
    signature: "sig_" + suffix.repeat(40),
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
      body: JSON.stringify({ sourceDeviceId: cli.id, scope: "all" }),
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
      body: JSON.stringify({ sourceDeviceId: cli.id, scope: "all" }),
    })

    const rejected = await app.request("/secrets/transfers", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${auth.accessToken}` },
      body: JSON.stringify({
        senderDeviceId: cli.id,
        recipientDeviceId: mobile.id,
        provider: "OpenCode",
        apiKey: "sk-plaintext-should-not-pass",
        envelope: secretEnvelope(cli, mobile),
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
        envelope: { ...secretEnvelope(cli, mobile), algorithm: "unsupported" },
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
        envelope: secretEnvelope(cli, mobile),
      }),
    })
    expect(created.status).toBe(201)
    const transfer = (await json(created)).transfer
    expect(transfer.envelope.ciphertext).toBe("ciphertext_payload_payload")

    const claimed = await app.request(`/secrets/transfers/${transfer.id}/claim`, {
      method: "POST",
      headers: { authorization: `Bearer ${auth.accessToken}` },
    })
    expect(claimed.status).toBe(200)

    const replay = await app.request(`/secrets/transfers/${transfer.id}/claim`, {
      method: "POST",
      headers: { authorization: `Bearer ${auth.accessToken}` },
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
      body: JSON.stringify({ sourceDeviceId: cli.id, scope: "all" }),
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

    const verified = await app.request(`/devices/${cli.id}/verify`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${auth.accessToken}` },
      body: JSON.stringify({
        challenge: rawDevice.registrationChallenge,
        signature: "sig_" + "x".repeat(40),
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
      body: JSON.stringify({ sourceDeviceId: cli.id, scope: "secret_transfer" }),
    })

    const created = await app.request("/secrets/transfers", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${auth.accessToken}` },
      body: JSON.stringify({
        senderDeviceId: cli.id,
        recipientDeviceId: mobile.id,
        provider: "OpenCode",
        envelope: secretEnvelope(cli, mobile),
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
      headers: { authorization: `Bearer ${auth.accessToken}` },
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
      body: JSON.stringify({ sourceDeviceId: cli.id, scope: "secret_transfer" }),
    })

    const created = await app.request("/secrets/transfers", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${auth.accessToken}` },
      body: JSON.stringify({
        senderDeviceId: cli.id,
        recipientDeviceId: mobile.id,
        provider: "OpenCode",
        envelope: secretEnvelope(cli, mobile),
      }),
    })
    const transfer = (await json(created)).transfer

    const requests = await Promise.all([
      app.request(`/secrets/transfers/${transfer.id}/claim`, { method: "POST", headers: { authorization: `Bearer ${auth.accessToken}` } }),
      app.request(`/secrets/transfers/${transfer.id}/claim`, { method: "POST", headers: { authorization: `Bearer ${auth.accessToken}` } }),
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
      body: JSON.stringify({ sourceDeviceId: mobile.id, scope: "remote" }),
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
        signedOffer: offerEnvelope(cli),
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
        signedOffer: offerEnvelope(cli, "tunnel"),
      }),
    })
    expect(mismatch.status).toBe(400)

    const accepted = await app.request(`/remote/sessions/${session.id}/accept`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${auth.accessToken}` },
      body: JSON.stringify({
        mobileDeviceId: mobile.id,
        signedAnswer: answerEnvelope(mobile),
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
      body: JSON.stringify({ sourceDeviceId: mobile.id, scope: "remote" }),
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
        signedOffer: { ...offerEnvelope(cli), signingKeyFingerprint: "wrong_fingerprint_value" },
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
        signedOffer: offerEnvelope(cli),
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
        signedOffer: offerEnvelope(cli),
      }),
    })
    expect(second.status).toBe(409)
    expect((await json(second)).error.code).toBe("remote_session_limit")

    const accepted = await app.request(`/remote/sessions/${session.id}/accept`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${auth.accessToken}` },
      body: JSON.stringify({
        mobileDeviceId: mobile.id,
        signedAnswer: answerEnvelope(mobile),
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
      body: JSON.stringify({ sourceDeviceId: mobile.id, scope: "remote" }),
    })

    const created = await app.request("/remote/sessions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${auth.accessToken}` },
      body: JSON.stringify({
        desktopDeviceId: cli.id,
        connectionMode: "webrtc",
        signedOffer: offerEnvelope(cli),
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
        signedAnswer: answerEnvelope(mobile),
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
      body: JSON.stringify({ sourceDeviceId: mobile.id, scope: "remote" }),
    })

    const created = await app.request("/remote/sessions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${auth.accessToken}` },
      body: JSON.stringify({
        desktopDeviceId: cli.id,
        connectionMode: "webrtc",
        signedOffer: offerEnvelope(cli),
      }),
    })
    const session = (await json(created)).session

    const requests = await Promise.all([
      app.request(`/remote/sessions/${session.id}/accept`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${auth.accessToken}` },
        body: JSON.stringify({ mobileDeviceId: mobile.id, signedAnswer: answerEnvelope(mobile, "a") }),
      }),
      app.request(`/remote/sessions/${session.id}/accept`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${auth.accessToken}` },
        body: JSON.stringify({ mobileDeviceId: mobile.id, signedAnswer: answerEnvelope(mobile, "b") }),
      }),
    ])
    expect(requests.map((res) => res.status).sort()).toEqual([200, 409])
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
