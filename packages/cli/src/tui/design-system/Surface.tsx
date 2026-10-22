/**
 * Design System — Surface
 *
 * Box/border decoration wrapper. Consistent border, padding, background.
 *
 * Variants:
 * - "raised": round border + padding
 * - "flat":   single line border
 * - "double": double line border (emphasis)
 * - "heavy":  thick border (important warning)
 * - "sunken": background color (highlighted content)
 * - "ghost":  no border, padding only
 * - "ascii":  ascii characters (terminal compatibility)
 *
 * Elevation: 0 (flat) - 3 (shadow)
 */

import React from "react"
import { useTheme } from "../../utils/theme.js"
import type { Spacing } from "./Box.js"
import { spacingValue } from "./Box.js"
import { DesignBox as Box, type DesignBoxProps } from "./types.js"
import { prefersAsciiGlyphs } from "../terminal-glyphs.js"

// ── Types ────────────────────────────────────────────────────────────────────

export type SurfaceVariant = "raised" | "flat" | "double" | "heavy" | "sunken" | "ghost" | "ascii"
export type SurfaceTone = "default" | "muted" | "accent" | "success" | "warning" | "error" | "info"
export type SurfaceElevation = 0 | 1 | 2 | 3

export interface SurfaceProps extends Omit<DesignBoxProps,
  "borderStyle" | "borderColor"
  | "padding" | "paddingX" | "paddingY"
  | "margin" | "marginX" | "marginY"
  | "backgroundColor"
> {
  variant?:    SurfaceVariant
  tone?:       SurfaceTone
  elevation?:  SurfaceElevation
  padding?:    Spacing
  paddingX?:   Spacing
  paddingY?:   Spacing
  margin?:     Spacing
  marginX?:    Spacing
  marginY?:    Spacing
  /** Accent color (for tone accent/success etc.) */
  accentColor?: string
  /** Header (top band) */
  header?:     React.ReactNode
  /** Footer (bottom band) */
  footer?:     React.ReactNode
  children:    React.ReactNode
}

// ── Border style + color resolution ───────────────────────────────────────────

type BoxStyleKey = "single" | "double" | "round" | "bold" | "singleDouble" | "doubleSingle" | "classic" | "arrow"

function resolveBorderStyle(v: SurfaceVariant): BoxStyleKey | undefined {
  switch (v) {
    case "flat":   return "single"
    case "double": return "double"
    case "heavy":  return "bold"
    case "ascii":  return "classic"
    case "sunken":
    case "ghost":  return undefined
    case "raised":
    default:       return "round"
  }
}

function resolveBorderColor(tone: SurfaceTone, theme: ReturnType<typeof useTheme>, accent?: string): string | undefined {
  if (accent) return accent
  switch (tone) {
    case "accent":  return theme.accent
    case "success": return theme.success
    case "warning": return theme.warning
    case "error":   return theme.error
    case "info":    return theme.accentAlt
    case "muted":   return theme.borderDim
    case "default":
    default:        return theme.borderDim
  }
}

// ── Main component ───────────────────────────────────────────────────────────────

export function Surface({
  variant = "raised",
  tone = "default",
  elevation = 0,
  padding = "sm",
  paddingX,
  paddingY,
  margin,
  marginX,
  marginY,
  accentColor,
  header,
  footer,
  children,
  ...rest
}: SurfaceProps) {
  const theme = useTheme()
  const requestedBorderStyle = resolveBorderStyle(variant)
  const borderStyle = requestedBorderStyle && prefersAsciiGlyphs() ? "classic" : requestedBorderStyle
  const borderColor  = resolveBorderColor(tone, theme, accentColor)

  const px = paddingX !== undefined ? spacingValue(paddingX) : spacingValue(padding)
  const py = paddingY !== undefined ? spacingValue(paddingY) : spacingValue(padding)

  // Sunken: highlight via backgroundColor
  if (variant === "sunken") {
    return (
      <Box
        flexDirection="column"
        backgroundColor={theme.bgHighlight}
        paddingX={px}
        paddingY={py}
        {...(margin !== undefined ? { margin: spacingValue(margin) } : {})}
        {...(marginX !== undefined ? { marginX: spacingValue(marginX) } : {})}
        {...(marginY !== undefined ? { marginY: spacingValue(marginY) } : {})}
        {...rest}
      >
        {header}
        {children}
        {footer}
      </Box>
    )
  }

  // Ghost: no border
  if (variant === "ghost") {
    return (
      <Box
        flexDirection="column"
        paddingX={px}
        paddingY={py}
        {...(margin !== undefined ? { margin: spacingValue(margin) } : {})}
        {...(marginX !== undefined ? { marginX: spacingValue(marginX) } : {})}
        {...(marginY !== undefined ? { marginY: spacingValue(marginY) } : {})}
        {...rest}
      >
        {header}
        {children}
        {footer}
      </Box>
    )
  }

  // Bordered variants
  return (
    <Box
      flexDirection="column"
      {...(borderStyle !== undefined ? { borderStyle } : {})}
      {...(borderColor !== undefined ? { borderColor } : {})}
      paddingX={px}
      paddingY={py}
      {...(margin !== undefined ? { margin: spacingValue(margin) } : {})}
      {...(marginX !== undefined ? { marginX: spacingValue(marginX) } : {})}
      {...(marginY !== undefined ? { marginY: spacingValue(marginY) } : {})}
      {...rest}
    >
      {header}
      {children}
      {footer}
    </Box>
  )
}

// ── Card (specialized surface) ────────────────────────────────────────────────

export function Card(props: Omit<SurfaceProps, "variant">) {
  return <Surface {...props} variant="raised" />
}

export function Panel(props: Omit<SurfaceProps, "variant">) {
  return <Surface {...props} variant="flat" />
}

export function Aside(props: Omit<SurfaceProps, "variant">) {
  return <Surface {...props} variant="ghost" />
}
