import { parseRawDiff, wordRangesByLine, type DiffLine, type Hunk } from "../DiffRenderer/logic.js"
import { wrapStyledSegments } from "../terminal-text/wrap-segments.js"
import { glyph } from "../terminal-glyphs.js"
import { C, detectLang, tokenizeLine, type Lang } from "../../utils/highlight.js"
import type { SyntaxKind, TranscriptRow, TranscriptSegment, TranscriptTone } from "./row-model.js"

const SYNTAX_BY_COLOR = new Map<string, SyntaxKind>(
  (Object.entries(C) as Array<[SyntaxKind | "plain", string]>)
    .filter((entry): entry is [SyntaxKind, string] => entry[0] !== "plain")
    .map(([kind, color]) => [color, kind]),
)

export function diffLanguage(file: string): Lang | undefined {
  const extension = file.includes(".") ? file.slice(file.lastIndexOf(".") + 1) : ""
  const lang = detectLang(extension)
  return lang === "generic" ? undefined : lang
}

/**
 * Added and context lines carry syntax kinds; removed lines stay in the
 * removal tone so deletions read as deletions at a glance.
 */
function contentSegments(text: string, tone: TranscriptTone, lang: Lang | undefined): TranscriptSegment[] {
  if (!lang || tone === "diff-remove") return [{ text, tone }]
  return tokenizeLine(text, lang).map((token) => {
    const syntax = SYNTAX_BY_COLOR.get(token.color)
    return { text: token.text, tone, ...(syntax ? { syntax } : {}) }
  })
}

/** Bolds the characters a word-level diff marks as changed, splitting segments as needed. */
function emphasize(segments: TranscriptSegment[], ranges: Array<{ start: number; end: number }>): TranscriptSegment[] {
  if (ranges.length === 0) return segments
  const changed = (offset: number) => ranges.some((range) => offset >= range.start && offset < range.end)
  const output: TranscriptSegment[] = []
  let offset = 0
  for (const segment of segments) {
    let start = 0
    for (let index = 1; index <= segment.text.length; index++) {
      if (index < segment.text.length && changed(offset + index) === changed(offset + start)) continue
      const piece = segment.text.slice(start, index)
      output.push(changed(offset + start) ? { ...segment, text: piece, bold: true } : { ...segment, text: piece })
      start = index
    }
    offset += segment.text.length
  }
  return output.length > 0 ? output : segments
}

const DIFF_INDENT = "    "

function lineNumber(line: DiffLine): number | undefined {
  return line.type === "remove" ? line.oldLineNum : line.newLineNum ?? line.oldLineNum
}

function lineSurface(line: DiffLine): TranscriptRow["surface"] {
  if (line.type === "add") return "diff-add"
  if (line.type === "remove") return "diff-remove"
  return undefined
}

/** `    12 +content`: right-aligned number, sign, then content, as Codex prints edits. */
function renderLine(
  line: DiffLine,
  ranges: Array<{ start: number; end: number }>,
  id: string,
  detailId: string,
  width: number,
  lang: Lang | undefined,
  numberWidth: number,
): TranscriptRow[] {
  const sign = line.type === "add" ? "+" : line.type === "remove" ? "-" : " "
  const tone: TranscriptTone = line.type === "context" ? "diff-context" : line.type === "add" ? "diff-add" : "diff-remove"
  const gutter = `${DIFF_INDENT}${(lineNumber(line)?.toString() ?? "").padStart(numberWidth)} `
  const contentWidth = Math.max(4, width - gutter.length - 1)
  const content = emphasize(contentSegments(line.content, tone, lang), ranges)
  const wrapped = wrapStyledSegments(content.length > 0 ? content : [{ text: "", tone }], contentWidth)
  const surface = lineSurface(line)
  return wrapped.map((segments, index) => ({
    id: `${id}:${index}`,
    segments: [
      { text: index === 0 ? gutter : " ".repeat(gutter.length), tone: "muted", dim: true },
      { text: index === 0 ? sign : " ", tone },
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

/**
 * Projects every hunk and line under the "• Edited …" header the tool cell
 * prints. Multi-file edits get a "  └ file (+a -b)" line per file.
 */
export function projectInlineDiff(rawDiff: string, id: string, detailId: string, width: number, multiFile = false): TranscriptRow[] {
  const parsed = parseRawDiff(rawDiff)
  const rows: TranscriptRow[] = []
  const groups = groupHunks(parsed.hunks)
  groups.forEach((group, groupIndex) => {
    const lang = diffLanguage(group.file)
    const numberWidth = Math.max(1, ...group.hunks.flatMap((hunk) => hunk.lines.map((line) => (lineNumber(line) ?? 0).toString().length)))
    if (multiFile || groups.length > 1) {
      if (groupIndex > 0) rows.push({ id: `${id}:file:${groupIndex}:gap`, segments: [{ text: "", tone: "muted" }] })
      const stats = groupStats(group.hunks)
      rows.push({
        id: `${id}:file:${groupIndex}`,
        segments: [
          { text: `  ${glyph("close")} `, tone: "muted", dim: true },
          { text: group.file, tone: "assistant" },
          { text: " (", tone: "muted" },
          { text: `+${stats.additions}`, tone: "diff-add" },
          { text: " ", tone: "muted" },
          { text: `-${stats.deletions}`, tone: "diff-remove" },
          { text: ")", tone: "muted" },
        ],
        detailId,
      })
    }
    group.hunks.forEach((hunk, hunkIndex) => {
      if (hunkIndex > 0) rows.push({ id: `${id}:file:${groupIndex}:hunk:${hunkIndex}:gap`, segments: [{ text: `${DIFF_INDENT}${" ".repeat(numberWidth - 1)}${glyph("gap")}`, tone: "muted", dim: true }], detailId })
      const ranges = wordRangesByLine(hunk.lines)
      hunk.lines.forEach((line, lineIndex) => rows.push(...renderLine(
        line,
        ranges.get(lineIndex) ?? [],
        `${id}:file:${groupIndex}:hunk:${hunkIndex}:line:${lineIndex}`,
        detailId,
        width,
        lang,
        numberWidth,
      )))
    })
  })
  return rows
}
