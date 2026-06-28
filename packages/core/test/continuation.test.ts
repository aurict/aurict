import { describe, expect, it } from "bun:test"
import { hasOpenContinuationTasks, shouldContinueAgentRun, stalledMidTask } from "../src/agent/continuation.js"

describe("continuation decision", () => {
  it("detects unfinished text", () => {
    expect(stalledMidTask("I will now update the tests")).toBe(true)
  })

  it("continues on length finish reason", () => {
    expect(shouldContinueAgentRun({ text: "partial", finishReason: "length", newMessageCount: 1 })).toBe(true)
  })

  it("continues while tasks are open unless blocked", () => {
    expect(hasOpenContinuationTasks([{ status: "in_progress" }])).toBe(true)
    expect(shouldContinueAgentRun({
      text: "Still working.",
      newMessageCount: 1,
      tasks: [{ status: "pending" }],
    })).toBe(true)
    expect(shouldContinueAgentRun({
      text: "I need your approval and cannot proceed.",
      newMessageCount: 1,
      tasks: [{ status: "pending" }],
    })).toBe(false)
  })
})

