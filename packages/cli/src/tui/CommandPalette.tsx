import React, { useState, useMemo, useRef } from "react"
import { Box, Text, useInput } from "ink"
import { useTheme } from "../utils/theme.js"
import { Typo } from "./design-system/index.js"
import type { CommandDef } from "../commands/types.js"
import {
  COMMAND_CATEGORY_META,
  commandCategory,
  commandIcon,
  commandSearchText,
  commandSortKey,
} from "../commands/ui-metadata.js"

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  commands:       CommandDef[]
  recentCommands: string[]   // ordered by most-recent-first
  onSelect:       (cmd: CommandDef, args: string, action: "fill" | "run") => void
  onClose:        () => void
}

// ── Fuzzy score ───────────────────────────────────────────────────────────────

function score(cmd: CommandDef, query: string): number {
  if (!query) return 0
  const q    = query.toLowerCase()
  const name = cmd.name.toLowerCase()
  const aliases = cmd.aliases ?? []
  const search = commandSearchText(cmd)
  if (name === q)           return 100
  if (name.startsWith(q))   return 80
  if (aliases.some(a => a === q)) return 76
  if (aliases.some(a => a.startsWith(q))) return 70
  if (name.includes(q))     return 60
  if (search.includes(q))   return 30
  // character match
  let ni = 0; let qi = 0; let hits = 0
  while (ni < name.length && qi < q.length) {
    if (name[ni] === q[qi]) { hits++; qi++ }
    ni++
  }
  return qi === q.length ? (hits / q.length) * 20 : 0
}

function highlight(text: string, query: string): Array<{ s: string; bold: boolean }> {
  if (!query) return [{ s: text, bold: false }]
  const q = query.toLowerCase()
  const result: Array<{ s: string; bold: boolean }> = []
  let i = 0
  while (i < text.length) {
    const sub = text.slice(i).toLowerCase()
    if (sub.startsWith(q)) {
      result.push({ s: text.slice(i, i + q.length), bold: true })
      i += q.length
    } else {
      const last = result[result.length - 1]
      if (last && !last.bold) { last.s += text[i] }
      else { result.push({ s: text[i]!, bold: false }) }
      i++
    }
  }
  return result
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CommandPalette({ commands, recentCommands, onSelect, onClose }: Props) {
  const theme  = useTheme()
  const [query, setQuery]   = useState("")
  const [cursor, setCursor] = useState(0)

  const results = useMemo(() => {
    if (!query.trim()) {
      // No query: show recent commands first, then the rest
      const recentSet = new Set(recentCommands)
      const recent  = recentCommands
        .map(n => commands.find(c => c.name === n))
        .filter(Boolean) as CommandDef[]
      const rest    = commands.filter(c => !recentSet.has(c.name)).sort((a, b) => commandSortKey(a).localeCompare(commandSortKey(b)))
      return [
        ...recent.map(c => ({ cmd: c, isRecent: true,  sc: 0 })),
        ...rest.map(c   => ({ cmd: c, isRecent: false, sc: 0 })),
      ].slice(0, 14)
    }

    // With query: fuzzy filter+sort
    return commands
      .map(c => ({ cmd: c, isRecent: recentCommands.includes(c.name), sc: score(c, query.trim()) }))
      .filter(r => r.sc > 0)
      .sort((a, b) => b.sc - a.sc || commandSortKey(a.cmd).localeCompare(commandSortKey(b.cmd)))
      .slice(0, 14)
  }, [commands, recentCommands, query])

  const clampedCursor = Math.min(cursor, Math.max(0, results.length - 1))

  useInput((input, key) => {
    if (key.escape) { onClose(); return }
    if (key.upArrow)   { setCursor(c => Math.max(0, c - 1)); return }
    if (key.downArrow) { setCursor(c => Math.min(results.length - 1, c + 1)); return }
    if (key.return) {
      const r = results[clampedCursor]
      if (r) onSelect(r.cmd, "", key.ctrl ? "run" : "fill")
      return
    }
    if (key.backspace || key.delete) { setQuery(q => q.slice(0, -1)); setCursor(0); return }
    if (!key.ctrl && !key.meta && !key.escape && !key.return && input && input.length === 1) {
      setQuery(q => q + input); setCursor(0)
    }
  })

  const showRecentHeader = !query.trim() && recentCommands.length > 0

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={theme.accent}
      paddingX={1}
      width={60}
    >
      {/* Header */}
      <Box justifyContent="space-between">
        <Typo variant="bodyEmphasis" tone="primary">Command Palette</Typo>
        <Typo variant="caption" tone="muted">Esc close  ↑↓ select  Enter fill  Ctrl+Enter run</Typo>
      </Box>

      {/* Search */}
      <Box>
        <Text color={theme.accent}>/ </Text>
        <Text color={theme.textPrimary}>{query || " "}</Text>
        <Text color={theme.accent}>▋</Text>
      </Box>

      <Text color={theme.borderDim}>{"─".repeat(56)}</Text>

      {/* Results */}
      {results.length === 0 && (
        <Typo variant="body" tone="muted">No commands matched.</Typo>
      )}

      {results.map((r, i) => {
        const selected = i === clampedCursor
        const showSectionHeader = showRecentHeader && !r.isRecent && (i === 0 || results[i-1]?.isRecent === true)
        const showRecentSectionHeader = showRecentHeader && r.isRecent && i === 0
        const prevCategory = i > 0 ? commandCategory(results[i - 1]!.cmd) : null
        const category = commandCategory(r.cmd)
        const showCategoryHeader = !showRecentHeader && (!prevCategory || prevCategory !== category)
        const categoryMeta = COMMAND_CATEGORY_META[category]

        const nameParts = highlight(r.cmd.name, query)

        return (
          <React.Fragment key={r.cmd.name}>
            {showRecentSectionHeader && (
              <Text color={theme.textDim} dimColor>  Recently used</Text>
            )}
            {showSectionHeader && (
              <Text color={theme.textDim} dimColor>  All commands</Text>
            )}
            {showCategoryHeader && (
              <Text color={theme.textDim} dimColor>  {categoryMeta.icon} {categoryMeta.label}</Text>
            )}
            <Box gap={1} paddingLeft={1}>
              <Text color={selected ? theme.accent : theme.textDim}>
                {selected ? "▶" : " "}
              </Text>
              <Text color={selected ? theme.accent : theme.textSecondary}>
                {commandIcon(r.cmd)}
              </Text>
              <Box flexGrow={1}>
                <Text color={selected ? theme.textDim : theme.borderBright}>/</Text>
                {nameParts.map((p, j) => (
                  <Text
                    key={j}
                    color={selected ? theme.textPrimary : theme.textSecondary}
                    bold={p.bold || selected}
                  >{p.s}</Text>
                ))}
              </Box>
              {r.cmd.aliases?.length ? (
                <Text color={theme.textDim} dimColor>{r.cmd.aliases.slice(0, 2).map(a => `/${a}`).join(" ")}</Text>
              ) : null}
              <Text color={theme.textDim} dimColor wrap="truncate-end">
                {r.cmd.description.slice(0, 34)}
              </Text>
              {r.isRecent && !query && (
                <Text color={theme.textDim} dimColor>★</Text>
              )}
            </Box>
          </React.Fragment>
        )
      })}

      {/* Usage hint for selected */}
      {results[clampedCursor]?.cmd.usage && (
        <>
          <Text color={theme.borderDim}>{"─".repeat(56)}</Text>
          <Text color={theme.textDim} dimColor>  {results[clampedCursor]!.cmd.usage}</Text>
          <Text color={theme.borderBright} dimColor>  Enter fills input. Ctrl+Enter runs the selected command.</Text>
        </>
      )}
    </Box>
  )
}
