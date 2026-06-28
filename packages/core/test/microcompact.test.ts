import { describe, expect, it } from "bun:test"
import type { CoreMessage } from "ai"
import { microCompactOldToolResults, TOOL_RESULT_CLEARED_MESSAGE } from "../src/session/compaction.js"

describe("microCompactOldToolResults", () => {
  it("clears old tool results when context is high and keeps recent results", () => {
    const messages: CoreMessage[] = [
      { role: "user", content: "start" },
      ...Array.from({ length: 6 }, (_, i) => ({ role: "tool" as const, content: `tool-${i} ${"x".repeat(200)}` })),
    ]

    const compacted = microCompactOldToolResults(messages, { contextLimit: 100 }, { keepRecent: 2, triggerRatio: 0.01 })
    const toolMessages = compacted.filter(message => message.role === "tool")

    expect(toolMessages.slice(0, 4).every(message => message.content === TOOL_RESULT_CLEARED_MESSAGE)).toBe(true)
    expect(toolMessages.at(-1)?.content).toContain("tool-5")
  })
})

