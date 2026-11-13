import { Hono } from "hono"
import { z } from "zod"
import { newId, now } from "../crypto/ids"
import { trustGrantPayload, verifyDeviceSignature } from "../crypto/signatures"
import { requireAuth } from "../middleware/auth"
import { ApiError } from "../middleware/errors"
import { rateLimit } from "../middleware/rate-limit"
import { assertVerifiedDevice, ownedDevice } from "./devices"
import type { AppBindings } from "../types"

// A grant is only valid shortly after it was signed, so a captured grant cannot be replayed later.
const GRANT_MAX_AGE_MS = 5 * 60_000
const GRANT_MAX_SKEW_MS = 60_000

const trustSchema = z.object({
  sourceDeviceId: z.string().min(1).max(64),
  scope: z.enum(["remote", "secret_transfer", "all"]).default("all"),
  // The target device (the one that will be controlled or receive secrets) signs the grant
  // with its own key. A bearer token alone therefore cannot make a device trust another one.
  grant: z.object({
    issuedAt: z.string().datetime({ offset: false }),
    signature: z.string().min(32).max(4096),
  }).strict(),
}).strict()

export const trustRoutes = new Hono<AppBindings>()
  .use("/devices/*", requireAuth)
  .post("/devices/:id/trust", rateLimit(20, 60_000, "device-trust"), async (c) => {
    const body = trustSchema.parse(await c.req.json())
    const target = await ownedDevice(c, c.req.param("id") ?? "")
    const source = await ownedDevice(c, body.sourceDeviceId)
    if (!target.verifiedAt || !source.verifiedAt) {
      throw new ApiError(403, "Both devices must be verified before trust is created.", "device_not_verified")
    }
    if (source.id === target.id) throw new ApiError(400, "A device cannot trust itself.", "invalid_trust")
    const createdAt = now()
    const issuedAt = new Date(body.grant.issuedAt)
    const age = createdAt.getTime() - issuedAt.getTime()
    if (age > GRANT_MAX_AGE_MS || age < -GRANT_MAX_SKEW_MS) {
      throw new ApiError(400, "Trust grant is expired or not yet valid.", "trust_grant_expired")
    }
    const payload = trustGrantPayload({
      userId: c.get("user")!.id,
      sourceDeviceId: source.id,
      sourceFingerprint: source.signingKeyFingerprint,
      targetDeviceId: target.id,
      targetFingerprint: target.signingKeyFingerprint,
      scope: body.scope,
      issuedAt: body.grant.issuedAt,
    })
    if (!(await verifyDeviceSignature(target.signingPublicKey, payload, body.grant.signature))) {
      throw new ApiError(403, "Trust grant must be signed by the target device.", "trust_grant_invalid")
    }
    const trust = {
      id: newId("trust"),
      userId: c.get("user")!.id,
      sourceDeviceId: source.id,
      targetDeviceId: target.id,
      scope: body.scope,
      createdAt,
    }
    await c.get("repo").createTrust(trust)
    await c.get("repo").addAuditLog({
      id: newId("aud"),
      userId: c.get("user")!.id,
      deviceId: source.id,
      event: "device.trust.created",
      metadataJson: JSON.stringify({
        sourceDeviceId: source.id,
        sourceFingerprint: source.signingKeyFingerprint,
        targetDeviceId: target.id,
        targetFingerprint: target.signingKeyFingerprint,
        scope: trust.scope,
        grantIssuedAt: body.grant.issuedAt,
      }),
      createdAt,
    })
    return c.json({ ok: true, trust: serializeTrust(trust) }, 201)
  })
  .post("/devices/:id/untrust", async (c) => {
    const body = z.object({ sourceDeviceId: z.string().min(1) }).strict().parse(await c.req.json())
    const target = await ownedDevice(c, c.req.param("id"))
    const source = await ownedDevice(c, body.sourceDeviceId)
    assertVerifiedDevice(c, target)
    assertVerifiedDevice(c, source)
    const revokedAt = now()
    await c.get("repo").revokeTrusts(c.get("user")!.id, source.id, target.id, revokedAt)
    await c.get("repo").addAuditLog({
      id: newId("aud"),
      userId: c.get("user")!.id,
      deviceId: source.id,
      event: "device.trust.revoked",
      metadataJson: JSON.stringify({
        sourceDeviceId: source.id,
        sourceFingerprint: source.signingKeyFingerprint,
        targetDeviceId: target.id,
        targetFingerprint: target.signingKeyFingerprint,
      }),
      createdAt: revokedAt,
    })
    return c.json({ ok: true })
  })
  .get("/devices/trusts/list", async (c) => {
    const user = c.get("user")!
    const trusts = (await c.get("repo").listActiveTrusts(user.id)).map(serializeTrust)
    return c.json({ ok: true, trusts })
  })

function serializeTrust(trust: { id: string; sourceDeviceId: string; targetDeviceId: string; scope: string; createdAt: Date }) {
  return {
    id: trust.id,
    sourceDeviceId: trust.sourceDeviceId,
    targetDeviceId: trust.targetDeviceId,
    scope: trust.scope,
    createdAt: trust.createdAt.toISOString(),
  }
}
