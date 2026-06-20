import { describe, it, expect } from "bun:test"
import { extractInstantContext, formatInstantContext } from "../src/util/instant-context.js"
import { createTempDir } from "./helpers.js"

describe("extractInstantContext", () => {
  describe("file detection", () => {
    it("detects TypeScript file references", async () => {
      const { dir, cleanup, createFile } = createTempDir()
      try {
        createFile("src/app.ts", "const x = 5")

        const context = await extractInstantContext(
          "Check src/app.ts for the bug",
          dir
        )

        expect(context.files.length).toBeGreaterThan(0)
        expect(context.files[0]!.path).toContain("app.ts")
      } finally {
        cleanup()
      }
    })

    it("detects multiple file references", async () => {
      const { dir, cleanup, createFile } = createTempDir()
      try {
        createFile("a.ts", "file a")
        createFile("b.ts", "file b")

        const context = await extractInstantContext(
          "Compare a.ts and b.ts",
          dir
        )

        expect(context.files.length).toBe(2)
      } finally {
        cleanup()
      }
    })

    it("limits to maxFiles", async () => {
      const { dir, cleanup, createFile } = createTempDir()
      try {
        createFile("a.ts", "a")
        createFile("b.ts", "b")
        createFile("c.ts", "c")
        createFile("d.ts", "d")

        const context = await extractInstantContext(
          "Check a.ts b.ts c.ts d.ts",
          dir,
          { maxFiles: 2 }
        )

        expect(context.files.length).toBeLessThanOrEqual(2)
      } finally {
        cleanup()
      }
    })
  })

  describe("skill detection", () => {
    it("detects React keywords", async () => {
      const context = await extractInstantContext(
        "How do I create a React component?",
        "/tmp"
      )

      expect(context.skills).toContain("react-expert")
    })

    it("detects TypeScript keywords", async () => {
      const context = await extractInstantContext(
        "I have a type error in my interface",
        "/tmp"
      )

      expect(context.skills).toContain("typescript-expert")
    })

    it("detects testing keywords", async () => {
      const context = await extractInstantContext(
        "How do I write a Jest test?",
        "/tmp"
      )

      expect(context.skills).toContain("testing-patterns")
    })

    it("limits to maxSkills", async () => {
      const context = await extractInstantContext(
        "React TypeScript Docker security performance",
        "/tmp",
        { maxSkills: 2 }
      )

      expect(context.skills.length).toBeLessThanOrEqual(2)
    })
  })

  describe("error pattern detection", () => {
    it("detects TypeScript errors", async () => {
      const context = await extractInstantContext(
        "I'm getting error TS2322: Type is not assignable",
        "/tmp"
      )

      expect(context.errorPatterns.length).toBeGreaterThan(0)
      expect(context.errorPatterns[0]).toContain("TypeScript")
    })

    it("detects module not found errors", async () => {
      const context = await extractInstantContext(
        "Cannot find module './utils'",
        "/tmp"
      )

      expect(context.errorPatterns.length).toBeGreaterThan(0)
      expect(context.errorPatterns[0]).toContain("Module")
    })

    it("detects runtime errors", async () => {
      const context = await extractInstantContext(
        "TypeError: Cannot read property 'foo' of undefined",
        "/tmp"
      )

      expect(context.errorPatterns.length).toBeGreaterThan(0)
      expect(context.errorPatterns[0]).toContain("Runtime")
    })
  })

  describe("suggestions", () => {
    it("generates suggestions for detected files", async () => {
      const { dir, cleanup, createFile } = createTempDir()
      try {
        createFile("app.ts", "content")

        const context = await extractInstantContext(
          "Check app.ts",
          dir
        )

        expect(context.suggestions.length).toBeGreaterThan(0)
        expect(context.suggestions[0]).toContain("FILE")
      } finally {
        cleanup()
      }
    })

    it("generates suggestions for detected skills", async () => {
      const context = await extractInstantContext(
        "React component help",
        "/tmp"
      )

      expect(context.suggestions.some(s => s.includes("SKILL"))).toBe(true)
    })
  })

  describe("disabled", () => {
    it("returns empty context when disabled", async () => {
      const context = await extractInstantContext(
        "React TypeScript error TS2322",
        "/tmp",
        { enabled: false }
      )

      expect(context.files.length).toBe(0)
      expect(context.skills.length).toBe(0)
      expect(context.errorPatterns.length).toBe(0)
    })
  })
})

describe("formatInstantContext", () => {
  it("formats files section", () => {
    const formatted = formatInstantContext({
      files: [{ path: "app.ts", preview: "content" }],
      skills: [],
      errorPatterns: [],
      suggestions: [],
    })

    expect(formatted).toContain("[Detected Files]")
    expect(formatted).toContain("app.ts")
  })

  it("formats skills section", () => {
    const formatted = formatInstantContext({
      files: [],
      skills: ["react-expert"],
      errorPatterns: [],
      suggestions: [],
    })

    expect(formatted).toContain("[Relevant Skills]")
    expect(formatted).toContain("react-expert")
  })

  it("formats error patterns section", () => {
    const formatted = formatInstantContext({
      files: [],
      skills: [],
      errorPatterns: ["TypeScript error"],
      suggestions: [],
    })

    expect(formatted).toContain("[Error Patterns]")
    expect(formatted).toContain("TypeScript error")
  })

  it("formats suggestions section", () => {
    const formatted = formatInstantContext({
      files: [],
      skills: [],
      errorPatterns: [],
      suggestions: ["Check the file"],
    })

    expect(formatted).toContain("[Suggestions]")
    expect(formatted).toContain("Check the file")
  })

  it("returns empty string for empty context", () => {
    const formatted = formatInstantContext({
      files: [],
      skills: [],
      errorPatterns: [],
      suggestions: [],
    })

    expect(formatted).toBe("")
  })
})
