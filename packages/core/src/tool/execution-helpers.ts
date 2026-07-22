import { join, resolve } from "node:path"
import { classifyCommand } from "../terminal/classifier.js"
import { PermissionGate, PermissionStore } from "../permission/store.js"
import type { PermissionRequest, PermissionResponse } from "../permission/types.js"
import type { FlightReplayPolicy } from "../diagnostics/flight-recorder.js"
import type { PatchSummary } from "./built-in/apply-patch.js"
import type { ToolContext, ToolDef } from "./types.js"

const DEFAULT_TOOL_TIMEOUT_MS = 120_000
const PERMISSION_PROMPT_TIMEOUT_MS = 60_000
const TODO_ACTIONS = new Set(["list", "add", "complete", "delete"])

export function analyzeToolError(toolId: string, error: string): string {
  const value = error.toLowerCase()
  let hint = ""
  if (/cannot find module|module not found/.test(value)) hint = "Module resolution failure — check path spelling, file existence, or whether a build step is needed."
  else if (/error ts\d+|\.tsx?.*:\d+:\d+/.test(value)) hint = "TypeScript error — run 'tsc --noEmit' for the full error list before retrying."
  else if (/permission denied|eacces/.test(value)) hint = "Permission denied — check file/directory permissions."
  else if (toolId === "bash" && /command not found|not found/.test(value)) hint = "Binary not in PATH — check if it is installed."
  else if (/eaddrinuse|address already in use/.test(value)) hint = "Port already in use — find the process with lsof."
  else if (/no such file or directory|enoent/.test(value)) hint = "Path does not exist — inspect its parent directory."
  else if (/syntax error/.test(value)) hint = "Syntax error — check quotes, braces, and delimiters."
  else if (/out of memory|killed/.test(value)) hint = "Process killed due to memory or resource limits."
  return hint ? `${error}\n[Hint] ${hint}` : error
}

export function flightReplayPolicy(definition: ToolDef, args: Record<string, unknown>): { policy: FlightReplayPolicy; reason?: string } {
  if (definition.id === "bash") {
    const action = String(args["action"] ?? "run")
    if (action !== "run") return { policy: "blocked", reason: `Bash action '${action}' is stateful` }
    const analysis = classifyCommand(String(args["command"] ?? ""))
    if (analysis.level === "danger") return { policy: "blocked", reason: analysis.reason }
    return analysis.isReadOnly ? { policy: "safe" } : { policy: "confirm", reason: analysis.reason }
  }
  if (definition.spec?.category === "read") return { policy: "safe" }
  if (definition.spec?.category === "execute") return { policy: "confirm", reason: "Execution may mutate workspace state" }
  return { policy: "blocked", reason: `${definition.spec?.category ?? "unknown"} tools are not replayed automatically` }
}

export async function verifyLocalImports(content: string, absoluteFilePath: string, workdir: string): Promise<string | null> {
  const directory = absoluteFilePath.includes("/") ? absoluteFilePath.slice(0, absoluteFilePath.lastIndexOf("/")) : workdir
  const importPattern = /import\s+(?:type\s+)?\{([^}]+)\}\s+from\s+['"](\.[^'"]+)['"]/g
  const issues: string[] = []
  let match: RegExpExecArray | null
  let checks = 4
  while ((match = importPattern.exec(content)) !== null && checks-- > 0) {
    const names = match[1] ?? ""
    const sourcePath = match[2] ?? ""
    if (!sourcePath) continue
    const base = resolve(directory, sourcePath)
    const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, `${base}.jsx`, `${base}.mts`, `${base}/index.ts`, `${base}/index.tsx`, `${base}/index.js`]
    let target: string | undefined
    for (const candidate of candidates) {
      if (await Bun.file(candidate).exists().catch(() => false)) { target = candidate; break }
    }
    if (!target) continue
    try {
      const file = Bun.file(target)
      if (file.size > 100_000) continue
      const source = await file.text()
      for (const name of names.split(",").map(value => value.trim().replace(/\s+as\s+\w+$/, "").replace(/^type\s+/, "").trim()).filter(Boolean)) {
        if (!new RegExp(`\\bexport\\b[^;\\n]*\\b${escapeRegex(name)}\\b`).test(source)) issues.push(`'${name}' not exported from ${sourcePath}`)
      }
    } catch {
      // The actual write still runs and reports filesystem failures directly.
    }
  }
  return issues.length > 0 ? issues.join("; ") : null
}

export function withToolTimeout<T>(promise: Promise<T>, definition: ToolDef, onTimeout: () => void): Promise<T> {
  const timeoutMs = definition.timeoutMs ?? DEFAULT_TOOL_TIMEOUT_MS
  return withTimeout(promise, timeoutMs, onTimeout, `Tool '${definition.id}' timed out after ${timeoutMs / 1_000}s — aborted to prevent freeze`)
}

export function withTimeout<T>(promise: Promise<T>, timeoutMs: number, onTimeout?: () => void, message?: string): Promise<T> {
  return new Promise((resolvePromise, reject) => {
    const timer = setTimeout(() => {
      try { onTimeout?.() } catch { /* timeout callback cannot mask the timeout */ }
      reject(new Error(message ?? `operation timed out after ${timeoutMs / 1_000}s`))
    }, timeoutMs)
    promise.then(
      value => { clearTimeout(timer); resolvePromise(value) },
      error => { clearTimeout(timer); reject(error) },
    )
  })
}

export function isInsideWorkdir(filePath: string, workdir: string): boolean {
  const resolved = filePath.startsWith("/") ? filePath : join(workdir, filePath)
  const normalized = workdir.endsWith("/") ? workdir : `${workdir}/`
  return resolved.startsWith(normalized) || resolved === workdir
}

export function patchPattern(summary: PatchSummary): string {
  const files = affectedPatchPaths(summary)
  if (files.length === 0) return "*"
  return files.length <= 3 ? files.join(", ") : `${files.slice(0, 3).join(", ")} +${files.length - 3} more`
}

export function patchPermissionMetadata(summary: PatchSummary, patchText?: string, granular = false): Pick<PermissionRequest, "files" | "diff" | "patch"> {
  return {
    files: summary.files.map(file => ({
      path: file.path,
      action: file.action,
      ...(file.targetPath ? { targetPath: file.targetPath } : {}),
    })),
    diff: { added: summary.added, removed: summary.removed, fileCount: summary.files.length },
    ...(patchText ? { patch: { text: patchText, granular } } : {}),
  }
}

export function affectedPatchPaths(summary: PatchSummary): string[] {
  return [...new Set(summary.files.flatMap(file => file.action === "move" && file.targetPath ? [file.path, file.targetPath] : [file.path]))]
}

export function normalizePermissionPattern(toolId: string, pattern: string, workdir: string): string {
  return ["write", "edit", "apply_patch"].includes(toolId) ? resolve(workdir, pattern) : pattern
}

export function isPermissionApproved(toolId: string, pattern: string, summary: PatchSummary | undefined, workdir: string, scope: string): boolean {
  if (summary) {
    const paths = affectedPatchPaths(summary)
    return paths.length > 0 && paths.every(path => PermissionStore.isApproved(toolId, normalizePermissionPattern(toolId, path, workdir), scope))
  }
  return PermissionStore.isApproved(toolId, normalizePermissionPattern(toolId, pattern, workdir), scope)
}

export function approvePermission(toolId: string, pattern: string, summary: PatchSummary | undefined, directory: boolean, workdir: string, scope: string): void {
  const paths = summary ? affectedPatchPaths(summary) : [pattern]
  for (const path of paths) {
    const normalized = normalizePermissionPattern(toolId, path, workdir)
    if (directory) PermissionStore.approveDirectory(toolId, normalized, scope)
    else PermissionStore.approve(toolId, normalized, scope)
  }
}

export function waitForPermission(id: string, context: ToolContext): Promise<PermissionResponse> {
  return PermissionGate.wait(id, { signal: context.signal, timeoutMs: PERMISSION_PROMPT_TIMEOUT_MS })
}

export function normalizeKnownToolArgs(toolId: string, args: Record<string, unknown>): Record<string, unknown> {
  if (toolId !== "todo" || args["action"] !== undefined || typeof args["list"] !== "string" || !TODO_ACTIONS.has(args["list"])) return args
  return { ...args, action: args["list"] }
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
