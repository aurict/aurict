import { z } from "zod"
import { buildSecurityReport, type SecurityRunResult } from "../../security/runner.js"
import type { SecurityDistillation, SecurityDistilledFinding, SecurityVerificationStatus } from "../../security/distiller.js"
import type { ToolDef, ToolContext, ExecuteResult } from "../types.js"

export const securityReportTool: ToolDef = {
  id: "security_report",
  description: "Create a concise security report from JSON results returned by security_recon or security_scan. Does not perform network activity.",
  parameters: z.object({
    title: z.string().default("Security Assessment Report").describe("Report title."),
    results_json: z.string().describe("JSON array/object of SecurityRunResult or SecurityDistillation data."),
  }),
  spec: {
    category: "read",
    riskLevel: "low",
    securityCapability: "passive",
    permissionSummary: "Format existing security tool output into a report",
  },
  async execute(args, _ctx: ToolContext): Promise<ExecuteResult> {
    const title = String(args["title"] ?? "Security Assessment Report")
    const raw = String(args["results_json"] ?? "")
    try {
      const parsed = JSON.parse(raw) as SecurityRunResult | SecurityRunResult[] | SecurityDistillation | SecurityDistillation[]
      const results = Array.isArray(parsed) ? parsed : [parsed]
      if (results.length === 0) return { output: "", error: "results_json must contain at least one result" }
      if (isDistillation(results[0])) {
        return { output: buildDistillationReport(title, results.filter(isDistillation)) }
      }
      return { output: buildSecurityReport(title, results as SecurityRunResult[]) }
    } catch (err) {
      return { output: "", error: `Invalid results_json: ${err instanceof Error ? err.message : String(err)}` }
    }
  },
}

function isDistillation(value: unknown): value is SecurityDistillation {
  return Boolean(value && typeof value === "object" && "findings" in value && "summary" in value && "sourceTool" in value)
}

function buildDistillationReport(title: string, results: SecurityDistillation[]): string {
  const findings = results.flatMap((result) => result.findings)
  const confirmed = findings.filter((finding) => finding.status === "confirmed")
  const unverified = findings.filter((finding) => finding.status !== "confirmed" && finding.status !== "false-positive")
  const falsePositives = findings.filter((finding) => finding.status === "false-positive")
  const risk = riskCounts(findings.filter((finding) => finding.status !== "false-positive"))
  const artifacts = [...new Set(results.flatMap((result) => [
    result.rawArtifactPath,
    ...result.findings.map((finding) => finding.rawArtifactPath),
  ]).filter(Boolean) as string[])]
  const lines = [
    `# ${title}`,
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Executive Summary",
    "",
    `Assessed ${results.length} target/tool result set(s) and distilled ${findings.length} finding(s).`,
    `Confirmed: ${confirmed.length}; unverified: ${unverified.length}; false positives: ${falsePositives.length}.`,
    `Risk distribution: high=${risk.high}, medium=${risk.medium}, low=${risk.low}, info=${risk.info}.`,
    "",
    "## Scope",
    "",
    ...results.map((result) => `- ${result.target} (${result.sourceTool})`),
    "",
    "## Methodology",
    "",
    "- Scanner and baseline outputs were distilled into bounded findings rather than raw dumps.",
    "- Findings remain unverified until evidence validation and false-positive review are complete.",
    "- Medium/high findings require independent reproduction or a verifier pass before being treated as confirmed.",
    "",
    "## Risk Matrix",
    "",
    "| Severity | Count |",
    "| --- | ---: |",
    `| High | ${risk.high} |`,
    `| Medium | ${risk.medium} |`,
    `| Low | ${risk.low} |`,
    `| Info | ${risk.info} |`,
    "",
    "## Confirmed Findings",
    "",
  ]
  if (confirmed.length === 0) lines.push("No confirmed findings.")
  for (const finding of confirmed) pushFinding(lines, finding)

  lines.push("", "## Unverified Findings", "")
  if (unverified.length === 0) lines.push("No unverified findings.")
  for (const finding of unverified) {
    pushFinding(lines, finding)
    lines.push("Verification requirement: run security_verify or provide independent evidence before confirming this finding.", "")
  }

  lines.push("", "## False Positives", "")
  if (falsePositives.length === 0) lines.push("No false positives recorded.")
  for (const finding of falsePositives) {
    lines.push(`- ${finding.title} (${finding.affectedAsset})`)
  }

  lines.push("", "## Remediation Priority", "")
  const priorities = remediationPriorities(findings)
  if (priorities.length === 0) lines.push("No remediation actions available.")
  for (const item of priorities) lines.push(`- [${item.severity.toUpperCase()}] ${item.title} — ${item.nextVerification}`)

  lines.push("", "## Appendix", "")
  lines.push("Raw scanner output is intentionally not embedded in this report.")
  if (artifacts.length > 0) {
    lines.push("Raw artifact references:")
    for (const artifact of artifacts) lines.push(`- ${artifact}`)
  } else {
    lines.push("Raw artifact references: (none)")
  }
  return lines.join("\n").trim() + "\n"
}

function pushFinding(lines: string[], finding: SecurityDistilledFinding): void {
  lines.push(`### [${finding.severity.toUpperCase()}] ${finding.title}`)
  lines.push("")
  lines.push(`Target: ${finding.affectedAsset}`)
  lines.push(`Status: ${finding.status}`)
  lines.push(`Confidence: ${finding.confidence}`)
  lines.push(`False-positive risk: ${finding.falsePositiveRisk}`)
  if (finding.rawArtifactPath) lines.push(`Raw artifact: ${finding.rawArtifactPath}`)
  if (finding.evidence.length > 0) {
    lines.push("", "Evidence:")
    for (const evidence of finding.evidence.slice(0, 6)) lines.push(`- ${evidence}`)
  }
  lines.push("", `Next verification: ${finding.nextVerification}`, "")
}

function riskCounts(findings: SecurityDistilledFinding[]): Record<"high" | "medium" | "low" | "info", number> {
  return {
    high: findings.filter((finding) => finding.severity === "high").length,
    medium: findings.filter((finding) => finding.severity === "medium").length,
    low: findings.filter((finding) => finding.severity === "low").length,
    info: findings.filter((finding) => finding.severity === "info").length,
  }
}

function remediationPriorities(findings: SecurityDistilledFinding[]): SecurityDistilledFinding[] {
  const statusRank: Record<SecurityVerificationStatus, number> = {
    confirmed: 0,
    "needs-validation": 1,
    hypothesis: 2,
    "false-positive": 99,
  }
  const severityRank = { high: 0, medium: 1, low: 2, info: 3 }
  return findings
    .filter((finding) => finding.status !== "false-positive" && finding.severity !== "info")
    .sort((a, b) => severityRank[a.severity] - severityRank[b.severity] || statusRank[a.status] - statusRank[b.status])
    .slice(0, 10)
}
