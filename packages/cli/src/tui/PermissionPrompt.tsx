import React, { useState } from "react"
import { Box, Text, useInput } from "ink"
import { useTheme } from "../utils/theme.js"
import type { PermissionRequest } from "@aurict/core"

type Decision = "allow" | "allow_once" | "deny" | "deny_abort" | "edit"

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

function riskLabel(level?: string): { text: string; detail: string } {
  if (level === "danger")  return { text: "DANGER", detail: "destructive or privileged action" }
  if (level === "warning") return { text: "WARNING", detail: "mutating or network-capable action" }
  if (level === "safe")    return { text: "SAFE", detail: "read-only command" }
  return                          { text: "NOTICE", detail: "confirmation required" }
}

function sandboxLabel(request: PermissionRequest): { text: string; detail: string } {
  const sandbox = request.sandbox
  if (!sandbox) return { text: "UNKNOWN", detail: "no sandbox metadata" }
  if (sandbox.backend === "policy") return { text: "POLICY", detail: sandbox.envScrubbed ? "env scrubbed" : "guarded execution" }
  if (sandbox.backend === "docker") return { text: "DOCKER", detail: "container backend requested" }
  return { text: "NONE", detail: sandbox.reason }
}

// Komut özeti — bash ise daha geniş göster
function formatPattern(pattern: string, tool: string, isDanger: boolean): string {
  // Danger'da tam göster, diğerlerinde 80 char kırp
  const maxLen = isDanger ? 200 : 80
  if (pattern.length <= maxLen) return pattern
  return pattern.slice(0, maxLen - 1) + "…"
}

// "2 hours ago" benzeri relative timestamp — kullanılabilir olursa
function _relativeTime(ms: number): string {
  const s = Math.floor((Date.now() - ms) / 1000)
  if (s < 5)   return "just now"
  if (s < 60)  return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  return `${Math.floor(s / 3600)}h ago`
}

export function PermissionPrompt({ request, onDecide }: Props) {
  const theme     = useTheme()
  const isDanger  = request.level === "danger"
  const isWarning = request.level === "warning"
  const risk      = riskLabel(request.level)
  const sandbox   = sandboxLabel(request)
  const isBashTool = request.tool === "bash" || request.tool === "shell"

  // Seçenek listesi — tehlike seviyesine göre değişir
  const options: Option[] = isDanger
    ? [
        { id: "allow_once", label: "Allow once",       hint: "allow this time (risky)",          color: theme.warning, danger: true },
        ...(isBashTool ? [{ id: "edit" as const, label: "Edit command", hint: "deny and move command to input", color: theme.accent }] : []),
        { id: "deny",       label: "Deny",              hint: "safest default, AI receives error", color: theme.success },
        { id: "deny_abort", label: "Deny & stop agent", hint: "reject and abort execution",        color: theme.error },
      ]
    : [
        { id: "allow_once", label: "Allow once",       hint: "just this time, don't remember" },
        { id: "allow",      label: "Allow for session", hint: "remember until exit" },
        ...(isBashTool ? [{ id: "edit" as const, label: "Edit command", hint: "deny and move command to input", color: theme.accent }] : []),
        { id: "deny",       label: "Deny",              hint: "reject, AI continues with error",   color: theme.error },
      ]

  // Danger = default Deny, normal = default Allow once.
  const [idx, setIdx] = useState(isDanger ? (isBashTool ? 2 : 1) : 0)

  useInput((_char, key) => {
    if (key.upArrow)   { setIdx(i => Math.max(0, i - 1)); return }
    if (key.downArrow) { setIdx(i => Math.min(options.length - 1, i + 1)); return }
    if (key.return)    { onDecide(options[idx]!.id); return }
    if (key.escape)    { onDecide("deny"); return }
  })

  // Border rengi — risk seviyesine göre
  const borderColor = isDanger  ? theme.error
                    : isWarning ? theme.warning
                    :             theme.accent

  // Risk badge rengi
  const badgeColor  = isDanger  ? theme.error
                    : isWarning ? theme.warning
                    :             theme.accent

  const displayPattern = formatPattern(request.pattern, request.tool, isDanger)
  const commandExecutables = request.command?.executables?.filter(Boolean) ?? []

  return (
    <Box flexDirection="column" borderStyle="round" borderColor={borderColor}
         paddingX={2} paddingY={1} marginY={1}>

      {/* ── Başlık satırı ────────────────────────────────────────────────────── */}
      <Box gap={2} marginBottom={1}>
        <Box gap={1}>
          <Text color={badgeColor} bold>{risk.text}</Text>
          <Text color={theme.textDim} dimColor>— permission required</Text>
        </Box>
      </Box>

      <Box flexDirection="column" marginBottom={1}>
        <Box gap={2}>
          <Text color={theme.textDim} dimColor>risk   </Text>
          <Text color={badgeColor} bold>{risk.text}</Text>
          <Text color={theme.textDim} dimColor>{risk.detail}</Text>
        </Box>
        {isBashTool && (
          <Box gap={2}>
            <Text color={theme.textDim} dimColor>sandbox</Text>
            <Text
              color={
                request.sandbox?.backend === "policy" ? theme.accent
                  : request.sandbox?.backend === "docker" ? theme.warning
                    : theme.textDim
              }
              bold={request.sandbox?.backend === "policy"}
            >
              {sandbox.text}
            </Text>
            <Text color={theme.textDim} dimColor>{sandbox.detail}</Text>
          </Box>
        )}
        {request.sandbox?.reason && request.sandbox.reason !== sandbox.detail && (
          <Box gap={2}>
            <Text color={theme.textDim} dimColor>why    </Text>
            <Text color={theme.textDim}>{request.sandbox.reason}</Text>
          </Box>
        )}
      </Box>

      {/* ── "Bu izin neden gerekli?" — vurgulu bölüm ─────────────────────────── */}
      {request.reason && (
        <Box
          borderStyle="single"
          borderColor={borderColor}
          borderTop={false} borderLeft={true} borderRight={false} borderBottom={false}
          paddingLeft={1} marginBottom={1}
        >
          <Text color={isWarning || isDanger ? badgeColor : theme.accent} wrap="wrap">
            {request.reason}
          </Text>
        </Box>
      )}

      {/* ── Tool + komut detayları ────────────────────────────────────────────── */}
      <Box flexDirection="column" gap={0} marginBottom={1} paddingLeft={2}>
        <Box gap={2}>
          <Text color={theme.textDim} dimColor>tool</Text>
          <Text color={theme.accent} bold>{request.tool}</Text>
          {request.summary && (
            <Text color={theme.textDim} dimColor>— {request.summary}</Text>
          )}
        </Box>

        <Box gap={2}>
          <Text color={theme.textDim} dimColor>cmd </Text>
          {/* bash komutları mono görünümde, danger'da kırmızı */}
          <Text
            color={isDanger ? theme.error : isWarning ? theme.warning : theme.textPrimary}
            bold={isDanger}
          >
            {isBashTool ? `$ ${displayPattern}` : displayPattern}
          </Text>
        </Box>

        {commandExecutables.length > 0 && (
          <Box gap={2}>
            <Text color={theme.textDim} dimColor>exec</Text>
            <Text color={theme.textDim}>{commandExecutables.join(", ")}</Text>
          </Box>
        )}

        {/* reason yoksa ama summary varsa buraya düş */}
        {!request.reason && request.permissionSummary && (
          <Box gap={2} marginTop={0}>
            <Text color={theme.textDim} dimColor>why </Text>
            <Text color={theme.textDim}>{request.permissionSummary}</Text>
          </Box>
        )}
      </Box>

      {/* ── Seçenekler ────────────────────────────────────────────────────────── */}
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

      {/* ── Klavye ipuçları — risk seviyesine göre değişir ────────────────────── */}
      <Box marginTop={1} paddingLeft={2}>
        <Text color={theme.textDim} dimColor>
          {isDanger
            ? "↑↓ navigate  Enter confirm  Esc deny (recommended)"
            : "↑↓ navigate  Enter confirm  Esc deny"}
        </Text>
      </Box>
    </Box>
  )
}
