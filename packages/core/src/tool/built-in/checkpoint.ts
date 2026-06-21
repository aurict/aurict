/**
 * checkpoint — Çok adımlı görev ilerleme takibi.
 *
 * scratchpad'den farklı: hypothesis değil ADIM LİSTESİ tutar.
 * Context compaction olsa bile persist kalır (~/.aurict/checkpoints.json).
 * >4 adımlı her görevde kullanılmalı.
 */

import { z }                  from "zod"
import { checkpointStore }    from "../../task/checkpoint-store.js"
import type { ToolDef, ToolContext, ExecuteResult } from "../types.js"

export const checkpointTool: ToolDef = {
  id: "checkpoint",
  description:
    "Track multi-step task progress. Persists across context compaction.\n\n" +
    "Unlike scratchpad (which tracks hypothesis/evidence), checkpoint tracks WHAT YOU'VE DONE.\n" +
    "Survives context compaction — always readable even after a long conversation.\n\n" +
    "ACTIONS:\n" +
    "  create  — Start a new checkpoint with an ID, title, and list of step labels\n" +
    "  tick    — Mark a step as done (optionally add a result note)\n" +
    "  skip    — Mark a step as skipped (provide reason)\n" +
    "  fail    — Mark a step as failed (provide reason)\n" +
    "  read    — Read progress of a specific checkpoint\n" +
    "  list    — List all active checkpoints this session\n" +
    "  clear   — Remove a checkpoint when fully done\n\n" +
    "STEP IDENTIFICATION:\n" +
    "  Use 'step-1', 'step-2'… (auto-assigned) or the beginning of the step label.\n\n" +
    "WHEN TO USE:\n" +
    "  - Task has >4 distinct steps → create at start\n" +
    "  - After completing each step → tick\n" +
    "  - Lost track after compaction → read to resume\n" +
    "  - Task fully complete → clear\n\n" +
    "EXAMPLE:\n" +
    "  create: id='refactor-auth', title='Refactor auth module',\n" +
    "          steps=['audit: read all files in src/auth/', 'types: update interfaces',\n" +
    "                 'impl: rewrite middleware', 'tests: update tests', 'docs: update README']\n" +
    "  tick:   id='refactor-auth', step='step-1', note='Found 3 files, token validation is central'\n" +
    "  read:   id='refactor-auth'  → shows full progress with current step highlighted",

  parameters: z.object({
    action: z.enum(["create", "tick", "skip", "fail", "read", "list", "clear"])
              .describe("Action to perform"),
    id:     z.string().optional()
              .describe("Checkpoint ID — short snake_case name (e.g. 'refactor-auth'). Required for all except 'list'."),
    title:  z.string().optional()
              .describe("Human-readable task description (for 'create')"),
    steps:  z.array(z.string()).optional()
              .describe("List of step labels for 'create'. Format: 'step-name: description' (e.g. 'audit: read all files')"),
    step:   z.string().optional()
              .describe("Step ID (step-1, step-2…) or beginning of step label (for tick/skip/fail)"),
    note:   z.string().optional()
              .describe("Result note for 'tick', or reason for 'skip'/'fail'"),
  }),

  async execute(args, ctx: ToolContext): Promise<ExecuteResult> {
    const action    = String(args["action"])
    const sessionId = ctx.sessionId ?? "main"
    const id        = args["id"]   ? String(args["id"])   : undefined
    const step      = args["step"] ? String(args["step"]) : undefined
    const note      = args["note"] ? String(args["note"]) : undefined

    try {
      // ── create ────────────────────────────────────────────────────────────────
      if (action === "create") {
        if (!id)    return { output: "", error: "id is required for create" }
        if (!args["title"]) return { output: "", error: "title is required for create" }
        const rawSteps = (args["steps"] as string[] | undefined) ?? []
        if (rawSteps.length === 0) return { output: "", error: "steps array is required and must not be empty" }

        const entry = checkpointStore.create(id, String(args["title"]), rawSteps, sessionId)
        return {
          output: [
            `Checkpoint created: '${entry.id}'`,
            `Title: ${entry.title}`,
            `Steps: ${entry.steps.length}`,
            "",
            checkpointStore.format(entry),
            "",
            `Use tick(step='step-1', note='...') to mark steps done.`,
          ].join("\n"),
        }
      }

      // ── list ──────────────────────────────────────────────────────────────────
      if (action === "list") {
        const all = checkpointStore.readAll(sessionId)
        if (all.length === 0) {
          return { output: "(no active checkpoints this session)" }
        }
        const lines: string[] = [`Active checkpoints (${all.length}):\n`]
        for (const e of all) {
          const done  = e.steps.filter((s) => s.status === "done").length
          const total = e.steps.length
          const pct   = total > 0 ? Math.round((done / total) * 100) : 0
          lines.push(`  ${e.id.padEnd(20)} "${e.title}"  ${done}/${total} (${pct}%)`)
        }
        lines.push(`\nUse read(id='...') for full progress of any checkpoint.`)
        return { output: lines.join("\n") }
      }

      // Kalan actionlar için id gerekli
      if (!id) return { output: "", error: `id is required for action '${action}'` }

      // ── read ──────────────────────────────────────────────────────────────────
      if (action === "read") {
        const entry = checkpointStore.read(id, sessionId)
        if (!entry) return { output: `Checkpoint '${id}' not found. Create it first or check the ID with action='list'.` }
        return { output: checkpointStore.format(entry) }
      }

      // ── clear ─────────────────────────────────────────────────────────────────
      if (action === "clear") {
        const ok = checkpointStore.clear(id, sessionId)
        return ok
          ? { output: `Checkpoint '${id}' cleared.` }
          : { output: "", error: `Checkpoint '${id}' not found.` }
      }

      // ── tick / skip / fail ────────────────────────────────────────────────────
      if (action === "tick" || action === "skip" || action === "fail") {
        if (!step) return { output: "", error: `step is required for action '${action}'` }

        let entry
        if (action === "tick") {
          entry = checkpointStore.tick(id, step, note, sessionId)
        } else {
          const status = action === "skip" ? "skipped" : "failed"
          entry = checkpointStore.markStep(id, step, status, note, sessionId)
        }

        // Tüm adımlar tamamlandı mı?
        const allDone = entry.steps.every((s) => s.status === "done" || s.status === "skipped")
        const suffix  = allDone
          ? "\n\n✓ All steps complete. Use clear(id='...') to remove this checkpoint."
          : ""

        return { output: checkpointStore.format(entry) + suffix }
      }

      return { output: "", error: `Unknown action: ${action}` }

    } catch (err) {
      return { output: "", error: err instanceof Error ? err.message : String(err) }
    }
  },
}
