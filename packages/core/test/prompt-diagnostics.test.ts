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
    expect(report.totalBudgetTokens).toBeGreaterThan(0)
    expect(report.overBudgetTokens).toBe(0)
    expect(report.byCache.static.sections).toBe(1)
    expect(report.byCache.dynamic.sections).toBe(1)
  })

  it("reports section budget warnings", () => {
    const previous = process.env["AURICT_PROMPT_SECTION_BUDGET_SKILLS"]
    process.env["AURICT_PROMPT_SECTION_BUDGET_SKILLS"] = "1"
    try {
      const report = analyzePromptSections([
        { name: "skills", cache: "dynamic", content: "one two three four five" },
      ])

      expect(report.warnings.some((warning) => warning.scope === "section" && warning.name === "skills")).toBe(true)
      expect(report.sections[0]?.overBudgetTokens).toBeGreaterThan(0)
    } finally {
      if (previous === undefined) delete process.env["AURICT_PROMPT_SECTION_BUDGET_SKILLS"]
      else process.env["AURICT_PROMPT_SECTION_BUDGET_SKILLS"] = previous
    }
  })

  it("reports total prompt budget warnings", () => {
    const previous = process.env["AURICT_PROMPT_TOTAL_BUDGET_TOKENS"]
    process.env["AURICT_PROMPT_TOTAL_BUDGET_TOKENS"] = "1"
    try {
      const report = analyzePromptSections([
        { name: "core", cache: "static", content: "one two three four five" },
      ])

      expect(report.overBudgetTokens).toBeGreaterThan(0)
      expect(report.warnings[0]?.scope).toBe("total")
    } finally {
      if (previous === undefined) delete process.env["AURICT_PROMPT_TOTAL_BUDGET_TOKENS"]
      else process.env["AURICT_PROMPT_TOTAL_BUDGET_TOKENS"] = previous
    }
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
