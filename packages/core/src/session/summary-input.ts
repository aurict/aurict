import type { CoreMessage } from "ai"
import { countTokens } from "../provider/tokenizer.js"
import { extractText } from "./context-compactor.js"

export const SUMMARY_SYSTEM_PROMPT = `You are Aurict's utility summarizer.
Preserve exact file paths, commands, identifiers, error messages, verification outcomes, decisions, blockers, and next steps.
Never invent work or mark unverified work as verified. Return only the requested structured summary.`

/**
 * Converts provider-specific message/tool structures into a bounded transcript.
 * Recent context wins and strict tool-call/result pairing is no longer exposed to
 * the utility provider.
 */
export function buildBoundedSummaryTranscript(
  messages: CoreMessage[],
  maxTokens: number,
  modelId?: string,
  tokenizerEncoding?: string,
): string {
  const budget = Math.max(1_000, maxTokens)
  const selected: string[] = []
  let used = 0

  for (let index = messages.length - 1; index >= 0; index--) {
    const message = messages[index]!
    const text = extractText(message).trim()
    if (!text) continue
    const block = `[${message.role}]\n${text.slice(0, 12_000)}`
    const tokens = countTokens(block, modelId, tokenizerEncoding)
    if (used + tokens > budget) {
      if (selected.length === 0) selected.unshift(block.slice(0, Math.max(4_000, budget * 3)))
      break
    }
    selected.unshift(block)
    used += tokens
  }

  return selected.join("\n\n")
}
