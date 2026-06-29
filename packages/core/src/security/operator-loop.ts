import type { ResolvedSecuritySandboxConfig } from "../config/config.js"
import type { SecurityAssessmentLedger, SecurityOperatorPhase } from "./assessment-ledger.js"

export type SecurityOperatorStatus = "needs-input" | "ready" | "blocked" | "complete"

export interface SecurityOperatorDecision {
  phase: SecurityOperatorPhase
  status: SecurityOperatorStatus
  nextAction: string
  allowedTools: string[]
  requiredInput: string[]
  requiredEvidence: string[]
  blockedReason?: string | undefined
}

export function evaluateSecurityOperatorStep(
  ledger: SecurityAssessmentLedger,
  security: ResolvedSecuritySandboxConfig,
): SecurityOperatorDecision {
  if (ledger.scope.length === 0) {
    return decision(ledger.phase, "needs-input", "Define assessment scope before any security work.", [], ["scope target"], [])
  }

  if (ledger.authorizedTargets.length === 0) {
    return decision(
      "check_authorization",
      "needs-input",
      "Confirm authorized targets. Active scans stay blocked until securitySandbox.targetAllowlist contains the target.",
      ["security_threat_model", "security_log_analyze"],
      ["authorized target or allowlist entry"],
      ["explicit user authorization or configured allowlist"],
    )
  }

  if (!security.enabled || security.profile === "off") {
    return decision(
      "passive_recon",
      "blocked",
      "Security capability is disabled; only normal code review is available.",
      [],
      ["enable securitySandbox passive or active profile"],
      [],
      "securitySandbox profile is off",
    )
  }

  const activeAllowed = security.profile === "active-lite" || security.profile === "kali-full"
  if (ledger.findings.length === 0) {
    return decision(
      activeAllowed ? "active_scan" : "passive_recon",
      "ready",
      activeAllowed
        ? "Run passive recon first, then a bounded active scan only against allowlisted targets."
        : "Run passive review, threat modeling, log analysis, or report preparation without active scans.",
      activeAllowed
        ? ["security_recon", "security_scan", "security_threat_model", "security_log_analyze"]
        : ["security_threat_model", "security_log_analyze", "security_report"],
      [],
      ["scope and allowlist must match before active scan"],
    )
  }

  const unverified = ledger.findings.filter((finding) => finding.status === "hypothesis" || finding.status === "needs-validation")
  if (unverified.length > 0) {
    return decision(
      ledger.findings.some((finding) => finding.status === "hypothesis") ? "evidence_validation" : "false_positive_review",
      "ready",
      "Validate evidence and run adversarial false-positive review before confirming findings.",
      ["security_verify", "security_attack_graph", "security_log_analyze"],
      [],
      unverified.slice(0, 5).map((finding) => `${finding.id}: ${finding.nextVerification}`),
    )
  }

  const confirmedRisk = ledger.findings.filter((finding) => finding.status === "confirmed" && finding.severity !== "info")
  if (confirmedRisk.length > 0) {
    return decision(
      "risk_scoring",
      "ready",
      "Build the risk view and prepare the report from confirmed findings.",
      ["security_attack_graph", "security_report", "security_threat_model"],
      [],
      ["confirmed finding evidence", "affected asset", "remediation guidance"],
    )
  }

  return decision(
    "report",
    "complete",
    "No unverified risk remains. Produce or refresh the final report if needed.",
    ["security_report"],
    [],
    [],
  )
}

export function formatSecurityOperatorDecision(decision: SecurityOperatorDecision): string {
  const lines = [
    "[Security Operator Loop]",
    `Phase: ${decision.phase}`,
    `Status: ${decision.status}`,
    `Next action: ${decision.nextAction}`,
    `Allowed tools: ${decision.allowedTools.length ? decision.allowedTools.join(", ") : "(none)"}`,
  ]
  if (decision.blockedReason) lines.push(`Blocked: ${decision.blockedReason}`)
  if (decision.requiredInput.length > 0) lines.push(`Required input: ${decision.requiredInput.join("; ")}`)
  if (decision.requiredEvidence.length > 0) {
    lines.push("Required evidence:")
    for (const item of decision.requiredEvidence) lines.push(`- ${item}`)
  }
  return lines.join("\n")
}

function decision(
  phase: SecurityOperatorPhase,
  status: SecurityOperatorStatus,
  nextAction: string,
  allowedTools: string[],
  requiredInput: string[],
  requiredEvidence: string[],
  blockedReason?: string,
): SecurityOperatorDecision {
  return { phase, status, nextAction, allowedTools, requiredInput, requiredEvidence, blockedReason }
}
