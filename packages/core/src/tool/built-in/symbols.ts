import { z } from "zod"
import { resolve } from "path"
import { extractSymbols } from "../../analysis/symbols.js"
import type { ToolDef, ToolContext, ExecuteResult } from "../types.js"

export const symbolsTool: ToolDef = {
  id: "symbols",
  description: `Extract all functions, classes, interfaces, types, and constants from a source file.

Returns: symbol name, kind, line number, and whether it is exported.
Supports: TypeScript, JavaScript, Python, Rust, Go, Java, Kotlin, C, C++

USE THIS to:
- Understand a file's public API before editing it
- Find where a specific function/class is defined (line number)
- Get an overview of a large file without reading every line
- Plan edits: know what exists before adding or removing code`,

  parameters: z.object({
    path:         z.string().describe("Path to the source file (absolute or relative to workdir)"),
    show_private: z.boolean().optional().default(false)
      .describe("Also include non-exported symbols (default: false)"),
    kind_filter:  z.array(z.string()).optional()
      .describe("Only return these kinds: function, class, interface, type, const, enum, struct, trait"),
  }),

  async execute(args, ctx: ToolContext): Promise<ExecuteResult> {
    const rawPath    = String(args["path"] ?? "")
    const showPri    = Boolean(args["show_private"])
    const kindFilter = args["kind_filter"] as string[] | undefined

    if (!rawPath) return { output: "", error: "path is required" }

    const absPath = rawPath.startsWith("/") ? rawPath : resolve(ctx.workdir, rawPath)
    const result  = await extractSymbols(absPath)

    if (result.error) return { output: "", error: result.error }

    let symbols = result.symbols
    if (!showPri)     symbols = symbols.filter(s => s.exported)
    if (kindFilter?.length) symbols = symbols.filter(s => kindFilter.includes(s.kind))

    if (symbols.length === 0) {
      return { output: `No${!showPri ? " exported" : ""} symbols found in ${rawPath} (language: ${result.language})` }
    }

    const lines: string[] = [
      `${rawPath}  [${result.language}]  ${symbols.length} symbol(s)`,
      "",
    ]

    const COL_NAME = 28
    const COL_KIND = 12
    lines.push(`${"NAME".padEnd(COL_NAME)} ${"KIND".padEnd(COL_KIND)} LINE  EXPORTED`)
    lines.push(`${"─".repeat(COL_NAME)} ${"─".repeat(COL_KIND)} ────  ────────`)

    for (const s of symbols) {
      const exported = s.exported ? "✓" : " "
      lines.push(`${s.name.padEnd(COL_NAME)} ${s.kind.padEnd(COL_KIND)} ${String(s.line).padStart(4)}  ${exported}`)
    }

    return { output: lines.join("\n") }
  },
}
