/**
 * Design System — Layout primitives
 *
 * Consistent, semantic layout components. Built on top of Ink's Box.
 * - HStack/VStack: horizontal/vertical stack
 * - Center: centers content
 * - Spacer: flexible spacing
 * - Cluster: inline group (with wrap)
 *
 * All components are theme-matched and density-aware.
 *
 * Note: Ink 5.2.1's BoxProps type doesn't include `backgroundColor` (though
 * it works at render time). `DesignBoxProps` (`./types`) fills this gap.
 */

import React from "react"
import { Box, Text } from "ink"
import { useTheme } from "../../utils/theme.js"
import { useTerminalSize } from "../TerminalSizeContext.js"
import type { DesignBoxProps } from "./types.js"

// ── Spacing scale ──────────────────────────────────────────────────────────────
// "none" = 0, "xs" = 0, "sm" = 1, "md" = 2, "lg" = 3, "xl" = 4
// (Ink gap values; the same scale is used for padding)

export type Spacing = "none" | "xs" | "sm" | "md" | "lg" | "xl" | number

const SPACING_MAP: Record<string, number> = {
  none: 0,
  xs: 0,
  sm: 1,
  md: 2,
  lg: 3,
  xl: 4,
}

export function spacingValue(s: Spacing | undefined): number {
  if (s === undefined) return 0
  if (typeof s === "number") return s
  return SPACING_MAP[s] ?? 0
}

// ── Common omit list ─────────────────────────────────────────────────────────
// Properties we drop from BoxProps for all stack variants.
// We override padding/margin/gap with the Spacing type; backgroundColor
// isn't in Ink but is in DesignBoxProps — we pass it through as-is.

type StackOmit =
  | "flexDirection"
  | "alignItems"
  | "justifyContent"
  | "padding" | "paddingX" | "paddingY"
  | "paddingTop" | "paddingBottom" | "paddingLeft" | "paddingRight"
  | "margin" | "marginX" | "marginY"
  | "marginTop" | "marginBottom" | "marginLeft" | "marginRight"
  | "gap"

// ── Spacing type definition for all spacing-aware props ─────────────────────

interface SpacingBoxExtras {
  padding?:     Spacing
  paddingX?:    Spacing
  paddingY?:    Spacing
  paddingTop?:  Spacing
  paddingBottom?: Spacing
  paddingLeft?: Spacing
  paddingRight?: Spacing
  margin?:      Spacing
  marginX?:     Spacing
  marginY?:     Spacing
  marginTop?:   Spacing
  marginBottom?: Spacing
  marginLeft?:  Spacing
  marginRight?: Spacing
  gap?:         Spacing
}

// ── All keys that accept Spacing ────────────────────────────────────────
// (for the resolveSpacing helper)

const SPACING_KEYS: readonly (keyof SpacingBoxExtras)[] = [
  "padding", "paddingX", "paddingY",
  "paddingTop", "paddingBottom", "paddingLeft", "paddingRight",
  "margin", "marginX", "marginY",
  "marginTop", "marginBottom", "marginLeft", "marginRight",
  "gap",
]

/**
 * Splits a rest object into Spacing-aware (converted to numbers) props and
 * the remaining Ink props. Ink's Box expects `margin/padding/gap` as
 * `number`; we accept `Spacing` and resolve it here.
 */
function splitSpacing(rest: Record<string, unknown>): { spacing: Record<string, number>; inkRest: Record<string, unknown> } {
  const spacing: Record<string, number> = {}
  const inkRest: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(rest)) {
    if ((SPACING_KEYS as readonly string[]).includes(k)) {
      if (v !== undefined) spacing[k] = spacingValue(v as Spacing)
    } else {
      inkRest[k] = v
    }
  }
  return { spacing, inkRest }
}

// ── HStack ────────────────────────────────────────────────────────────────────
// Horizontal stack: left to right, with optional gap, align, justify.

export interface HStackProps extends Omit<DesignBoxProps, StackOmit>, SpacingBoxExtras {
  align?:    "flex-start" | "center" | "flex-end" | "stretch"
  justify?:  "flex-start" | "center" | "flex-end" | "space-between" | "space-around" | "space-evenly"
  wrap?:     boolean
}

export function HStack({ align, justify, wrap, children, ...rest }: HStackProps) {
  const { spacing, inkRest } = splitSpacing(rest as Record<string, unknown>)
  return (
    <Box
      flexDirection="row"
      flexWrap={wrap ? "wrap" : undefined}
      {...(align !== undefined ? { alignItems: align } : {})}
      {...(justify !== undefined ? { justifyContent: justify } : {})}
      {...spacing}
      {...inkRest}
    >
      {children}
    </Box>
  )
}

// ── VStack ────────────────────────────────────────────────────────────────────
// Vertical stack: top to bottom.

export interface VStackProps extends Omit<DesignBoxProps, StackOmit>, SpacingBoxExtras {
  align?:    "flex-start" | "center" | "flex-end" | "stretch"
  justify?:  "flex-start" | "center" | "flex-end" | "space-between" | "space-around"
}

export function VStack({ align, justify, children, ...rest }: VStackProps) {
  const { spacing, inkRest } = splitSpacing(rest as Record<string, unknown>)
  return (
    <Box
      flexDirection="column"
      {...(align !== undefined ? { alignItems: align } : {})}
      {...(justify !== undefined ? { justifyContent: justify } : {})}
      {...spacing}
      {...inkRest}
    >
      {children}
    </Box>
  )
}

// ── Spacer ────────────────────────────────────────────────────────────────────
// Flexible spacing. Pushes other elements apart via flexGrow=1.
// Usage: <HStack><Text>left</Text><Spacer /><Text>right</Text></HStack>

export function Spacer({ minSize = 1 }: { minSize?: number }) {
  return <Box flexGrow={1} flexShrink={0} minWidth={minSize} />
}

export function VSpacer({ minSize = 1 }: { minSize?: number }) {
  return <Box flexGrow={1} flexShrink={0} minHeight={minSize} />
}

// ── Center ────────────────────────────────────────────────────────────────────
// Centers content both horizontally and vertically.

export interface CenterProps extends Omit<DesignBoxProps, "alignItems" | "justifyContent"> {
  minHeight?: number | string
  /** Ink 8 accepts only a column count here. */
  minWidth?:  number
}

export function Center({ minHeight, minWidth, children, ...rest }: CenterProps) {
  return (
    <Box
      alignItems="center"
      justifyContent="center"
      {...(minHeight !== undefined ? { minHeight } : {})}
      {...(minWidth !== undefined ? { minWidth } : {})}
      {...rest}
    >
      {children}
    </Box>
  )
}

// ── Cluster ───────────────────────────────────────────────────────────────────
// Inline group with wrap — for many small elements (tag/badge lists).
// You must provide a wrap threshold; it isn't computed automatically
// (terminal width isn't known at render time).

export interface ClusterProps {
  children:  React.ReactNode
  gap?:      Spacing
  align?:    "flex-start" | "center" | "flex-end"
  paddingX?: Spacing
  paddingY?: Spacing
  flexGrow?: number
}

export function Cluster({ children, gap = "sm", align = "center", paddingX, paddingY, flexGrow }: ClusterProps) {
  return (
    <Box
      flexDirection="row"
      flexWrap="wrap"
      {...(align !== undefined ? { alignItems: align } : {})}
      {...(flexGrow !== undefined ? { flexGrow } : {})}
      {...(paddingX !== undefined ? { paddingX: spacingValue(paddingX) } : {})}
      {...(paddingY !== undefined ? { paddingY: spacingValue(paddingY) } : {})}
      gap={spacingValue(gap)}
    >
      {children}
    </Box>
  )
}

// ── Divider ───────────────────────────────────────────────────────────────────
// A thin horizontal line — typically a separator between Stacks.

export function Divider({
  orientation = "horizontal",
  color,
  label,
  indent = 0,
}: {
  orientation?: "horizontal" | "vertical"
  color?:       string
  label?:       string
  indent?:      number
}) {
  const theme = useTheme()
  const c = color ?? theme.borderDim

  if (orientation === "vertical") {
    return <Box flexDirection="column" alignItems="center" paddingX={0}><Text color={c}>│</Text></Box>
  }

  // Horizontal: take the terminal width and draw a line
  const width = useTerminalSize().columns
  const fillWidth = Math.max(0, width - indent)
  const line = "─".repeat(fillWidth)

  if (!label) {
    return <Box paddingLeft={indent}><Text color={c}>{line}</Text></Box>
  }

  // With a label: ─── label ───
  const dashSide = "─".repeat(2)
  return (
    <Box paddingLeft={indent}>
      <Text color={c}>{dashSide} </Text>
      <Text color={theme.textDim} dimColor>{label}</Text>
      <Text color={c}> {dashSide}</Text>
    </Box>
  )
}

// ── Re-export Box (for existing usages) ───────────────────────────────────
export { Box, Text }

// ── DesignBoxProps re-export ──────────────────────────────────────────────────
export type { DesignBoxProps } from "./types.js"
