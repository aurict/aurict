/**
 * AgentStatus — subagent list adapted from OpenClaude's CoordinatorTaskPanel.
 *
 * Format:
 *   ● main
 *   ○ Security Auditor   scanning auth flows… ▶ 22.9s · 20 calls
 * ▶ ○ Architecture Rev   mapping component tree ▶ 11.2s · 8 calls  · ctrl+x to view
 *   ⏸ Test Runner   done ⏸ 5.1s · 15 calls  · x to clear
 *
 * Completed agents are removed from the list after EVICT_AFTER_MS.
 */

import React, { useState, useEffect, useRef } from "react"
import { Box, Text, useInput } from "./design-system/renderer.js"
import { agentPool } from "@aurict/core"
import { motionEnabled } from "./design-system/motion.js"
import type { AgentInfo } from "@aurict/core"
import { useTheme } from "../utils/theme.js"
import { useTerminalSize } from "./TerminalSizeContext.js"
import { agentTone } from "./theme/agent-tone.js"
import { useSemanticTheme } from "./theme/semantic-theme.js"
import { glyph } from "./terminal-glyphs.js"

const EVICT_AFTER_MS = 6_000
/** Rows shown under `main`; the rest collapse into one "+N more" line. */
const MAX_AGENT_ROWS = 4

const RADAR_FRAMES = ["◜", "◠", "◝", "◞", "◡", "◟"]
const SCAN_FRAMES = ["▰▱▱▱", "▱▰▱▱", "▱▱▰▱", "▱▱▱▰"]

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
  inputActive?:       boolean
  viewingSessionId?: string | null
  onViewAgent?:      (sessionId: string | null) => void
  selectedAgentIdx?: number
  onSelectAgent?:    (idx: number) => void
}

export function AgentStatus({ inputActive = true, viewingSessionId, onViewAgent, selectedAgentIdx, onSelectAgent }: Props) {
  const theme = useTheme()
  const semantic = useSemanticTheme()
  const [visible, setVisible] = useState<VisibleAgent[]>([])
  const [now, setNow]         = useState(() => Date.now())
  const [frame, setFrame]     = useState(0)
  const visibleRef            = useRef<VisibleAgent[]>([])
  visibleRef.current          = visible

  // agentPool.onChange: update when a new agent arrives or status changes
  useEffect(() => {
    return agentPool.onChange((agents) => {
      setVisible((prev) => {
        const prevMap = new Map(prev.map((v) => [v.info.id, v]))
        const next: VisibleAgent[] = []

        for (const info of agents) {
          const existing = prevMap.get(info.id)
          if (info.status === "running") {
            // Running: reset evictAt (in case it had previously terminated and came back)
            next.push({ info, evictAt: undefined })
          } else {
            // Done/error: keep the existing evictAt if there is one, otherwise set it now
            const deadline = existing?.evictAt ?? Date.now() + EVICT_AFTER_MS
            next.push({ info, evictAt: deadline })
          }
        }
        return next
      })
    })
  }, [])

  // 1s tick: update the elapsed time + evict agents whose deadline has passed
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

  useEffect(() => {
    if (!visible.length || !motionEnabled()) return
    const t = setInterval(() => setFrame((n) => n + 1), 160)
    return () => clearInterval(t)
  }, [visible.length])

  // Manual evict: remove the selected completed agent with the x key
  useInput((input, key) => {
    if (!visible.length) return
    if (input === "x" && !key.ctrl && !key.meta) {
      const idx = selectedAgentIdx ?? 0
      const target = visible[idx]
      if (target && target.evictAt !== undefined) {
        setVisible((prev) => prev.filter((_, i) => i !== idx))
      }
    }
  }, { isActive: inputActive && visible.length > 0 })

  if (!visible.length) return null

  const cols = useTerminalSize().columns

  return (
    <Box flexDirection="column" marginTop={1} paddingLeft={1} borderStyle="single" borderColor={theme.borderDim} borderTop={false} borderRight={false} borderBottom={false}>
      <Box gap={1} paddingLeft={1}>
        <Text color={theme.accentAlt}>{RADAR_FRAMES[frame % RADAR_FRAMES.length]}</Text>
        <Text color={theme.textSecondary} bold>agent radar</Text>
        <Text color={theme.textDim}>{visible.filter((v) => v.info.status === "running").length} active</Text>
        <Text color={theme.borderBright}>{SCAN_FRAMES[frame % SCAN_FRAMES.length]}</Text>
      </Box>
      {/* Main line — always shown in OpenClaude */}
      <Box paddingLeft={1}>
        <Text dimColor={viewingSessionId != null}>
          {"  "}
          <Text>{viewingSessionId == null ? "●" : "○"}</Text>
          {" main"}
        </Text>
      </Box>

      {/* Per-agent lines */}
      {visible.slice(0, MAX_AGENT_ROWS).map((v, i) => {
        const { info } = v
        const isSelected  = i === (selectedAgentIdx ?? -1)
        const isViewed    = viewingSessionId === info.sessionId
        const isRunning   = info.status === "running"
        const isDone      = info.status === "done"
        const isError     = info.status === "error"
        const color       = agentTone(info.type, semantic)
        const lastShown   = i === Math.min(visible.length, MAX_AGENT_ROWS) - 1 && visible.length <= MAX_AGENT_ROWS
        const prefix      = `${isSelected ? "▶" : " "}${glyph(lastShown ? "treeEnd" : "treeMid")} `
        const bullet      = isViewed ? "●" : "○"
        const statusIcon  = isRunning ? (frame + i) % 2 === 0 ? "◆" : "◇" : isDone ? "✓" : "!"
        const elapsedStr  = fmtElapsed(info.startedAt, now)
        const callsSuffix = info.toolCount > 0 ? ` · ${info.toolCount} calls` : ""

        // Hint: show what can be done if selected
        const hint = isSelected
          ? (isRunning ? " · ctrl+x to view" : " · x to clear")
          : ""

        // Activity: if there's no currentTool, use lastLine as a summary
        const rawActivity = info.currentTool
          ? `running: ${info.currentTool}`
          : (info.lastLine?.trim() ?? "")

        // Fit to terminal width
        // prefix(2) + bullet(1) + sp(1) + desc + sp(1) + statusIcon(1) + sp(1) + elapsed + calls + hint
        const fixedWidth = 2 + 1 + 1 + info.desc.length + 1 + 1 + 1 + elapsedStr.length + callsSuffix.length + hint.length + 4
        const activityMaxLen = Math.max(0, cols - fixedWidth - 4)
        const activity = rawActivity && activityMaxLen > 6
          ? (rawActivity.length > activityMaxLen ? rawActivity.slice(0, activityMaxLen - 1) + "…" : rawActivity)
          : ""

        const dim = !isSelected && !isViewed

        return (
          <Box key={info.id} paddingLeft={1}>
            <Text dimColor={dim} bold={isViewed}>
              {prefix}
              <Text color={color}>{isRunning && (frame + i) % 3 === 0 ? "◉" : bullet}</Text>
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
      {visible.length > MAX_AGENT_ROWS && (
        <Box paddingLeft={1}>
          <Text color={theme.textDim}>
            {` ${glyph("treeEnd")} +${visible.length - MAX_AGENT_ROWS} more ${glyph("statusTiny")} Ctrl+X to view`}
          </Text>
        </Box>
      )}
    </Box>
  )
}
