import type { CompletionGateDecision } from "./completion-gate.js"
import type { ContinuationDecision } from "./continuation.js"
import type { TaskLedger, TaskPhase } from "./task-ledger.js"
import type { ResolvedLongTaskRuntimeConfig } from "../config/config.js"

export type LongTaskContinuationReason =
  | "disabled"
  | "not_task_turn"
  | "completion_gate"
  | "verification_pending"
  | "recovery_required"
  | "open_steps"
  | "future_tense"
  | "blocked"
  | "budget_exhausted"
  | "complete"

export interface LongTaskBudgetState {
  previousContinuations: number
}

export interface LongTaskContinuationDecision {
  shouldContinue: boolean
  reason: LongTaskContinuationReason
  phase: TaskPhase
  nudge?: string | undefined
  shadowOnly: boolean
}

export interface EvaluateLongTaskContinuationInput {
  text: string
  ledger: TaskLedger
  completionGate: CompletionGateDecision
  continuation: ContinuationDecision
  config: ResolvedLongTaskRuntimeConfig
  budget: LongTaskBudgetState
  taskIntent?: boolean | undefined
}

export function evaluateLongTaskContinuation(input: EvaluateLongTaskContinuationInput): LongTaskContinuationDecision {
  const { config, ledger } = input
  const shadowOnly = config.mode === "shadow"

  if (!config.enabled || config.mode === "off") {
    return { shouldContinue: false, reason: "disabled", phase: ledger.phase, shadowOnly: true }
  }
  if (input.taskIntent === false) {
    return { shouldContinue: false, reason: "not_task_turn", phase: ledger.phase, shadowOnly: true }
  }
  if (input.budget.previousContinuations >= config.maxContinuationSteps) {
    return {
      shouldContinue: false,
      reason: "budget_exhausted",
      phase: ledger.phase,
      shadowOnly: false,
      nudge: "Long-task continuation budget is exhausted. Report exact remaining state instead of claiming completion.",
    }
  }
  if (ledger.phase === "blocked" || input.completionGate.status === "blocked") {
    return { shouldContinue: false, reason: "blocked", phase: ledger.phase, shadowOnly: false }
  }
  if (input.continuation.shouldContinue || input.completionGate.shouldAutoContinue) {
    return continueDecision("completion_gate", input)
  }
  if (ledger.phase === "recovering") {
    return continueDecision("recovery_required", input)
  }
  if (ledger.phase === "verifying" && config.strictVerification) {
    return continueDecision("verification_pending", input)
  }
  if (ledger.openSteps.length > 0) {
    return continueDecision("open_steps", input)
  }
  if (looksLikeFutureTense(input.text)) {
    return continueDecision("future_tense", input)
  }

  return { shouldContinue: false, reason: "complete", phase: ledger.phase, shadowOnly }
}

function continueDecision(reason: LongTaskContinuationReason, input: EvaluateLongTaskContinuationInput): LongTaskContinuationDecision {
  return {
    shouldContinue: input.config.mode !== "shadow",
    reason,
    phase: input.ledger.phase,
    shadowOnly: input.config.mode === "shadow",
    nudge: buildNudge(reason, input.ledger),
  }
}

function buildNudge(reason: LongTaskContinuationReason, ledger: TaskLedger): string {
  const parts = [
    "Continue the task. Do not summarize yet.",
    `Current phase: ${ledger.phase}.`,
  ]
  if (reason === "verification_pending") {
    parts.push("Changed files exist and passing verification is missing. Run relevant verification or explain a real blocker.")
  } else if (reason === "recovery_required") {
    parts.push("A tool or verification error remains unresolved. Diagnose the root cause and try a different fix before finalizing.")
  } else if (reason === "open_steps") {
    parts.push("There are still open task steps. Complete them or mark a concrete blocker.")
  } else if (reason === "future_tense") {
    parts.push("Your last response described future work. Perform the next action instead of ending the turn.")
  } else {
    parts.push("The completion gate still requires continuation.")
  }
  if (ledger.changedFiles.length > 0) parts.push(`Changed files: ${ledger.changedFiles.slice(0, 8).join(", ")}`)
  if (ledger.verification.status !== "none") parts.push(`Verification: ${ledger.verification.status}`)
  if (ledger.lastToolError) parts.push(`Last error: ${ledger.lastToolError.message.slice(0, 240)}`)
  return parts.join("\n")
}

function looksLikeFutureTense(text: string): boolean {
  const t = text.trim()
  if (!t) return false
  return /\b(I(?:'ll| will)|I am going to|I'm going to|Next,? I(?:'ll| will)|will now|need to run|still need to|henüz|şimdi .* yapaca[gğ]ım|devam edece[gğ]im|sonraki adım)\b/i.test(t)
}
