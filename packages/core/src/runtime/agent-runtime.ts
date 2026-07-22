import type { AgentFinishResult, AgentRunOptions } from "../agent/types.js"
import { AgentEventStream } from "./event-stream.js"
import { RunStateMachine } from "./run-state.js"
import { legacyToolOutcome } from "./tool-outcome.js"
import type { RuntimeProfile, RuntimeRunSummary } from "./contracts.js"
import { RunBudgetManager, BudgetExceededError } from "./budget-manager.js"
import { calculateCostUsd } from "../provider/costs.js"

export type AgentEngine = (options: AgentRunOptions) => Promise<AgentFinishResult>

export class AgentRuntime {
  constructor(private readonly engine: AgentEngine) {}

  async run(options: AgentRunOptions): Promise<AgentFinishResult> {
    const runId = options.runId ?? crypto.randomUUID()
    const profile: RuntimeProfile = options.runtime?.profile ?? "interactive-main"
    const events = new AgentEventStream(runId, options.onEvent)
    const state = new RunStateMachine(runId)
    const budget = new RunBudgetManager(options.runtime?.budget)
    let toolCalls = 0
    let selectedModel: string | undefined
    const wallTimeController = new AbortController()
    const wallTimeLimit = options.runtime?.budget?.wallTimeMs
    const wallTimeTimer = wallTimeLimit === undefined ? undefined : setTimeout(() => {
      wallTimeController.abort(new BudgetExceededError("wallTimeMs", wallTimeLimit, Date.now() - state.snapshot().startedAt))
    }, wallTimeLimit)
    const runtimeSignal = options.signal
      ? AbortSignal.any([options.signal, wallTimeController.signal])
      : wallTimeController.signal

    events.emit({ type: "run.started", profile })
    events.emit({
      type: "run.phase_changed",
      state: state.transition("preparing", "runtime_started"),
    })

    const { onPhase, onModelSelected, onToolSelection, onToolCall, onToolResult, onCompaction, onProviderFallback, onFinish, ...base } = options
    const wrapped: AgentRunOptions = {
      ...base,
      signal: runtimeSignal,
      onPhase: phase => {
        if (phase === "waiting_for_provider") budget.recordModelTurn()
        events.emit({ type: "run.provider_phase", phase })
        onPhase?.(phase)
      },
      onModelSelected: selection => {
        selectedModel = selection.model
        events.emit({ type: "model.selected", ...selection })
        onModelSelected?.(selection)
      },
      onToolSelection: selection => {
        events.emit({
          type: "tools.selected",
          toolIds: selection.toolIds,
          capabilities: selection.capabilities,
          omittedCount: selection.omittedCount,
          reason: selection.reason,
        })
        onToolSelection?.(selection)
      },
      onToolCall: call => {
        budget.recordToolCall()
        toolCalls++
        if (state.current !== "executing") {
          events.emit({
            type: "run.phase_changed",
            state: state.transition("executing", "tool_requested"),
          })
        }
        events.emit({ type: "tool.requested", toolCallId: call.id, tool: call.tool, args: call.args })
        onToolCall?.(call)
      },
      onToolResult: result => {
        const outcome = result.outcome ?? legacyToolOutcome(result)
        budget.recordToolOutcome(outcome)
        const enriched = { ...result, outcome }
        events.emit({ type: "tool.completed", toolCallId: result.id, tool: result.tool, outcome })
        onToolResult?.(enriched)
      },
      onCompaction: event => {
        events.emit({
          type: "context.compacted",
          beforeTokens: event.before.effectiveTokens,
          afterTokens: event.after.effectiveTokens,
          reason: event.reason,
        })
        onCompaction?.(event)
      },
      onProviderFallback: (from, to, models) => {
        events.emit({ type: "provider.fallback", from, to })
        onProviderFallback?.(from, to, models)
      },
    }

    try {
      const result = await this.engine(wrapped)
      budget.recordUsage(
        result.tokens.input + result.tokens.cacheRead + result.tokens.cacheWrite,
        result.tokens.output + result.tokens.reasoning,
        selectedModel ? calculateCostUsd(selectedModel, result.tokens) : 0,
      )
      const blocked = result.continuation?.stopReason === "blocked"
      const terminalState = state.transition(blocked ? "blocked" : "completed", blocked ? "run_blocked" : "run_finished")
      const finishedAt = Date.now()
      const runtime: RuntimeRunSummary = {
        runId,
        profile,
        state: terminalState,
        eventCount: events.count + 1,
        toolCalls,
        startedAt: terminalState.startedAt,
        finishedAt,
        budget: budget.snapshot(),
      }
      const enriched = { ...result, runtime }
      events.emit({ type: "run.completed", state: terminalState, tokens: result.tokens })
      onFinish?.(enriched)
      return enriched
    } catch (error) {
      const failure = wallTimeController.signal.aborted && wallTimeController.signal.reason instanceof BudgetExceededError
        ? wallTimeController.signal.reason
        : error
      const cancelled = options.signal?.aborted === true
      const terminalState = state.transition(cancelled ? "cancelled" : "failed", cancelled ? "user_cancelled" : "runtime_error")
      events.emit({
        type: "run.failed",
        state: terminalState,
        error: failure instanceof Error ? failure.message : String(failure),
      })
      throw failure
    } finally {
      if (wallTimeTimer !== undefined) clearTimeout(wallTimeTimer)
    }
  }
}
