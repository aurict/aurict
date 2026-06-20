import { z } from "zod"
import { join } from "path"
import { writeFile } from "node:fs/promises"
import { agentPool } from "../../agent/pool.js"
import { AGENT_TYPE_TOOLS } from "../../agent/protocol.js"
import { getAgentPrompt } from "../../agent/agent-prompts.js"
import { ensureWorkspace } from "../../agent/workspace.js"
import type { AgentType } from "../../agent/protocol.js"
import type { ToolDef, ToolContext, ExecuteResult } from "../types.js"

const AGENT_TYPES = Object.keys(AGENT_TYPE_TOOLS) as [AgentType, ...AgentType[]]

/** "Global Gaming VC Researcher" → "global-gaming-vc-researcher" */
function roleSlug(role: string): string {
  return role.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 60)
}

/**
 * Subagent sonucunu workspace'e yazar.
 * LLM'in write çağırıp çağırmadığından bağımsız — her zaman garantili.
 * Dosya adı role slug'ından türetilir: iki aynı-tip agent çakışmaz.
 */
async function persistToWorkspace(
  workdir:   string,
  sessionId: string,
  role:      string,
  result:    string,
): Promise<string> {
  const wsDir   = ensureWorkspace(workdir, sessionId)
  const slug    = roleSlug(role)
  const outPath = join(wsDir, `${slug}.md`)
  await writeFile(outPath, `# ${role}\n\n${result}\n`, "utf8")
  return outPath
}

export const subagentTool: ToolDef = {
  id: "subagent",
  timeoutMs: 600_000,  // 10 min — pool's own WORKER_TIMEOUT is 5 min, this gives safe headroom
  description: `Spawn a parallel worker agent to perform a specific task.

WHEN TO USE:
- Scanning/searching a large codebase (always delegate this)
- Research that can run independently while you plan
- Long file operations (read + analyze + summarize many files)
- Parallel tasks: spawn multiple subagents simultaneously for independent work
- Any task that would take >5 tool calls and doesn't need your direct attention

DO NOT USE FOR:
- Simple single tool calls (use bash/read/edit directly)
- Tasks that need results from a previous subagent (await them in order)
- Short tasks (<3 steps)

Agent types and their tools:
- explore:     read, glob, grep, webfetch, websearch  (read-only research)
- code:        read, write, edit, apply_patch, glob, grep, bash, lsp, undo  (full coding)
- review:      read, glob, grep, lsp  (code review + diagnostics)
- test:        read, glob, grep, bash  (run tests, check results)
- docs:        read, write, edit, glob, grep  (documentation)
- performance: read, glob, grep, bash  (profiling, bundle analysis)
- security:    read, glob, grep, lsp  (security scanning)
- debug:       read, glob, grep, bash, lsp  (debugging)

The subagent CANNOT see your conversation history — include ALL needed context in the prompt.
Write the prompt as if the subagent has never seen this codebase before.`,

  parameters: z.object({
    type:   z.enum(AGENT_TYPES)
              .default("explore")
              .describe("Agent type — determines which tools the worker can use"),
    role:   z.string().describe("Brief worker title, e.g. 'Codebase Scanner', 'Test Runner', 'Code Reviewer'"),
    prompt: z.string().describe("Complete, self-contained instructions. Include: goal, relevant file paths or patterns, expected output format."),
  }),

  async execute(args, ctx: ToolContext): Promise<ExecuteResult> {
    const { role, prompt } = args as { role: string; prompt: string }
    const agentType = ((args as Record<string, unknown>)["type"] as AgentType | undefined) ?? "explore"
    const allowedTools = AGENT_TYPE_TOOLS[agentType]

    const provider  = ctx.provider ?? (process.env["ANTHROPIC_API_KEY"] ? "anthropic" : "opencode")
    const model     = ctx.model ?? undefined
    const sessionId = ctx.sessionId ?? "main"

    const id      = `subagent-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const session = `${id}-session`

    try {
      const result = await agentPool.spawn({
        id,
        agentType,
        desc:            role,
        prompt,
        provider,
        model:           model ?? "claude-sonnet-4-6",
        workdir:         ctx.workdir,
        sessionId,
        workerSessionId: session,
        allowedTools,
      })

      // Sonucu dosyaya sessizce yaz — uzun oturumlarda context compaction sigortası.
      // LLM'e dosya yolu söylenmiyor: koordinatör direkt context'teki sonucu kullanır.
      persistToWorkspace(ctx.workdir, sessionId, role, result).catch(() => {})

      return {
        output: `Subagent [${role}] completed:\n\n${result}`,
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      // Pool dolu ise fallback: runAgent direkt
      if (msg.includes("dolu") || msg.includes("max")) {
        const { runAgent } = await import("../../agent/loop.js")
        const r = await runAgent({
          provider,
          ...(model !== undefined ? { model } : {}),
          workdir:  ctx.workdir,
          system:   getAgentPrompt(agentType),
          messages: [{ role: "user", content: prompt }],
        })
        try {
          await persistToWorkspace(ctx.workdir, sessionId, role, r.text)
        } catch { /* ignore */ }
        return { output: `Subagent [${role}] (direct):\n\n${r.text}` }
      }
      return { output: "", error: `Subagent [${role}] failed: ${msg}` }
    }
  },
}
