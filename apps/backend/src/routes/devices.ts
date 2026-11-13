import { Hono } from "hono"
import { z } from "zod"
import { addSeconds, newId, now } from "../crypto/ids"
import { deviceKeyFingerprint, parseDevicePublicKey, verifyDeviceSignature } from "../crypto/signatures"
import { requireAuth } from "../middleware/auth"
import { ApiError } from "../middleware/errors"
import { isDeviceActive, publicDevice } from "../store/policy"
import type { AppBindings } from "../types"

const deviceSchema = z.object({
  name: z.string().min(1).max(80),
  platform: z.enum(["mobile", "cli", "desktop", "web"]),
  encryptionPublicKey: z.string().min(32).max(2048),
  signingPublicKey: z.string().min(32).max(2048),
  signingKeyFingerprint: z.string().min(16).max(128),
}).strict()

const verifyDeviceSchema = z.object({
  challenge: z.string().min(16).max(256),
  signature: z.string().min(32).max(4096),
  algorithm: z.enum(["ed25519", "ecdsa-p256-sha256"]).default("ed25519"),
}).strict()

export const deviceRoutes = new Hono<AppBindings>()
  .use("/devices/*", requireAuth)
  .post("/devices/register", async (c) => {
    const body = deviceSchema.parse(await c.req.json())
    const user = c.get("user")!
    const repo = c.get("repo")
    // The fingerprint is derived from the key, never taken on the client's word: peers and the
    // server compare fingerprints, so a client-chosen one would let a device impersonate another.
    if (!parseDevicePublicKey(body.signingPublicKey)) {
      throw new ApiError(400, "Signing key must be an Ed25519 or P-256 public JWK.", "invalid_signing_key")
    }
    if (body.signingKeyFingerprint !== await deviceKeyFingerprint(body.signingPublicKey)) {
      throw new ApiError(400, "Signing key fingerprint does not match the signing key.", "fingerprint_mismatch")
    }
    if (await repo.findActiveDeviceByFingerprint(body.signingKeyFingerprint)) {
      throw new ApiError(409, "Device signing key is already registered.", "device_exists")
    }
    const createdAt = now()
    const challenge = newId("dvc")
    const device = {
      id: newId("dev"),
      userId: user.id,
      ...body,
      registrationChallenge: challenge,
      registrationChallengeExpiresAt: addSeconds(createdAt, 600),
      createdAt,
      lastSeenAt: createdAt,
    }
    await repo.createDevice(device)
    await repo.addAuditLog({
      id: newId("aud"),
      userId: user.id,
      deviceId: device.id,
      event: "device.registered",
      metadataJson: JSON.stringify({ platform: device.platform, signingKeyFingerprint: device.signingKeyFingerprint }),
      createdAt,
    })
    return c.json({
      ok: true,
      device: publicDevice(device),
      verification: {
        challenge,
        expiresAt: device.registrationChallengeExpiresAt.toISOString(),
        algorithms: ["ed25519", "ecdsa-p256-sha256"],
      },
    }, 201)
  })
  .get("/devices", async (c) => {
    const user = c.get("user")!
    const devices = (await c.get("repo").listDevices(user.id)).map(publicDevice)
    return c.json({ ok: true, devices })
  })
  .get("/devices/:id", async (c) => {
    const device = await ownedDevice(c, c.req.param("id"))
    return c.json({ ok: true, device: publicDevice(device) })
  })
  .post("/devices/:id/heartbeat", async (c) => {
    const device = await ownedDevice(c, c.req.param("id"))
    device.lastSeenAt = now()
    await c.get("repo").updateDevice(device)
    await c.get("repo").touchUserPresence(c.get("user")!.id, device.lastSeenAt)
    return c.json({ ok: true, device: publicDevice(device) })
  })
  .post("/devices/:id/rename", async (c) => {
    const body = z.object({ name: z.string().min(1).max(80) }).strict().parse(await c.req.json())
    const device = await ownedDevice(c, c.req.param("id"))
    device.name = body.name
    await c.get("repo").updateDevice(device)
    return c.json({ ok: true, device: publicDevice(device) })
  })
  .post("/devices/:id/verify", async (c) => {
    const body = verifyDeviceSchema.parse(await c.req.json())
    const device = await ownedDevice(c, c.req.param("id"))
    if (device.verifiedAt) return c.json({ ok: true, device: publicDevice(device) })
    if (!device.registrationChallenge || !device.registrationChallengeExpiresAt) {
      throw new ApiError(409, "Device has no pending verification challenge.", "device_no_challenge")
    }
    if (device.registrationChallengeExpiresAt <= now()) {
      throw new ApiError(410, "Device verification challenge expired.", "device_challenge_expired")
    }
    if (body.challenge !== device.registrationChallenge) {
      throw new ApiError(400, "Device verification challenge mismatch.", "device_challenge_mismatch")
    }
    const signatureValid = await verifyDeviceSignature(device.signingPublicKey, body.challenge, body.signature)
    if (!signatureValid) throw new ApiError(400, "Device verification signature is invalid.", "device_signature_invalid")
    device.verifiedAt = now()
    delete device.registrationChallenge
    delete device.registrationChallengeExpiresAt
    await c.get("repo").updateDevice(device)
    await c.get("repo").addAuditLog({
      id: newId("aud"),
      userId: c.get("user")!.id,
      deviceId: device.id,
      event: "device.verified",
      metadataJson: JSON.stringify({ algorithm: parseDevicePublicKey(device.signingPublicKey)?.algorithm, signingKeyFingerprint: device.signingKeyFingerprint }),
      createdAt: device.verifiedAt,
    })
    return c.json({ ok: true, device: publicDevice(device) })
  })
  .post("/devices/:id/revoke", async (c) => {
    const device = await ownedDevice(c, c.req.param("id"))
    device.revokedAt = now()
    await c.get("repo").revokeDeviceAndTrusts(c.get("user")!.id, device.id, device.revokedAt)
    return c.json({ ok: true })
  })

export async function ownedDevice(c: { get: (key: "user" | "repo") => any }, id: string) {
  const user = c.get("user")
  const device = await c.get("repo").getDevice(user.id, id)
  if (!device || device.userId !== user.id) throw new ApiError(404, "Device not found.", "not_found")
  if (!isDeviceActive(device)) throw new ApiError(410, "Device is revoked.", "device_revoked")
  return device
}

export function assertVerifiedDevice(c: { get: (key: "env") => any }, device: { verifiedAt?: Date }) {
  if (c.get("env").REQUIRE_DEVICE_VERIFICATION && !device.verifiedAt) {
    throw new ApiError(403, "Device must be verified before this operation.", "device_not_verified")
  }
}
