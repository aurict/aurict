import { describe, it, expect, beforeEach, afterEach } from "bun:test"
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { globTool } from "../src/tool/built-in/glob.js"
import type { ToolContext } from "../src/tool/types.js"

let tmpDir: string
let ctx: ToolContext

// ─── fixture ─────────────────────────────────────────────────────────────────
//
//  tmpDir/
//    root.ts
//    README.md
//    src/
//      index.ts
//      util.ts
//      sub/
//        deep.ts
//    lib/
//      helper.js
//    node_modules/
//      react/
//        index.ts    ← must be skipped
//    .git/
//      config        ← must be skipped
//    dist/
//      bundle.js     ← must be skipped
//    __pycache__/
//      mod.pyc       ← must be skipped

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "aurict-glob-"))
  mkdirSync(join(tmpDir, "src", "sub"),           { recursive: true })
  mkdirSync(join(tmpDir, "lib"),                  { recursive: true })
  mkdirSync(join(tmpDir, "node_modules", "react"),{ recursive: true })
  mkdirSync(join(tmpDir, ".git"),                 { recursive: true })
  mkdirSync(join(tmpDir, "dist"),                 { recursive: true })
  mkdirSync(join(tmpDir, "__pycache__"),          { recursive: true })

  writeFileSync(join(tmpDir, "root.ts"),                    "export const root = 1")
  writeFileSync(join(tmpDir, "README.md"),                  "# readme")
  writeFileSync(join(tmpDir, "src", "index.ts"),            "export {}")
  writeFileSync(join(tmpDir, "src", "util.ts"),             "export {}")
  writeFileSync(join(tmpDir, "src", "sub", "deep.ts"),      "export {}")
  writeFileSync(join(tmpDir, "lib", "helper.js"),           "module.exports = {}")
  writeFileSync(join(tmpDir, "node_modules", "react", "index.ts"), "// node mod")
  writeFileSync(join(tmpDir, ".git", "config"),             "[core]")
  writeFileSync(join(tmpDir, "dist", "bundle.js"),          "// dist")
  writeFileSync(join(tmpDir, "__pycache__", "mod.pyc"),     "binary")

  ctx = {
    sessionId: "test-session",
    workdir:   tmpDir,
    signal:    new AbortController().signal,
  }
})

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true })
})

// ─── basic pattern matching ──────────────────────────────────────────────────

describe("globTool — basic patterns", () => {
  it("**/*.ts matches all TS files, excludes node_modules and .git", async () => {
    const r = await globTool.execute({ pattern: "**/*.ts" }, ctx)
    const lines = r.output.split("\n")
    expect(lines).toContain("root.ts")
    expect(lines).toContain("src/index.ts")
    expect(lines).toContain("src/util.ts")
    expect(lines).toContain("src/sub/deep.ts")
    // skipped dirs
    expect(lines.some((l) => l.includes("node_modules"))).toBe(false)
    expect(lines.some((l) => l.includes(".git"))).toBe(false)
  })

  it("**/*.js matches JS files only", async () => {
    const r = await globTool.execute({ pattern: "**/*.js" }, ctx)
    const lines = r.output.split("\n").filter((l) => !l.startsWith("..."))
    expect(lines).toContain("lib/helper.js")
    expect(lines.every((l) => l.endsWith(".js"))).toBe(true)
  })

  it("**/*.md matches markdown files", async () => {
    const r = await globTool.execute({ pattern: "**/*.md" }, ctx)
    expect(r.output).toContain("README.md")
  })

  it("src/**/*.ts matches only files under src/", async () => {
    const r = await globTool.execute({ pattern: "src/**/*.ts" }, ctx)
    const lines = r.output.split("\n")
    expect(lines).toContain("src/index.ts")
    expect(lines).toContain("src/util.ts")
    expect(lines).toContain("src/sub/deep.ts")
    expect(lines.some((l) => l === "root.ts")).toBe(false)
  })

  it("pattern with no matches returns '(no matches)'", async () => {
    const r = await globTool.execute({ pattern: "**/*.go" }, ctx)
    expect(r.output).toBe("(no matches)")
  })

  it("non-existent extension returns '(no matches)'", async () => {
    const r = await globTool.execute({ pattern: "**/*.rb" }, ctx)
    expect(r.output).toBe("(no matches)")
  })
})

// ─── skipped directories ─────────────────────────────────────────────────────

describe("globTool — SKIP_DIRS are excluded", () => {
  it("node_modules contents are not returned", async () => {
    const r = await globTool.execute({ pattern: "**/*.ts" }, ctx)
    expect(r.output).not.toContain("node_modules")
  })

  it(".git contents are not returned", async () => {
    const r = await globTool.execute({ pattern: "**/*" }, ctx)
    expect(r.output).not.toContain(".git")
  })

  it("dist/ contents are not returned", async () => {
    const r = await globTool.execute({ pattern: "**/*.js" }, ctx)
    expect(r.output).not.toContain("dist/")
  })

  it("__pycache__ contents are not returned", async () => {
    const r = await globTool.execute({ pattern: "**/*" }, ctx)
    expect(r.output).not.toContain("__pycache__")
  })
})

// ─── cwd parameter ───────────────────────────────────────────────────────────

describe("globTool — cwd parameter", () => {
  it("cwd restricts search to a subdirectory", async () => {
    const r = await globTool.execute({ pattern: "*.ts", cwd: "src" }, ctx)
    const lines = r.output.split("\n")
    expect(lines).toContain("index.ts")
    expect(lines).toContain("util.ts")
    // root.ts is NOT in src/
    expect(lines.some((l) => l === "root.ts")).toBe(false)
  })

  it("cwd=lib finds js files there", async () => {
    const r = await globTool.execute({ pattern: "*.js", cwd: "lib" }, ctx)
    expect(r.output).toContain("helper.js")
  })
})

// ─── MAX_FILES truncation ─────────────────────────────────────────────────────

describe("globTool — MAX_FILES truncation", () => {
  it("output includes truncation notice when matches exceed 2000", async () => {
    // Create 2001 .txt files in a flat directory
    const manyDir = join(tmpDir, "many")
    mkdirSync(manyDir, { recursive: true })
    for (let i = 0; i < 2001; i++) {
      writeFileSync(join(manyDir, `f${i}.txt`), "")
    }
    const ctxMany: ToolContext = {
      sessionId: "test-session",
      workdir:   tmpDir,
      signal:    new AbortController().signal,
    }
    const r = await globTool.execute({ pattern: "many/**/*.txt" }, ctxMany)
    expect(r.output).toContain("truncated at 2000")
  })
})

// ─── error: no output for empty dir ─────────────────────────────────────────

describe("globTool — edge cases", () => {
  it("empty directory returns '(no matches)'", async () => {
    const emptyDir = mkdtempSync(join(tmpdir(), "aurict-empty-"))
    try {
      const emptyCtx: ToolContext = {
        sessionId: "test",
        workdir:   emptyDir,
        signal:    new AbortController().signal,
      }
      const r = await globTool.execute({ pattern: "**/*.ts" }, emptyCtx)
      expect(r.output).toBe("(no matches)")
    } finally {
      rmSync(emptyDir, { recursive: true, force: true })
    }
  })

  it("cancelled AbortSignal adds '(cancelled)' to output", async () => {
    const ac = new AbortController()
    ac.abort()
    const cancelCtx: ToolContext = {
      sessionId: "test",
      workdir:   tmpDir,
      signal:    ac.signal,
    }
    const r = await globTool.execute({ pattern: "**/*.ts" }, cancelCtx)
    // Either no results (aborted instantly) or cancelled notice
    const hasCancelledOrEmpty = r.output === "(no matches)" || r.output.includes("(cancelled)")
    expect(hasCancelledOrEmpty).toBe(true)
  })
})
