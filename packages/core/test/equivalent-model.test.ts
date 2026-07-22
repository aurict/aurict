import { describe, expect, it } from "bun:test"
import { selectEquivalentFallbackModel } from "../src/provider/equivalent-model.js"
import { createMockProvider } from "./helpers.js"

describe("equivalent fallback model selection", () => {
  it("prefers a tool-capable context-equivalent model over the provider default", () => {
    const provider = createMockProvider({
      id: "fallback-test",
      defaultModel: "tiny-default",
      models: [
        { id: "tiny-default", name: "Tiny", contextWindow: 8_000, maxOutput: 1_000, supportsTools: false, supportsVision: false },
        { id: "capable", name: "Capable", contextWindow: 128_000, maxOutput: 8_000, supportsTools: true, supportsVision: true, supportsThinking: true },
      ],
    })
    const selected = selectEquivalentFallbackModel({
      id: "primary", name: "Primary", contextWindow: 128_000, maxOutput: 8_000,
      supportsTools: true, supportsVision: true, supportsThinking: true,
    }, provider)
    expect(selected.model).toBe("capable")
  })
})
