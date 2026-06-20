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
  })

  const shown    = tasks.slice(offset, offset + PAGE_SIZE)
  const above    = offset
  const below    = Math.max(0, tasks.length - offset - PAGE_SIZE)
  const allDone  = tasks.length > 0 && tasks.every(t => t.status === "done" || t.status === "error")

  return (
    <Box
      width={32}
      flexDirection="column"
      flexShrink={0}
      borderStyle="single"
      borderColor={theme.borderDim}
      paddingX={1}
    >
      {/* Başlık */}
      <Box justifyContent="space-between" marginBottom={1}>
        <Text color={theme.textSecondary} bold>Tasks ({tasks.length})</Text>
        <Text color={theme.textDim} dimColor>Esc · ↑↓</Text>
      </Box>

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
        const label = t.subject.length > 24 ? t.subject.slice(0, 23) + "…" : t.subject
        return (
          <Box key={t.id} gap={1} marginBottom={0}>
            <Text color={STATUS_COLOR[t.status]}>{STATUS_ICON[t.status]}</Text>
            <Text
              color={t.status === "done" ? theme.textDim : theme.textPrimary}
              strikethrough={t.status === "done"}
            >
              {label}
            </Text>
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
