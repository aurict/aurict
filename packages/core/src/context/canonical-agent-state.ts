import type { ActiveSkillPolicy } from "../skill/runtime-policy.js"
import type { FailureCooldownSnapshot } from "../agent/failure-cooldown.js"
import type { KnownDeadEnd } from "../agent/attention-anchor.js"
import type { FragileArea } from "../agent/fragile-areas.js"
import type { TaskLedger } from "../agent/task-ledger.js"
import type { TaskContext } from "./types.js"
import type { PostEditVerificationJob } from "../verification/post-edit-scheduler.js"

export interface CanonicalAgentStateInput {
  context: TaskContext
  ledger?: TaskLedger
  activeSkill?: ActiveSkillPolicy | null
  cooldown?: FailureCooldownSnapshot
  knownDeadEnds?: KnownDeadEnd[]
  fragileAreas?: FragileArea[]
  backgroundVerification?: PostEditVerificationJob[]
  includeStatusProtocol?: boolean
  maxChars?: number
}

export function formatCanonicalAgentState(input: CanonicalAgentStateInput): string {
  const { context, ledger } = input
  const openTasks = context.tasks.filter(task => !["done", "cancelled"].includes(task.status)).slice(0, 12)
  const cooldowns = input.cooldown?.active.slice(0, 4) ?? []
  const deadEnds = input.knownDeadEnds?.slice(0, 5) ?? []
  const fragile = input.fragileAreas?.slice(0, 5) ?? []
  const maxChars = Math.max(800, input.maxChars ?? 5_500)
  const backgroundVerification = input.backgroundVerification?.slice(-4) ?? []
  const lines = [
    "[Canonical Agent State v1]",
    `Objective: ${oneLine(context.objective || ledger?.objective || "Continue the current user task.", 500)}`,
    ledger ? `Phase: ${ledger.phase}` : "",
    input.activeSkill ? `Active skill: ${input.activeSkill.skillName} (${input.activeSkill.skillId})` : "",
    openTasks.length
      ? `Open tasks: ${openTasks.map(task => `${task.id}:${oneLine(task.subject, 100)} [${task.status}]`).join("; ")}`
      : "Open tasks: (none)",
    context.relevantFiles.length
      ? `Files: ${context.relevantFiles.slice(-16).map(file => `${file.path} (${file.status ?? "active"})`).join(", ")}`
      : "",
    ledger ? `Verification: ${ledger.verification.status}${ledger.verification.summary ? ` — ${oneLine(ledger.verification.summary, 300)}` : ""}` : "",
    backgroundVerification.length
      ? `Background verification: ${backgroundVerification.map(job => `${job.filePath}:${job.status}${job.output ? ` (${oneLine(job.output, 160)})` : ""}`).join("; ")}`
      : "",
    context.evidenceRefs.length ? `Evidence: ${context.evidenceRefs.slice(-12).join(", ")}` : "",
    ledger?.lastToolError ? `Last error: ${oneLine(ledger.lastToolError.message, 260)} (${ledger.lastToolError.count}x)` : "",
    ledger?.blockers.length ? `Blockers: ${ledger.blockers.join("; ")}` : "",
    context.openQuestions.length ? `Open questions: ${context.openQuestions.slice(-6).join("; ")}` : "",
    context.failedStrategies.length
      ? `Failed strategies: ${context.failedStrategies.slice(-6).map(item => `${oneLine(item.summary, 140)} (${item.attempts}x)`).join("; ")}`
      : "",
    cooldowns.length
      ? `Cooldowns: ${cooldowns.map(item => `${item.tool}${item.path ? `:${item.path}` : ""} — ${oneLine(item.reason, 120)} (${item.count}x)`).join(" | ")}`
      : "",
    deadEnds.length
      ? `Known dead ends: ${deadEnds.map(item => `${item.tool}${item.path ? `:${item.path}` : ""} — ${oneLine(item.reason, 120)}`).join(" | ")}`
      : "",
    fragile.length
      ? `Fragile tools: ${fragile.map(item => `${item.tool} ${Math.round(item.errorRate * 100)}% errors`).join(", ")}`
      : "",
    "This block is authoritative over older transcript summaries.",
    input.includeStatusProtocol === false ? "" : "End every final response with exactly one hidden machine signal: <aurict_status state=\"done\"></aurict_status>, <aurict_status state=\"continuing\">short reason</aurict_status>, or <aurict_status state=\"blocked\">short blocker</aurict_status>.",
  ].filter(Boolean)
  return truncate(lines.join("\n"), maxChars)
}

function oneLine(value: string, max: number): string {
  const clean = value.replace(/\s+/g, " ").trim()
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean
}

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 28)}\n[state truncated]` : value
}
