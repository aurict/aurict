import { z } from "zod"
import { runStatelessEval } from "../eval/runtime.js"
import type { ToolDef } from "../types.js"

export const evalTool: ToolDef = {
  id: "eval",
  timeoutMs: 40_000,
  description: `Execute a small, stateless Bun/Node/Python experiment without creating a source file.

Use to validate regexes, parsers, arithmetic, and isolated hypotheses. Default
cwd=temp prevents accidental workspace litter. Set cwd=workspace only when the
experiment must import installed project code. No state survives the call.`,
  parameters: z.object({
    runtime: z.enum(["bun", "node", "python"]),
    code: z.string().min(1).max(100_000),
    stdin: z.string().max(100_000).optional(),
    timeout_ms: z.number().int().min(100).max(30_000).default(5_000),
    cwd: z.enum(["temp", "workspace"]).default("temp"),
  }),
  spec: {
    category: "execute",
    riskLevel: "high",
    requiresConfirmation: true,
    permissionSummary: "Execute stateless code in a scrubbed local process",
  },
  async execute(args, ctx) {
    try {
      const result = await runStatelessEval({
        runtime: args["runtime"] as "bun" | "node" | "python",
        code: String(args["code"]),
        timeoutMs: Number(args["timeout_ms"] ?? 5_000),
        cwd: args["cwd"] as "temp" | "workspace",
        ...(args["stdin"] !== undefined ? { stdin: String(args["stdin"]) } : {}),
      }, ctx.workdir, ctx.signal)
      if (result.timedOut) return { output: JSON.stringify(result, null, 2), error: `Eval timed out after ${result.durationMs}ms` }
      if (result.exitCode !== 0) return { output: JSON.stringify(result, null, 2), error: `Eval exited with code ${result.exitCode}` }
      return { output: JSON.stringify(result, null, 2) }
    } catch (error) {
      return { output: "", error: error instanceof Error ? error.message : String(error) }
    }
  },
}
