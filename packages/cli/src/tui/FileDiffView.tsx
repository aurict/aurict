/**
 * FileDiffView / FileWriteView
 *
 * OpenClaude StructuredDiffFallback mantığının Aurict uyarlaması.
 * Her satır: satır_no  sigil  içerik  (tam genişlik arkaplan rengi)
 * Word-level diff: bitişik remove+add çiftlerinde değişen kelimeler daha koyu bg ile vurgulanır.
 * Hunk'lar arası: "..." ayırıcı.
 */

import React, { useMemo } from "react"
import { Box, Text } from "ink"
import { useTheme } from "../utils/theme.js"
import { parseRawDiff, wordDiff } from "./DiffRenderer/logic.js"
import type { DiffLine } from "./DiffRenderer/logic.js"

// Satır arkaplan renkleri — OpenClaude'un diffAdded/diffRemoved eşdeğerleri
const BG_ADD      = "#0d2b0d"
const BG_REMOVE   = "#2b0d0d"
const BG_ADD_WORD = "#1a5c1a"
const BG_REM_WORD = "#5c1a1a"

const MAX_PREVIEW = 10

// ── İşlenmiş satır tipi ───────────────────────────────────────────────────────

interface Line {
  type:        "add" | "remove" | "context"
  content:     string
  lineNum:     number
  wordRanges?: Array<{ start: number; end: number }>
}

// ── Word-level diff için bitişik remove+add çiftlerini eşleştir ───────────────

function pairLinesForWordDiff(raw: DiffLine[]): Line[] {
  const result: Line[] = []
  let i = 0

  while (i < raw.length) {
    const cur = raw[i]!

    if (cur.type === "remove") {
      // Ardışık remove'ları topla
      const removes: DiffLine[] = [cur]
      let j = i + 1
      while (j < raw.length && raw[j]!.type === "remove") removes.push(raw[j++]!)
      // Ardından gelen ardışık add'ları topla
      const adds: DiffLine[] = []
      while (j < raw.length && raw[j]!.type === "add") adds.push(raw[j++]!)

      const pairCount = Math.min(removes.length, adds.length)

      for (let k = 0; k < removes.length; k++) {
        const rm = removes[k]!
        if (k < pairCount) {
          const wd    = wordDiff(rm.content, adds[k]!.content)
          const total = rm.content.length + adds[k]!.content.length
          const changed = wd.removed.reduce((s, r) => s + r.end - r.start, 0) +
                          wd.added.reduce((s,  r) => s + r.end - r.start, 0)
          // %60'tan fazla değişiyorsa word diff gösterme (tam satır daha okunaklı)
          result.push({
            type:    "remove",
            content: rm.content,
            lineNum: rm.oldLineNum ?? 0,
            ...(total > 0 && changed / total < 0.6 ? { wordRanges: wd.removed } : {}),
          })
        } else {
          result.push({ type: "remove", content: rm.content, lineNum: rm.oldLineNum ?? 0 })
        }
      }

      for (let k = 0; k < adds.length; k++) {
        const ad = adds[k]!
        if (k < pairCount) {
          const wd    = wordDiff(removes[k]!.content, ad.content)
          const total = removes[k]!.content.length + ad.content.length
          const changed = wd.removed.reduce((s, r) => s + r.end - r.start, 0) +
                          wd.added.reduce((s,  r) => s + r.end - r.start, 0)
          result.push({
            type:    "add",
            content: ad.content,
            lineNum: ad.newLineNum ?? 0,
            ...(total > 0 && changed / total < 0.6 ? { wordRanges: wd.added } : {}),
          })
        } else {
          result.push({ type: "add", content: ad.content, lineNum: ad.newLineNum ?? 0 })
        }
      }

      i = j
    } else {
      result.push({
        type:    cur.type as "context",
        content: cur.content,
        lineNum: cur.newLineNum ?? cur.oldLineNum ?? 0,
      })
      i++
    }
  }

  return result
}

// ── Word vurgulamalı içerik render ───────────────────────────────────────────

function renderWithWordHighlight(
  text:   string,
  ranges: Array<{ start: number; end: number }>,
  bg:     string,
): React.ReactNode {
  const sorted = [...ranges].sort((a, b) => a.start - b.start)
  const parts: React.ReactNode[] = []
  let cursor = 0
  for (let i = 0; i < sorted.length; i++) {
    const { start, end } = sorted[i]!
    if (start > cursor) parts.push(text.slice(cursor, start))
    parts.push(<Text key={i} backgroundColor={bg}>{text.slice(start, end)}</Text>)
    cursor = end
  }
  if (cursor < text.length) parts.push(text.slice(cursor))
  return <>{parts}</>
}

// ── Tek diff satırı ───────────────────────────────────────────────────────────

function DiffLineRow({ line, numWidth, width }: { line: Line; numWidth: number; width: number }) {
  const theme   = useTheme()
  const numStr  = String(line.lineNum).padStart(numWidth)
  const sigil   = line.type === "add" ? "+" : line.type === "remove" ? "-" : " "
  // prefix genişliği: numWidth + space + sigil + space = numWidth + 3
  const prefixLen  = numWidth + 3
  const maxContent = Math.max(0, width - prefixLen)
  const content    = line.content.length > maxContent
    ? line.content.slice(0, maxContent - 1) + "…"
    : line.content
  const padding = " ".repeat(Math.max(0, width - prefixLen - content.length))

  // Context satırı: sade, soluk
  if (line.type === "context") {
    return (
      <Box>
        <Text dimColor>{numStr} {sigil} {content}</Text>
      </Box>
    )
  }

  const lineBg  = line.type === "add" ? BG_ADD    : BG_REMOVE
  const wordBg  = line.type === "add" ? BG_ADD_WORD : BG_REM_WORD
  const hasWord = (line.wordRanges?.length ?? 0) > 0

  return (
    <Box flexDirection="row">
      {/* Gutter: satır no + sigil — soluk */}
      <Text backgroundColor={lineBg} dimColor>{numStr} {sigil} </Text>
      {/* İçerik + padding — tam genişlik arkaplan */}
      <Text backgroundColor={lineBg}>
        {hasWord
          ? renderWithWordHighlight(content, line.wordRanges!, wordBg)
          : content}
        {padding}
      </Text>
    </Box>
  )
}

// ── FileDiffView ──────────────────────────────────────────────────────────────

interface FileDiffViewProps {
  unifiedDiff: string
  width:       number
}

export function FileDiffView({ unifiedDiff, width }: FileDiffViewProps) {
  const theme = useTheme()

  const { hunks, additions, deletions } = useMemo(
    () => parseRawDiff(unifiedDiff),
    [unifiedDiff],
  )

  if (hunks.length === 0) {
    return <Text color={theme.textDim} dimColor>No changes</Text>
  }

  // Satır numarası sütun genişliği
  let maxNum = 0
  for (const h of hunks) {
    for (const l of h.lines) {
      const n = l.newLineNum ?? l.oldLineNum ?? 0
      if (n > maxNum) maxNum = n
    }
  }
  const numWidth = Math.max(String(maxNum).length, 3)

  // Word-diff için satır çiftlerini eşleştir
  const processedHunks = useMemo(
    () => hunks.map(h => ({ ...h, lines: pairLinesForWordDiff(h.lines) })),
    [hunks],
  )

  // Özet satırı
  const addText = additions > 0 ? `Added ${additions} line${additions === 1 ? "" : "s"}` : ""
  const remText = deletions > 0 ? `removed ${deletions} line${deletions === 1 ? "" : "s"}` : ""
  const summary = [addText, remText].filter(Boolean).join(", ")

  return (
    <Box flexDirection="column">
      {summary && <Text color={theme.textSecondary}>{summary}</Text>}
      {processedHunks.map((hunk, hi) => (
        <Box key={hi} flexDirection="column">
          {hi > 0 && <Text color={theme.textDim} dimColor>...</Text>}
          {hunk.lines.map((line, li) => (
            <DiffLineRow key={li} line={line} numWidth={numWidth} width={width} />
          ))}
        </Box>
      ))}
    </Box>
  )
}

// ── FileWriteView — yeni dosya oluşturma önizlemesi ───────────────────────────

interface FileWriteViewProps {
  filePath:   string
  content:    string   // önizlenecek içerik (ilk MAX_PREVIEW_LINES satır)
  totalLines: number
  width:      number
}

export function FileWriteView({ filePath, content, totalLines, width }: FileWriteViewProps) {
  const theme       = useTheme()
  const previewLines = content.split("\n")
  const shown       = Math.min(previewLines.length, MAX_PREVIEW)
  const hidden      = totalLines - shown
  const relPath     = filePath.replace(process.env["HOME"] ?? "", "~")

  return (
    <Box flexDirection="column">
      <Text>
        Wrote <Text bold>{totalLines}</Text> line{totalLines === 1 ? "" : "s"} to{" "}
        <Text bold>{relPath}</Text>
      </Text>
      {previewLines.slice(0, shown).map((line, i) => (
        <Text key={i} color={theme.textSecondary}>
          {line.length > width - 2 ? line.slice(0, width - 3) + "…" : line}
        </Text>
      ))}
      {hidden > 0 && (
        <Text color={theme.textDim} dimColor>… +{hidden} line{hidden === 1 ? "" : "s"}</Text>
      )}
    </Box>
  )
}
