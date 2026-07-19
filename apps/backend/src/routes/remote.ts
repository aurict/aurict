import { Hono } from "hono"
import { z } from "zod"
import { addSeconds, newId, now } from "../crypto/ids"
import { refreshTokenHash } from "../crypto/tokens"
import { createTurnCredential } from "../crypto/turn"
import { requireAuth } from "../middleware/auth"
import { ApiError } from "../middleware/errors"
import { rateLimit } from "../middleware/rate-limit"
import { containsRemotePayload } from "../store/policy"
import type { RemoteSession } from "../store/types"
import type { AppBindings } from "../types"
import { assertVerifiedDevice, ownedDevice } from "./devices"

const REMOTE_PROTOCOL_VERSION = 1

const signalEnvelopeSchema = z.object({
  version: z.literal(1),
  sessionProtocolVersion: z.literal(1).default(1),
  type: z.enum(["offer", "answer"]),
  transport: z.enum(["webrtc", "tunnel", "lan"]),
  payload: z.string().min(16).max(128_000),
  signingKeyFingerprint: z.string().min(16).max(128),
  signature: z.string().min(32).max(4096),
}).strict()

const createRemoteSessionSchema = z.object({
  desktopDeviceId: z.string().min(1),
  connectionMode: z.enum(["webrtc", "tunnel", "lan"]),
  signedOffer: signalEnvelopeSchema.extend({ type: z.literal("offer") }),
  ttlSeconds: z.number().int().positive().max(900).default(300),
}).strict()

const acceptRemoteSessionSchema = z.object({
  mobileDeviceId: z.string().min(1),
  signedAnswer: signalEnvelopeSchema.extend({ type: z.literal("answer") }),
}).strict()

const heartbeatSchema = z.object({
  deviceId: z.string().min(1).optional(),
  lastSequence: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER).default(0),
}).strict()

const resumeSchema = z.object({
  deviceId: z.string().min(1),
  resumeToken: z.string().min(32).max(512),
  lastSeenSequence: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER).default(0),
}).strict()

const turnCredentialSchema = z.object({
  deviceId: z.string().min(1),
  sessionId: z.string().min(1).optional(),
}).strict()

export const remoteRoutes = new Hono<AppBindings>()
  .use("/remote/*", requireAuth)
  .get("/remote/protocol", (c) => c.json({ ok: true, protocol: remoteProtocol() }))
  .post("/remote/turn-credentials", rateLimit(30, 60_000, "remote-turn"), async (c) => {
    const body = turnCredentialSchema.parse(await c.req.json())
    const device = await ownedDevice(c, body.deviceId)
    assertVerifiedDevice(c, device)
    if (body.sessionId) {
      const session = await ownedRemoteSession(c, body.sessionId)
      assertDeviceParticipates(session, device.id)
    }
    const credential = await createTurnCredential(c.get("env"), c.get("user")!.id, body.sessionId ?? `preflight:${device.id}`)
    if (!credential) throw new ApiError(503, "TURN credentials are not configured.", "turn_not_configured")
    await audit(c, "remote.turn_credentials.minted", device.id, { sessionId: body.sessionId, urls: credential.urls.length })
    return c.json({ ok: true, credential: { ...credential, expiresAt: credential.expiresAt.toISOString() } })
  })
  .post("/remote/sessions", rateLimit(20, 60_000, "remote-create"), async (c) => {
    const raw = await c.req.json()
    if (containsRemotePayload(raw)) throw new ApiError(400, "Remote sessions accept signaling metadata only.", "remote_payload_rejected")
    const body = createRemoteSessionSchema.parse(raw)
    if (body.ttlSeconds > c.get("env").REMOTE_MAX_TTL_SECONDS) {
      throw new ApiError(400, "Remote session TTL exceeds policy.", "remote_ttl_too_large")
    }
    if (body.signedOffer.transport !== body.connectionMode) {
      throw new ApiError(400, "Signed offer transport must match connection mode.", "transport_mismatch")
    }
    const user = c.get("user")!
    const desktop = await ownedDevice(c, body.desktopDeviceId)
    assertVerifiedDevice(c, desktop)
    if (desktop.platform !== "cli" && desktop.platform !== "desktop") throw new ApiError(400, "Remote desktop device must be a CLI or desktop device.", "invalid_device")
    assertSignalFingerprint(body.signedOffer, desktop.signingKeyFingerprint, "offer")
    const createdAt = now()
    const openSessions = await c.get("repo").countOpenRemoteSessions(user.id, desktop.id, createdAt)
    if (openSessions >= c.get("env").REMOTE_MAX_ACTIVE_SESSIONS) {
      throw new ApiError(409, "Remote active session limit reached.", "remote_session_limit")
    }
    const session: RemoteSession = {
      id: newId("rmt"),
      userId: user.id,
      desktopDeviceId: desktop.id,
      protocolVersion: REMOTE_PROTOCOL_VERSION,
      status: "available",
      connectionMode: body.connectionMode,
      signedOffer: stableJson(body.signedOffer),
      lastSequence: 0,
      maxIdleSeconds: c.get("env").REMOTE_MAX_IDLE_SECONDS,
      expiresAt: addSeconds(createdAt, body.ttlSeconds),
      lastHeartbeatAt: createdAt,
      createdAt,
    }
    await c.get("repo").createRemoteSession(session)
    await audit(c, "remote.session.created", desktop.id, { sessionId: session.id, connectionMode: session.connectionMode })
    return c.json({ ok: true, session: publicRemoteSession(session) }, 201)
  })
  .get("/remote/sessions", async (c) => {
    const user = c.get("user")!
    const sessions = (await c.get("repo").listAvailableRemoteSessions(user.id, now())).map(publicRemoteSession)
    return c.json({ ok: true, sessions, protocol: remoteProtocol() })
  })
  .get("/remote/sessions/:id", async (c) => {
    const session = await ownedRemoteSession(c, requiredParam(c.req.param("id")))
    return c.json({ ok: true, session: publicRemoteSession(session), protocol: remoteProtocol() })
  })
  .post("/remote/sessions/:id/accept", rateLimit(30, 60_000, "remote-accept"), async (c) => {
    const raw = await c.req.json()
    if (containsRemotePayload(raw)) throw new ApiError(400, "Remote accept accepts signaling metadata only.", "remote_payload_rejected")
    const body = acceptRemoteSessionSchema.parse(raw)
    const session = await ownedRemoteSession(c, requiredParam(c.req.param("id")))
    await assertRemoteAcceptable(c, session)
    const mobile = await ownedDevice(c, body.mobileDeviceId)
    assertVerifiedDevice(c, mobile)
    if (mobile.platform !== "mobile") throw new ApiError(400, "Accepted device must be mobile.", "invalid_device")
    if (body.signedAnswer.transport !== session.connectionMode) {
      throw new ApiError(400, "Signed answer transport must match session connection mode.", "transport_mismatch")
    }
    assertSignalFingerprint(body.signedAnswer, mobile.signingKeyFingerprint, "answer")
    if (!(await c.get("repo").hasTrust(c.get("user")!.id, mobile.id, session.desktopDeviceId, "remote"))) {
      throw new ApiError(403, "Mobile device is not trusted for remote.", "device_not_trusted")
    }
    const resumeToken = `${newId("rrt")}.${crypto.randomUUID()}.${crypto.randomUUID()}`
    const result = await c.get("repo").acceptRemoteSession(
      c.get("user")!.id,
      session.id,
      mobile.id,
      stableJson(body.signedAnswer),
      await refreshTokenHash(resumeToken),
      now(),
    )
    if (result.status === "not_found") throw new ApiError(404, "Remote session not found.", "not_found")
    if (result.status === "expired") throw new ApiError(410, "Remote session expired.", "remote_expired")
    if (result.status === "not_available") throw new ApiError(409, "Remote session is not available.", "remote_not_available")
    if (result.status !== "accepted") throw new ApiError(500, "Unexpected remote accept state.", "internal_error")
    await audit(c, "remote.session.accepted", mobile.id, { sessionId: session.id, desktopDeviceId: session.desktopDeviceId })
    return c.json({ ok: true, session: publicRemoteSession(result.session), resumeToken })
  })
  .post("/remote/sessions/:id/resume", rateLimit(60, 60_000, "remote-resume"), async (c) => {
    const body = resumeSchema.parse(await c.req.json())
    const session = await ownedRemoteSession(c, requiredParam(c.req.param("id")))
    await assertRemoteOpen(c, session)
    const device = await ownedDevice(c, body.deviceId)
    assertVerifiedDevice(c, device)
    assertDeviceParticipates(session, device.id)
    if (!session.resumeTokenHash || session.resumeTokenHash !== await refreshTokenHash(body.resumeToken)) {
      throw new ApiError(401, "Remote resume token is invalid.", "invalid_resume_token")
    }
    if (body.lastSeenSequence < session.lastSequence) {
      throw new ApiError(409, "Remote resume sequence is behind session state.", "remote_sequence_replay")
    }
    session.lastSequence = body.lastSeenSequence
    session.lastHeartbeatAt = now()
    await c.get("repo").updateRemoteSession(session)
    await audit(c, "remote.session.resumed", device.id, { sessionId: session.id, lastSequence: session.lastSequence })
    return c.json({ ok: true, session: publicRemoteSession(session), protocol: remoteProtocol() })
  })
  .post("/remote/sessions/:id/heartbeat", async (c) => {
    const body = heartbeatSchema.parse(await readJsonOrEmpty(c))
    const session = await ownedRemoteSession(c, requiredParam(c.req.param("id")))
    await assertRemoteOpen(c, session)
    if (body.deviceId) {
      const device = await ownedDevice(c, body.deviceId)
      assertVerifiedDevice(c, device)
      assertDeviceParticipates(session, device.id)
    }
    if (body.lastSequence < session.lastSequence) {
      throw new ApiError(409, "Remote heartbeat sequence moved backwards.", "remote_sequence_replay")
    }
    session.lastSequence = body.lastSequence
    session.lastHeartbeatAt = now()
    await c.get("repo").updateRemoteSession(session)
    await c.get("repo").touchUserPresence(c.get("user")!.id, session.lastHeartbeatAt)
    return c.json({ ok: true, session: publicRemoteSession(session) })
  })
  .post("/remote/sessions/:id/close", async (c) => {
    const session = await ownedRemoteSession(c, requiredParam(c.req.param("id")))
    session.status = "closed"
    session.closedAt = now()
    await c.get("repo").updateRemoteSession(session)
    await audit(c, "remote.session.closed", undefined, { sessionId: session.id })
    return c.json({ ok: true })
  })

async function ownedRemoteSession(c: any, id: string): Promise<RemoteSession> {
  const session = await c.get("repo").getRemoteSession(c.get("user").id, id)
  if (!session || session.userId !== c.get("user").id) throw new ApiError(404, "Remote session not found.", "not_found")
  return session
}

function requiredParam(value: string | undefined) {
  if (!value) throw new ApiError(404, "Remote session not found.", "not_found")
  return value
}

async function assertRemoteAcceptable(c: any, session: RemoteSession) {
  if (session.expiresAt <= now() || session.status === "expired") {
    await expireSession(c, session)
    throw new ApiError(410, "Remote session expired.", "remote_expired")
  }
  if (session.status !== "available") {
    throw new ApiError(409, "Remote session is not available.", "remote_not_available")
  }
}

async function assertRemoteOpen(c: any, session: RemoteSession) {
  if (session.expiresAt <= now() || session.status === "expired") {
    await expireSession(c, session)
    throw new ApiError(410, "Remote session expired.", "remote_expired")
  }
  if (session.status === "accepted" && session.lastHeartbeatAt.getTime() + session.maxIdleSeconds * 1000 < Date.now()) {
    await expireSession(c, session)
    throw new ApiError(410, "Remote session idle timeout exceeded.", "remote_idle_timeout")
  }
  if (session.status === "closed") {
    throw new ApiError(409, "Remote session is closed.", "remote_closed")
  }
}

async function expireSession(c: any, session: RemoteSession) {
  session.status = "expired"
  session.closedAt ??= now()
  await c.get("repo").updateRemoteSession(session)
  await audit(c, "remote.session.expired", undefined, { sessionId: session.id })
}

function assertSignalFingerprint(envelope: z.infer<typeof signalEnvelopeSchema>, expected: string, kind: string) {
  if (envelope.signingKeyFingerprint !== expected) {
    throw new ApiError(400, `Remote ${kind} signing key fingerprint mismatch.`, "remote_fingerprint_mismatch")
  }
}

function assertDeviceParticipates(session: RemoteSession, deviceId: string) {
  if (session.desktopDeviceId !== deviceId && session.acceptedByDeviceId !== deviceId) {
    throw new ApiError(403, "Device does not participate in this remote session.", "remote_device_not_participant")
  }
}

function publicRemoteSession(session: RemoteSession) {
  return {
    id: session.id,
    desktopDeviceId: session.desktopDeviceId,
    protocolVersion: session.protocolVersion,
    status: session.status,
    connectionMode: session.connectionMode,
    signedOffer: parseSignalEnvelope(session.signedOffer),
    acceptedByDeviceId: session.acceptedByDeviceId,
    signedAnswer: session.signedAnswer ? parseSignalEnvelope(session.signedAnswer) : undefined,
    resumeAvailable: !!session.resumeTokenHash,
    lastSequence: session.lastSequence,
    maxIdleSeconds: session.maxIdleSeconds,
    expiresAt: session.expiresAt.toISOString(),
    lastHeartbeatAt: session.lastHeartbeatAt.toISOString(),
    createdAt: session.createdAt.toISOString(),
    acceptedAt: session.acceptedAt?.toISOString(),
    closedAt: session.closedAt?.toISOString(),
  }
}

function remoteProtocol() {
  return {
    version: REMOTE_PROTOCOL_VERSION,
    dataPlane: "peer_to_peer",
    backendCarriesPayload: false,
    transports: ["webrtc", "tunnel", "lan"],
    eventTypes: [
      "prompt.submit",
      "terminal.output",
      "agent.status",
      "tool.call",
      "tool.result.summary",
      "interrupt",
      "resume",
      "heartbeat",
      "close",
      "error",
    ],
    requiredEventFields: ["sessionId", "seq", "timestamp", "senderDeviceId", "type", "payload", "signature"],
    sequencing: { monotonic: true, replayRejectedByHeartbeat: true },
    encryption: { transport: "webrtc-dtls", applicationLayerSigning: true, applicationLayerEncryption: true },
  }
}

function stableJson(value: unknown): string {
  return JSON.stringify(value)
}

function parseSignalEnvelope(value: string) {
  try {
    return signalEnvelopeSchema.parse(JSON.parse(value))
  } catch {
    return value
  }
}

async function readJsonOrEmpty(c: any) {
  const contentType = c.req.header("content-type") ?? ""
  if (!contentType.includes("application/json")) return {}
  return await c.req.json()
}

async function audit(c: any, event: string, deviceId: string | undefined, metadata: Record<string, unknown>) {
  await c.get("repo").addAuditLog({
    id: newId("aud"),
    userId: c.get("user")?.id,
    deviceId,
    event,
    metadataJson: JSON.stringify(metadata),
    createdAt: now(),
  })
}
