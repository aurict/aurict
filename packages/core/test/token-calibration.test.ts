import { beforeEach, describe, expect, it } from "bun:test"
import { calibratedTokenEstimate, clearTokenCalibration, getTokenCalibration, recordTokenCalibration } from "../src/provider/token-calibration.js"

beforeEach(clearTokenCalibration)

describe("provider token calibration", () => {
  it("learns a bounded EWMA correction per provider and model", () => {
    recordTokenCalibration({ provider: "anthropic", model: "claude", estimatedInput: 1_000, actualInput: 1_500 })
    expect(getTokenCalibration("anthropic", "claude")?.factor).toBe(1.5)
    expect(calibratedTokenEstimate("anthropic", "claude", 2_000)).toBe(3_000)

    recordTokenCalibration({ provider: "anthropic", model: "claude", estimatedInput: 1_000, actualInput: 10_000 })
    expect(getTokenCalibration("anthropic", "claude")?.factor).toBeCloseTo(1.6)
  })

  it("does not leak calibration across models", () => {
    recordTokenCalibration({ provider: "anthropic", model: "a", estimatedInput: 100, actualInput: 200 })
    expect(calibratedTokenEstimate("anthropic", "b", 100)).toBe(100)
  })
})
