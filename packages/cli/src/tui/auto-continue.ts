import type { Task } from "@aurict/core"

export const AUTO_CONTINUE_PROMPT =
  "Continue from where you stopped. Do not wait for me; keep working until the original task is complete, blocked by a required user decision, or limited by the environment."

export interface ContinuationSignal {
  text: string
  finishReason?: string | undefined
  newMessageCount: number
  tasks: Task[]
}

/**
 * Model görev ortasında metin bırakıp durdu mu?
 * Token kesintisi, devam ifadesi veya yarım kalmış aksiyon cümlesi varsa true döner.
 */
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

  return false
}

function hasOpenTasks(tasks: Task[]): boolean {
  return tasks.some((task) => task.status === "pending" || task.status === "in_progress")
}

function finishReasonNeedsContinuation(reason?: string): boolean {
  if (!reason) return false
  return ["length", "tool-calls", "content-filter", "unknown"].includes(reason)
}

export function shouldAutoContinue(signal: ContinuationSignal): boolean {
  if (finishReasonNeedsContinuation(signal.finishReason)) return true
  if (!signal.text.trim() && signal.newMessageCount > 0) return true
  if (stalledMidTask(signal.text)) return true
  if (hasOpenTasks(signal.tasks) && !/\b(blocked|waiting for|need (?:your|user)|requires? (?:your|user)|engel|bekliyor|kullanıcı(?:dan)? gerekli)\b/i.test(signal.text)) {
    return true
  }
  return false
}
