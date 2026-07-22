// Bun Worker entry point. Provider/tool semantics live in the shared
// AgentRuntime; this file only adapts worker control and pool messages.
declare const self: { onmessage: (event: MessageEvent) => void; postMessage(message: unknown): void }

import { runAgent } from "./loop.js"
import type { WorkerControl, WorkerMessage, WorkerRequest } from "./protocol.js"
import { runWorkerRequest, type WorkerInboxMessage } from "./worker-runtime.js"

const abort = new AbortController()
const inbox: WorkerInboxMessage[] = []
let heartbeatTimer: ReturnType<typeof setInterval> | null = null

self.onmessage = (event: MessageEvent<WorkerRequest | WorkerControl>) => {
  const message = event.data
  if ("type" in message && message.type === "abort") {
    abort.abort(new Error("Subagent cancelled"))
    return
  }
  if ("type" in message && message.type === "inbox_message") {
    inbox.push({ from: message.from, fromName: message.fromName, message: message.message })
    return
  }
  if (!("type" in message)) void start(message)
}

async function start(request: WorkerRequest): Promise<void> {
  heartbeatTimer = setInterval(() => send({ type: "heartbeat" }), 15_000)
  try {
    await runWorkerRequest(request, {
      runAgent,
      send,
      signal: abort.signal,
      drainInbox: () => inbox.splice(0),
    })
  } finally {
    if (heartbeatTimer) clearInterval(heartbeatTimer)
    heartbeatTimer = null
  }
}

function send(message: WorkerMessage): void {
  self.postMessage(message)
}
