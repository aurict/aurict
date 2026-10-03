import React, { useEffect, useState } from "react"
import { Box, Text, useInput } from "./design-system/renderer.js"
import { useTheme } from "../utils/theme.js"
import { useTerminalSize } from "./TerminalSizeContext.js"
import { useBlinkFrame } from "./design-system/motion.js"
import { DesignBox as Box2 } from "./design-system/types.js"
import { wrapTranscriptText } from "./conversation/line-buffer.js"
import { DiffRenderer } from "./DiffRenderer/index.js"
import { FileWriteView } from "./FileDiffView.js"
import { writePreview } from "./conversation/transcript-details.js"
import { prefersAsciiGlyphs } from "./terminal-glyphs.js"

/** Wide terminals open diffs side by side; `v` still toggles the view. */
const SIDE_BY_SIDE_MIN_COLUMNS = 140

interface Props {
  content:  string
  toolName: string
  onClose:  () => void
  kind?: "tool" | "reasoning" | "diff" | "write"
  rawDiff?: string
  filePath?: string
  totalLines?: number
  onPrevious?: () => void
  onNext?: () => void
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

function artifactKind(content: string): string {
  const trimmed = content.trim();
  if (/^(---|\+\+\+|@@)/m.test(trimmed)) return "diff";
  if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) return "json";
  return "output";
}

export function ExpandableOutput({
  content,
  toolName,
  onClose,
  kind,
  rawDiff,
  filePath,
  totalLines: totalWriteLines,
  onPrevious,
  onNext,
}: Props) {
  const theme    = useTheme()
  const { columns: termCols, rows: termRows } = useTerminalSize()
  const blink    = useBlinkFrame()
  const pageSize = Math.max(5, termRows - 8)
  const cols     = Math.max(40, termCols)
  const sourceLines = stripAnsi(content)
    .split("\n")
    .map((line) => line.replace(/\t/g, "    "))
  const sourceLineCount = content.length === 0 ? 0 : sourceLines.length
  const lineNoWidth = Math.max(1, String(sourceLineCount).length)
  const contentWidth = Math.max(20, cols - lineNoWidth - 6)
  const lines = sourceLines.flatMap((line, sourceIndex) =>
    wrapTranscriptText(line, contentWidth).map((text, visualIndex) => ({
      text,
      sourceIndex,
      continuation: visualIndex > 0,
    })),
  )
  const [offset, setOffset] = useState(0)
  const outputLineCount = content.length === 0 ? 0 : lines.length
  const maxOffset = Math.max(0, outputLineCount - pageSize)

  useEffect(() => {
    setOffset((current) => Math.min(current, maxOffset))
  }, [maxOffset])

  useInput((input, key) => {
    if (key.escape || key.return) { onClose(); return }
    if (input === "[") { onPrevious?.(); return }
    if (input === "]") { onNext?.(); return }
    if (input === "g" && !key.shift) { setOffset(0); return }
    if (input === "G" || (input === "g" && key.shift)) { setOffset(maxOffset); return }
    if (key.upArrow)   setOffset((o) => Math.max(0, o - 1))
    if (key.downArrow) setOffset((o) => Math.min(maxOffset, o + 1))
    if (key.ctrl && input === "u") setOffset((o) => Math.max(0, o - Math.floor(pageSize / 2)))
    if (key.ctrl && input === "d") setOffset((o) => Math.min(maxOffset, o + Math.floor(pageSize / 2)))
  })

  const visible     = lines.slice(offset, offset + pageSize)
  const pct         = outputLineCount <= pageSize ? 100 : Math.round(((offset + pageSize) / outputLineCount) * 100)
  const artifact = artifactKind(content)
  const canBrowseDetails = onPrevious !== undefined || onNext !== undefined
  const footerHint = `${canBrowseDetails ? "[ / ] details  " : ""}Esc close`
  const frameStyle = prefersAsciiGlyphs() ? "classic" : "round"
  const dividerStyle = prefersAsciiGlyphs() ? "classic" : "single"

  if (rawDiff) {
    return (
      <Box flexDirection="column" borderStyle={frameStyle} borderColor={theme.borderActive} width="100%">
        <Box2 {...(theme.bgDeep !== undefined ? { backgroundColor: theme.bgDeep } : {})}>
          <Box paddingX={1} justifyContent="space-between">
            <Text color={theme.accent} bold>actual workspace diff</Text>
            <Text color={theme.textSecondary}>{toolName}</Text>
          </Box>
        </Box2>
        <Box paddingX={1} flexDirection="column">
          <DiffRenderer
            rawDiff={rawDiff}
            width={Math.max(40, cols - 4)}
            initialMode={cols >= SIDE_BY_SIDE_MIN_COLUMNS ? "side-by-side" : "unified"}
            {...(filePath ? { fileName: filePath } : {})}
          />
        </Box>
        <Box paddingX={1}>
          <Text color={theme.textDim}>{footerHint}</Text>
        </Box>
      </Box>
    )
  }

  if (kind === "write" && filePath && totalWriteLines !== undefined) {
    return (
      <Box flexDirection="column" borderStyle={frameStyle} borderColor={theme.borderActive} width="100%">
        <Box2 {...(theme.bgDeep !== undefined ? { backgroundColor: theme.bgDeep } : {})}>
          <Box paddingX={1} justifyContent="space-between">
            <Text color={theme.accent} bold>created file</Text>
            <Text color={theme.textSecondary}>{toolName}</Text>
          </Box>
        </Box2>
        <Box paddingX={1} flexDirection="column">
          <FileWriteView
            filePath={filePath}
            content={writePreview(content) ?? ""}
            totalLines={totalWriteLines}
            width={Math.max(20, cols - 4)}
          />
        </Box>
        <Box paddingX={1}>
          <Text color={theme.textDim}>{footerHint}</Text>
        </Box>
      </Box>
    )
  }
  return (
    <Box flexDirection="column" borderStyle={frameStyle} borderColor={theme.borderActive} width="100%">
      <Box2 {...(theme.bgDeep !== undefined ? { backgroundColor: theme.bgDeep } : {})}>
        <Box paddingX={1} justifyContent="space-between">
          <Box gap={1}>
            <Text color={theme.accent} bold>{artifact} artifact</Text>
            <Text color={theme.textSecondary}>/ {toolName}</Text>
            <Text color={theme.accent}>{blink ? "▊" : " "}</Text>
          </Box>
          <Text color={theme.textDim}>
            {outputLineCount} lines · {sourceLineCount} source · {formatBytes(content)} · {pct}%
          </Text>
        </Box>
      </Box2>

      <Box flexDirection="column" paddingX={1}>
        {content.length === 0 && (
          <Text color={theme.textDim} dimColor>(empty output)</Text>
        )}
        {content.length > 0 && visible.map((line, i) => {
          const lineNo = line.sourceIndex + 1
          return (
            <Box key={`${line.sourceIndex}-${offset + i}`} gap={1}>
              <Text color={theme.borderBright} dimColor>
                {line.continuation ? "↳".padStart(lineNoWidth) : String(lineNo).padStart(lineNoWidth)}
              </Text>
              <Text color={theme.textSecondary} wrap="truncate-end">{line.text || " "}</Text>
            </Box>
          )
        })}
      </Box>

      {outputLineCount > pageSize && (
        <Box paddingX={1} borderStyle={dividerStyle} borderColor={theme.borderDim}
             borderBottom={false} borderLeft={false} borderRight={false}>
          <Text color={theme.textDim}>
            {offset + 1}-{Math.min(offset + pageSize, outputLineCount)} / {outputLineCount}
            {"  "}↑↓ scan  Ctrl+U/D page  g/G ends  {footerHint}
          </Text>
        </Box>
      )}
    </Box>
  )
}
