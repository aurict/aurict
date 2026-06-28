import { describe, expect, it, afterEach } from "bun:test"
import { analyzePromptSections } from "../src/agent/prompt-diagnostics.js"
import { clearPromptCacheHealth, promptCacheHealthStats, recordPromptCacheHealth } from "../src/agent/prompt-cache-health.js"

afterEach(() => {
  clearPromptCacheHealth()
})

describe("prompt diagnostics", () => {
  it("reports section and cache bucket token totals", () => {
    const report = analyzePromptSections([
      { name: "core", cache: "static", content: "core instructions" },
      { name: "git", cache: "dynamic", content: "git status" },
    ])

    expect(report.sections.map(section => section.name)).toEqual(["core", "git"])
    expect(report.totalChars).toBeGreaterThan(0)
    expect(report.totalTokens).toBeGreaterThan(0)
    expect(report.byCache.static.sections).toBe(1)
    expect(report.byCache.dynamic.sections).toBe(1)
  })
})

describe("prompt cache health", () => {
  it("classifies first, stable, and changed prompt states", () => {
    const base = {
      key: "project:anthropic",
      model: "claude-test",
      sections: [{ name: "core", cache: "static" as const, content: "core" }],
      toolIds: ["read", "write"],
    }

    expect(recordPromptCacheHealth(base).kind).toBe("first_observation")
    expect(recordPromptCacheHealth(base).kind).toBe("stable")
    expect(recordPromptCacheHealth({ ...base, toolIds: ["read"] }).kind).toBe("tools_changed")
    expect(recordPromptCacheHealth({ ...base, sections: [{ name: "core", cache: "static" as const, content: "changed" }] }).kind).toBe("tools_changed")
    expect(promptCacheHealthStats().entries).toBe(1)
  })
})

