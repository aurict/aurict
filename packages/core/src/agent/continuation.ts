export interface ContinuationTaskState {
  status: string
}

export type ContinuationReason =
  | "finish_reason"
  | "empty_response"
  | "stalled_text"
  | "open_tasks"

export type ContinuationStopReason =
  | "complete"
  | "blocked"
  | "budget_exhausted"

export interface ContinuationSignal {
  text: string
  finishReason?: string | undefined
  newMessageCount: number
  tasks?: ContinuationTaskState[]
}

export interface ContinuationBudget {
  previousContinuations?: number | undefined
  maxContinuations?: number | undefined
  maxTaskContinuations?: number | undefined
}

export interface ContinuationDecision {
  shouldContinue: boolean
  reason?: ContinuationReason | undefined
  stopReason?: ContinuationStopReason | undefined
  previousContinuations: number
  maxContinuations: number
  nextContinuationCount: number
  tasksOpen: boolean
}

export function stalledMidTask(text: string): boolean {
  if (!text || text.length < 20) return false
  const t = text.trimEnd()

  const fences = (t.match(/```/g) ?? []).length
  if (fences % 2 !== 0) return true
  if (t.endsWith("…") || t.endsWith("...")) return true
  if (/(?:will\s+(?:now\s+)?(?:continue|proceed|start|implement|fix|update|run|check|verify)|let me (?:now |proceed|continue)|devam edece[gğ]im|şimdi\s+\w+\s+yapaca[gğ]ım)[.….]?\s*$/i.test(t)) return true
  if (/(?:next|then|after that|now I(?:'ll| will)|şimdi|sonra|devamında)[,:]?\s*$/i.test(t)) return true
  if (/(?:^|\n)\s*(?:[-*]|\d+[.)])\s+\S.*(?:\n\s*(?:[-*]|\d+[.)])\s*)$/m.test(t)) return true
  if (/(?:I(?:'ll| will)|I am going to|I'm going to|Next,? I(?:'ll| will)|Şimdi|Sonra|Devamında)\s+[^.!?]{8,120}[.:]?\s*$/i.test(t)) return true
  if (/\b(?:still need to|need to|remaining|not done yet|not finished|not complete|haven't (?:run|verified|tested|checked)|have not (?:run|verified|tested|checked)|next step is|todo:|TODO:)\b/i.test(t)) return true
  if (/\b(?:kalan|henüz (?:bitmedi|tamamlanmadı|test etmedim|doğrulamadım)|devam etmem gerekiyor|sonraki adım|sırada)\b/i.test(t)) return true

  return false
}

export function hasOpenContinuationTasks(tasks: ContinuationTaskState[] = []): boolean {
  return tasks.some((task) => task.status === "pending" || task.status === "in_progress")
}

export function shouldContinueAgentRun(signal: ContinuationSignal): boolean {
  return evaluateContinuation(signal).shouldContinue
}

export function evaluateContinuation(signal: ContinuationSignal, budget: ContinuationBudget = {}): ContinuationDecision {
  const tasksOpen = hasOpenContinuationTasks(signal.tasks)
  const previousContinuations = Math.max(0, budget.previousContinuations ?? 0)
  const maxContinuations = Math.max(0, tasksOpen
    ? budget.maxTaskContinuations ?? budget.maxContinuations ?? 15
    : budget.maxContinuations ?? 5)
  const reason = continuationReason(signal, tasksOpen)

  if (!reason) {
    return {
      shouldContinue: false,
      stopReason: reportsBlocker(signal.text) ? "blocked" : "complete",
      previousContinuations,
      maxContinuations,
      nextContinuationCount: previousContinuations,
      tasksOpen,
    }
  }

  if (previousContinuations >= maxContinuations) {
    return {
      shouldContinue: false,
      reason,
      stopReason: "budget_exhausted",
      previousContinuations,
      maxContinuations,
      nextContinuationCount: previousContinuations,
      tasksOpen,
    }
  }

  return {
    shouldContinue: true,
    reason,
    previousContinuations,
    maxContinuations,
    nextContinuationCount: previousContinuations + 1,
    tasksOpen,
  }
}

function continuationReason(signal: ContinuationSignal, tasksOpen: boolean): ContinuationReason | undefined {
  if (finishReasonNeedsContinuation(signal.finishReason)) return "finish_reason"
  if (!signal.text.trim() && signal.newMessageCount > 0) return "empty_response"
  if (stalledMidTask(signal.text)) return "stalled_text"
  if (tasksOpen && !reportsBlocker(signal.text)) return "open_tasks"
  return undefined
}

function finishReasonNeedsContinuation(reason?: string): boolean {
  if (!reason) return false
  return ["length", "tool-calls", "content-filter", "unknown"].includes(reason)
}

function reportsBlocker(text: string): boolean {
  return /\b(blocked|waiting for|need (?:your|user)|requires? (?:your|user)|cannot proceed|can't proceed|permission denied|manual approval|engel|bekliyor|kullanıcı(?:dan)? gerekli|devam edemem|izin gerekli)\b/i.test(text)
}
