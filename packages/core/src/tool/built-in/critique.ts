import { z } from "zod"
import { agentPool } from "../../agent/pool.js"
import { AGENT_TYPE_TOOLS } from "../../agent/protocol.js"
import type { ToolDef, ToolContext, ExecuteResult } from "../types.js"

// ── Loop prevention ───────────────────────────────────────────────────────────
// sessionId → toplam critique çağrısı sayısı
const critiqueCount = new Map<string, number>()
const MAX_CRITIQUE_PER_SESSION = 6  // session başına max

// task hash → bu görev için critique sayısı
const taskCritiqueCount = new Map<string, number>()
const MAX_CRITIQUE_PER_TASK = 2

function taskHash(context: string): string {
  // Basit string hash — crypto gerektirmez
  let h = 0
  for (let i = 0; i < Math.min(context.length, 256); i++) {
    h = Math.imul(31, h) + context.charCodeAt(i) | 0
  }
  return String(h >>> 0)
}

// ── Critic system prompts ─────────────────────────────────────────────────────

const CRITIC_PROMPTS: Record<string, string> = {
  code: `## Critic Agent — Code Review

You are a specialist critic reviewing code produced by another agent. Your job is to find
real problems, not to be exhaustive.

Rules:
- Read the code. Run LSP if needed. Check callers if needed.
- Every issue must reference a specific file and line if possible.
- Distinguish:
    CRITICAL — breaks correctness, security, or data integrity
    MAJOR    — significant quality/performance/reliability issue
    MINOR    — style, naming, small improvement opportunity
- List assumptions the author made that were NOT verified with evidence.
- End with a verdict: approve | approve_with_changes | reject

Do NOT implement fixes. Only identify issues.
If you find no real issues: say so clearly and approve.
Do not invent problems to appear thorough.

Output format:
## Issues
[SEVERITY] <description> — <file:line if known>

## Unchecked assumptions
- <assumption>

## Verdict
approve | approve_with_changes | reject

## One-line summary
<what the main concern is, or "no significant issues found">`,

  plan: `## Critic Agent — Plan Review

You are reviewing an execution plan before it is carried out.

Focus on:
- Are all edge cases considered?
- Are there missing steps that would leave the system in a broken state?
- Are there steps that should be done in a different order?
- What assumptions does the plan make that may be wrong?
- What could go wrong at each step?

Output format:
## Risks
[HIGH|MEDIUM|LOW] <risk> — <step it affects>

## Missing steps
- <step>

## Assumptions to verify
- <assumption>

## Verdict
approve | approve_with_changes | reject

## One-line summary
<main concern or "plan looks sound">`,

  architecture: `## Critic Agent — Architecture Review

You are reviewing an architectural decision or design.

Focus on:
- Does this create hidden coupling?
- Does this scale under realistic load?
- Are there security implications?
- Does this contradict existing patterns in the codebase?
- What is the migration/rollback path if this turns out to be wrong?

Read relevant files before forming opinions.

Output format:
## Concerns
[CRITICAL|HIGH|MEDIUM|LOW] <concern>

## Alternatives not considered
- <alternative> — why it might be better

## Verdict
approve | approve_with_changes | reject

## One-line summary
<main concern or "architecture is sound">`,

  security: `## Critic Agent — Security Review

You are a security reviewer with an offensive mindset. Find exploitable issues.

Review for:
- Input validation and sanitization gaps
- Authentication and authorization bypasses
- Injection vectors (SQL, command, path traversal, XSS)
- Secrets in code or logs
- Insecure defaults or configurations
- Missing rate limiting or abuse vectors

Read the code. Do not speculate — only report what you can trace to a specific code path.

Output format:
## Vulnerabilities
[CRITICAL|HIGH|MEDIUM|LOW] <vulnerability> — <file:line>
  Attack vector: <how it could be exploited>

## Verdict
approve | approve_with_changes | reject

## One-line summary
<main risk or "no exploitable issues found">`,
}

// ── Tool tanımı ───────────────────────────────────────────────────────────────

export const critiqueTool: ToolDef = {
  id: "critique",
  timeoutMs: 180_000,  // 3 min — review subagent may read many files
  description:
    "Spawn a specialist critic subagent to review code, plans, or architecture.\n\n" +
    "WHEN TO USE:\n" +
    "- Writing >50 lines of new code for a critical path\n" +
    "- Making architectural decisions affecting multiple modules\n" +
    "- Security-sensitive code (auth, crypto, user input, file I/O)\n" +
    "- A plan that will touch >5 files\n\n" +
    "DO NOT USE FOR:\n" +
    "- Simple edits, typo fixes, comment changes\n" +
    "- Code you already verified passes LSP and tests\n" +
    "- Already-reviewed code (max 2 critique rounds per task)\n\n" +
    "The critic CANNOT modify files — it only identifies issues.\n" +
    "After receiving a critique: address CRITICAL and MAJOR issues, then proceed.\n" +
    "A 'reject' verdict means: rework before continuing. 'approve_with_changes': fix noted issues.\n" +
    "'approve': proceed.",

  parameters: z.object({
    target: z.enum(["code", "plan", "architecture", "security"])
              .describe("What type of review to perform"),
    content: z.string()
               .describe("The content to review — code, plan text, or architecture description"),
    context: z.string()
               .describe("Original task and requirements — gives the critic the 'why' behind the content"),
  }),

  async execute(args, ctx: ToolContext): Promise<ExecuteResult> {
    const target  = String(args["target"]  ?? "code")
    const content = String(args["content"] ?? "")
    const context = String(args["context"] ?? "")
    const sid     = ctx.sessionId ?? "main"

    if (!content.trim()) {
      return { output: "", error: "content is required — provide the code, plan, or description to review." }
    }

    // ── Loop prevention ───────────────────────────────────────────────────────
    const sessionTotal = critiqueCount.get(sid) ?? 0
    if (sessionTotal >= MAX_CRITIQUE_PER_SESSION) {
      return {
        output: `[critique] Session critique limit reached (${MAX_CRITIQUE_PER_SESSION}). Proceeding with current solution.`,
      }
    }

    const tHash    = taskHash(context)
    const taskTotal = taskCritiqueCount.get(tHash) ?? 0
    if (taskTotal >= MAX_CRITIQUE_PER_TASK) {
      return {
        output: `[critique] This task has already been critiqued ${taskTotal} time(s) (max ${MAX_CRITIQUE_PER_TASK}). Proceeding with current solution.`,
      }
    }

    // Increment counters before spawn — prevents concurrent re-entry
    critiqueCount.set(sid, sessionTotal + 1)
    taskCritiqueCount.set(tHash, taskTotal + 1)

    const criticInstructions = CRITIC_PROMPTS[target] ?? CRITIC_PROMPTS["code"]!
    const criticPrompt = [
      criticInstructions,
      `## Task Context\n${context}`,
      `## Content to Review\n\`\`\`\n${content}\n\`\`\``,
      "\nReview the above content. Be specific. Reference file paths and line numbers where known.",
    ].join("\n\n")

    const provider = ctx.provider ?? (process.env["ANTHROPIC_API_KEY"] ? "anthropic" : "opencode")
    const model    = ctx.model ?? "claude-sonnet-4-6"

    try {
      const result = await agentPool.spawn({
        id:            `critic-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        agentType:     "critic",
        desc:          `Critic [${target}]`,
        prompt:        criticPrompt,
        provider,
        model,
        workdir:       ctx.workdir,
        sessionId:     sid,
        workerSessionId: `critic-${sid.slice(0, 8)}-${Date.now()}`,
        allowedTools:  AGENT_TYPE_TOOLS["critic"],
      })

      return { output: `[critique:${target}]\n\n${result}` }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      // Critic başarısız → main flow devam etsin, engel olmasın
      return {
        output: `[critique:${target}] Critic agent failed (${msg}). Proceeding without critique.`,
      }
    }
  },
}

// ── Session temizleme ─────────────────────────────────────────────────────────
// v1.session.end hook'unda counter'ları temizle — bellek sızıntısı önlemek için
import { hooks } from "../../hook/emitter.js"

hooks.on("v1.session.end", (payload) => {
  const sid = (payload as Record<string, unknown>)["sessionId"] as string | undefined
  if (sid) {
    critiqueCount.delete(sid)
    // taskCritiqueCount global hash bazlı — sessiz şekilde birikmesi OK (küçük)
  }
  return payload
})
