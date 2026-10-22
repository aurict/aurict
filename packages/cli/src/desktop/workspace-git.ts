import { execFile } from "node:child_process"
import { readFileSync, rmSync, statSync } from "node:fs"
import { isAbsolute, relative, resolve } from "node:path"
import { promisify } from "node:util"

const run = promisify(execFile)
const GIT_TIMEOUT_MS = 15_000
const MAX_UNTRACKED = 200
const MAX_UNTRACKED_BYTES = 256 * 1024

export type ChangeStatus = "modified" | "added" | "deleted" | "renamed" | "untracked"
export interface ChangedFile { path: string; status: ChangeStatus; additions: number; deletions: number; binary: boolean }
export interface WorkspaceStatus { repository: boolean; branch: string | null; files: ChangedFile[] }

// Arguments are always passed as an array: commit messages, branch names and
// paths never go through a shell or get split on whitespace.
async function git(workdir: string, args: string[], timeout = GIT_TIMEOUT_MS): Promise<string> {
  const { stdout } = await run("git", args, { cwd: workdir, timeout, maxBuffer: 16 * 1024 * 1024 })
  return stdout
}

/** Resolves a workspace-relative path and refuses anything outside the workspace. */
export function workspacePath(workdir: string, path: string): string {
  if (!path || isAbsolute(path)) throw new Error("Use a path relative to the workspace.")
  const absolute = resolve(workdir, path)
  const rel = relative(workdir, absolute)
  if (!rel || rel.startsWith("..") || isAbsolute(rel)) throw new Error("That path is outside the workspace.")
  return rel
}

function parsePorcelain(output: string): Array<{ path: string; status: ChangeStatus }> {
  const entries = output.split("\0").filter(Boolean)
  const result: Array<{ path: string; status: ChangeStatus }> = []
  for (let index = 0; index < entries.length; index++) {
    const entry = entries[index] ?? ""
    const code = entry.slice(0, 2)
    const path = entry.slice(3)
    if (code === "??") result.push({ path, status: "untracked" })
    else if (code.includes("R")) { result.push({ path, status: "renamed" }); index++ /* skip the original name */ }
    else if (code.includes("D")) result.push({ path, status: "deleted" })
    else if (code.includes("A")) result.push({ path, status: "added" })
    else result.push({ path, status: "modified" })
  }
  return result
}

function countLines(path: string): number {
  try {
    if (statSync(path).size > MAX_UNTRACKED_BYTES) return 0
    const text = readFileSync(path, "utf8")
    return text ? text.split("\n").length - (text.endsWith("\n") ? 1 : 0) : 0
  } catch {
    return 0
  }
}

export async function workspaceStatus(workdir: string): Promise<WorkspaceStatus> {
  try {
    await git(workdir, ["rev-parse", "--is-inside-work-tree"])
  } catch {
    return { repository: false, branch: null, files: [] }
  }
  const [branch, porcelain] = await Promise.all([
    git(workdir, ["branch", "--show-current"]).then((value) => value.trim() || null).catch(() => null),
    git(workdir, ["status", "--porcelain=v1", "-z", "--untracked-files=all"]),
  ])
  // A repository without commits has no HEAD to diff against; counts stay zero.
  const numstat = await git(workdir, ["diff", "--numstat", "-z", "HEAD"]).catch(() => "")
  const counts = new Map<string, { additions: number; deletions: number; binary: boolean }>()
  for (const record of numstat.split("\0").filter(Boolean)) {
    const [added, deleted, path] = record.split("\t")
    if (!path) continue
    counts.set(path, { additions: Number(added) || 0, deletions: Number(deleted) || 0, binary: added === "-" })
  }
  const files: ChangedFile[] = []
  let untracked = 0
  for (const { path, status } of parsePorcelain(porcelain)) {
    if (status === "untracked" && ++untracked > MAX_UNTRACKED) continue
    const count = counts.get(path)
    if (count) files.push({ path, status, ...count })
    else if (status === "untracked") files.push({ path, status, additions: countLines(resolve(workdir, path)), deletions: 0, binary: false })
    else files.push({ path, status, additions: 0, deletions: 0, binary: false })
  }
  return { repository: true, branch, files }
}

export async function fileDiff(workdir: string, path: string): Promise<string> {
  const rel = workspacePath(workdir, path)
  const tracked = await git(workdir, ["ls-files", "--error-unmatch", "--", rel]).then(() => true).catch(() => false)
  if (tracked) return git(workdir, ["diff", "HEAD", "--", rel]).catch(() => git(workdir, ["diff", "--", rel]))
  const absolute = resolve(workdir, rel)
  if (statSync(absolute).size > MAX_UNTRACKED_BYTES) return `New file ${rel} is too large to preview.`
  const lines = readFileSync(absolute, "utf8").split("\n")
  if (lines[lines.length - 1] === "") lines.pop()
  return [`--- /dev/null`, `+++ b/${rel}`, `@@ -0,0 +1,${lines.length} @@`, ...lines.map((line) => `+${line}`)].join("\n")
}

/** Discards working-tree changes to one file. Untracked files are deleted. */
export async function revertFile(workdir: string, path: string): Promise<void> {
  const rel = workspacePath(workdir, path)
  const tracked = await git(workdir, ["ls-files", "--error-unmatch", "--", rel]).then(() => true).catch(() => false)
  if (tracked) {
    await git(workdir, ["restore", "--source=HEAD", "--staged", "--worktree", "--", rel])
    return
  }
  rmSync(resolve(workdir, rel), { force: true })
}

export async function commit(workdir: string, message: string, paths: string[] = []): Promise<string> {
  const text = message.trim()
  if (!text) throw new Error("Write a commit message first.")
  const scoped = paths.map((path) => workspacePath(workdir, path))
  await git(workdir, ["add", "-A", "--", ...(scoped.length ? scoped : ["."])])
  await git(workdir, ["commit", "-m", text], 60_000)
  return (await git(workdir, ["rev-parse", "--short", "HEAD"])).trim()
}

export async function createBranch(workdir: string, name: string): Promise<void> {
  const branch = name.trim()
  await git(workdir, ["check-ref-format", "--branch", branch]).catch(() => { throw new Error(`"${branch}" is not a valid branch name.`) })
  await git(workdir, ["switch", "-c", branch])
}

/** Pushes the current branch and opens a pull request with the GitHub CLI. */
export async function openPullRequest(workdir: string, title: string, body: string): Promise<string> {
  if (!title.trim()) throw new Error("Give the pull request a title.")
  await git(workdir, ["push", "-u", "origin", "HEAD"], 120_000)
  const { stdout } = await run("gh", ["pr", "create", "--title", title.trim(), "--body", body], { cwd: workdir, timeout: 120_000 })
    .catch((error: unknown) => {
      const missing = error instanceof Error && "code" in error && (error as NodeJS.ErrnoException).code === "ENOENT"
      throw new Error(missing ? "Install the GitHub CLI (gh) and sign in to open pull requests." : error instanceof Error ? error.message : String(error))
    })
  return stdout.trim().split("\n").pop() ?? ""
}
