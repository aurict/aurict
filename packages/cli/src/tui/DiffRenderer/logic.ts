/**
 * Diff — Pure logic hook + tipler
 *
 * DiffRenderer için yardımcı logic. React'ten bağımsız, kolay test edilir.
 *
 * Desteklenen diff formatları:
 *  1. Raw unified diff ("---", "+++", "@@", "+", "-")
 *  2. Eski/yeni metin → computeDiff (core'dan) ile hunk listesi
 *
 * Çıktı: normalize edilmiş "Hunk" listesi — renderer bunu tüketir.
 */

import { computeDiff } from "@aurict/core"

// ── Tipler ───────────────────────────────────────────────────────────────────

export type LineType = "add" | "remove" | "context"

export interface DiffLine {
  type:        LineType
  content:     string
  /** Eski dosyadaki satır numarası (1-based), yoksa undefined */
  oldLineNum?: number
  /** Yeni dosyadaki satır numarası (1-based), yoksa undefined */
  newLineNum?: number
}

export interface Hunk {
  /** "header" satırı (raw formatta "@@ -X,Y +A,B @@") veya "" */
  header:    string
  oldStart:  number
  newStart:  number
  lines:     DiffLine[]
  /** Eğer word-level diff ise, eklenen/silinen kelimelerin pozisyonları */
  inline?:   Array<{
    lineIdx:  number
    /** [start, end) aralığındaki kelimeler vurgulu */
    ranges:   Array<{ start: number; end: number; kind: "add" | "remove" }>
  }>
}

export interface ParsedDiff {
  fileName?:  string
  hunks:      Hunk[]
  additions:  number
  deletions:  number
}

// ── Raw diff parser ──────────────────────────────────────────────────────────

/**
 * Raw unified diff string'ini parse eder.
 * Format:
 *   --- a/file.txt
 *   +++ b/file.txt
 *   @@ -X,Y +A,B @@
 *   context
 *   -removed
 *   +added
 */
export function parseRawDiff(text: string): ParsedDiff {
  const allLines = text.split("\n")
  const hunks: Hunk[] = []
  const fileName = extractFileName(allLines)
  let additions = 0
  let deletions = 0

  let currentHunk: Hunk | null = null
  let oldLineNum = 0
  let newLineNum = 0

  for (const line of allLines) {
    // File headers
    if (line.startsWith("---") || line.startsWith("+++")) continue

    // Hunk header
    const hunkMatch = line.match(/^@@\s+-(\d+)(?:,(\d+))?\s+\+(\d+)(?:,(\d+))?\s+@@/)
    if (hunkMatch) {
      if (currentHunk) hunks.push(currentHunk)
      currentHunk = {
        header:   line,
        oldStart: parseInt(hunkMatch[1]!, 10),
        newStart: parseInt(hunkMatch[3]!, 10),
        lines:    [],
      }
      oldLineNum = currentHunk.oldStart
      newLineNum = currentHunk.newStart
      continue
    }

    if (!currentHunk) continue

    if (line.startsWith("+")) {
      additions++
      currentHunk.lines.push({
        type: "add",
        content: line.slice(1),
        newLineNum: newLineNum++,
      })
    } else if (line.startsWith("-")) {
      deletions++
      currentHunk.lines.push({
        type: "remove",
        content: line.slice(1),
        oldLineNum: oldLineNum++,
      })
    } else if (line.startsWith(" ") || line === "") {
      // Context line (boş satır = context, unified diff'te)
      currentHunk.lines.push({
        type: "context",
        content: line.startsWith(" ") ? line.slice(1) : "",
        oldLineNum: oldLineNum++,
        newLineNum: newLineNum++,
      })
    } else if (line.startsWith("\\")) {
      // "\ No newline at end of file" — skip
      continue
    }
  }

  if (currentHunk) hunks.push(currentHunk)

  return { ...(fileName ? { fileName } : {}), hunks, additions, deletions }
}

function extractFileName(lines: string[]): string | undefined {
  for (const l of lines) {
    if (l.startsWith("+++") || l.startsWith("---")) {
      const m = l.match(/^[\+\-]{3}\s+[ab]\/(.+?)(?:\s+\d.*)?$/)
      if (m && m[1] && m[1] !== "/dev/null") return m[1]
    }
  }
  return undefined
}

// ── Eski/yeni metin → hunks ─────────────────────────────────────────────────

/**
 * Eski/yeni metni hunks'a çevirir (computeDiff kullanarak).
 */
export function diffTexts(oldText: string, newText: string, contextLines = 3): ParsedDiff {
  const rawHunks = computeDiff(oldText, newText, contextLines)
  const hunks: Hunk[] = rawHunks.map((h: any) => {
    const lines: DiffLine[] = []
    let oldLineNum = h.oldStart
    let newLineNum = h.newStart

    for (const line of h.lines) {
      if (line.type === "add") {
        lines.push({ type: "add", content: line.content, newLineNum: newLineNum++ })
      } else if (line.type === "remove") {
        lines.push({ type: "remove", content: line.content, oldLineNum: oldLineNum++ })
      } else {
        lines.push({
          type: "context",
          content: line.content,
          oldLineNum: oldLineNum++,
          newLineNum: newLineNum++,
        })
      }
    }

    return {
      header: `@@ -${h.oldStart} +${h.newStart} @@`,
      oldStart: h.oldStart,
      newStart: h.newStart,
      lines,
    }
  })

  const additions = hunks.reduce((sum, h) => sum + h.lines.filter(l => l.type === "add").length, 0)
  const deletions = hunks.reduce((sum, h) => sum + h.lines.filter(l => l.type === "remove").length, 0)

  return { hunks, additions, deletions }
}

// ── Word-level inline diff (basit) ───────────────────────────────────────────

/**
 * İki satır arasında kelime bazlı diff çıkarır (LCS benzeri basit yaklaşım).
 * Side-by-side modda silinen satırın yanında + olarak gösterilir.
 *
 * Returns: ranges[]. Her range { start, end, kind: "add"|"remove" }
 */
export function wordDiff(a: string, b: string): {
  removed: Array<{ start: number; end: number }>
  added:   Array<{ start: number; end: number }>
} {
  // Basit kelime-tabanlı: kelimelere böl, common prefix/suffix bul
  const aWords = a.split(/(\s+)/)
  const bWords = b.split(/(\s+)/)

  // LCS dynamic programming
  const m = aWords.length, n = bWords.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      if (aWords[i] === bWords[j]) {
        dp[i]![j] = dp[i + 1]![j + 1]! + 1
      } else {
        dp[i]![j] = Math.max(dp[i + 1]![j]!, dp[i]![j + 1]!)
      }
    }
  }

  // Backtrack
  const removed: Array<{ start: number; end: number }> = []
  const added:   Array<{ start: number; end: number }> = []
  let i = 0, j = 0
  while (i < m && j < n) {
    if (aWords[i] === bWords[j]) { i++; j++ }
    else if (dp[i + 1]![j]! >= dp[i]![j + 1]!) { removed.push(wordRange(aWords, i)); i++ }
    else { added.push(wordRange(bWords, j)); j++ }
  }
  while (i < m) { removed.push(wordRange(aWords, i)); i++ }
  while (j < n) { added.push(wordRange(bWords, j)); j++ }

  return { removed, added }
}

function wordRange(words: string[], idx: number): { start: number; end: number } {
  let start = 0
  for (let k = 0; k < idx; k++) start += words[k]!.length
  return { start, end: start + words[idx]!.length }
}

// ── Mode detection ───────────────────────────────────────────────────────────

export type DiffMode = "unified" | "side-by-side" | "raw"

/**
 * İçeriğe göre en uygun mode'u öner.
 */
export function suggestDiffMode(parsed: ParsedDiff): DiffMode {
  // Çok büyük diff'lerde raw/unified daha okunur
  const totalLines = parsed.hunks.reduce((sum, h) => sum + h.lines.length, 0)
  if (totalLines > 200) return "unified"
  if (parsed.hunks.length === 1) return "side-by-side"
  return "unified"
}
