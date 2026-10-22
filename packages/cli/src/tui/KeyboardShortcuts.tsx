/**
 * KeyboardShortcuts — the Codex "? for shortcuts" overlay, shown in place of
 * the footer. Every row is a key Aurict actually binds; rows for Codex
 * features Aurict lacks are left out rather than pointing at dead keys.
 *
 *   Keyboard shortcuts
 *
 *   Compose                  Session                      Transcript (open first)
 *   /       Commands         ⌃x      Subagents            ⌃t           Open transcript
 *   …
 *
 *   /keys customize
 */

import React from "react"
import { Box, Text, useInput } from "./design-system/renderer.js"
import { useTheme } from "../utils/theme.js"
import { useTerminalSize } from "./TerminalSizeContext.js"

interface Props {
  onClose: () => void
  /** While a turn runs, Codex swaps in the queue/interrupt rows. */
  running?: boolean
}

type Row = [key: string, label: string]

const MAC = process.platform === "darwin"
/** `⌃t` on macOS, `ctrl + t` elsewhere, the way Codex labels keys. */
export function keyLabel(key: string): string {
  if (MAC) return key.replace(/ctrl\+/g, "⌃").replace(/alt\+/g, "⌥").replace(/shift\+/g, "⇧")
  return key.replace(/ctrl\+/g, "ctrl + ").replace(/alt\+/g, "alt + ").replace(/shift\+/g, "shift + ")
}

export function shortcutColumns(running: boolean): Array<{ title: string; rows: Row[] }> {
  return [
    {
      title: "Compose",
      rows: [
        ["/", "Commands"],
        ["@", "Mention files"],
        [keyLabel("shift+enter"), "New line"],
        [keyLabel("ctrl+v"), "Paste image"],
        [keyLabel("ctrl+g"), "External editor"],
        [keyLabel("ctrl+r"), "Search history"],
        ...(running ? [] : [["esc esc", "Edit previous"] as Row]),
      ],
    },
    {
      title: "Session",
      rows: [
        ...(running ? [["enter", "Steer"] as Row, ["tab", "Queue message"] as Row] : []),
        [`${keyLabel("alt+←")} / ${keyLabel("alt+→")}`, "Subagents"],
        [keyLabel("ctrl+o"), "Inspect activity"],
        [keyLabel("ctrl+c"), running ? "Interrupt" : "Quit"],
      ],
    },
    {
      title: "Transcript (open first)",
      rows: [
        [keyLabel("ctrl+t"), "Open transcript"],
        [keyLabel("ctrl+f"), "Find text"],
        ["pgup / pgdn", "Scroll"],
        [`${keyLabel("ctrl+b")} / ${keyLabel("ctrl+n")}`, "Top / latest"],
      ],
    },
  ]
}


export function KeyboardShortcuts({ onClose, running = false }: Props) {
  const theme = useTheme()
  const { columns: width } = useTerminalSize()
  useInput((input, key) => {
    if (key.escape || input === "?" || (key.ctrl && input === "c")) onClose()
  })

  const columns = shortcutColumns(running)
  // Narrower terminals stack columns: transcript under session, then everything in one column.
  const groups = width >= 100 ? [[columns[0]!], [columns[1]!], [columns[2]!]]
    : width >= 80 ? [[columns[0]!], [columns[1]!, columns[2]!]]
    : [[columns[0]!, columns[1]!, columns[2]!]]

  return (
    <Box flexDirection="column" paddingLeft={2}>
      <Text bold>Keyboard shortcuts</Text>
      <Text> </Text>
      <Box flexDirection="row">
        {groups.map((group, groupIndex) => (
          <Box key={groupIndex} flexDirection="column" marginRight={4}>
            {group.map((column, columnIndex) => {
              // Stacked columns share one key width so their labels line up.
              const keyWidth = Math.max(...group.flatMap((entry) => entry.rows.map(([key]) => key.length))) + 2
              return (
                <Box key={column.title} flexDirection="column" {...(columnIndex > 0 ? { marginTop: 1 } : {})}>
                  <Text bold>{column.title}</Text>
                  {column.rows.map(([key, label]) => (
                    <Text key={key + label} wrap="truncate-end">
                      <Text bold>{key.padEnd(keyWidth)}</Text>
                      <Text color={theme.textDim}>{label}</Text>
                    </Text>
                  ))}
                </Box>
              )
            })}
          </Box>
        ))}
      </Box>
      <Text> </Text>
      <Text><Text bold>/keys</Text><Text color={theme.textDim}> customize</Text></Text>
    </Box>
  )
}
