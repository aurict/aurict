import { z } from "zod"
import { applySecurityVerification, formatSecurityVerification, verifySecurityFinding } from "../../security/verifier.js"
import type { SecurityDistilledFinding } from "../../security/distiller.js"
import type { ToolDef, ToolContext, ExecuteResult } from "../types.js"

export const securityVerifyTool: ToolDef = {
  id: "security_verify",
  description: "Adversarially verify a distilled security finding. Does not perform network activity.",
  parameters: z.object({
    finding_json: z.string().describe("A single SecurityDistilledFinding JSON object to verify."),
    apply: z.boolean().default(false).describe("If true, return the finding with verification verdict applied."),
  }),
  spec: {
    category: "read",
    riskLevel: "low",
    securityCapability: "passive",
    permissionSummary: "Verify a distilled security finding and reduce false positives",
  },
  async execute(args, _ctx: ToolContext): Promise<ExecuteResult> {
    try {
      const finding = JSON.parse(String(args["finding_json"] ?? "")) as SecurityDistilledFinding
      if (!finding || typeof finding !== "object" || !finding.id || !finding.title) {
        return { output: "", error: "finding_json must be a SecurityDistilledFinding object" }
      }
      const verification = verifySecurityFinding(finding)
      const applied = args["apply"] === true ? applySecurityVerification(finding, verification) : undefined
      return {
        output: [
          formatSecurityVerification(verification),
          applied ? `\n[Updated Finding]\n${JSON.stringify(applied, null, 2)}` : "",
        ].filter(Boolean).join("\n"),
      }
    } catch (err) {
      return { output: "", error: `Invalid finding_json: ${err instanceof Error ? err.message : String(err)}` }
    }
  },
}
