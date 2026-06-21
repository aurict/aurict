import React, { useState, useEffect } from "react"
import { Box, Text, useInput } from "ink"
import type { CommandDef } from "../commands/types.js"
import { useTheme } from "../utils/theme.js"
import {
  COMMAND_CATEGORY_META,
  commandCategory,
  commandIcon,
  commandSearchText,
  commandSortKey,
} from "../commands/ui-metadata.js"

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
    const aliases = c.aliases ?? []
    return (
      c.name.startsWith(f) ||
      aliases.some((a) => a.startsWith(f)) ||
      (f.length >= 2 && commandSearchText(c).includes(f))
    )
  }).sort((a, b) => commandSortKey(a).localeCompare(commandSortKey(b)))
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
          const category = COMMAND_CATEGORY_META[commandCategory(cmd)]
          return (
            <Box key={cmd.name} flexDirection="column">
              <Box gap={1}>
                <Text color={sel ? theme.accent : theme.textDim}>{sel ? "▶" : " "}</Text>
                <Text color={sel ? theme.accent : theme.textDim}>{commandIcon(cmd)}</Text>
                <Text color={sel ? theme.accent : theme.textPrimary} bold={sel}>
                  {"/" + cmd.name.padEnd(13)}
                </Text>
                <Text color={theme.textDim} dimColor>{category.label.padEnd(8)}</Text>
                {cmd.aliases?.length ? (
                  <Text color={theme.textDim} dimColor>{cmd.aliases.slice(0, 3).map(a => `/${a}`).join(" ")}</Text>
                ) : null}
                <Text color={sel ? theme.textPrimary : theme.textDim} dimColor={!sel}>
                  {cmd.description}
                </Text>
              </Box>
              {sel && cmd.usage ? (
                <Box paddingLeft={4}>
                  <Text color={theme.textDim} dimColor>{cmd.usage}</Text>
                </Box>
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
