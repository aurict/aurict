import { describe, expect, it } from "bun:test"
import { shouldAutoContinue, stalledMidTask } from "../src/tui/auto-continue.js"
import type { Task } from "@aurict/core"

const openTask: Task = {
  id: "1",
  subject: "Run verification",
  status: "in_progress",
  blockedBy: [],
}

describe("auto-continue detection", () => {
  it("detects unfinished prose that announces the next action", () => {
    expect(stalledMidTask("I found the issue. Next, I will update the parser")).toBe(true)
    expect(stalledMidTask("Şimdi testleri çalıştıracağım.")).toBe(true)
  })

  it("continues on output length limits", () => {
    expect(shouldAutoContinue({
      text: "Partial result",
      finishReason: "length",
      newMessageCount: 1,
      tasks: [],
    })).toBe(true)
  })

  it("continues while project tasks remain open", () => {
    expect(shouldAutoContinue({
      text: "Implemented the first file.",
      finishReason: "stop",
      newMessageCount: 1,
      tasks: [openTask],
    })).toBe(true)
  })

  it("does not continue when the model clearly reports a blocker", () => {
    expect(shouldAutoContinue({
      text: "Blocked: I need your API key before I can continue.",
      finishReason: "stop",
      newMessageCount: 1,
      tasks: [openTask],
    })).toBe(false)
  })
})
