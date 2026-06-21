/**
 * StatusBar — Alt durum çubuğu
 *
 * Dört kırılım noktası (cols prop):
 *  tiny   < 60  — sadece provider/model
 *  compact 60–89 — kısa dir + kısa model, token/hint yok
 *  normal 90–119 — dir truncated, token var, hint yok
 *  wide  ≥ 120  — tam görünüm
 */

import React from "react"
import { Text } from "ink"
import type { TokenBreakdown } from "@aurict/core"
import { useTheme } from "../utils/theme.js"
import { HStack, VStack, Surface, ContextBar, KeyHint, Badge, useSpinnerFrame } from "./design-system/index.js"

interface Props {
  provider:          string
  model:             string
  tokens:            TokenBreakdown
  contextTokens?:    number | undefined
  workdir:           string
  skills?:           string[] | undefined
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
  localServer?:      { enabled: boolean; port?: number; started: boolean; reused: boolean } | undefined
  sandboxBackend?:   "none" | "policy" | "docker" | undefined
  effort?:           number | undefined
  autopilotMode?:    boolean | undefined
  cols?:             number | undefined
  draftSavedAt?:     number | undefined
  activeAgentCount?: number | undefined
  hasBtwNote?:       boolean | undefined
}

function fmtK(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}k`
  return String(n)
}

function effortLabel(effort: number | undefined): string | null {
  if (effort === undefined) return null
  if (effort <= 4000)  return "lo"
  if (effort <= 10000) return "med"
  if (effort <= 20000) return "hi"
  return "max"
}

function shortModel(model: string): string {
  // claude-sonnet-4-6 → sonnet-4-6   claude-opus-4-5-20251001 → opus-4-5
  const m = model.replace(/^claude-/, "").replace(/-\d{8}$/, "")
  return m.length <= 14 ? m : m.slice(0, 14)
}

function truncDir(dir: string, maxLen: number): string {
  if (dir.length <= maxLen) return dir
  const parts = dir.split("/").filter(Boolean)
  const last  = parts[parts.length - 1] ?? ""
  const second = parts[parts.length - 2]
  if (second) return `…/${second}/${last}`
  return `…/${last}`
}

function taskLabel(summary: Props["taskSummary"], fallbackCount: number | undefined): string | null {
  const total = fallbackCount ?? (
    summary ? summary.pending + summary.inProgress + summary.done + summary.error : 0
  )
  if (!total) return null
  if (!summary) return `${total}`
  const parts: string[] = []
  if (summary.inProgress > 0) parts.push(`${summary.inProgress} run`)
  if (summary.pending > 0) parts.push(`${summary.pending} wait`)
  if (summary.error > 0) parts.push(`${summary.error} err`)
  if (parts.length === 0) parts.push(`${summary.done}/${total} done`)
  return parts.join(" ")
}

function serverLabel(server: Props["localServer"], compact = false): string | null {
  if (!server) return null
  if (!server.enabled) return compact ? "api:off" : "api off"
  if (server.started) return server.port ? (compact ? `api:${server.port}` : `api ${server.port}`) : (compact ? "api:on" : "api on")
  if (server.reused) return compact ? "api:used" : server.port ? `api ${server.port} used` : "api used"
  return null
}

function sandboxLabel(backend: Props["sandboxBackend"], compact = false): string | null {
  if (!backend) return null
  if (compact) {
    if (backend === "policy") return "sbx:pol"
    if (backend === "docker") return "sbx:doc"
    return "sbx:off"
  }
  if (backend === "none") return "sbx none"
  return `sbx ${backend}`
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
  provider, model, tokens, contextTokens, workdir, skills = [],
  contextWindow, isUndercover, coordinatorMode, branch, wasCompacted,
  activeAgent, agentColor, bgTaskCount, taskCount, taskSummary, taskPanelOpen, localServer, sandboxBackend, effort, autopilotMode, cols,
  draftSavedAt, activeAgentCount, hasBtwNote,
}: Props) {
  const theme       = useTheme()
  const mode        = bp(cols)
  const spinFrame   = useSpinnerFrame("dots")  // animasyonlu spinner frame
  const dir      = workdir.replace(process.env["HOME"] ?? "", "~")
  const cw           = contextWindow ?? 200_000
  const ctxUsed      = contextTokens ?? 0
  const pct          = ctxUsed > 0 ? Math.min(1, ctxUsed / cw) : 0
  const cumTotal     = tokens.input + tokens.output
  const thinkTag     = effortLabel(effort)
  const draftFresh   = draftSavedAt !== undefined && Date.now() - draftSavedAt < 3_000
  const taskInfo     = taskLabel(taskSummary, taskCount)
  const compactRuntime = mode !== "wide"
  const serverInfo   = serverLabel(localServer, compactRuntime)
  const sandboxInfo  = sandboxLabel(sandboxBackend, compactRuntime)

  // ── tiny: bare minimum ────────────────────────────────────────────────────
  if (mode === "tiny") {
    return (
      <Surface variant="raised" tone="muted" paddingX="md" paddingY="none">
        <HStack gap="none">
          <Text color={theme.textPrimary}>{provider.slice(0, 5)}</Text>
          <Text color={theme.borderBright}>/</Text>
          <Text color={theme.warning}>{shortModel(model)}</Text>
        </HStack>
      </Surface>
    )
  }

  // ── compact: short dir, short model, no tokens, no hints ─────────────────
  if (mode === "compact") {
    const shortDir = truncDir(dir, 20)
    return (
      <VStack gap="none">
        {ctxUsed > 0 && (
          <HStack paddingX="md" gap="sm">
            <Text color={theme.borderBright}>ctx</Text>
            <Text color={pct >= 0.85 ? theme.error : pct >= 0.6 ? theme.warning : theme.success}>
              {Math.round(pct * 100)}%
            </Text>
            {wasCompacted && <Text color={theme.warning} dimColor>cmpct</Text>}
          </HStack>
        )}
        <Surface variant="raised" tone="muted" paddingX="md" paddingY="none">
          <HStack justify="space-between">
            <Text color={theme.accent} bold>{shortDir}</Text>
            <HStack gap="xs">
              {coordinatorMode && <Text color={theme.accent} dimColor>coord</Text>}
              {autopilotMode   && <Text color={theme.warning}>⚡</Text>}
              {sandboxInfo     && <Text color={sandboxBackend === "none" ? theme.warning : theme.accent}>{sandboxInfo}</Text>}
              <Text color={theme.textPrimary}>{provider.slice(0, 6)}</Text>
              <Text color={theme.borderBright}>/</Text>
              <Text color={theme.warning}>{shortModel(model)}</Text>
            </HStack>
          </HStack>
        </Surface>
      </VStack>
    )
  }

  // ── normal: truncated dir, tokens shown, hints hidden ────────────────────
  if (mode === "normal") {
    const normDir = truncDir(dir, 28)
    return (
      <VStack gap="none">
        {ctxUsed > 0 && (
          <HStack paddingX="md" gap="md">
            <Text color={theme.borderBright}>ctx</Text>
            <ContextBar used={ctxUsed} total={cw} />
            <Text color={theme.borderBright}>{fmtK(ctxUsed)}/{fmtK(cw)}</Text>
            {wasCompacted && <Badge tone="warning" variant="ghost">cmpct</Badge>}
          </HStack>
        )}
        <Surface variant="raised" tone="muted" paddingX="md" paddingY="none">
          <HStack justify="space-between">
            <HStack gap="xs">
              <Text color={theme.accent} bold>{normDir}</Text>
              {branch && <Text color={theme.borderBright}>[{branch}]</Text>}
            </HStack>
            <HStack gap="sm">
              {isUndercover    && <Text color={theme.textDim} dimColor>uc</Text>}
              {coordinatorMode && <Badge tone="accent" variant="ghost">coord</Badge>}
              {autopilotMode   && <Badge tone="warning" variant="solid">⚡ auto</Badge>}
              {draftFresh      && <Text color={theme.success} dimColor>✓ saved</Text>}
              {hasBtwNote      && <Badge tone="accent" variant="ghost">📌</Badge>}
              {sandboxInfo      && <Text color={sandboxBackend === "none" ? theme.warning : theme.accent}>{sandboxInfo}</Text>}
              {serverInfo       && <Text color={localServer?.reused || localServer?.enabled === false ? theme.warning : theme.textDim}>{serverInfo}</Text>}
              {taskInfo && (
                <Text color={taskPanelOpen ? theme.accent : theme.textDim}>{taskPanelOpen ? "tasks open" : `tasks ${taskInfo}`}</Text>
              )}
              {activeAgentCount !== undefined && activeAgentCount > 0 && (
                <Text color={theme.warning}>{spinFrame} {activeAgentCount}</Text>
              )}
              {cumTotal > 0    && <Text color={theme.textDim}>{fmtK(cumTotal)}tok</Text>}
              {thinkTag        && <Text color={theme.accent} dimColor>{thinkTag}</Text>}
              <Text color={theme.textPrimary}>{provider}</Text>
              <Text color={theme.borderBright}>/</Text>
              <Text color={theme.warning}>{shortModel(model)}</Text>
              <Text color={theme.textDim} dimColor>  /cmd</Text>
            </HStack>
          </HStack>
        </Surface>
      </VStack>
    )
  }

  // ── wide: full display ────────────────────────────────────────────────────
  return (
    <VStack gap="none">
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

      {skills.length > 0 && (
        <HStack paddingX="md" gap="xs">
          <Text color={theme.borderBright}>skills</Text>
          <Text color={theme.accent}>
            {skills.slice(0, 3).join(" · ")}
            {skills.length > 3 ? <Text color={theme.borderBright}> +{skills.length - 3} more</Text> : null}
          </Text>
        </HStack>
      )}

      <Surface variant="raised" tone="muted" paddingX="md" paddingY="none">
        <HStack justify="space-between">
          <HStack gap="xs">
            <Text color={theme.accent} bold>{truncDir(dir, 40)}</Text>
            {branch && <Text color={theme.borderBright}>[{branch}]</Text>}
          </HStack>
          <HStack gap="md">
            {isUndercover    && <Badge tone="muted"    variant="ghost">undercover</Badge>}
            {coordinatorMode && <Badge tone="accent"   variant="ghost">coordinator</Badge>}
            {autopilotMode   && <Badge tone="warning"  variant="solid">⚡ auto</Badge>}
            {draftFresh      && <Text color={theme.success} dimColor>✓ saved</Text>}
            {hasBtwNote      && <Badge tone="accent" variant="ghost">📌 note</Badge>}
            {sandboxInfo && (
              <>
                <Badge tone={sandboxBackend === "none" ? "warning" : "accent"} variant="ghost">{sandboxInfo}</Badge>
                <Text color={theme.borderBright}>·</Text>
              </>
            )}
            {serverInfo && (
              <>
                <Badge tone={localServer?.reused || localServer?.enabled === false ? "warning" : "muted"} variant="ghost">{serverInfo}</Badge>
                <Text color={theme.borderBright}>·</Text>
              </>
            )}
            {taskInfo && (
              <>
                <Badge tone={taskPanelOpen ? "accent" : "muted"} variant="ghost">
                  {`tasks ${taskInfo}`}
                </Badge>
                <Text color={theme.borderBright}>·</Text>
              </>
            )}
            {activeAgentCount !== undefined && activeAgentCount > 0 && (
              <>
                <Badge tone="warning" variant="ghost">
                  {spinFrame} {activeAgentCount} agent{activeAgentCount > 1 ? "s" : ""}
                </Badge>
                <Text color={theme.borderBright} dimColor>ctrl+x</Text>
                <Text color={theme.borderBright}>·</Text>
              </>
            )}
            {cumTotal > 0 && (
              <>
                <Text color={theme.textDim}>{fmtK(cumTotal)}</Text>
                <Text color={theme.borderBright} dimColor>tok</Text>
                <Text color={theme.borderBright}>·</Text>
              </>
            )}
            {thinkTag && (
              <>
                <Text color={theme.accent} dimColor>think:{thinkTag}</Text>
                <Text color={theme.borderBright}>·</Text>
              </>
            )}
            <Text color={theme.textPrimary}>{provider}</Text>
            <Text color={theme.borderBright}>/</Text>
            <Text color={theme.warning}>{model}</Text>
            <Text color={theme.borderBright}>·</Text>
            {taskCount && taskCount > 0 ? (
              <HStack gap="xs">
                <Text color={theme.textDim} dimColor>/ commands</Text>
                <KeyHint keys="ctrl+t" action={`tasks (${taskCount})`} />
                <KeyHint keys="esc" action="exit" />
              </HStack>
            ) : (
              <HStack gap="xs">
                <Text color={theme.textDim} dimColor>/ commands</Text>
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
