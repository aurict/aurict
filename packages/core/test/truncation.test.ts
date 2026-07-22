import { describe, expect, it } from "bun:test"
import { adaptiveMaxChars, resolveTruncationConfig, truncateOutput } from "../src/tool/truncation.js"

describe("adaptive tool output truncation", () => {
  it("scales within bounded limits instead of using a universal 4000 chars", () => {
    expect(adaptiveMaxChars("read", 8_000)).toBe(12_000)
    expect(adaptiveMaxChars("read", 1_000_000)).toBe(48_000)
    expect(adaptiveMaxChars("bash", 1_000_000)).toBe(32_000)
  })

  it("keeps explicit user configuration authoritative", () => {
    expect(resolveTruncationConfig("read", { maxChars: 7_500 }, 1_000_000).maxChars).toBe(7_500)
  })

  it("summarizes grep matches by file before the preview", () => {
    const output = [
      ...Array.from({ length: 40 }, (_, index) => `src/a.ts:${index + 1}: match`),
      ...Array.from({ length: 20 }, (_, index) => `src/b.ts:${index + 1}: match`),
    ].join("\n")
    const result = truncateOutput(output, { maxChars: 100, strategy: "head_tail" }, "grep")
    expect(result).toContain("src/a.ts (40)")
    expect(result).toContain("src/b.ts (20)")
    expect(result).toContain("showing first 50")
  })
})
