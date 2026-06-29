import { z } from "zod"
import { loadConfig } from "../../config/config.js"
import { runWebBaselineScan } from "../../security/runner.js"
import { runSecurityDockerTool, type SecurityDockerAction } from "../../security/docker-runner.js"
import type { ToolDef, ToolContext, ExecuteResult } from "../types.js"

const DOCKER_SCAN_TYPES = [
  "nmap_top",
  "nmap_service",
  "testssl",
  "nikto",
  "nuclei",
  "ffuf",
  "gobuster",
  "sqlmap",
] as const

type DockerScanType = typeof DOCKER_SCAN_TYPES[number]

export const securityScanTool: ToolDef = {
  id: "security_scan",
  description: `Run a controlled baseline security scan for an explicitly allowlisted target.

This first-phase scanner checks web security headers and basic exposure signals using bounded
HTTP metadata collection. Docker-backed scan types run only through fixed command builders with target allowlist checks.`,
  parameters: z.object({
    target: z.string().describe("Allowlisted http(s) URL or host to scan."),
    scan_type: z.enum(["web_baseline", ...DOCKER_SCAN_TYPES]).default("web_baseline").describe("Scan type to run. Docker-backed types require the configured security image."),
    wordlist: z.string().optional().describe("Optional container-internal wordlist path for ffuf/gobuster. Ignored by other scan types."),
  }),
  spec: {
    category: "network",
    riskLevel: "high",
    securityCapability: "active",
    permissionSummary: "Controlled baseline security scan against an allowlisted target",
  },
  async execute(args, ctx: ToolContext): Promise<ExecuteResult> {
    const target = String(args["target"] ?? "")
    const scanType = String(args["scan_type"] ?? "web_baseline")
    try {
      const config = loadConfig(ctx.workdir)
      if (scanType === "web_baseline") {
        const result = await runWebBaselineScan(target, config)
        return { output: JSON.stringify(result, null, 2) }
      }

      const result = await runSecurityDockerTool({
        action: scanType as SecurityDockerAction,
        target,
        workdir: ctx.workdir,
        config,
        signal: ctx.signal,
        ...(args["wordlist"] ? { wordlist: String(args["wordlist"]) } : {}),
      })
      return { output: JSON.stringify(result, null, 2), ...(result.exitCode === 0 ? {} : { error: `security_scan ${scanType} exited with code ${result.exitCode}` }) }
    } catch (err) {
      return { output: "", error: err instanceof Error ? err.message : String(err) }
    }
  },
}
