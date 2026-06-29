import { z } from "zod"
import { buildAttackGraphFromFindings, formatAttackGraph } from "../../security/attack-graph.js"
import type { SecurityDistillation, SecurityDistilledFinding } from "../../security/distiller.js"
import type { ExecuteResult, ToolContext, ToolDef } from "../types.js"

export const securityAttackGraphTool: ToolDef = {
  id: "security_attack_graph",
  description: "Build an evidence-bounded attack path graph from distilled security findings. Does not perform network activity.",
  parameters: z.object({
    findings_json: z.string().describe("SecurityDistillation JSON, array of SecurityDistillation objects, or array of SecurityDistilledFinding objects."),
    include_json: z.boolean().default(false).describe("If true, append the machine-readable graph JSON."),
  }),
  spec: {
    category: "read",
    riskLevel: "low",
    securityCapability: "passive",
    permissionSummary: "Convert validated/distilled findings into an attack path graph",
  },
  async execute(args, _ctx: ToolContext): Promise<ExecuteResult> {
    try {
      const findings = parseFindings(String(args["findings_json"] ?? ""))
      if (findings.length === 0) return { output: "", error: "findings_json did not contain any findings" }
      const graph = buildAttackGraphFromFindings(findings)
      return {
        output: [
          formatAttackGraph(graph),
          args["include_json"] === true ? `\n[Attack Graph JSON]\n${JSON.stringify(graph, null, 2)}` : "",
        ].filter(Boolean).join("\n"),
      }
    } catch (err) {
      return { output: "", error: `Invalid findings_json: ${err instanceof Error ? err.message : String(err)}` }
    }
  },
}

function parseFindings(raw: string): SecurityDistilledFinding[] {
  const parsed = JSON.parse(raw) as unknown
  const values = Array.isArray(parsed) ? parsed : [parsed]
  const findings: SecurityDistilledFinding[] = []
  for (const value of values) {
    if (isDistillation(value)) findings.push(...value.findings)
    else if (isFinding(value)) findings.push(value)
  }
  return findings
}

function isDistillation(value: unknown): value is SecurityDistillation {
  return Boolean(value && typeof value === "object" && Array.isArray((value as SecurityDistillation).findings))
}

function isFinding(value: unknown): value is SecurityDistilledFinding {
  return Boolean(
    value &&
    typeof value === "object" &&
    typeof (value as SecurityDistilledFinding).id === "string" &&
    typeof (value as SecurityDistilledFinding).affectedAsset === "string" &&
    Array.isArray((value as SecurityDistilledFinding).evidence),
  )
}
