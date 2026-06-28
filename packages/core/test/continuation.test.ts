import { describe, expect, it } from "bun:test"
import { evaluateContinuation, hasOpenContinuationTasks, shouldContinueAgentRun, stalledMidTask } from "../src/agent/continuation.js"

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

  it("returns structured continuation reason and increments budget", () => {
    const decision = evaluateContinuation({
      text: "I will now run the tests",
      finishReason: "stop",
      newMessageCount: 1,
    }, { previousContinuations: 2, maxContinuations: 5 })

    expect(decision.shouldContinue).toBe(true)
    expect(decision.reason).toBe("stalled_text")
    expect(decision.nextContinuationCount).toBe(3)
    expect(decision.maxContinuations).toBe(5)
  })

  it("uses a larger task-driven budget for open tasks", () => {
    const decision = evaluateContinuation({
      text: "Still working.",
      finishReason: "stop",
      newMessageCount: 1,
      tasks: [{ status: "in_progress" }],
    }, { previousContinuations: 5, maxContinuations: 5, maxTaskContinuations: 15 })

    expect(decision.shouldContinue).toBe(true)
    expect(decision.reason).toBe("open_tasks")
    expect(decision.maxContinuations).toBe(15)
  })

  it("stops with budget_exhausted when continuation limit is reached", () => {
    const decision = evaluateContinuation({
      text: "I will now continue with the remaining verification",
      finishReason: "stop",
      newMessageCount: 1,
    }, { previousContinuations: 5, maxContinuations: 5 })

    expect(decision.shouldContinue).toBe(false)
    expect(decision.reason).toBe("stalled_text")
    expect(decision.stopReason).toBe("budget_exhausted")
  })
})
