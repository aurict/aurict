import { z } from "zod"
import { scratchpadStore } from "../../scratchpad/store.js"
import type { ToolDef, ToolContext, ExecuteResult } from "../types.js"

export const scratchpadTool: ToolDef = {
  id: "scratchpad",
  description:
    "Maintain a persistent reasoning scratchpad that survives context compaction.\n\n" +
    "Use to track your current hypothesis, evidence, confidence, and next step during\n" +
    "complex multi-step tasks. This is your working memory — keep it accurate.\n\n" +
    "Actions:\n" +
    "- update: Update one or more fields (partial update — unset fields are preserved)\n" +
    "- read:   Read current scratchpad state\n" +
    "- clear:  Reset the scratchpad (use when starting a new unrelated task)\n\n" +
    "When to use:\n" +
    "- Starting a complex task (>5 steps): set initial hypothesis\n" +
    "- After a significant finding: update evidence_for or evidence_against\n" +
    "- Confidence changes: update confidence\n" +
    "- Stuck: add to blockers and set next_step\n\n" +
    "When confidence is 'low' AND evidence_against is growing: stop and report the blocker\n" +
    "rather than continuing blindly.",

  parameters: z.object({
    action: z.enum(["update", "read", "clear"])
              .describe("Action to perform"),
    hypothesis: z.string().optional()
                  .describe("Your current best explanation of what's happening or what needs to be done"),
    evidence_for: z.array(z.string()).optional()
                    .describe("Findings that support the hypothesis"),
    evidence_against: z.array(z.string()).optional()
                        .describe("Findings that contradict the hypothesis"),
    confidence: z.enum(["low", "medium", "high"]).optional()
                  .describe("How confident you are in the current hypothesis"),
    assumptions: z.array(z.string()).optional()
                   .describe("Things you're assuming without direct evidence"),
    blockers: z.array(z.string()).optional()
                .describe("What's preventing progress"),
    next_step: z.string().optional()
                 .describe("The single next concrete action to take"),
  }),

  async execute(args, ctx: ToolContext): Promise<ExecuteResult> {
    const action    = String(args["action"])
    const sessionId = ctx.sessionId ?? "main"

    if (action === "read") {
      const state = scratchpadStore.read(sessionId, ctx.workdir)
      if (!state || !state.hypothesis) {
        return { output: "(scratchpad is empty)" }
      }
      return { output: scratchpadStore.toPromptSection(state) }
    }

    if (action === "clear") {
      scratchpadStore.clear(sessionId, ctx.workdir)
      return { output: "Scratchpad cleared." }
    }

    if (action === "update") {
      const patch: Record<string, unknown> = {}

      if (args["hypothesis"]       !== undefined) patch["hypothesis"]  = String(args["hypothesis"])
      if (args["confidence"]       !== undefined) patch["confidence"]  = String(args["confidence"])
      if (args["next_step"]        !== undefined) patch["nextStep"]    = String(args["next_step"])
      if (args["evidence_for"] !== undefined || args["evidence_against"] !== undefined) {
        // Her iki tarafı mevcut state'ten oku — sadece gelen tarafı override et
        const current = scratchpadStore.read(sessionId, ctx.workdir)
        patch["evidence"] = {
          for:     args["evidence_for"]     !== undefined
                     ? args["evidence_for"] as string[]
                     : (current?.evidence.for ?? []),
          against: args["evidence_against"] !== undefined
                     ? args["evidence_against"] as string[]
                     : (current?.evidence.against ?? []),
        }
      }
      if (args["assumptions"] !== undefined) patch["assumptions"] = args["assumptions"] as string[]
      if (args["blockers"]    !== undefined) patch["blockers"]    = args["blockers"]    as string[]

      if (Object.keys(patch).length === 0) {
        return { output: "", error: "No fields to update — provide at least one field." }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updated = scratchpadStore.update(sessionId, ctx.workdir, patch as any)
      return { output: scratchpadStore.toPromptSection(updated) }
    }

    return { output: "", error: `Unknown action: ${action}` }
  },
}
