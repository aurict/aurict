/**
 * Executor robustness katmanı testleri:
 *  - Edit failure diagnosis (A)
 *  - verifyLocalImports / symbol pre-verification (C)
 *  - analyzeToolError hint injection
 *  - summarizeToolOutput truncation
 *
 * isSubagent:true kullanılır — workdir içindeki yazma izinleri otomatik onaylanır,
 * bu sayede PermissionGate.wait() bloklanmaz.
 */

import { describe, it, expect, beforeAll, afterAll } from "bun:test"
import { mkdirSync, writeFileSync, rmSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"

let dir: string

beforeAll(() => {
  dir = join(tmpdir(), `aurict-exec-test-${Date.now()}`)
  mkdirSync(dir, { recursive: true })

  writeFileSync(join(dir, "lib.ts"), [
    "export const foo = 42",
    "export function bar() { return 'bar' }",
    "export interface Baz { x: number }",
  ].join("\n"))
})

afterAll(() => {
  try { rmSync(dir, { recursive: true, force: true }) } catch {}
})

function ctx(extra: Record<string, unknown> = {}) {
  return {
    workdir: dir,
    sessionId: "test",
    signal: new AbortController().signal,
    provider: "anthropic",
    model: "test",
    isSubagent: true,   // auto-approve writes inside workdir
    ...extra,
  }
}

// ── A: Edit failure diagnosis ─────────────────────────────────────────────────

describe("edit tool — pattern-completion diagnosis (A)", () => {
  it("error contains 'pattern-completed' hint when old_string not found", async () => {
    const { editTool } = await import("../src/tool/built-in/edit.js")
    const f = join(dir, "edit-miss.ts")
    writeFileSync(f, "const x = 1\n")

    const res = await editTool.execute(
      { path: f, old_string: "const y = 999", new_string: "const y = 1" },
      ctx(),
    )

    expect(res.error).toBeDefined()
    expect(res.error).toContain("pattern-completed")
    expect(res.error).toContain("read")
  })

  it("succeeds when old_string matches exactly", async () => {
    const { editTool } = await import("../src/tool/built-in/edit.js")
    const f = join(dir, "edit-ok.ts")
    writeFileSync(f, "const x = 1\n")

    const res = await editTool.execute(
      { path: f, old_string: "const x = 1", new_string: "const x = 2" },
      ctx(),
    )

    expect(res.error).toBeUndefined()
    expect(res.output).toContain("Updated")
  })

  it("unique-count error preserved when old_string appears multiple times", async () => {
    const { editTool } = await import("../src/tool/built-in/edit.js")
    const f = join(dir, "edit-dup.ts")
    writeFileSync(f, "const x = 1\nconst x = 1\n")

    const res = await editTool.execute(
      { path: f, old_string: "const x = 1", new_string: "const y = 1" },
      ctx(),
    )
    expect(res.error).toBeDefined()
    expect(res.error).toContain("2 times")
  })
})

// ── C: Symbol pre-verification ────────────────────────────────────────────────

describe("symbol pre-verification (C)", () => {
  it("allows write when named import exists in local file", async () => {
    const { executeTool } = await import("../src/tool/executor.js")
    const { writeTool }   = await import("../src/tool/built-in/write.js")

    const content = "import { foo } from './lib'\nconsole.log(foo)\n"
    const res = await executeTool(writeTool, { path: join(dir, "consumer-ok.ts"), content }, ctx())

    // foo exists in lib.ts — should NOT be blocked
    expect(res.error).toBeUndefined()
  })

  it("warns but allows write when a local import pre-check may be a false positive", async () => {
    const { executeTool } = await import("../src/tool/executor.js")
    const { writeTool }   = await import("../src/tool/built-in/write.js")

    const content = "import { phantomExport } from './lib'\nconsole.log(phantomExport)\n"
    const res = await executeTool(writeTool, { path: join(dir, "consumer-bad.ts"), content }, ctx())

    expect(res.error).toBeUndefined()
    expect(res.output).toContain("phantomExport")
    expect(res.output).toContain("Import pre-check warning")
    expect(await Bun.file(join(dir, "consumer-bad.ts")).text()).toBe(content)
  })

  it("does NOT block when importing from non-existent file (may be created later)", async () => {
    const { executeTool } = await import("../src/tool/executor.js")
    const { writeTool }   = await import("../src/tool/built-in/write.js")

    const content = "import { something } from './future-module'\nconsole.log(something)\n"
    const res = await executeTool(writeTool, { path: join(dir, "consumer-future.ts"), content }, ctx())

    // Target file doesn't exist → skip check, allow
    expect(res.error).toBeUndefined()
  })

  it("allows write for non-typed files (no import check)", async () => {
    const { executeTool } = await import("../src/tool/executor.js")
    const { writeTool }   = await import("../src/tool/built-in/write.js")

    const content = "import { phantomFn } from './lib'\n"
    const res = await executeTool(writeTool, { path: join(dir, "plain.py"), content }, ctx())

    // Python file — TYPED_FILE_RE doesn't match → no import check
    expect(res.error).toBeUndefined()
  })
})

describe("post-edit verification metadata", () => {
  it("records skipped TSC verification for comment-only TypeScript edits", async () => {
    const { executeTool } = await import("../src/tool/executor.js")
    const { editTool }    = await import("../src/tool/built-in/edit.js")
    const f = join(dir, "comment-only.ts")
    writeFileSync(f, "// old comment\nconst value: number = 1\n")

    const res = await executeTool(
      editTool,
      { path: f, old_string: "// old comment", new_string: "// new comment" },
      ctx(),
    )

    expect(res.error).toBeUndefined()
    expect(res.metadata?.verification?.tsc?.status).toBe("skipped")
    expect(res.metadata?.verification?.tsc?.reason).toBe("non-type change")
  })
})

// ── analyzeToolError — hint injection ────────────────────────────────────────

describe("analyzeToolError", () => {
  it("ENOENT produces a hint about path verification", async () => {
    const { executeTool } = await import("../src/tool/executor.js")
    const { readTool }    = await import("../src/tool/built-in/read.js")

    const res = await executeTool(readTool, { path: join(dir, "xyz-does-not-exist.ts") }, ctx())

    expect(res.error).toBeDefined()
    const lower = (res.error ?? "").toLowerCase()
    // hint should mention path/directory check
    expect(lower.includes("path") || lower.includes("enoent") || lower.includes("no such")).toBe(true)
  })
})

// ── summarizeToolOutput ───────────────────────────────────────────────────────

describe("summarizeToolOutput", () => {
  it("large output is truncated with a durable continuation handle", async () => {
    const { executeTool } = await import("../src/tool/executor.js")
    const { bashTool }    = await import("../src/tool/built-in/bash.js")

    // Exceed the bounded adaptive default (16k when model info is unavailable).
    const cmd = "seq 1 1000 | while read i; do printf 'line %04d: xxxxxxxxxxxxxxxxxxxxxxxxxx\\n' $i; done"
    const res = await executeTool(bashTool, { command: cmd }, ctx())
    if (res.error) return  // bash unavailable — skip

    const out = res.output ?? ""
    expect(out).toContain("omitted")
    expect(out).toContain("tool-output:")
    expect(out).toContain("read_tool_output")
    // Should never blow up beyond reasonable limit
    expect(out.length).toBeLessThan(20_000)
  })

  it("keeps the complete UI diff when the model-facing write output is truncated", async () => {
    const { executeTool } = await import("../src/tool/executor.js")
    const { writeTool } = await import("../src/tool/built-in/write.js")
    const content = Array.from({ length: 80 }, (_, index) => `line-${index}`).join("\n")
    const res = await executeTool(
      writeTool,
      { path: join(dir, "large-diff.txt"), content },
      ctx({ truncation: { maxChars: 200 } }),
    )

    expect(res.output).toContain("read_tool_output")
    expect(res.metadata?.uiArtifact?.rawDiff).toContain("+line-79")
  })
})
