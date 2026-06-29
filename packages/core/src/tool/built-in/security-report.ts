import { z } from "zod"
import { buildSecurityReport, type SecurityRunResult } from "../../security/runner.js"
import type { ToolDef, ToolContext, ExecuteResult } from "../types.js"

export const securityReportTool: ToolDef = {
  id: "security_report",
  description: "Create a concise security report from JSON results returned by security_recon or security_scan. Does not perform network activity.",
  parameters: z.object({
    title: z.string().default("Security Assessment Report").describe("Report title."),
    results_json: z.string().describe("JSON array of SecurityRunResult objects, or a single SecurityRunResult object."),
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
      const parsed = JSON.parse(raw) as SecurityRunResult | SecurityRunResult[]
      const results = Array.isArray(parsed) ? parsed : [parsed]
      if (results.length === 0) return { output: "", error: "results_json must contain at least one result" }
      return { output: buildSecurityReport(title, results) }
    } catch (err) {
      return { output: "", error: `Invalid results_json: ${err instanceof Error ? err.message : String(err)}` }
    }
  },
}
