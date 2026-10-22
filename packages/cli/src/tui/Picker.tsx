import React, { useEffect, useMemo, useRef, useState } from "react"
import wrapAnsi from "wrap-ansi"
import { Box, Text, useInput } from "./design-system/renderer.js"
import type { PickerHeader, PickerItem } from "../commands/types.js"
import { useTheme } from "../utils/theme.js"
import { useTerminalSize } from "./TerminalSizeContext.js"
import { displayWidth } from "./terminal-text/display-width.js"
import { glyph } from "./terminal-glyphs.js"
import { wrapSpans } from "./terminal-text/wrap-spans.js"

const PAGE_SIZE = 10
/** Below this many cells the description column is dropped, as Codex does. */
const MIN_DESCRIPTION_WIDTH = 20

interface Props {
  title:    string
  header?:  PickerHeader
  items:    PickerItem[]
  onSelect: (item: PickerItem) => void
  onCancel: () => void
}

/**
 * The Codex selection list, drawn in the bottom pane in place of the composer:
 *
 *   Update Model Permissions
 *
 * › 1. Ask for approval (current)  Read and edit workspace files, …
 *   2. Full Access                 Use with caution: …
 *
 *   Press enter to confirm or esc to go back
 *
 * Typing filters the rows; digits pick a row directly while no filter is typed.
 * `header` lines sit directly under the bold title (Codex subtitle or body text).
 */
export function Picker({ title, header = [], items, onSelect, onCancel }: Props) {
  const theme = useTheme()
  const { columns, rows } = useTerminalSize()
  const [idx, setIdx] = useState(0)
  const [offset, setOffset] = useState(0)
  const [query, setQuery] = useState("")
  // Back-to-back arrow keys in one tick would read a stale `idx`; the ref updates synchronously.
  const idxRef = useRef(0)
  const pageSize = Math.max(2, Math.min(PAGE_SIZE, rows - 8))
  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((item) => `${item.id} ${item.label} ${item.hint ?? ""}`.toLowerCase().includes(q))
  }, [items, query])

  useEffect(() => {
    const maxIdx = Math.max(0, filteredItems.length - 1)
    if (idxRef.current > maxIdx) idxRef.current = maxIdx
    setIdx((i) => Math.min(i, maxIdx))
    setOffset((o) => Math.min(o, Math.max(0, filteredItems.length - pageSize)))
  }, [filteredItems.length, pageSize])

  useEffect(() => {
    idxRef.current = 0
    setIdx(0)
    setOffset(0)
  }, [query])

  useInput((input, key) => {
    if (key.upArrow) {
      const next = Math.max(0, idxRef.current - 1)
      idxRef.current = next
      setIdx(next)
      setOffset((o) => (next < o ? next : o))
      return
    }
    if (key.downArrow) {
      const next = Math.min(Math.max(0, filteredItems.length - 1), idxRef.current + 1)
      idxRef.current = next
      setIdx(next)
      setOffset((o) => (next >= o + pageSize ? next - pageSize + 1 : o))
      return
    }
    if (key.return) {
      const item = filteredItems[idxRef.current]
      if (item) onSelect(item)
      return
    }
    if (key.escape) { onCancel(); return }
    if (key.backspace || key.delete) { setQuery((q) => q.slice(0, -1)); return }
    if (!input || key.ctrl || key.meta || key.tab) return
    const number = /^[1-9]$/.test(input) ? Number(input) : 0
    if (!query && number > 0 && number <= filteredItems.length) {
      onSelect(filteredItems[number - 1]!)
      return
    }
    setQuery((q) => q + input)
  })

  const visible = filteredItems.slice(offset, offset + pageSize)
  const numberWidth = String(filteredItems.length).length
  const labelWidth = Math.max(0, ...filteredItems.map((item) => displayWidth(item.label)))
  // "› " + "N. " + label + two-cell gap
  const nameWidth = 2 + numberWidth + 2 + labelWidth + 2
  const descriptionWidth = columns - nameWidth - 2
  const showDescriptions = descriptionWidth >= MIN_DESCRIPTION_WIDTH

  return (
    <Box flexDirection="column" width={columns}>
      <Text> </Text>
      <Box flexDirection="column" paddingLeft={2}>
        {wrapSpans([{ text: title }], columns - 4).map((row, index) => <Text key={index} bold>{row[0]?.text}</Text>)}
        {header.flatMap((line) => wrapSpans(line, columns - 4)).map((row, index) => (
          <Text key={index}>
            {row.map((span, spanIndex) => (
              <Text key={spanIndex} {...(span.tone === "dim" ? { color: theme.textDim } : span.tone === "error" ? { color: theme.error } : {})}>{span.text}</Text>
            ))}
          </Text>
        ))}
      </Box>
      {query && <Text color={theme.textDim}>  {query}</Text>}
      <Text> </Text>
      {visible.length === 0 && <Text color={theme.textDim}>  no matches</Text>}
      {visible.map((item, i) => {
        const index = offset + i
        const selected = index === idx
        const name = `${selected ? glyph("prompt") : " "} ${String(index + 1).padStart(numberWidth)}. ${item.label}`
        return (
          <Box key={item.id} flexDirection="row">
            <Box width={showDescriptions ? nameWidth : columns - 2} flexShrink={0}>
              <Text wrap="truncate-end" {...(selected ? { color: theme.accent, bold: true } : {})}>{name}</Text>
            </Box>
            {showDescriptions && item.hint && (
              <Box width={descriptionWidth} flexDirection="column">
                {/* Pre-wrapped: Ink keeps the leading space of a soft-wrapped line. */}
                {wrapAnsi(item.hint, descriptionWidth, { hard: true, trim: true }).split("\n").map((line, lineIndex) => (
                  <Text key={lineIndex} color={theme.textDim}>{line}</Text>
                ))}
              </Box>
            )}
          </Box>
        )
      })}
      <Text> </Text>
      <Text color={theme.textDim}>  Press <Text bold>enter</Text> to confirm or <Text bold>esc</Text> to go back</Text>
    </Box>
  )
}
