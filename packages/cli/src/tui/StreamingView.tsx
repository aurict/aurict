import React, { useState, useEffect, memo } from "react"
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

  return (
    <Box flexDirection="column" paddingX={1} marginBottom={1}>

      {/* ── Reasoning akışı ── */}
      {reasoning && (() => {
        const total   = lineCount(reasoning)
        const visible = lastLines(reasoning, MAX_REASONING_LINES)
        const hidden  = total - visible.length
        return (
          <Box flexDirection="column" marginBottom={text ? 1 : 0}>
            {/* Başlık: "∴ thinking… (142 lines)" */}
            <Box gap={1}>
              <Text color={theme.borderDim}>∴</Text>
              <Text color={theme.accent} italic dimColor>thinking…</Text>
              {total > 1 && (
                <Text color={theme.borderDim} dimColor>({total} lines)</Text>
              )}
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
