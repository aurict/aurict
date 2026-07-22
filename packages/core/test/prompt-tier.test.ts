import { describe, expect, it } from "bun:test"
import { applyPromptTier, formatAvailableToolPolicy, resolvePromptTier } from "../src/agent/prompt-tier.js"

describe("prompt tiering", () => {
  it("selects tiers from the effective model context", () => {
    expect(resolvePromptTier(128_000)).toBe("full")
    expect(resolvePromptTier(32_000)).toBe("compact")
    expect(resolvePromptTier(8_000)).toBe("minimal")
  })

  it("shrinks core and optional session sections for minimal models", () => {
    const result = applyPromptTier([
      { name: "core_system:main", cache: "static", content: "x".repeat(20_000) },
      { name: "skills", cache: "session", content: "skills" },
      { name: "project_instructions", cache: "session", content: "p".repeat(5_000) },
      { name: "canonical_agent_state", cache: "dynamic", content: "state" },
    ], 8_000)
    expect(result.sections.some(section => section.name === "skills")).toBe(false)
    expect(result.sections.find(section => section.name.startsWith("core_system"))!.content.length).toBeLessThan(1_000)
    expect(result.sections.find(section => section.name === "project_instructions")!.content).toHaveLength(2_500)
  })

  it("advertises request_tools only when tools were omitted", () => {
    expect(formatAvailableToolPolicy(["read", "request_tools"], 4)).toContain("request_tools")
  })
})
