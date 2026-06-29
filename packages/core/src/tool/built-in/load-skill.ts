import { z } from "zod"
import { SkillRegistry } from "../../skill/registry.js"
import { parseFrontmatter } from "../../skill/frontmatter.js"
import type { ToolDef, ToolContext, ExecuteResult } from "../types.js"
import { readFile } from "node:fs/promises"
import { existsSync } from "node:fs"
import { join } from "node:path"
import { getSkillLifecycleSnapshot, normalizeToolName, popActiveSkillPolicy, pushActiveSkillPolicy } from "../../skill/runtime-policy.js"
import { loadConfig } from "../../config/config.js"
import { filterSkillDefsForSecurityCapability, isSkillVisibleForSecurityCapability } from "../../security/capability.js"

export const loadSkillTool: ToolDef = {
  id: "load_skill",
  description: `Load a skill's full instructions into your context on demand.

WHEN TO USE:
- You need specialized knowledge not yet in your context (PDF design, legal writing, HR templates, etc.)
- You are about to produce a professional artifact (report, pitch deck, resume, etc.) and want the exact style guide
- You recognize a task requires domain-specific patterns you don't have memorized

HOW TO USE:
1. Call load_skill with the skill ID (e.g. "professional-report-design", "resume-builder")
2. Read the returned instructions carefully
3. Follow them precisely for the task at hand
4. When the specialized work is complete, call load_skill with skill_id "exit"

AVAILABLE SKILL CATEGORIES (use /skills to see all loaded skills):
- Documents/PDF: professional-report-design, html-to-pdf, pptx-generation
- Writing: proposal-writer, resume-builder, speech-writer, cold-email-writer
- Legal: contract-analyzer, nda-drafter, privacy-policy-generator
- Finance: invoice-generator, budget-planner, financial-forecaster
- HR: job-description-writer, performance-review-generator, interview-prep
- Education: flashcard-maker, quiz-generator, syllabus-designer
- Marketing: ad-campaign-generator, copywriting-frameworks, social-media-manager
- Research: market-researcher, seo-keyword-researcher
- PM: okr-tracker, sprint-planner, risk-assessor

If you don't know the exact skill ID, use a close match — the tool will find it.`,

  parameters: z.object({
    skill_id: z.string().describe("Skill ID to load, e.g. 'professional-report-design'"),
    task: z.string().optional().describe("Optional concrete task. If the skill is marked context: fork, Aurict can execute it in an isolated worker run."),
  }),

  async execute(args, ctx: ToolContext): Promise<ExecuteResult> {
    const id = String(args["skill_id"] ?? "").trim().toLowerCase()
    const task = String(args["task"] ?? "").trim()
    const cfg = loadConfig(ctx.workdir)
    if (!id) return { output: "", error: "skill_id is required" }
    if (id === "exit" || id === "skill_exit") {
      const popped = popActiveSkillPolicy(ctx.sessionId)
      const snapshot = getSkillLifecycleSnapshot(ctx.sessionId)
      return {
        output: popped
          ? [
              `# Skill Exited: ${popped.skillName}`,
              snapshot.active ? `Active skill restored: ${snapshot.active.skillName}` : "No active skill remains.",
            ].join("\n\n")
          : "No active skill to exit.",
      }
    }

    // Exact match first
    let def = SkillRegistry.get(id)
    let contentPath = def?.contentPath
    let displayName = def?.name ?? id
    let registryPolicy = def

    // Fuzzy fallback: find skill whose ID contains the query or vice versa
    if (!def) {
      const all = filterSkillDefsForSecurityCapability(SkillRegistry.all(), cfg)
      def = all.find(s => s.id.includes(id) || id.includes(s.id))
      contentPath = def?.contentPath
      displayName = def?.name ?? id
      registryPolicy = def
    }

    if (!contentPath) {
      const projectCustom = resolveProjectCustomSkill(ctx.workdir, id)
      if (projectCustom) {
        contentPath = projectCustom.contentPath
        displayName = projectCustom.name
      }
    }

    if (!contentPath) {
      const all = filterSkillDefsForSecurityCapability(SkillRegistry.all(), cfg)
      const ids = all.map(s => s.id).slice(0, 30).join(", ")
      return { output: "", error: `Skill '${id}' not found. Sample IDs: ${ids}` }
    }

    if (registryPolicy && !isSkillVisibleForSecurityCapability(registryPolicy, cfg)) {
      return { output: "", error: `Skill '${registryPolicy.id}' is unavailable because the security capability profile is disabled.` }
    }

    try {
      const content = await readFile(contentPath, "utf8")
      const { meta, body } = parseFrontmatter(content)
      const disableModelInvocation = parseBoolean(meta["disable-model-invocation"]) || registryPolicy?.disableModelInvocation === true
      if (disableModelInvocation) {
        return { output: "", error: `Skill '${id}' cannot be loaded by the model because disable-model-invocation is enabled.` }
      }

      const allowedTools = asStringArray(meta["allowed-tools"] ?? meta.tools ?? registryPolicy?.allowedTools)
      const context = meta.context === "fork" || registryPolicy?.executionContext === "fork" ? "fork" : "inline"
      const before = getSkillLifecycleSnapshot(ctx.sessionId)
      const lifecycle = pushActiveSkillPolicy(ctx.sessionId, {
        skillId: registryPolicy?.id ?? id,
        skillName: displayName,
        allowedTools,
        executionContext: context,
        ...(meta.model ?? registryPolicy?.model ? { model: meta.model ?? registryPolicy?.model } : {}),
        ...(meta.effort ?? registryPolicy?.effort ? { effort: meta.effort ?? registryPolicy?.effort } : {}),
      })

      const policy = formatPolicy({
        allowedTools,
        context,
        model: meta.model ?? registryPolicy?.model,
        effort: meta.effort ?? registryPolicy?.effort,
        userInvocable: parseBoolean(meta["user-invocable"], registryPolicy?.userInvocable ?? true),
      })

      if (context === "fork" && task) {
        const { runAgent } = await import("../../agent/loop.js")
        const allowed = allowedTools.map(normalizeToolName).filter(Boolean)
        const forkModel = meta.model ?? registryPolicy?.model ?? ctx.model
        const result = await runAgent({
          ...(ctx.provider ? { provider: ctx.provider } : {}),
          ...(forkModel ? { model: forkModel } : {}),
          workdir: ctx.workdir,
          sessionId: `${ctx.sessionId}:skill:${registryPolicy?.id ?? id}`,
          system: [
            `You are executing the Aurict skill "${displayName}" in an isolated forked context.`,
            policy,
            body.trim(),
          ].filter(Boolean).join("\n\n"),
          messages: [{ role: "user", content: task }],
          stream: false,
          ...(allowed.length > 0 ? { toolsOverride: allowed } : {}),
        })

        return {
          output: [
            `# Forked Skill Result: ${displayName}`,
            result.text,
          ].join("\n\n"),
        }
      }

      return {
        output: [
          `# Skill Loaded: ${displayName}`,
          before.active ? `## Nested Skill\nPrevious active skill: ${before.active.skillName}. Call load_skill("exit") to return to it.` : "",
          lifecycle.stack.length > 1 ? `Skill stack depth: ${lifecycle.stack.length}` : "",
          context === "fork"
            ? "## Fork Required\nThis skill is marked `context: fork`. Provide a concrete `task` to load_skill so Aurict can execute it in an isolated fork, or delegate with the subagent tool. Avoid copying the full skill instructions into the main conversation."
            : "",
          policy,
          body.trim(),
        ].filter(Boolean).join("\n\n"),
      }
    } catch {
      return { output: "", error: `Could not read skill file for '${id}'` }
    }
  },
}

function resolveProjectCustomSkill(workdir: string, id: string): { name: string; contentPath: string } | null {
  const normalized = id.startsWith("custom:") ? id.slice("custom:".length) : id
  const candidates = [
    join(workdir, ".aurict", "skills", `${normalized}.md`),
    join(workdir, ".aurict", "skills", `${id}.md`),
  ]
  for (const contentPath of candidates) {
    if (existsSync(contentPath)) return { name: normalized, contentPath }
  }
  return null
}

function asStringArray(value: string[] | string | undefined): string[] {
  if (Array.isArray(value)) return value
  if (!value) return []
  return value.split(",").map((item) => item.trim()).filter(Boolean)
}

function parseBoolean(value: boolean | string | undefined, fallback = false): boolean {
  if (typeof value === "boolean") return value
  if (typeof value !== "string") return fallback
  const normalized = value.trim().toLowerCase()
  if (["true", "yes", "1", "on"].includes(normalized)) return true
  if (["false", "no", "0", "off"].includes(normalized)) return false
  return fallback
}

function formatPolicy(policy: {
  allowedTools: string[]
  context: string
  model?: string | undefined
  effort?: string | undefined
  userInvocable: boolean
}): string {
  const lines = [
    `Execution context: ${policy.context === "fork" ? "forked sub-agent preferred" : "inline main conversation"}`,
    policy.allowedTools.length ? "Runtime enforcement: only listed tools are allowed after loading this skill" : "",
    policy.allowedTools.length ? `Allowed tools: ${policy.allowedTools.join(", ")}` : "",
    policy.model ? `Model override: ${policy.model}` : "",
    policy.effort ? `Effort: ${policy.effort}` : "",
    policy.userInvocable === false ? "Visibility: hidden from direct user invocation" : "",
  ].filter(Boolean)
  return lines.length ? `## Skill Policy\n${lines.map(line => `- ${line}`).join("\n")}` : ""
}
