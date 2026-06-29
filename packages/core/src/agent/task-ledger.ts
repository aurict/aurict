import type { ContinuationDecision, ContinuationTaskState } from "./continuation.js"
import type { WorkingSetSnapshot } from "./working-set.js"
import type { SessionVerificationSnapshot } from "../session/resume-state.js"

export type TaskPhase = "planning" | "executing" | "verifying" | "recovering" | "blocked" | "complete"

export interface LedgerStep {
  id: string
  status: "pending" | "in_progress" | "done"
  label: string
}

export interface ToolErrorState {
  message: string
  source?: string | undefined
  count: number
}

export interface RecoveryAttempt {
  fingerprint: string
  count: number
  lastTriedAt: number
}

export interface TaskLedger {
  objective: string
  phase: TaskPhase
  openSteps: LedgerStep[]
  changedFiles: string[]
  verification: {
    status: "none" | SessionVerificationSnapshot["status"]
    summary?: string | undefined
  }
  lastToolError?: ToolErrorState | undefined
  recoveryAttempts: RecoveryAttempt[]
  blockers: string[]
  lastProgressAt: number
}

export interface BuildTaskLedgerInput {
  objective: string
  workingSet: WorkingSetSnapshot
  verification?: SessionVerificationSnapshot | undefined
  continuation?: ContinuationDecision | undefined
  tasks?: ContinuationTaskState[] | undefined
  previous?: TaskLedger | undefined
}

export function buildTaskLedger(input: BuildTaskLedgerInput): TaskLedger {
  const changedFiles = input.workingSet.items
    .filter(item => item.kind === "file" && item.reason === "changed file")
    .map(item => item.path ?? item.label)
    .slice(0, 20)
  const failedVerification = input.workingSet.items.find(item => item.kind === "verification" && item.status === "failed")
  const failedError = input.workingSet.items.find(item => item.kind === "error" && item.status === "failed")
  const openSteps = buildOpenSteps(input.tasks)
  const verification = input.verification
    ? { status: input.verification.status, summary: input.verification.summary }
    : failedVerification
      ? { status: "failed" as const, summary: failedVerification.label }
      : { status: "none" as const }
  const blockers = input.continuation?.stopReason === "blocked" ? ["continuation reported blocker"] : []
  const lastToolError = failedError
    ? {
        message: failedError.label,
        source: failedError.source,
        count: repeatedErrorCount(input.previous, failedError.label),
      }
    : input.previous?.lastToolError

  return {
    objective: input.objective.slice(0, 500),
    phase: inferPhase({
      changedFiles,
      verificationStatus: verification.status,
      continuation: input.continuation,
      openSteps,
      hasError: Boolean(failedError),
      blockers,
    }),
    openSteps,
    changedFiles,
    verification,
    ...(lastToolError ? { lastToolError } : {}),
    recoveryAttempts: updateRecoveryAttempts(input.previous?.recoveryAttempts ?? [], failedError?.label),
    blockers,
    lastProgressAt: Date.now(),
  }
}

export function formatTaskLedgerAnchor(ledger: TaskLedger, maxChars = 1_500): string {
  const lines = [
    "[Task Ledger]",
    `Objective: ${ledger.objective || "(unknown)"}`,
    `Phase: ${ledger.phase}`,
    `Changed files: ${ledger.changedFiles.length ? ledger.changedFiles.join(", ") : "(none)"}`,
    `Verification: ${ledger.verification.status}${ledger.verification.summary ? ` - ${oneLine(ledger.verification.summary, 220)}` : ""}`,
    `Open steps: ${ledger.openSteps.length ? ledger.openSteps.map(step => `${step.status}:${step.label}`).join("; ") : "(none)"}`,
    ledger.lastToolError ? `Last error: ${oneLine(ledger.lastToolError.message, 220)} (${ledger.lastToolError.count}x)` : "",
    ledger.blockers.length ? `Blockers: ${ledger.blockers.join("; ")}` : "",
    "Do not finalize if phase is verifying or recovering unless you clearly report a blocker.",
  ].filter(Boolean)
  const text = lines.join("\n")
  return text.length > maxChars ? `${text.slice(0, maxChars - 14)}…[truncated]` : text
}

function buildOpenSteps(tasks: ContinuationTaskState[] = []): LedgerStep[] {
  return tasks
    .filter(task => task.status === "pending" || task.status === "in_progress")
    .slice(0, 12)
    .map((task, index) => ({
      id: `task-${index + 1}`,
      status: task.status === "in_progress" ? "in_progress" : "pending",
      label: task.status,
    }))
}

function inferPhase(input: {
  changedFiles: string[]
  verificationStatus: TaskLedger["verification"]["status"]
  continuation?: ContinuationDecision | undefined
  openSteps: LedgerStep[]
  hasError: boolean
  blockers: string[]
}): TaskPhase {
  if (input.blockers.length > 0 || input.continuation?.stopReason === "blocked") return "blocked"
  if (input.continuation?.stopReason === "budget_exhausted") return "blocked"
  if (input.hasError || input.verificationStatus === "failed") return "recovering"
  if (input.changedFiles.length > 0 && input.verificationStatus !== "passed" && input.verificationStatus !== "skipped") return "verifying"
  if (input.openSteps.length > 0 || input.continuation?.shouldContinue) return "executing"
  if (input.changedFiles.length === 0 && input.verificationStatus === "none") return "planning"
  return "complete"
}

function repeatedErrorCount(previous: TaskLedger | undefined, message: string): number {
  return previous?.lastToolError?.message === message ? previous.lastToolError.count + 1 : 1
}

function updateRecoveryAttempts(previous: RecoveryAttempt[], error?: string): RecoveryAttempt[] {
  if (!error) return previous
  const fingerprint = hashKey(error)
  const now = Date.now()
  const existing = previous.find(item => item.fingerprint === fingerprint)
  const next = existing
    ? previous.map(item => item.fingerprint === fingerprint ? { ...item, count: item.count + 1, lastTriedAt: now } : item)
    : [...previous, { fingerprint, count: 1, lastTriedAt: now }]
  return next.slice(-12)
}

function oneLine(value: string, max: number): string {
  const clean = value.replace(/\s+/g, " ").trim()
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean
}

function hashKey(text: string): string {
  let hash = 0
  for (let i = 0; i < text.length; i++) hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0
  return Math.abs(hash).toString(16)
}
