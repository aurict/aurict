import { describe, it, expect, beforeAll, afterAll } from "bun:test"
import { mkdirSync, writeFileSync, rmSync } from "fs"
import { join } from "path"
import { execSync } from "child_process"
import { tmpdir } from "os"

let repoDir: string
let noGitDir: string

function sh(cmd: string, cwd: string) {
  execSync(cmd, { cwd, stdio: "pipe" })
}

beforeAll(() => {
  // ── Repo with history ────────────────────────────────────────────────
  repoDir = join(tmpdir(), `git-context-test-${Date.now()}`)
  mkdirSync(repoDir, { recursive: true })
  sh("git init", repoDir)
  sh("git config user.email 'test@test.com'", repoDir)
  sh("git config user.name 'Test'", repoDir)

  writeFileSync(join(repoDir, "lib.ts"), `
// TODO: add error handling
export function add(a: number, b: number): number {
  return a + b
}
`.trim())
  sh("git add lib.ts", repoDir)
  sh('git commit -m "feat: add lib"', repoDir)

  writeFileSync(join(repoDir, "lib.ts"), `
// TODO: add error handling
// HACK: temporary until we have proper validation
export function add(a: number, b: number): number {
  return a + b
}
`.trim())
  sh("git add lib.ts", repoDir)
  sh('git commit -m "fix: add validation note"', repoDir)

  writeFileSync(join(repoDir, "lib.test.ts"), `
import { add } from "./lib"
export const test1 = add(1, 2)
`.trim())
  sh("git add lib.test.ts", repoDir)
  sh('git commit -m "test: add lib test"', repoDir)

  // ── Dir without git ──────────────────────────────────────────────────
  noGitDir = join(tmpdir(), `no-git-test-${Date.now()}`)
  mkdirSync(noGitDir, { recursive: true })
  writeFileSync(join(noGitDir, "app.ts"), `
// FIXME: this is broken
export const x = 1
`.trim())
})

afterAll(() => {
  try { rmSync(repoDir,  { recursive: true, force: true }) } catch {}
  try { rmSync(noGitDir, { recursive: true, force: true }) } catch {}
})

function ctx(workdir: string) {
  return { workdir, sessionId: "test", signal: new AbortController().signal }
}

describe("git_context", () => {
  it("shows commit history for a tracked file", async () => {
    const { gitContextTool } = await import("../src/tool/built-in/git-context.js")
    const res = await gitContextTool.execute({ files: ["lib.ts"] }, ctx(repoDir))
    expect(res.error).toBeUndefined()
    expect(res.output).toContain("git_context")
    expect(res.output).toContain("lib.ts")
    expect(res.output).toMatch(/commit/)
    expect(res.output).toContain("feat: add lib")
  })

  it("shows annotations (TODO/HACK) regardless of history", async () => {
    const { gitContextTool } = await import("../src/tool/built-in/git-context.js")
    const res = await gitContextTool.execute({ files: ["lib.ts"] }, ctx(repoDir))
    expect(res.output).toContain("TODO")
    expect(res.output).toContain("HACK")
  })

  it("detects related test files", async () => {
    const { gitContextTool } = await import("../src/tool/built-in/git-context.js")
    const res = await gitContextTool.execute({ files: ["lib.ts"] }, ctx(repoDir))
    expect(res.output).toContain("lib.test.ts")
  })

  it("reports 'not tracked' for an untracked file", async () => {
    const { gitContextTool } = await import("../src/tool/built-in/git-context.js")
    writeFileSync(join(repoDir, "new-file.ts"), "export const x = 1")
    const res = await gitContextTool.execute({ files: ["new-file.ts"] }, ctx(repoDir))
    expect(res.output).toMatch(/not tracked|no history/i)
  })

  it("works without git — shows annotations from plain dir", async () => {
    const { gitContextTool } = await import("../src/tool/built-in/git-context.js")
    const res = await gitContextTool.execute({ files: ["app.ts"] }, ctx(noGitDir))
    expect(res.error).toBeUndefined()
    expect(res.output).toContain("FIXME")
    expect(res.output).toMatch(/not a git repository/i)
  })

  it("handles multiple files in one call", async () => {
    const { gitContextTool } = await import("../src/tool/built-in/git-context.js")
    const res = await gitContextTool.execute(
      { files: ["lib.ts", "lib.test.ts"] },
      ctx(repoDir),
    )
    expect(res.error).toBeUndefined()
    expect(res.output).toContain("lib.ts")
    expect(res.output).toContain("lib.test.ts")
  })
})
