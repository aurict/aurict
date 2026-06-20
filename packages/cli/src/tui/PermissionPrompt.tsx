import React, { useState } from "react"
import { Box, Text, useInput } from "ink"
import { useTheme } from "../utils/theme.js"
import type { PermissionRequest } from "@aurict/core"

type Decision = "allow" | "allow_once" | "deny" | "deny_abort"

interface Option {
  id:      Decision
  label:   string
  hint:    string
  color?:  string
  danger?: boolean
}

interface Props {
  request:  PermissionRequest
  onDecide: (d: Decision) => void
}

function riskBadge(level?: string): string {
  if (level === "danger")  return "DANGER"
  if (level === "warning") return "WARNING"
  return "NOTICE"
}

export function PermissionPrompt({ request, onDecide }: Props) {
  const theme     = useTheme()
  const isDanger  = request.level === "danger"
  const isWarning = request.level === "warning"

  // Seçenek listesi — tehlike seviyesine göre değişir
  const options: Option[] = isDanger
    ? [
        { id: "allow_once", label: "Allow once",        hint: "allow just this time",       color: theme.warning, danger: true },
        { id: "deny",       label: "Deny",               hint: "reject, AI gets error",       color: theme.success },
        { id: "deny_abort", label: "Deny & stop agent",  hint: "reject and abort execution",  color: theme.error },
      ]
    : [
        { id: "allow_once",    label: "Allow once",         hint: "just this time, don't remember" },
        { id: "allow",         label: "Allow for session",   hint: "remember until exit" },
        { id: "deny",          label: "Deny",                hint: "reject, AI continues with error", color: theme.error },
      ]

  // Tehlike = default Deny (index 1), normal = default Allow once (index 0)
  const [idx, setIdx] = useState(isDanger ? 1 : 0)

  useInput((_char, key) => {
    if (key.upArrow)   { setIdx(i => Math.max(0, i - 1)); return }
    if (key.downArrow) { setIdx(i => Math.min(options.length - 1, i + 1)); return }
    if (key.return)    { onDecide(options[idx]!.id); return }
    if (key.escape)    { onDecide("deny"); return }
  })

  // Border rengi
  const borderColor = isDanger  ? theme.error
                    : isWarning ? theme.warning
                    :             theme.accent

  // Risk rozeti rengi
  const badgeColor  = isDanger  ? theme.error
                    : isWarning ? theme.warning
                    :             theme.accent

  // Komut / pattern gösterimi
  const displayPattern = request.pattern.length > 70
    ? request.pattern.slice(0, 67) + "…"
    : request.pattern

  return (
    <Box flexDirection="column" borderStyle="round" borderColor={borderColor}
         paddingX={2} paddingY={1} marginY={1}>

      {/* Başlık */}
      <Box gap={2} marginBottom={1}>
        <Text color={badgeColor} bold>{isDanger ? "⚡" : "⚠"}</Text>
        <Text color={badgeColor} bold>{riskBadge(request.level)}</Text>
        <Text color={theme.textDim} dimColor>— permission required</Text>
      </Box>

      {/* Tool + pattern */}
      <Box flexDirection="column" gap={0} marginBottom={1} paddingLeft={2}>
        <Box gap={2}>
          <Text color={theme.textDim} dimColor>tool</Text>
          <Text color={theme.accent} bold>{request.tool}</Text>
        </Box>
        <Box gap={2}>
          <Text color={theme.textDim} dimColor>cmd </Text>
          <Text color={isDanger ? theme.error : theme.textPrimary} bold={isDanger}>
            {displayPattern}
          </Text>
        </Box>
        {request.reason && (
          <Box gap={2} marginTop={0}>
            <Text color={theme.textDim} dimColor>why </Text>
            <Text color={theme.textDim}>{request.reason}</Text>
          </Box>
        )}
      </Box>

      {/* Seçenekler */}
      <Box flexDirection="column" borderStyle="single"
           borderColor={theme.borderDim} paddingX={1} paddingY={0}
           borderTop={true} borderLeft={false} borderRight={false} borderBottom={false}>
        {options.map((opt, i) => {
          const selected = i === idx
          const color    = selected
            ? (opt.color ?? theme.accent)
            : theme.textDim

          return (
            <Box key={opt.id} gap={2} paddingY={0}>
              <Text color={selected ? (opt.color ?? theme.accent) : theme.borderBright}>
                {selected ? "▶" : " "}
              </Text>
              <Text color={color} bold={selected}>{opt.label}</Text>
              <Text color={theme.borderBright} dimColor>{opt.hint}</Text>
            </Box>
          )
        })}
      </Box>

      {/* Yardım */}
      <Box marginTop={1} paddingLeft={2}>
        <Text color={theme.textDim} dimColor>
          ↑↓ navigate  Enter confirm  Esc deny
        </Text>
      </Box>
    </Box>
  )
}
