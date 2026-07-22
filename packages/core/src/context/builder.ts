import type { SessionVerificationSnapshot } from "../session/resume-state.js"
import type { Task } from "../task/types.js"
import type { WorkingSetSnapshot } from "../agent/working-set.js"
import type { ContextFileRef, FailedStrategy, TaskContext } from "./types.js"

export interface BuildTaskContextInput {
  objective: string
  tasks: Task[]
  workingSet: WorkingSetSnapshot
  verification?: SessionVerificationSnapshot
  previous?: TaskContext
  now?: number
}

export function buildTaskContext(input: BuildTaskContextInput): TaskContext {
  const relevantFiles = mergeFiles(input.previous?.relevantFiles ?? [], input.workingSet)
  const failedStrategies = mergeFailures(input.previous?.failedStrategies ?? [], input.workingSet)
  const evidenceRefs = [...new Set([
    ...(input.previous?.evidenceRefs ?? []),
    ...(input.verification?.source === "tool_metadata" ? [`verification:${input.verification.status}`] : []),
  ])].slice(-50)

  return {
    version: 1,
    objective: input.objective.trim().slice(0, 2_000),
    constraints: input.previous?.constraints.map(item => ({ ...item })) ?? [],
    decisions: input.previous?.decisions.map(item => ({ ...item })) ?? [],
    workspaceFacts: input.previous?.workspaceFacts.map(item => ({ ...item })) ?? [],
    relevantFiles,
    failedStrategies,
    openQuestions: [...(input.previous?.openQuestions ?? [])],
    tasks: input.tasks.map(task => cloneTask(task)),
    evidenceRefs,
    ...(input.previous?.requestedCapabilities?.length
      ? { requestedCapabilities: [...input.previous.requestedCapabilities] }
      : {}),
    updatedAt: input.now ?? Date.now(),
  }
}

function mergeFiles(previous: ContextFileRef[], workingSet: WorkingSetSnapshot): ContextFileRef[] {
  const files = new Map(previous.map(item => [item.path, { ...item }]))
  for (const item of workingSet.items) {
    if (item.kind !== "file" || !item.path) continue
    files.set(item.path, {
      path: item.path,
      reason: item.reason,
      status: item.status === "failed" ? "failed"
        : item.status === "passed" ? "verified"
          : item.reason === "changed file" ? "changed" : "active",
    })
  }
  return [...files.values()].slice(-100)
}

function mergeFailures(previous: FailedStrategy[], workingSet: WorkingSetSnapshot): FailedStrategy[] {
  const failures = new Map(previous.map(item => [item.fingerprint, { ...item }]))
  for (const item of workingSet.items) {
    if (item.kind !== "error" || item.status !== "failed") continue
    const fingerprint = stableFingerprint(`${item.source}:${item.label}`)
    const existing = failures.get(fingerprint)
    failures.set(fingerprint, {
      fingerprint,
      summary: item.label.slice(0, 500),
      attempts: (existing?.attempts ?? 0) + 1,
    })
  }
  return [...failures.values()].slice(-30)
}

function cloneTask(task: Task): Task {
  return {
    ...task,
    blockedBy: [...task.blockedBy],
    ...(task.dependencies ? { dependencies: [...task.dependencies] } : {}),
    ...(task.evidence ? { evidence: [...task.evidence] } : {}),
  }
}

function stableFingerprint(value: string): string {
  let hash = 0
  for (let index = 0; index < value.length; index++) hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0
  return Math.abs(hash).toString(16)
}
