import { describe, it, expect } from "bun:test"
import {
  estimateTokens,
  estimateEffectiveContextTokens,
  isOverflow,
  isOverflowByMessages,
  COMPACTION_BUFFER,
  TOOL_OUTPUT_MAX_CHARS,
  DEFAULT_TAIL_TURNS,
} from "../src/session/compaction.js"
import type { CoreMessage } from "ai"
import { countTokens } from "../src/provider/tokenizer.js"

function makeMessages(n: number, content = "hello world"): CoreMessage[] {
  return Array.from({ length: n }, (_, i) => ({
    role: i % 2 === 0 ? "user" : "assistant",
    content,
  } as CoreMessage))
}

describe("estimateTokens", () => {
  it("empty array returns 0", () => {
    expect(estimateTokens([])).toBe(0)
  })

  it("one message returns tokens + 4 overhead", () => {
    const msgs: CoreMessage[] = [{ role: "user", content: "" }]
    expect(estimateTokens(msgs)).toBe(4)
  })

  it("increases with more messages", () => {
    const a = estimateTokens(makeMessages(2))
    const b = estimateTokens(makeMessages(10))
    expect(b).toBeGreaterThan(a)
  })

  it("handles object content (tool results)", () => {
    const msgs: CoreMessage[] = [
      { role: "tool", content: [{ type: "tool-result", toolCallId: "x", toolName: "read", result: "result" }] }
    ]
    const n = estimateTokens(msgs)
    expect(n).toBeGreaterThan(0)
  })

  it("counts multimodal attachments once instead of stringifying base64", () => {
    const msgs = [{
      role: "user",
      content: [{ type: "image", image: "A".repeat(200_000), mimeType: "image/png" }],
    }] as CoreMessage[]
    const estimated = estimateEffectiveContextTokens(msgs, {
      modelId: "gpt-4o",
      attachmentReserveTokens: 0,
      safetyMargin: 1,
    })
    expect(estimated).toBeGreaterThan(1_000)
    expect(estimated).toBeLessThan(2_000)
  })

  it("uses the selected model encoding instead of always falling back", () => {
    const content = "Merhaba 👋 code: const result = await fetch('/api')"
    const msgs: CoreMessage[] = [{ role: "user", content }]
    expect(estimateTokens(msgs, "gpt-4o")).toBe(countTokens(content, "gpt-4o") + 4)
  })

  it("includes system, tool, attachment, and safety reserves in an effective context estimate", () => {
    const msgs: CoreMessage[] = [{ role: "user", content: "hello" }]
    const historyOnly = estimateTokens(msgs, "gpt-4o")
    const effective = estimateEffectiveContextTokens(msgs, {
      modelId: "gpt-4o",
      systemPrompt: "Follow the project instructions.",
      toolSchemaReserveTokens: 500,
      attachmentReserveTokens: 1_200,
    })
    expect(effective).toBeGreaterThan(historyOnly + 1_700)
  })
})

describe("isOverflow", () => {
  const baseCfg = {
    contextLimit: 200_000,
    maxOutput:    8_192,
    tailTurns:    2,
    provider:     "anthropic",
    model:        "claude-sonnet-4-6",
  }

  it("small message set is not overflow", () => {
    const msgs = makeMessages(4, "hello")
    expect(isOverflow(msgs, baseCfg)).toBe(false)
  })

  it("empty messages is not overflow", () => {
    expect(isOverflow([], baseCfg)).toBe(false)
  })

  it("detects overflow when tokens exceed limit", () => {
    // usable = 200000 - 8192 - 20000 = 171808
    // We need >171808 tokens — each "hello world" ≈ 2 tokens + 4 overhead = 6 per msg
    // 171808 / 6 ≈ 28634 messages — simulate with a tiny context limit instead
    const tightCfg = { ...baseCfg, contextLimit: 100 }
    const msgs = makeMessages(20, "hello world this is a longer message to burn tokens quickly")
    expect(isOverflow(msgs, tightCfg)).toBe(true)
  })
})

describe("isOverflowByMessages", () => {
  const cfg = {
    contextLimit: 200_000, maxOutput: 8_192,
    tailTurns: 2, provider: "anthropic", model: "claude-sonnet-4-6",
    messageCountThreshold: 10,
  }

  it("below threshold is not overflow", () => {
    expect(isOverflowByMessages(makeMessages(5), cfg)).toBe(false)
  })

  it("at threshold triggers overflow", () => {
    expect(isOverflowByMessages(makeMessages(10), cfg)).toBe(true)
  })

  it("above threshold triggers overflow", () => {
    expect(isOverflowByMessages(makeMessages(50), cfg)).toBe(true)
  })

  it("uses default threshold (100) when not specified", () => {
    const cfgNoThresh = { contextLimit: 200_000, maxOutput: 8_192, tailTurns: 2, provider: "anthropic", model: "x" }
    expect(isOverflowByMessages(makeMessages(99),  cfgNoThresh)).toBe(false)
    expect(isOverflowByMessages(makeMessages(100), cfgNoThresh)).toBe(true)
  })
})

describe("constants", () => {
  it("COMPACTION_BUFFER is 20000", () => {
    expect(COMPACTION_BUFFER).toBe(20_000)
  })

  it("TOOL_OUTPUT_MAX_CHARS is 2000", () => {
    expect(TOOL_OUTPUT_MAX_CHARS).toBe(2_000)
  })

  it("DEFAULT_TAIL_TURNS is 2", () => {
    expect(DEFAULT_TAIL_TURNS).toBe(2)
  })
})
