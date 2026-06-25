import React, { useState, useEffect, useRef, memo } from "react"
import { Box, Text } from "ink"
import { useTheme } from "../utils/theme.js"
import { Markdown } from "./Markdown.js"

// Streaming text'i Markdown ile render et — ### başlık, **bold**, liste vb.
// memo ile: content değişmeyenler re-render almaz.
const StreamingTextBlock = memo(function StreamingTextBlock({ text, width }: { text: string; width: number }) {
  return (
    <Box flexDirection="column" width={width}>
      <Markdown content={text} width={width} />
    </Box>
  )
})

// Elapsed time formatter
function formatElapsed(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  const s = ms / 1000
  if (s < 60) return `${s.toFixed(1)}s`
  const m = Math.floor(s / 60)
  const remaining = Math.floor(s % 60)
  return `${m}m ${remaining}s`
}

// Elapsed time hook — paused=true olduğunda timer durur, zaman donar
function useElapsedTime(paused?: boolean): number {
  const [elapsed, setElapsed] = useState(0)
  const startRef = useRef(Date.now())
  const pausedRef = useRef(paused)
  useEffect(() => { pausedRef.current = paused }, [paused])

  useEffect(() => {
    startRef.current = Date.now()
    setElapsed(0)
    const t = setInterval(() => {
      if (!pausedRef.current) setElapsed(Date.now() - startRef.current)
    }, 500)
    return () => clearInterval(t)
  }, [])

  return elapsed
}

import { useTerminalSize } from "./TerminalSizeContext.js"

interface Props {
  text:      string | null
  reasoning: string | null
  skeleton?: boolean   // artık kullanılmıyor — Spinner bileşeni devralır
  error?:    string    // show inline error (e.g. stream interrupted)
  paused?:   boolean   // scroll lock aktifken animasyonları dondurur
}

function lineCount(text: string): number {
  return text.split("\n").length
}

export const StreamingView = memo(function StreamingView({ text, reasoning, skeleton, error, paused }: Props) {
  const theme = useTheme()
  const elapsed = useElapsedTime(paused)
  const termCols = useTerminalSize().columns
  const bodyWidth = Math.max(20, termCols - 9)
  const railTextWidth = Math.max(10, bodyWidth - 2)

  return (
    <Box flexDirection="column" paddingX={1} marginBottom={1}>

      {/* ── Reasoning akışı ── */}
      {reasoning && (() => {
        const total   = lineCount(reasoning)
        const visible = reasoning.split("\n")
        return (
          <Box flexDirection="column" marginBottom={text ? 1 : 0}>
            {/* Başlık: "∴ thinking… (142 lines) 3.2s" */}
            <Box gap={1}>
              <Text color={theme.borderDim}>∴</Text>
              <Text color={theme.accent} italic dimColor>thinking…</Text>
              {total > 1 && (
                <Text color={theme.borderDim} dimColor>({total} lines)</Text>
              )}
              <Text color={theme.textDim} dimColor>{formatElapsed(elapsed)}</Text>
            </Box>

            {/* Tam reasoning akışı — ince ┊ sol çizgisi ile */}
            <Box flexDirection="column" marginLeft={2}>
              {visible.map((line, i) => (
                <Box key={i} flexDirection="row" width={bodyWidth}>
                  <Text color={theme.borderDim} dimColor>┊ </Text>
                  <Box width={railTextWidth}>
                    <Text
                      color={theme.accent}
                      italic
                      dimColor
                      wrap="wrap"
                    >
                      {line || " "}
                    </Text>
                  </Box>
                </Box>
              ))}
              {/* Canlı imleç */}
              <Box flexDirection="row" marginLeft={2}>
                <Text color={theme.accent} dimColor>▋</Text>
              </Box>
            </Box>
          </Box>
        )
      })()}

      {/* ── Text akışı ── */}
      {text && (
        <Box flexDirection="row" gap={1}>
          <Box width={2} flexShrink={0}>
            <Text color={theme.assistantDot}>○</Text>
          </Box>
          <Box
            width={bodyWidth}
            borderStyle="single"
            borderTop={false} borderBottom={false} borderRight={false}
            borderColor={theme.accent}
            paddingLeft={1}
          >
            <StreamingTextBlock text={text} width={railTextWidth} />
            <Text color={theme.accent}>▋</Text>
            <Text color={theme.textDim} dimColor> {formatElapsed(elapsed)}</Text>
          </Box>
        </Box>
      )}

      {/* ── Hata durumu ── */}
      {error && (
        <Box flexDirection="row" gap={1} paddingLeft={1}>
          <Box width={2} flexShrink={0}>
            <Text color={theme.error}>✗</Text>
          </Box>
          <Box
            width={bodyWidth}
            borderStyle="single"
            borderTop={false} borderBottom={false} borderRight={false}
            borderColor={theme.error}
            paddingLeft={1}
          >
            <Box width={railTextWidth}>
              <Text color={theme.error} wrap="wrap">{error}</Text>
            </Box>
          </Box>
        </Box>
      )}

    </Box>
  )
})
