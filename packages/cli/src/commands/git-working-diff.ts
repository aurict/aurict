import { execFile } from "node:child_process"
import { stat } from "node:fs/promises"
import { join } from "node:path"

const GIT_TIMEOUT_MS = 10_000
const MAX_BUFFER = 16 * 1024 * 1024
const MAX_UNTRACKED_FILES = 50
const MAX_UNTRACKED_BYTES = 256 * 1024

export interface WorkingTreeDiff {
  diff: string
  trackedFiles: number
  untrackedFiles: number
  skippedUntracked: string[]
}

interface GitResult { stdout: string; code: number }

function git(args: string[], cwd: string): Promise<GitResult> {
  return new Promise((resolve, reject) => {
    execFile("git", args, { cwd, timeout: GIT_TIMEOUT_MS, maxBuffer: MAX_BUFFER }, (error, stdout, stderr) => {
      const code = error && typeof (error as { code?: unknown }).code === "number" ? (error as { code: number }).code : error ? -1 : 0
      // `git diff --no-index` exits 1 when the files differ; that is a result, not a failure.
      if (error && code !== 1) {
        reject(new Error(stderr.trim() || error.message))
        return
      }
      resolve({ stdout, code })
    })
  })
}

function countFiles(diff: string): number {
  return (diff.match(/^diff --git /gm) ?? []).length
}

/** Staged + unstaged changes against HEAD, plus untracked files as additions. */
export async function workingTreeDiff(workdir: string): Promise<WorkingTreeDiff> {
  const inside = await git(["rev-parse", "--is-inside-work-tree"], workdir).catch(() => null)
  if (inside?.stdout.trim() !== "true") throw new Error(`Not a git repository: ${workdir}`)

  const hasHead = await git(["rev-parse", "--verify", "--quiet", "HEAD"], workdir).then(() => true, () => false)
  const tracked = await git(["diff", "--no-color", "--no-ext-diff", ...(hasHead ? ["HEAD"] : ["--cached"])], workdir)

  const listed = await git(["ls-files", "--others", "--exclude-standard", "-z"], workdir)
  const untracked = listed.stdout.split("\0").filter(Boolean)
  const skippedUntracked: string[] = []
  const additions: string[] = []
  for (const file of untracked) {
    if (additions.length >= MAX_UNTRACKED_FILES) {
      skippedUntracked.push(file)
      continue
    }
    const info = await stat(join(workdir, file)).catch(() => null)
    if (!info?.isFile() || info.size > MAX_UNTRACKED_BYTES) {
      skippedUntracked.push(file)
      continue
    }
    const added = await git(["diff", "--no-color", "--no-ext-diff", "--no-index", "--", "/dev/null", file], workdir)
    if (added.stdout) additions.push(added.stdout)
  }

  const diff = [tracked.stdout, ...additions].filter(Boolean).join("")
  return {
    diff,
    trackedFiles: countFiles(tracked.stdout),
    untrackedFiles: additions.length,
    skippedUntracked,
  }
}
