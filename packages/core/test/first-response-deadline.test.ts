import { describe, expect, it } from "bun:test"
import { createFirstResponseDeadline } from "../src/agent/first-response-deadline.js"

describe("first response deadline", () => {
  it("does not arm a first-event timeout for non-streaming generation", async () => {
    const deadline = createFirstResponseDeadline({ enabled: false, timeoutMs: 1 })
    await Bun.sleep(5)
    expect(deadline.isArmed()).toBe(false)
    expect(deadline.signal.aborted).toBe(false)
  })

  it("aborts a streaming request that produces no event", async () => {
    const deadline = createFirstResponseDeadline({ enabled: true, timeoutMs: 1 })
    await Bun.sleep(5)
    expect(deadline.signal.aborted).toBe(true)
  })

  it("disarms after the first streaming event", async () => {
    const deadline = createFirstResponseDeadline({ enabled: true, timeoutMs: 5 })
    deadline.markResponse()
    await Bun.sleep(10)
    expect(deadline.signal.aborted).toBe(false)
  })
})
