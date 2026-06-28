import { countTokens } from "../provider/tokenizer.js"
import type { ResolvedPromptSection } from "./prompt-sections.js"

export interface PromptSectionDiagnostic {
  name: string
  cache: ResolvedPromptSection["cache"]
  chars: number
  tokens: number
}

export interface PromptDiagnostics {
  sections: PromptSectionDiagnostic[]
  totalChars: number
  totalTokens: number
  byCache: Record<ResolvedPromptSection["cache"], { chars: number; tokens: number; sections: number }>
}

export function analyzePromptSections(sections: ResolvedPromptSection[]): PromptDiagnostics {
  const diagnostics = sections.map((section) => ({
    name: section.name,
    cache: section.cache,
    chars: section.content.length,
    tokens: countTokens(section.content),
  }))

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

  return {
    sections: diagnostics,
    totalChars: diagnostics.reduce((sum, section) => sum + section.chars, 0),
    totalTokens: diagnostics.reduce((sum, section) => sum + section.tokens, 0),
    byCache,
  }
}

