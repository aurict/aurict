import type { ExecuteResult } from "./types.js"

export type DistilledToolStatus = "success" | "error"

export interface DistilledToolResult {
  tool: string
  status: DistilledToolStatus
  changedFiles: string[]
  filePaths: string[]
  errors: string[]
  importantLines: string[]
  verification: string[]
  nextImplication?: string | undefined
  outputPreview: string
}

const PATH_RE = /\b(?:[./][^\s"'`<>,;:()]+|(?:packages|apps|src|lib|test|tests)\/[^\s"'`<>,;:()]+)\.(?:ts|tsx|js|jsx|mjs|mts|json|md|css|html|py|go|rs|yml|yaml)\b/g

export function distillToolResult(
  tool: string,
  args: Record<string, unknown>,
  result: ExecuteResult,
): DistilledToolResult {
  const text = [result.error ?? "", result.output ?? ""].filter(Boolean).join("\n")
  const changedFiles = normalizeUnique([
    ...(result.metadata?.changedFiles ?? []),
    ...pathArgs(tool, args),
  ])
  const filePaths = normalizeUnique([
    ...changedFiles,
    ...extractPaths(text),
  ]).slice(0, 20)
  const errors = collectLines(text, /\b(error|failed|exception|enoent|cannot find|not assignable|permission denied|ts\d+)\b/i, 8)
  const verification = collectLines(text, /\b(type.?script|tsc|bun test|vitest|jest|playwright|passed|failed|0 fail|✓ no errors|skipped)\b/i, 8)
  const importantLines = collectImportantLines(text, tool, 10)
  const status: DistilledToolStatus = result.error ? "error" : "success"

  return {
    tool,
    status,
    changedFiles,
    filePaths,
    errors,
    importantLines,
    verification,
    ...(nextImplication(status, changedFiles, errors, verification) ? { nextImplication: nextImplication(status, changedFiles, errors, verification) } : {}),
    outputPreview: oneLine(text, 600),
  }
}

function pathArgs(tool: string, args: Record<string, unknown>): string[] {
  if (tool === "read" || tool === "write" || tool === "edit") {
    const path = String(args["path"] ?? "")
    return path ? [path] : []
  }
  return []
}

function extractPaths(text: string): string[] {
  return [...text.matchAll(PATH_RE)].map(match => match[0])
}

function collectLines(text: string, pattern: RegExp, limit: number): string[] {
  const out: string[] = []
  for (const rawLine of text.split(/\r?\n/)) {
    if (out.length >= limit) break
    const line = rawLine.trim()
    if (line.length < 3 || !pattern.test(line)) continue
    const compact = oneLine(line, 220)
    if (!out.includes(compact)) out.push(compact)
  }
  return out
}

function collectImportantLines(text: string, tool: string, limit: number): string[] {
  if (tool === "bash") {
    return collectLines(text, /\b(exit|error|failed|passed|warning|ts\d+|no errors|0 fail)\b/i, limit)
  }
  if (tool === "apply_patch" || tool === "edit" || tool === "write") {
    return collectLines(text, /\b(updated|wrote|created|deleted|changed|typescript|verify|related tests)\b/i, limit)
  }
  return collectLines(text, /\S/, Math.min(4, limit))
}

function nextImplication(
  status: DistilledToolStatus,
  changedFiles: string[],
  errors: string[],
  verification: string[],
): string | undefined {
  if (status === "error") return "Resolve the tool error before retrying the same step."
  if (errors.length > 0) return "Investigate the reported errors before claiming completion."
  if (changedFiles.length > 0 && verification.length === 0) return "Code changed; verification is still needed."
  if (verification.some(line => /\bfailed|error|ts\d+\b/i.test(line))) return "Verification failed; fix before final response."
  if (verification.length > 0) return "Verification signal is available; use it in the final status."
  return undefined
}

function normalizeUnique(items: string[]): string[] {
  const seen = new Set<string>()
  for (const item of items) {
    const clean = item.trim().replace(/[,;.)]+$/, "")
    if (clean) seen.add(clean)
  }
  return [...seen]
}

function oneLine(value: string, max: number): string {
  const clean = value.replace(/\s+/g, " ").trim()
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean
}
