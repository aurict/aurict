import React from "react"
import { Text } from "ink"
import type { TokenBreakdown } from "@aurict/core"
import { useTheme } from "../utils/theme.js"
import { HStack, Surface } from "./design-system/index.js"

interface Props {
  provider:          string
  model:             string
  tokens:            TokenBreakdown
  contextTokens?:    number | undefined
  workdir:           string
  skills?:           string[] | undefined
  turnSkills?:       string[] | undefined
  contextWindow?:    number | undefined
  isUndercover?:     boolean | undefined
  coordinatorMode?:  boolean | undefined
  branch?:           string | undefined
  wasCompacted?:     boolean | undefined
  activeAgent?:      string | undefined
  agentColor?:       string | undefined
  bgTaskCount?:      number | undefined
  taskCount?:        number | undefined
  taskSummary?:      { pending: number; inProgress: number; done: number; error: number } | undefined
  taskPanelOpen?:    boolean | undefined
  localServer?:      { enabled: boolean; port?: number; started: boolean; reused: boolean; reason?: string } | undefined
  sandboxBackend?:   "none" | "policy" | "docker" | undefined
  effort?:           number | undefined
  autopilotMode?:    boolean | undefined
  cols?:             number | undefined
  draftSavedAt?:     number | undefined
  activeAgentCount?: number | undefined
  hasBtwNote?:       boolean | undefined
  scrollLocked?:     boolean | undefined
}

function fmtK(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}k`
  return String(n)
}

function shortModel(model: string): string {
  return model.replace(/^claude-/, "").replace(/-\d{8}$/, "").slice(0, 16)
}

function truncDir(dir: string, maxLen: number): string {
  if (dir.length <= maxLen) return dir
  const parts = dir.split("/").filter(Boolean)
  const last   = parts[parts.length - 1] ?? ""
  const second = parts[parts.length - 2]
  if (second) return `…/${second}/${last}`
  return `…/${last}`
}

type BP = "tiny" | "compact" | "normal" | "wide"
function bp(cols: number | undefined): BP {
  const c = cols ?? 120
  if (c < 60)  return "tiny"
  if (c < 90)  return "compact"
  if (c < 120) return "normal"
  return "wide"
}

export function StatusBar({
  model, tokens, contextTokens, workdir, contextWindow,
  coordinatorMode, branch, wasCompacted, cols, scrollLocked,
}: Props) {
  const theme   = useTheme()
  const mode    = bp(cols)
  const dir     = workdir.replace(process.env["HOME"] ?? "", "~")
  const cw      = contextWindow ?? 200_000
  const ctxUsed = contextTokens ?? 0
  const pct     = ctxUsed > 0 ? Math.min(1, ctxUsed / cw) : 0
  const pctStr  = ctxUsed > 0 ? `${Math.round(pct * 100)}%` : null
  const ctxColor = pct >= 0.85 ? theme.error : pct >= 0.6 ? theme.warning : theme.success
  const cumTotal = tokens.input + tokens.output
  const sm       = shortModel(model)

  if (mode === "tiny") {
    return (
      <Surface variant="flat" tone="muted" paddingX="md" paddingY="none">
        <Text color={theme.warning}>{sm}</Text>
      </Surface>
    )
  }

  if (mode === "compact") {
    return (
      <Surface variant="flat" tone="muted" paddingX="md" paddingY="none">
        <HStack justify="space-between">
          <Text color={theme.accent} bold>{truncDir(dir, 20)}</Text>
          <HStack gap="sm">
            {scrollLocked && <Text color={theme.warning}>⏸</Text>}
            <Text color={theme.warning}>{sm}</Text>
            {pctStr && (
              <>
                <Text color={theme.borderBright}>·</Text>
                <Text color={ctxColor}>{pctStr}</Text>
              </>
            )}
          </HStack>
        </HStack>
      </Surface>
    )
  }

  const dirStr = mode === "normal" ? truncDir(dir, 28) : truncDir(dir, 40)

  return (
    <Surface variant="flat" tone="muted" paddingX="md" paddingY="none">
      <HStack justify="space-between">
        <HStack gap="xs">
          <Text color={theme.accent} bold>{dirStr}</Text>
          {branch && <Text color={theme.borderBright}>[{branch}]</Text>}
          {coordinatorMode && <Text color={theme.accent} dimColor> coord</Text>}
        </HStack>
        <HStack gap="sm">
          {scrollLocked  && <Text color={theme.warning}>⏸</Text>}
          {wasCompacted  && <Text color={theme.warning} dimColor>cmpct</Text>}
          <Text color={theme.warning}>{sm}</Text>
          {pctStr && (
            <>
              <Text color={theme.borderBright}>·</Text>
              <Text color={ctxColor}>ctx {pctStr}</Text>
            </>
          )}
          {cumTotal > 0 && (
            <>
              <Text color={theme.borderBright}>·</Text>
              <Text color={theme.textDim}>{fmtK(cumTotal)}tok</Text>
            </>
          )}
          {mode === "wide"
            ? (
              <>
                <Text color={theme.borderBright}>·</Text>
                <Text color={theme.textDim} dimColor>/cmd</Text>
                <Text color={theme.textDim} dimColor>Esc</Text>
                <Text color={theme.textDim} dimColor>Ctrl+C</Text>
              </>
            )
            : <Text color={theme.textDim} dimColor>  /cmd Esc</Text>
          }
        </HStack>
      </HStack>
    </Surface>
  )
}
