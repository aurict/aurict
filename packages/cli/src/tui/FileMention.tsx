import React, { useState, useEffect, useSyncExternalStore } from "react"
import { Box, Text, useInput } from "./design-system/renderer.js"
import { readdirSync } from "node:fs"
import { join } from "node:path"
import { useTheme } from "../utils/theme.js"
import { fileIndexVersion, projectPaths, subscribeFileIndex } from "./file-index.js"
import { rankPaths } from "./file-search.js"

const MAX_SHOW = 6

interface Match { display: string; full: string; isDir: boolean }

function listDirectory(workdir: string, filter: string): Match[] {
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

let lastQuery: { key: string; matches: Match[] } | null = null

/**
 * `@` alone (or a path ending in `/`) browses that directory; anything else is
 * a fuzzy search over the whole project index.
 */
export function listFileMentionMatches(workdir: string, filter: string): Match[] {
  if (!filter || filter.endsWith("/")) return listDirectory(workdir, filter)
  const paths = projectPaths(workdir)
  const key = `${workdir}\0${fileIndexVersion(workdir)}\0${filter}`
  if (lastQuery?.key === key) return lastQuery.matches
  const matches = paths.length > 0
    ? rankPaths(filter, paths, MAX_SHOW).map(({ path }) => ({ display: path, full: path, isDir: path.endsWith("/") }))
    : listDirectory(workdir, filter)
  lastQuery = { key, matches }
  return matches
}

/** Re-renders the caller when the project file index finishes (re)loading. */
export function useFileIndexVersion(workdir: string): number {
  return useSyncExternalStore(subscribeFileIndex, () => fileIndexVersion(workdir))
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
  useFileIndexVersion(workdir)
  const matches = listFileMentionMatches(workdir, filter)

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
            <Text color={theme.textDim}>{parentOf(m.display)}</Text>
            <Text color={m.isDir ? theme.warning : theme.textPrimary} bold={sel}>
              {baseOf(m.display)}
            </Text>
          </Box>
        )
      })}
      <Text color={theme.textDim} dimColor>  up/down  tab/enter select</Text>
    </Box>
  )
}

function splitAt(path: string): number {
  const trimmed = path.endsWith("/") ? path.slice(0, -1) : path
  return trimmed.lastIndexOf("/") + 1
}

function parentOf(path: string): string {
  return path.slice(0, splitAt(path))
}

function baseOf(path: string): string {
  return path.slice(splitAt(path))
}
