import { displayColumnToOffset } from "./terminal-text/display-width.js"
import { clampGraphemeBoundary, graphemeAt } from "./terminal-text/graphemes.js"
import type { LocalPoint } from "./multiline-input-model.js"

export interface InputBounds {
  row: number
  col: number
  width: number
  height: number
}

export function inputPointFromTerminal(
  x: number,
  y: number,
  bounds: InputBounds,
  lines: string[],
): LocalPoint | null {
  const localRow = y - 1 - bounds.row
  const rawCol = x - 1 - bounds.col
  if (localRow < 0 || localRow >= bounds.height || rawCol < 0 || rawCol > bounds.width) return null
  const showLineNum = lines.length > 1
  const gutterWidth = showLineNum ? String(lines.length).length + 3 : 0
  const row = Math.min(localRow, lines.length - 1)
  const line = lines[row] ?? ""
  return {
    row,
    col: displayColumnToOffset(line, Math.max(0, rawCol - gutterWidth)),
  }
}

export function cursorLineParts(line: string, column: number): {
  before: string
  at: string
  after: string
} {
  const offset = clampGraphemeBoundary(line, column)
  const cursor = graphemeAt(line, offset)
  return {
    before: line.slice(0, offset),
    at: cursor?.segment ?? " ",
    after: line.slice(cursor?.end ?? offset),
  }
}
