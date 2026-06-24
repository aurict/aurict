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
import { DiffRenderer } from "./DiffRenderer/index.js"
import { ToolUseLoader } from "./ToolUseLoader.js"

function looksLikeDiff(text: string): boolean {
  const first10 = text.split("\n").slice(0, 10)
  return first10.some((l) => l.startsWith("---") || l.startsWith("+++") || /^@@.*@@/.test(l))
}
import { useTheme } from "../utils/theme.js"
import { HStack, VStack, Typo } from "./design-system/index.js"

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

const MAX_TOOL_LINES   = 3   // OpenClaude: MAX_LINES_TO_SHOW = 3
const MAX_STREAM_LINES = 8

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

function formatBytes(text: string): string {
  const bytes = new TextEncoder().encode(text).length
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function lineCount(text: string): number {
  if (!text) return 0
  return text.endsWith("\n") ? text.split("\n").length - 1 : text.split("\n").length
}

function previewToolLines(lines: string[]): string[] {
  return lines.slice(0, MAX_TOOL_LINES)
}

function maybeFormatJson(text: string): string {
  const trimmed = text.trim()
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return text
  try {
    const pretty = JSON.stringify(JSON.parse(trimmed), null, 2)
    return pretty.length <= 10_000 ? pretty : text
  } catch {
    return text
  }
}

function extractEditPath(output: string): string | undefined {
  const m = output.match(/^Replaced \d+ occurrence(?:s)? in (.+)$/m)
  return m?.[1]?.trim()
}

function parsePatchSummary(output: string): { files: string[]; added: number; removed: number } | null {
  if (!output.includes("Applied patch:") && !output.includes("Changed files:")) return null
  const changed = output.match(/^Changed files:\s*(.+)$/m)?.[1]
  const stats = output.match(/^Stats:\s*\+(\d+)\s+-(\d+)$/m)
  const applied = [...output.matchAll(/^\s*(?:Add File|Delete File|Update File|Move to):\s*(.+)$/gm)].map((m) => m[1]?.trim()).filter(Boolean) as string[]
  const files = changed
    ? changed.split(",").map((part) => part.trim()).filter(Boolean)
    : applied
  if (files.length === 0 && !stats) return null
  return {
    files,
    added: stats ? Number(stats[1]) : 0,
    removed: stats ? Number(stats[2]) : 0,
  }
}

function PatchSummaryView({ output, width }: { output: string; width: number }) {
  const theme = useTheme()
  const summary = parsePatchSummary(output)
  if (!summary) return null
  const nameWidth = Math.max(18, width - 18)

  return (
    <VStack width={width} gap="none">
      <HStack width={width} gap="sm">
        <Text color={theme.borderBright}>╭─</Text>
        <Typo variant="label" tone="primary">patch applied</Typo>
        <Text color={theme.success} bold>{`+${summary.added}`}</Text>
        <Text color={theme.error} bold>{`-${summary.removed}`}</Text>
      </HStack>
      {summary.files.map((file, index) => {
        const isMove = file.includes(" -> ")
        const action = isMove ? "move" : "update"
        return (
          <HStack key={`${file}-${index}`} width={width} gap="sm">
            <Text color={theme.borderDim}>│</Text>
            <Text color={isMove ? theme.warning : theme.accent}>{action.padEnd(6)}</Text>
            <Text color={theme.textSecondary}>{file.length > nameWidth ? file.slice(0, nameWidth - 1) + "…" : file}</Text>
          </HStack>
        )
      })}
      <HStack width={width} gap="sm">
        <Text color={theme.borderBright}>╰─</Text>
        <Text color={theme.textDim} dimColor>{summary.files.length} file{summary.files.length === 1 ? "" : "s"} touched</Text>
      </HStack>
    </VStack>
  )
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

// ── Thinking bloğu — OpenClaude ∴ pattern ────────────────────────────────────

function ThinkingMessage({ content, onExpand }: { content: string; onExpand?: () => void }) {
  const theme = useTheme()
  const lines = content.split("\n").filter((l) => l.trim()).length
  return (
    <HStack gap="sm" marginBottom="xs">
      <Text color={theme.borderDim} dimColor italic>∴</Text>
      <Text color={theme.accent} dimColor italic>Thinking</Text>
      <Text color={theme.textDim} dimColor>({lines} {lines === 1 ? "line" : "lines"})</Text>
      {onExpand && <Text color={theme.textDim} dimColor>· Ctrl+O expand</Text>}
    </HStack>
  )
}

// ── Pending tool — ToolUseLoader + opsiyonel canlı çıktı ────────────────────

function PendingToolCall({
  tool, command, streamingOutput,
}: { tool: string; command: string; streamingOutput?: string }) {
  const theme   = useTheme()
  const [ms, setMs] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setMs(n => n + 100), 100)
    return () => clearInterval(t)
  }, [])
  const elapsed = ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`

  const streamLines = streamingOutput
    ? stripAnsi(streamingOutput).split("\n").slice(-MAX_STREAM_LINES)
    : null

  return (
    <VStack marginBottom="md" paddingX="sm">
      <HStack gap="sm">
        <ToolUseLoader shouldAnimate isUnresolved isError={false} />
        <Typo variant="bodyEmphasis" tone="primary">{tool}</Typo>
        <Typo variant="body" tone="muted">{command.slice(0, 65)}{command.length > 65 ? "…" : ""}</Typo>
        <Typo variant="caption" tone="muted" dimColor>{elapsed}</Typo>
      </HStack>
      {streamLines && streamLines.length > 0 && (
        <Box
          marginLeft={3}
          flexDirection="column"
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
  const bodyWidth = Math.max(20, termCols - 9)
  const userWidth = Math.max(20, termCols - 18)

  // ── User ──────────────────────────────────────────────────────────────────────
  if (message.role === "user") {
    return (
      <VStack marginBottom="sm" paddingX="sm">
        <HStack gap="sm">
          <Text color={theme.textDim}>{">"}</Text>
          <Box width={userWidth}>
            <Text wrap="wrap" color={theme.textPrimary}>{message.content}</Text>
          </Box>
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
      <VStack marginBottom="sm" paddingX="sm">

        {/* ∴ Thinking — collapsed, Ctrl+O ile overlay açılır */}
        {hasThinking && !pending && (
          <ThinkingMessage
            content={message.reasoningContent!}
            {...(onExpandThinking ? { onExpand: onExpandThinking } : {})}
          />
        )}

        {/* ● dot + içerik — OpenClaude AssistantTextMessage pattern */}
        <Box flexDirection="row">
          <Box width={2} flexShrink={0}>
            <Text color={pending && !hasText ? theme.accent : theme.assistantDot}>
              {pending && !hasText ? "○" : "●"}
            </Text>
          </Box>
          <Box flexDirection="column" flexShrink={1} width={bodyWidth}>
            {hasText && <Markdown content={message.content} width={Math.max(10, bodyWidth - 2)} />}
            {pending  && <Text color={theme.accent}>▋</Text>}
            {!hasText && !pending && <Text color={theme.textDim} dimColor italic>…</Text>}
          </Box>
        </Box>

        {message.timestamp && !pending && <Timestamp ts={message.timestamp} />}
      </VStack>
    )
  }

  // ── Tool Call ─────────────────────────────────────────────────────────────────
  if (message.role === "tool_call") {
    // Pending subagent çağrıları AgentStatus'ta zaten gösteriliyor — burada gizle
    if (message.pending && message.tool === "subagent") return null

    const summary     = summarizeArgs(message.tool ?? "tool", message.content)
    const rawOutput   = message.resultContent ?? ""
    const isError     = !!(rawOutput.startsWith("ERROR:"))
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
    const safeW        = Math.max(20, termCols - 12)
    const displayOutput = maybeFormatJson(rawOutput)
    const lines        = prepareLines(displayOutput, safeW)
    const totalLines   = lineCount(displayOutput)
    const hasOutput    = rawOutput.trim().length > 0
    const hasMore      = lines.length > MAX_TOOL_LINES
    const visible      = hasOutput ? previewToolLines(lines) : []
    const hiddenLines  = Math.max(0, lines.length - visible.length)
    const outputStats  = `${totalLines} ${totalLines === 1 ? "line" : "lines"} · ${formatBytes(rawOutput)}`
    const diffWidth   = Math.max(40, termCols - 12)

    return (
      <VStack marginBottom="md" paddingX="sm">
        {/* Header: loader, tool, args, timing */}
        <HStack gap="sm">
          <ToolUseLoader shouldAnimate={false} isUnresolved={false} isError={isError} />
          <Typo variant="bodyEmphasis" tone="primary">{message.tool ?? "tool"}</Typo>
          <Typo variant="body" tone="muted">{summary}</Typo>
          {message.durationMs !== undefined && message.durationMs > 0 && (
            <Typo variant="caption" tone="muted" dimColor>
              {message.durationMs < 1000
                ? `${message.durationMs}ms`
                : `${(message.durationMs / 1000).toFixed(1)}s`}
            </Typo>
          )}
          <Typo variant="caption" tone="muted" dimColor>{outputStats}</Typo>
          {message.timestamp && <Timestamp ts={message.timestamp} />}
        </HStack>

        {/* Output — sol kenar bar */}
        {message.resultContent !== undefined && (() => {
          const diffMatch = rawOutput.match(/^.*\n__DIFF__\n([\s\S]*?)\n__NEW__\n([\s\S]*)$/)
          if (diffMatch && message.tool === "edit") {
            const editPath = extractEditPath(rawOutput)
            return (
              <Box marginLeft={3} marginRight={2}>
                <DiffRenderer
                  oldText={diffMatch[1]!}
                  newText={diffMatch[2]!}
                  {...(editPath ? { fileName: editPath } : {})}
                  initialMode="unified"
                  width={diffWidth}
                  enableModeToggle
                  enableHunkNav
                />
              </Box>
            )
          }
          if (message.tool === "apply_patch") {
            const patchSummary = <PatchSummaryView output={rawOutput} width={diffWidth} />
            if (parsePatchSummary(rawOutput)) {
              return <Box marginLeft={3} marginRight={2}>{patchSummary}</Box>
            }
          }
          return (
            <Box
              marginLeft={3}
              width={Math.max(20, termCols - 8)}
              flexDirection="column"
              borderStyle="single"
              borderTop={false} borderBottom={false} borderRight={false}
              borderColor={color}
              paddingLeft={1}
            >
              {looksLikeDiff(rawOutput)
                ? <DiffRenderer rawDiff={rawOutput} width={diffWidth} initialMode="unified" enableModeToggle enableHunkNav />
                : (<>
                    {!hasOutput && (
                      <Text color={theme.textDim} dimColor>(No output)</Text>
                    )}
                    {visible.map((line, i) => (
                      <Text key={i} color={isError ? theme.error : theme.textSecondary}>{line || " "}</Text>
                    ))}
                    {hasMore && (
                      <Text color={theme.textDim} dimColor>
                        ⋯ {hiddenLines} hidden lines{onExpand ? " · Ctrl+O expand latest" : ""}
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
      <HStack marginBottom="sm" paddingX="md" gap="sm">
        <Text color={theme.borderBright} dimColor>·</Text>
        <Typo variant="body" tone="secondary">{message.content}</Typo>
        {message.timestamp && <Timestamp ts={message.timestamp} />}
      </HStack>
    )
  }

  // ── Error ─────────────────────────────────────────────────────────────────────
  if (message.role === "error") {
    return (
      <HStack marginBottom="sm" paddingX="md" gap="sm">
        <Text color={theme.error} bold>✗</Text>
        <Text color={theme.error} wrap="wrap">{message.content}</Text>
      </HStack>
    )
  }

  return null
})

export function hasThinkingContent(m: DisplayMessage): boolean {
  return !!m.reasoningContent
}
