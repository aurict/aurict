import type { SecurityDistilledFinding } from "./distiller.js"

export type SecurityOperatorPhase =
  | "classify_scope"
  | "check_authorization"
  | "passive_recon"
  | "active_scan"
  | "evidence_validation"
  | "false_positive_review"
  | "risk_scoring"
  | "report"

export interface SecurityAsset {
  id: string
  target: string
  kind: "host" | "url" | "service" | "codebase" | "log-source"
  technologies: string[]
}

export interface SecurityService {
  assetId: string
  name: string
  port?: number | undefined
  protocol?: string | undefined
  evidence?: string | undefined
}

export interface SecurityAssessmentLedger {
  objective: string
  phase: SecurityOperatorPhase
  scope: string[]
  authorizedTargets: string[]
  excludedTargets: string[]
  assets: SecurityAsset[]
  services: SecurityService[]
  technologies: string[]
  findings: SecurityDistilledFinding[]
  falsePositives: SecurityDistilledFinding[]
  openQuestions: string[]
  nextActions: string[]
  riskSummary: {
    critical: number
    high: number
    medium: number
    low: number
    info: number
  }
  updatedAt: number
}

export interface BuildSecurityLedgerInput {
  objective: string
  scope?: string[] | undefined
  authorizedTargets?: string[] | undefined
  excludedTargets?: string[] | undefined
  findings?: SecurityDistilledFinding[] | undefined
  falsePositives?: SecurityDistilledFinding[] | undefined
  previous?: SecurityAssessmentLedger | undefined
}

export function buildSecurityAssessmentLedger(input: BuildSecurityLedgerInput): SecurityAssessmentLedger {
  const allFindings = dedupeFindings([
    ...(input.previous?.findings ?? []),
    ...(input.previous?.falsePositives ?? []),
    ...(input.findings ?? []),
    ...(input.falsePositives ?? []),
  ])
  const falsePositives = allFindings.filter((finding) => finding.status === "false-positive")
  const findings = allFindings.filter((finding) => finding.status !== "false-positive")
  const activeFindings = findings.filter((finding) => finding.status !== "false-positive")
  const scope = dedupe([...(input.previous?.scope ?? []), ...(input.scope ?? [])])
  const authorizedTargets = dedupe([...(input.previous?.authorizedTargets ?? []), ...(input.authorizedTargets ?? [])])
  const excludedTargets = dedupe([...(input.previous?.excludedTargets ?? []), ...(input.excludedTargets ?? [])])
  const assets = dedupeAssets([
    ...(input.previous?.assets ?? []),
    ...scope.map((target) => ({ id: assetId(target), target, kind: target.includes("/") ? "url" as const : "host" as const, technologies: [] })),
  ])
  return {
    objective: (input.objective || input.previous?.objective || "").slice(0, 500),
    phase: inferSecurityPhase({ scope, authorizedTargets, findings: activeFindings }),
    scope,
    authorizedTargets,
    excludedTargets,
    assets,
    services: input.previous?.services ?? [],
    technologies: dedupe(input.previous?.technologies ?? []),
    findings: activeFindings,
    falsePositives,
    openQuestions: buildOpenQuestions(scope, authorizedTargets),
    nextActions: buildNextActions(scope, authorizedTargets, activeFindings),
    riskSummary: summarizeRisk(activeFindings),
    updatedAt: Date.now(),
  }
}

export function formatSecurityLedgerAnchor(ledger: SecurityAssessmentLedger, maxChars = 1_800): string {
  const lines = [
    "[Security Assessment Ledger]",
    `Objective: ${ledger.objective || "(unknown)"}`,
    `Phase: ${ledger.phase}`,
    `Scope: ${ledger.scope.length ? ledger.scope.join(", ") : "(none)"}`,
    `Authorized targets: ${ledger.authorizedTargets.length ? ledger.authorizedTargets.join(", ") : "(none)"}`,
    `Excluded targets: ${ledger.excludedTargets.length ? ledger.excludedTargets.join(", ") : "(none)"}`,
    `Assets: ${ledger.assets.length}`,
    `Services: ${ledger.services.length}`,
    `Technologies: ${ledger.technologies.length ? ledger.technologies.join(", ") : "(none)"}`,
    `Risk: high=${ledger.riskSummary.high}, medium=${ledger.riskSummary.medium}, low=${ledger.riskSummary.low}, info=${ledger.riskSummary.info}`,
    `Findings: ${ledger.findings.length}`,
    ...ledger.findings.slice(0, 8).map((finding) =>
      `- ${finding.severity.toUpperCase()} ${finding.title} [${finding.status}, confidence=${finding.confidence}, fp=${finding.falsePositiveRisk}] ${finding.affectedAsset}`
    ),
    ledger.falsePositives.length ? `False positives: ${ledger.falsePositives.length}` : "",
    ledger.openQuestions.length ? `Open questions: ${ledger.openQuestions.join("; ")}` : "",
    ledger.nextActions.length ? `Next actions: ${ledger.nextActions.join("; ")}` : "",
    "Do not confirm findings without evidence validation and false-positive review.",
  ].filter(Boolean)
  const text = lines.join("\n")
  return text.length > maxChars ? `${text.slice(0, maxChars - 14)}…[truncated]` : text
}

export function inferSecurityPhase(input: {
  scope: string[]
  authorizedTargets: string[]
  findings: SecurityDistilledFinding[]
}): SecurityOperatorPhase {
  if (input.scope.length === 0) return "classify_scope"
  if (input.authorizedTargets.length === 0) return "check_authorization"
  if (input.findings.length === 0) return "passive_recon"
  if (input.findings.some((finding) => finding.status === "hypothesis")) return "evidence_validation"
  if (input.findings.some((finding) => finding.status === "needs-validation")) return "false_positive_review"
  if (input.findings.some((finding) => finding.severity === "high" || finding.severity === "medium" || finding.severity === "low")) return "risk_scoring"
  return "report"
}

function buildOpenQuestions(scope: string[], authorizedTargets: string[]): string[] {
  if (scope.length === 0) return ["What assets are in scope?"]
  if (authorizedTargets.length === 0) return ["Which targets are explicitly authorized for active testing?"]
  return []
}

function buildNextActions(scope: string[], authorizedTargets: string[], findings: SecurityDistilledFinding[]): string[] {
  if (scope.length === 0) return ["Classify scope and identify target assets."]
  if (authorizedTargets.length === 0) return ["Check securitySandbox targetAllowlist before any active scan."]
  if (findings.length === 0) return ["Run passive recon or bounded baseline checks."]
  if (findings.some((finding) => finding.status === "needs-validation" || finding.status === "hypothesis")) {
    return ["Validate evidence and run false-positive review before reporting."]
  }
  return ["Score risk and prepare the report."]
}

function summarizeRisk(findings: SecurityDistilledFinding[]): SecurityAssessmentLedger["riskSummary"] {
  return {
    critical: 0,
    high: findings.filter((finding) => finding.severity === "high").length,
    medium: findings.filter((finding) => finding.severity === "medium").length,
    low: findings.filter((finding) => finding.severity === "low").length,
    info: findings.filter((finding) => finding.severity === "info").length,
  }
}

function dedupe(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))]
}

function dedupeFindings(findings: SecurityDistilledFinding[]): SecurityDistilledFinding[] {
  const map = new Map<string, SecurityDistilledFinding>()
  for (const finding of findings) map.set(`${finding.sourceTool}:${finding.id}:${finding.affectedAsset}`, finding)
  return [...map.values()]
}

function dedupeAssets(assets: SecurityAsset[]): SecurityAsset[] {
  const map = new Map<string, SecurityAsset>()
  for (const asset of assets) map.set(asset.id, asset)
  return [...map.values()]
}

function assetId(target: string): string {
  return target.toLowerCase().replace(/[^a-z0-9_.:-]+/g, "-").replace(/^-+|-+$/g, "") || "asset"
}
