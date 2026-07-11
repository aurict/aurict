import { Hono } from "hono"
import { z } from "zod"
import { addSeconds, newId, now } from "../crypto/ids"
import { requireAuth } from "../middleware/auth"
import { ApiError } from "../middleware/errors"
import { containsPlaintextSecret } from "../store/policy"
import type { AppBindings } from "../types"
import { assertVerifiedDevice, ownedDevice } from "./devices"

const secretEnvelopeSchema = z.object({
  version: z.literal(1),
  algorithm: z.enum(["xchacha20-poly1305", "aes-256-gcm"]),
  nonce: z.string().min(8).max(256),
  ciphertext: z.string().min(16).max(64_000),
  recipientKeyFingerprint: z.string().min(16).max(128),
  senderKeyFingerprint: z.string().min(16).max(128),
  senderSignature: z.string().min(32).max(4096),
}).strict()

const createSecretTransferSchema = z.object({
  senderDeviceId: z.string().min(1),
  recipientDeviceId: z.string().min(1),
  provider: z.string().min(1).max(80),
  envelope: secretEnvelopeSchema,
  ttlSeconds: z.number().int().positive().max(600).default(600),
}).strict()

export const secretRoutes = new Hono<AppBindings>()
  .use("/secrets/*", requireAuth)
  .post("/secrets/transfers", async (c) => {
    const raw = await c.req.json()
    if (containsPlaintextSecret(raw)) {
      throw new ApiError(400, "Secret transfers accept ciphertext only.", "plaintext_secret_rejected")
    }
    const body = createSecretTransferSchema.parse(raw)
    const user = c.get("user")!
    const sender = await ownedDevice(c, body.senderDeviceId)
    const recipient = await ownedDevice(c, body.recipientDeviceId)
    assertVerifiedDevice(c, sender)
    assertVerifiedDevice(c, recipient)
    if (sender.userId !== user.id || recipient.userId !== user.id) throw new ApiError(403, "Device mismatch.", "forbidden")
    if (!(await c.get("repo").hasTrust(user.id, sender.id, recipient.id, "secret_transfer"))) {
      throw new ApiError(403, "Recipient device is not trusted for secret transfer.", "device_not_trusted")
    }
    const createdAt = now()
    const transfer = {
      id: newId("sec"),
      userId: user.id,
      senderDeviceId: sender.id,
      recipientDeviceId: recipient.id,
      provider: body.provider,
      envelopeVersion: body.envelope.version,
      ciphertext: body.envelope.ciphertext,
      nonce: body.envelope.nonce,
      algorithm: body.envelope.algorithm,
      recipientKeyFingerprint: body.envelope.recipientKeyFingerprint,
      senderKeyFingerprint: body.envelope.senderKeyFingerprint,
      senderSignature: body.envelope.senderSignature,
      expiresAt: addSeconds(createdAt, body.ttlSeconds),
      createdAt,
    }
    await c.get("repo").createSecretTransfer(transfer)
    return c.json({ ok: true, transfer: publicTransfer(transfer) }, 201)
  })
  .get("/secrets/transfers/inbox", async (c) => {
    const user = c.get("user")!
    const deviceId = c.req.query("deviceId")
    const transfers = (await c.get("repo").listSecretInbox(user.id, deviceId, now())).map(publicTransfer)
    return c.json({ ok: true, transfers })
  })
  .get("/secrets/transfers/:id", async (c) => {
    const transfer = await ownedTransfer(c, c.req.param("id"))
    return c.json({ ok: true, transfer: publicTransfer(transfer) })
  })
  .post("/secrets/transfers/:id/claim", async (c) => {
    const result = await c.get("repo").claimSecretTransfer(c.get("user")!.id, c.req.param("id"), now())
    if (result.status === "not_found") throw new ApiError(404, "Transfer not found.", "not_found")
    if (result.status === "revoked") throw new ApiError(410, "Transfer is revoked.", "transfer_revoked")
    if (result.status === "already_claimed") throw new ApiError(409, "Transfer already claimed.", "transfer_claimed")
    if (result.status === "expired") throw new ApiError(410, "Transfer expired.", "transfer_expired")
    if (result.status !== "claimed") throw new ApiError(500, "Unexpected transfer claim state.", "internal_error")
    return c.json({ ok: true, transfer: publicTransfer(result.transfer) })
  })
  .post("/secrets/transfers/:id/revoke", async (c) => {
    const transfer = await ownedTransfer(c, c.req.param("id"))
    transfer.revokedAt = now()
    await c.get("repo").updateSecretTransfer(transfer)
    return c.json({ ok: true })
  })

async function ownedTransfer(c: any, id: string) {
  const transfer = await c.get("repo").getSecretTransfer(c.get("user").id, id)
  if (!transfer || transfer.userId !== c.get("user").id) throw new ApiError(404, "Transfer not found.", "not_found")
  return transfer
}

function publicTransfer(transfer: {
  id: string
  senderDeviceId: string
  recipientDeviceId: string
  provider: string
  envelopeVersion: number
  ciphertext: string
  nonce: string
  algorithm: string
  recipientKeyFingerprint: string
  senderKeyFingerprint: string
  senderSignature: string
  expiresAt: Date
  claimedAt?: Date
  revokedAt?: Date
  createdAt: Date
}) {
  return {
    id: transfer.id,
    status: transferStatus(transfer),
    senderDeviceId: transfer.senderDeviceId,
    recipientDeviceId: transfer.recipientDeviceId,
    provider: transfer.provider,
    envelope: {
      version: transfer.envelopeVersion,
      algorithm: transfer.algorithm,
      nonce: transfer.nonce,
      ciphertext: transfer.ciphertext,
      recipientKeyFingerprint: transfer.recipientKeyFingerprint,
      senderKeyFingerprint: transfer.senderKeyFingerprint,
      senderSignature: transfer.senderSignature,
    },
    expiresAt: transfer.expiresAt.toISOString(),
    claimedAt: transfer.claimedAt?.toISOString(),
    revokedAt: transfer.revokedAt?.toISOString(),
    createdAt: transfer.createdAt.toISOString(),
  }
}

function transferStatus(transfer: {
  expiresAt: Date
  claimedAt?: Date
  revokedAt?: Date
}): "available" | "claimed" | "revoked" | "expired" {
  if (transfer.revokedAt) return "revoked"
  if (transfer.claimedAt) return "claimed"
  if (transfer.expiresAt <= now()) return "expired"
  return "available"
}
