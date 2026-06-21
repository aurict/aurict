import React, { useState } from "react"
import { Box, Text, useInput } from "ink"
import { useTheme } from "../utils/theme.js"

interface Props {
  content:  string
  toolName: string
  onClose:  () => void
}

function stripAnsi(s: string): string {
  return s
    .replace(/\x1B\[[0-9;]*[mGKHFJA-Za-z]/g, "")
    .replace(/\x1B\][^\x07]*\x07/g, "")
    .replace(/\x1B[^[]/g, "")
}

function formatBytes(text: string): string {
  const bytes = new TextEncoder().encode(text).length
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function ExpandableOutput({ content, toolName, onClose }: Props) {
  const theme    = useTheme()
  const pageSize = Math.max(5, (process.stdout.rows ?? 36) - 8)
  const cols     = Math.max(40, process.stdout.columns ?? 80)
  const lines    = stripAnsi(content)
    .split("\n")
    .map((line) => line.replace(/\t/g, "    "))
  const [offset, setOffset] = useState(0)
  const totalLines = content.length === 0 ? 0 : lines.length
  const maxOffset = Math.max(0, totalLines - pageSize)

  useInput((input, key) => {
    if (key.escape || key.return) { onClose(); return }
    if (input === "g" && !key.shift) { setOffset(0); return }
    if (input === "G" || (input === "g" && key.shift)) { setOffset(maxOffset); return }
    if (key.upArrow)   setOffset((o) => Math.max(0, o - 1))
    if (key.downArrow) setOffset((o) => Math.min(maxOffset, o + 1))
    if (key.ctrl && input === "u") setOffset((o) => Math.max(0, o - Math.floor(pageSize / 2)))
    if (key.ctrl && input === "d") setOffset((o) => Math.min(maxOffset, o + Math.floor(pageSize / 2)))
  })

  const visible     = lines.slice(offset, offset + pageSize)
  const pct         = totalLines <= pageSize ? 100 : Math.round(((offset + pageSize) / totalLines) * 100)
  const lineNoWidth = Math.max(1, String(totalLines).length)
  const contentWidth = Math.max(20, cols - lineNoWidth - 6)

  return (
    <Box flexDirection="column" borderStyle="round" borderColor={theme.borderActive} width="100%">
      {/* Başlık */}
      <Box paddingX={1} justifyContent="space-between" borderStyle="single"
           borderColor={theme.borderDim} borderTop={false} borderLeft={false} borderRight={false}>
        <Text color={theme.accent} bold>⊞ {toolName}</Text>
        <Text color={theme.textDim}>{totalLines} lines  {formatBytes(content)}  {pct}%</Text>
      </Box>

      {/* İçerik */}
      <Box flexDirection="column" paddingX={1}>
        {content.length === 0 && (
          <Text color={theme.textDim} dimColor>(empty output)</Text>
        )}
        {content.length > 0 && visible.map((line, i) => {
          const lineNo = offset + i + 1
          const display = line.length > contentWidth ? line.slice(0, contentWidth - 1) + "…" : line
          return (
            <Box key={i} gap={1}>
              <Text color={theme.borderBright} dimColor>{String(lineNo).padStart(lineNoWidth)}</Text>
              <Text color={theme.textSecondary}>{display || " "}</Text>
            </Box>
          )
        })}
      </Box>

      {/* Sayfalama */}
      {totalLines > pageSize && (
        <Box paddingX={1} borderStyle="single" borderColor={theme.borderDim}
             borderBottom={false} borderLeft={false} borderRight={false}>
          <Text color={theme.textDim}>
            {offset + 1}-{Math.min(offset + pageSize, totalLines)} / {totalLines}
            {"  "}Ctrl+U/D half page  g/G top/bottom  ↑↓ line  Esc close
          </Text>
        </Box>
      )}
    </Box>
  )
}
