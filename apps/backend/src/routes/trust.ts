import { Hono } from "hono"
import { z } from "zod"
import { newId, now } from "../crypto/ids"
import { requireAuth } from "../middleware/auth"
import { assertVerifiedDevice, ownedDevice } from "./devices"
import type { AppBindings } from "../types"

const trustSchema = z.object({
  sourceDeviceId: z.string().min(1),
  scope: z.enum(["remote", "secret_transfer", "all"]).default("all"),
}).strict()

export const trustRoutes = new Hono<AppBindings>()
  .use("/devices/*", requireAuth)
  .post("/devices/:id/trust", async (c) => {
    const body = trustSchema.parse(await c.req.json())
    const target = await ownedDevice(c, c.req.param("id"))
    const source = await ownedDevice(c, body.sourceDeviceId)
    assertVerifiedDevice(c, target)
    assertVerifiedDevice(c, source)
    const createdAt = now()
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
