import type { ActiveSkillPolicy } from "../skill/runtime-policy.js"
import type { WorkingSetSnapshot } from "./working-set.js"
import type { ContinuationDecision } from "./continuation.js"
import type { SessionVerificationSnapshot } from "../session/resume-state.js"
import type { FailureCooldownSnapshot } from "./failure-cooldown.js"

export interface AttentionAnchorInput {
  objective: string
  activeSkill?: ActiveSkillPolicy | null | undefined
  workingSet: WorkingSetSnapshot
  continuation?: ContinuationDecision | undefined
  verification?: SessionVerificationSnapshot | undefined
  cooldown?: FailureCooldownSnapshot | undefined
  maxChars?: number | undefined
}

export function buildAttentionAnchor(input: AttentionAnchorInput): string {
  if (process.env["AURICT_DISABLE_ATTENTION_ANCHOR"] === "1") return ""
  const maxChars = Math.max(400, input.maxChars ?? 4_800)
  const files = input.workingSet.items.filter(item => item.kind === "file").slice(0, 8)
  const verification = input.workingSet.items.filter(item => item.kind === "verification").slice(0, 4)
  const errors = input.workingSet.items.filter(item => item.kind === "error").slice(0, 4)
  const cooldowns = input.cooldown?.active.slice(0, 3) ?? []

  const lines = [
    "# Attention Anchor",
    `Objective: ${oneLine(input.objective || "Continue the current user task.", 260)}`,
    input.activeSkill ? `Active skill: ${input.activeSkill.skillName} (${input.activeSkill.skillId})` : "",
    input.continuation ? `Continuation: ${input.continuation.shouldContinue ? `continue (${input.continuation.reason ?? "unspecified"})` : `stop (${input.continuation.stopReason ?? "complete"})`}` : "",
    input.verification ? `Last verification: ${input.verification.status} — ${oneLine(input.verification.summary, 220)}` : "",
    files.length ? `Working files: ${files.map(item => item.label).join(", ")}` : "",
    verification.length ? `Verification signals: ${verification.map(item => oneLine(item.label, 140)).join(" | ")}` : "",
    errors.length ? `Active errors: ${errors.map(item => oneLine(item.label, 140)).join(" | ")}` : "",
    cooldowns.length ? `Strategy cooldown: ${cooldowns.map(entry => `${entry.tool} repeated ${entry.count}x`).join(", ")}` : "",
    "Next action: use the current working set and verification state; do not rely on stale context.",
  ].filter(Boolean)

  return truncate(lines.join("\n"), maxChars)
}

function oneLine(value: string, max: number): string {
  const clean = value.replace(/\s+/g, " ").trim()
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean
}

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 32)}\n[anchor truncated]` : value
}
