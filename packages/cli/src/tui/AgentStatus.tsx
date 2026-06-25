/**
 * AgentStatus — OpenClaude CoordinatorTaskPanel'ından uyarlanan subagent listesi.
 *
 * Format:
 *   ● main
 *   ○ Security Auditor   scanning auth flows… ▶ 22.9s · 20 calls
 * ▶ ○ Architecture Rev   mapping component tree ▶ 11.2s · 8 calls  · ctrl+x to view
 *   ⏸ Test Runner   done ⏸ 5.1s · 15 calls  · x to clear
 *
 * Tamamlanan agentlar EVICT_AFTER_MS süre sonra listeden kaldırılır.
 */

import React, { useState, useEffect, useRef } from "react"
import { Box, Text, useInput } from "ink"
import { agentPool } from "@aurict/core"
import type { AgentInfo } from "@aurict/core"
import { useTheme } from "../utils/theme.js"
import { useTerminalSize } from "./TerminalSizeContext.js"

const EVICT_AFTER_MS = 6_000

const TYPE_COLOR: Record<string, string> = {
  explore:     "#0ea5e9",
  code:        "#10b981",
  review:      "#f59e0b",
  test:        "#a78bfa",
  docs:        "#64748b",
  performance: "#f97316",
  analytics:   "#fb923c",
  security:    "#ef4444",
  pentest:     "#dc2626",
  adviser:     "#8b5cf6",
  reporter:    "#64748b",
  debug:       "#ec4899",
  refactor:    "#06b6d4",
  devops:      "#8b5cf6",
  design:      "#e879f9",
  data:        "#14b8a6",
  critic:      "#94a3b8",
}

function fmtElapsed(startedAt: number, now: number): string {
  const s = (now - startedAt) / 1000
  if (s < 60) return `${s.toFixed(1)}s`
  const m = Math.floor(s / 60)
  return `${m}m ${Math.floor(s % 60)}s`
}

interface VisibleAgent {
  info:     AgentInfo
  evictAt:  number | undefined   // undefined = no deadline; timestamp = hide after
}

interface Props {
  viewingSessionId?: string | null
  onViewAgent?:      (sessionId: string | null) => void
  selectedAgentIdx?: number
  onSelectAgent?:    (idx: number) => void
}

export function AgentStatus({ viewingSessionId, onViewAgent, selectedAgentIdx, onSelectAgent }: Props) {
  const theme = useTheme()
  const [visible, setVisible] = useState<VisibleAgent[]>([])
  const [now, setNow]         = useState(() => Date.now())
  const visibleRef            = useRef<VisibleAgent[]>([])
  visibleRef.current          = visible

  // agentPool.onChange: yeni agent gelince veya status değişince güncelle
  useEffect(() => {
    return agentPool.onChange((agents) => {
      setVisible((prev) => {
        const prevMap = new Map(prev.map((v) => [v.info.id, v]))
        const next: VisibleAgent[] = []

        for (const info of agents) {
          const existing = prevMap.get(info.id)
          if (info.status === "running") {
            // Çalışıyor: evictAt sıfırla (eğer önceden terminate olduysa ve tekrar gelirse)
            next.push({ info, evictAt: undefined })
          } else {
            // Bitti/hata: eğer zaten evictAt varsa koru, yoksa şimdi yaz
            const deadline = existing?.evictAt ?? Date.now() + EVICT_AFTER_MS
            next.push({ info, evictAt: deadline })
          }
        }
        return next
      })
    })
  }, [])

  // 1s tick: elapsed time güncelle + süresi dolan agentları evict et
  useEffect(() => {
    if (!visible.length) return
    const t = setInterval(() => {
      const nowMs = Date.now()
      setNow(nowMs)
      setVisible((prev) => {
        const next = prev.filter((v) => v.evictAt === undefined || v.evictAt > nowMs)
        return next.length === prev.length ? prev : next
      })
    }, 1_000)
    return () => clearInterval(t)
  }, [visible.length])

  // Manuel evict: x tuşuyla seçili tamamlanmış agentı kaldır
  useInput((input, key) => {
    if (!visible.length) return
    if (input === "x" && !key.ctrl && !key.meta) {
      const idx = selectedAgentIdx ?? 0
      const target = visible[idx]
      if (target && target.evictAt !== undefined) {
        setVisible((prev) => prev.filter((_, i) => i !== idx))
      }
    }
  }, { isActive: visible.length > 0 })

  if (!visible.length) return null

  const cols = useTerminalSize().columns

  return (
    <Box flexDirection="column" marginTop={1} paddingLeft={1}>
      {/* Main line — OpenClaude'da her zaman gösterilir */}
      <Box>
        <Text dimColor={viewingSessionId != null}>
          {"  "}
          <Text>{viewingSessionId == null ? "●" : "○"}</Text>
          {" main"}
        </Text>
      </Box>

      {/* Per-agent lines */}
      {visible.map((v, i) => {
        const { info } = v
        const isSelected  = i === (selectedAgentIdx ?? -1)
        const isViewed    = viewingSessionId === info.sessionId
        const isRunning   = info.status === "running"
        const isDone      = info.status === "done"
        const isError     = info.status === "error"
        const color       = TYPE_COLOR[info.type] ?? theme.accent
        const prefix      = isSelected ? "▶ " : "  "
        const bullet      = isViewed ? "●" : "○"
        const statusIcon  = isRunning ? "▶" : "⏸"
        const elapsedStr  = fmtElapsed(info.startedAt, now)
        const callsSuffix = info.toolCount > 0 ? ` · ${info.toolCount} calls` : ""

        // Hint: seçiliyse ne yapılabileceğini göster
        const hint = isSelected
          ? (isRunning ? " · ctrl+x to view" : " · x to clear")
          : ""

        // Aktivite: currentTool yoksa lastLine'ı özetle olarak kullan
        const rawActivity = info.currentTool
          ? `running: ${info.currentTool}`
          : (info.lastLine?.trim() ?? "")

        // Terminal genişliğine sığdır
        // prefix(2) + bullet(1) + sp(1) + desc + sp(1) + statusIcon(1) + sp(1) + elapsed + calls + hint
        const fixedWidth = 2 + 1 + 1 + info.desc.length + 1 + 1 + 1 + elapsedStr.length + callsSuffix.length + hint.length + 4
        const activityMaxLen = Math.max(0, cols - fixedWidth - 4)
        const activity = rawActivity && activityMaxLen > 6
          ? (rawActivity.length > activityMaxLen ? rawActivity.slice(0, activityMaxLen - 1) + "…" : rawActivity)
          : ""

        const dim = !isSelected && !isViewed

        return (
          <Box key={info.id}>
            <Text dimColor={dim} bold={isViewed}>
              {prefix}
              <Text color={color}>{bullet}</Text>
              {" "}
              <Text color={isError ? theme.error : color} bold>{info.desc}</Text>
              {activity ? <Text color={theme.textDim}>{" "}{activity}</Text> : null}
              {" "}
              <Text color={isRunning ? theme.success : isDone ? theme.textDim : theme.error}>{statusIcon}</Text>
              {" "}
              {elapsedStr}
              <Text color={theme.textDim}>{callsSuffix}</Text>
              {hint ? <Text color={theme.textDim} dimColor>{hint}</Text> : null}
            </Text>
          </Box>
        )
      })}
    </Box>
  )
}
