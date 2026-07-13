import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import { createApp } from "../src/app"
import { createDbClient, type BackendDb } from "../src/db/client"
import { loadEnv } from "../src/env"

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

  async function addDevice(token: string, platform: "mobile" | "cli", name: string) {
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

  function offerEnvelope(device: Record<string, any>) {
    return {
      version: 1,
      type: "offer",
      transport: "webrtc",
      payload: "signed_offer_payload_payload",
      signingKeyFingerprint: device.signingKeyFingerprint,
      signature: "sig_" + "o".repeat(40),
    }
  }

  function answerEnvelope(device: Record<string, any>, suffix: string) {
    return {
      version: 1,
      type: "answer",
      transport: "webrtc",
      payload: `signed_answer_payload_payload_${suffix}`,
      signingKeyFingerprint: device.signingKeyFingerprint,
      signature: "sig_" + suffix.repeat(40),
    }
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

    test("ready endpoint pings postgres", async () => {
      const res = await app.request("/ready")
      expect(res.status).toBe(200)
      expect(await json(res)).toEqual({ ok: true, db: "ok" })
    })

    test("auth, trusted secret transfer, and remote signaling persist through postgres repository", async () => {
      const auth = await register()
      const cli = await addDevice(auth.accessToken, "cli", "desktop")
      const mobile = await addDevice(auth.accessToken, "mobile", "phone")

      const trustSecret = await app.request(`/devices/${mobile.id}/trust`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${auth.accessToken}` },
        body: JSON.stringify({ sourceDeviceId: cli.id, scope: "secret_transfer" }),
      })
      expect(trustSecret.status).toBe(201)

      const transferRes = await app.request("/secrets/transfers", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${auth.accessToken}` },
        body: JSON.stringify({
          senderDeviceId: cli.id,
          recipientDeviceId: mobile.id,
          provider: "OpenCode",
          envelope: secretEnvelope(cli, mobile),
        }),
      })
      expect(transferRes.status).toBe(201)
      const transfer = (await json(transferRes)).transfer

      const claimRequests = await Promise.all([
        app.request(`/secrets/transfers/${transfer.id}/claim`, { method: "POST", headers: { authorization: `Bearer ${auth.accessToken}` } }),
        app.request(`/secrets/transfers/${transfer.id}/claim`, { method: "POST", headers: { authorization: `Bearer ${auth.accessToken}` } }),
      ])
      expect(claimRequests.map((res) => res.status).sort()).toEqual([200, 409])

      const trustRemote = await app.request(`/devices/${cli.id}/trust`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${auth.accessToken}` },
        body: JSON.stringify({ sourceDeviceId: mobile.id, scope: "remote" }),
      })
      expect(trustRemote.status).toBe(201)

      const sessionRes = await app.request("/remote/sessions", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${auth.accessToken}` },
        body: JSON.stringify({
          desktopDeviceId: cli.id,
          connectionMode: "webrtc",
          signedOffer: offerEnvelope(cli),
        }),
      })
      expect(sessionRes.status).toBe(201)
      const session = (await json(sessionRes)).session

      const acceptRequests = await Promise.all([
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
      expect(acceptRequests.map((res) => res.status).sort()).toEqual([200, 409])
    })
  })
}
