import React, { useState, useEffect, useRef, memo } from "react"
import { Box, Text } from "ink"
import { useTheme } from "../utils/theme.js"

// Skeleton shimmer — döngüsel ████░░ bloğu
const SKELETON_FRAMES = [
  "████░░░░░░░░░░░░░░░░",
  "░████░░░░░░░░░░░░░░░",
  "░░████░░░░░░░░░░░░░░",
  "░░░████░░░░░░░░░░░░░",
  "░░░░████░░░░░░░░░░░░",
  "░░░░░████░░░░░░░░░░░",
  "░░░░░░████░░░░░░░░░░",
  "░░░░░░░████░░░░░░░░░",
  "░░░░░░░░████░░░░░░░░",
  "░░░░░░░░░████░░░░░░░",
  "░░░░░░░░░░████░░░░░░",
  "░░░░░░░░░░░████░░░░░",
  "░░░░░░░░░░░░████░░░░",
  "░░░░░░░░░░░░░████░░░",
  "░░░░░░░░░░░░░░████░░",
  "░░░░░░░░░░░░░░░████░",
  "░░░░░░░░░░░░░░░░████",
]

function SkeletonLine({ color }: { color: string }) {
  const [frame, setFrame] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setFrame(f => (f + 1) % SKELETON_FRAMES.length), 80)
    return () => clearInterval(t)
  }, [])
  return <Text color={color} dimColor>{SKELETON_FRAMES[frame]}</Text>
}

// Elapsed time formatter
function formatElapsed(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  const s = ms / 1000
  if (s < 60) return `${s.toFixed(1)}s`
  const m = Math.floor(s / 60)
  const remaining = Math.floor(s % 60)
  return `${m}m ${remaining}s`
}

// Elapsed time hook — component mount'tan itibaren geçen süreyi takip eder
function useElapsedTime(): number {
  const [elapsed, setElapsed] = useState(0)
  const startRef = useRef(Date.now())

  useEffect(() => {
    startRef.current = Date.now()
    setElapsed(0)
    const t = setInterval(() => {
      setElapsed(Date.now() - startRef.current)
    }, 100)
    return () => clearInterval(t)
  }, [])

  return elapsed
}

// Reasoning bloğu sırasında yalnızca son N satırı göster —
// tüm geçmişi render etmek terminal'i dondurur
const MAX_REASONING_LINES = 8

interface Props {
  text:       string | null
  reasoning:  string | null
  skeleton?:  boolean   // show shimmer placeholder before first token
  error?:     string    // show inline error (e.g. stream interrupted)
}

function lastLines(text: string, n: number): string[] {
  const all = text.split("\n")
  return all.slice(Math.max(0, all.length - n))
}

function lineCount(text: string): number {
  return text.split("\n").length
}

export const StreamingView = memo(function StreamingView({ text, reasoning, skeleton, error }: Props) {
  const theme = useTheme()
  const elapsed = useElapsedTime()

  return (
    <Box flexDirection="column" paddingX={1} marginBottom={1}>

      {/* ── Reasoning akışı ── */}
      {reasoning && (() => {
        const total   = lineCount(reasoning)
        const visible = lastLines(reasoning, MAX_REASONING_LINES)
        const hidden  = total - visible.length
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

            {/* Taşan satır bildirimi */}
            {hidden > 0 && (
              <Box marginLeft={2}>
                <Text color={theme.borderDim} dimColor>  ↑ {hidden} lines above</Text>
              </Box>
            )}

            {/* Son N satır — ince ┊ sol çizgisi ile */}
            <Box flexDirection="column" marginLeft={2}>
              {visible.map((line, i) => (
                <Box key={i} flexDirection="row">
                  <Text color={theme.borderDim} dimColor>┊ </Text>
                  <Text
                    color={theme.accent}
                    italic
                    dimColor
                    wrap="wrap"
                  >
                    {line || " "}
                  </Text>
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

      {/* ── Skeleton (metin gelmeden önce) ── */}
      {skeleton && !text && !reasoning && !error && (
        <Box flexDirection="row" gap={1} paddingLeft={1}>
          <Box width={2} flexShrink={0}>
            <Text color={theme.assistantDot}>○</Text>
          </Box>
          <Box flexDirection="column" paddingLeft={1}>
            <SkeletonLine color={theme.accent} />
            <SkeletonLine color={theme.borderDim} />
            <Text color={theme.textDim} dimColor>{formatElapsed(elapsed)}</Text>
          </Box>
        </Box>
      )}

      {/* ── Text akışı ── */}
      {text && (
        <Box flexDirection="row" gap={1}>
          <Box width={2} flexShrink={0}>
            <Text color={theme.assistantDot}>○</Text>
          </Box>
          <Box
            flexGrow={1}
            borderStyle="single"
            borderTop={false} borderBottom={false} borderRight={false}
            borderColor={theme.accent}
            paddingLeft={1}
          >
            <Text wrap="wrap">{text}</Text>
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
            flexGrow={1}
            borderStyle="single"
            borderTop={false} borderBottom={false} borderRight={false}
            borderColor={theme.error}
            paddingLeft={1}
          >
            <Text color={theme.error} wrap="wrap">{error}</Text>
          </Box>
        </Box>
      )}

    </Box>
  )
})
