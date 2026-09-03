import { z }                      from "zod"
import { resolve, join, relative } from "path"
import { readdir }                 from "node:fs/promises"
import type { ToolDef, ToolContext, ExecuteResult } from "../types.js"
import { resolveAuthorizedFilesystemPath } from "../../security/filesystem-grants.js"
import { toPosix } from "../../util/paths.js"

const MAX_FILES  = 2_000
const TIMEOUT_MS = 15_000

// Directories that are skipped unconditionally.
// These are either too large, irrelevant to source code, or cause symlink cycles.
const SKIP_DIRS = new Set([
  "node_modules", ".git", ".svn", ".hg", ".bzr",
  "dist", "build", "out", ".output", ".next", ".nuxt",
  "coverage", ".nyc_output",
  "__pycache__", ".venv", "venv",
  ".cache", ".parcel-cache", ".turbo",
  ".yarn", ".pnp", ".pnp.loader.mjs",
  ".DS_Store",
])

// Walk directory tree, yielding file paths relative to `root`.
// Skips SKIP_DIRS and does NOT follow symbolic links for directories
// (prevents infinite loops on circular symlinks).
async function* walkFiles(
  dir:    string,
  root:   string,
  signal: AbortSignal,
): AsyncGenerator<string> {
  if (signal.aborted) return
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return  // unreadable directory — skip
  }
  for (const entry of entries) {
    if (signal.aborted) return
    if (entry.isDirectory() && !entry.isSymbolicLink()) {
      if (!SKIP_DIRS.has(entry.name)) {
        yield* walkFiles(join(dir, entry.name), root, signal)
      }
    } else if (entry.isFile()) {
      yield toPosix(relative(root, join(dir, entry.name)))
    }
  }
}

// Extract the static (non-glob) prefix directory from a pattern.
// "src/**/*.ts"       → "src"
// "packages/cli/src/**/*.ts" → "packages/cli/src"
// "**/*.ts"           → ""  (scan from root)
function staticBase(pattern: string): string {
  const m = pattern.match(/[*?[{]/)
  if (!m || m.index === undefined) return ""
  const prefix    = pattern.slice(0, m.index)
  const lastSlash = prefix.lastIndexOf("/")
  return lastSlash === -1 ? "" : prefix.slice(0, lastSlash)
}

export const globTool: ToolDef = {
  id:          "glob",
  description: "Find files matching a glob pattern. Returns a list of matching file paths.",
  parameters:  z.object({
    pattern: z.string().describe("Glob pattern e.g. 'src/**/*.ts'"),
    cwd:     z.string().optional().describe("Directory to search in (defaults to project root)"),
  }),
  async execute(args, ctx: ToolContext): Promise<ExecuteResult> {
    const pattern   = String(args["pattern"] ?? "**/*")
    let searchDir: string
    try {
      searchDir = await resolveAuthorizedFilesystemPath(ctx.workdir, ctx.sessionId, String(args["cwd"] ?? "."))
    } catch (error) {
      return { output: "", error: `Security: ${error instanceof Error ? error.message : String(error)}` }
    }

    // Start walking from the deepest non-glob prefix directory for speed.
    const base    = staticBase(pattern)
    const walkDir = base ? join(searchDir, base) : searchDir

    const globMatcher = new Bun.Glob(pattern)
    const files: string[] = []
    let timedOut = false

    // AbortController tied to both the timeout and the parent signal.
    // Used to stop the walkFiles generator early.
    const ac = new AbortController()
    const onParentAbort = () => ac.abort()
    ctx.signal.addEventListener("abort", onParentAbort, { once: true })

    const timer = setTimeout(() => { timedOut = true; ac.abort() }, TIMEOUT_MS)

    try {
      for await (const rel of walkFiles(walkDir, searchDir, ac.signal)) {
        if (ac.signal.aborted) break
        // rel is relative to searchDir — match against the original pattern
        if (globMatcher.match(rel)) {
          files.push(rel)
          if (files.length >= MAX_FILES) { ac.abort(); break }
        }
      }
    } finally {
      clearTimeout(timer)
      ctx.signal.removeEventListener("abort", onParentAbort)
    }

    if (files.length >= MAX_FILES) files.push(`... (truncated at ${MAX_FILES})`)
    if (timedOut)                  files.push(`... (timed out after ${TIMEOUT_MS / 1000}s — partial results)`)
    if (ctx.signal.aborted && !timedOut) files.push("... (cancelled)")

    return files.length === 0 ? { output: "(no matches)" } : { output: files.join("\n") }
  },
}
