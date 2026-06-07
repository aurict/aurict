/**
 * StatusBar — Alt durum çubuğu
 *
 * Üç katman:
 *  1. Context bar (opsiyonel) — context kullanım yüzdesi
 *  2. Skills (opsiyonel) — aktif beceriler
 *  3. Ana satır — workdir, branch, provider, model, ipuçları
 *
 * Design system primitive'leri: HStack, VStack, Surface, ContextBar, Kbd, KeyHint.
 */

import React from "react"
import { Text } from "ink"
import { useTheme } from "../utils/theme.js"
import { HStack, VStack, Surface, ContextBar, KeyHint, Spacer, Badge } from "./design-system/index.js"

interface Props {
  provider:         string
  model:            string
  tokens:           { input: number; output: number }
  contextTokens?:   number | undefined
  workdir:          string
  skills?:          string[] | undefined
  contextWindow?:   number | undefined
  isUndercover?:    boolean | undefined
  coordinatorMode?: boolean | undefined
  branch?:          string | undefined
  wasCompacted?:    boolean | undefined
  activeAgent?:     string | undefined
  agentColor?:      string | undefined
  bgTaskCount?:     number | undefined
  taskCount?:       number | undefined
  taskPanelOpen?:   boolean | undefined
  effort?:          number | undefined
}

function fmtK(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}k`
  return String(n)
}

function effortLabel(effort: number | undefined): string | null {
  if (effort === undefined) return null
  if (effort <= 4000)  return "think:low"
  if (effort <= 10000) return "think:med"
  if (effort <= 20000) return "think:high"
  return "think:max"
}

export function StatusBar({
  provider, model, tokens, contextTokens, workdir, skills = [],
  contextWindow, isUndercover, coordinatorMode, branch, wasCompacted,
  activeAgent, agentColor, bgTaskCount, taskCount, taskPanelOpen, effort,
}: Props) {
  const theme = useTheme()
  const dir   = workdir.replace(process.env["HOME"] ?? "", "~")
  const cw    = contextWindow ?? 200_000
  const ctxUsed  = contextTokens ?? 0
  const pct      = ctxUsed > 0 ? Math.min(1, ctxUsed / cw) : 0
  const barColor = pct >= 0.85 ? theme.error : pct >= 0.6 ? theme.warning : theme.success
  const cumTotal = tokens.input + tokens.output
  const thinkTag = effortLabel(effort)

  return (
    <VStack gap="none">
      {/* Context bar satırı (opsiyonel) */}
      {ctxUsed > 0 && (
        <HStack paddingX="md" gap="md">
          <Text color={theme.borderBright}>ctx</Text>
          <ContextBar used={ctxUsed} total={cw} />
          <Text color={theme.borderBright}>{fmtK(ctxUsed)} / {fmtK(cw)}</Text>
          {wasCompacted && (
            <Badge tone="warning" variant="ghost">compacted</Badge>
          )}
          {activeAgent && activeAgent !== "omni" && (
            <Badge tone="accent" variant="solid">◈ {activeAgent}</Badge>
          )}
          {bgTaskCount !== undefined && bgTaskCount > 0 && (
            <Text color={theme.warning} dimColor>⟳ {bgTaskCount} bg</Text>
          )}
        </HStack>
      )}

      {/* Skills satırı (opsiyonel) */}
      {skills.length > 0 && (
        <HStack paddingX="md" gap="xs">
          <Text color={theme.borderBright}>skills</Text>
          <Text color={theme.accent}>
            {skills.slice(0, 3).join(" · ")}
            {skills.length > 3 ? <Text color={theme.borderBright}> +{skills.length - 3} more</Text> : null}
          </Text>
        </HStack>
      )}

      {/* Ana satır — border'lı surface */}
      <Surface variant="raised" tone="muted" paddingX="md" paddingY="none">
        <HStack justify="space-between">
          <HStack gap="xs">
            <Text color={theme.accent} bold>{dir}</Text>
            {branch && <Text color={theme.borderBright}>[{branch}]</Text>}
          </HStack>
          <HStack gap="md">
            {isUndercover   && <Badge tone="muted" variant="ghost">undercover</Badge>}
            {coordinatorMode && <Badge tone="accent" variant="ghost">coordinator</Badge>}
            {cumTotal > 0 && (
              <>
                <Text color={theme.textDim}>{fmtK(cumTotal)}</Text>
                <Text color={theme.borderBright} dimColor>tok</Text>
                <Text color={theme.borderBright}>·</Text>
              </>
            )}
            {thinkTag && (
              <>
                <Text color={theme.accent} dimColor>{thinkTag}</Text>
                <Text color={theme.borderBright}>·</Text>
              </>
            )}
            <Text color={theme.textPrimary}>{provider}</Text>
            <Text color={theme.borderBright}>/</Text>
            <Text color={theme.warning}>{model}</Text>
            <Text color={theme.borderBright}>·</Text>
            {taskCount && taskCount > 0 ? (
              <HStack gap="xs">
                <Text color={theme.textDim}>/ commands</Text>
                <KeyHint keys="ctrl+t" action={`tasks (${taskCount})`} />
                <KeyHint keys="esc" action="exit" />
              </HStack>
            ) : (
              <HStack gap="xs">
                <Text color={theme.textDim}>/ commands</Text>
                <KeyHint keys="esc" action="exit" />
                <KeyHint keys="ctrl+c" action="abort" />
              </HStack>
            )}
          </HStack>
        </HStack>
      </Surface>
    </VStack>
  )
}
