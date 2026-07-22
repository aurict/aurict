import { describe, expect, it } from "bun:test"
import type { CoreMessage } from "ai"
import {
  extractProtectedContextFacts,
  formatProtectedContextFacts,
  microCompactOldToolResults,
  PROTECTED_FACTS_MARKER,
  TOOL_RESULT_CLEARED_MESSAGE,
} from "../src/session/compaction.js"

describe("microCompactOldToolResults", () => {
  const toolMessage = (id: string, result: string): CoreMessage => ({
    role: "tool",
    content: [{ type: "tool-result", toolCallId: id, toolName: "read", result }],
  })

  it("clears old tool results when context is high and keeps recent results", () => {
    const messages: CoreMessage[] = [
      { role: "user", content: "start" },
      ...Array.from({ length: 6 }, (_, i) => toolMessage(`call-${i}`, `tool-${i} ${"x".repeat(200)}`)),
    ]

    const compacted = microCompactOldToolResults(messages, { contextLimit: 100 }, { keepRecent: 2, triggerRatio: 0.01 })
    const toolMessages = compacted.filter(message => message.role === "tool")

    expect(toolMessages.slice(0, 4).every(message =>
      Array.isArray(message.content) && message.content[0]?.result === TOOL_RESULT_CLEARED_MESSAGE
    )).toBe(true)
    expect(toolMessages.at(-1)?.content[0]?.result).toContain("tool-5")
    expect(toolMessages[0]?.content[0]?.toolCallId).toBe("call-0")
  })

  it("injects protected facts before clearing old tool results", () => {
    const messages: CoreMessage[] = [
      { role: "user", content: "Please fix packages/core/src/agent/loop.ts" },
      toolMessage("verify-1", "bun test packages/core/test/continuation.test.ts\n1 fail in packages/core/src/agent/continuation.ts"),
      { role: "assistant", content: "We decided to centralize continuation decisions in core." },
      ...Array.from({ length: 5 }, (_, i) => toolMessage(`old-${i}`, `old-output-${i} ${"x".repeat(200)}`)),
    ]

    const compacted = microCompactOldToolResults(messages, { contextLimit: 100 }, { keepRecent: 1, triggerRatio: 0.01 })
    const text = compacted.map((message) => String(message.content)).join("\n")

    expect(text).toContain(PROTECTED_FACTS_MARKER)
    expect(text).toContain("packages/core/src/agent/loop.ts")
    expect(text).toContain("continuation decisions")
  })

  it("formats protected facts from session messages", () => {
    const facts = extractProtectedContextFacts([
      { role: "assistant", content: "bun test packages/core/test/microcompact.test.ts passed with 0 fail" },
      { role: "user", content: "Next step is to verify packages/core/src/session/compaction.ts" },
    ] as CoreMessage[])
    const formatted = formatProtectedContextFacts(facts)

    expect(formatted).toContain("VERIFICATION")
    expect(formatted).toContain("NEXT_STEPS")
    expect(formatted).toContain("packages/core/src/session/compaction.ts")
  })
})
