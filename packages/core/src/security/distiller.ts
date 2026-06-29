import type { SecurityDockerRunResult } from "./docker-runner.js"
import type { SecurityFinding, SecurityRunResult, SecuritySeverity } from "./runner.js"

export type SecurityConfidence = "low" | "medium" | "high"
export type SecurityVerificationStatus = "hypothesis" | "needs-validation" | "confirmed" | "false-positive"

export interface SecurityDistilledFinding {
  id: string
  title: string
  affectedAsset: string
  severity: SecuritySeverity
  confidence: SecurityConfidence
  status: SecurityVerificationStatus
  evidence: string[]
  falsePositiveRisk: SecurityConfidence
  nextVerification: string
  sourceTool: string
  rawArtifactPath?: string | undefined
}

export interface SecurityDistillation {
  target: string
  profile: string
  sourceTool: string
  findings: SecurityDistilledFinding[]
  summary: {
    total: number
    bySeverity: Record<SecuritySeverity, number>
    confirmed: number
    needsValidation: number
    falsePositiveRisk: Record<SecurityConfidence, number>
  }
  rawArtifactPath?: string | undefined
}

export function distillSecurityRunResult(result: SecurityRunResult, sourceTool = "security_scan"): SecurityDistillation {
  const findings = result.checks.map((finding) => fromSecurityFinding(finding, result, sourceTool))
  return buildDistillation({
    target: result.target.raw,
    profile: result.profile,
    sourceTool,
    findings,
  })
}

export function distillSecurityDockerResult(result: SecurityDockerRunResult): SecurityDistillation {
  const text = [result.stdout, result.stderr].filter(Boolean).join("\n")
  const findings = parseDockerFindings(result, text)

  return buildDistillation({
    target: result.target.raw,
    profile: "active",
    sourceTool: result.action,
    findings: findings.length > 0 ? findings : [genericDockerFinding(result, text)],
    rawArtifactPath: result.outputDir,
  })
}

export function formatSecurityDistillationForModel(distillation: SecurityDistillation, maxEvidence = 6): string {
  const lines = [
    "[Security Tool Distillation]",
    `Target: ${distillation.target}`,
    `Profile: ${distillation.profile}`,
    `Source tool: ${distillation.sourceTool}`,
    `Findings: ${distillation.summary.total} total; confirmed=${distillation.summary.confirmed}; needsValidation=${distillation.summary.needsValidation}`,
  ]
  if (distillation.rawArtifactPath) lines.push(`Raw artifact path: ${distillation.rawArtifactPath}`)
  for (const finding of distillation.findings.slice(0, 12)) {
    lines.push("")
    lines.push(`- ${finding.severity.toUpperCase()} ${finding.title}`)
    lines.push(`  affectedAsset: ${finding.affectedAsset}`)
    lines.push(`  confidence: ${finding.confidence}; status: ${finding.status}; falsePositiveRisk: ${finding.falsePositiveRisk}`)
    if (finding.rawArtifactPath) lines.push(`  rawArtifactPath: ${finding.rawArtifactPath}`)
    for (const evidence of finding.evidence.slice(0, maxEvidence)) lines.push(`  evidence: ${oneLine(evidence, 260)}`)
    lines.push(`  nextVerification: ${finding.nextVerification}`)
  }
  return lines.join("\n")
}

function fromSecurityFinding(finding: SecurityFinding, result: SecurityRunResult, sourceTool: string): SecurityDistilledFinding {
  const status = finding.status === "fail"
    ? "needs-validation"
    : finding.status === "warning"
      ? "needs-validation"
      : "confirmed"
  const confidence = finding.status === "pass" ? "high" : finding.evidence ? "medium" : "low"
  const falsePositiveRisk = finding.status === "pass" ? "low" : finding.evidence ? "medium" : "high"
  return {
    id: finding.id,
    title: finding.title,
    affectedAsset: result.target.raw,
    severity: finding.severity,
    confidence,
    status,
    evidence: [finding.detail, finding.evidence ?? ""].filter(Boolean).map((line) => oneLine(line, 500)),
    falsePositiveRisk,
    nextVerification: finding.status === "pass"
      ? "No follow-up needed unless scope changes."
      : finding.recommendation ?? "Validate the condition with a second source before reporting as confirmed.",
    sourceTool,
  }
}

function genericDockerFinding(result: SecurityDockerRunResult, text: string): SecurityDistilledFinding {
  return {
    id: `${result.action}-${safeId(result.target.host)}`,
    title: `${result.action} scan ${result.exitCode === 0 ? "completed" : "requires review"}`,
    affectedAsset: result.target.raw,
    severity: result.exitCode === 0 ? "info" : "low",
    confidence: result.exitCode === 0 ? "medium" : "low",
    status: result.exitCode === 0 ? "needs-validation" : "hypothesis",
    evidence: selectEvidence(text),
    falsePositiveRisk: result.exitCode === 0 ? "medium" : "high",
    nextVerification: result.exitCode === 0
      ? "Review the saved raw artifact and validate any scanner-reported issue before confirming a finding."
      : "Inspect stderr/stdout and rerun with a narrower scan only if the target and scope allow it.",
    sourceTool: result.action,
    rawArtifactPath: result.outputDir,
  }
}

function parseDockerFindings(result: SecurityDockerRunResult, text: string): SecurityDistilledFinding[] {
  switch (result.action) {
    case "nmap_top":
    case "nmap_service":
      return parseNmapFindings(result, text)
    case "testssl":
      return parseTestsslFindings(result, text)
    case "nikto":
      return parseNiktoFindings(result, text)
    case "nuclei":
      return parseNucleiFindings(result, text)
    case "ffuf":
      return parseFfufFindings(result, text)
    case "gobuster":
      return parseGobusterFindings(result, text)
    case "sqlmap":
      return parseSqlmapFindings(result, text)
  }
}

function parseNmapFindings(result: SecurityDockerRunResult, text: string): SecurityDistilledFinding[] {
  return text.split(/\r?\n/)
    .map((line) => line.trim())
    .map((line) => line.match(/^(?<port>\d+)\/(?<proto>tcp|udp)\s+(?<state>open|filtered|closed)\s+(?<service>\S+)(?:\s+(?<version>.*))?$/i))
    .filter((match): match is RegExpMatchArray & { groups: Record<string, string> } => Boolean(match?.groups && match.groups["state"] === "open"))
    .slice(0, 20)
    .map((match) => {
      const port = match.groups["port"] ?? "unknown"
      const service = match.groups["service"] ?? "unknown"
      const version = match.groups["version"]?.trim()
      return dockerFinding(result, {
        id: `nmap-open-${port}-${service}`,
        title: `Open ${service} service on port ${port}`,
        severity: serviceSeverity(service),
        confidence: "high",
        falsePositiveRisk: "low",
        evidence: [oneLine(match[0], 500)],
        nextVerification: "Confirm the service is intentionally exposed and check version-specific hardening or CVE context.",
        affectedAsset: `${result.target.host}:${port}`,
        extraEvidence: version ? [`version: ${version}`] : [],
      })
    })
}

function parseTestsslFindings(result: SecurityDockerRunResult, text: string): SecurityDistilledFinding[] {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  const interesting = lines.filter((line) => /\b(critical|high|medium|low|vulnerable|weak|expired|not offered|offered|warning|fail|heartbleed|robot|crime|breach|poodle|rc4|tls 1\.0|tls 1\.1)\b/i.test(line))
  return interesting.slice(0, 20).map((line, index) => dockerFinding(result, {
    id: `testssl-${safeId(line).slice(0, 48) || index}`,
    title: `TLS finding: ${oneLine(line, 80)}`,
    severity: severityFromText(line, "medium"),
    confidence: "medium",
    falsePositiveRisk: "medium",
    evidence: [oneLine(line, 500)],
    nextVerification: "Validate with a second TLS check and confirm the externally served certificate/configuration.",
  }))
}

function parseNiktoFindings(result: SecurityDockerRunResult, text: string): SecurityDistilledFinding[] {
  return text.split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^\+\s+/.test(line) && !/\+ Target IP|\+ Target Hostname|\+ Start Time|\+ End Time/i.test(line))
    .slice(0, 20)
    .map((line, index) => dockerFinding(result, {
      id: `nikto-${safeId(line).slice(0, 48) || index}`,
      title: `Web server finding: ${oneLine(line.replace(/^\+\s+/, ""), 90)}`,
      severity: severityFromText(line, "low"),
      confidence: "medium",
      falsePositiveRisk: "medium",
      evidence: [oneLine(line, 500)],
      nextVerification: "Reproduce the HTTP condition manually and check whether it is reachable in the assessed environment.",
    }))
}

function parseNucleiFindings(result: SecurityDockerRunResult, text: string): SecurityDistilledFinding[] {
  const findings: SecurityDistilledFinding[] = []
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed) continue
    try {
      const json = JSON.parse(trimmed) as Record<string, unknown>
      const info = typeof json["info"] === "object" && json["info"] ? json["info"] as Record<string, unknown> : {}
      const name = String(info["name"] ?? json["template-id"] ?? "nuclei finding")
      const severity = severityFromText(String(info["severity"] ?? json["severity"] ?? ""), "low")
      const matched = String(json["matched-at"] ?? json["host"] ?? result.target.raw)
      findings.push(dockerFinding(result, {
        id: `nuclei-${safeId(String(json["template-id"] ?? name))}`,
        title: name,
        severity,
        confidence: "medium",
        falsePositiveRisk: "medium",
        affectedAsset: matched,
        evidence: [
          `template: ${String(json["template-id"] ?? "(unknown)")}`,
          `matched: ${matched}`,
          ...(json["extracted-results"] ? [`extracted: ${JSON.stringify(json["extracted-results"]).slice(0, 300)}`] : []),
        ],
        nextVerification: "Inspect the template logic, reproduce the request, and validate impact before confirming.",
      }))
    } catch {
      if (/\[(critical|high|medium|low|info)\]/i.test(trimmed)) {
        findings.push(dockerFinding(result, {
          id: `nuclei-${safeId(trimmed).slice(0, 48)}`,
          title: `Nuclei finding: ${oneLine(trimmed, 90)}`,
          severity: severityFromText(trimmed, "low"),
          confidence: "medium",
          falsePositiveRisk: "medium",
          evidence: [oneLine(trimmed, 500)],
          nextVerification: "Reproduce the nuclei request and validate impact before confirming.",
        }))
      }
    }
  }
  return dedupeDockerFindings(findings).slice(0, 30)
}

function parseFfufFindings(result: SecurityDockerRunResult, text: string): SecurityDistilledFinding[] {
  const findings: SecurityDistilledFinding[] = []
  try {
    const parsed = JSON.parse(text) as Record<string, unknown>
    const results = Array.isArray(parsed["results"]) ? parsed["results"] as Array<Record<string, unknown>> : []
    for (const item of results.slice(0, 30)) {
      const url = String(item["url"] ?? item["input"] ?? result.target.raw)
      const status = Number(item["status"] ?? 0)
      findings.push(pathDiscoveryFinding(result, "ffuf", url, status, JSON.stringify(item).slice(0, 500)))
    }
  } catch {
    for (const line of text.split(/\r?\n/).map((item) => item.trim()).filter(Boolean).slice(0, 30)) {
      if (/\b(200|201|204|301|302|307|308|401|403)\b/.test(line)) findings.push(pathDiscoveryFinding(result, "ffuf", line, statusFromText(line), line))
    }
  }
  return dedupeDockerFindings(findings)
}

function parseGobusterFindings(result: SecurityDockerRunResult, text: string): SecurityDistilledFinding[] {
  return dedupeDockerFindings(text.split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^\/\S+/.test(line) && /\b(Status:\s*\d{3}|\d{3})\b/i.test(line))
    .slice(0, 30)
    .map((line) => pathDiscoveryFinding(result, "gobuster", line.split(/\s+/)[0] ?? line, statusFromText(line), line)))
}

function parseSqlmapFindings(result: SecurityDockerRunResult, text: string): SecurityDistilledFinding[] {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  const injectable = lines.filter((line) => /\b(is vulnerable|appears to be injectable|parameter '.+' is vulnerable|sql injection)\b/i.test(line))
  if (injectable.length === 0) return []
  return [dockerFinding(result, {
    id: `sqlmap-injection-${safeId(result.target.host)}`,
    title: "Potential SQL injection reported by sqlmap",
    severity: "high",
    confidence: "medium",
    falsePositiveRisk: "medium",
    evidence: injectable.slice(0, 8).map((line) => oneLine(line, 500)),
    nextVerification: "Confirm parameter, payload, DBMS fingerprint, and exploitability in scope before reporting as confirmed.",
  })]
}

function dockerFinding(result: SecurityDockerRunResult, input: {
  id: string
  title: string
  severity: SecuritySeverity
  confidence: SecurityConfidence
  falsePositiveRisk: SecurityConfidence
  evidence: string[]
  nextVerification: string
  affectedAsset?: string | undefined
  extraEvidence?: string[] | undefined
}): SecurityDistilledFinding {
  return {
    id: input.id,
    title: input.title,
    affectedAsset: input.affectedAsset ?? result.target.raw,
    severity: input.severity,
    confidence: input.confidence,
    status: "needs-validation",
    evidence: [...input.evidence, ...(input.extraEvidence ?? [])].map((line) => oneLine(line, 500)).slice(0, 8),
    falsePositiveRisk: input.falsePositiveRisk,
    nextVerification: input.nextVerification,
    sourceTool: result.action,
    rawArtifactPath: result.outputDir,
  }
}

function pathDiscoveryFinding(result: SecurityDockerRunResult, source: "ffuf" | "gobuster", url: string, status: number, evidence: string): SecurityDistilledFinding {
  const interesting = status === 401 || status === 403 || status >= 500
  return dockerFinding(result, {
    id: `${source}-path-${safeId(url).slice(0, 60)}`,
    title: `${source} discovered path (${status || "unknown"})`,
    affectedAsset: url,
    severity: interesting ? "low" : "info",
    confidence: status > 0 ? "medium" : "low",
    falsePositiveRisk: interesting ? "medium" : "high",
    evidence: [oneLine(evidence, 500)],
    nextVerification: "Manually request the path, confirm authorization behavior, and exclude expected public routes.",
  })
}

function serviceSeverity(service: string): SecuritySeverity {
  if (/^(ssh|rdp|telnet|mysql|postgresql|mssql|redis|mongodb|ftp|smb|ldap)$/i.test(service)) return "medium"
  if (/^(http|https|ssl\/http)$/i.test(service)) return "low"
  return "low"
}

function severityFromText(text: string, fallback: SecuritySeverity): SecuritySeverity {
  if (/\b(critical|high|vulnerable|sql injection|heartbleed|poodle|robot)\b/i.test(text)) return "high"
  if (/\b(medium|weak|expired|fail|warning)\b/i.test(text)) return "medium"
  if (/\b(low)\b/i.test(text)) return "low"
  if (/\b(info|informational)\b/i.test(text)) return "info"
  return fallback
}

function statusFromText(text: string): number {
  const match = text.match(/\b([1-5]\d{2})\b/)
  return match?.[1] ? Number(match[1]) : 0
}

function dedupeDockerFindings(findings: SecurityDistilledFinding[]): SecurityDistilledFinding[] {
  const map = new Map<string, SecurityDistilledFinding>()
  for (const finding of findings) map.set(`${finding.sourceTool}:${finding.id}:${finding.affectedAsset}`, finding)
  return [...map.values()]
}

function buildDistillation(input: {
  target: string
  profile: string
  sourceTool: string
  findings: SecurityDistilledFinding[]
  rawArtifactPath?: string | undefined
}): SecurityDistillation {
  const bySeverity: Record<SecuritySeverity, number> = { info: 0, low: 0, medium: 0, high: 0 }
  const falsePositiveRisk: Record<SecurityConfidence, number> = { low: 0, medium: 0, high: 0 }
  for (const finding of input.findings) {
    bySeverity[finding.severity]++
    falsePositiveRisk[finding.falsePositiveRisk]++
  }
  return {
    target: input.target,
    profile: input.profile,
    sourceTool: input.sourceTool,
    findings: input.findings,
    summary: {
      total: input.findings.length,
      bySeverity,
      confirmed: input.findings.filter((finding) => finding.status === "confirmed").length,
      needsValidation: input.findings.filter((finding) => finding.status === "needs-validation" || finding.status === "hypothesis").length,
      falsePositiveRisk,
    },
    ...(input.rawArtifactPath ? { rawArtifactPath: input.rawArtifactPath } : {}),
  }
}

function selectEvidence(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => /\b(open|vulnerab|warning|critical|high|medium|low|ssl|tls|cve|http|service|port|error|fail)\b/i.test(line))
    .slice(0, 12)
    .map((line) => oneLine(line, 500))
}

function safeId(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9_.-]+/g, "-").replace(/^-+|-+$/g, "") || "target"
}

function oneLine(value: string, max: number): string {
  const clean = value.replace(/\s+/g, " ").trim()
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean
}
