import React, { useMemo, useRef, useLayoutEffect, useReducer, useCallback, useState, useEffect } from "react"
import { Box, Text, measureElement } from "ink"
import type { DOMElement } from "ink"
import { Message, type DisplayMessage } from "./Message.js"
import { StreamingView } from "./StreamingView.js"
import { Spinner } from "./Spinner.js"
import { useTheme } from "../utils/theme.js"

// ── Height estimation (fallback before first measurement) ─────────────────────

function estimateWrappedLines(text: string, width: number): number {
  const safeWidth = Math.max(12, width)
  return text
    .split("\n")
    .reduce((sum, line) => sum + Math.max(1, Math.ceil((line.length || 1) / safeWidth)), 0)
}

function estimateMessageRows(message: DisplayMessage, width: number): number {
  const contentWidth = Math.max(20, width - 16)
  if (message.role === "user")
    return estimateWrappedLines(message.content, contentWidth) + 1
  if (message.role === "assistant")
    return estimateWrappedLines(message.content || message.reasoningContent || "…", contentWidth) + 3
  if (message.role === "tool_call") {
    const output = message.resultContent || message.content || ""
    // 1 header + up to 3 visible lines + 1 "N hidden" indicator
    return Math.min(3, estimateWrappedLines(output, contentWidth)) + 3
  }
  return estimateWrappedLines(message.content, contentWidth) + 1
}

// ── Measured wrapper ──────────────────────────────────────────────────────────

function contentKey(message: DisplayMessage): string {
  const base = message.id ?? message.content.slice(0, 16)
  const len  = (message.content?.length ?? 0) + (message.resultContent?.length ?? 0) + (message.reasoningContent?.length ?? 0)
  return `${base}:${len}`
}

interface MeasuredBoxProps {
  cacheKey: string
  onMeasure: (key: string, rows: number) => void
  children: React.ReactNode
}

function MeasuredBox({ cacheKey, onMeasure, children }: MeasuredBoxProps) {
  const ref = useRef<DOMElement>(null)
  const lastMeasured = useRef<number>(-1)

  useLayoutEffect(() => {
    if (!ref.current) return
    const { height } = measureElement(ref.current)
    if (height > 0 && height !== lastMeasured.current) {
      lastMeasured.current = height
      onMeasure(cacheKey, height)
    }
  }, [cacheKey, onMeasure])

  return <Box ref={ref}>{children}</Box>
}

// Render penceresi: çok uzun konuşmalarda fiber sayısını sınırlamak için
// yalnızca son MAX_RENDERED entry DOM'a yazılır. Scroll math tüm entry'leri
// kapsar (estimate veya ölçülmüş yükseklik), bu sayede offset'ler doğru kalır.
const MAX_RENDERED = 200

// ── Transcript types ──────────────────────────────────────────────────────────

type TranscriptEntry =
  | { kind: "message";   key: string; rows: number; message: DisplayMessage }
  | { kind: "streaming"; key: string; rows: number }
  | { kind: "spinner";   key: string; rows: number }

// ── Props ─────────────────────────────────────────────────────────────────────

export interface ConversationViewportProps {
  height:               number
  width:                number
  messages:             DisplayMessage[]
  loading:              boolean
  activeTool?:          string
  streamingText:        string | null
  streamingReason:      string | null
  streamingError:       string | null
  scrollLocked:         boolean
  offsetRowsFromBottom: number
  unseenCount?:         number
  onExpandTool:         (content: string, toolName: string) => void
  onExpandThinking:     (content: string) => void
}

// ── Sub-components ────────────────────────────────────────────────────────────

function formatElapsedFlash(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  const s = ms / 1000
  if (s < 60) return `${s.toFixed(1)}s`
  const m = Math.floor(s / 60)
  return `${m}m ${Math.floor(s % 60)}s`
}

function CompletionFlash({ elapsed }: { elapsed: number }) {
  const theme = useTheme()
  return (
    <Box gap={1} paddingX={2} marginBottom={1}>
      <Text color={theme.success}>✓</Text>
      <Text color={theme.textDim} dimColor>Done</Text>
      <Text color={theme.borderBright} dimColor>{formatElapsedFlash(elapsed)}</Text>
    </Box>
  )
}

function UnseenDivider({ count, width }: { count: number; width: number }) {
  const theme = useTheme()
  const label = ` ${count} new message${count === 1 ? "" : "s"} ↓ `
  const dashCount = Math.max(0, Math.floor((width - label.length - 4) / 2))
  const dashes = "─".repeat(dashCount)
  return (
    <Box paddingX={2}>
      <Text color={theme.accent} dimColor>{dashes}</Text>
      <Text color={theme.accent} bold>{label}</Text>
      <Text color={theme.accent} dimColor>{dashes}</Text>
    </Box>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function ConversationViewport({
  height,
  width,
  messages,
  loading,
  activeTool,
  streamingText,
  streamingReason,
  streamingError,
  scrollLocked,
  offsetRowsFromBottom,
  unseenCount,
  onExpandTool,
  onExpandThinking,
}: ConversationViewportProps) {
  // Completion flash: loading true→false geçişinde 1.8s göster
  const loadingStartRef = useRef<number | null>(null)
  const [completionFlash, setCompletionFlash] = useState<number | null>(null)

  useEffect(() => {
    if (loading) {
      if (loadingStartRef.current === null) loadingStartRef.current = Date.now()
    } else {
      if (loadingStartRef.current !== null) {
        const elapsed = Date.now() - loadingStartRef.current
        loadingStartRef.current = null
        setCompletionFlash(elapsed)
        const t = setTimeout(() => setCompletionFlash(null), 1800)
        return () => clearTimeout(t)
      }
    }
  }, [loading])

  const theme = useTheme()

  // Height cache: tüm mesajların gerçek yüksekliklerini tutar (scroll math için)
  const heightCacheRef = useRef<Map<string, number>>(new Map())
  const [measureRevision, forceUpdate] = useReducer((x: number) => x + 1, 0)

  const handleMeasure = useCallback((key: string, rows: number) => {
    if (heightCacheRef.current.get(key) !== rows) {
      heightCacheRef.current.set(key, rows)
      forceUpdate()
    }
  }, [])

  // Tüm mesajlar + canlı tail
  const entries = useMemo<TranscriptEntry[]>(() => {
    const list: TranscriptEntry[] = messages.map((message, index) => {
      const ck      = contentKey(message)
      const measured = heightCacheRef.current.get(ck)
      const rows    = measured ?? estimateMessageRows(message, width)
      return { kind: "message", key: message.id ?? `m-${index}`, rows, message }
    })

    if (streamingText || streamingReason || streamingError) {
      list.push({ kind: "streaming", key: "streaming-entry", rows: 6 })
    } else if (loading && !activeTool) {
      list.push({ kind: "spinner", key: "spinner-entry", rows: 3 })
    }

    return list
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, width, streamingText, streamingReason, streamingError, loading, activeTool, measureRevision])

  // ── Scroll math (marginTop tabanlı) ──────────────────────────────────────
  const showUnseen      = (unseenCount ?? 0) > 0 && offsetRowsFromBottom > 0
  const scrollAreaRows  = Math.max(4, height - (showUnseen ? 1 : 0))
  const totalRows       = entries.reduce((s, e) => s + e.rows, 0)
  const maxOffset       = Math.max(0, totalRows - scrollAreaRows)
  const clampedOffset   = Math.min(offsetRowsFromBottom, maxOffset)
  const scrollPosition  = maxOffset - clampedOffset

  // ── Virtual window: yalnızca son MAX_RENDERED entry render edilir ──────────
  const skipCount       = Math.max(0, entries.length - MAX_RENDERED)
  const renderedEntries = skipCount > 0 ? entries.slice(skipCount) : entries
  const skippedHeight   = skipCount > 0
    ? entries.slice(0, skipCount).reduce((s, e) => s + e.rows, 0)
    : 0
  // scrollPosition skippedHeight'in altına inince (çok yukarı scroll):
  // rendered content başını göster, negatifin altına düşme.
  const adjustedMarginTop = Math.min(0, skippedHeight - scrollPosition)

  return (
    <Box height={height} flexShrink={1} flexDirection="column" overflow="hidden">
      {showUnseen && <UnseenDivider count={unseenCount!} width={width} />}
      <Box flexGrow={1} flexDirection="column" overflow="hidden">
        <Box flexDirection="column" marginTop={adjustedMarginTop}>
          {skipCount > 0 && scrollPosition <= skippedHeight && (
            <Box paddingX={2}>
              <Text color={theme.textDim} dimColor>⋯ {skipCount} older messages</Text>
            </Box>
          )}
          {renderedEntries.map((entry) => {
            if (entry.kind === "message") {
              const m  = entry.message
              const ck = contentKey(m)
              return (
                <MeasuredBox key={entry.key} cacheKey={ck} onMeasure={handleMeasure}>
                  <Message
                    message={m}
                    onExpand={
                      m.role === "tool_call" && m.resultContent && m.resultContent.split("\n").length > 3
                        ? () => onExpandTool(m.resultContent!, m.tool ?? "tool")
                        : undefined
                    }
                    onExpandThinking={
                      m.role === "assistant" && m.reasoningContent
                        ? () => onExpandThinking(m.reasoningContent!)
                        : undefined
                    }
                  />
                </MeasuredBox>
              )
            }

            if (entry.kind === "streaming") {
              return (
                <StreamingView
                  key={entry.key}
                  text={streamingText}
                  reasoning={streamingReason}
                  skeleton={false}
                  paused={scrollLocked}
                  {...(streamingError ? { error: streamingError } : {})}
                />
              )
            }

            if (entry.kind === "spinner") {
              return <Spinner key={entry.key} activeTool={activeTool} />
            }

            return null
          })}
          {completionFlash !== null && !loading && (
            <CompletionFlash elapsed={completionFlash} />
          )}
        </Box>
      </Box>
    </Box>
  )
}
