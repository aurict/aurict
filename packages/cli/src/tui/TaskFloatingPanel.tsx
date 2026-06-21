import React, { useState } from "react"
import { Box, Text, useInput } from "ink"
import type { Task } from "@aurict/core"
import { useTheme } from "../utils/theme.js"

const STATUS_ICON: Record<Task["status"], string> = {
  done:        "✓",
  error:       "✗",
  pending:     "○",
  in_progress: "●",
}

const PAGE_SIZE = 12
const PANEL_WIDTH = 40

interface Props {
  tasks:   Task[]
  onClose: () => void
}

export function TaskFloatingPanel({ tasks, onClose }: Props) {
  const theme   = useTheme()
  const [offset, setOffset] = useState(0)

  const STATUS_COLOR: Record<Task["status"], string> = {
    done:        theme.success,
    error:       theme.error,
    pending:     theme.textDim,
    in_progress: theme.accent,
  }

  useInput((input, key) => {
    if (key.escape || (key.ctrl && input === "t")) { onClose(); return }
    if (key.upArrow)   setOffset(o => Math.max(0, o - 1))
    if (key.downArrow) setOffset(o => Math.min(Math.max(0, tasks.length - PAGE_SIZE), o + 1))
    if (input === "g" && !key.shift) setOffset(0)
    if (input === "G" || (input === "g" && key.shift)) setOffset(Math.max(0, tasks.length - PAGE_SIZE))
  })

  const shown    = tasks.slice(offset, offset + PAGE_SIZE)
  const above    = offset
  const below    = Math.max(0, tasks.length - offset - PAGE_SIZE)
  const allDone  = tasks.length > 0 && tasks.every(t => t.status === "done" || t.status === "error")
  const counts = {
    pending:     tasks.filter(t => t.status === "pending").length,
    inProgress:  tasks.filter(t => t.status === "in_progress").length,
    done:        tasks.filter(t => t.status === "done").length,
    error:       tasks.filter(t => t.status === "error").length,
  }
  const finished = counts.done + counts.error
  const pct = tasks.length > 0 ? Math.round((finished / tasks.length) * 100) : 0
  const barWidth = 18
  const filled = tasks.length > 0 ? Math.round((finished / tasks.length) * barWidth) : 0
  const progress = "█".repeat(filled) + "░".repeat(barWidth - filled)

  return (
    <Box
      width={PANEL_WIDTH}
      flexDirection="column"
      flexShrink={0}
      borderStyle="single"
      borderColor={theme.borderDim}
      paddingX={1}
    >
      {/* Başlık */}
      <Box justifyContent="space-between" marginBottom={1}>
        <Text color={theme.textSecondary} bold>Tasks ({tasks.length})</Text>
        <Text color={theme.textDim} dimColor>Esc · ↑↓ · g/G</Text>
      </Box>

      {tasks.length > 0 && (
        <Box flexDirection="column" marginBottom={1}>
          <Box gap={1}>
            <Text color={theme.success}>{progress.slice(0, filled)}</Text>
            <Text color={theme.borderDim}>{progress.slice(filled)}</Text>
            <Text color={theme.textDim} dimColor>{pct}%</Text>
          </Box>
          <Box gap={1}>
            {counts.inProgress > 0 && <Text color={theme.accent}>run {counts.inProgress}</Text>}
            {counts.pending > 0 && <Text color={theme.textDim}>wait {counts.pending}</Text>}
            {counts.done > 0 && <Text color={theme.success}>done {counts.done}</Text>}
            {counts.error > 0 && <Text color={theme.error}>err {counts.error}</Text>}
          </Box>
        </Box>
      )}

      {/* Yukarı scroll göstergesi */}
      {above > 0 && (
        <Text color={theme.textDim} dimColor>  ↑ {above} above</Text>
      )}

      {/* Boş durum */}
      {shown.length === 0 && (
        <Text color={theme.textDim} italic>No tasks yet</Text>
      )}

      {/* All-done durumu */}
      {allDone && (
        <Text color={theme.success} dimColor>  All done ✓</Text>
      )}

      {/* Task listesi */}
      {shown.map((t) => {
        const owner = t.owner ? `@${t.owner}` : ""
        const suffix = owner || (t.blockedBy.length > 0 ? `blocked ${t.blockedBy.length}` : "")
        const maxLabel = suffix ? 24 : 32
        const label = t.subject.length > maxLabel ? t.subject.slice(0, maxLabel - 1) + "…" : t.subject
        return (
          <Box key={t.id} flexDirection="column" marginBottom={0}>
            <Box gap={1}>
              <Text color={STATUS_COLOR[t.status]}>{STATUS_ICON[t.status]}</Text>
              <Text
                color={t.status === "done" ? theme.textDim : theme.textPrimary}
                strikethrough={t.status === "done"}
              >
                {label}
              </Text>
              {suffix && <Text color={theme.textDim} dimColor>{suffix}</Text>}
            </Box>
            {t.status === "error" && t.error && (
              <Box paddingLeft={2}>
                <Text color={theme.error} dimColor>
                  {t.error.length > 32 ? t.error.slice(0, 31) + "…" : t.error}
                </Text>
              </Box>
            )}
          </Box>
        )
      })}

      {/* Aşağı scroll göstergesi */}
      {below > 0 && (
        <Text color={theme.textDim} dimColor>  ↓ {below} below</Text>
      )}
    </Box>
  )
}
