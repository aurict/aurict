import { describe, expect, it } from "bun:test"
import { mkdtemp, readdir, rm } from "node:fs/promises"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { evalTool } from "../src/tool/built-in/eval.js"

describe("stateless eval", () => {
  it("runs an isolated Bun hypothesis and leaves the workspace untouched", async () => {
    const workdir = await mkdtemp(join(tmpdir(), "aurict-eval-test-"))
    try {
      const result = await evalTool.execute({
        runtime: "bun", code: "console.log(/a+/.test('aaa'))", timeout_ms: 2_000, cwd: "temp",
      }, { sessionId: "test", workdir, signal: new AbortController().signal })
      expect(result.error).toBeUndefined()
      expect(result.output).toContain("true")
      expect(await readdir(workdir)).toEqual([])
    } finally { await rm(workdir, { recursive: true, force: true }) }
  })

  it("reports non-zero exits as explicit errors", async () => {
    const result = await evalTool.execute({
      runtime: "bun", code: "process.exit(7)", timeout_ms: 2_000, cwd: "temp",
    }, { sessionId: "test", workdir: process.cwd(), signal: new AbortController().signal })
    expect(result.error).toContain("code 7")
  })
})
