import { describe, expect, it } from "bun:test"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import type { AgentFinishResult, AgentRunOptions } from "../src/agent/types.js"
import type { WorkerMessage, WorkerRequest } from "../src/agent/protocol.js"
import { runWorkerRequest } from "../src/agent/worker-runtime.js"

describe("worker runtime architecture", () => {
  it("uses the shared runAgent runtime instead of owning a second provider loop", () => {
    const source = readFileSync(join(import.meta.dir, "../src/agent/worker.ts"), "utf8")
    const adapter = readFileSync(join(import.meta.dir, "../src/agent/worker-runtime.ts"), "utf8")
    expect(source).toContain('import { runAgent } from "./loop.js"')
    expect(source).not.toContain("streamText(")
    expect(source).not.toContain("executeTool(")
    expect(adapter).toContain('profile: "subagent"')
  })

  it("exercises the worker adapter through the shared runtime port", async () => {
    const sent: WorkerMessage[] = []
    const calls: AgentRunOptions[] = []
    const request: WorkerRequest = {
      id: "worker-1",
      agentName: "Explorer",
      agentType: "explore",
      prompt: "Inspect the runtime",
      provider: "mock",
      model: "mock-model",
      workdir: "/tmp",
      allowedTools: ["read"],
      sessionId: "worker-session",
    }
    await runWorkerRequest(request, {
      signal: new AbortController().signal,
      drainInbox: () => [],
      send: message => sent.push(message),
      runAgent: async options => {
        calls.push(options)
        options.onText?.("worker finished", false)
        return finishResult()
      },
    })
    expect(calls).toHaveLength(1)
    expect(calls[0]?.runtime).toMatchObject({ profile: "subagent", isSubagent: true, agentType: "explore" })
    expect(calls[0]?.toolsOverride).toEqual(["read"])
    expect(sent.map(message => message.type)).toEqual(["text", "done"])
    expect(sent.at(-1)).toMatchObject({ type: "done", result: "worker finished" })
  })
})

function finishResult(): AgentFinishResult {
  return {
    text: "worker finished",
    tokens: { input: 5, output: 2, cacheRead: 0, cacheWrite: 0, reasoning: 0 },
    newMessages: [],
    contextUsage: {
      historyTokens: 1,
      effectiveTokens: 2,
      contextWindow: 1_000,
      maxOutputTokens: 100,
      compactionThreshold: 800,
    },
  }
}
