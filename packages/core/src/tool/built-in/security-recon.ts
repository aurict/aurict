import { z } from "zod"
import { loadConfig } from "../../config/config.js"
import { runSecurityRecon } from "../../security/runner.js"
import { runSecurityDockerTool } from "../../security/docker-runner.js"
import { distillSecurityRunResult, formatSecurityDistillationForModel } from "../../security/distiller.js"
import type { ToolDef, ToolContext, ExecuteResult } from "../types.js"

export const securityReconTool: ToolDef = {
  id: "security_recon",
  description: `Run controlled reconnaissance for an explicitly allowlisted target.

This tool is available only when securitySandbox is enabled with an active profile.
It performs bounded DNS, HTTP header, and TLS metadata checks. It does not run shell commands,
exploit payloads, brute force, or port sweeps.`,
  parameters: z.object({
    target: z.string().describe("Allowlisted host or http(s) URL to inspect."),
    include_ports: z.boolean().optional().describe("If true, also run a bounded Docker-backed top-ports nmap service discovery."),
  }),
  spec: {
    category: "network",
    riskLevel: "high",
    securityCapability: "active",
    permissionSummary: "Controlled security reconnaissance against an allowlisted target",
  },
  async execute(args, ctx: ToolContext): Promise<ExecuteResult> {
    const target = String(args["target"] ?? "")
    try {
      const config = loadConfig(ctx.workdir)
      const result = await runSecurityRecon(target, config)
      if (args["include_ports"] === true) {
        const portResult = await runSecurityDockerTool({
          action: "nmap_top",
          target,
          workdir: ctx.workdir,
          config,
          signal: ctx.signal,
        })
        result.artifacts = {
          ...(result.artifacts ?? {}),
          nmapTop: portResult,
        }
        result.checks.push({
          id: "nmap-top-ports",
          title: "Top ports service discovery",
          status: portResult.exitCode === 0 ? "info" : "warning",
          severity: "info",
          detail: portResult.exitCode === 0
            ? "Docker-backed nmap top ports scan completed."
            : `Docker-backed nmap top ports scan exited with code ${portResult.exitCode}.`,
          evidence: [portResult.stdout, portResult.stderr].filter(Boolean).join("\n").slice(0, 2_000),
        })
      }
      const security = distillSecurityRunResult(result, "security_recon")
      return {
        output: formatSecurityDistillationForModel(security),
        metadata: { security },
      }
    } catch (err) {
      return { output: "", error: err instanceof Error ? err.message : String(err) }
    }
  },
}
