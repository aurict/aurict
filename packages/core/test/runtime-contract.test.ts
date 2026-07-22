import { describe, expect, it } from "bun:test"
import { z } from "zod"
import type { AgentEvent, AgentFinishResult, AgentRunOptions, ToolDef } from "../src/index.js"
import { AgentRuntime } from "../src/runtime/agent-runtime.js"
import { RunStateMachine } from "../src/runtime/run-state.js"
import { buildHeadlessRunResult } from "../src/runtime/headless-result.js"
import { toolOutcomeFromExecuteResult } from "../src/runtime/tool-outcome.js"

const baseFinish: AgentFinishResult = {
  text: "finished",
  tokens: { input: 12, output: 4, cacheRead: 0, cacheWrite: 0, reasoning: 0 },
  newMessages: [],
  contextUsage: {
    historyTokens: 10,
    effectiveTokens: 20,
    contextWindow: 1_000,
    maxOutputTokens: 100,
    compactionThreshold: 800,
  },
  continuation: {
    shouldContinue: false,
    stopReason: "complete",
    previousContinuations: 0,
    maxContinuations: 5,
    nextContinuationCount: 0,
    tasksOpen: false,
  },
}

describe("run state contract", () => {
  it("allows declared transitions and rejects transitions out of terminal states", () => {
    let now = 10
    const state = new RunStateMachine("run-1", () => now++)
    state.transition("preparing", "runtime_started")
    state.transition("executing", "tool_requested")
    state.transition("completed", "run_finished")
    expect(state.snapshot().transitions.map(item => `${item.from}->${item.to}`)).toEqual([
      "created->preparing",
      "preparing->executing",
      "executing->completed",
    ])
    expect(() => state.transition("executing", "tool_requested")).toThrow("Invalid run-state transition")
  })
})

describe("AgentRuntime event contract", () => {
  it("emits one versioned, monotonically ordered event stream and preserves callbacks", async () => {
    const events: AgentEvent[] = []
    const callbacks: string[] = []
    const runtime = new AgentRuntime(async options => fakeEngine(options))
    const result = await runtime.run({
      runId: "contract-run",
      runtime: { profile: "headless" },
      messages: [{ role: "user", content: "test" }],
      onEvent: event => events.push(event),
      onToolCall: call => callbacks.push(`call:${call.tool}`),
      onToolResult: toolResult => callbacks.push(`result:${toolResult.outcome?.status}`),
      onFinish: finish => callbacks.push(`finish:${finish.runtime?.state.phase}`),
    })

    expect(events.map(event => event.type)).toEqual([
      "run.started",
      "run.phase_changed",
      "run.provider_phase",
      "run.phase_changed",
      "tool.requested",
      "tool.completed",
      "run.completed",
    ])
    expect(events.every(event => event.schemaVersion === 1 && event.runId === "contract-run")).toBe(true)
    expect(events.map(event => event.sequence)).toEqual([1, 2, 3, 4, 5, 6, 7])
    expect(callbacks).toEqual(["call:read", "result:unknown", "finish:completed"])
    expect(result.runtime?.eventCount).toBe(7)
    expect(result.runtime?.toolCalls).toBe(1)
  })

  it("keeps main and subagent profiles on identical runtime semantics", async () => {
    const runtime = new AgentRuntime(async options => fakeEngine(options))
    const main = await runtime.run({ messages: [], runtime: { profile: "interactive-main" } })
    const subagent = await runtime.run({ messages: [], runtime: { profile: "subagent", isSubagent: true } })
    expect(main.runtime?.state.phase).toBe("completed")
    expect(subagent.runtime?.state.phase).toBe("completed")
    expect(main.runtime?.toolCalls).toBe(subagent.runtime?.toolCalls)
    expect(main.text).toBe(subagent.text)
  })

  it("builds the phase-A headless result from runtime events", async () => {
    const events: AgentEvent[] = []
    const runtime = new AgentRuntime(async options => fakeEngine(options))
    const result = await runtime.run({ messages: [], runtime: { profile: "headless" }, onEvent: event => events.push(event) })
    const headless = buildHeadlessRunResult({ taskId: "fixture-1", provider: "mock", model: "mock-1", result, events })
    expect(headless.schema_version).toBe(1)
    expect(headless.status).toBe("completed")
    expect(headless.tool_calls).toBe(1)
    expect(headless.input_tokens).toBe(12)
  })
})

describe("typed tool outcomes", () => {
  it("records native effects and verification without parsing display text", () => {
    const tool: ToolDef = {
      id: "edit",
      description: "edit",
      parameters: z.object({}),
      spec: { category: "write", riskLevel: "medium" },
      async execute() { return { output: "Updated file" } },
    }
    const outcome = toolOutcomeFromExecuteResult(tool, {
      output: "human-facing output with no status convention",
      metadata: {
        changedFiles: ["src/a.ts"],
        verification: { tsc: { status: "passed", output: "clean" } },
      },
    }, 15)
    expect(outcome.status).toBe("succeeded")
    expect(outcome.effects).toEqual([{ kind: "workspace_write", paths: ["src/a.ts"] }])
    expect(outcome.verification).toEqual([{ check: "tsc", status: "passed", summary: "clean" }])
    expect(outcome.retry).toEqual({ safety: "reconcilable", effectCommitted: true })
    expect(outcome.source).toBe("native")
  })
})

async function fakeEngine(options: AgentRunOptions): Promise<AgentFinishResult> {
  options.onPhase?.("waiting_for_provider")
  options.onToolCall?.({ id: "call-1", tool: "read", args: { path: "a.ts" } })
  options.onToolResult?.({
    id: "call-1",
    tool: "read",
    result: "contents",
    durationMs: 2,
    artifact: { kind: "output", output: "contents", outputLines: 1 },
  })
  return baseFinish
}
