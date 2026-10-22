import { resolveSecuritySandboxConfig, resolveLongTaskRuntimeConfig, loadConfig, buildSecurityAssessmentLedger, evaluateSecurityOperatorStep, formatSecurityOperatorDecision, readSecurityAssessmentLedger, updateSecurityAssessmentLedger, writeSecurityAssessmentLedger, compact, estimateTokens } from "@aurict/core"
import type { ModelInfo, SecurityAssessmentLedger, SecurityDistilledFinding } from "@aurict/core"
import { writeFileSync, existsSync, readFileSync } from "fs"
import { spawnSync } from "child_process"
import type { CommandContext, CommandResult } from "./types.js"

export function formatRelativeTime(ts: number): string {
  const delta = Math.max(0, Date.now() - ts)
  const sec = Math.round(delta / 1000)
  if (sec < 60) return `${sec}s ago`
  const min = Math.round(sec / 60)
  if (min < 60) return `${min}m ago`
  const hrs = Math.round(min / 60)
  if (hrs < 48) return `${hrs}h ago`
  return `${Math.round(hrs / 24)}d ago`
}

/** Paths under the home directory print as `~/…`, as Codex does. */
export function tildePath(path: string): string {
  const home = process.env["HOME"]
  return home && (path === home || path.startsWith(`${home}/`)) ? `~${path.slice(home.length)}` : path
}

/** Codex's compact counts: 900, 1K, 1.9K, 2.25K, 272K, 1.2M (three significant digits). */
export function siCount(value: number): string {
  const n = Math.max(0, Math.round(value))
  if (n < 1000) return String(n)
  const [scaled, suffix] = n < 1_000_000 ? [n / 1000, "K"] : [n / 1_000_000, "M"]
  return `${Number(scaled.toPrecision(3))}${suffix}`
}

export function oneLine(value: unknown, max = 110): string {
  const text = typeof value === "string" ? value : JSON.stringify(value)
  const clean = text.replace(/\s+/g, " ").trim()
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean
}

export function traceSummary(data: Record<string, unknown>): unknown {
  if ("status" in data || "reason" in data) return data
  if ("tool" in data) {
    return {
      tool: data["tool"],
      status: data["status"],
      errors: Array.isArray(data["errors"]) ? data["errors"].length : undefined,
      verification: Array.isArray(data["verification"]) ? data["verification"].length : undefined,
    }
  }
  if ("sections" in data) {
    return {
      sections: Array.isArray(data["sections"]) ? data["sections"].length : undefined,
      cacheHealth: (data["cacheHealth"] as Record<string, unknown> | undefined)?.["kind"],
    }
  }
  return data
}

export function ensureLine(path: string, line: string): boolean {
  const existing = existsSync(path) ? readFileSync(path, "utf8") : ""
  if (existing.split(/\r?\n/).includes(line)) return false
  const prefix = existing.length > 0 && !existing.endsWith("\n") ? "\n" : ""
  writeFileSync(path, `${existing}${prefix}${line}\n`, "utf8")
  return true
}

// /compact now — gerçek core history üzerinden kalite-korumalı manuel compaction.
// Display mesajları yerine ctx.history (CoreMessage[]) kullanılır; otomatik
// compaction'la aynı compact() router'ını çağırır (transient retry + kalite
// muhafızı dahil); 45s'lik katı toplam timeout ve cancel desteği compact()
// içinde gelir. restoreSession live history'yi compacted sonulla değiştirir.
export async function runCompactNow(
  ctx:  CommandContext,
  cfg:  ReturnType<typeof loadConfig>["compaction"],
): Promise<CommandResult> {
  const history = ctx.history
  if (!history || history.length < 2) {
    return { type: "error", message: "Not enough conversation to compact yet." }
  }
  const compactionConfig = {
    contextLimit: ctx.contextWindow || 200_000,
    maxOutput:    8_192,
    tailTurns:    cfg?.tailTurns ?? 2,
    strategy:     (cfg?.strategy ?? "balanced") as "aggressive" | "balanced" | "conservative",
    provider:     ctx.provider,
    model:        ctx.model,
    workdir:      ctx.workdir,
    sessionId:    ctx.sessionId,
  }
  const before = estimateTokens(history, ctx.model)
  ctx.addSystemMsg("⏳ Compacting context…")
  try {
    const compacted = await compact(history, compactionConfig)
    const after = estimateTokens(compacted, ctx.model)
    // restoreSession role/content (string) bekler; CoreMessage content array
    // olabilir (multimodal) — compaction sonrası özet düz metindir ama tail'de
    // orijinal mesajlar array kalabilir, bu yüzden güvenli coerce uygula.
    const restored = compacted.map((message) => ({
      role:   (message.role === "assistant" ? "assistant" : "user") as "user" | "assistant",
      content: typeof message.content === "string"
        ? message.content
        : JSON.stringify(message.content),
    })) as Array<{ role: "user" | "assistant"; content: string }>
    ctx.restoreSession(restored)
    return { type: "text", content: `✓ Compact done: ${before} → ${after} tokens (manual).` }
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    return { type: "error", message: `Compaction failed: ${detail}` }
  }
}

export function mergeModelLists(base: ModelInfo[], remote: ModelInfo[]): ModelInfo[] {
  const merged = new Map<string, ModelInfo>()
  const order: string[] = []

  const put = (model: ModelInfo) => {
    const existing = merged.get(model.id)
    if (!existing) {
      order.push(model.id)
      merged.set(model.id, model)
      return
    }
    const next: ModelInfo = {
      ...existing,
      ...model,
      name: existing.name,
    }
    const supportsThinking = existing.supportsThinking ?? model.supportsThinking
    if (supportsThinking !== undefined) next.supportsThinking = supportsThinking
    merged.set(model.id, next)
  }

  base.forEach(put)
  remote.forEach(put)

  return order.map((id) => merged.get(id)!)
}

export function securityConfigLines(cfg: ReturnType<typeof loadConfig>): string[] {
  const security = resolveSecuritySandboxConfig(cfg)
  const enabled = security.enabled === true && security.profile !== "off"
  const allowlist = security.targetAllowlist
  return [
    "Security Sandbox:",
    `  enabled: ${enabled ? "yes" : "no"}`,
    `  profile: ${security.profile}`,
    `  image:   ${security.image || "(none)"}`,
    `  network: ${security.network}`,
    `  limits:  ${security.maxConcurrent} concurrent, ${security.requestsPerMinute}/min`,
    `  targets: ${allowlist.length > 0 ? allowlist.join(", ") : "(none)"}`,
  ]
}

export function getOrCreateSecurityLedger(workdir: string, objective = "Current security assessment"): SecurityAssessmentLedger {
  const existing = readSecurityAssessmentLedger(workdir)
  if (existing) return existing
  const cfg = loadConfig(workdir)
  const security = resolveSecuritySandboxConfig(cfg)
  return updateSecurityAssessmentLedger(workdir, {
    objective,
    scope: security.targetAllowlist,
    authorizedTargets: security.targetAllowlist,
  })
}

export function rewriteSecurityLedger(workdir: string, ledger: SecurityAssessmentLedger, patch: Partial<Pick<SecurityAssessmentLedger, "scope" | "authorizedTargets" | "excludedTargets" | "findings" | "falsePositives">>): SecurityAssessmentLedger {
  return writeSecurityAssessmentLedger(workdir, buildSecurityAssessmentLedger({
    objective: ledger.objective,
    scope: patch.scope ?? ledger.scope,
    authorizedTargets: patch.authorizedTargets ?? ledger.authorizedTargets,
    excludedTargets: patch.excludedTargets ?? ledger.excludedTargets,
    findings: patch.findings ?? ledger.findings,
    falsePositives: patch.falsePositives ?? ledger.falsePositives,
  }))
}

export function formatSecurityStatus(workdir: string): string {
  const cfg = loadConfig(workdir)
  const security = resolveSecuritySandboxConfig(cfg)
  const ledger = getOrCreateSecurityLedger(workdir)
  const decision = evaluateSecurityOperatorStep(ledger, security)
  return [
    ...securityConfigLines(cfg),
    "",
    "Security agents:",
    `  active operator: ${security.enabled && (security.profile === "active-lite" || security.profile === "kali-full") ? "available" : "hidden"}`,
    `  verifier/reporter: ${security.enabled && security.profile !== "off" ? "available" : "hidden"}`,
    "",
    `Ledger phase: ${ledger.phase}`,
    `Findings:     ${ledger.findings.length} active, ${ledger.falsePositives.length} false positive`,
    "",
    formatSecurityOperatorDecision(decision),
    "",
    "Use /agent security to switch the main session into security-focused mode.",
  ].join("\n")
}

export function formatSecurityReportFromLedger(ledger: SecurityAssessmentLedger): string {
  const confirmed = ledger.findings.filter((finding) => finding.status === "confirmed")
  const unverified = ledger.findings.filter((finding) => finding.status !== "confirmed")
  const lines = [
    "# Security Assessment Report",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Scope",
    ledger.scope.length ? ledger.scope.map((item) => `- ${item}`).join("\n") : "(none)",
    "",
    "## Operator State",
    `Phase: ${ledger.phase}`,
    `Risk: high=${ledger.riskSummary.high}, medium=${ledger.riskSummary.medium}, low=${ledger.riskSummary.low}, info=${ledger.riskSummary.info}`,
    "",
    "## Confirmed Findings",
    "",
  ]
  if (confirmed.length === 0) lines.push("No confirmed findings.")
  for (const finding of confirmed) pushSecurityFinding(lines, finding)
  lines.push("", "## Unverified Findings", "")
  if (unverified.length === 0) lines.push("No unverified findings.")
  for (const finding of unverified) {
    pushSecurityFinding(lines, finding)
    lines.push("Verification requirement: run /security verify <id|number> or provide independent evidence before confirming this finding.", "")
  }
  lines.push("", "## False Positives", "")
  if (ledger.falsePositives.length === 0) lines.push("No false positives recorded.")
  for (const finding of ledger.falsePositives) lines.push(`- ${finding.title} (${finding.affectedAsset})`)
  return lines.join("\n").trim() + "\n"
}

function pushSecurityFinding(lines: string[], finding: SecurityDistilledFinding): void {
  lines.push(`### [${finding.severity.toUpperCase()}] ${finding.title}`)
  lines.push("")
  lines.push(`ID: ${finding.id}`)
  lines.push(`Target: ${finding.affectedAsset}`)
  lines.push(`Status: ${finding.status}`)
  lines.push(`Confidence: ${finding.confidence}`)
  lines.push(`False-positive risk: ${finding.falsePositiveRisk}`)
  if (finding.evidence.length > 0) {
    lines.push("", "Evidence:")
    for (const evidence of finding.evidence.slice(0, 6)) lines.push(`- ${evidence}`)
  }
  lines.push("", `Next verification: ${finding.nextVerification}`, "")
}

export function findLedgerFinding(ledger: SecurityAssessmentLedger, selector: string): SecurityDistilledFinding | undefined {
  const index = Number(selector)
  if (Number.isInteger(index) && index > 0) return ledger.findings[index - 1]
  return ledger.findings.find((finding) => finding.id === selector || `${finding.sourceTool}:${finding.id}` === selector)
}

export function pullSecurityImage(image: string): CommandResult {
  if (!image) return { type: "error", message: "No security image is configured for the current profile." }
  const version = spawnSync("docker", ["--version"], { encoding: "utf8" })
  if (version.error || version.status !== 0) {
    return { type: "error", message: "Docker CLI is not available. Install Docker before pulling security images." }
  }
  const result = spawnSync("docker", ["pull", image], { encoding: "utf8", timeout: 600_000 })
  if (result.status !== 0) {
    const detail = result.stderr?.trim() || result.stdout?.trim() || "docker pull failed"
    return { type: "error", message: `Failed to pull ${image}:\n${detail}` }
  }
  return { type: "text", content: `Security image ready: ${image}` }
}

export function longTaskConfigLines(cfg: ReturnType<typeof loadConfig>): string[] {
  const runtime = resolveLongTaskRuntimeConfig(cfg)
  return [
    "Long Task Runtime:",
    `  enabled: ${runtime.enabled ? "yes" : "no"}`,
    `  mode:    ${runtime.mode}`,
    `  verify:  ${runtime.strictVerification ? "strict" : "relaxed"}`,
    `  budget:  ${runtime.maxContinuationSteps} continuations, ${runtime.maxRecoveryAttempts} recovery attempts`,
  ]
}
