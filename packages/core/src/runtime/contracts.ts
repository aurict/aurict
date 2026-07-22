import type { AgentRunPhase, TokenBreakdown } from "../agent/types.js"
import type { ToolResultArtifact } from "../agent/tool-result-artifact.js"
import type { AgentType } from "../agent/protocol.js"

export const AGENT_EVENT_SCHEMA_VERSION = 1 as const

export type RuntimeProfile =
  | "interactive-main"
  | "desktop-sidecar"
  | "headless"
  | "subagent"

export type RunPhase =
  | "created"
  | "preparing"
  | "planning"
  | "executing"
  | "verifying"
  | "recovering"
  | "blocked"
  | "completed"
  | "failed"
  | "cancelled"

export type RunTransitionReason =
  | "runtime_started"
  | "context_preparation"
  | "tool_requested"
  | "verification_required"
  | "run_finished"
  | "run_blocked"
  | "runtime_error"
  | "user_cancelled"

export interface RunStateSnapshot {
  runId: string
  phase: RunPhase
  revision: number
  startedAt: number
  updatedAt: number
  transitions: Array<{
    from: RunPhase
    to: RunPhase
    reason: RunTransitionReason
    at: number
  }>
}

export type ToolOutcomeStatus = "succeeded" | "failed" | "cancelled" | "timed_out" | "unknown"
export type RetrySafety = "pure" | "idempotent" | "reconcilable" | "non_repeatable" | "unknown"

export type ToolEffect =
  | { kind: "read"; paths: string[] }
  | { kind: "workspace_write"; paths: string[] }
  | { kind: "process"; commandClass?: string }
  | { kind: "network_read"; target?: string }
  | { kind: "external_write"; target?: string }
  | { kind: "unknown" }

export interface ToolOutcome {
  status: ToolOutcomeStatus
  summary: string
  display: string
  modelContent: string
  effects: ToolEffect[]
  artifacts: ToolResultArtifact[]
  verification: Array<{
    check: string
    status: "passed" | "failed" | "skipped" | "timeout"
    summary?: string
    workspaceRevision?: string
    baseRevision?: string
  }>
  retry: {
    safety: RetrySafety
    effectCommitted: boolean
  }
  metrics: {
    durationMs: number
    outputBytes: number
  }
  source: "native" | "legacy_adapter"
}

interface EventBase {
  schemaVersion: typeof AGENT_EVENT_SCHEMA_VERSION
  runId: string
  sequence: number
  timestamp: number
}

export type AgentEvent =
  | (EventBase & { type: "run.started"; profile: RuntimeProfile })
  | (EventBase & { type: "run.phase_changed"; state: RunStateSnapshot })
  | (EventBase & { type: "run.provider_phase"; phase: AgentRunPhase })
  | (EventBase & { type: "model.selected"; provider: string; model: string; mode: "auto" | "pinned" })
  | (EventBase & { type: "tools.selected"; toolIds: string[]; capabilities: string[]; omittedCount: number; reason: string })
  | (EventBase & { type: "tool.requested"; toolCallId: string; tool: string; args: unknown })
  | (EventBase & { type: "tool.completed"; toolCallId: string; tool: string; outcome: ToolOutcome })
  | (EventBase & { type: "context.compacted"; beforeTokens: number; afterTokens: number; reason: string })
  | (EventBase & { type: "provider.fallback"; from: string; to: string })
  | (EventBase & { type: "run.completed"; state: RunStateSnapshot; tokens: TokenBreakdown })
  | (EventBase & { type: "run.failed"; state: RunStateSnapshot; error: string })

export interface RuntimeExecutionOptions {
  profile?: RuntimeProfile
  maxSteps?: number
  isSubagent?: boolean
  agentType?: AgentType
  sendMessage?: (to: string, message: string) => void
  budget?: RunBudgetLimits
}

export interface RunBudgetLimits {
  wallTimeMs?: number
  modelTurns?: number
  toolCalls?: number
  mutationCalls?: number
  verificationRuns?: number
  inputTokens?: number
  outputTokens?: number
  costUsd?: number
}

export interface RunBudgetSnapshot {
  limits: RunBudgetLimits
  usage: Required<RunBudgetLimits>
}

export interface RuntimeRunSummary {
  runId: string
  profile: RuntimeProfile
  state: RunStateSnapshot
  eventCount: number
  toolCalls: number
  startedAt: number
  finishedAt: number
  budget: RunBudgetSnapshot
}
