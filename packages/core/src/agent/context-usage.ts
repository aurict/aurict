import type { CoreMessage } from "ai"
import { COMPACTION_BUFFER, estimateEffectiveContextTokens, estimateTokens } from "../session/compaction.js"
import type { ContextUsage } from "./types.js"

export interface ContextUsageInput {
  providerId?: string
  modelId: string
  tokenizerEncoding?: string
  contextWindow: number
  maxOutputTokens: number
  systemPrompt?: string
  toolSchemaReserveTokens?: number
  attachmentReserveTokens?: number
}

/**
 * Builds the one context measurement used by the compactor and every UI.
 * Provider usage is intentionally excluded: cache accounting is billable usage,
 * not a reliable snapshot of the conversation that remains in context.
 */
export function measureContextUsage(
  messages: CoreMessage[],
  input: ContextUsageInput,
): ContextUsage {
  const historyTokens = estimateTokens(messages, input.modelId, input.tokenizerEncoding)
  const effectiveTokens = estimateEffectiveContextTokens(messages, {
    modelId: input.modelId,
    ...(input.providerId !== undefined ? { providerId: input.providerId } : {}),
    ...(input.tokenizerEncoding !== undefined ? { tokenizerEncoding: input.tokenizerEncoding } : {}),
    ...(input.systemPrompt !== undefined ? { systemPrompt: input.systemPrompt } : {}),
    ...(input.toolSchemaReserveTokens !== undefined ? { toolSchemaReserveTokens: input.toolSchemaReserveTokens } : {}),
    ...(input.attachmentReserveTokens !== undefined ? { attachmentReserveTokens: input.attachmentReserveTokens } : {}),
  })

  return {
    historyTokens,
    effectiveTokens,
    contextWindow: input.contextWindow,
    maxOutputTokens: input.maxOutputTokens,
    compactionThreshold: Math.max(0, input.contextWindow - input.maxOutputTokens - COMPACTION_BUFFER),
  }
}
