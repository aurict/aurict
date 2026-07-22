import { describe, it, expect } from "bun:test"
import { clearTokenCache, countMessageTokens, countTokens, estimateMessages, tokenCacheStats, tokenizableMessageText } from "../src/provider/tokenizer.js"
import type { CoreMessage } from "ai"

describe("countTokens", () => {
  it("empty string returns 0", () => {
    expect(countTokens("")).toBe(0)
  })

  it("single word", () => {
    const n = countTokens("hello")
    expect(n).toBeGreaterThan(0)
    expect(n).toBeLessThanOrEqual(3)
  })

  it("longer text produces more tokens than short text", () => {
    const short = countTokens("hi")
    const long  = countTokens("Hello, this is a much longer sentence with many words in it.")
    expect(long).toBeGreaterThan(short)
  })

  it("cl100k_base model (claude)", () => {
    const n = countTokens("The quick brown fox jumps over the lazy dog", "claude-sonnet-4-6")
    expect(n).toBeGreaterThan(5)
    expect(n).toBeLessThan(20)
  })

  it("o200k_base model (gpt-4o)", () => {
    const n = countTokens("The quick brown fox jumps over the lazy dog", "gpt-4o")
    expect(n).toBeGreaterThan(5)
    expect(n).toBeLessThan(20)
  })

  it("unknown model falls back to cl100k_base", () => {
    const n = countTokens("hello world", "unknown-model-xyz")
    expect(n).toBeGreaterThan(0)
  })

  it("openrouter format model resolves correctly", () => {
    const n1 = countTokens("hello", "anthropic/claude-3-5-sonnet")
    const n2 = countTokens("hello", "openai/gpt-4o")
    expect(n1).toBeGreaterThan(0)
    expect(n2).toBeGreaterThan(0)
  })
})

describe("estimateMessages", () => {
  it("empty array returns 0", () => {
    expect(estimateMessages([])).toBe(0)
  })

  it("adds per-message overhead (~4 tokens)", () => {
    const msgs = [{ role: "user", content: "" }]
    // Empty content = 0 tokens + 4 overhead
    expect(estimateMessages(msgs)).toBe(4)
  })

  it("sums across multiple messages", () => {
    const msgs = [
      { role: "user",      content: "hello" },
      { role: "assistant", content: "world" },
    ]
    const total = estimateMessages(msgs)
    expect(total).toBeGreaterThan(8) // at least 4 overhead × 2 messages
  })

  it("consistent with countTokens", () => {
    const content = "The quick brown fox"
    const msgs    = [{ role: "user", content }]
    const direct  = countTokens(content)
    const est     = estimateMessages(msgs)
    expect(est).toBe(direct + 4) // 4 overhead per message
  })
})

describe("semantic message tokenization", () => {
  it("does not tokenize base64 image bytes as text", () => {
    const message = {
      role: "user",
      content: [{ type: "image", image: "A".repeat(200_000), mimeType: "image/png" }],
    } as CoreMessage
    expect(tokenizableMessageText(message)).toBe("[image attachment]")
    expect(countMessageTokens(message)).toBeLessThan(2_000)
  })

  it("memoizes repeated tokenization by content hash", () => {
    clearTokenCache()
    countTokens("repeat me", "gpt-4o")
    countTokens("repeat me", "gpt-4o")
    expect(tokenCacheStats()).toMatchObject({ hits: 1, misses: 1, entries: 1 })
  })
})
