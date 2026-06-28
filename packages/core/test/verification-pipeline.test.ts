import { describe, expect, it } from "bun:test"
import { verificationSummary, withTscVerification } from "../src/verification/pipeline.js"

describe("verification pipeline metadata", () => {
  it("merges TSC verification metadata into execute results", () => {
    const result = withTscVerification(
      { output: "ok", metadata: { changedFiles: ["src/a.ts"] } },
      { status: "passed" },
    )

    expect(result.metadata?.changedFiles).toEqual(["src/a.ts"])
    expect(result.metadata?.verification?.tsc?.status).toBe("passed")
    expect(verificationSummary(result)).toBe("verified:tsc")
  })

  it("summarizes skipped verification with reason", () => {
    const result = withTscVerification(
      { output: "ok" },
      { status: "skipped", reason: "non-type change" },
    )

    expect(verificationSummary(result)).toBe("skipped:tsc:non-type change")
  })
})
