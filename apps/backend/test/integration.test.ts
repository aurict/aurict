import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import { createApp } from "../src/app"
import { createDbClient, type BackendDb } from "../src/db/client"
import { loadEnv } from "../src/env"
import { addDevice as addSignedDevice, answerEnvelope, claimBody, offerEnvelope, secretEnvelope, trustBody } from "./support/signing"

const databaseUrl = process.env.DATABASE_URL

async function json(res: Response) {
  return await res.json() as Record<string, any>
}

if (!databaseUrl) {
  test.skip("backend postgres integration requires DATABASE_URL", () => {})
} else {
  const env = loadEnv({
    NODE_ENV: "test",
    JWT_SECRET: "test-secret-test-secret-test-secret-test-secret",
    DATABASE_URL: databaseUrl,
    REDIS_URL: process.env.REDIS_URL,
  })

  let db: BackendDb | undefined
  let app: ReturnType<typeof createApp>

  async function register() {
    const res = await app.request("/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "integration@example.com", password: "correct horse battery" }),
    })
    expect(res.status).toBe(201)
    return json(res)
  }

  describe("backend postgres integration", () => {
    beforeAll(async () => {
      db = createDbClient(env)
      if (!db) throw new Error("DATABASE_URL is required for integration tests.")
      await db.client`
        truncate table
          audit_logs,
          auth_identities,
          device_trusts,
          devices,
          rate_limits,
          refresh_tokens,
          remote_sessions,
          secret_transfers,
          users
        cascade
      `
      app = createApp({ env, db })
    })

    afterAll(async () => {
      await db?.close()
    })

    test("firebase link to an unverified account revokes pre-existing access in postgres", async () => {
      const firebaseApp = createApp({ env: { ...env, FIREBASE_PROJECT_ID: "aurict-test" }, db: db! })
      const registered = await firebaseApp.request("/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "squatted@example.com", password: "correct horse battery" }),
      })
      expect(registered.status).toBe(201)
      const squatter = await json(registered)
      const claims = { uid: "firebase-owner".repeat(8), email: "squatted@example.com", emailVerified: true }
      const linked = await firebaseApp.request("/auth/firebase", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ idToken: `test.${Buffer.from(JSON.stringify(claims)).toString("base64url")}` }),
      })
      expect(linked.status).toBe(200)
      const login = await firebaseApp.request("/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "squatted@example.com", password: "correct horse battery" }),
      })
      expect(login.status).toBe(401)
      const refreshed = await firebaseApp.request("/auth/refresh", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ refreshToken: squatter.refreshToken }),
      })
      expect(refreshed.status).toBe(401)
    })

    test("ready endpoint pings postgres", async () => {
      const res = await app.request("/ready")
      expect(res.status).toBe(200)
      expect(await json(res)).toEqual({ ok: true, db: "ok" })
    })

    test("auth, trusted secret transfer, and remote signaling persist through postgres repository", async () => {
      const auth = await register()
      const cli = await addSignedDevice(app, auth.accessToken, "cli", "desktop")
      const mobile = await addSignedDevice(app, auth.accessToken, "mobile", "phone")

      const trustSecret = await app.request(`/devices/${mobile.id}/trust`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${auth.accessToken}` },
        body: await trustBody(app, auth.accessToken, mobile, cli, "secret_transfer"),
      })
      expect(trustSecret.status).toBe(201)

      const transferRes = await app.request("/secrets/transfers", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${auth.accessToken}` },
        body: JSON.stringify({
          senderDeviceId: cli.id,
          recipientDeviceId: mobile.id,
          provider: "OpenCode",
          envelope: await secretEnvelope(cli, mobile),
        }),
      })
      expect(transferRes.status).toBe(201)
      const transfer = (await json(transferRes)).transfer

      const claim = async () => app.request(`/secrets/transfers/${transfer.id}/claim`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${auth.accessToken}` },
        body: await claimBody(transfer.id, mobile),
      })
      const claimRequests = await Promise.all([claim(), claim()])
      expect(claimRequests.map((res) => res.status).sort()).toEqual([200, 409])
      // The ciphertext was handed out once and is gone from the database.
      const [row] = await db!.client`select ciphertext from secret_transfers where id = ${transfer.id}`
      expect(row!.ciphertext).toBe("")

      const trustRemote = await app.request(`/devices/${cli.id}/trust`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${auth.accessToken}` },
        body: await trustBody(app, auth.accessToken, cli, mobile, "remote"),
      })
      expect(trustRemote.status).toBe(201)

      const sessionRes = await app.request("/remote/sessions", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${auth.accessToken}` },
        body: JSON.stringify({
          desktopDeviceId: cli.id,
          connectionMode: "webrtc",
          signedOffer: await offerEnvelope(cli),
        }),
      })
      expect(sessionRes.status).toBe(201)
      const session = (await json(sessionRes)).session

      const acceptRequests = await Promise.all([
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
      expect(acceptRequests.map((res) => res.status).sort()).toEqual([200, 409])
    })
  })
}
