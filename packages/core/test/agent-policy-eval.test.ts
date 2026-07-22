import { describe, expect, it } from "bun:test"
import { compareAgentPolicies } from "../src/eval/agent-policy-eval.js"

describe("offline agent policy A/B harness", () => {
  it("keeps the current profile green and reports measurable deltas", () => {
    const comparison = compareAgentPolicies()
    expect(comparison.current.passed).toBe(comparison.current.total)
    expect(comparison.current.score).toBeGreaterThan(comparison.legacy.score)
    expect(comparison.current.metrics.promptChars).toBeLessThan(comparison.legacy.metrics.promptChars)
  })
})
