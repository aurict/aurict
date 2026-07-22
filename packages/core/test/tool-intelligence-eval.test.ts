import { describe, expect, it } from "bun:test"
import { runToolIntelligenceEval } from "../src/eval/tool-intelligence-eval.js"
import { formatAvailableToolPolicy } from "../src/agent/prompt-tier.js"

describe("tool intelligence routing eval", () => {
  it("routes every new capability within a compact tool budget", () => {
    const result = runToolIntelligenceEval()
    expect(result.passed).toBe(result.total)
    expect(result.cases.every(testCase => testCase.selected.length <= 16)).toBe(true)
  })

  it("only emits guidance for tools visible in the current turn", () => {
    const policy = formatAvailableToolPolicy(["read", "dep_docs"], 10)
    expect(policy).toContain("exact installed version")
    expect(policy).not.toContain("AST edits require")
    expect(policy).not.toContain("Open one browser session")
  })
})
