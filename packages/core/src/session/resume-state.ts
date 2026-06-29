import { mkdir, readFile, writeFile } from "node:fs/promises"
import { join } from "node:path"
import type { ActiveSkillPolicy } from "../skill/runtime-policy.js"
import type { ContinuationDecision } from "../agent/continuation.js"
import type { TokenBreakdown } from "../agent/types.js"
import type { WorkingSetSnapshot } from "../agent/working-set.js"
import type { FailureCooldownSnapshot } from "../agent/failure-cooldown.js"
import type { CompletionGateDecision } from "../agent/completion-gate.js"
import type { LongTaskContinuationDecision } from "../agent/continuation-controller.js"
import type { TaskLedger } from "../agent/task-ledger.js"

export interface SessionResumeState {
  sessionId: string
  workdir: string
  provider: string
  model: string
  updatedAt: number
  activeSkills: ActiveSkillPolicy[]
  workingSet?: WorkingSetSnapshot | undefined
  failureCooldown?: FailureCooldownSnapshot | undefined
  completionGate?: CompletionGateDecision | undefined
  continuation?: ContinuationDecision | undefined
  longTask?: LongTaskContinuationDecision | undefined
  taskLedger?: TaskLedger | undefined
  finishReason?: string | undefined
  tokens?: TokenBreakdown | undefined
  lastVerification?: SessionVerificationSnapshot | undefined
  lastTextPreview?: string | undefined
}

export interface SessionVerificationSnapshot {
  status: "passed" | "failed" | "skipped" | "timeout" | "unknown"
  source: "tool_metadata" | "text"
  summary: string
}

export async function readSessionResumeState(workdir: string, sessionId: string): Promise<SessionResumeState | null> {
  try {
    const raw = await readFile(resumeStatePath(workdir, sessionId), "utf8")
    const parsed = JSON.parse(raw) as SessionResumeState
    return parsed.sessionId ? parsed : null
  } catch {
    return null
  }
}

export async function writeSessionResumeState(state: SessionResumeState): Promise<void> {
  const dir = resumeStateDir(state.workdir)
  await mkdir(dir, { recursive: true })
  await writeFile(resumeStatePath(state.workdir, state.sessionId), JSON.stringify(state, null, 2), "utf8")
}

export function extractVerificationSnapshot(text: string): SessionVerificationSnapshot | undefined {
  if (!text.trim()) return undefined
  const lower = text.toLowerCase()
  if (/\[typescript\]\s*✓|0 fail|tests?.*pass|typecheck.*pass|lint.*pass|✓ no errors|no errors/i.test(text)) {
    return { status: "passed", source: "text", summary: summarizeVerificationText(text) }
  }
  if (/\[typescript\].*errors|error ts\d+|tests?.*fail|0 pass|\bfail(?:ed|ure)?\b/i.test(text)) {
    return { status: "failed", source: "text", summary: summarizeVerificationText(text) }
  }
  if (/skipped.*verification|verification.*skipped|post-edit check timed out|timeout/i.test(lower)) {
    return {
      status: /timeout|timed out/i.test(lower) ? "timeout" : "skipped",
      source: "text",
      summary: summarizeVerificationText(text),
    }
  }
  return undefined
}

function summarizeVerificationText(text: string): string {
  const lines = text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => /\[typescript\]|error ts\d+|bun test|pass|fail|skipped|timeout|lint|typecheck/i.test(line))
    .slice(0, 8)
  return (lines.length ? lines.join("\n") : text.trim()).slice(0, 1_500)
}

function resumeStateDir(workdir: string): string {
  return join(workdir, ".aurict", "session-state")
}

function resumeStatePath(workdir: string, sessionId: string): string {
  return join(resumeStateDir(workdir), `${safeSessionId(sessionId)}.json`)
}

function safeSessionId(sessionId: string): string {
  return sessionId.replace(/[^a-zA-Z0-9_.:-]/g, "_")
}
