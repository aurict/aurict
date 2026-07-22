import { z } from "zod"
import { executeAstEdit } from "../ast/structural-edit.js"
import type { ToolDef } from "../types.js"

const actions = ["match", "preview", "apply", "verify"] as const
const kinds = ["call_callee", "property_access", "import_source"] as const

export const astEditTool: ToolDef = {
  id: "ast_edit",
  description: `Apply bounded TypeScript/JavaScript structural codemods.

Supported nodes: call_callee, property_access, import_source. Run match, then
preview, then apply with the returned preview_id. Apply is rejected if files
changed since preview. Use LSP rename for semantic symbol renames.`,
  parameters: z.object({
    action: z.enum(actions),
    kind: z.enum(kinds),
    match: z.string(),
    replacement: z.string().optional(),
    paths: z.array(z.string()).max(20).default([]),
    preview_id: z.string().uuid().optional(),
    max_files: z.number().int().min(1).max(200).default(80),
  }),
  spec: {
    category: "write",
    riskLevel: "medium",
    requiresConfirmation: args => args["action"] === "apply",
    permissionSummary: "Apply a previewed structural codemod",
  },
  async execute(args, ctx) {
    try {
      return await executeAstEdit({
        action: args["action"] as typeof actions[number],
        kind: args["kind"] as typeof kinds[number],
        match: String(args["match"] ?? ""),
        paths: (args["paths"] as string[] | undefined) ?? [],
        maxFiles: Number(args["max_files"] ?? 80),
        ...(args["replacement"] !== undefined ? { replacement: String(args["replacement"]) } : {}),
        ...(args["preview_id"] ? { previewId: String(args["preview_id"]) } : {}),
      }, ctx)
    } catch (error) {
      return { output: "", error: error instanceof Error ? error.message : String(error) }
    }
  },
}
