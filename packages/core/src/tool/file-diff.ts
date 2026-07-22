import { computeDiff, type DiffHunk } from "../util/diff.js"

export interface UnifiedFileChange {
  beforePath?: string
  afterPath?: string
  beforeContent: string
  afterContent: string
}

const MAX_LCS_CELLS = 2_000_000

function fileLines(text: string): string[] {
  if (text.length === 0) return []
  const lines = text.split("\n")
  if (lines.at(-1) === "") lines.pop()
  return lines
}

function range(start: number, count: number): string {
  return `${start},${count}`
}

function renderHunk(hunk: DiffHunk): string[] {
  const oldCount = hunk.lines.filter((line) => line.type !== "add").length
  const newCount = hunk.lines.filter((line) => line.type !== "remove").length
  return [
    `@@ -${range(hunk.oldStart, oldCount)} +${range(hunk.newStart, newCount)} @@`,
    ...hunk.lines.map((line) => `${line.type === "add" ? "+" : line.type === "remove" ? "-" : " "}${line.content}`),
  ]
}

function wholeFileHunk(before: string[], after: string[]): string[] {
  return [
    `@@ -${range(before.length > 0 ? 1 : 0, before.length)} +${range(after.length > 0 ? 1 : 0, after.length)} @@`,
    ...before.map((line) => `-${line}`),
    ...after.map((line) => `+${line}`),
  ]
}

/** Produces a complete unified diff without allowing large files to trigger quadratic LCS memory use. */
export function createUnifiedFileDiff(change: UnifiedFileChange): string {
  if (change.beforeContent === change.afterContent && change.beforePath === change.afterPath) return ""
  const before = fileLines(change.beforeContent)
  const after = fileLines(change.afterContent)
  const oldHeader = change.beforePath ? `a/${change.beforePath}` : "/dev/null"
  const newHeader = change.afterPath ? `b/${change.afterPath}` : "/dev/null"
  const wholeFile = !change.beforePath
    || !change.afterPath
    || before.length * after.length > MAX_LCS_CELLS
  const body = wholeFile
    ? wholeFileHunk(before, after)
    : computeDiff(change.beforeContent, change.afterContent).flatMap(renderHunk)
  if (body.length === 0) return ""
  return [`--- ${oldHeader}`, `+++ ${newHeader}`, ...body].join("\n")
}

export function createUnifiedDiff(changes: readonly UnifiedFileChange[]): string {
  return changes.map(createUnifiedFileDiff).filter(Boolean).join("\n")
}
