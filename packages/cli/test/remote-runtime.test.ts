/**
 * Remote — Phase 3 (backend signaling runtime, offerer) tests.
 *
 * Coverage: event-codec (signing payload order, replay protection), transport
 * (mock offer generation), runtime (session creation → poll → answer → connected,
 * timeout/close, heartbeat, TURN preflight fallback, cancellation).
 *
 * A test identity is injected — device registration/crypto is already thoroughly
 * tested in remote-identity.test.ts; here only the runtime's OWN state machine is isolated.
 */
import { describe, it, expect, afterEach, beforeEach, mock } from "bun:test"

mock.module("../src/remote/browser.js", () => ({ openInBrowser: () => {} }))
import { writeStoredTokens, clearStoredTokens } from "../src/remote/session-store.js"
import { RemoteEventLedger, signingPayload, RemoteEventTypes, type RemoteEvent } from "../src/remote/event-codec.js"
import { MockCliRemoteTransport, type CliRemoteTransport, type SignalEnvelope, type IceServer } from "../src/remote/transport.js"
import { CliRemoteRuntime, type CliRemoteIdentity, type RemoteSessionPublic, type CliRemoteStatus } from "../src/remote/runtime.js"
import { RemoteApiError } from "../src/remote/backend-client.js"

// ── Test helpers ──────────────────────────────────────────────────────────────

class SpyTransport implements CliRemoteTransport {
  offersCreated = 0
  appliedAnswers: SignalEnvelope[] = []
  receivedIceServers: IceServer[] | undefined
  closed = false
  private openHandlers: Array<() => void> = []
  private messageHandlers: Array<(data: string) => void> = []
  sent: string[] = []

  async createOffer(opts: { signingKeyFingerprint: string; sign: (payload: string) => Promise<string>; iceServers?: IceServer[] }): Promise<SignalEnvelope> {
    this.offersCreated++
    this.receivedIceServers = opts.iceServers
    const payload = JSON.stringify({ kind: "test-offer" })
    return {
      version: 1, sessionProtocolVersion: 1, type: "offer", transport: "webrtc",
      payload, signingKeyFingerprint: opts.signingKeyFingerprint, signature: await opts.sign(payload),
    }
  }
  async applyAnswer(answer: SignalEnvelope): Promise<void> { this.appliedAnswers.push(answer) }
  onChannelOpen(handler: () => void): void { this.openHandlers.push(handler) }
  onMessage(handler: (data: string) => void): void { this.messageHandlers.push(handler) }
  send(data: string): void { this.sent.push(data) }
  /** Called from the test — in the real transport, this fires when the data channel actually opens/a message arrives. */
  simulateOpen(): void { for (const h of this.openHandlers) h() }
  simulateMessage(data: string): void { for (const h of this.messageHandlers) h(data) }
  async close(): Promise<void> { this.closed = true }
}

const testIdentity: CliRemoteIdentity = {
  ensureDeviceIdentity: async () => ({
    deviceId:              "dev_cli_1",
    signingPublicKey:      "{}",
    encryptionPublicKey:   "{}",
    signingKeyFingerprint: "fp_test_cli",
    verified:              true,
  }),
  signWithStoredIdentity: async (payload: string) => `sig(${payload.length})`,
}

function createRuntime(transport: CliRemoteTransport): CliRemoteRuntime {
  return new CliRemoteRuntime({ transport, identity: testIdentity })
}

function fakeAnswer(): SignalEnvelope {
  return { version: 1, sessionProtocolVersion: 1, type: "answer", transport: "webrtc", payload: "{}", signingKeyFingerprint: "fp_mobile", signature: "sig" }
}

function baseSession(overrides: Partial<RemoteSessionPublic> = {}): RemoteSessionPublic {
  return {
    id: "rmt_1", desktopDeviceId: "dev_cli_1", protocolVersion: 1, status: "available",
    connectionMode: "webrtc",
    signedOffer: { version: 1, sessionProtocolVersion: 1, type: "offer", transport: "webrtc", payload: "{}", signingKeyFingerprint: "fp_test_cli", signature: "sig" },
    resumeAvailable: false, lastSequence: 0, maxIdleSeconds: 90,
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    lastHeartbeatAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

function installRemoteBackendMock(handlers: {
  turnCredentials?: () => { status: number; body: unknown }
  createSession?:   (body: any) => { status: number; body: unknown }
  getSession?:      () => { status: number; body: unknown }
  heartbeat?:       (body: any) => { status: number; body: unknown }
  close?:           () => { status: number; body: unknown }
}) {
  const original = globalThis.fetch
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url    = new URL(typeof input === "string" ? input : input.toString())
    const body   = init?.body ? JSON.parse(init.body as string) : {}
    const method = init?.method ?? "GET"

    if (url.pathname === "/remote/turn-credentials" && method === "POST") {
      const r = handlers.turnCredentials?.() ?? { status: 503, body: { ok: false, error: { code: "turn_not_configured", message: "no turn", requestId: "req" } } }
      return new Response(JSON.stringify(r.body), { status: r.status })
    }
    if (url.pathname === "/remote/sessions" && method === "POST") {
      const r = handlers.createSession!(body)
      return new Response(JSON.stringify(r.body), { status: r.status })
    }
    if (/^\/remote\/sessions\/[^/]+$/.test(url.pathname) && method === "GET") {
      const r = handlers.getSession!()
      return new Response(JSON.stringify(r.body), { status: r.status })
    }
    if (/^\/remote\/sessions\/[^/]+\/heartbeat$/.test(url.pathname) && method === "POST") {
      const r = handlers.heartbeat!(body)
      return new Response(JSON.stringify(r.body), { status: r.status })
    }
    if (/^\/remote\/sessions\/[^/]+\/close$/.test(url.pathname) && method === "POST") {
      const r = handlers.close?.() ?? { status: 200, body: { ok: true } }
      return new Response(JSON.stringify(r.body), { status: r.status })
    }
    throw new Error(`unexpected request: ${method} ${url.pathname}`)
  }) as typeof fetch
  return () => { globalThis.fetch = original }
}

beforeEach(() => {
  const farFuture = Math.floor(Date.now() / 1000) + 3600
  const fakeJwt = `${Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url")}.${Buffer.from(JSON.stringify({ exp: farFuture })).toString("base64url")}.sig`
  writeStoredTokens({ accessToken: fakeJwt, refreshToken: "rt", tokenType: "Bearer" })
})

afterEach(() => {
  clearStoredTokens()
})

// ── event-codec ────────────────────────────────────────────────────────────────

describe("event-codec", () => {
  it("signingPayload uses the fixed field order expected by the mobile ledger", () => {
    const str = signingPayload({
      sessionId: "s1", seq: 1, timestamp: "2024-01-01T00:00:00.000Z", senderDeviceId: "d1",
      type: RemoteEventTypes.promptSubmit, payload: { prompt: "hi" },
    })
    expect(str).toBe('{"sessionId":"s1","seq":1,"timestamp":"2024-01-01T00:00:00.000Z","senderDeviceId":"d1","type":"prompt.submit","payload":{"prompt":"hi"}}')
  })

  it("createSigned increments seq and signs the exact signingPayload", async () => {
    const ledger = new RemoteEventLedger()
    const seen: string[] = []
    const event = await ledger.createSigned({
      sessionId: "s1", senderDeviceId: "d1", type: RemoteEventTypes.terminalOutput, payload: { text: "hello" },
      sign: async (payload) => { seen.push(payload); return `sig(${payload.length})` },
    })
    expect(event.seq).toBe(1)
    expect(event.signature).toBe(`sig(${seen[0]!.length})`)
    expect(ledger.lastSequence).toBe(1)

    const second = await ledger.createSigned({
      sessionId: "s1", senderDeviceId: "d1", type: RemoteEventTypes.agentStatus, payload: {},
      sign: async () => "sig2",
    })
    expect(second.seq).toBe(2)
    expect(ledger.lastSequence).toBe(2)
  })

  it("acceptIncoming rejects replayed/out-of-order sequences", () => {
    const ledger = new RemoteEventLedger()
    const mk = (seq: number) => ({ sessionId: "s1", seq, timestamp: "t", senderDeviceId: "d2", type: "x", payload: {}, signature: "s" })
    expect(ledger.acceptIncoming(mk(1))).toBe(true)
    expect(ledger.acceptIncoming(mk(2))).toBe(true)
    expect(ledger.acceptIncoming(mk(2))).toBe(false)  // replay
    expect(ledger.acceptIncoming(mk(1))).toBe(false)  // stale
    expect(ledger.lastSequence).toBe(2)
  })

  it("restore sets outgoing/incoming sequence counters (resume/reconnect path)", () => {
    const ledger = new RemoteEventLedger()
    ledger.restore({ outgoingSeq: 5, incomingSeq: 7 })
    expect(ledger.lastSequence).toBe(7)
    expect(ledger.currentOutgoingSeq).toBe(5)
    expect(ledger.currentIncomingSeq).toBe(7)
  })
})

// ── transport (mock) ─────────────────────────────────────────────────────────

describe("MockCliRemoteTransport", () => {
  it("produces a signed placeholder offer envelope", async () => {
    const transport = new MockCliRemoteTransport()
    const envelope = await transport.createOffer({
      signingKeyFingerprint: "fp_1",
      sign: async (payload) => `signed(${payload})`,
    })
    expect(envelope.type).toBe("offer")
    expect(envelope.transport).toBe("webrtc")
    expect(envelope.signingKeyFingerprint).toBe("fp_1")
    expect(envelope.signature).toBe(`signed(${envelope.payload})`)
    expect(JSON.parse(envelope.payload).kind).toBe("aurict.cli.remote.placeholder-offer")
  })
})

// ── runtime — offerer durum makinesi ──────────────────────────────────────────

describe("CliRemoteRuntime.start", () => {
  it("goes signedOut → …→ connected, applies the answer, and starts heartbeating", async () => {
    let getCallCount = 0
    const restore = installRemoteBackendMock({
      createSession: (body) => {
        expect(body.desktopDeviceId).toBe("dev_cli_1")
        expect(body.connectionMode).toBe("webrtc")
        return { status: 201, body: { ok: true, session: baseSession() } }
      },
      getSession: () => {
        getCallCount++
        if (getCallCount === 1) return { status: 200, body: { ok: true, session: baseSession({ status: "available" }) } }
        return { status: 200, body: { ok: true, session: baseSession({ status: "accepted", acceptedByDeviceId: "dev_mobile_1", signedAnswer: fakeAnswer() }) } }
      },
    })
    const transport = new SpyTransport()
    const runtime = createRuntime(transport)
    const statuses: CliRemoteStatus[] = []
    runtime.onStatusChange((s) => statuses.push(s))

    try {
      const session = await runtime.start({ pollIntervalMs: 5 })
      expect(session.status).toBe("accepted")
      expect(runtime.getStatus()).toBe("connected")
      expect(transport.offersCreated).toBe(1)
      expect(transport.appliedAnswers.length).toBe(1)
      expect(statuses).toEqual(["registeringDevice", "creatingSession", "waitingForPhone", "connected"])
    } finally {
      restore()
      // @ts-expect-error — test cleanup: don't leak the real 20s heartbeat interval
      clearInterval((runtime as any).heartbeatTimer)
    }
  }, 10_000)

  it("does not fail when TURN is not configured (STUN fallback) — transport gets no iceServers override", async () => {
    let getCallCount = 0
    const restore = installRemoteBackendMock({
      turnCredentials: () => ({ status: 503, body: { ok: false, error: { code: "turn_not_configured", message: "no turn", requestId: "r" } } }),
      createSession: () => ({ status: 201, body: { ok: true, session: baseSession() } }),
      getSession: () => {
        getCallCount++
        return { status: 200, body: { ok: true, session: baseSession({ status: getCallCount > 1 ? "accepted" : "available", ...(getCallCount > 1 ? { signedAnswer: fakeAnswer() } : {}) }) } }
      },
    })
    const transport = new SpyTransport()
    const runtime = createRuntime(transport)
    try {
      const session = await runtime.start({ pollIntervalMs: 5 })
      expect(session.status).toBe("accepted")
      expect(transport.receivedIceServers).toBeUndefined()
    } finally {
      restore()
      // @ts-expect-error test cleanup
      clearInterval((runtime as any).heartbeatTimer)
    }
  }, 10_000)

  it("fans out a multi-URI TURN credential into one IceServer per URL and passes it to the transport", async () => {
    let getCallCount = 0
    const restore = installRemoteBackendMock({
      turnCredentials: () => ({
        status: 200,
        body: {
          ok: true,
          credential: {
            urls: ["turn:turn.aurict.com:3478", "turns:turn.aurict.com:5349"],
            username: "1234:aurict:usr_1:rmt_1",
            credential: "hmac-sig",
            expiresAt: new Date(Date.now() + 600_000).toISOString(),
          },
        },
      }),
      createSession: () => ({ status: 201, body: { ok: true, session: baseSession() } }),
      getSession: () => {
        getCallCount++
        return { status: 200, body: { ok: true, session: baseSession({ status: getCallCount > 1 ? "accepted" : "available", ...(getCallCount > 1 ? { signedAnswer: fakeAnswer() } : {}) }) } }
      },
    })
    const transport = new SpyTransport()
    const runtime = createRuntime(transport)
    try {
      await runtime.start({ pollIntervalMs: 5 })
      expect(transport.receivedIceServers).toEqual([
        { urls: "turn:turn.aurict.com:3478", username: "1234:aurict:usr_1:rmt_1", credential: "hmac-sig" },
        { urls: "turns:turn.aurict.com:5349", username: "1234:aurict:usr_1:rmt_1", credential: "hmac-sig" },
      ])
    } finally {
      restore()
      // @ts-expect-error test cleanup
      clearInterval((runtime as any).heartbeatTimer)
    }
  }, 10_000)

  it("rejects and sets status=expired when the session's expiresAt passes while waiting", async () => {
    const restore = installRemoteBackendMock({
      createSession: () => ({ status: 201, body: { ok: true, session: baseSession({ expiresAt: new Date(Date.now() - 1000).toISOString() }) } }),
      getSession: () => ({ status: 200, body: { ok: true, session: baseSession({ status: "available", expiresAt: new Date(Date.now() - 1000).toISOString() }) } }),
    })
    const runtime = createRuntime(new SpyTransport())
    try {
      await expect(runtime.start({ pollIntervalMs: 5 })).rejects.toThrow(RemoteApiError)
      expect(runtime.getStatus()).toBe("expired")
    } finally { restore() }
  }, 10_000)

  it("rejects and sets status=closed when the session is observed as closed while waiting", async () => {
    const restore = installRemoteBackendMock({
      createSession: () => ({ status: 201, body: { ok: true, session: baseSession() } }),
      getSession: () => ({ status: 200, body: { ok: true, session: baseSession({ status: "closed" }) } }),
    })
    const runtime = createRuntime(new SpyTransport())
    try {
      await expect(runtime.start({ pollIntervalMs: 5 })).rejects.toThrow(RemoteApiError)
      expect(runtime.getStatus()).toBe("closed")
    } finally { restore() }
  }, 10_000)

  it("cancelWaiting() stops the poll loop promptly", async () => {
    const restore = installRemoteBackendMock({
      createSession: () => ({ status: 201, body: { ok: true, session: baseSession() } }),
      getSession: () => ({ status: 200, body: { ok: true, session: baseSession({ status: "available" }) } }),
    })
    const runtime = createRuntime(new SpyTransport())
    const startPromise = runtime.start({ pollIntervalMs: 5 })
    setTimeout(() => runtime.cancelWaiting(), 20)
    try {
      await expect(startPromise).rejects.toThrow(RemoteApiError)
    } finally { restore() }
  }, 10_000)
})

describe("CliRemoteRuntime.heartbeat / close", () => {
  it("heartbeat updates the local session snapshot", async () => {
    const runtime = createRuntime(new SpyTransport())
    ;(runtime as any).session = baseSession({ status: "accepted", lastSequence: 3 })
    const restore = installRemoteBackendMock({
      createSession: () => { throw new Error("not used") },
      getSession:    () => { throw new Error("not used") },
      heartbeat: (body) => {
        expect(body.deviceId).toBe("dev_cli_1")
        expect(body.lastSequence).toBe(3)
        return { status: 200, body: { ok: true, session: baseSession({ status: "accepted", lastSequence: 3 }) } }
      },
    })
    try {
      await runtime.heartbeat("dev_cli_1")
      expect(runtime.getSession()?.status).toBe("accepted")
    } finally { restore() }
  })

  it("heartbeat transitions to expired on remote_idle_timeout", async () => {
    const runtime = createRuntime(new SpyTransport())
    ;(runtime as any).session = baseSession({ status: "accepted" })
    const restore = installRemoteBackendMock({
      createSession: () => { throw new Error("not used") },
      getSession:    () => { throw new Error("not used") },
      heartbeat: () => ({ status: 410, body: { ok: false, error: { code: "remote_idle_timeout", message: "idle", requestId: "r" } } }),
    })
    try {
      await runtime.heartbeat("dev_cli_1")
      expect(runtime.getStatus()).toBe("expired")
    } finally { restore() }
  })

  it("close() posts to /close, closes the transport, and clears the session", async () => {
    const transport = new SpyTransport()
    const runtime = createRuntime(transport)
    ;(runtime as any).session = baseSession({ id: "rmt_close_me" })
    let closeCalled = false
    const restore = installRemoteBackendMock({
      createSession: () => { throw new Error("not used") },
      getSession:    () => { throw new Error("not used") },
      close: () => { closeCalled = true; return { status: 200, body: { ok: true } } },
    })
    try {
      await runtime.close()
      expect(closeCalled).toBe(true)
      expect(transport.closed).toBe(true)
      expect(runtime.getSession()).toBeNull()
      expect(runtime.getStatus()).toBe("closed")
    } finally { restore() }
  })

  it("close() still tears down locally when the backend call fails", async () => {
    const transport = new SpyTransport()
    const runtime = createRuntime(transport)
    ;(runtime as any).session = baseSession({ id: "rmt_offline" })
    const original = globalThis.fetch
    globalThis.fetch = (async () => { throw new Error("offline") }) as typeof fetch
    try {
      await runtime.close()
      expect(transport.closed).toBe(true)
      expect(runtime.getSession()).toBeNull()
      expect(runtime.getStatus()).toBe("closed")
    } finally { globalThis.fetch = original }
  })
})

describe("CliRemoteRuntime — agent event bridge (publish/onEvent)", () => {
  it("publish() is a no-op when not connected (no session/deviceId yet)", async () => {
    const transport = new SpyTransport()
    const runtime = createRuntime(transport)
    await runtime.publish("terminal.output", { text: "hi" })
    expect(transport.sent.length).toBe(0)
  })

  it("publish() sends a signed, sequenced event once connected", async () => {
    const transport = new SpyTransport()
    const runtime = createRuntime(transport)
    ;(runtime as any).deviceId = "dev_cli_1"
    ;(runtime as any).status = "connected"
    ;(runtime as any).session = baseSession({ id: "rmt_evt", status: "accepted" })

    await runtime.publish("terminal.output", { text: "hello" })
    expect(transport.sent.length).toBe(1)
    const event = JSON.parse(transport.sent[0]!)
    expect(event.sessionId).toBe("rmt_evt")
    expect(event.senderDeviceId).toBe("dev_cli_1")
    expect(event.type).toBe("terminal.output")
    expect(event.payload).toEqual({ text: "hello" })
    expect(event.seq).toBe(1)
    expect(typeof event.signature).toBe("string")

    await runtime.publish("agent.status", { state: "idle" })
    const second = JSON.parse(transport.sent[1]!)
    expect(second.seq).toBe(2)  // monotonic increase
  })

  it("onEvent() delivers incoming transport messages and rejects replayed sequences", () => {
    const transport = new SpyTransport()
    const runtime = createRuntime(transport)
    const received: Array<{ type: string }> = []
    runtime.onEvent((e) => received.push(e))

    const event = {
      sessionId: "s1", seq: 1, timestamp: new Date().toISOString(),
      senderDeviceId: "dev_mobile_1", type: "prompt.submit", payload: { prompt: "hi" }, signature: "sig",
    }
    transport.simulateMessage(JSON.stringify(event))
    expect(received.length).toBe(1)
    expect(received[0]!.type).toBe("prompt.submit")

    transport.simulateMessage(JSON.stringify(event))  // replay — should be rejected
    expect(received.length).toBe(1)

    transport.simulateMessage("not-json{{{")  // malformed message — should be swallowed silently, no crash
    expect(received.length).toBe(1)
  })

  it("the unsubscribe function returned by onEvent() stops further delivery", () => {
    const transport = new SpyTransport()
    const runtime = createRuntime(transport)
    const received: unknown[] = []
    const unsubscribe = runtime.onEvent((e) => received.push(e))
    unsubscribe()
    transport.simulateMessage(JSON.stringify({
      sessionId: "s1", seq: 1, timestamp: new Date().toISOString(),
      senderDeviceId: "d", type: "interrupt", payload: {}, signature: "sig",
    }))
    expect(received.length).toBe(0)
  })
})
