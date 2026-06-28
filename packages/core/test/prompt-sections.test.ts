import { afterEach, describe, expect, it } from "bun:test"
import {
  clearPromptSectionCache,
  dynamicPromptSection,
  joinPromptSections,
  promptSectionCacheStats,
  resolvePromptSections,
  sessionPromptSection,
  splitPromptSectionsByCache,
  staticPromptSection,
} from "../src/agent/prompt-sections.js"

afterEach(() => {
  clearPromptSectionCache()
})

describe("prompt sections", () => {
  it("filters empty sections and preserves order", async () => {
    const sections = await resolvePromptSections([
      dynamicPromptSection("empty", () => ""),
      dynamicPromptSection("first", () => "one"),
      dynamicPromptSection("second", () => "two"),
    ])

    expect(sections.map(section => section.name)).toEqual(["first", "second"])
    expect(joinPromptSections(sections)).toBe("one\n\ntwo")
  })

  it("caches static and session sections by cache key", async () => {
    let staticCalls = 0
    let sessionCalls = 0

    const sections = [
      staticPromptSection("core", () => {
        staticCalls++
        return `core-${staticCalls}`
      }),
      sessionPromptSection("memory", () => {
        sessionCalls++
        return `memory-${sessionCalls}`
      }),
    ]

    const first = await resolvePromptSections(sections, "project-a")
    const second = await resolvePromptSections(sections, "project-a")

    expect(first.map(section => section.content)).toEqual(["core-1", "memory-1"])
    expect(second.map(section => section.content)).toEqual(["core-1", "memory-1"])
    expect(staticCalls).toBe(1)
    expect(sessionCalls).toBe(1)
    expect(promptSectionCacheStats().entries).toBe(2)
  })

  it("does not cache dynamic sections", async () => {
    let calls = 0
    const sections = [
      dynamicPromptSection("git", () => {
        calls++
        return `git-${calls}`
      }),
    ]

    const first = await resolvePromptSections(sections, "project-a")
    const second = await resolvePromptSections(sections, "project-a")

    expect(first[0]?.content).toBe("git-1")
    expect(second[0]?.content).toBe("git-2")
    expect(promptSectionCacheStats().entries).toBe(0)
  })

  it("clears selected cached sections", async () => {
    const sections = [sessionPromptSection("project_context", () => "context")]

    await resolvePromptSections(sections, "project-a")
    await resolvePromptSections(sections, "project-b")
    expect(promptSectionCacheStats().entries).toBe(2)

    clearPromptSectionCache({ cacheKey: "project-a", name: "project_context" })

    expect(promptSectionCacheStats().entries).toBe(1)
  })

  it("splits cacheable and dynamic content while preserving relative order", () => {
    const split = splitPromptSectionsByCache([
      { name: "instructions", cache: "session", content: "instructions" },
      { name: "core", cache: "static", content: "core" },
      { name: "git", cache: "dynamic", content: "git" },
      { name: "memory", cache: "dynamic", content: "memory" },
    ])

    expect(split.cacheable).toBe("instructions\n\ncore")
    expect(split.dynamic).toBe("git\n\nmemory")
  })
})
