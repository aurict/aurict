import type { Task } from "@aurict/core"
import { shouldContinueAgentRun, stalledMidTask, type ContinuationSignal as CoreContinuationSignal } from "@aurict/core"

export const AUTO_CONTINUE_PROMPT =
  "Resume the original task from the current state. Take the next necessary action, then reassess whether the task is complete. Stop if it is complete or a user decision is required."

export interface ContinuationSignal {
  text: string
  finishReason?: string | undefined
  newMessageCount: number
  tasks: Task[]
}

export { stalledMidTask }

export function shouldAutoContinue(signal: ContinuationSignal): boolean {
  return shouldContinueAgentRun(signal as CoreContinuationSignal)
}

export function stopAutoContinueAfterFailure(
  state: { count: number },
): { needed: false; count: number } {
  return { needed: false, count: state.count }
}
