import { describe, expect, it } from "bun:test"
import { buildBoundedSummaryTranscript } from "../src/session/summary-input.js"

describe("buildBoundedSummaryTranscript", () => {
  it("keeps recent messages and flattens provider message structures", () => {
    const transcript = buildBoundedSummaryTranscript([
      { role: "user", content: "old ".repeat(8_000) },
      { role: "assistant", content: "recent decision" },
      { role: "user", content: "latest blocker" },
    ], 1_000)
    expect(transcript).toContain("latest blocker")
    expect(transcript).toContain("recent decision")
    expect(transcript.length).toBeLessThan(15_000)
  })
})
