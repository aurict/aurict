import type { ContinuationDecision } from "./continuation.js"
import type { WorkingSetSnapshot } from "./working-set.js"
import type { SessionVerificationSnapshot } from "../session/resume-state.js"

export type CompletionGateStatus =
  | "complete"
  | "continue_required"
  | "blocked"
  | "verification_required"
  | "budget_exhausted"

export interface CompletionGateDecision {
  status: CompletionGateStatus
  shouldAutoContinue: boolean
  reason: string
  shadowOnly: boolean
}

export interface CompletionGateInput {
  text: string
  continuation: ContinuationDecision
  workingSet: WorkingSetSnapshot
  verification?: SessionVerificationSnapshot | undefined
  allowTaskAutoContinue?: boolean | undefined
}

export function evaluateCompletionGate(input: CompletionGateInput): CompletionGateDecision {
  if (process.env["AURICT_DISABLE_COMPLETION_GATE"] === "1") {
    return { status: "complete", shouldAutoContinue: false, reason: "completion gate disabled", shadowOnly: true }
  }
  if (input.continuation.stopReason === "blocked") {
    return { status: "blocked", shouldAutoContinue: false, reason: "continuation reported blocker", shadowOnly: false }
  }
  if (input.continuation.stopReason === "budget_exhausted") {
    return { status: "budget_exhausted", shouldAutoContinue: false, reason: "continuation budget exhausted", shadowOnly: false }
  }
  if (input.continuation.shouldContinue) {
    return { status: "continue_required", shouldAutoContinue: true, reason: `continuation:${input.continuation.reason ?? "unknown"}`, shadowOnly: false }
  }

  const allowTaskAutoContinue = input.allowTaskAutoContinue ?? true

  const changedFiles = input.workingSet.items.filter(item => item.kind === "file" && item.reason === "changed file")
  const failedVerification = input.workingSet.items.find(item => item.kind === "verification" && item.status === "failed")
  const skippedRisky = input.verification?.status === "timeout"
  const hasPassedVerification = input.verification?.status === "passed" ||
    input.workingSet.items.some(item => item.kind === "verification" && item.status === "passed")

  if (failedVerification) {
    return {
      status: "verification_required",
      shouldAutoContinue: allowTaskAutoContinue,
      reason: allowTaskAutoContinue ? "verification failed" : "verification failed outside task turn",
      shadowOnly: !allowTaskAutoContinue,
    }
  }
  if (changedFiles.length > 0 && !hasPassedVerification) {
    const safeSkip = input.verification?.status === "skipped" && /non-type change|comment/i.test(input.verification.summary)
    if (!safeSkip) {
      return {
        status: "verification_required",
        shouldAutoContinue: allowTaskAutoContinue && !skippedRisky,
        reason: !allowTaskAutoContinue ? "changed files outside task turn" : skippedRisky ? "verification timed out" : "changed files lack passing verification",
        shadowOnly: !allowTaskAutoContinue || process.env["AURICT_COMPLETION_GATE_SHADOW"] === "1",
      }
    }
  }

  return { status: "complete", shouldAutoContinue: false, reason: "no blocking completion signals", shadowOnly: false }
}
