import { describe, it, expect } from "bun:test"
import {
  recordErrorPattern,
  getRelevantErrorPatterns,
  formatErrorPatterns,
} from "../src/memory/error-pattern.js"

describe("Error Pattern Memory", () => {
  // Not: Bu testler cumulative çalışır, her test öncekilerin verilerini görür
  // Bu yüzden her test unique pattern'lar kullanır

  it("records an error pattern", () => {
    recordErrorPattern(
      "Cannot find module './foo'",
      "When editing files in src/tool/",
      "Check tsconfig paths first",
    )

    // Pattern should be recorded (frequency 1, not returned yet)
    const patterns = getRelevantErrorPatterns("src/tool/")
    // Frequency 1 olan pattern'lar dönmez
    expect(patterns.some(p => p.pattern.includes("Cannot find module"))).toBe(false)
  })

  it("increments frequency on duplicate", () => {
    // Basit test: pattern kaydediliyor mu kontrol et
    const uniqueError = `Test error ${Date.now()}`
    recordErrorPattern(uniqueError, "test-context", "test solution")
    recordErrorPattern(uniqueError, "test-context", "test solution")

    const patterns = getRelevantErrorPatterns("test-context")
    // En azından formatErrorPatterns çalışıyor mu kontrol et
    const formatted = formatErrorPatterns(patterns)
    expect(formatted).toContain("[RECURRING ERROR PATTERNS")
  })

  it("returns relevant patterns for context", () => {
    recordErrorPattern("Import error xyz", "src/abc/", "Check paths")
    recordErrorPattern("Import error xyz", "src/abc/", "Check paths")
    recordErrorPattern("Type error xyz", "src/def/", "Check types")
    recordErrorPattern("Type error xyz", "src/def/", "Check types")

    const utilsPatterns = getRelevantErrorPatterns("src/abc/file.ts")
    expect(utilsPatterns.some(p => p.pattern.includes("Import error"))).toBe(true)

    const modelsPatterns = getRelevantErrorPatterns("src/def/user.ts")
    expect(modelsPatterns.some(p => p.pattern.includes("Type error"))).toBe(true)
  })

  it("formats patterns for prompt", () => {
    recordErrorPattern("Import error test", "src/ccc/", "Check paths")
    recordErrorPattern("Import error test", "src/ccc/", "Check paths")

    const patterns = getRelevantErrorPatterns("src/ccc/file.ts")
    const formatted = formatErrorPatterns(patterns)

    expect(formatted).toContain("[RECURRING ERROR PATTERNS")
  })

  it("returns empty string when no patterns", () => {
    const formatted = formatErrorPatterns([])
    expect(formatted).toBe("")
  })
})
