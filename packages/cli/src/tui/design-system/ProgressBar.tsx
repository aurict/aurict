/**
 * Design System — ProgressBar
 *
 * Multiple progress indicator types: linear, segmented, circular, indeterminate.
 *
 * Usage:
 *   <ProgressBar value={50} max={100} variant="linear" />
 *   <ProgressBar value={3} max={10} variant="segmented" />
 *   <ProgressBar value={0.42} variant="linear" indeterminate />
 */

import React from "react"
import { Box, Text } from "ink"
import { useTheme } from "../../utils/theme.js"

// ── Types ────────────────────────────────────────────────────────────────────

export type ProgressVariant = "linear" | "segmented" | "circular" | "stippled"

export interface ProgressBarProps {
  /** A value between 0-max, either a number or a ratio (0-1) */
  value?:    number
  max?:      number
  /** Visual width (for linear/stippled) */
  width?:    number
  variant?:  ProgressVariant
  /** Show the label (e.g. "52%") */
  showLabel?: boolean
  /** Animated indeterminate */
  indeterminate?: boolean
  /** Color tone */
  tone?:     "accent" | "success" | "warning" | "error"
  /** Label formatter */
  formatLabel?: (value: number, max: number) => string
}

const FRAMES_INDETERMINATE = [
  "▓▓▓▓▓░░░░░",
  "░▓▓▓▓▓░░░░",
  "░░▓▓▓▓▓░░░",
  "░░░▓▓▓▓▓░░",
  "░░░░▓▓▓▓▓░",
  "░░░░░▓▓▓▓▓",
  "▓░░░░▓▓▓▓░",
  "▓▓░░░░▓▓▓░",
  "▓▓▓░░░░▓▓░",
  "▓▓▓▓░░░░▓░",
]

// ── Linear bar ────────────────────────────────────────────────────────────────

function LinearBar({ value, max, width, showLabel, tone, indeterminate, formatLabel }: ProgressBarProps) {
  const theme = useTheme()
  const w = width ?? 20
  const m = max ?? 100
  const pct = m > 0 ? Math.min(1, Math.max(0, value ?? 0) / m) : 0
  const color =
    tone === "success" ? theme.success :
    tone === "warning" ? theme.warning :
    tone === "error"   ? theme.error   :
    theme.accent

  if (indeterminate) {
    // Simple staggered display (fixed pattern, no state)
    return (
      <Box>
        <Text color={color}>{FRAMES_INDETERMINATE[0]}</Text>
        {showLabel && <Text color={theme.textDim}> loading…</Text>}
      </Box>
    )
  }

  const filled = Math.round(pct * w)
  const empty  = w - filled
  const bar    = "▓".repeat(filled) + "░".repeat(empty)
  const label  = formatLabel ? formatLabel(value ?? 0, m) : `${Math.round(pct * 100)}%`

  return (
    <Box>
      <Text color={color}>{bar}</Text>
      {showLabel && (
        <>
          <Text> </Text>
          <Text color={theme.textDim}>{label}</Text>
        </>
      )}
    </Box>
  )
}

// ── Segmented bar ─────────────────────────────────────────────────────────────

function SegmentedBar({ value, max, showLabel, tone, formatLabel }: ProgressBarProps) {
  const theme = useTheme()
  const segments = 10
  const m = max ?? segments
  const pct = m > 0 ? Math.min(1, Math.max(0, value ?? 0) / m) : 0
  const filled = Math.round(pct * segments)
  const color =
    tone === "success" ? theme.success :
    tone === "warning" ? theme.warning :
    tone === "error"   ? theme.error   :
    theme.accent
  const segs: string[] = []
  for (let i = 0; i < segments; i++) {
    segs.push(i < filled ? "●" : "○")
  }
  const label = formatLabel ? formatLabel(value ?? 0, m) : `${Math.round(pct * 100)}%`

  return (
    <Box>
      <Text color={color}>{segs.join(" ")}</Text>
      {showLabel && (
        <>
          <Text> </Text>
          <Text color={theme.textDim}>{label}</Text>
        </>
      )}
    </Box>
  )
}

// ── Circular bar (spinner-like) ───────────────────────────────────────────────

function CircularBar({ value, max, showLabel, tone, formatLabel }: ProgressBarProps) {
  const theme = useTheme()
  const m = max ?? 100
  const pct = m > 0 ? Math.min(1, Math.max(0, value ?? 0) / m) : 0
  const color =
    tone === "success" ? theme.success :
    tone === "warning" ? theme.warning :
    tone === "error"   ? theme.error   :
    theme.accent

  // 8-segment circular display
  const filled = Math.round(pct * 8)
  const FRAMES_CIRCULAR = ["○","◔","◑","◕","●","◕","◑","◔"]
  const frame = FRAMES_CIRCULAR[filled] ?? "○"
  const label = formatLabel ? formatLabel(value ?? 0, m) : `${Math.round(pct * 100)}%`

  return (
    <Box>
      <Text color={color}>{frame}</Text>
      {showLabel && (
        <>
          <Text> </Text>
          <Text color={theme.textDim}>{label}</Text>
        </>
      )}
    </Box>
  )
}

// ── Stippled bar (alternative style) ───────────────────────────────────────────

function StippledBar({ value, max, width, showLabel, tone, formatLabel }: ProgressBarProps) {
  const theme = useTheme()
  const w = width ?? 20
  const m = max ?? 100
  const pct = m > 0 ? Math.min(1, Math.max(0, value ?? 0) / m) : 0
  const color =
    tone === "success" ? theme.success :
    tone === "warning" ? theme.warning :
    tone === "error"   ? theme.error   :
    theme.accent

  const filled = Math.round(pct * w)
  const empty  = w - filled
  const bar    = "▪".repeat(filled) + "▫".repeat(empty)
  const label  = formatLabel ? formatLabel(value ?? 0, m) : `${Math.round(pct * 100)}%`

  return (
    <Box>
      <Text color={color}>{bar}</Text>
      {showLabel && (
        <>
          <Text> </Text>
          <Text color={theme.textDim}>{label}</Text>
        </>
      )}
    </Box>
  )
}

// ── Main component ───────────────────────────────────────────────────────────────

export function ProgressBar(props: ProgressBarProps) {
  const v = props.variant ?? "linear"
  switch (v) {
    case "segmented": return <SegmentedBar {...props} />
    case "circular":  return <CircularBar {...props} />
    case "stippled":  return <StippledBar {...props} />
    case "linear":
    default:          return <LinearBar {...props} />
  }
}

// ── Specialized context bar (backwards compatibility) ────────────────────────────────

export function ContextBar({ used, total }: { used: number; total: number }) {
  const pct = Math.min(1, used / total)
  const tone =
    pct >= 0.85 ? "error" :
    pct >= 0.6  ? "warning" :
    "success"
  return (
    <ProgressBar
      value={used}
      max={total}
      width={10}
      variant="linear"
      showLabel
      tone={tone}
    />
  )
}
