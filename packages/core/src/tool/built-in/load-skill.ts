import { z } from "zod"
import { SkillRegistry } from "../../skill/registry.js"
import type { ToolDef, ToolContext, ExecuteResult } from "../types.js"
import { readFile } from "node:fs/promises"

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
  }),

  async execute(args, _ctx: ToolContext): Promise<ExecuteResult> {
    const id = String(args["skill_id"] ?? "").trim().toLowerCase()
    if (!id) return { output: "", error: "skill_id is required" }

    // Exact match first
    let def = SkillRegistry.get(id)

    // Fuzzy fallback: find skill whose ID contains the query or vice versa
    if (!def) {
      const all = SkillRegistry.all()
      def = all.find(s => s.id.includes(id) || id.includes(s.id))
    }

    if (!def) {
      const all = SkillRegistry.all()
      const ids = all.map(s => s.id).slice(0, 30).join(", ")
      return { output: "", error: `Skill '${id}' not found. Sample IDs: ${ids}` }
    }

    try {
      const content = await readFile(def.contentPath, "utf8")
      // Strip YAML frontmatter — agent needs the instructions, not the metadata
      const body = content.startsWith("---")
        ? content.replace(/^---[\s\S]*?---\n?/, "").trim()
        : content.trim()

      return {
        output: `# Skill Loaded: ${def.name}\n\n${body}`,
      }
    } catch {
      return { output: "", error: `Could not read skill file for '${def.id}'` }
    }
  },
}
