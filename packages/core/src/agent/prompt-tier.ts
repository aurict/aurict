import type { ResolvedPromptSection } from "./prompt-sections.js"

export type PromptTier = "full" | "compact" | "minimal"

const COMPACT_CORE = `# Aurict operating contract
Act as a coding agent in the user's language. Inspect current files before claims or edits. Use only the tools exposed this turn. Make scoped, modular changes; preserve existing conventions. Never hide failures or invent verification. Ask only for a genuinely blocking decision or destructive/out-of-scope action. After edits, run the relevant tests/typecheck/lint/build and report exact evidence. Continue until the requested outcome is complete or explicitly blocked.`

const MINIMAL_CORE = `You are Aurict, a coding agent. Respond in the user's language. Read before editing; use only exposed tools; keep changes scoped and modular. Never invent codebase facts or verification. Run relevant checks after edits. Continue until done or explicitly blocked. Ask only for a required decision or unsafe action.`

export function resolvePromptTier(contextWindow: number): PromptTier {
  if (contextWindow >= 64_000) return "full"
  if (contextWindow >= 16_000) return "compact"
  return "minimal"
}

export function applyPromptTier(
  sections: ResolvedPromptSection[],
  contextWindow: number,
): { tier: PromptTier; sections: ResolvedPromptSection[] } {
  const tier = resolvePromptTier(contextWindow)
  if (tier === "full") return { tier, sections }

  const allowed = tier === "compact"
    ? new Set(["project_instructions", "project_context", "pins", "skills", "memory"])
    : new Set(["project_instructions", "memory"])
  const caps = tier === "compact"
    ? { project_instructions: 6_000, project_context: 3_000, pins: 1_500, skills: 2_500, memory: 1_200 }
    : { project_instructions: 2_500, memory: 700 }

  return {
    tier,
    sections: sections.flatMap((section): ResolvedPromptSection[] => {
      if (section.name.startsWith("core_system:")) {
        return [{ ...section, content: tier === "compact" ? COMPACT_CORE : MINIMAL_CORE }]
      }
      if (section.cache === "dynamic") {
        return [{ ...section, content: section.content.slice(0, tier === "compact" ? 3_500 : 1_800) }]
      }
      if (!allowed.has(section.name)) return []
      const cap = caps[section.name as keyof typeof caps]
      return cap ? [{ ...section, content: section.content.slice(0, cap) }] : []
    }),
  }
}

export function formatAvailableToolPolicy(toolIds: string[], omittedCount: number): string {
  const visible = new Set(toolIds)
  const hints = TOOL_HINTS.flatMap(({ tools, text }) => tools.some(tool => visible.has(tool)) ? [`- ${text}`] : [])
  return [
    "# Available tools for this turn",
    toolIds.join(", ") || "none",
    omittedCount > 0
      ? `${omittedCount} tools are routed out. Call request_tools with a capability only when the active set cannot complete the task.`
      : "Do not call a tool that is absent from this list.",
    ...(hints.length ? ["", "# Selected tool guidance", ...hints] : []),
  ].join("\n")
}

const TOOL_HINTS: Array<{ tools: string[]; text: string }> = [
  { tools: ["lsp"], text: "Use lsp for definitions, references, types, call hierarchy, diagnostics, and previewed semantic renames." },
  { tools: ["read_image"], text: "Use read_image for workspace screenshots and visual artifacts; do not decode image base64 manually." },
  { tools: ["dep_docs"], text: "Use dep_docs before relying on a third-party API; it reflects the exact installed version." },
  { tools: ["semantic_search"], text: "Use semantic_search for conceptual code discovery; use grep for exact strings." },
  { tools: ["browser"], text: "Open one browser session, interact and assert deterministically, then close it." },
  { tools: ["eval"], text: "Use eval for small stateless experiments; prefer cwd=temp unless project imports are required." },
  { tools: ["ast_edit"], text: "AST edits require match → preview → apply with the same preview_id." },
  { tools: ["critique"], text: "Use critique for significant architecture, security, or critical-path changes; address major findings." },
  { tools: ["memory"], text: "Use project-scoped session recall only when prior work is relevant; verify stale excerpts." },
]
