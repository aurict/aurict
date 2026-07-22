import { describe, expect, it } from "bun:test"
import { isAgentFeatureEnabled } from "../src/agent/runtime-features.js"

describe("agent runtime feature rollout", () => {
  it("supports an immediate per-feature kill switch", () => {
    expect(isAgentFeatureEnabled("prompt_tiering", {}, "session", {
      AURICT_DISABLE_AGENT_FEATURES: "prompt_tiering,utility_model",
    })).toBe(false)
  })

  it("uses a deterministic staged rollout bucket", () => {
    const config = { agentFeatures: { rolloutPercent: 37 } }
    const first = isAgentFeatureEnabled("canonical_state", config, "session-42", {})
    expect(isAgentFeatureEnabled("canonical_state", config, "session-42", {})).toBe(first)
  })

  it("rejects invalid rollout percentages loudly", () => {
    expect(() => isAgentFeatureEnabled("canonical_state", {}, "session", {
      AURICT_AGENT_ROLLOUT_PERCENT: "not-a-number",
    })).toThrow("must be numeric")
  })
})
