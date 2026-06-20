import React, { useState, useEffect } from "react"
import { Box, Text } from "ink"
import { agentPool } from "@aurict/core"
import type { AgentInfo } from "@aurict/core"
import { useTheme } from "../utils/theme.js"

const SPIN = ["⠋","⠙","⠹","⠸","⠼","⠴","⠦","⠧","⠇","⠏"]

function elapsed(startedAt: number): string {
  const ms = Date.now() - startedAt
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

// Tip rengı
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

export function AgentStatus() {
  const theme  = useTheme()
  const [agents, setAgents] = useState<AgentInfo[]>(() => agentPool.active)
  const [tick,   setTick]   = useState(0)

  useEffect(() => agentPool.onChange(setAgents), [])

  // Elapsed time için tick
  useEffect(() => {
    if (!agents.length) return
    const t = setInterval(() => setTick((n) => n + 1), 200)
    return () => clearInterval(t)
  }, [agents.length])

  if (!agents.length) return null

  const spin = SPIN[tick % SPIN.length]!

  return (
    <Box flexDirection="column" marginLeft={1} marginBottom={0}>
      {agents.map((a) => {
        const color = TYPE_COLOR[a.type] ?? theme.accent
        return (
          <Box key={a.id} flexDirection="column">
            {/* Ana satır: spinner + tip + açıklama + süre + session ref */}
            <Box gap={1}>
              <Text color={color}>{spin}</Text>
              <Text color={theme.textDim} dimColor>⇢</Text>
              <Text color={color} bold>{a.type}</Text>
              <Text color={theme.textPrimary}>{a.desc}</Text>
              <Text color={theme.borderBright} dimColor>{elapsed(a.startedAt)}</Text>
              {a.toolCount > 0 && (
                <Text color={theme.textDim} dimColor>· {a.toolCount} calls</Text>
              )}
              <Text color={theme.borderDim} dimColor>#{a.sessionId.slice(0, 8)}</Text>
            </Box>
            {/* Aktif tool veya son satır */}
            {a.currentTool && (
              <Box paddingLeft={3} gap={1}>
                <Text color={theme.borderBright} dimColor>└</Text>
                <Text color={theme.textDim} dimColor>running</Text>
                <Text color={color} dimColor>{a.currentTool}</Text>
              </Box>
            )}
            {!a.currentTool && a.lastLine && (
              <Box paddingLeft={3} gap={1}>
                <Text color={theme.borderBright} dimColor>└</Text>
                <Text color={theme.textDim} dimColor italic>
                  {a.lastLine.slice(0, 70)}{a.lastLine.length > 70 ? "…" : ""}
                </Text>
              </Box>
            )}
          </Box>
        )
      })}
    </Box>
  )
}
