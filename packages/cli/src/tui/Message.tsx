/**
 * Message — Konuşma mesajı renderer
 *
 * Her mesaj tipi için özel render: user / assistant / tool_call / system / error.
 * Design system primitive'leri: HStack, VStack, Typo, Badge, Spinner, Icon, Surface.
 *
 * Sol kenar bar (assistant + tool output) Ink Box'ın border-only-left pattern'ini
 * kullanır — design system'da bu kadar özel bir primitive yok, olduğu gibi bırakıldı.
 */

import React, { useState, useEffect, memo } from "react"
import { Box, Text } from "ink"
import { Markdown } from "./Markdown.js"
import { DiffView, looksLikeDiff } from "./Diff.js"
import { DiffView as EditDiffView } from "./DiffView.js"
import { useTheme } from "../utils/theme.js"
import { HStack, VStack, Typo, Badge, useSpinnerFrame } from "./design-system/index.js"

// ── Tipler ────────────────────────────────────────────────────────────────────

export interface DisplayMessage {
  id?:               string
  role:              "user" | "assistant" | "tool_call" | "tool_result" | "system" | "error"
  content:           string
  tool?:             string
  pending?:          boolean
  resultContent?:    string
  reasoningContent?: string
  timestamp?:        number
  durationMs?:       number
}

// ── Yardımcı ──────────────────────────────────────────────────────────────────

const THINK_COLOR    = "#4e6e8d"
const THINK_BORDER   = "#2d4a5e"
const MAX_TOOL_LINES   = 6
const MAX_STREAM_LINES = 8   // streaming sırasında gösterilecek max satır

function useTerminalCols(): number {
  const [cols, setCols] = useState(() => process.stdout.columns ?? 80)
  useEffect(() => {
    const handler = () => setCols(process.stdout.columns ?? 80)
    process.stdout.on("resize", handler)
    return () => { process.stdout.off("resize", handler) }
  }, [])
  return cols
}

function stripAnsi(s: string): string {
  return s
    .replace(/\x1B\[[0-9;]*[mGKHFJA-Za-z]/g, "")
    .replace(/\x1B\][^\x07]*\x07/g, "")
    .replace(/\x1B[^[]/g, "")
}

function prepareLines(content: string, maxCols: number): string[] {
  return stripAnsi(content)
    .split("\n")
    .map(l => l.replace(/\t/g, "    "))
    .map(l => l.length > maxCols ? l.slice(0, maxCols - 1) + "…" : l)
}

// ── Timestamp ─────────────────────────────────────────────────────────────────

function Timestamp({ ts }: { ts: number }) {
  const theme = useTheme()
  const d  = new Date(ts)
  const hh = d.getHours().toString().padStart(2, "0")
  const mm = d.getMinutes().toString().padStart(2, "0")
  return <Typo variant="caption" tone="muted">  {hh}:{mm}</Typo>
}

// ── Tool arg özeti ────────────────────────────────────────────────────────────

function summarizeArgs(tool: string, raw: string): string {
  try {
    const a = JSON.parse(raw) as Record<string, unknown>
    const s = (k: string) => String(a[k] ?? "")
    if (tool === "bash" || tool === "shell")        return String(a["command"] ?? raw).replace(/\n/g, " ").slice(0, 80)
    if (tool === "read" || tool === "write" || tool === "edit") return s("path")
    if (tool === "glob")                            return s("pattern")
    if (tool === "grep")                            return `"${s("pattern")}"${s("path") ? ` in ${s("path")}` : ""}`
    if (tool === "websearch")                       return `"${s("query")}"`
    if (tool === "webfetch")                        return s("url")
    if (tool === "memory")                          return `${s("action")}: ${s("content") || s("query") || s("id")}`
    if (tool === "apply_patch")                     return "patch"
    if (tool === "subagent")                        return (s("role") || s("prompt")).slice(0, 40)
    if (tool === "lsp")                             return s("path")
    if (tool === "worktree")                        return `${s("action")} ${s("branch")}`.trim()
    if (tool === "todo")                            return s("action")
    const first = Object.values(a).find(v => typeof v === "string")
    return first ? String(first).slice(0, 60) : raw.slice(0, 60)
  } catch {
    return raw.replace(/\n/g, " ").slice(0, 60)
  }
}

// ── Tool rengi ────────────────────────────────────────────────────────────────

function toolColor(tool: string | undefined, isError: boolean, isPending: boolean, theme: ReturnType<typeof useTheme>): string {
  if (isError)   return theme.error
  if (isPending) return theme.accent
  const t = tool ?? ""
  if (["write","edit","apply_patch","undo"].includes(t))  return theme.warning
  if (["bash","shell"].includes(t))                       return theme.success
  if (["websearch","webfetch"].includes(t))               return "#a78bfa"
  if (["read","glob","grep","lsp"].includes(t))           return theme.accent
  if (["subagent"].includes(t))                           return "#e879f9"
  if (["memory"].includes(t))                             return "#34d399"
  return theme.accentAlt
}

// ── Thinking bloğu ────────────────────────────────────────────────────────────

function ThinkingBlock({ content }: { content: string }) {
  const all    = content.split("\n").filter((l) => l.trim())
  const total  = all.length
  const shown  = all.slice(-3)
  return (
    <VStack gap="none" marginBottom="sm">
      <HStack gap="xs">
        <Text color={THINK_BORDER}>∴</Text>
        <Text color={THINK_COLOR} italic dimColor>thought · {total} lines</Text>
      </HStack>
      <VStack marginLeft="md">
        {shown.map((line, i) => (
          <HStack key={i}>
            <Text color={THINK_BORDER} dimColor>┊ </Text>
            <Text color={THINK_COLOR} italic dimColor wrap="wrap">{line}</Text>
          </HStack>
        ))}
      </VStack>
    </VStack>
  )
}

// ── Pending tool — spinner + opsiyonel canlı çıktı ───────────────────────────

function PendingToolCall({
  tool, command, streamingOutput,
}: { tool: string; command: string; streamingOutput?: string }) {
  const theme   = useTheme()
  const spin    = useSpinnerFrame("dots")
  const [ms, setMs] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setMs(n => n + 100), 100)
    return () => clearInterval(t)
  }, [])
  const elapsed = ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`

  // Streaming output: ANSI'den arındır, son MAX_STREAM_LINES satırı göster
  const streamLines = streamingOutput
    ? stripAnsi(streamingOutput).split("\n").slice(-MAX_STREAM_LINES)
    : null

  return (
    <VStack marginBottom="sm" paddingX="xs">
      <HStack gap="xs">
        <Text color={theme.accent}>{spin}</Text>
        <Typo variant="bodyEmphasis" tone="primary">{tool}</Typo>
        <Typo variant="body" tone="muted">{command.slice(0, 65)}{command.length > 65 ? "…" : ""}</Typo>
        <Typo variant="caption" tone="muted" dimColor>{elapsed}</Typo>
      </HStack>
      {streamLines && streamLines.length > 0 && (
        <Box
          marginLeft={3}
          borderStyle="single"
          borderTop={false} borderBottom={false} borderRight={false}
          borderColor={theme.borderDim}
          paddingLeft={1}
        >
          {streamLines.map((line, i) => (
            <Text key={i} color={theme.textSecondary} dimColor>{line || " "}</Text>
          ))}
          <Text color={theme.accent}>▋</Text>
        </Box>
      )}
    </VStack>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  message:           DisplayMessage
  onExpand?:         (() => void) | undefined
  onExpandThinking?: (() => void) | undefined
}

// ── Ana bileşen ───────────────────────────────────────────────────────────────

export const Message = memo(function Message({ message, onExpand, onExpandThinking }: Props) {
  const theme    = useTheme()
  const termCols = useTerminalCols()

  // ── User ──────────────────────────────────────────────────────────────────────
  if (message.role === "user") {
    return (
      <VStack marginBottom="sm" paddingX="xs">
        <HStack gap="xs">
          <Text color={theme.userColor} bold>❯</Text>
          <Text wrap="wrap" color={theme.textPrimary}>{message.content}</Text>
          {message.timestamp && <Timestamp ts={message.timestamp} />}
        </HStack>
      </VStack>
    )
  }

  // ── Assistant ─────────────────────────────────────────────────────────────────
  if (message.role === "assistant") {
    const hasThinking = !!message.reasoningContent
    const hasText     = !!message.content
    const pending     = !!message.pending

    return (
      <VStack marginBottom="sm" paddingX="xs">

        {/* Thinking bloğu */}
        {hasThinking && !pending && (
          <ThinkingBlock content={message.reasoningContent!} />
        )}

        {/* ● + sol kenar dikey bar */}
        <HStack gap="xs">
          <Box width={2} flexShrink={0}>
            <Text color={pending && !hasText ? theme.accent : theme.assistantDot}>
              {pending && !hasText ? "○" : "●"}
            </Text>
          </Box>
          <Box
            flexGrow={1}
            borderStyle="single"
            borderTop={false} borderBottom={false} borderRight={false}
            borderColor={pending ? theme.accent : theme.borderDim}
            paddingLeft={1}
          >
            {hasText && <Markdown content={message.content} />}
            {pending  && <Text color={theme.accent}>▋</Text>}
            {!hasText && !pending && <Text color={theme.textDim} dimColor italic>…</Text>}
          </Box>
        </HStack>

        {message.timestamp && !pending && <Timestamp ts={message.timestamp} />}
      </VStack>
    )
  }

  // ── Tool Call ─────────────────────────────────────────────────────────────────
  if (message.role === "tool_call") {
    // Pending subagent çağrıları AgentStatus'ta zaten gösteriliyor — burada gizle
    if (message.pending && message.tool === "subagent") return null

    const summary     = summarizeArgs(message.tool ?? "tool", message.content)
    const isError     = !!(message.resultContent?.startsWith("ERROR:"))
    const color       = toolColor(message.tool, isError, !!message.pending, theme)

    if (message.pending) {
      return (
        <PendingToolCall
          tool={message.tool ?? "tool"}
          command={summary}
          {...(message.resultContent !== undefined ? { streamingOutput: message.resultContent } : {})}
        />
      )
    }

    // Tamamlandı — header + sol bar output
    const safeW  = Math.max(20, termCols - 10)
    const lines  = prepareLines(message.resultContent ?? "", safeW)
    const hasMore = lines.length > MAX_TOOL_LINES
    const visible = lines.slice(0, MAX_TOOL_LINES)

    return (
      <VStack marginBottom="sm" paddingX="xs">
        {/* Header: ◆ tool  arg  ✓ done  0.3s */}
        <HStack gap="xs">
          <Text color={color}>◆</Text>
          <Typo variant="bodyEmphasis" tone="primary">{message.tool ?? "tool"}</Typo>
          <Typo variant="body" tone="muted">{summary}</Typo>
          <Badge tone={isError ? "error" : "success"} variant="solid">
            {isError ? "✗ fail" : "✓ done"}
          </Badge>
          {message.durationMs !== undefined && message.durationMs > 0 && (
            <Typo variant="caption" tone="muted" dimColor>
              {message.durationMs < 1000
                ? `${message.durationMs}ms`
                : `${(message.durationMs / 1000).toFixed(1)}s`}
            </Typo>
          )}
          {message.timestamp && <Timestamp ts={message.timestamp} />}
        </HStack>

        {/* Output — sol kenar bar */}
        {message.resultContent && (() => {
          const diffMatch = message.resultContent.match(/^.*\n__DIFF__\n([\s\S]*?)\n__NEW__\n([\s\S]*)$/)
          if (diffMatch && message.tool === "edit") {
            return (
              <Box marginLeft={3} marginRight={2}>
                <EditDiffView oldText={diffMatch[1]!} newText={diffMatch[2]!} />
              </Box>
            )
          }
          return (
            <Box
              marginLeft={3}
              borderStyle="single"
              borderTop={false} borderBottom={false} borderRight={false}
              borderColor={color}
              paddingLeft={1}
            >
              {looksLikeDiff(message.resultContent)
                ? <DiffView content={message.resultContent} />
                : (<>
                    {visible.map((line, i) => (
                      <Text key={i} color={isError ? theme.error : theme.textSecondary}>{line || " "}</Text>
                    ))}
                    {hasMore && (
                      <Text color={theme.textDim} dimColor>
                        ⋯ {lines.length - MAX_TOOL_LINES} more lines{onExpand ? " [Ctrl+O]" : ""}
                      </Text>
                    )}
                  </>)
              }
            </Box>
          )
        })()}
      </VStack>
    )
  }

  // ── System ────────────────────────────────────────────────────────────────────
  if (message.role === "system") {
    return (
      <HStack marginBottom="sm" paddingX="md" gap="xs">
        <Text color={theme.borderBright} dimColor>◆</Text>
        <Typo variant="body" tone="secondary">{message.content}</Typo>
        {message.timestamp && <Timestamp ts={message.timestamp} />}
      </HStack>
    )
  }

  // ── Error ─────────────────────────────────────────────────────────────────────
  if (message.role === "error") {
    return (
      <HStack marginBottom="sm" paddingX="md" gap="xs">
        <Text color={theme.error} bold>✗</Text>
        <Text color={theme.error} wrap="wrap">{message.content}</Text>
      </HStack>
    )
  }

  if (message.role === "tool_result") return null
  return null
})

export function hasThinkingContent(m: DisplayMessage): boolean {
  return !!m.reasoningContent
}
