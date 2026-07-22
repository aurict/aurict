import { z } from "zod"
import { inspectDependency } from "../dependency/package-inspector.js"
import type { ToolDef } from "../types.js"

const actions = ["resolve_package", "search_export", "read_type", "read_docs", "show_examples"] as const

export const depDocsTool: ToolDef = {
  id: "dep_docs",
  description: `Inspect the API and documentation of the exact dependency version installed locally.

Use before writing code against a third-party package. Sources are lock-resolved
package metadata, declaration files, README, and changelog; no internet or
training-data guess is used. read_type returns declaration context for a symbol.`,
  parameters: z.object({
    action: z.enum(actions),
    package: z.string().describe("Installed package name, e.g. zod or @scope/package"),
    query: z.string().optional().describe("Text/export/documentation query"),
    symbol: z.string().optional().describe("Exact type, function, class, or export name"),
    max_results: z.number().int().min(1).max(50).default(12),
  }),
  spec: { category: "read", riskLevel: "low", permissionSummary: "Inspect an installed dependency" },
  async execute(args, ctx) {
    try {
      return { output: await inspectDependency(ctx.workdir, {
        action: args["action"] as typeof actions[number],
        packageName: String(args["package"]),
        ...(args["query"] ? { query: String(args["query"]) } : {}),
        ...(args["symbol"] ? { symbol: String(args["symbol"]) } : {}),
        maxResults: Number(args["max_results"] ?? 12),
      }) }
    } catch (error) {
      return { output: "", error: error instanceof Error ? error.message : String(error) }
    }
  },
}
