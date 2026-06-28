import { describe, expect, it } from "bun:test"
import { analyzePromptSections } from "../src/agent/prompt-diagnostics.js"
import { buildSystemPromptSections, buildIntentSkillSection } from "../src/skill/injector.js"

describe("prompt contracts", () => {
  it("keeps skill discovery metadata-only and instructs lazy loading", async () => {
    const section = await buildIntentSkillSection("create a professional report", process.cwd(), new Set())

    if (section) {
      expect(section).toContain("load_skill")
      expect(section.length).toBeLessThan(9_000)
    }
  })

  it("keeps git and runtime sections dynamic instead of cacheable", async () => {
    const sections = await buildSystemPromptSections(process.cwd(), undefined, true, undefined, "fix tests")
    const git = sections.find(section => section.name === "git")
    const skills = sections.find(section => section.name === "skills")

    if (git) expect(git.cache).toBe("dynamic")
    if (skills) expect(skills.cache).toBe("dynamic")
  })

  it("reports attention anchor budget warnings semantically", () => {
    const diagnostics = analyzePromptSections([
      { name: "attention_anchor", cache: "dynamic", content: "x ".repeat(6_000) },
    ])

    expect(diagnostics.warnings.some(warning => warning.name === "attention_anchor")).toBe(true)
  })
})
