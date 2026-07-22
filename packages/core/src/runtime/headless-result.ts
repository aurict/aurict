import type { AgentFinishResult } from "../agent/types.js"
import type { AgentEvent } from "./contracts.js"

export type HeadlessRunStatus = "completed" | "blocked" | "cancelled" | "infrastructure_error"

export interface HeadlessRunResult {
  schema_version: 1
  task_id: string
  run_id: string
  status: HeadlessRunStatus
  duration_ms: number
  provider: string
  model: string
  steps: number
  tool_calls: number
  input_tokens: number
  output_tokens: number
  estimated_cost_usd: number
  completion_proof: "passed" | "failed" | "pending" | "waived" | "not_applicable" | "missing"
  notes: string[]
}

export function buildHeadlessRunResult(input: {
  taskId: string
  provider: string
  model: string
  result: AgentFinishResult
  events: AgentEvent[]
}): HeadlessRunResult {
  const runtime = input.result.runtime
  if (!runtime) throw new Error("Headless results require an AgentRuntime summary")
  const toolCalls = input.events.filter(event => event.type === "tool.requested").length
  const steps = input.events.filter(event => event.type === "run.provider_phase" && event.phase === "waiting_for_provider").length
  const status: HeadlessRunStatus = runtime.state.phase === "blocked" ? "blocked"
    : runtime.state.phase === "cancelled" ? "cancelled"
      : "completed"
  return {
    schema_version: 1,
    task_id: input.taskId,
    run_id: runtime.runId,
    status,
    duration_ms: Math.max(0, runtime.finishedAt - runtime.startedAt),
    provider: input.provider,
    model: input.model,
    steps,
    tool_calls: toolCalls,
    input_tokens: input.result.tokens.input,
    output_tokens: input.result.tokens.output,
    estimated_cost_usd: runtime.budget.usage.costUsd,
    completion_proof: input.result.completionProof?.status ?? "missing",
    notes: [],
  }
}
