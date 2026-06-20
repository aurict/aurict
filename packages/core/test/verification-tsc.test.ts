import { describe, it, expect, beforeEach } from "bun:test"
import { shouldRunTsc, filterTscForFile, clearTscCache } from "../src/verification/tsc.js"

describe("shouldRunTsc", () => {
  it("returns false for non-TypeScript files", () => {
    expect(shouldRunTsc("file.js", "old", "new")).toBe(false)
    expect(shouldRunTsc("file.txt", "old", "new")).toBe(false)
    expect(shouldRunTsc("file.md", "old", "new")).toBe(false)
  })

  it("returns true for TypeScript files", () => {
    expect(shouldRunTsc("file.ts", "old", "new")).toBe(true)
    expect(shouldRunTsc("file.tsx", "old", "new")).toBe(true)
    expect(shouldRunTsc("file.mts", "old", "new")).toBe(true)
  })

  it("returns false when content is unchanged", () => {
    expect(shouldRunTsc("file.ts", "same", "same")).toBe(false)
  })

  it("returns false for comment-only changes", () => {
    const oldCode = `
// This is a comment
const x = 5
function foo() { return x }
`
    const newCode = `
// This is a different comment
const x = 5
function foo() { return x }
`
    expect(shouldRunTsc("file.ts", oldCode, newCode)).toBe(false)
  })

  it("returns false for multi-line comment changes", () => {
    const oldCode = `
/* Old comment */
const x = 5
`
    const newCode = `
/* New comment */
const x = 5
`
    expect(shouldRunTsc("file.ts", oldCode, newCode)).toBe(false)
  })

  it("returns true for actual code changes", () => {
    const oldCode = `
const x = 5
function foo() { return x }
`
    const newCode = `
const x = 10
function foo() { return x }
`
    expect(shouldRunTsc("file.ts", oldCode, newCode)).toBe(true)
  })

  it("returns true when adding new code", () => {
    const oldCode = `const x = 5`
    const newCode = `
const x = 5
const y = 10
`
    expect(shouldRunTsc("file.ts", oldCode, newCode)).toBe(true)
  })
})

describe("filterTscForFile", () => {
  it("returns empty string for empty input", () => {
    expect(filterTscForFile("", "file.ts")).toBe("")
  })

  it("returns checkmark for success", () => {
    expect(filterTscForFile("✓", "file.ts")).toBe("✓")
  })

  it("filters errors for specific file", () => {
    const tscOutput = `
src/file1.ts(10,5): error TS2322: Type 'string' is not assignable
src/file2.ts(20,3): error TS2345: Argument not assignable
src/file1.ts(15,8): error TS2339: Property does not exist
`
    const filtered = filterTscForFile(tscOutput, "src/file1.ts")
    expect(filtered).toContain("file1.ts")
    expect(filtered).toContain("TS2322")
    expect(filtered).toContain("TS2339")
    expect(filtered).not.toContain("file2.ts")
  })

  it("limits output to 12 lines", () => {
    const lines = Array.from({ length: 20 }, (_, i) => 
      `src/file.ts(${i},1): error TS${i}: Some error`
    ).join("\n")
    
    const filtered = filterTscForFile(lines, "src/file.ts")
    const lineCount = filtered.split("\n").length
    expect(lineCount).toBeLessThanOrEqual(12)
  })

  it("returns empty string when no errors for file", () => {
    const tscOutput = `
src/other.ts(10,5): error TS2322: Type error
`
    const filtered = filterTscForFile(tscOutput, "src/file.ts")
    expect(filtered).toBe("")
  })
})

describe("clearTscCache", () => {
  beforeEach(() => {
    clearTscCache()
  })

  it("clears cache without error", () => {
    expect(() => clearTscCache()).not.toThrow()
  })
})
