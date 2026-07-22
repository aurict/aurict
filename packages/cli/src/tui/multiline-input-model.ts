import { clampGraphemeBoundary, graphemeSegments } from "./terminal-text/graphemes.js"

export interface LocalPoint { row: number; col: number }

export function extractRange(lines: string[], a: LocalPoint, b: LocalPoint): string {
  const [start, end] = a.row < b.row || (a.row === b.row && a.col <= b.col) ? [a, b] : [b, a]
  if (start.row === end.row) {
    const line = lines[start.row] ?? ""
    return line.slice(Math.min(start.col, end.col), Math.max(start.col, end.col))
  }
  const parts = [(lines[start.row] ?? "").slice(start.col)]
  for (let row = start.row + 1; row < end.row; row++) parts.push(lines[row] ?? "")
  parts.push((lines[end.row] ?? "").slice(0, end.col))
  return parts.join("\n")
}

export function splitLines(value: string): string[] {
  const lines = value.split("\n")
  return lines.length > 0 ? lines : [""]
}

export function wordLeft(line: string, column: number): number {
  const parts = graphemeSegments(line)
  const boundary = clampGraphemeBoundary(line, column)
  let index = parts.findIndex((part) => part.end > boundary)
  if (index < 0) index = parts.length
  while (index > 0 && /\s/u.test(parts[index - 1]!.segment)) index--
  while (index > 0 && /\S/u.test(parts[index - 1]!.segment)) index--
  return parts[index]?.start ?? line.length
}

export function wordRight(line: string, column: number): number {
  const parts = graphemeSegments(line)
  const boundary = clampGraphemeBoundary(line, column, "forward")
  let index = parts.findIndex((part) => part.start >= boundary)
  if (index < 0) return line.length
  while (index < parts.length && /\S/u.test(parts[index]!.segment)) index++
  while (index < parts.length && /\s/u.test(parts[index]!.segment)) index++
  return parts[index]?.start ?? line.length
}
