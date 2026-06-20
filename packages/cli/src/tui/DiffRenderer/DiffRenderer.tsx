/**
 * DiffRenderer — Gelişmiş diff görüntüleyici
 *
 * Üç mod:
 *  - "unified":     +/- işaretleriyle tek sütun
 *  - "side-by-side": eski/sol, yeni/sağ iki sütun
 *  - "raw":         olduğu gibi (renkli unified diff)
 *
 * Özellikler:
 *  - Hunk navigation (n/p ile)
 *  - Mode toggle (u ile)
 *  - Satır numaraları (eski/yeni ayrı)
 *  - Word-level inline diff (side-by-side modda)
 *  - Tema-uyumlu renkler
 */

import React, { useState, useMemo } from "react"
import { Box, Text } from "ink"
import { useTheme } from "../../utils/theme.js"
import { HStack, VStack, Badge, KeyHint, Typo, Spacer } from "../design-system/index.js"
import { useBinding, useBindingHints } from "../../keybindings/index.js"
import { parseRawDiff, diffTexts, suggestDiffMode, wordDiff,
         type ParsedDiff, type DiffLine, type Hunk, type DiffMode } from "./logic.js"

// ── Props ────────────────────────────────────────────────────────────────────

export interface DiffRendererProps {
  /** Raw unified diff string VEYA */
  rawDiff?:     string
  /** Eski/yeni metin (alternatif) */
  oldText?:     string
  newText?:     string
  fileName?:    string
  /** İlk mode (default: suggestDiffDiffMode) */
  initialMode?: DiffMode
  /** Hunk başına context satır sayısı (eski/yeni metin diff'i için) */
  contextLines?: number
  /** Maksimum hunk sayısı (gösterilecek) */
  maxHunks?:    number
  /** Mod değiştirmeye izin ver (u tuşu) */
  enableModeToggle?: boolean
  /** Hunk navigasyonuna izin ver (n/p tuşları) */
  enableHunkNav?:    boolean
  /** Hata göster (örn. parse hatası) */
  onError?:     (e: string) => void
}

// ── Ana bileşen ──────────────────────────────────────────────────────────────

export function DiffRenderer({
  rawDiff,
  oldText,
  newText,
  fileName,
  initialMode,
  contextLines = 3,
  maxHunks = 10,
  enableModeToggle = true,
  enableHunkNav = true,
}: DiffRendererProps) {
  const theme = useTheme()
  const [mode, setMode]           = useState<DiffMode>(initialMode ?? "unified")
  const [activeHunk, setActiveHunk] = useState(0)

  // Parse: raw diff varsa onu kullan, yoksa old/new'den hesapla
  const parsed = useMemo<ParsedDiff | null>(() => {
    if (rawDiff) {
      return parseRawDiff(rawDiff)
    }
    if (oldText !== undefined && newText !== undefined) {
      return diffTexts(oldText, newText, contextLines)
    }
    return null
  }, [rawDiff, oldText, newText, contextLines])

  // Mode suggestion
  React.useEffect(() => {
    if (parsed && !initialMode) {
      setMode(suggestDiffMode(parsed))
    }
  }, [parsed, initialMode])

  // Rules of Hooks: tüm hook çağrıları erken return'lerden önce
  const hunkCount = parsed?.hunks.length ?? 0

  const { hints } = useBindingHints({
    actions: [
      ...(enableModeToggle ? [{ action: "diff.toggle-view" as const, label: "view" }] : []),
      ...(enableHunkNav && hunkCount > 1 ? [
        { action: "diff.next-hunk" as const, label: "next" },
        { action: "diff.prev-hunk" as const, label: "prev" },
      ] : []),
    ],
  })

  // Hunk nav
  useBinding({
    action: "diff.next-hunk",
    context: "modal",
    onTrigger: () => {
      if (!parsed) return
      setActiveHunk((i) => Math.min(i + 1, parsed.hunks.length - 1))
    },
  })
  useBinding({
    action: "diff.prev-hunk",
    context: "modal",
    onTrigger: () => setActiveHunk((i) => Math.max(i - 1, 0)),
  })
  useBinding({
    action: "diff.toggle-view",
    context: "modal",
    onTrigger: () => {
      if (!parsed) return
      // raw mod yalnızca rawDiff varsa anlamlı
      if (rawDiff) {
        setMode((m) => m === "unified" ? "side-by-side" : m === "side-by-side" ? "raw" : "unified")
      } else {
        setMode((m) => m === "unified" ? "side-by-side" : "unified")
      }
    },
  })

  if (!parsed) {
    return <Text color={theme.textDim} dimColor>diff: no content</Text>
  }

  if (parsed.hunks.length === 0) {
    return <Text color={theme.textDim} dimColor>diff: no changes</Text>
  }

  const shown = parsed.hunks.slice(0, maxHunks)
  const hidden = parsed.hunks.length - shown.length

  return (
    <VStack gap="none">
      {/* Header */}
      <HStack gap="sm" paddingX="xs">
        {fileName && <Typo variant="label" tone="dim">── {fileName} ──</Typo>}
        <Spacer />
        <Badge tone="success" variant="ghost">{`+${parsed.additions}`}</Badge>
        <Badge tone="error" variant="ghost">{`-${parsed.deletions}`}</Badge>
        <Badge tone="muted" variant="outline">{mode}</Badge>
        {hints.map((h) => (
          <KeyHint key={h.action} action={h.label} keys={h.key} />
        ))}
      </HStack>

      {/* Body — mode'a göre farklı render */}
      {mode === "unified" && (
        <UnifiedView hunks={shown} activeHunk={enableHunkNav ? activeHunk : -1} />
      )}
      {mode === "side-by-side" && (
        <SideBySideView hunks={shown} activeHunk={enableHunkNav ? activeHunk : -1} />
      )}
      {mode === "raw" && (
        <RawView raw={rawDiff ?? ""} />
      )}

      {hidden > 0 && (
        <Text color={theme.textDim} dimColor>⋯ {hidden} more hunk{hidden > 1 ? "s" : ""}</Text>
      )}
    </VStack>
  )
}

// ── Unified view ─────────────────────────────────────────────────────────────

function UnifiedView({ hunks, activeHunk }: { hunks: Hunk[]; activeHunk: number }) {
  const theme = useTheme()

  return (
    <VStack gap="none">
      {hunks.map((hunk, hi) => (
        <VStack key={hi} gap="none"
          {...(activeHunk === hi ? { borderStyle: "single" as const, borderColor: theme.accent } : {})}
        >
          <Text color={theme.borderBright} dimColor>{hunk.header}</Text>
          {hunk.lines.map((line, li) => (
            <DiffLineView key={li} line={line} />
          ))}
        </VStack>
      ))}
    </VStack>
  )
}

// ── Side-by-side view ───────────────────────────────────────────────────────

function SideBySideView({ hunks, activeHunk }: { hunks: Hunk[]; activeHunk: number }) {
  const theme = useTheme()

  return (
    <VStack gap="none">
      {hunks.map((hunk, hi) => (
        <VStack key={hi} gap="none"
          {...(activeHunk === hi ? { borderStyle: "single" as const, borderColor: theme.accent } : {})}
        >
          <Text color={theme.borderBright} dimColor>{hunk.header}</Text>
          {pairLines(hunk.lines).map((pair, pi) => (
            <SideBySideLine key={pi} left={pair[0]} right={pair[1]} />
          ))}
        </VStack>
      ))}
    </VStack>
  )
}

/**
 * Add/remove satırları eşleştirip yan yana getirir.
 * Context satırları her iki tarafta da görünür.
 */
function pairLines(lines: DiffLine[]): Array<[DiffLine | null, DiffLine | null]> {
  const pairs: Array<[DiffLine | null, DiffLine | null]> = []
  let i = 0
  while (i < lines.length) {
    const l = lines[i]!
    if (l.type === "context") {
      pairs.push([l, l])
      i++
    } else if (l.type === "remove") {
      // Eşleşen add varsa sağ tarafa koy
      const next = lines[i + 1]
      if (next && next.type === "add") {
        pairs.push([l, next])
        i += 2
      } else {
        pairs.push([l, null])
        i++
      }
    } else if (l.type === "add") {
      pairs.push([null, l])
      i++
    } else {
      i++
    }
  }
  return pairs
}

function SideBySideLine({ left, right }: { left: DiffLine | null; right: DiffLine | null }) {
  const theme = useTheme()
  const termCols = process.stdout.columns ?? 80
  const halfW = Math.floor((termCols - 6) / 2)

  return (
    <Box flexDirection="row">
      {/* Sol — eski */}
      <Box width={halfW} flexShrink={0}>
        <Text color={theme.textDim}>{left?.oldLineNum?.toString().padStart(4) ?? "    "}</Text>
        <Text> </Text>
        <SideLineContent line={left} align="left" counterpart={right} />
      </Box>
      {/* Ayraç */}
      <Text color={theme.borderDim}>│</Text>
      {/* Sağ — yeni */}
      <Box width={halfW} flexShrink={0}>
        <Text color={theme.textDim}>{right?.newLineNum?.toString().padStart(4) ?? "    "}</Text>
        <Text> </Text>
        <SideLineContent line={right} align="right" counterpart={left} />
      </Box>
    </Box>
  )
}

function SideLineContent({
  line, align, counterpart,
}: { line: DiffLine | null; align: "left" | "right"; counterpart: DiffLine | null }) {
  const theme = useTheme()

  if (!line) {
    return <Text color={theme.borderDim} dimColor>{" ".repeat(20)}</Text>
  }

  if (line.type === "context") {
    return <Text color={theme.textDim} dimColor>  {truncate(line.content, 30)}</Text>
  }

  // Add/Remove: word-level inline diff göster
  if (counterpart && counterpart.type !== "context" && counterpart.type !== line.type) {
    // Eşleşen satır var, kelime bazlı diff göster
    const a = line.type === "remove" ? line.content : counterpart.content
    const b = line.type === "add"    ? line.content : counterpart.content
    const { removed, added } = wordDiff(a, b)
    const ranges = line.type === "remove" ? removed : added
    const baseColor = line.type === "add" ? theme.success : theme.error
    const highlightColor = line.type === "add" ? "#86efac" : "#fca5a5"

    // Render: content içinde ranges'e denk gelen kısımları highlight'la
    return (
      <Text color={baseColor}>
        {line.type === "add" ? "+" : "-"}
        {renderHighlighted(line.content, ranges, highlightColor)}
      </Text>
    )
  }

  // Tek başına add/remove
  const baseColor = line.type === "add" ? theme.success : theme.error
  return <Text color={baseColor}>{line.type === "add" ? "+" : "-"} {truncate(line.content, 30)}</Text>
}

function renderHighlighted(text: string, ranges: Array<{ start: number; end: number }>, color: string) {
  if (ranges.length === 0) return text
  const sorted = [...ranges].sort((a, b) => a.start - b.start)
  const parts: React.ReactNode[] = []
  let cursor = 0
  for (let i = 0; i < sorted.length; i++) {
    const r = sorted[i]!
    if (r.start > cursor) parts.push(text.slice(cursor, r.start))
    parts.push(<Text key={i} color={color} bold>{text.slice(r.start, r.end)}</Text>)
    cursor = r.end
  }
  if (cursor < text.length) parts.push(text.slice(cursor))
  return <>{parts}</>
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + "…" : s
}

// ── Raw view ─────────────────────────────────────────────────────────────────

function RawView({ raw }: { raw: string }) {
  const theme = useTheme()
  if (!raw) return <Text color={theme.textDim} dimColor>(no raw diff)</Text>
  const lines = raw.split("\n")
  return (
    <VStack gap="none" paddingX="xs">
      {lines.map((line, i) => {
        if (line.startsWith("+++") || line.startsWith("---")) {
          return <Text key={i} color={theme.accent} bold>{line}</Text>
        }
        if (line.startsWith("@@")) {
          return <Text key={i} color={theme.warning}>{line}</Text>
        }
        if (line.startsWith("+")) {
          return <Text key={i} color={theme.success}>{line}</Text>
        }
        if (line.startsWith("-")) {
          return <Text key={i} color={theme.error}>{line}</Text>
        }
        return <Text key={i} color={theme.textDim}>{line}</Text>
      })}
    </VStack>
  )
}

// ── Tek satır görüntüleme (unified için) ────────────────────────────────────

function DiffLineView({ line }: { line: DiffLine }) {
  const theme = useTheme()
  const width = (process.stdout.columns ?? 80) - 12

  if (line.type === "add") {
    return (
      <Box>
        <Text color={theme.textDim}>{line.newLineNum?.toString().padStart(4) ?? "    "}</Text>
        <Text> </Text>
        <Text color={theme.success} bold>+</Text>
        <Text color={theme.success}> {truncate(line.content, width)}</Text>
      </Box>
    )
  }
  if (line.type === "remove") {
    return (
      <Box>
        <Text color={theme.textDim}>{line.oldLineNum?.toString().padStart(4) ?? "    "}</Text>
        <Text> </Text>
        <Text color={theme.error} bold>-</Text>
        <Text color={theme.error}> {truncate(line.content, width)}</Text>
      </Box>
    )
  }
  return (
    <Box>
      <Text color={theme.textDim}>{line.oldLineNum?.toString().padStart(4) ?? "    "}</Text>
      <Text> </Text>
      <Text color={theme.textDim}>  </Text>
      <Text color={theme.textDim}> {truncate(line.content, width)}</Text>
    </Box>
  )
}
