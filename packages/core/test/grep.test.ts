import { describe, it, expect, beforeEach, afterEach } from "bun:test"
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { grepTool } from "../src/tool/built-in/grep.js"
import type { ToolContext } from "../src/tool/types.js"

let tmpDir: string
let ctx: ToolContext

// ─── fixture ─────────────────────────────────────────────────────────────────
//
//  tmpDir/
//    src/
//      auth.ts   — "export function login() {}"  "export const TOKEN = 'abc'"
//      util.ts   — "export function helper() {}" "const x = helper()"
//    lib/
//      utils.js  — "module.exports = { hello: 'world' }"

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "aurict-grep-"))
  mkdirSync(join(tmpDir, "src"), { recursive: true })
  mkdirSync(join(tmpDir, "lib"), { recursive: true })

  writeFileSync(join(tmpDir, "src", "auth.ts"), [
    "export function login() {}",
    "export const TOKEN = 'abc'",
    "// FIXME: add logout",
  ].join("\n"))

  writeFileSync(join(tmpDir, "src", "util.ts"), [
    "export function helper() {}",
    "const x = helper()",
    "export default helper",
  ].join("\n"))

  writeFileSync(join(tmpDir, "lib", "utils.js"), [
    "module.exports = { hello: 'world' }",
    "// helper function below",
    "function helper() { return 42 }",
  ].join("\n"))

  ctx = {
    sessionId: "test",
    workdir:   tmpDir,
    signal:    new AbortController().signal,
  }
})

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true })
})

// ─── basic search ────────────────────────────────────────────────────────────

describe("grepTool — basic search", () => {
  it("finds pattern across all files", async () => {
    const r = await grepTool.execute({ pattern: "helper" }, ctx)
    expect(r.output).toContain("helper")
    // Should match in both util.ts and utils.js
    expect(r.output.split("\n").length).toBeGreaterThanOrEqual(2)
  })

  it("returns '(no matches)' when pattern not found", async () => {
    const r = await grepTool.execute({ pattern: "zzznomatch" }, ctx)
    expect(r.output).toBe("(no matches)")
  })

  it("output format is 'file:line: content'", async () => {
    const r = await grepTool.execute({ pattern: "login" }, ctx)
    expect(r.output).toMatch(/^src\/auth\.ts:\d+: /)
  })

  it("includes correct 1-based line number", async () => {
    const r = await grepTool.execute({ pattern: "TOKEN" }, ctx)
    // TOKEN is on line 2 of auth.ts
    expect(r.output).toContain("src/auth.ts:2:")
  })

  it("trims whitespace from matched line content", async () => {
    // Write file with leading spaces
    writeFileSync(join(tmpDir, "src", "spaced.ts"), "   const x = 1\n")
    const r = await grepTool.execute({ pattern: "const x" }, ctx)
    const line = r.output.split("\n").find((l) => l.includes("spaced.ts"))!
    // Content after "file:line: " should be trimmed
    const content = line.split(": ").slice(2).join(": ")
    expect(content.startsWith(" ")).toBe(false)
  })
})

// ─── case sensitivity ────────────────────────────────────────────────────────

describe("grepTool — case sensitivity", () => {
  it("search is case-insensitive by default", async () => {
    const r = await grepTool.execute({ pattern: "EXPORT" }, ctx)
    expect(r.output).not.toBe("(no matches)")
    expect(r.output).toContain("export")
  })

  it("uppercase pattern matches lowercase content when case_sensitive=false", async () => {
    const r = await grepTool.execute({ pattern: "HELPER", case_sensitive: false }, ctx)
    expect(r.output).not.toBe("(no matches)")
  })

  it("case_sensitive=true does not match wrong case", async () => {
    // "HELPER" — only exists as "helper" (lowercase)
    const r = await grepTool.execute({ pattern: "HELPER", case_sensitive: true }, ctx)
    expect(r.output).toBe("(no matches)")
  })

  it("case_sensitive=true matches exact case", async () => {
    const r = await grepTool.execute({ pattern: "TOKEN", case_sensitive: true }, ctx)
    expect(r.output).toContain("TOKEN")
  })
})

// ─── glob filter ─────────────────────────────────────────────────────────────

describe("grepTool — glob filter", () => {
  it("glob=**/*.ts restricts to TypeScript files only", async () => {
    const r = await grepTool.execute({ pattern: "helper", glob: "**/*.ts" }, ctx)
    // All result lines must reference .ts files
    const resultLines = r.output.split("\n").filter((l) => !l.startsWith("..."))
    expect(resultLines.length).toBeGreaterThan(0)
    expect(resultLines.every((l) => l.includes(".ts"))).toBe(true)
    expect(r.output).not.toContain(".js")
  })

  it("glob=**/*.js restricts to JavaScript files only", async () => {
    const r = await grepTool.execute({ pattern: "helper", glob: "**/*.js" }, ctx)
    expect(r.output).toContain(".js")
    expect(r.output).not.toContain(".ts")
  })

  it("glob pattern with no matching extension → '(no matches)'", async () => {
    const r = await grepTool.execute({ pattern: "helper", glob: "**/*.py" }, ctx)
    expect(r.output).toBe("(no matches)")
  })
})

// ─── path restriction ────────────────────────────────────────────────────────

describe("grepTool — path restriction", () => {
  it("path restricts search to a subdirectory", async () => {
    // Search only in src/ — should find helper in util.ts, not utils.js
    const r = await grepTool.execute({ pattern: "helper", path: "src" }, ctx)
    expect(r.output).not.toContain("lib/")
  })

  it("path to src finds auth.ts results", async () => {
    const r = await grepTool.execute({ pattern: "login", path: "src" }, ctx)
    expect(r.output).toContain("auth.ts")
  })
})

// ─── truncation ──────────────────────────────────────────────────────────────

describe("grepTool — 200-match truncation", () => {
  it("adds truncation notice when matches exceed 200", async () => {
    // Create file with 210 matching lines
    const lines = Array.from({ length: 210 }, (_, i) => `const MATCH_${i} = true`)
    writeFileSync(join(tmpDir, "src", "big.ts"), lines.join("\n"))
    const r = await grepTool.execute({ pattern: "MATCH" }, ctx)
    expect(r.output).toContain("truncated at 200")
  })
})

// ─── regex patterns ──────────────────────────────────────────────────────────

describe("grepTool — regex patterns", () => {
  it("supports regex metacharacters", async () => {
    const r = await grepTool.execute({ pattern: "export (function|const)" }, ctx)
    expect(r.output).not.toBe("(no matches)")
  })

  it("empty pattern matches all lines (regex /.*/)", async () => {
    const r = await grepTool.execute({ pattern: "" }, ctx)
    // Empty pattern matches everything
    expect(r.output).not.toBe("(no matches)")
  })
})
