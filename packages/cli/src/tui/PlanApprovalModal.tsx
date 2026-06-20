import React, { useState } from "react"
import { Box, Text, useInput } from "ink"
import { useTheme } from "../utils/theme.js"
import { Typo, HStack, VStack } from "./design-system/index.js"
import type { PlanRequest, PlanStep } from "@aurict/core"

interface Props {
  request: PlanRequest
  onDecide: (approvedSteps: number[] | null) => void  // null = reject all
}

export function PlanApprovalModal({ request, onDecide }: Props) {
  const theme = useTheme()
  const [steps, setSteps] = useState<PlanStep[]>(request.steps.map(s => ({ ...s, approved: true })))
  const [cursor, setCursor] = useState(0)
  const [mode, setMode]  = useState<"review" | "confirm">("review")

  const approvedCount = steps.filter(s => s.approved).length

  useInput((input, key) => {
    if (mode === "review") {
      if (key.upArrow)   { setCursor(c => Math.max(0, c - 1)); return }
      if (key.downArrow) { setCursor(c => Math.min(steps.length - 1, c + 1)); return }

      // Toggle current step
      if (input === " ") {
        setSteps(prev => prev.map((s, i) => i === cursor ? { ...s, approved: !s.approved } : s))
        return
      }

      // Approve all
      if (input === "a" || input === "A") {
        setSteps(prev => prev.map(s => ({ ...s, approved: true })))
        return
      }
      // Reject all
      if (input === "r" || input === "R") {
        setSteps(prev => prev.map(s => ({ ...s, approved: false })))
        return
      }

      // Confirm (Enter)
      if (key.return) {
        if (approvedCount === 0) { onDecide(null); return }
        setMode("confirm")
        return
      }

      // Reject all (Esc)
      if (key.escape) { onDecide(null); return }
      return
    }

    if (mode === "confirm") {
      if (key.escape) { setMode("review"); return }
      if (key.return || input === "y" || input === "Y") {
        onDecide(steps.filter(s => s.approved).map(s => s.index))
        return
      }
      if (input === "n" || input === "N") { onDecide(null); return }
    }
  })

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={theme.accent}
      paddingX={1}
      marginBottom={1}
    >
      {/* Header */}
      <HStack gap="xs" marginBottom="xs">
        <Text color={theme.accent} bold>⬡ Plan Approval</Text>
        <Text color={theme.textDim} dimColor>—</Text>
        <Text color={theme.textPrimary} bold>{request.title}</Text>
      </HStack>

      {request.description && (
        <Text color={theme.textSecondary} wrap="wrap">{request.description}</Text>
      )}

      <Text color={theme.borderDim}>{"─".repeat(60)}</Text>

      {/* Steps */}
      <VStack gap="none">
        {steps.map((step, i) => {
          const selected = i === cursor
          return (
            <Box key={i} gap={1}>
              <Text color={selected ? theme.accent : theme.textDim}>
                {selected ? "▶" : " "}
              </Text>
              <Text color={step.approved ? theme.success : theme.error}>
                {step.approved ? "✓" : "✗"}
              </Text>
              <Text
                color={step.approved ? (selected ? theme.textPrimary : theme.textSecondary) : theme.textDim}
                strikethrough={!step.approved}
              >
                {i + 1}. {step.text}
              </Text>
            </Box>
          )
        })}
      </VStack>

      <Text color={theme.borderDim}>{"─".repeat(60)}</Text>

      {/* Footer */}
      {mode === "review" && (
        <HStack gap="md">
          <Text color={theme.textDim} dimColor>Space toggle</Text>
          <Text color={theme.textDim} dimColor>A approve all</Text>
          <Text color={theme.textDim} dimColor>R reject all</Text>
          <Text color={theme.success}>Enter confirm ({approvedCount}/{steps.length})</Text>
          <Text color={theme.error} dimColor>Esc reject</Text>
        </HStack>
      )}

      {mode === "confirm" && (
        <HStack gap="md">
          <Text color={theme.warning}>Proceed with {approvedCount} step{approvedCount !== 1 ? "s" : ""}?</Text>
          <Text color={theme.success}>Y confirm</Text>
          <Text color={theme.error}>N cancel</Text>
          <Text color={theme.textDim} dimColor>Esc back</Text>
        </HStack>
      )}
    </Box>
  )
}
