/**
 * Remote — CLI session runtime (offerer).
 *
 * Same pattern as mobile's `MobileRemoteRuntime` (mobile_remote_runtime.dart),
 * but the CLI is **the side that creates the offer**: prepare device identity
 * → sign the offer → create `/remote/sessions` → poll until the phone
 * accepts → apply the answer to the transport → `connected`. Sends a
 * heartbeat for as long as it stays connected.
 *
 * Important: `GET /remote/sessions/:id` (a plain poll) does NOT call
 * `assertRemoteOpen` on the backend — only the `accept`/`resume`/`heartbeat`
 * routes flip an expired session to "expired" in the DB. So during a
 * passive poll, the server's `status` field can still read "available" even
 * past expiry; the timeout is separately caught by checking `expiresAt` on
 * the client side.
 */

import { backendRequest, RemoteApiError } from "./backend-client.js"
import { ensureAccessToken } from "./auth.js"
import { ensureDeviceIdentity, signWithStoredIdentity, type DeviceIdentity } from "./identity.js"
import { type CliRemoteTransport, type SignalEnvelope, type IceServer, MockCliRemoteTransport } from "./transport.js"
import { RemoteEventLedger, type RemoteEvent } from "./event-codec.js"

interface TurnCredential {
  urls:        string[]
  username:    string
  credential:  string
  expiresAt:   string
}

/** Converts the backend's `urls: string[]` credential into the ICE server list
 *  werift expects with a SINGULAR `urls: string` — one credential can cover
 *  multiple TURN URIs. */
function toIceServers(credential: TurnCredential): IceServer[] {
  return credential.urls.map((urls) => ({ urls, username: credential.username, credential: credential.credential }))
}

export type CliRemoteStatus =
  | "signedOut"
  | "registeringDevice"
  | "creatingSession"
  | "waitingForPhone"
  | "connected"
  | "expired"
  | "closed"
  | "error"

export interface RemoteSessionPublic {
  id:                  string
  desktopDeviceId:     string
  protocolVersion:     number
  status:              string
  connectionMode:      "webrtc" | "tunnel" | "lan"
  signedOffer:         SignalEnvelope
  acceptedByDeviceId?: string
  signedAnswer?:       SignalEnvelope
  resumeAvailable:     boolean
  lastSequence:        number
  maxIdleSeconds:      number
  expiresAt:           string
  lastHeartbeatAt:     string
  createdAt:           string
  acceptedAt?:         string
  closedAt?:           string
}

export interface StartOptions {
  ttlSeconds?:     number
  pollIntervalMs?: number
}

export interface CliRemoteIdentity {
  ensureDeviceIdentity(): Promise<DeviceIdentity>
  signWithStoredIdentity(payload: string): Promise<string>
}

const defaultIdentity: CliRemoteIdentity = { ensureDeviceIdentity, signWithStoredIdentity }

const DEFAULT_TTL_SECONDS      = 300
const DEFAULT_POLL_INTERVAL_MS = 3000
const HEARTBEAT_INTERVAL_MS    = 20_000

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isSessionExpired(session: RemoteSessionPublic): boolean {
  return session.status === "expired" || new Date(session.expiresAt).getTime() <= Date.now()
}

export class CliRemoteRuntime {
  private readonly transport: CliRemoteTransport
  private readonly identity: CliRemoteIdentity
  private status: CliRemoteStatus = "signedOut"
  private session: RemoteSessionPublic | null = null
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null
  private cancelled = false
  private readonly listeners = new Set<(status: CliRemoteStatus) => void>()
  // Agent bridge (Workstream E): same pattern as mobile's
  // `MobileRemoteRuntime.createPromptEvent` — the runtime owns the event
  // ledger directly.
  private readonly ledger = new RemoteEventLedger()
  private deviceId: string | null = null
  private readonly eventListeners = new Set<(event: RemoteEvent) => void>()

  constructor(opts?: { transport?: CliRemoteTransport; identity?: CliRemoteIdentity }) {
    this.transport = opts?.transport ?? new MockCliRemoteTransport()
    this.identity = opts?.identity ?? defaultIdentity
    this.transport.onMessage((raw) => this.handleRawMessage(raw))
  }

  getStatus(): CliRemoteStatus { return this.status }
  getSession(): RemoteSessionPublic | null { return this.session }

  onStatusChange(fn: (status: CliRemoteStatus) => void): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  private setStatus(next: CliRemoteStatus): void {
    this.status = next
    for (const fn of this.listeners) fn(next)
  }

  /** Listens for events coming from the other side (the phone) —
   *  `prompt.submit`, `interrupt`, `permission.response`, etc. Consumed by
   *  the agent bridge (App.tsx). */
  onEvent(handler: (event: RemoteEvent) => void): () => void {
    this.eventListeners.add(handler)
    return () => this.eventListeners.delete(handler)
  }

  private handleRawMessage(raw: string): void {
    let event: RemoteEvent
    try {
      event = JSON.parse(raw) as RemoteEvent
    } catch {
      return  // malformed message — the P2P app-layer is free-form and the backend doesn't validate it anyway, swallow silently
    }
    if (!this.ledger.acceptIncoming(event)) return  // replay/stale sequence — swallow
    for (const fn of this.eventListeners) fn(event)
  }

  /**
   * Broadcasts agent events (terminal.output/tool.call/.../permission.request)
   * to the phone. Silently a no-op while not connected (`start()` hasn't
   * been called yet, or it's closed) — the caller can use the same code
   * path whether or not remote is active.
   */
  async publish(type: string, payload: Record<string, unknown>): Promise<void> {
    if (!this.deviceId || this.status !== "connected" || !this.session) return
    const event = await this.ledger.createSigned({
      sessionId:      this.session.id,
      senderDeviceId: this.deviceId,
      type,
      payload,
      sign: (p) => this.identity.signWithStoredIdentity(p),
    })
    this.transport.send(JSON.stringify(event))
  }

  /**
   * Creates an offer, opens the session on the backend, and waits until the
   * phone accepts it. Once accepted, applies the answer to the transport
   * and starts the heartbeat loop.
   */
  async start(opts: StartOptions = {}): Promise<RemoteSessionPublic> {
    this.cancelled = false
    this.setStatus("registeringDevice")
    const identity = await this.identity.ensureDeviceIdentity()
    this.deviceId = identity.deviceId

    const iceServers = await this.preflightTurn(identity.deviceId)

    this.setStatus("creatingSession")
    const offer = await this.transport.createOffer({
      signingKeyFingerprint: identity.signingKeyFingerprint,
      sign: (payload) => this.identity.signWithStoredIdentity(payload),
      ...(iceServers ? { iceServers } : {}),
    })

    const accessToken = await ensureAccessToken()
    const created = await backendRequest<{ session: RemoteSessionPublic }>("/remote/sessions", {
      method: "POST",
      accessToken,
      body: {
        desktopDeviceId: identity.deviceId,
        connectionMode:  "webrtc",
        signedOffer:     offer,
        ttlSeconds:      opts.ttlSeconds ?? DEFAULT_TTL_SECONDS,
      },
    })
    this.session = created.session
    this.setStatus("waitingForPhone")

    const accepted = await this.pollUntilAccepted(created.session.id, opts.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS)
    this.session = accepted
    await this.transport.applyAnswer(accepted.signedAnswer!)
    this.setStatus("connected")
    this.startHeartbeat(identity.deviceId)
    return accepted
  }

  /**
   * Fetches TURN credentials and converts them to the ICE server list werift
   * expects. Returns `undefined` if not configured (`turn_not_configured`) —
   * the transport silently falls back to its own default STUN server (in
   * that case, cross-network connectivity only works on directly/host-reachable networks).
   */
  private async preflightTurn(deviceId: string): Promise<IceServer[] | undefined> {
    try {
      const accessToken = await ensureAccessToken()
      const result = await backendRequest<{ credential: TurnCredential }>(
        "/remote/turn-credentials", { method: "POST", accessToken, body: { deviceId } },
      )
      return toIceServers(result.credential)
    } catch (error) {
      if (error instanceof RemoteApiError && error.code === "turn_not_configured") return undefined
      throw error
    }
  }

  private async pollUntilAccepted(sessionId: string, intervalMs: number): Promise<RemoteSessionPublic> {
    while (!this.cancelled) {
      await sleep(intervalMs)
      const accessToken = await ensureAccessToken()
      const result  = await backendRequest<{ session: RemoteSessionPublic }>(`/remote/sessions/${sessionId}`, { accessToken })
      const session = result.session

      if (isSessionExpired(session)) {
        this.setStatus("expired")
        throw new RemoteApiError("remote_expired", "Remote session expired before the phone accepted it.", "client")
      }
      if (session.status === "closed") {
        this.setStatus("closed")
        throw new RemoteApiError("remote_closed", "Remote session was closed.", "client")
      }
      if (session.status === "accepted" && session.signedAnswer) {
        return session
      }
      // "available" — the phone hasn't accepted yet, keep waiting.
    }
    throw new RemoteApiError("remote_session_cancelled", "Waiting for the phone to accept was cancelled.", "client")
  }

  /** Cancels the wait loop inside `start()` from the outside (e.g. the user pressed Esc/Ctrl+C). */
  cancelWaiting(): void {
    this.cancelled = true
  }

  private startHeartbeat(deviceId: string): void {
    this.stopHeartbeat()
    this.heartbeatTimer = setInterval(() => { void this.heartbeat(deviceId) }, HEARTBEAT_INTERVAL_MS)
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) { clearInterval(this.heartbeatTimer); this.heartbeatTimer = null }
  }

  async heartbeat(deviceId: string): Promise<void> {
    const session = this.session
    if (!session) return
    try {
      const accessToken = await ensureAccessToken()
      const result = await backendRequest<{ session: RemoteSessionPublic }>(`/remote/sessions/${session.id}/heartbeat`, {
        method: "POST",
        accessToken,
        body: { deviceId, lastSequence: session.lastSequence },
      })
      this.session = result.session
      if (result.session.status === "expired") {
        this.setStatus("expired")
        this.stopHeartbeat()
      }
    } catch (error) {
      if (error instanceof RemoteApiError && (error.code === "remote_expired" || error.code === "remote_idle_timeout")) {
        this.setStatus("expired")
        this.stopHeartbeat()
        return
      }
      throw error
    }
  }

  /** Closes the session (backend + transport); best-effort — a network error doesn't block closing. */
  async close(): Promise<void> {
    this.cancelled = true
    this.stopHeartbeat()
    if (this.session) {
      try {
        const accessToken = await ensureAccessToken()
        await backendRequest(`/remote/sessions/${this.session.id}/close`, { method: "POST", accessToken })
      } catch {
        // best-effort — we're closing anyway
      }
    }
    await this.transport.close()
    this.session = null
    this.deviceId = null
    this.setStatus("closed")
  }
}
