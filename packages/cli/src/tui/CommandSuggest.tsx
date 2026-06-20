import React, { useState, useEffect } from "react"
import { Box, Text, useInput } from "ink"
import type { CommandDef } from "../commands/types.js"
import { useTheme } from "../utils/theme.js"

const MAX_SHOW = 8

interface Props {
  filter:    string         // "/" sonrası yazılan metin
  commands:  CommandDef[]
  isActive:  boolean
  onExecute: (cmdName: string) => void  // Enter: komutu çalıştır
  onFill:    (cmdName: string) => void  // Tab: input'u doldur
}

export function CommandSuggest({ filter, commands, isActive, onExecute, onFill }: Props) {
  const theme = useTheme()
  const [idx, setIdx] = useState(0)

  // Filter değişince seçimi sıfırla
  useEffect(() => { setIdx(0) }, [filter])

  const allMatches = commands.filter((c) => {
    const f = filter.toLowerCase()
    return (
      c.name.startsWith(f) ||
      (c.aliases ?? []).some((a) => a.startsWith(f)) ||
      (f.length >= 2 && c.description.toLowerCase().includes(f))
    )
  })
  const filtered  = allMatches.slice(0, MAX_SHOW)
  const hiddenCount = allMatches.length - filtered.length

  useInput((_char, key) => {
    if (!filtered.length) return
    if (key.upArrow)   { setIdx((i) => Math.max(0, i - 1));                             return }
    if (key.downArrow) { setIdx((i) => Math.min(filtered.length - 1, i + 1));           return }
    if (key.tab)       { const c = filtered[idx]; if (c) onFill(c.name);                return }
    if (key.return)    { const c = filtered[idx]; if (c) onExecute(c.name);              return }
  }, { isActive: isActive && filtered.length > 0 })

  if (!isActive || !filtered.length) return null

  return (
    <Box flexDirection="column" borderStyle="round" borderColor={theme.borderActive} paddingX={1} marginX={1}>
      <Text color={theme.accent} dimColor bold>Commands  </Text>
      <Box flexDirection="column">
        {filtered.map((cmd, i) => {
          const sel = i === idx
          return (
            <Box key={cmd.name} gap={1}>
              <Text color={sel ? theme.accent : theme.textDim}>{sel ? "▶" : " "}</Text>
              <Text color={sel ? theme.accent : theme.textPrimary} bold={sel}>
                {"/" + cmd.name.padEnd(13)}
              </Text>
              {cmd.aliases?.length ? (
                <Text color={theme.textDim} dimColor>{"[" + cmd.aliases.join(",") + "]  "}</Text>
              ) : (
                <Text>{"  "}</Text>
              )}
              <Text color={sel ? theme.textPrimary : theme.textDim} dimColor={!sel}>
                {cmd.description}
              </Text>
              {sel && cmd.usage ? (
                <Text color={theme.textDim} dimColor>{"  · " + cmd.usage}</Text>
              ) : null}
            </Box>
          )
        })}
      </Box>
      {hiddenCount > 0 && (
        <Text color={theme.textDim} dimColor>  +{hiddenCount} more — type to narrow</Text>
      )}
      <Text color={theme.textDim} dimColor>↑↓ select  Tab fill  Enter run  Esc close</Text>
    </Box>
  )
}
