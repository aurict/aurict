import { z } from "zod"
import type { ToolCapability } from "../capability-router.js"
import type { ExecuteResult, ToolContext, ToolDef } from "../types.js"

const CAPABILITIES = [
  "inspect", "change", "execute", "verify", "research", "coordinate",
  "memory", "document", "source_control", "security", "finance", "data",
] as const satisfies readonly ToolCapability[]

export const requestToolsTool: ToolDef = {
  id: "request_tools",
  description: "Request an omitted tool capability for the next continuation step when the current routed tool set cannot complete the task.",
  parameters: z.object({
    capabilities: z.array(z.enum(CAPABILITIES)).min(1).max(4),
    reason: z.string().min(3).max(300),
  }),
  async execute(args, ctx: ToolContext): Promise<ExecuteResult> {
    const requested = args["capabilities"] as ToolCapability[]
    if (!ctx.taskContext) return { output: "", error: "Tool expansion requires an active task context" }
    ctx.taskContext.requestedCapabilities = [...new Set([
      ...(ctx.taskContext.requestedCapabilities ?? []),
      ...requested,
    ])]
    return {
      output: `Capability request recorded: ${requested.join(", ")}. End this step with continuing status so Aurict can expose the tools on the next continuation.`,
    }
  },
}
