import { z } from "zod"
import { buildStrideThreatModel, formatThreatModel, type SecurityDataFlow } from "../../security/threat-model.js"
import type { ExecuteResult, ToolContext, ToolDef } from "../types.js"

const dataFlowSchema = z.object({
  id: z.string(),
  source: z.string(),
  destination: z.string(),
  data: z.string(),
  trustBoundary: z.string().optional(),
})

export const securityThreatModelTool: ToolDef = {
  id: "security_threat_model",
  description: "Build a structured STRIDE threat model from assets, actors, entrypoints, dataflows, and controls. Does not perform network activity.",
  parameters: z.object({
    assets: z.array(z.string()).min(1).describe("Assets or components in scope."),
    actors: z.array(z.string()).default(["external user"]).describe("Actors interacting with the assets."),
    entrypoints: z.array(z.string()).default([]).describe("Entrypoints such as routes, APIs, jobs, or interfaces."),
    dataflows: z.array(dataFlowSchema).default([]).describe("Dataflows crossing components or trust boundaries."),
    existing_controls: z.array(z.string()).default([]).describe("Known existing controls to map against STRIDE categories."),
    include_json: z.boolean().default(false).describe("If true, append the machine-readable threat model JSON."),
  }),
  spec: {
    category: "read",
    riskLevel: "low",
    securityCapability: "passive",
    permissionSummary: "Generate a structured security threat model",
  },
  async execute(args, _ctx: ToolContext): Promise<ExecuteResult> {
    const model = buildStrideThreatModel({
      assets: args["assets"] as string[],
      actors: args["actors"] as string[],
      entrypoints: args["entrypoints"] as string[],
      dataflows: args["dataflows"] as SecurityDataFlow[],
      existingControls: args["existing_controls"] as string[],
    })
    return {
      output: [
        formatThreatModel(model),
        args["include_json"] === true ? `\n[Threat Model JSON]\n${JSON.stringify(model, null, 2)}` : "",
      ].filter(Boolean).join("\n"),
    }
  },
}
