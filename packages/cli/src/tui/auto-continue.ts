import type { Task } from "@aurict/core"
import {
  hasOpenContinuationTasks,
  shouldContinueAgentRun,
  stalledMidTask,
  type ContinuationSignal as CoreContinuationSignal,
} from "@aurict/core"

export const AUTO_CONTINUE_PROMPT =
  "Continue from where you stopped. Do not wait for me; keep working until the original task is complete, blocked by a required user decision, or limited by the environment."

export interface ContinuationSignal {
  text: string
  finishReason?: string | undefined
  newMessageCount: number
  tasks: Task[]
}

export { stalledMidTask }

export function hasOpenTasks(tasks: Task[]): boolean {
  return hasOpenContinuationTasks(tasks)
}

export function shouldAutoContinue(signal: ContinuationSignal): boolean {
  return shouldContinueAgentRun(signal as CoreContinuationSignal)
}
