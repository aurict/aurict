import { describe, expect, it } from "bun:test"
import { formatCanonicalAgentState } from "../src/context/canonical-agent-state.js"

describe("canonical agent state", () => {
  it("renders objective, files, failures, and verification without duplicate state blocks", () => {
    const output = formatCanonicalAgentState({
      context: {
        version: 1,
        objective: "fix the cache",
        constraints: [], decisions: [], workspaceFacts: [], openQuestions: [], evidenceRefs: ["verification:passed"],
        relevantFiles: [{ path: "src/cache.ts", reason: "changed", status: "changed" }],
        failedStrategies: [{ fingerprint: "x", summary: "TTL-only invalidation", attempts: 2 }],
        tasks: [{ id: "t1", subject: "Fix cache", status: "in_progress", blockedBy: [] }],
        updatedAt: 1,
      },
      ledger: {
        objective: "fix the cache", phase: "verifying", openSteps: [], changedFiles: ["src/cache.ts"],
        verification: { status: "passed", summary: "tests passed" }, recoveryAttempts: [], blockers: [], lastProgressAt: 1,
      },
    })
    expect(output.match(/Objective:/g)).toHaveLength(1)
    expect(output.match(/src\/cache\.ts/g)).toHaveLength(1)
    expect(output).toContain("Verification: passed")
    expect(output).toContain("aurict_status")
  })
})
