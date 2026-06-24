import React, { useState, useEffect, useMemo } from "react"
import { Box, Text, useInput } from "ink"
import { SessionManager, agentPool } from "@aurict/core"
import type { Part } from "@aurict/core"
import { useTheme } from "../utils/theme.js"

// Max parts loaded into memory for display — bounds RAM regardless of agent activity
const MAX_PARTS = 300
// Max chars of content we'll process per part — prevents split("\n") on megabyte strings
const MAX_CONTENT_CHARS = 1500

const TYPE_COLOR: Record<string, string> = {
  explore:     "#0ea5e9",
  code:        "#10b981",
  review:      "#f59e0b",
  test:        "#a78bfa",
  docs:        "#64748b",
  performance: "#f97316",
  security:    "#ef4444",
  debug:       "#ec4899",
  refactor:    "#06b6d4",
  devops:      "#8b5cf6",
  design:      "#e879f9",
  data:        "#14b8a6",
}

function partToLines(part: Part): Array<{ text: string; color: string; dim?: boolean }> {
  if (part.type === "tool_call") {
    try {
      const tc   = JSON.parse(part.content) as { tool: string; args: unknown }
      const args = typeof tc.args === "object" ? JSON.stringify(tc.args).slice(0, 60) : String(tc.args)
      return [{ text: `⊕ ${tc.tool}  ${args}`, color: "#64748b" }]
    } catch {
      return [{ text: `⊕ ${part.content.slice(0, 80)}`, color: "#64748b" }]
    }
  }
  if (part.type === "tool_result") {
    // Truncate before split to avoid processing megabyte strings
    const safe = part.content.length > MAX_CONTENT_CHARS
      ? part.content.slice(0, MAX_CONTENT_CHARS) + "…"
      : part.content
    const lines = safe.split("\n").slice(0, 3)
    return lines.map((l) => ({ text: `  ${l}`, color: "#475569", dim: true }))
  }
  // text — cap per-part lines so one giant assistant message can't explode allLines
  const safe = part.content.length > MAX_CONTENT_CHARS
    ? part.content.slice(0, MAX_CONTENT_CHARS) + "…"
    : part.content
  return safe.split("\n")
    .filter((l) => l.trim())
    .slice(0, 30)
    .map((l) => ({ text: l, color: "#cbd5e1" }))
}

interface Props {
  sessionId:        string
  parentSessionId:  string
  onClose:          () => void
  onPrev:           () => void
  onNext:           () => void
  siblingIndex:     number   // 1-based
  siblingCount:     number
}

export function SubagentView({ sessionId, parentSessionId, onClose, onPrev, onNext, siblingIndex, siblingCount }: Props) {
  const theme = useTheme()
  const [parts, setParts] = useState<Part[]>(() => SessionManager.getPartsTail(sessionId, MAX_PARTS))
  const [totalCount, setTotalCount] = useState(() => SessionManager.getPartsCount(sessionId))
  // Canlı streaming metni — DB'ye henüz yazılmamış, tool call'lar arası LLM çıktısı
  const [liveText, setLiveText] = useState(() => agentPool.getLiveText(sessionId))
  const PAGE = Math.max(10, (process.stdout.rows ?? 24) - 8)
  const [offset, setOffset] = useState<number>(-1)   // -1 = "tail" modu: en sona kilitli

  // agentPool.onChange → push-based: her text delta'sında anında güncelle
  // DB part sayısı değişince de parts'ı yenile (tool_call / done gelince)
  useEffect(() => {
    const unsub = agentPool.onChange(() => {
      setLiveText(agentPool.getLiveText(sessionId))
      const newCount = SessionManager.getPartsCount(sessionId)
      setTotalCount((prev) => {
        if (newCount !== prev) {
          setParts(SessionManager.getPartsTail(sessionId, MAX_PARTS))
          return newCount
        }
        return prev
      })
    })
    return unsub
  }, [sessionId])

  // Session değişince parts'ı yenile + tail moduna dön
  useEffect(() => {
    const count = SessionManager.getPartsCount(sessionId)
    setTotalCount(count)
    setParts(SessionManager.getPartsTail(sessionId, MAX_PARTS))
    setOffset(-1)
  }, [sessionId])

  const session   = SessionManager.get(sessionId)
  const title     = session?.title ?? sessionId.slice(0, 8)
  const agentType = title.match(/^\[(\w+)\]/)?.[1] ?? "subagent"
  const desc      = title.replace(/^\[\w+\]\s*/, "")
  const color     = TYPE_COLOR[agentType] ?? theme.accent
  const isRunning = agentPool.active.some((a) => a.sessionId === sessionId)
  const status    = isRunning ? "running" : session?.status === "complete" ? "done" : session?.status ?? "?"

  // Memoized: parts array referansı değişmediği sürece yeniden hesaplanmaz
  const allLines = useMemo(() => parts.flatMap(partToLines), [parts])
  const total    = allLines.length

  // offset=-1 → tail modu (son PAGE satırı göster)
  const effectiveOffset = offset === -1
    ? Math.max(0, total - PAGE)
    : Math.min(offset, Math.max(0, total - PAGE))
  const shown    = allLines.slice(effectiveOffset, effectiveOffset + PAGE)
  const isTail   = effectiveOffset >= Math.max(0, total - PAGE)

  // Scroll handler — sol/sağ ok App.tsx'te yakalanıyor, yukarı/aşağı burada
  useInput((_char, key) => {
    if (key.upArrow) {
      setOffset((o) => {
        const cur = o === -1 ? Math.max(0, total - PAGE) : o
        return Math.max(0, cur - 1)
      })
      return
    }
    if (key.downArrow) {
      setOffset((o) => {
        const cur = o === -1 ? Math.max(0, total - PAGE) : o
        const next = Math.min(Math.max(0, total - PAGE), cur + 1)
        return next >= Math.max(0, total - PAGE) ? -1 : next
      })
      return
    }
    if (key.ctrl && _char === "u") {
      setOffset((o) => {
        const cur = o === -1 ? Math.max(0, total - PAGE) : o
        return Math.max(0, cur - Math.floor(PAGE / 2))
      })
      return
    }
    if (key.ctrl && _char === "d") {
      setOffset((o) => {
        const cur = o === -1 ? Math.max(0, total - PAGE) : o
        const next = Math.min(Math.max(0, total - PAGE), cur + Math.floor(PAGE / 2))
        return next >= Math.max(0, total - PAGE) ? -1 : next
      })
      return
    }
  })

  const pct = total <= PAGE ? 100 : Math.round(((effectiveOffset + PAGE) / total) * 100)
  const isTruncated = totalCount > MAX_PARTS

  return (
    <Box flexDirection="column" flexGrow={1}>
      {/* Header */}
      <Box
        borderStyle="single" borderColor={color}
        borderBottom borderTop={false} borderLeft={false} borderRight={false}
        paddingX={2} gap={2}
      >
        <Text color={color} bold>⇢ {agentType}</Text>
        <Text color={theme.textPrimary}>{desc}</Text>
        <Text color={theme.textDim} dimColor>
          {status === "running" ? "⠹ running" : status === "done" ? "✓ done" : `✗ ${status}`}
        </Text>
        <Text color={theme.borderBright} dimColor>#{sessionId.slice(0, 8)}</Text>
        {total > PAGE && (
          <Text color={theme.textDim} dimColor>
            {effectiveOffset + 1}–{Math.min(effectiveOffset + PAGE, total)}/{total}{"  "}{pct}%
            {isTail ? "  [tail]" : ""}
            {isTruncated ? `  (last ${MAX_PARTS}/${totalCount} parts)` : ""}
          </Text>
        )}
      </Box>

      {/* Messages */}
      <Box flexDirection="column" flexGrow={1} paddingX={2} paddingY={1}>
        {shown.length === 0 && !liveText ? (
          <Text color={theme.textDim} dimColor italic>Waiting for agent to start…</Text>
        ) : (
          shown.map((line, i) => (
            <Text key={i} color={line.color} {...(line.dim ? { dimColor: true } : {})}>{line.text}</Text>
          ))
        )}
        {/* Canlı streaming metni — tail modunda, DB'ye yazılmamış anlık LLM çıktısı */}
        {isRunning && isTail && liveText && liveText
          .split("\n")
          .filter((l) => l.trim())
          .slice(-6)
          .map((l, i) => (
            <Text key={`live-${i}`} color={theme.textSecondary}>{l}</Text>
          ))
        }
      </Box>

      {/* Navigation footer */}
      <Box
        borderStyle="single" borderColor={theme.borderDim}
        borderTop borderBottom={false} borderLeft={false} borderRight={false}
        paddingX={2} gap={3}
      >
        <Text color={color} bold>{agentType} ({siblingIndex}/{siblingCount})</Text>
        <Text color={theme.textDim} dimColor>·</Text>
        <Text color={theme.textDim}>[Esc] back</Text>
        {siblingCount > 1 && (
          <>
            <Text color={theme.textDim}>[←] prev</Text>
            <Text color={theme.textDim}>[→] next</Text>
          </>
        )}
        {total > PAGE && (
          <Text color={theme.textDim} dimColor>[↑↓] scroll  Ctrl+U/D yarım sayfa</Text>
        )}
      </Box>
    </Box>
  )
}
