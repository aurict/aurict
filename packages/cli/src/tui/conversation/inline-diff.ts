import { parseRawDiff, wordRangesByLine, type DiffLine, type Hunk } from "../DiffRenderer/logic.js"
import { wrapStyledSegments } from "../terminal-text/wrap-segments.js"
import type { TranscriptRow, TranscriptSegment, TranscriptTone } from "./row-model.js"

function highlightedSegments(
  text: string,
  tone: TranscriptTone,
  ranges: Array<{ start: number; end: number }>,
): TranscriptSegment[] {
  if (ranges.length === 0) return [{ text, tone }]
  const segments: TranscriptSegment[] = []
  let cursor = 0
  for (const range of [...ranges].sort((a, b) => a.start - b.start)) {
    const start = Math.min(Math.max(range.start, cursor), text.length)
    const end = Math.min(Math.max(range.end, start), text.length)
    if (start > cursor) segments.push({ text: text.slice(cursor, start), tone })
    if (end > start) segments.push({ text: text.slice(start, end), tone, bold: true })
    cursor = end
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor), tone })
  return segments.length > 0 ? segments : [{ text: "", tone }]
}

function linePrefix(line: DiffLine, width: number): { text: string; tone: TranscriptTone } {
  const marker = line.type === "add" ? "+" : line.type === "remove" ? "−" : "│"
  const tone = line.type === "add" ? "diff-add" : line.type === "remove" ? "diff-remove" : "diff-context"
  if (width < 40) {
    const number = line.type === "add" ? line.newLineNum : line.oldLineNum ?? line.newLineNum
    return { text: `${number?.toString().padStart(4) ?? "    "} ${marker} `, tone }
  }
  const oldNumber = line.oldLineNum?.toString().padStart(4) ?? "    "
  const newNumber = line.newLineNum?.toString().padStart(4) ?? "    "
  return { text: `${oldNumber} ${newNumber} ${marker} `, tone }
}

function lineSurface(line: DiffLine): TranscriptRow["surface"] {
  if (line.type === "add") return "diff-add"
  if (line.type === "remove") return "diff-remove"
  return undefined
}

function renderLine(
  line: DiffLine,
  ranges: Array<{ start: number; end: number }>,
  id: string,
  detailId: string,
  width: number,
): TranscriptRow[] {
  const prefix = linePrefix(line, width)
  const contentTone = line.type === "context" ? "diff-context" : line.type === "add" ? "diff-add" : "diff-remove"
  const contentWidth = Math.max(4, width - prefix.text.length)
  const wrapped = wrapStyledSegments(highlightedSegments(line.content, contentTone, ranges), contentWidth)
  const surface = lineSurface(line)
  return wrapped.map((segments, index) => ({
      id: `${id}:${index}`,
      segments: [
        { text: index === 0 ? prefix.text : " ".repeat(prefix.text.length), tone: prefix.tone, dim: line.type === "context" },
        ...segments,
      ],
      detailId,
      ...(surface !== undefined ? { surface } : {}),
    }))
}

function groupHunks(hunks: Hunk[]): Array<{ file: string; hunks: Hunk[] }> {
  const groups = new Map<string, Hunk[]>()
  for (const hunk of hunks) {
    const file = hunk.fileName ?? "file"
    groups.set(file, [...(groups.get(file) ?? []), hunk])
  }
  return [...groups].map(([file, grouped]) => ({ file, hunks: grouped }))
}

function groupStats(hunks: Hunk[]): { additions: number; deletions: number } {
  return hunks.reduce((stats, hunk) => ({
    additions: stats.additions + hunk.lines.filter((line) => line.type === "add").length,
    deletions: stats.deletions + hunk.lines.filter((line) => line.type === "remove").length,
  }), { additions: 0, deletions: 0 })
}

/** Projects every hunk and line; vertical viewport scrolling is the only limiter. */
export function projectInlineDiff(rawDiff: string, id: string, detailId: string, width: number): TranscriptRow[] {
  const parsed = parseRawDiff(rawDiff)
  const rows: TranscriptRow[] = []
  groupHunks(parsed.hunks).forEach((group, groupIndex) => {
    const stats = groupStats(group.hunks)
    rows.push({
      id: `${id}:file:${groupIndex}`,
      segments: [
        { text: "  ◆ ", tone: "diff-hunk" },
        { text: group.file, tone: "assistant", bold: true },
        { text: `  +${stats.additions}`, tone: "diff-add", bold: true },
        { text: ` −${stats.deletions}`, tone: "diff-remove", bold: true },
        { text: "  · details ^O", tone: "muted" },
      ],
      detailId,
    })
    group.hunks.forEach((hunk, hunkIndex) => {
      rows.push({
        id: `${id}:file:${groupIndex}:hunk:${hunkIndex}`,
        segments: [{ text: `  ${hunk.header}`, tone: "diff-hunk", dim: true }],
        detailId,
        surface: "diff-hunk",
      })
      const ranges = wordRangesByLine(hunk.lines)
      hunk.lines.forEach((line, lineIndex) => rows.push(...renderLine(
        line,
        ranges.get(lineIndex) ?? [],
        `${id}:file:${groupIndex}:hunk:${hunkIndex}:line:${lineIndex}`,
        detailId,
        width,
      )))
    })
  })
  return rows
}
