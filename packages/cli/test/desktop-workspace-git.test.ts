import { afterEach, describe, expect, test } from "bun:test"
import { execFileSync } from "node:child_process"
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { commit, createBranch, fileDiff, revertFile, workspacePath, workspaceStatus } from "../src/desktop/workspace-git.js"

const repos: string[] = []
function repo(): string {
  const dir = mkdtempSync(join(tmpdir(), "aurict-git-"))
  repos.push(dir)
  const git = (...args: string[]) => execFileSync("git", args, { cwd: dir })
  git("init", "-q", "-b", "main")
  git("config", "user.email", "test@aurict.local")
  git("config", "user.name", "Aurict Test")
  writeFileSync(join(dir, "app.ts"), "one\ntwo\n")
  git("add", "-A")
  git("commit", "-q", "-m", "initial")
  return dir
}

afterEach(() => { for (const dir of repos.splice(0)) rmSync(dir, { recursive: true, force: true }) })

describe("desktop workspace git", () => {
  test("reports changed and untracked files with line counts", async () => {
    const dir = repo()
    writeFileSync(join(dir, "app.ts"), "one\nTWO\nthree\n")
    writeFileSync(join(dir, "new.ts"), "a\nb\n")
    const status = await workspaceStatus(dir)
    expect(status).toMatchObject({ repository: true, branch: "main" })
    expect(status.files).toContainEqual({ path: "app.ts", status: "modified", additions: 2, deletions: 1, binary: false })
    expect(status.files).toContainEqual({ path: "new.ts", status: "untracked", additions: 2, deletions: 0, binary: false })
  })

  test("returns a patch for tracked and untracked files", async () => {
    const dir = repo()
    writeFileSync(join(dir, "app.ts"), "one\nTWO\n")
    writeFileSync(join(dir, "new.ts"), "hello\n")
    expect(await fileDiff(dir, "app.ts")).toContain("+TWO")
    expect(await fileDiff(dir, "new.ts")).toContain("+hello")
  })

  test("reverts one file without touching others", async () => {
    const dir = repo()
    writeFileSync(join(dir, "app.ts"), "changed\n")
    writeFileSync(join(dir, "new.ts"), "x\n")
    await revertFile(dir, "app.ts")
    await revertFile(dir, "new.ts")
    expect(readFileSync(join(dir, "app.ts"), "utf8")).toBe("one\ntwo\n")
    expect(existsSync(join(dir, "new.ts"))).toBe(false)
  })

  test("commits messages with spaces and creates branches", async () => {
    const dir = repo()
    writeFileSync(join(dir, "app.ts"), "three\n")
    const hash = await commit(dir, "fix: keep a multi word message")
    expect(hash).toMatch(/^[0-9a-f]{4,}$/)
    expect(execFileSync("git", ["log", "-1", "--format=%s"], { cwd: dir }).toString().trim()).toBe("fix: keep a multi word message")
    await createBranch(dir, "feature/desktop")
    expect((await workspaceStatus(dir)).branch).toBe("feature/desktop")
    await expect(createBranch(dir, "bad name")).rejects.toThrow("not a valid branch name")
  })

  test("refuses paths outside the workspace", () => {
    expect(() => workspacePath("/repo", "../etc/passwd")).toThrow()
    expect(() => workspacePath("/repo", "/etc/passwd")).toThrow()
    expect(workspacePath("/repo", "src/app.ts")).toBe("src/app.ts")
  })

  test("reports a non-repository folder", async () => {
    const dir = mkdtempSync(join(tmpdir(), "aurict-plain-"))
    repos.push(dir)
    expect(await workspaceStatus(dir)).toEqual({ repository: false, branch: null, files: [] })
  })
})
