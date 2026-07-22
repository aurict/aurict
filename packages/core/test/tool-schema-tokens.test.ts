import { describe, expect, it } from "bun:test"
import { countToolSchemaTokens } from "../src/tool/schema-cache.js"

describe("tool schema token accounting", () => {
  it("measures actual schema shapes instead of a flat per-tool constant", async () => {
    const read = await countToolSchemaTokens(["read"], "gpt-4o")
    const patch = await countToolSchemaTokens(["apply_patch"], "gpt-4o")
    expect(read).toBeGreaterThan(0)
    expect(patch).toBeGreaterThan(0)
    expect(read).not.toBe(patch)
  })
})
