import { expect } from "bun:test"
import type { createApp } from "../../src/app"
import { deviceKeyFingerprint, secretClaimPayload, secretTransferPayload, trustGrantPayload } from "../../src/crypto/signatures"

// Real Ed25519 keys for test devices, so every signature check in the API runs for real.
type App = ReturnType<typeof createApp>

async function json(res: Response) {
  return await res.json() as Record<string, any>
}

const deviceKeys = new Map<string, CryptoKey>()

export async function deviceKeyMaterial() {
  const pair = await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"]) as unknown as CryptoKeyPair
  const exported = await crypto.subtle.exportKey("jwk", pair.publicKey)
  const publicJwk = JSON.stringify({ kty: "OKP", crv: "Ed25519", x: exported.x, ext: true, key_ops: ["verify"] })
  return { privateKey: pair.privateKey, publicJwk, fingerprint: await deviceKeyFingerprint(publicJwk) }
}

export async function signWith(privateKey: CryptoKey, payload: string) {
  const sig = await crypto.subtle.sign({ name: "Ed25519" }, privateKey, new TextEncoder().encode(payload))
  return Buffer.from(sig).toString("base64url")
}

export async function signAs(device: Record<string, any>, payload: string) {
  const key = deviceKeys.get(device.id)
  if (!key) throw new Error(`No test key for device ${device.id}`)
  return await signWith(key, payload)
}

export async function addDevice(app: App, token: string, platform: "mobile" | "cli", name: string, verify = true) {
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

export async function userIdOf(app: App, token: string) {
  const res = await app.request("/auth/me", { headers: { authorization: `Bearer ${token}` } })
  return (await json(res)).user.id as string
}

/** Body for POST /devices/:target/trust, signed by the target device as the API requires. */
export async function trustBody(app: App, token: string, target: Record<string, any>, source: Record<string, any>, scope: string, issuedAt = new Date().toISOString()) {
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

export async function claimBody(transferId: string, recipient: Record<string, any>, issuedAt = new Date().toISOString()) {
  const signature = await signAs(recipient, secretClaimPayload({ transferId, recipientDeviceId: recipient.id, issuedAt }))
  return JSON.stringify({ deviceId: recipient.id, issuedAt, signature })
}

export async function secretEnvelope(sender: Record<string, any>, recipient: Record<string, any>, provider = "OpenCode") {
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

export async function offerEnvelope(device: Record<string, any>, transport = "webrtc") {
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

export async function answerEnvelope(device: Record<string, any>, suffix = "a", transport = "webrtc") {
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
