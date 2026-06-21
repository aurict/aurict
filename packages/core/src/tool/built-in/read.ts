import { z } from "zod"
import { readFile } from "fs/promises"
import { resolve, dirname } from "path"
import type { ToolDef, ToolContext, ExecuteResult } from "../types.js"
import { semanticCache } from "../semantic-cache.js"

const MAX_CHARS = 100_000

export const readTool: ToolDef = {
  id:   "read",
  spec: { category: "read", riskLevel: "low" },
  description: "Read the contents of a file. Returns the file content as text.",
  parameters:  z.object({
    path:   z.string().describe("Absolute or relative path to the file"),
    offset: z.number().optional().describe("Line number to start reading from (1-based)"),
    limit:  z.number().optional().describe("Maximum number of lines to read"),
  }),
  async execute(args, ctx: ToolContext): Promise<ExecuteResult> {
    const filePath = resolve(ctx.workdir, String(args["path"] ?? ""))
    let content: string | null = await semanticCache.get<string>(filePath)
    
    if (content === null) {
      try {
        content = await readFile(filePath, "utf8")
        await semanticCache.set(filePath, content, content)
      } catch (err) {
        return { output: "", error: `Cannot read file: ${err}` }
      }
    }

    // Bağımlılıkları arka planda ön getir (prefetch)
    semanticCache.triggerPrefetch(filePath, dirname(filePath)).catch(() => {})

    const lines  = content.split("\n")
    const offset = typeof args["offset"] === "number" ? args["offset"] - 1 : 0
    const limit  = typeof args["limit"]  === "number" ? args["limit"]      : lines.length

    const slice  = lines.slice(offset, offset + limit)
    const result = slice
      .map((line, i) => `${offset + i + 1}\t${line}`)
      .join("\n")
      .slice(0, MAX_CHARS)

    return { output: result || "(empty file)" }
  },
}
