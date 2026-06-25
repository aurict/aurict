import { z } from "zod"
import { agentPool, PoolFullError } from "../../agent/pool.js"
import { AGENT_TYPE_TOOLS, AGENT_MAX_STEPS } from "../../agent/protocol.js"
import { getAgentPrompt } from "../../agent/agent-prompts.js"
import { SessionManager } from "../../session/manager.js"
import type { AgentType } from "../../agent/protocol.js"
import type { Part } from "../../session/types.js"
import type { ToolDef, ToolContext, ExecuteResult } from "../types.js"

const AGENT_TYPES = Object.keys(AGENT_TYPE_TOOLS) as [AgentType, ...AgentType[]]

function buildParentContext(parts: Part[]): string {
  const relevant = parts.filter(
    (p) => (p.role === "user" || p.role === "assistant") && p.type === "text" && p.content.trim(),
  )
  if (relevant.length === 0) return ""
  return relevant
    .map((p) => {
      const label   = p.role === "user" ? "User" : "Assistant"
      const snippet = p.content.length > 400 ? p.content.slice(0, 400) + "…" : p.content
      return `${label}: ${snippet}`
    })
    .join("\n\n")
}

function formatResult(role: string, type: string, result: string, durationMs: number): string {
  const secs = (durationMs / 1000).toFixed(1)
  return `<subagent-result role="${role}" type="${type}" duration="${secs}s">\n${result}\n</subagent-result>`
}

export const subagentTool: ToolDef = {
  id: "subagent",
  timeoutMs: 600_000,
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
- security:    read, glob, grep, bash, webfetch, websearch, lsp  (security audit + active scanning)
- pentest:     read, glob, grep, bash, webfetch, websearch, write  (active penetration testing, exploit validation)
- adviser:     read, glob, grep, webfetch, websearch  (security strategy — no execution, planning only)
- reporter:    read, write  (security report generation from findings)
- debug:       read, glob, grep, bash, lsp  (debugging)

The subagent receives recent parent conversation context automatically.
Focus your prompt on the specific task — no need to repeat what was already discussed.`,

  parameters: z.object({
    type:   z.enum(AGENT_TYPES)
              .default("explore")
              .describe("Agent type — determines which tools the worker can use"),
    role:   z.string().describe("Brief worker title, e.g. 'Codebase Scanner', 'Test Runner', 'Code Reviewer'"),
    prompt: z.string().describe("Task instructions. Include: goal, relevant file paths or patterns, expected output format."),
  }),

  async execute(args, ctx: ToolContext): Promise<ExecuteResult> {
    const { role, prompt } = args as { role: string; prompt: string }
    const agentType = ((args as Record<string, unknown>)["type"] as AgentType | undefined) ?? "explore"
    const allowedTools = AGENT_TYPE_TOOLS[agentType]

    const provider  = ctx.provider ?? (process.env["ANTHROPIC_API_KEY"] ? "anthropic" : "opencode")
    const model     = ctx.model ?? undefined
    const sessionId = ctx.sessionId ?? "main"

    const recentParts   = SessionManager.getPartsTail(sessionId, 12)
    const parentContext = buildParentContext(recentParts)

    const id = `subagent-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const startMs = Date.now()

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
        workerSessionId: `${id}-session`,
        allowedTools,
        ...(parentContext ? { parentContext } : {}),
      })

      return { output: formatResult(role, agentType, result, Date.now() - startMs) }
    } catch (err) {
      if (err instanceof PoolFullError) {
        const { runAgent } = await import("../../agent/loop.js")
        const r = await runAgent({
          provider,
          ...(model !== undefined ? { model } : {}),
          workdir:  ctx.workdir,
          system:   getAgentPrompt(agentType, AGENT_MAX_STEPS[agentType]),
          messages: [{ role: "user", content: prompt }],
        })
        return { output: formatResult(role, agentType, r.text, Date.now() - startMs) }
      }
      const msg = err instanceof Error ? err.message : String(err)
      return { output: "", error: `Subagent [${role}] failed: ${msg}` }
    }
  },
}
