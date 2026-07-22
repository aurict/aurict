import { describe, expect, it } from "bun:test"
import type { CoreMessage } from "ai"
import { appendAnthropicDynamicContext, buildPromptCacheLayout, withAnthropicHistoryBreakpoint } from "../src/agent/prompt-cache-layout.js"

describe("prompt cache layout", () => {
  it("uses separate static, session, skills, and dynamic groups", () => {
    const layout = buildPromptCacheLayout([
      { name: "core", cache: "static", content: "core" },
      { name: "project", cache: "session", content: "project" },
      { name: "skills", cache: "session", content: "skills" },
      { name: "intent", cache: "dynamic", content: "intent" },
    ])
    expect(layout).toEqual({ static: "core", session: "project", skills: "skills", dynamic: "intent" })
  })

  it("annotates only a cloned final history message", () => {
    const messages: CoreMessage[] = [
      { role: "user", content: "first" },
      { role: "assistant", content: "second" },
    ]
    const result = withAnthropicHistoryBreakpoint(messages, true)
    expect(result).not.toBe(messages)
    expect(result[0]).toBe(messages[0])
    expect(result[1]).not.toBe(messages[1])
    expect((messages[1] as { experimental_providerMetadata?: unknown }).experimental_providerMetadata).toBeUndefined()
    expect(result[1]?.experimental_providerMetadata).toEqual({ anthropic: { cacheControl: { type: "ephemeral" } } })
  })

  it("keeps volatile runtime context after the cached history boundary", () => {
    const messages: CoreMessage[] = [
      { role: "user", content: "old question" },
      { role: "assistant", content: "old answer" },
      { role: "user", content: "current question" },
    ]
    const cached = withAnthropicHistoryBreakpoint(messages, true, true)
    const prepared = appendAnthropicDynamicContext(cached, "fresh git and task state")
    expect(prepared.map(message => message.role)).toEqual(["user", "assistant", "user", "user"])
    expect(prepared[1]?.experimental_providerMetadata).toBeDefined()
    expect(prepared[2]?.content).toContain("aurict-runtime-context")
    expect(prepared[3]?.content).toBe("current question")
  })
})
