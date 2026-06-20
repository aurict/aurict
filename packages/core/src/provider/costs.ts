import type { TokenBreakdown } from "../agent/types.js"

/** USD / 1 milyon token */
interface ModelCost {
  input:        number
  output:       number
  cacheRead?:   number
  cacheWrite?:  number
}

const COST_TABLE: Record<string, ModelCost> = {
  // ── Anthropic ────────────────────────────────────────────────────────────────
  "claude-opus-4":             { input: 15,     output: 75,    cacheRead: 1.5,   cacheWrite: 18.75 },
  "claude-opus-4-5":           { input: 15,     output: 75,    cacheRead: 1.5,   cacheWrite: 18.75 },
  "claude-opus-4-8":           { input: 15,     output: 75,    cacheRead: 1.5,   cacheWrite: 18.75 },
  "claude-sonnet-4":           { input: 3,      output: 15,    cacheRead: 0.3,   cacheWrite: 3.75  },
  "claude-sonnet-4-5":         { input: 3,      output: 15,    cacheRead: 0.3,   cacheWrite: 3.75  },
  "claude-sonnet-4-6":         { input: 3,      output: 15,    cacheRead: 0.3,   cacheWrite: 3.75  },
  "claude-haiku-4-5":          { input: 0.8,    output: 4,     cacheRead: 0.08,  cacheWrite: 1     },
  "claude-3-5-sonnet":         { input: 3,      output: 15,    cacheRead: 0.3,   cacheWrite: 3.75  },
  "claude-3-5-haiku":          { input: 0.8,    output: 4,     cacheRead: 0.08,  cacheWrite: 1     },
  "claude-3-opus":             { input: 15,     output: 75,    cacheRead: 1.5,   cacheWrite: 18.75 },

  // ── OpenAI ───────────────────────────────────────────────────────────────────
  "gpt-4o":                    { input: 2.5,    output: 10    },
  "gpt-4o-mini":               { input: 0.15,   output: 0.6   },
  "gpt-4-turbo":               { input: 10,     output: 30    },
  "gpt-4":                     { input: 30,     output: 60    },
  "gpt-3.5-turbo":             { input: 0.5,    output: 1.5   },
  "o1":                        { input: 15,     output: 60    },
  "o1-mini":                   { input: 3,      output: 12    },
  "o1-preview":                { input: 15,     output: 60    },
  "o3":                        { input: 10,     output: 40    },
  "o3-mini":                   { input: 1.1,    output: 4.4   },
  "o4-mini":                   { input: 1.1,    output: 4.4   },

  // ── Google ───────────────────────────────────────────────────────────────────
  "gemini-2.5-pro":            { input: 1.25,   output: 10    },
  "gemini-2.5-flash":          { input: 0.075,  output: 0.3   },
  "gemini-2.0-flash":          { input: 0.1,    output: 0.4   },
  "gemini-1.5-pro":            { input: 1.25,   output: 5     },
  "gemini-1.5-flash":          { input: 0.075,  output: 0.3   },

  // ── xAI ─────────────────────────────────────────────────────────────────────
  "grok-3":                    { input: 3,      output: 15    },
  "grok-3-mini":               { input: 0.3,    output: 0.5   },
  "grok-2":                    { input: 2,      output: 10    },

  // ── OpenRouter (base pricing) ────────────────────────────────────────────────
  "deepseek/deepseek-chat":    { input: 0.14,   output: 0.28  },
  "deepseek/deepseek-r1":      { input: 0.55,   output: 2.19  },
  "meta-llama/llama-3.3-70b":  { input: 0.12,   output: 0.3   },
}

/**
 * Model ID ile fiyat kaydı bul.
 * Exact match → prefix match (versiyonlu suffix'i yoksay).
 */
function findCost(modelId: string): ModelCost | null {
  if (!modelId) return null
  if (COST_TABLE[modelId]) return COST_TABLE[modelId]!

  // "claude-sonnet-4-6-20250219" → "claude-sonnet-4-6" prefix match
  const key = Object.keys(COST_TABLE).find(k =>
    modelId.startsWith(k) || k.startsWith(modelId.split("-").slice(0, 3).join("-"))
  )
  return key ? COST_TABLE[key]! : null
}

/**
 * Token breakdown'dan USD maliyeti hesaplar.
 * Bilinmeyen model için 0 döner.
 */
export function calculateCostUsd(
  modelId:   string,
  breakdown: TokenBreakdown,
): number {
  const cost = findCost(modelId)
  if (!cost) return 0

  const PER_M = 1_000_000
  return (
    (breakdown.input      / PER_M) * cost.input +
    (breakdown.output     / PER_M) * cost.output +
    (breakdown.cacheRead  / PER_M) * (cost.cacheRead  ?? 0) +
    (breakdown.cacheWrite / PER_M) * (cost.cacheWrite ?? 0)
  )
}

/** Biçimlendirilmiş maliyet string'i: "$0.0032" veya "<$0.0001" */
export function formatCostUsd(usd: number): string {
  if (usd === 0)     return "$0.00"
  if (usd < 0.0001)  return "<$0.0001"
  if (usd < 0.01)    return `$${usd.toFixed(4)}`
  if (usd < 1)       return `$${usd.toFixed(3)}`
  return `$${usd.toFixed(2)}`
}
