import { z } from "zod"
import { hybridIndexStatus, rebuildHybridIndex, searchHybridIndex } from "../search/hybrid-index.js"
import type { ToolDef } from "../types.js"

export const semanticSearchTool: ToolDef = {
  id: "semantic_search",
  timeoutMs: 30_000,
  description: `Search source code conceptually using a local hybrid BM25 index.

Combines identifiers, camel/snake-case terms, paths, and conservative code-domain
synonyms. Use for conceptual discovery such as 'where are auth credentials
renewed?'. The index is local, mtime-invalidated, and sends no code externally.`,
  parameters: z.object({
    action: z.enum(["search", "status", "rebuild"]).default("search"),
    query: z.string().optional(),
    limit: z.number().int().min(1).max(30).default(10),
  }),
  spec: { category: "read", riskLevel: "low", permissionSummary: "Search a local source-code index" },
  async execute(args, ctx) {
    try {
      const action = String(args["action"] ?? "search")
      if (action === "status") return { output: JSON.stringify(hybridIndexStatus(ctx.workdir) ?? { status: "not_built" }, null, 2) }
      if (action === "rebuild") {
        const index = await rebuildHybridIndex(ctx.workdir)
        return { output: JSON.stringify({ files: index.files, chunks: index.chunks.length, builtAt: index.builtAt }, null, 2) }
      }
      const { index, results } = await searchHybridIndex(ctx.workdir, String(args["query"] ?? ""), Number(args["limit"] ?? 10))
      return { output: JSON.stringify({ query: args["query"], index: { files: index.files, chunks: index.chunks.length, builtAt: index.builtAt }, results }, null, 2) }
    } catch (error) {
      return { output: "", error: error instanceof Error ? error.message : String(error) }
    }
  },
}
