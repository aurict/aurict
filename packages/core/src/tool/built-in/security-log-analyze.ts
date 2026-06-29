import { z } from "zod"
import { analyzeSecurityLogs, formatSecurityLogAnalysis } from "../../security/log-parser.js"
import type { ExecuteResult, ToolContext, ToolDef } from "../types.js"

export const securityLogAnalyzeTool: ToolDef = {
  id: "security_log_analyze",
  description: "Normalize HTTP access logs into bounded security anomalies and suspicious sequences. Does not perform network activity.",
  parameters: z.object({
    log_text: z.string().describe("Raw HTTP access log text. Keep large logs in files and pass only the relevant slice."),
    max_lines: z.number().int().positive().max(50_000).default(10_000).describe("Maximum lines to parse."),
    include_json: z.boolean().default(false).describe("If true, append the machine-readable analysis JSON."),
  }),
  spec: {
    category: "read",
    riskLevel: "low",
    securityCapability: "passive",
    permissionSummary: "Distill log traffic into anomalies and suspicious sequences",
  },
  async execute(args, _ctx: ToolContext): Promise<ExecuteResult> {
    const analysis = analyzeSecurityLogs(String(args["log_text"] ?? ""), Number(args["max_lines"] ?? 10_000))
    return {
      output: [
        formatSecurityLogAnalysis(analysis),
        args["include_json"] === true ? `\n[Log Analysis JSON]\n${JSON.stringify(analysis, null, 2)}` : "",
      ].filter(Boolean).join("\n"),
    }
  },
}
