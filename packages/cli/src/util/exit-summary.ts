import type { TokenBreakdown } from "@aurict/core"

export interface SessionExitSummary {
  sessionId: string
  tokens: TokenBreakdown
  /** Prompts the user submitted in this run. */
  turns: number
}

const number = (value: number) => Math.round(value).toLocaleString("en-US")

/** Plain-text lines printed after the TUI exits; empty when nothing happened. */
export function formatExitSummary(summary: SessionExitSummary | null): string[] {
  if (!summary || summary.turns === 0) return []
  const { input, output, cacheRead, cacheWrite, reasoning } = summary.tokens
  const total = input + output + cacheRead + cacheWrite
  const cached = cacheRead > 0 ? ` (+${number(cacheRead)} cached)` : ""
  const thinking = reasoning > 0 ? ` (${number(reasoning)} reasoning)` : ""
  return [
    `Token usage: ${number(total)} total · ${number(input)} input${cached} · ${number(output)} output${thinking}`,
    `To continue this session, run: aurict --resume ${summary.sessionId}`,
  ]
}
