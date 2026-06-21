import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from "bun:test"
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs"
import { execSync } from "node:child_process"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { buildGitSection, buildIntentSkillSection, buildProactiveFileSection, matchIntentSkills } from "../src/skill/injector.js"

let tmpDir: string
let gitDir: string

beforeAll(() => {
  // Create a minimal git repo for positive git tests
  gitDir = mkdtempSync(join(tmpdir(), "aurict-git-"))
  try {
    execSync("git init",                          { cwd: gitDir, stdio: "pipe" })
    execSync("git config user.email t@t.com",    { cwd: gitDir, stdio: "pipe" })
    execSync("git config user.name Test",         { cwd: gitDir, stdio: "pipe" })
    execSync("git commit --allow-empty -m init", { cwd: gitDir, stdio: "pipe" })
  } catch { /* git may not be available in all CI — tests below will gracefully skip */ }
})

afterAll(() => {
  rmSync(gitDir, { recursive: true, force: true })
})

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "aurict-inject-"))
})

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true })
})

// ─── buildGitSection ─────────────────────────────────────────────────────────

describe("buildGitSection", () => {
  it("returns empty string for a non-git directory", () => {
    const result = buildGitSection(tmpDir)
    expect(result).toBe("")
  })

  it("returns '## Git Context' header for a git repo", () => {
    // Only run if git init succeeded
    try {
      execSync("git rev-parse --git-dir", { cwd: gitDir, stdio: "pipe" })
    } catch {
      return // git not available or init failed
    }
    const result = buildGitSection(gitDir)
    expect(result).toContain("## Git Context")
  })

  it("includes branch name for a git repo", () => {
    try {
      execSync("git rev-parse --git-dir", { cwd: gitDir, stdio: "pipe" })
    } catch { return }
    const result = buildGitSection(gitDir)
    expect(result).toContain("Branch:")
  })

  it("does not throw for non-existent path", () => {
    expect(() => buildGitSection("/path/that/does/not/exist")).not.toThrow()
    expect(buildGitSection("/path/that/does/not/exist")).toBe("")
  })
})

// ─── buildProactiveFileSection ────────────────────────────────────────────────

describe("buildProactiveFileSection — empty / no mention", () => {
  it("empty user text returns empty string", async () => {
    const r = await buildProactiveFileSection("", tmpDir)
    expect(r).toBe("")
  })

  it("whitespace-only text returns empty string", async () => {
    const r = await buildProactiveFileSection("   \n  ", tmpDir)
    expect(r).toBe("")
  })

  it("text with no file mentions returns empty string", async () => {
    const r = await buildProactiveFileSection("please help me with authentication", tmpDir)
    expect(r).toBe("")
  })

  it("mentions a file that does not exist returns empty string", async () => {
    const r = await buildProactiveFileSection("check ghost.ts please", tmpDir)
    expect(r).toBe("")
  })
})

describe("buildProactiveFileSection — file exists", () => {
  it("includes file content when file is mentioned and exists", async () => {
    writeFileSync(join(tmpDir, "helper.ts"), "export function add(a: number, b: number) { return a + b }")
    const r = await buildProactiveFileSection("look at helper.ts", tmpDir)
    expect(r).toContain("## Files Referenced in Your Request")
    expect(r).toContain("helper.ts")
    expect(r).toContain("add")
  })

  it("wraps content in a code block with extension", async () => {
    writeFileSync(join(tmpDir, "util.ts"), "export const x = 1")
    const r = await buildProactiveFileSection("check util.ts", tmpDir)
    expect(r).toContain("```ts")
  })

  it("resolves ./relative path directly", async () => {
    mkdirSync(join(tmpDir, "src"), { recursive: true })
    writeFileSync(join(tmpDir, "src", "index.ts"), "export {}")
    const r = await buildProactiveFileSection("see ./src/index.ts", tmpDir)
    expect(r).toContain("src/index.ts")
  })

  it("resolves filename via glob fallback (no path, just filename)", async () => {
    mkdirSync(join(tmpDir, "deep", "nested"), { recursive: true })
    writeFileSync(join(tmpDir, "deep", "nested", "found.ts"), "export const found = true")
    // Mention only the filename — no directory
    const r = await buildProactiveFileSection("update found.ts", tmpDir)
    expect(r).toContain("found.ts")
    expect(r).toContain("found")
  })

  it("truncates file content over 3000 chars", async () => {
    const longContent = "x".repeat(4000)
    writeFileSync(join(tmpDir, "big.ts"), longContent)
    const r = await buildProactiveFileSection("read big.ts", tmpDir)
    expect(r).toContain("[truncated]")
  })

  it("skips files over 50KB", async () => {
    const hugeContent = "x".repeat(51_000)
    writeFileSync(join(tmpDir, "huge.ts"), hugeContent)
    const r = await buildProactiveFileSection("check huge.ts", tmpDir)
    // Should be empty because file is too large
    expect(r).toBe("")
  })
})

describe("buildProactiveFileSection — multiple files", () => {
  it("includes multiple mentioned files (up to 3)", async () => {
    writeFileSync(join(tmpDir, "alpha.ts"), "export const a = 1")
    writeFileSync(join(tmpDir, "beta.ts"),  "export const b = 2")
    writeFileSync(join(tmpDir, "gamma.ts"), "export const c = 3")
    const r = await buildProactiveFileSection("check alpha.ts beta.ts gamma.ts", tmpDir)
    const matchCount = (r.match(/###/g) ?? []).length
    expect(matchCount).toBe(3)
  })

  it("caps at 3 files when more than 3 are mentioned", async () => {
    for (let i = 0; i < 5; i++) {
      writeFileSync(join(tmpDir, `file${i}.ts`), `export const x${i} = ${i}`)
    }
    const r = await buildProactiveFileSection(
      "check file0.ts file1.ts file2.ts file3.ts file4.ts",
      tmpDir,
    )
    const sectionCount = (r.match(/###/g) ?? []).length
    expect(sectionCount).toBeLessThanOrEqual(3)
  })

  it("relative path in result does not include workdir prefix", async () => {
    writeFileSync(join(tmpDir, "clean.ts"), "export {}")
    const r = await buildProactiveFileSection("read clean.ts", tmpDir)
    // The path shown should be just "clean.ts", not the full absolute path
    expect(r).not.toContain(tmpDir)
    expect(r).toContain("### clean.ts")
  })
})

describe("buildProactiveFileSection — supported extensions", () => {
  const cases: [string, string][] = [
    ["config.json", '{"key": "value"}'],
    ["setup.py",    "print('hello')"],
    ["main.go",     "package main"],
    ["styles.css",  "body { margin: 0 }"],
    ["index.html",  "<html></html>"],
    ["script.sh",   "#!/bin/bash"],
  ]

  for (const [filename, content] of cases) {
    it(`resolves ${filename}`, async () => {
      writeFileSync(join(tmpDir, filename), content)
      const r = await buildProactiveFileSection(`check ${filename}`, tmpDir)
      expect(r).toContain(filename)
    })
  }
})

describe("intent skill retrieval", () => {
  const solarPrompt = [
    "Create an advanced 3D Solar System simulation with real-time physics",
    "using an N-body mechanics framework, Runge-Kutta RK4 or Verlet integration,",
    "smooth camera controls, orbital trails, time acceleration, and high performance.",
  ].join(" ")

  it("matches skills for 3D physics simulation prompts without explicit regex rules", () => {
    const matches = matchIntentSkills(solarPrompt)
    const ids = matches.map((match) => match.id)

    expect(ids.length).toBeGreaterThan(0)
    expect(ids.some((id) => ["animations-patterns", "data-visualization", "web-performance"].includes(id))).toBe(true)
  })

  it("injects retrieved skill instructions into the intent skill section", async () => {
    const section = await buildIntentSkillSection(solarPrompt, tmpDir)

    expect(section).toContain("Intent-Activated Skills")
  })
})
