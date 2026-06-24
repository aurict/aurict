import React, { useState, useEffect } from "react"
import { Box, Text, useInput } from "ink"
import { readdirSync } from "node:fs"
import { join } from "node:path"
import { useTheme } from "../utils/theme.js"

const MAX_SHOW = 5

interface Match { display: string; full: string; isDir: boolean }

function listMatches(workdir: string, filter: string): Match[] {
  try {
    const lastSlash = filter.lastIndexOf("/")
    const dir       = lastSlash >= 0 ? filter.slice(0, lastSlash + 1) : ""
    const partial   = lastSlash >= 0 ? filter.slice(lastSlash + 1) : filter
    const searchDir = join(workdir, dir)
    const entries   = readdirSync(searchDir, { withFileTypes: true })
    return entries
      .filter((e) => !e.name.startsWith(".") && e.name.toLowerCase().startsWith(partial.toLowerCase()))
      .slice(0, MAX_SHOW)
      .map((e) => {
        const full = dir + e.name + (e.isDirectory() ? "/" : "")
        return { display: e.name + (e.isDirectory() ? "/" : ""), full, isDir: e.isDirectory() }
      })
  } catch {
    return []
  }
}

interface Props {
  filter:   string
  workdir:  string
  isActive: boolean
  onSelect: (path: string) => void
}

export function FileMention({ filter, workdir, isActive, onSelect }: Props) {
  const theme   = useTheme()
  const [idx, setIdx] = useState(0)
  const matches = listMatches(workdir, filter)

  useEffect(() => { setIdx(0) }, [filter])

  useInput((_char, key) => {
    if (!matches.length) return
    if (key.upArrow)             { setIdx((i) => Math.max(0, i - 1));                        return }
    if (key.downArrow)           { setIdx((i) => Math.min(matches.length - 1, i + 1));       return }
    if (key.tab || key.return)   { const m = matches[idx]; if (m) onSelect(m.full);          return }
  }, { isActive: isActive && matches.length > 0 })

  if (!isActive || !matches.length) return null

  return (
    <Box flexDirection="column" borderStyle="single" borderColor={theme.borderActive} paddingX={1} marginX={1}>
      <Text color={theme.accent} dimColor bold>@path</Text>
      {matches.map((m, i) => {
        const sel = i === idx
        return (
          <Box key={m.full}>
            <Text color={sel ? theme.accent : theme.textDim}>{sel ? "▸ " : "  "}</Text>
            <Text color={m.isDir ? theme.warning : theme.textPrimary} bold={sel}>
              {m.display}
            </Text>
          </Box>
        )
      })}
      <Text color={theme.textDim} dimColor>  up/down  tab/enter seç</Text>
    </Box>
  )
}
