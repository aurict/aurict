import { describe, expect, it } from "bun:test"
import { mergeStickyToolSelection } from "../src/agent/sticky-tool-selection.js"

describe("sticky tool selection", () => {
  it("keeps prior capabilities in canonical registry order", () => {
    expect(mergeStickyToolSelection({
      current: ["grep", "edit"],
      previous: ["read", "grep"],
      available: ["read", "edit", "grep", "bash"],
      maxVisible: 4,
    })).toEqual(["read", "edit", "grep"])
  })

  it("never widens an explicit tools override", () => {
    expect(mergeStickyToolSelection({
      current: ["read", "edit"],
      previous: ["bash"],
      available: ["read", "edit", "bash"],
      allowed: ["read"],
      maxVisible: 4,
    })).toEqual(["read"])
  })
})
