/**
 * Project file index for `@` mentions.
 *
 * Inside a git work tree the index is `git ls-files` (tracked + untracked,
 * honouring .gitignore). Elsewhere it is a bounded directory walk that skips
 * dependency and build folders. Reads are synchronous against the cached
 * list; loading and stale refreshes run in the background and notify
 * subscribers when the list changes.
 */
import { execFile } from "node:child_process"
import { readdir } from "node:fs/promises"
import { join, relative } from "node:path"

const MAX_FILES = 50_000
const STALE_MS = 15_000
const GIT_TIMEOUT_MS = 5_000
const SKIP_DIRS = new Set([".git", "node_modules", "dist", "build", "out", ".next", "target", "coverage", ".venv", "__pycache__"])

interface IndexEntry {
  paths: string[]
  loadedAt: number
  loading: boolean
  version: number
}

const indexes = new Map<string, IndexEntry>()
const listeners = new Set<() => void>()

/** Files plus every parent directory (with a trailing slash). */
export function withDirectories(files: readonly string[]): string[] {
  const directories = new Set<string>()
  for (const file of files) {
    let slash = file.indexOf("/")
    while (slash !== -1) {
      directories.add(file.slice(0, slash + 1))
      slash = file.indexOf("/", slash + 1)
    }
  }
  return [...directories, ...files]
}

function gitFiles(workdir: string): Promise<string[] | null> {
  return new Promise((resolve) => {
    execFile(
      "git",
      ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
      { cwd: workdir, timeout: GIT_TIMEOUT_MS, maxBuffer: 64 * 1024 * 1024 },
      (error, stdout) => resolve(error ? null : stdout.split("\0").filter(Boolean).slice(0, MAX_FILES)),
    )
  })
}

async function walkFiles(workdir: string): Promise<string[]> {
  const files: string[] = []
  const queue = [workdir]
  while (queue.length > 0 && files.length < MAX_FILES) {
    const directory = queue.shift()!
    const entries = await readdir(directory, { withFileTypes: true }).catch(() => [])
    for (const entry of entries) {
      if (entry.name.startsWith(".") && entry.name !== ".github") continue
      const path = join(directory, entry.name)
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) queue.push(path)
      } else if (entry.isFile()) {
        files.push(relative(workdir, path).split("\\").join("/"))
        if (files.length >= MAX_FILES) break
      }
    }
  }
  return files
}

function refresh(workdir: string, entry: IndexEntry): void {
  entry.loading = true
  void (async () => {
    const files = (await gitFiles(workdir)) ?? (await walkFiles(workdir))
    entry.paths = withDirectories(files)
    entry.loadedAt = Date.now()
    entry.loading = false
    entry.version++
    for (const listener of listeners) listener()
  })()
}

/** Cached paths for `workdir`; schedules a load or refresh when needed. */
export function projectPaths(workdir: string): readonly string[] {
  let entry = indexes.get(workdir)
  if (!entry) {
    entry = { paths: [], loadedAt: 0, loading: false, version: 0 }
    indexes.set(workdir, entry)
  }
  if (!entry.loading && Date.now() - entry.loadedAt > STALE_MS) refresh(workdir, entry)
  return entry.paths
}

export function fileIndexVersion(workdir: string): number {
  return indexes.get(workdir)?.version ?? 0
}

export function subscribeFileIndex(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
