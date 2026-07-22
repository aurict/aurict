import { describe, expect, it } from "bun:test"
import { parsePerTurnFacts, parseSessionFacts } from "../src/memory/extractor.js"

describe("memory extraction parsing", () => {
  it("accepts exact NONE only as the empty session result", () => {
    expect(parseSessionFacts("NONE")).toEqual([])
    expect(parseSessionFacts('[{"category":"fact","scope":"project","content":"The NONE constant is meaningful."}]'))
      .toHaveLength(1)
  })

  it("parses a bounded per-turn memories envelope", () => {
    expect(parsePerTurnFacts('{"memories":[{"category":"preference","scope":"global","content":"Use Bun."}]}'))
      .toEqual([{ category: "preference", scope: "global", content: "Use Bun." }])
  })
})
