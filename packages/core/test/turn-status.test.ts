import { describe, expect, it } from "bun:test"
import type { CoreMessage } from "ai"
import { createTurnStatusFilter, extractTurnStatus, stripTurnStatusFromMessages } from "../src/agent/turn-status.js"

describe("structured turn status", () => {
  it("extracts and strips a completed status", () => {
    expect(extractTurnStatus("All set.\n<aurict_status state=\"done\"></aurict_status>"))
      .toEqual({ text: "All set.", status: { state: "done", reason: "" } })
  })

  it("filters a marker split across streaming chunks", () => {
    const filter = createTurnStatusFilter()
    const visible = [
      filter.feed("Working result.<auri"),
      filter.feed("ct_status state=\"blocked\">need approval"),
      filter.feed("</aurict_status>"),
      filter.flush(),
    ].join("")
    expect(visible).toBe("Working result.")
    expect(filter.status()).toEqual({ state: "blocked", reason: "need approval" })
  })

  it("removes machine status from assistant history parts", () => {
    const messages = [{
      role: "assistant",
      content: [{ type: "text", text: "Done<aurict_status state='done'></aurict_status>" }],
    }] as CoreMessage[]
    const content = stripTurnStatusFromMessages(messages)[0]?.content
    expect(Array.isArray(content) ? content[0]?.text : undefined).toBe("Done")
  })
})
