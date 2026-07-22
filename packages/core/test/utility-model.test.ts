import { describe, expect, it } from "bun:test"
import { resolveUtilityModel } from "../src/provider/utility-model.js"

describe("resolveUtilityModel", () => {
  it("honors a fully configured utility route", () => {
    const route = resolveUtilityModel({
      utilityModel: { provider: "openai", model: "gpt-4o-mini", maxInputTokens: 8_000, maxOutputTokens: 500 },
    }, "anthropic", "claude-opus-4-1")
    expect(route).toMatchObject({
      provider: "openai",
      model: "gpt-4o-mini",
      maxInputTokens: 8_000,
      maxOutputTokens: 500,
      source: "configured",
    })
  })

  it("rejects a partial utility route instead of silently guessing", () => {
    expect(() => resolveUtilityModel({ utilityModel: { provider: "openai" } }, "openai", "gpt-4o"))
      .toThrow("configured together")
  })
})
