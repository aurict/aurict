import { describe, expect, it } from "bun:test"
import { formatName } from "./formatName"

describe("formatName", () => {
  it("trims whitespace and title-cases words", () => {
    expect(formatName("  aURICT   terminal  agent ")).toBe("Aurict Terminal Agent")
  })

  it("handles single words", () => {
    expect(formatName("cODEX")).toBe("Codex")
  })
})
