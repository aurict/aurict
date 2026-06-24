import { z } from "zod"
import { spawnSync } from "node:child_process"
import { platform } from "node:os"
import { readFileSync, writeFileSync, existsSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import type { ToolDef, ToolContext, ExecuteResult } from "../types.js"

interface PatchResult {
  os:                 string
  success:            boolean
  rolled_back:        boolean
  patch_applied:      boolean
  verification_output: string
  verification_exit:  number
  error?:             string
  files_changed:      string[]
}

function detectOS() {
  const p = platform()
  return {
    name:    p === "darwin" ? "macOS" : p === "win32" ? "Windows" : "Linux",
    isWin:   p === "win32",
    isMac:   p === "darwin",
    isLinux: p === "linux",
  }
}

function applyPatchViaGit(patchContent: string, workdir: string): { ok: boolean; error: string } {
  const patchFile = join(tmpdir(), `aurict-patch-${Date.now()}.diff`)
  try {
    writeFileSync(patchFile, patchContent, "utf8")

    // Dry-run first
    const check = spawnSync("git", ["apply", "--check", patchFile], {
      cwd: workdir, encoding: "utf8", timeout: 15_000,
    })
    if (check.status !== 0) {
      return { ok: false, error: `Patch check failed: ${check.stderr.trim()}` }
    }

    // Apply
    const apply = spawnSync("git", ["apply", patchFile], {
      cwd: workdir, encoding: "utf8", timeout: 15_000,
    })
    if (apply.status !== 0) {
      return { ok: false, error: `Patch apply failed: ${apply.stderr.trim()}` }
    }

    return { ok: true, error: "" }
  } finally {
    try { require("node:fs").unlinkSync(patchFile) } catch { /* ignore */ }
  }
}

function revertPatchViaGit(patchContent: string, workdir: string): void {
  const patchFile = join(tmpdir(), `aurict-revert-${Date.now()}.diff`)
  try {
    writeFileSync(patchFile, patchContent, "utf8")
    spawnSync("git", ["apply", "-R", patchFile], {
      cwd: workdir, encoding: "utf8", timeout: 15_000,
    })
  } finally {
    try { require("node:fs").unlinkSync(patchFile) } catch { /* ignore */ }
  }
}

// Fallback: simple backup/restore for non-git projects
function backupFile(filePath: string): string {
  const backupPath = `${filePath}.aurict_backup_${Date.now()}`
  writeFileSync(backupPath, readFileSync(filePath))
  return backupPath
}

function restoreFile(filePath: string, backupPath: string): void {
  writeFileSync(filePath, readFileSync(backupPath))
  try { require("node:fs").unlinkSync(backupPath) } catch { /* ignore */ }
}

function extractChangedFiles(patchContent: string): string[] {
  const files: string[] = []
  for (const line of patchContent.split("\n")) {
    // "+++ b/path/to/file" or "+++ path/to/file"
    if (line.startsWith("+++ ")) {
      const path = line.slice(4).replace(/^b\//, "").trim()
      if (path !== "/dev/null" && !files.includes(path)) files.push(path)
    }
  }
  return files
}

function runVerification(cmd: string, workdir: string, timeoutSec: number) {
  const os = detectOS()
  const shell = os.isWin ? "cmd.exe" : "/bin/sh"
  const flag  = os.isWin ? "/c" : "-c"

  const r = spawnSync(shell, [flag, cmd], {
    cwd: workdir, encoding: "utf8",
    timeout: timeoutSec * 1000,
    maxBuffer: 1024 * 1024,
  })

  return {
    output: ((r.stdout ?? "") + (r.stderr ?? "")).trim(),
    exit:   r.status ?? -1,
    timedOut: r.signal === "SIGTERM",
  }
}

export const atomicPatchAndTestTool: ToolDef = {
  id:        "atomic_patch_and_test",
  timeoutMs: 300_000,
  description: `Apply a unified diff patch to a file, run a verification command, and automatically
roll back the change if verification fails.

Guarantees: if the verification command returns a non-zero exit code, the original file is
restored exactly as it was before — no broken state left behind.

Works on Linux, macOS, and Windows. Uses git apply when available (git is required);
falls back to direct file backup/restore for non-git directories.

Use when: patching a security vulnerability and confirming the fix doesn't break tests,
applying a remediation and verifying it works, safe experimentation with rollback guarantee.`,

  parameters: z.object({
    file_path:            z.string().describe("Path to the file being patched (used as reference for backup)"),
    patch_diff:           z.string().describe("Unified diff content (output of git diff or diff -u)"),
    verification_command: z.string().describe("Command to run after patching, e.g. 'pytest tests/', 'npm test', 'cargo test'"),
    timeout_seconds:      z.number().optional().default(60).describe("Max seconds for verification command (default 60)"),
    workdir:              z.string().optional().describe("Working directory for the verification command (defaults to file's directory)"),
  }),

  async execute(args, ctx: ToolContext): Promise<ExecuteResult> {
    const filePath   = String(args["file_path"] ?? "")
    const patchDiff  = String(args["patch_diff"] ?? "")
    const verifCmd   = String(args["verification_command"] ?? "")
    const timeoutSec = Number(args["timeout_seconds"] ?? 60)
    const workdir    = args["workdir"] ? String(args["workdir"]) : (ctx.workdir ?? process.cwd())

    const os = detectOS()
    const result: PatchResult = {
      os:                  os.name,
      success:             false,
      rolled_back:         false,
      patch_applied:       false,
      verification_output: "",
      verification_exit:   -1,
      files_changed:       extractChangedFiles(patchDiff),
    }

    if (!existsSync(filePath)) {
      return { output: JSON.stringify({ ...result, error: `File not found: ${filePath}` }, null, 2) }
    }

    // Check if we're in a git repo
    const isGit = spawnSync("git", ["rev-parse", "--git-dir"], {
      cwd: workdir, encoding: "utf8", timeout: 5000,
    }).status === 0

    // Backup regardless (safety net)
    const backupPath = backupFile(filePath)

    let patchErr = ""
    if (isGit) {
      const { ok, error } = applyPatchViaGit(patchDiff, workdir)
      if (!ok) {
        restoreFile(filePath, backupPath)
        return { output: JSON.stringify({ ...result, error }, null, 2) }
      }
      patchErr = error
    } else {
      // Non-git: apply manually using patch command
      const patchFile = join(tmpdir(), `aurict-patch-${Date.now()}.diff`)
      writeFileSync(patchFile, patchDiff, "utf8")
      const patchCmd = os.isWin
        ? spawnSync("git", ["apply", patchFile], { cwd: workdir, encoding: "utf8", timeout: 15_000 })
        : spawnSync("patch", ["-p1", "--input", patchFile], { cwd: workdir, encoding: "utf8", timeout: 15_000 })
      try { require("node:fs").unlinkSync(patchFile) } catch { /* ignore */ }

      if (patchCmd.status !== 0) {
        restoreFile(filePath, backupPath)
        return { output: JSON.stringify({
          ...result,
          error: `Patch failed: ${patchCmd.stderr?.trim() ?? "unknown error"}`,
        }, null, 2) }
      }
    }

    result.patch_applied = true

    // Run verification
    const verif = runVerification(verifCmd, workdir, timeoutSec)
    result.verification_output = verif.timedOut
      ? `[TIMED OUT after ${timeoutSec}s]\n${verif.output}`
      : verif.output
    result.verification_exit = verif.exit

    if (verif.exit !== 0 || verif.timedOut) {
      // Rollback
      if (isGit) {
        revertPatchViaGit(patchDiff, workdir)
      } else {
        restoreFile(filePath, backupPath)
      }
      result.rolled_back = true
      result.error = `Verification failed (exit ${verif.exit}) — patch rolled back`
    } else {
      // Success — remove backup
      try { require("node:fs").unlinkSync(backupPath) } catch { /* ignore */ }
      result.success = true
    }

    if (patchErr) result.error = patchErr
    return { output: JSON.stringify(result, null, 2) }
  },
}
