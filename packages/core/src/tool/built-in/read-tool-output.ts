import { z } from "zod"
import { readToolOutputArtifact } from "../output-artifacts.js"
import type { ToolDef } from "../types.js"

export const readToolOutputTool: ToolDef = {
  id: "read_tool_output",
  spec: { category: "read", riskLevel: "low" },
  description: "Continue reading a truncated tool result by its handle and character offset.",
  parameters: z.object({
    handle: z.string().describe("The tool-output:<sha256> handle from a truncated result"),
    offset: z.number().int().nonnegative().optional().describe("Character offset to continue from (default 0)"),
    limit: z.number().int().positive().max(50_000).optional().describe("Maximum characters to return (default 16000)"),
  }),
  async execute(args, ctx) {
    try {
      const slice = await readToolOutputArtifact({
        workdir: ctx.workdir,
        sessionId: ctx.sessionId,
        handle: String(args["handle"] ?? ""),
        ...(typeof args["offset"] === "number" ? { offset: args["offset"] } : {}),
        ...(typeof args["limit"] === "number" ? { limit: args["limit"] } : {}),
      })
      const continuation = slice.nextOffset === null
        ? `[end of tool output · ${slice.totalChars} chars]`
        : `[continue with offset=${slice.nextOffset} · ${slice.totalChars} chars total]`
      return { output: `${slice.content}\n\n${continuation}` }
    } catch (error) {
      return { output: "", error: `Cannot read tool output: ${error instanceof Error ? error.message : String(error)}` }
    }
  },
}
