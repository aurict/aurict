import { z } from "zod"
import type { ToolDef, ExecuteResult } from "../types.js"
import { resolveWithinWorkspace } from "../../security/path-boundary.js"
import type { BlastRadiusMode, BlastRadiusRequest } from "./blast-radius-contracts.js"
import { formatBlastResult, formatBreakResult, formatWarnings } from "./blast-radius-format.js"
import { BlastRadiusCancelledError, runBlastRadiusWorker } from "./blast-radius-runner.js"

export const blastRadiusTool: ToolDef = {
  id: "blast_radius",
  spec: { category: "read", riskLevel: "low" },
  description: `Project-aware semantic impact analysis running in an isolated worker.

PHASE 1 — references: find symbol usages across configured TypeScript projects.
PHASE 2 — breaks: simulate a change in memory using each project's real tsconfig and report new diagnostics.

Results state the exact analyzed scope. A clean result means no new errors in that scope; it is not an unconditional safety guarantee.

EXAMPLES:
  { symbol: "extractPattern", file: "packages/core/src/tool/executor.ts" }
  { symbol: "extractPattern", file: "...", mode: "breaks", from: "extractPattern(tool, args)", to: "extractPattern(tool, args, workdir)" }
  { symbol: "extractPattern", mode: "both", from: "...", to: "..." }`,
  parameters: z.object({
    symbol: z.string().describe("Symbol name to analyze"),
    file: z.string().optional().describe("Declaration file inside the working directory"),
    mode: z.enum(["references", "breaks", "both"]).optional().default("references"),
    from: z.string().optional().describe("Current code fragment to replace for breaks/both mode"),
    to: z.string().optional().describe("Replacement code fragment for breaks/both mode"),
    json: z.boolean().optional().default(false),
  }),
  async execute(args, ctx): Promise<ExecuteResult> {
    const symbol = String(args["symbol"] ?? "").trim()
    const mode = (args["mode"] as BlastRadiusMode | undefined) ?? "references"
    const from = args["from"] ? String(args["from"]) : undefined
    const to = args["to"] ? String(args["to"]) : undefined
    if (!symbol) return { output: "", error: "symbol is required" }
    if (mode !== "references" && (!from || !to)) return { output: "", error: "'from' and 'to' are required for breaks/both mode" }

    let hintFile: string | undefined
    if (args["file"]) {
      try {
        hintFile = await resolveWithinWorkspace(ctx.workdir, String(args["file"]))
      } catch (error) {
        return { output: "", error: `Invalid declaration file: ${error instanceof Error ? error.message : String(error)}` }
      }
    }

    const request: BlastRadiusRequest = {
      workdir: ctx.workdir,
      symbol,
      mode,
      ...(hintFile ? { hintFile } : {}),
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
    }
    try {
      const analysis = await runBlastRadiusWorker(request, ctx.signal)
      if (Boolean(args["json"])) {
        const output: Record<string, unknown> = { symbol, warnings: analysis.warnings }
        if (analysis.references) {
          output.refs = analysis.references.refs
          output.packages = analysis.references.packages
          output.declFile = analysis.references.declFile
          output.declLine = analysis.references.declLine
          output.scope = analysis.references.scope
        }
        if (analysis.breaks) output.breaks = analysis.breaks
        return { output: JSON.stringify(output, null, 2) }
      }
      const parts = [
        analysis.references ? formatBlastResult(analysis.references) : "",
        analysis.breaks ? formatBreakResult(analysis.breaks) : "",
        formatWarnings(analysis.warnings),
      ].filter(Boolean)
      return { output: parts.join("\n\n") }
    } catch (error) {
      if (error instanceof BlastRadiusCancelledError) return { output: "", error: error.message }
      return { output: "", error: `Blast-radius analysis failed: ${error instanceof Error ? error.message : String(error)}` }
    }
  },
}
