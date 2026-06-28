import { countTokens } from "../provider/tokenizer.js"
import type { ResolvedPromptSection } from "./prompt-sections.js"

export const DEFAULT_PROMPT_TOTAL_BUDGET_TOKENS = 32_000

const DEFAULT_SECTION_BUDGETS: Array<{ match: string | RegExp; tokens: number }> = [
  { match: /^core_system:/, tokens: 12_000 },
  { match: "project_instructions", tokens: 3_000 },
  { match: "project_context", tokens: 4_000 },
  { match: "intent_modules", tokens: 2_500 },
  { match: "pins", tokens: 1_200 },
  { match: "git", tokens: 2_000 },
  { match: "skills", tokens: 1_200 },
  { match: "memory", tokens: 2_000 },
  { match: "runtime_extra", tokens: 3_500 },
  { match: "undercover", tokens: 2_000 },
  { match: "attention_anchor", tokens: 1_200 },
]

export interface PromptSectionDiagnostic {
  name: string
  cache: ResolvedPromptSection["cache"]
  chars: number
  tokens: number
  budgetTokens?: number | undefined
  overBudgetTokens: number
}

export interface PromptBudgetWarning {
  scope: "total" | "section"
  name: string
  tokens: number
  budgetTokens: number
  overBudgetTokens: number
}

export interface PromptDiagnostics {
  sections: PromptSectionDiagnostic[]
  totalChars: number
  totalTokens: number
  totalBudgetTokens: number
  overBudgetTokens: number
  warnings: PromptBudgetWarning[]
  byCache: Record<ResolvedPromptSection["cache"], { chars: number; tokens: number; sections: number }>
}

export function analyzePromptSections(sections: ResolvedPromptSection[]): PromptDiagnostics {
  const totalBudgetTokens = readPositiveIntEnv("AURICT_PROMPT_TOTAL_BUDGET_TOKENS") ?? DEFAULT_PROMPT_TOTAL_BUDGET_TOKENS
  const diagnostics = sections.map((section) => {
    const tokens = countTokens(section.content)
    const budgetTokens = sectionBudget(section.name)
    return {
      name: section.name,
      cache: section.cache,
      chars: section.content.length,
      tokens,
      ...(budgetTokens !== undefined ? { budgetTokens } : {}),
      overBudgetTokens: budgetTokens !== undefined ? Math.max(0, tokens - budgetTokens) : 0,
    }
  })

  const byCache: PromptDiagnostics["byCache"] = {
    static:  { chars: 0, tokens: 0, sections: 0 },
    session: { chars: 0, tokens: 0, sections: 0 },
    dynamic: { chars: 0, tokens: 0, sections: 0 },
  }

  for (const section of diagnostics) {
    byCache[section.cache].chars += section.chars
    byCache[section.cache].tokens += section.tokens
    byCache[section.cache].sections++
  }

  const totalChars = diagnostics.reduce((sum, section) => sum + section.chars, 0)
  const totalTokens = diagnostics.reduce((sum, section) => sum + section.tokens, 0)
  const warnings: PromptBudgetWarning[] = diagnostics
    .filter((section) => section.overBudgetTokens > 0 && section.budgetTokens !== undefined)
    .map((section) => ({
      scope: "section",
      name: section.name,
      tokens: section.tokens,
      budgetTokens: section.budgetTokens!,
      overBudgetTokens: section.overBudgetTokens,
    }))

  if (totalTokens > totalBudgetTokens) {
    warnings.unshift({
      scope: "total",
      name: "prompt",
      tokens: totalTokens,
      budgetTokens: totalBudgetTokens,
      overBudgetTokens: totalTokens - totalBudgetTokens,
    })
  }

  return {
    sections: diagnostics,
    totalChars,
    totalTokens,
    totalBudgetTokens,
    overBudgetTokens: Math.max(0, totalTokens - totalBudgetTokens),
    warnings,
    byCache,
  }
}

function sectionBudget(name: string): number | undefined {
  const envName = `AURICT_PROMPT_SECTION_BUDGET_${name.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}`
  const envBudget = readPositiveIntEnv(envName)
  if (envBudget !== undefined) return envBudget

  for (const entry of DEFAULT_SECTION_BUDGETS) {
    if (typeof entry.match === "string" && entry.match === name) return entry.tokens
    if (entry.match instanceof RegExp && entry.match.test(name)) return entry.tokens
  }
  return undefined
}

function readPositiveIntEnv(name: string, fallback?: number): number | undefined {
  const raw = process.env[name]
  if (raw === undefined || raw.trim() === "") return fallback
  const value = Number(raw)
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback
}
