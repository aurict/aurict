import React, { useState, useEffect, useRef } from "react"
import { useTerminalSize } from "./TerminalSizeContext.js"
import { Box, Text, useInput } from "./design-system/renderer.js"
import type { CommandDef } from "../commands/types.js"
import { useTheme } from "../utils/theme.js"
import { commandSearchText, commandSortKey } from "../commands/ui-metadata.js"
import { padDisplayEnd, truncateDisplayWidth } from "./terminal-text/display-width.js"

const MAX_SHOW = 6
const NAME_WIDTH = 14

function fit(text: string, width: number): string {
  return padDisplayEnd(truncateDisplayWidth(text, Math.max(0, width)), Math.max(0, width))
}

interface Props {
  filter:    string         // the text typed after "/"
  commands:  CommandDef[]
  isActive:  boolean
  onExecute: (cmdName: string) => void  // Enter: run the command
  onFill:    (cmdName: string) => void  // Tab: fill the input
}

// Subsequence fuzzy match: "mdl" → "model". A density score between 0-1 if it matches.
function fuzzySubsequence(text: string, query: string): number {
  let ti = 0; let qi = 0
  while (ti < text.length && qi < query.length) {
    if (text[ti] === query[qi]) qi++
    ti++
  }
  if (qi < query.length) return 0
  return query.length / text.length
}

function matchScore(c: CommandDef, filter: string): number {
  const f = filter.toLowerCase()
  if (!f) return 1
  const name = c.name.toLowerCase()
  const aliases = (c.aliases ?? []).map((a) => a.toLowerCase())
  if (name === f) return 100
  if (aliases.some((a) => a === f)) return 95
  if (name.startsWith(f)) return 80
  if (aliases.some((a) => a.startsWith(f))) return 75
  // Substring: search within name/alias even for a single character — shows more results
  if (name.includes(f)) return 60
  if (aliases.some((a) => a.includes(f))) return 55
  // Substring within description/category/usage (too noisy for 1 character)
  if (f.length >= 2 && commandSearchText(c).includes(f)) return 30
  // Fuzzy subsequence: "mdl" → /model, "cpt" → /checkpoints
  if (f.length >= 2) {
    const fz = fuzzySubsequence(name, f)
    if (fz > 0) return 10 + fz * 15
  }
  return 0
}

/** Codex's popup order (most used first), mapped to Aurict's equivalents; the rest follow by category. */
const CODEX_ORDER = [
  "models", "permissions", "keys", "memory", "skills", "review", "new", "sessions", "fork", "worktree",
  "init", "compact", "config", "agents", "btw", "export", "diff", "status", "mcp", "exit",
]

function codexRank(command: CommandDef): number {
  const rank = CODEX_ORDER.indexOf(command.name)
  return rank === -1 ? CODEX_ORDER.length : rank
}

export function getCommandMatches(filter: string, commands: CommandDef[]): CommandDef[] {
  return commands
    .map((c) => ({ cmd: c, score: matchScore(c, filter) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || codexRank(a.cmd) - codexRank(b.cmd) || commandSortKey(a.cmd).localeCompare(commandSortKey(b.cmd)))
    .map((r) => r.cmd)
}

export function CommandSuggest({ filter, commands, isActive, onExecute, onFill }: Props) {
  const theme = useTheme()
  // Selection moves over the FULL match list; the visible window is derived
  // at render time (offsetRef). Functional update + ref usage instead of
  // state: so we don't lose a step to stale closure values when coalesced
  // keypresses arrive back-to-back within the same tick.
  const [idx, setIdx] = useState(0)
  const idxRef    = useRef(0)   // the current value for consecutive keypresses within the same tick
  const offsetRef = useRef(0)

  const moveSel = (compute: (current: number) => number) => {
    idxRef.current = compute(idxRef.current)
    setIdx(idxRef.current)
  }

  // Reset the selection and window when the filter changes
  useEffect(() => { idxRef.current = 0; setIdx(0); offsetRef.current = 0 }, [filter])

  const { columns: termCols, rows: termRows } = useTerminalSize()
  const compact = termCols < 72
  const maxShow = termRows <= 26 ? 4 : termRows >= 34 ? 8 : MAX_SHOW
  const allMatches = getCommandMatches(filter, commands)
  const matchCount = allMatches.length

  // If the list shrank, pull the state back within bounds (prevents a stale-index bug)
  useEffect(() => {
    if (idxRef.current > matchCount - 1) {
      idxRef.current = Math.max(0, matchCount - 1)
      setIdx(idxRef.current)
    }
  }, [matchCount])

  const activeIdx = Math.min(idx, Math.max(0, matchCount - 1))

  // Derive the window at render time: the selected item always stays visible
  let winStart = offsetRef.current
  if (activeIdx < winStart) winStart = activeIdx
  if (activeIdx >= winStart + maxShow) winStart = activeIdx - maxShow + 1
  winStart = Math.max(0, Math.min(winStart, Math.max(0, matchCount - maxShow)))
  offsetRef.current = winStart

  const visible   = allMatches.slice(winStart, winStart + maxShow)
  const descWidth = Math.max(8, termCols - NAME_WIDTH - 8)
  const compactWidth = Math.max(4, termCols - 8)

  useInput((_char, key) => {
    if (!matchCount) return
    if (key.upArrow)   { moveSel((i) => Math.max(0, Math.min(i, matchCount - 1) - 1));              return }
    if (key.downArrow) { moveSel((i) => Math.min(matchCount - 1, Math.min(i, matchCount - 1) + 1)); return }
    if (key.tab)    { const c = allMatches[Math.min(idxRef.current, matchCount - 1)]; if (c) onFill(c.name);    return }
    if (key.return) { const c = allMatches[Math.min(idxRef.current, matchCount - 1)]; if (c) onExecute(c.name); return }
  }, { isActive: isActive && matchCount > 0 })

  if (!isActive || !allMatches.length) return null

  // Codex popup: no frame, "/name  description" rows, the selection filled
  // across the full width in the accent colour.
  const highlight = theme.accent
  return (
    <Box flexDirection="column" paddingLeft={2} width={Math.max(1, termCols - 2)}>
      {visible.map((cmd, i) => {
        const sel = winStart + i === activeIdx
        const name = fit("/" + cmd.name, NAME_WIDTH)
        const description = compact ? truncateDisplayWidth(cmd.description, Math.max(4, compactWidth - NAME_WIDTH)) : fit(cmd.description, descWidth)
        if (sel) return (
          <Box key={cmd.name} backgroundColor={highlight}>
            <Text color={theme.accentInk ?? "black"} bold wrap="truncate-end">{name}  {description}</Text>
          </Box>
        )
        return (
          <Text key={cmd.name} wrap="truncate-end">{name}  <Text color={theme.textDim}>{description}</Text></Text>
        )
      })}
    </Box>
  )
}
