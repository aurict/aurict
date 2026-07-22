import { describe, expect, it } from "bun:test"
import { parseRunAgentArgs, runAgentHelp } from "../src/headless/run-agent.js"

describe("run-agent CLI contract", () => {
  it("parses pinned headless limits and output paths", () => {
    const options = parseRunAgentArgs([
      "fix the tests", "--provider", "openai", "--model", "gpt-test",
      "--timeout", "30s", "--max-steps", "12", "--max-cost-usd", "2.5",
      "--events", "events.jsonl", "--result", "result.json", "--yes",
    ], "/workspace")
    expect(options.instruction).toBe("fix the tests")
    expect(options.provider).toBe("openai")
    expect(options.timeoutMs).toBe(30_000)
    expect(options.maxSteps).toBe(12)
    expect(options.allowPermissions).toBe(true)
  })

  it("rejects ambiguous routing and stdout multiplexing", () => {
    expect(() => parseRunAgentArgs(["task", "--auto-model", "--provider", "openai"])).toThrow("cannot be combined")
    expect(() => parseRunAgentArgs(["task", "--events", "-"])).toThrow("do not share stdout")
  })

  it("documents explicit permission and machine-output behavior", () => {
    const help = runAgentHelp()
    expect(help).toContain("default: deny")
    expect(help).toContain("JSONL")
  })
})
