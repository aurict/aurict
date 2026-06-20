/**
 * User-configurable hooks loaded from:
 *   ~/.aurict/hooks.json  (global)
 *   .aurict/hooks.json    (project — merged on top)
 *
 * Format:
 * {
 *   "v1.session.start":  [{ "shell": "notify-send 'Aurict started'" }],
 *   "v1.tool.after":     [{ "shell": "echo done >> ~/aurict.log" }],
 *   "v1.session.end":    [{ "shell": "osascript -e 'display notification \"Done\"'" }]
 * }
 *
 * Each shell command receives the hook payload as JSON in the AURICT_HOOK_PAYLOAD env var.
 * Shell hooks run with a 5-second timeout and do NOT block the main flow on error.
 */

import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { homedir } from "node:os"
import { spawnSync } from "node:child_process"
import { getShell } from "../util/shell.js"
import { hooks } from "./emitter.js"
import type { HookName } from "./types.js"

type UserHookEntry = { shell: string }
type UserHooksFile = Partial<Record<string, UserHookEntry[]>>

const SHELL_TIMEOUT_MS = 5_000

function loadHooksFile(path: string): UserHooksFile {
  if (!existsSync(path)) return {}
  try {
    return JSON.parse(readFileSync(path, "utf8")) as UserHooksFile
  } catch {
    console.error(`[aurict] Warning: failed to parse hooks file: ${path}`)
    return {}
  }
}

function mergeHooks(a: UserHooksFile, b: UserHooksFile): UserHooksFile {
  const result: UserHooksFile = { ...a }
  for (const [event, entries] of Object.entries(b)) {
    result[event] = [...(result[event] ?? []), ...(entries ?? [])]
  }
  return result
}

function runShellHook(command: string, payload: unknown): void {
  // On Unix keep `sh` (POSIX-compatible, no bash dependency).
  // On Windows use the detected shell (Git Bash or PowerShell).
  const [exe, flag] = process.platform === "win32"
    ? [getShell().executable, getShell().flag]
    : ["sh", "-c"]
  try {
    spawnSync(exe, [flag, command], {
      timeout: SHELL_TIMEOUT_MS,
      env: {
        ...process.env,
        AURICT_HOOK_PAYLOAD: JSON.stringify(payload),
      },
      stdio: "ignore",
    })
  } catch {
    // Shell hooks never crash the main process
  }
}

let registered = false

export function loadUserHooks(projectDir: string): void {
  if (registered) return
  registered = true

  const globalPath  = join(homedir(), ".aurict", "hooks.json")
  const projectPath = join(projectDir, ".aurict", "hooks.json")

  const globalHooks  = loadHooksFile(globalPath)
  const projectHooks = loadHooksFile(projectPath)
  const merged       = mergeHooks(globalHooks, projectHooks)

  const entryCount = Object.values(merged).reduce((n, v) => n + (v?.length ?? 0), 0)
  if (entryCount === 0) return

  for (const [eventName, entries] of Object.entries(merged)) {
    if (!entries || entries.length === 0) continue

    hooks.on(eventName as HookName, async (payload) => {
      for (const entry of entries) {
        if (entry.shell) runShellHook(entry.shell, payload)
      }
      return payload
    }, { priority: 90 })
  }

  const eventCount = Object.keys(merged).filter(k => (merged[k]?.length ?? 0) > 0).length
  console.error(`[aurict] User hooks: ${entryCount} handler${entryCount !== 1 ? "s" : ""} across ${eventCount} event${eventCount !== 1 ? "s" : ""}`)
}
