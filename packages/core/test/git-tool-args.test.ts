import { afterEach, describe, expect, it } from "bun:test"
import { execFileSync } from "node:child_process"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { gitTool } from "../src/tool/built-in/git.js"
import type { ToolContext } from "../src/tool/types.js"

const dirs: string[] = []
function repo(): string {
  const dir = mkdtempSync(join(tmpdir(), "aurict-gittool-"))
  dirs.push(dir)
  const git = (...args: string[]) => execFileSync("git", args, { cwd: dir })
  git("init", "-q", "-b", "main")
  git("config", "user.email", "test@aurict.local")
  git("config", "user.name", "Aurict Test")
  writeFileSync(join(dir, "a.txt"), "a\n")
  git("add", "-A")
  git("commit", "-q", "-m", "initial")
  return dir
}
const context = (workdir: string) => ({ workdir }) as unknown as ToolContext

afterEach(() => { for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true }) })

describe("git tool arguments", () => {
  it("commits a message with spaces and quotes verbatim", async () => {
    const dir = repo()
    writeFileSync(join(dir, "a.txt"), "b\n")
    const result = await gitTool.execute({ action: "commit", message: `fix: handle "quoted" words` }, context(dir))
    expect(result.error).toBeUndefined()
    expect(execFileSync("git", ["log", "-1", "--format=%s"], { cwd: dir }).toString().trim()).toBe(`fix: handle "quoted" words`)
  })

  it("diffs a file whose name contains spaces", async () => {
    const dir = repo()
    writeFileSync(join(dir, "my notes.txt"), "x\n")
    execFileSync("git", ["add", "my notes.txt"], { cwd: dir })
    writeFileSync(join(dir, "my notes.txt"), "y\n")
    const result = await gitTool.execute({ action: "diff", file: "my notes.txt" }, context(dir))
    expect(result.output).toContain("+y")
  })

  it("creates a branch without literal quote characters", async () => {
    const dir = repo()
    await gitTool.execute({ action: "branch", name: "feature/x" }, context(dir))
    expect(execFileSync("git", ["branch", "--show-current"], { cwd: dir }).toString().trim()).toBe("feature/x")
  })
})
