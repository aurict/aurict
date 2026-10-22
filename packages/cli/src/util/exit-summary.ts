import type { TokenBreakdown } from "@aurict/core"

export interface SessionExitSummary {
  sessionId: string
  tokens: TokenBreakdown
  /** Prompts the user submitted in this run. */
  turns: number
}

const number = (value: number) => Math.round(value).toLocaleString("en-US")

/**
 * Plain-text lines printed after the TUI exits, in Codex's format; empty when nothing happened:
 *
 *   Token usage: total=1,540 input=1,200 (+ 800 cached) output=340 (reasoning 40)
 *   To continue this session, run:
 *     aurict --resume <id>
 */
export function formatExitSummary(summary: SessionExitSummary | null): string[] {
  if (!summary || summary.turns === 0) return []
  const { input, output, cacheRead, reasoning } = summary.tokens
  const cached = cacheRead > 0 ? ` (+ ${number(cacheRead)} cached)` : ""
  const thinking = reasoning > 0 ? ` (reasoning ${number(reasoning)})` : ""
  return [
    `Token usage: total=${number(input + output)} input=${number(input)}${cached} output=${number(output)}${thinking}`,
    "To continue this session, run:",
    `  aurict --resume ${summary.sessionId}`,
  ]
}
