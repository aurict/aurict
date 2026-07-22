import { describe, expect, it } from "bun:test"
import { formatCanonicalAgentState } from "../src/context/canonical-agent-state.js"

describe("background post-edit verification state", () => {
  it("is visible in the canonical agent state", () => {
    const state = formatCanonicalAgentState({
      context: {
        version: 1,
        objective: "Fix types",
        constraints: [], decisions: [], workspaceFacts: [], relevantFiles: [],
        failedStrategies: [], openQuestions: [], tasks: [], evidenceRefs: [], updatedAt: 1,
      },
      backgroundVerification: [{
        id: "job-1", filePath: "src/a.ts", status: "failed",
        output: "TS2322", startedAt: 1, finishedAt: 2,
      }],
    })
    expect(state).toContain("Background verification: src/a.ts:failed (TS2322)")
  })
})
