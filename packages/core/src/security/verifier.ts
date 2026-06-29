import type { SecurityDistilledFinding, SecurityVerificationStatus } from "./distiller.js"
import type { SecuritySeverity } from "./runner.js"

export type SecurityEvidenceStrength = "low" | "medium" | "high"

export interface SecurityVerificationResult {
  findingId: string
  verdict: SecurityVerificationStatus
  evidenceStrength: SecurityEvidenceStrength
  severityRecommendation: SecuritySeverity
  whyCouldBeFalsePositive: string[]
  requiredFollowup: string[]
  rationale: string
}

export function verifySecurityFinding(finding: SecurityDistilledFinding): SecurityVerificationResult {
  const evidenceText = finding.evidence.join("\n")
  const evidenceStrength = scoreEvidence(evidenceText)
  const falsePositiveReasons = inferFalsePositiveReasons(finding, evidenceText)
  const requiredFollowup = inferFollowup(finding, evidenceStrength, falsePositiveReasons)
  const verdict = inferVerdict(finding, evidenceStrength, falsePositiveReasons)
  const severityRecommendation = inferSeverityRecommendation(finding, verdict, evidenceStrength)

  return {
    findingId: finding.id,
    verdict,
    evidenceStrength,
    severityRecommendation,
    whyCouldBeFalsePositive: falsePositiveReasons,
    requiredFollowup,
    rationale: buildRationale(finding, verdict, evidenceStrength),
  }
}

export function applySecurityVerification(finding: SecurityDistilledFinding, verification: SecurityVerificationResult): SecurityDistilledFinding {
  return {
    ...finding,
    status: verification.verdict,
    severity: verification.severityRecommendation,
    confidence: verification.evidenceStrength,
    falsePositiveRisk: verification.verdict === "confirmed" ? "low" : verification.verdict === "false-positive" ? "high" : finding.falsePositiveRisk,
    nextVerification: verification.requiredFollowup.length > 0
      ? verification.requiredFollowup.join(" ")
      : "No additional verification required.",
  }
}

export function formatSecurityVerification(result: SecurityVerificationResult): string {
  return [
    "[Security Finding Verification]",
    `Finding: ${result.findingId}`,
    `Verdict: ${result.verdict}`,
    `Evidence strength: ${result.evidenceStrength}`,
    `Severity recommendation: ${result.severityRecommendation}`,
    "Why this could be false positive:",
    ...result.whyCouldBeFalsePositive.map((reason) => `- ${reason}`),
    "Required follow-up:",
    ...result.requiredFollowup.map((item) => `- ${item}`),
    `Rationale: ${result.rationale}`,
  ].join("\n")
}

function scoreEvidence(text: string): SecurityEvidenceStrength {
  const normalized = text.toLowerCase()
  if (!normalized.trim()) return "low"
  let score = 0
  if (/\b(http\/\d|status|header|port|open|service|tls|certificate|cipher|cve-\d{4}-\d+)\b/.test(normalized)) score++
  if (/\b(reproduced|confirmed|proof|payload|response|request|output|observed|evidence)\b/.test(normalized)) score++
  if (/\b(scanner|banner|version|heuristic|template)\b/.test(normalized)) score--
  if (normalized.length > 120) score++
  if (score >= 2) return "high"
  if (score >= 1) return "medium"
  return "low"
}

function inferFalsePositiveReasons(finding: SecurityDistilledFinding, evidenceText: string): string[] {
  const reasons: string[] = []
  const text = `${finding.title}\n${finding.evidence.join("\n")}`.toLowerCase()
  if (finding.evidence.length === 0) reasons.push("No concrete evidence was supplied.")
  if (/\b(scanner|template|banner|version)\b/.test(text)) reasons.push("The signal may be scanner or banner based rather than exploitability based.")
  if (finding.status === "hypothesis") reasons.push("The finding is currently marked as a hypothesis.")
  if (finding.falsePositiveRisk === "high") reasons.push("The upstream distillation already marks false-positive risk as high.")
  if (!/\b(request|response|header|port|tls|certificate|payload|output|reproduced|confirmed|observed)\b/i.test(evidenceText)) {
    reasons.push("Evidence does not show a direct reproduction or observed affected condition.")
  }
  return reasons.length > 0 ? reasons : ["No obvious false-positive reason from the supplied evidence."]
}

function inferFollowup(
  finding: SecurityDistilledFinding,
  evidenceStrength: SecurityEvidenceStrength,
  reasons: string[],
): string[] {
  if (evidenceStrength === "high" && reasons.length === 1 && reasons[0]?.startsWith("No obvious")) return []
  const followup = new Set<string>()
  followup.add(finding.nextVerification || "Validate with a second source before reporting as confirmed.")
  if (evidenceStrength === "low") followup.add("Collect direct request/response, command output, or configuration evidence.")
  if (reasons.some((reason) => reason.includes("scanner") || reason.includes("banner"))) {
    followup.add("Confirm the scanner hit manually or with an independent focused check.")
  }
  return [...followup]
}

function inferVerdict(
  finding: SecurityDistilledFinding,
  evidenceStrength: SecurityEvidenceStrength,
  reasons: string[],
): SecurityVerificationStatus {
  if (finding.status === "false-positive") return "false-positive"
  if (evidenceStrength === "high" && reasons.length <= 1) return "confirmed"
  if (evidenceStrength === "low" && finding.falsePositiveRisk === "high") return "hypothesis"
  return "needs-validation"
}

function inferSeverityRecommendation(
  finding: SecurityDistilledFinding,
  verdict: SecurityVerificationStatus,
  evidenceStrength: SecurityEvidenceStrength,
): SecuritySeverity {
  if (verdict === "false-positive") return "info"
  if (verdict !== "confirmed" && finding.severity === "high") return "medium"
  if (evidenceStrength === "low" && finding.severity === "medium") return "low"
  return finding.severity
}

function buildRationale(
  finding: SecurityDistilledFinding,
  verdict: SecurityVerificationStatus,
  evidenceStrength: SecurityEvidenceStrength,
): string {
  return `Finding '${finding.title}' is ${verdict} because supplied evidence strength is ${evidenceStrength} and false-positive risk is ${finding.falsePositiveRisk}.`
}
