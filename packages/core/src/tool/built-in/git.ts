import { z } from "zod"
import { execFile } from "child_process"
import { promisify } from "util"
import { existsSync, statSync } from "fs"
import { join } from "path"
import type { ToolDef, ToolContext, ExecuteResult } from "../types.js"

const execFileAsync = promisify(execFile)

// Git lock file kontrolü — başka bir git process çalışıyorsa erken uyarı
function checkGitLock(cwd: string): void {
  const lockFile = join(cwd, ".git", "index.lock")
  if (existsSync(lockFile)) {
    try {
      const stat = statSync(lockFile)
      const ageMs = Date.now() - stat.mtimeMs
      if (ageMs > 5000) { // 5 saniyeden eskiyse
        throw new Error(`Git lock file detected (age: ${Math.round(ageMs/1000)}s). Another git process may be running. Remove .git/index.lock if safe.`)
      }
    } catch (e) {
      if (e instanceof Error && e.message.includes("Git lock file")) throw e
      // Lock file okunamıyorsa sessizce geç
    }
  }
}

// Asenkron git komutu çalıştırma — timeout ve progress desteği
async function git(
  cmd: string,
  cwd: string,
  timeoutMs = 10000,
  onChunk?: (chunk: string) => void,
): Promise<string> {
  // Lock file kontrolü
  checkGitLock(cwd)

  // Progress reporting — uzun süren komutlar için
  if (onChunk) {
    onChunk(`⏳ Running git ${cmd.split(" ")[0]}...\n`)
  }

  try {
    const { stdout } = await execFileAsync("git", cmd.split(/\s+/), {
      cwd,
      encoding: "utf8",
      timeout: timeoutMs,
      maxBuffer: 10 * 1024 * 1024, // 10 MB
    })
    return stdout.trim()
  } catch (e: any) {
    if (e.killed) {
      throw new Error(`Git command timed out after ${timeoutMs}ms`)
    }
    const msg = e.stderr || e.message || String(e)
    throw new Error(msg.trim())
  }
}

export const gitTool: ToolDef = {
  id:          "git",
  description: `Git operations — status, diff, log, commit, branch.

Actions:
- status:  Show staged/modified/untracked files
- diff:    Show changes (optionally for a specific file)
- log:     Recent commits (default: last 10)
- commit:  Stage all changes and commit with a message
- branch:  List branches or switch to one
- stash:   Stash or pop changes

Use status before diff to understand the scope. Use log to understand context.`,

  parameters: z.object({
    action:  z.enum(["status","diff","log","commit","branch","stash"]),
    file:    z.string().optional().describe("Specific file for diff"),
    message: z.string().optional().describe("Commit message"),
    name:    z.string().optional().describe("Branch name to create or switch"),
    count:   z.number().optional().describe("Number of log entries (default: 10)"),
  }),

  async execute(args, ctx: ToolContext): Promise<ExecuteResult> {
    const { action, file, message, name } = args as {
      action: string; file?: string; message?: string; name?: string; count?: number
    }
    const count = (args as { count?: number }).count ?? 10
    const cwd   = ctx.workdir

    try {
      switch (action) {
        case "status": {
          const out = await git("status --short", cwd, 10000, ctx.onChunk)
          return { output: out || "Working tree clean." }
        }

        case "diff": {
          const target = file ? `-- "${file}"` : ""
          const staged = await git(`diff --cached ${target}`, cwd, 10000, ctx.onChunk)
          const unstaged = await git(`diff ${target}`, cwd, 10000, ctx.onChunk)
          const combined = [
            staged    ? `=== Staged ===\n${staged}`    : "",
            unstaged  ? `=== Unstaged ===\n${unstaged}` : "",
          ].filter(Boolean).join("\n\n")
          return { output: combined || "No changes." }
        }

        case "log": {
          const out = await git(`log --oneline -${count}`, cwd, 10000, ctx.onChunk)
          return { output: out || "No commits yet." }
        }

        case "commit": {
          if (!message) return { output: "", error: "Commit message required." }
          await git("add -A", cwd, 10000, ctx.onChunk)
          const out = await git(`commit -m "${message.replace(/"/g, "'")}"`, cwd, 10000, ctx.onChunk)
          return { output: out }
        }

        case "branch": {
          if (name) {
            try {
              await git(`checkout -b "${name}"`, cwd, 10000, ctx.onChunk)
              return { output: `Created and switched to branch: ${name}` }
            } catch {
              await git(`checkout "${name}"`, cwd, 10000, ctx.onChunk)
              return { output: `Switched to branch: ${name}` }
            }
          }
          const out = await git("branch -a", cwd, 10000, ctx.onChunk)
          return { output: out }
        }

        case "stash": {
          const sub = file ?? "push"
          if (sub === "pop") {
            const out = await git("stash pop", cwd, 10000, ctx.onChunk)
            return { output: out }
          }
          const out = await git("stash push", cwd, 10000, ctx.onChunk)
          return { output: out }
        }

        default:
          return { output: "", error: `Unknown action: ${action}` }
      }
    } catch (err) {
      return { output: "", error: err instanceof Error ? err.message : String(err) }
    }
  },
}
