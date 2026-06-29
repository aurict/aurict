import { describe, expect, it } from "bun:test"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { z } from "zod"
import { AGENT_TYPE_TOOLS } from "../src/agent/protocol.js"
import { getSessionAgent } from "../src/agent/session-agents.js"
import { buildAttackGraphFromFindings, formatAttackGraph } from "../src/security/attack-graph.js"
import { buildSecurityAssessmentLedger, formatSecurityLedgerAnchor } from "../src/security/assessment-ledger.js"
import { prepareToolForSecurityCapability } from "../src/security/capability.js"
import { distillSecurityDockerResult, distillSecurityRunResult, formatSecurityDistillationForModel, type SecurityDistillation } from "../src/security/distiller.js"
import { readSecurityAssessmentLedger, updateSecurityAssessmentLedger, writeSecurityAssessmentLedger } from "../src/security/ledger-store.js"
import { analyzeSecurityLogs, formatSecurityLogAnalysis } from "../src/security/log-parser.js"
import { evaluateSecurityOperatorStep, formatSecurityOperatorDecision } from "../src/security/operator-loop.js"
import { buildStrideThreatModel, formatThreatModel } from "../src/security/threat-model.js"
import { applySecurityVerification, verifySecurityFinding } from "../src/security/verifier.js"
import { securityAttackGraphTool } from "../src/tool/built-in/security-attack-graph.js"
import { securityLogAnalyzeTool } from "../src/tool/built-in/security-log-analyze.js"
import { securityReportTool } from "../src/tool/built-in/security-report.js"
import { securityThreatModelTool } from "../src/tool/built-in/security-threat-model.js"
import { securityVerifyTool } from "../src/tool/built-in/security-verify.js"
import { subagentTool } from "../src/tool/built-in/subagent.js"
import { executeTool } from "../src/tool/executor.js"
import type { SecurityDockerRunResult } from "../src/security/docker-runner.js"
import type { SecurityRunResult } from "../src/security/runner.js"
import type { ToolContext } from "../src/tool/types.js"

describe("security operator architecture", () => {
  it("exposes specialized security agents only behind the right capability profile", () => {
    const off = prepareToolForSecurityCapability(subagentTool, { enabled: false, profile: "off" })
    const passive = prepareToolForSecurityCapability(subagentTool, { enabled: true, profile: "passive" })
    const active = prepareToolForSecurityCapability(subagentTool, { enabled: true, profile: "active-lite" })

    expect(off!.description).not.toContain("security_operator")
    expect(passive!.description).toContain("security_verifier")
    expect(passive!.description).toContain("security_reporter")
    expect(passive!.description).not.toContain("security_operator")
    expect(active!.description).toContain("security_operator")

    const passiveSchema = passive!.parameters as z.AnyZodObject
    expect(passiveSchema.safeParse({ type: "security_verifier", role: "Verifier", prompt: "Check evidence" }).success).toBe(true)
    expect(passiveSchema.safeParse({ type: "security_operator", role: "Operator", prompt: "Scan" }).success).toBe(false)
  })

  it("keeps active scan tools out of verifier and reporter agent profiles", () => {
    expect(AGENT_TYPE_TOOLS.security_operator).toContain("security_scan")
    expect(AGENT_TYPE_TOOLS.security_operator).toContain("security_verify")
    expect(AGENT_TYPE_TOOLS.security_operator).toContain("security_attack_graph")
    expect(AGENT_TYPE_TOOLS.security_operator).toContain("security_log_analyze")
    expect(AGENT_TYPE_TOOLS.security_operator).toContain("security_threat_model")
    expect(AGENT_TYPE_TOOLS.security_verifier).not.toContain("security_scan")
    expect(AGENT_TYPE_TOOLS.security_verifier).toContain("security_verify")
    expect(AGENT_TYPE_TOOLS.security_verifier).toContain("security_attack_graph")
    expect(AGENT_TYPE_TOOLS.security_reporter).not.toContain("security_scan")
    expect(AGENT_TYPE_TOOLS.security_reporter).toContain("security_report")
    expect(AGENT_TYPE_TOOLS.security_reporter).toContain("security_threat_model")
  })

  it("provides a built-in security session agent without changing omni defaults", () => {
    const security = getSessionAgent("security", process.cwd())
    const omni = getSessionAgent("omni", process.cwd())
    expect(security.name).toBe("Security")
    expect(security.allowedTools).toContain("security_scan")
    expect(security.allowedTools).toContain("security_verify")
    expect(security.allowedTools).toContain("security_attack_graph")
    expect(security.allowedTools).toContain("security_log_analyze")
    expect(security.allowedTools).toContain("security_threat_model")
    expect(security.system).toContain("Security workflow")
    expect(omni.allowedTools).toBeUndefined()
  })

  it("distills baseline security results into evidence-bounded findings", () => {
    const run: SecurityRunResult = {
      target: { raw: "https://example.com", host: "example.com" },
      profile: "active-lite",
      checks: [{
        id: "header-csp",
        title: "Content-Security-Policy",
        status: "warning",
        severity: "medium",
        detail: "content-security-policy is missing.",
        evidence: "headers: {}",
        recommendation: "Add a restrictive Content-Security-Policy header.",
      }],
    }

    const distilled = distillSecurityRunResult(run, "web_baseline")
    expect(distilled.findings[0]?.affectedAsset).toBe("https://example.com")
    expect(distilled.findings[0]?.status).toBe("needs-validation")
    expect(distilled.findings[0]?.falsePositiveRisk).toBe("medium")
    expect(formatSecurityDistillationForModel(distilled)).toContain("nextVerification")
  })

  it("distills docker scanner output without returning raw stdout dumps as model context", () => {
    const raw = Array.from({ length: 200 }, (_, i) => `PORT ${i}/tcp open service-${i}`).join("\n")
    const result: SecurityDockerRunResult = {
      action: "nmap_top",
      target: { raw: "example.com", host: "example.com" },
      image: "aurict-security-lite:test",
      command: ["nmap", "example.com"],
      outputDir: "/repo/.aurict/security/runs/1-example.com-nmap_top",
      stdout: raw,
      stderr: "",
      exitCode: 0,
      timedOut: false,
    }

    const distilled = distillSecurityDockerResult(result)
    const prompt = formatSecurityDistillationForModel(distilled)
    expect(distilled.rawArtifactPath).toBe(result.outputDir)
    expect(prompt.length).toBeLessThan(4_000)
    expect(prompt).toContain("Raw artifact path")
    expect(prompt).not.toContain("service-199")
  })

  it("distills scanner-specific docker outputs into targeted findings", () => {
    const nmap = distillSecurityDockerResult(sampleDockerResult("nmap_top", [
      "PORT     STATE SERVICE VERSION",
      "22/tcp   open  ssh     OpenSSH 9.2",
      "443/tcp  open  https   nginx",
    ].join("\n")))
    expect(nmap.findings.some((finding) => finding.id.includes("nmap-open-22-ssh"))).toBe(true)
    expect(nmap.findings.some((finding) => finding.affectedAsset.endsWith(":22"))).toBe(true)

    const nuclei = distillSecurityDockerResult(sampleDockerResult("nuclei", JSON.stringify({
      "template-id": "cves/2026/CVE-2026-0001",
      info: { name: "Example vulnerable component", severity: "high" },
      "matched-at": "https://example.com/admin",
    })))
    expect(nuclei.findings[0]?.title).toBe("Example vulnerable component")
    expect(nuclei.findings[0]?.severity).toBe("high")

    const sqlmap = distillSecurityDockerResult(sampleDockerResult("sqlmap", "parameter 'id' appears to be injectable\nGET parameter 'id' is vulnerable."))
    expect(sqlmap.findings[0]?.title).toContain("SQL injection")
    expect(sqlmap.findings[0]?.severity).toBe("high")
  })

  it("builds a bounded security assessment ledger and advances phase from scope to validation", () => {
    const finding = sampleDistillation().findings[0]!
    const scoped = buildSecurityAssessmentLedger({ objective: "assess example.com", scope: ["example.com"] })
    expect(scoped.phase).toBe("check_authorization")

    const withFinding = buildSecurityAssessmentLedger({
      objective: "assess example.com",
      scope: ["example.com"],
      authorizedTargets: ["example.com"],
      findings: [finding],
      previous: scoped,
    })
    expect(withFinding.phase).toBe("false_positive_review")
    expect(formatSecurityLedgerAnchor(withFinding)).toContain("Do not confirm findings without evidence validation")
  })

  it("persists and resumes the security assessment ledger from project storage", () => {
    const workdir = mkdtempSync(join(tmpdir(), "aurict-security-ledger-"))
    try {
      const ledger = updateSecurityAssessmentLedger(workdir, {
        objective: "assess example.com",
        scope: ["example.com"],
        authorizedTargets: ["example.com"],
        findings: [sampleDistillation().findings[0]!],
      })
      expect(readSecurityAssessmentLedger(workdir)?.findings.length).toBe(1)
      const next = writeSecurityAssessmentLedger(workdir, buildSecurityAssessmentLedger({
        objective: ledger.objective,
        scope: [],
        authorizedTargets: ledger.authorizedTargets,
        findings: ledger.findings,
      }))
      expect(readSecurityAssessmentLedger(workdir)?.updatedAt).toBe(next.updatedAt)
    } finally {
      rmSync(workdir, { recursive: true, force: true })
    }
  })

  it("evaluates the security operator loop without allowing phase skips", () => {
    const empty = buildSecurityAssessmentLedger({ objective: "assess" })
    const disabled = { enabled: false, profile: "off" as const, image: "", network: "none" as const, targetAllowlist: [], requireApprovalFor: [], maxConcurrent: 0, requestsPerMinute: 0 }
    expect(evaluateSecurityOperatorStep(empty, disabled).status).toBe("needs-input")

    const authorized = buildSecurityAssessmentLedger({
      objective: "assess",
      scope: ["example.com"],
      authorizedTargets: ["example.com"],
    })
    const active = { enabled: true, profile: "active-lite" as const, image: "img", network: "restricted" as const, targetAllowlist: ["example.com"], requireApprovalFor: [], maxConcurrent: 1, requestsPerMinute: 60 }
    const scanDecision = evaluateSecurityOperatorStep(authorized, active)
    expect(scanDecision.phase).toBe("active_scan")
    expect(scanDecision.allowedTools).toContain("security_scan")

    const withFinding = buildSecurityAssessmentLedger({
      objective: "assess",
      scope: ["example.com"],
      authorizedTargets: ["example.com"],
      findings: [sampleDistillation().findings[0]!],
    })
    const verifyDecision = evaluateSecurityOperatorStep(withFinding, active)
    expect(verifyDecision.phase).toBe("false_positive_review")
    expect(verifyDecision.allowedTools).toContain("security_verify")
    expect(formatSecurityOperatorDecision(verifyDecision)).toContain("Required evidence")
  })

  it("reports distilled findings without requiring raw SecurityRunResult JSON", async () => {
    const result = await executeTool(securityReportTool, {
      title: "Distilled Security Report",
      results_json: JSON.stringify(sampleDistillation()),
    }, ctx())

    expect(result.error).toBeUndefined()
    expect(result.output).toContain("# Distilled Security Report")
    expect(result.output).toContain("False-positive risk")
    expect(result.output).toContain("## Executive Summary")
    expect(result.output).toContain("## Risk Matrix")
    expect(result.output).toContain("## Remediation Priority")
    expect(result.output).toContain("## Appendix")
    expect(result.output).toContain("## Unverified Findings")
    expect(result.output).toContain("Verification requirement")
  })

  it("verifies distilled findings and can apply the verdict before reporting", async () => {
    const finding = sampleDistillation().findings[0]!
    const verification = verifySecurityFinding(finding)
    expect(verification.verdict).not.toBe("confirmed")
    expect(verification.requiredFollowup.length).toBeGreaterThan(0)

    const applied = applySecurityVerification(finding, verification)
    expect(applied.status).toBe(verification.verdict)
    expect(applied.nextVerification).toContain("Check production headers")
  })

  it("exposes security_verify as passive tool and hides it when security is off", async () => {
    expect(prepareToolForSecurityCapability(securityVerifyTool, { enabled: false, profile: "off" })).toBeNull()
    expect(prepareToolForSecurityCapability(securityVerifyTool, { enabled: true, profile: "passive" })).not.toBeNull()

    const result = await executeTool(securityVerifyTool, {
      finding_json: JSON.stringify(sampleDistillation().findings[0]),
      apply: true,
    }, ctx())
    expect(result.error).toBeUndefined()
    expect(result.output).toContain("[Security Finding Verification]")
    expect(result.output).toContain("[Updated Finding]")
  })

  it("exposes passive graph, log, and threat model tools only when security is enabled", async () => {
    for (const tool of [securityAttackGraphTool, securityLogAnalyzeTool, securityThreatModelTool]) {
      expect(prepareToolForSecurityCapability(tool, { enabled: false, profile: "off" })).toBeNull()
      expect(prepareToolForSecurityCapability(tool, { enabled: true, profile: "passive" })).not.toBeNull()
    }

    const graph = await executeTool(securityAttackGraphTool, {
      findings_json: JSON.stringify(sampleDistillation()),
    }, ctx())
    expect(graph.error).toBeUndefined()
    expect(graph.output).toContain("[Security Attack Path Graph]")

    const logs = await executeTool(securityLogAnalyzeTool, {
      log_text: '10.0.0.1 - - [29/Jun/2026:10:00:00 +0000] "GET /.env HTTP/1.1" 404 12',
    }, ctx())
    expect(logs.error).toBeUndefined()
    expect(logs.output).toContain("[Security Log Analysis]")

    const threat = await executeTool(securityThreatModelTool, {
      assets: ["payments-api"],
      actors: ["external user"],
      entrypoints: ["/api/payments"],
      dataflows: [{ id: "flow-1", source: "browser", destination: "payments-api", data: "payment token", trustBoundary: "internet-to-app" }],
    }, ctx())
    expect(threat.error).toBeUndefined()
    expect(threat.output).toContain("[Security Threat Model]")
  })

  it("builds attack graph edges that remain hypotheses without evidence", () => {
    const withEvidence = sampleDistillation().findings[0]!
    const enriched = {
      ...withEvidence,
      id: "CVE-2026-0001-admin-token",
      title: "Open ssh service exposes admin token risk",
      affectedAsset: "https://example.com:22/admin",
      evidence: ["22/tcp open ssh OpenSSH 9.2", "admin returned 403", "CVE-2026-0001", "token boundary may be exposed"],
    }
    const withoutEvidence = { ...withEvidence, id: "weak", title: "Weak finding", evidence: [], confidence: "low" as const }
    const graph = buildAttackGraphFromFindings([enriched, withoutEvidence])
    expect(graph.nodes.some((node) => node.kind === "vulnerability")).toBe(true)
    expect(graph.nodes.some((node) => node.kind === "service")).toBe(true)
    expect(graph.nodes.some((node) => node.kind === "technology")).toBe(true)
    expect(graph.nodes.some((node) => node.kind === "cve")).toBe(true)
    expect(graph.nodes.some((node) => node.kind === "auth-boundary")).toBe(true)
    expect(graph.nodes.some((node) => node.kind === "credential-boundary")).toBe(true)
    expect(graph.edges.some((edge) => edge.status === "supported")).toBe(true)
    expect(graph.edges.some((edge) => edge.status === "hypothesis")).toBe(true)
    expect(formatAttackGraph(graph)).toContain("add evidence before treating this as a confirmed attack path")
  })

  it("normalizes log traffic into bounded anomalies instead of raw log context", () => {
    const lines = [
      '10.0.0.1 - - [29/Jun/2026:10:00:00 +0000] "GET /login HTTP/1.1" 401 120',
      '10.0.0.1 - - [29/Jun/2026:10:00:01 +0000] "GET /.env HTTP/1.1" 404 12',
      ...Array.from({ length: 10 }, (_, i) => `10.0.0.1 - - [29/Jun/2026:10:00:${String(i + 2).padStart(2, "0")} +0000] "GET /missing-${i} HTTP/1.1" 404 12`),
    ].join("\n")
    const analysis = analyzeSecurityLogs(lines)
    expect(analysis.parsedEvents).toBe(12)
    expect(analysis.suspiciousSequences.some((item) => item.includes("repeated 404"))).toBe(true)
    expect(formatSecurityLogAnalysis(analysis)).toContain("Suspicious sequences")
  })

  it("builds STRIDE threat model as data instead of prompt-only guidance", () => {
    const model = buildStrideThreatModel({
      assets: ["payments-api"],
      actors: ["external user"],
      entrypoints: ["/api/payments"],
      dataflows: [{ id: "flow-1", source: "browser", destination: "payments-api", data: "payment token", trustBoundary: "internet-to-app" }],
    })
    expect(model.threats.length).toBe(6)
    expect(model.threats.some((threat) => threat.category === "Elevation of Privilege")).toBe(true)
    expect(formatThreatModel(model)).toContain("STRIDE")
  })
})

function sampleDistillation(): SecurityDistillation {
  return {
    target: "https://example.com",
    profile: "active-lite",
    sourceTool: "web_baseline",
    findings: [{
      id: "header-csp",
      title: "Content-Security-Policy missing",
      affectedAsset: "https://example.com",
      severity: "medium",
      confidence: "medium",
      status: "needs-validation",
      evidence: ["content-security-policy is missing"],
      falsePositiveRisk: "medium",
      nextVerification: "Check production headers with a second request.",
      sourceTool: "web_baseline",
    }],
    summary: {
      total: 1,
      bySeverity: { info: 0, low: 0, medium: 1, high: 0 },
      confirmed: 0,
      needsValidation: 1,
      falsePositiveRisk: { low: 0, medium: 1, high: 0 },
    },
  }
}

function sampleDockerResult(action: SecurityDockerRunResult["action"], stdout: string): SecurityDockerRunResult {
  return {
    action,
    target: { raw: "https://example.com", host: "example.com" },
    image: "aurict-security-lite:test",
    command: [action, "example.com"],
    outputDir: `/repo/.aurict/security/runs/1-example.com-${action}`,
    stdout,
    stderr: "",
    exitCode: 0,
    timedOut: false,
  }
}

function ctx(): ToolContext {
  return {
    sessionId: "security-operator-test",
    workdir: process.cwd(),
    signal: new AbortController().signal,
    isSubagent: true,
  }
}
