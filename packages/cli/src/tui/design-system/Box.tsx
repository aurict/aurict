/**
 * Design System — Layout primitives
 *
 * Tutarlı, semantik layout bileşenleri. Ink Box'ın üzerine inşa edilir.
 * - HStack/VStack: yatay/dikey yığın
 * - Center: içeriği ortalar
 * - Spacer: esnek boşluk
 * - Cluster: inline grup (wrap'lı)
 *
 * Tüm bileşenler tema-uyumlu ve density-aware'dır.
 *
 * Not: Ink 5.2.1 BoxProps `backgroundColor`'ı type'da barındırmıyor (render'da
 * var). `DesignBoxProps` (`./types`) bu eksiği kapatır.
 */

import React from "react"
import { Box, Text } from "ink"
import { useTheme } from "../../utils/theme.js"
import { useTerminalSize } from "../TerminalSizeContext.js"
import type { DesignBoxProps } from "./types.js"

// ── Spacing scale ──────────────────────────────────────────────────────────────
// "none" = 0, "xs" = 0, "sm" = 1, "md" = 2, "lg" = 3, "xl" = 4
// (Ink gap değerleri; padding için aynı ölçek kullanılır)

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

// ── Ortak omit listesi ─────────────────────────────────────────────────────────
// Tüm stack variantları için BoxProps'tan çıkardığımız property'ler.
// Padding/margin/gap'i Spacing tipiyle override ediyoruz; backgroundColor Ink'te
// yok ama DesignBoxProps'ta var — onu olduğu gibi geçiriyoruz.

type StackOmit =
  | "flexDirection"
  | "alignItems"
  | "justifyContent"
  | "padding" | "paddingX" | "paddingY"
  | "paddingTop" | "paddingBottom" | "paddingLeft" | "paddingRight"
  | "margin" | "marginX" | "marginY"
  | "marginTop" | "marginBottom" | "marginLeft" | "marginRight"
  | "gap"

// ── Tüm spacing-aware prop'lar için Spacing tipi tanımı ─────────────────────

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

// ── Tüm Spacing kabul eden anahtarlar ────────────────────────────────────────
// (resolveSpacing helper'ı için)

const SPACING_KEYS: readonly (keyof SpacingBoxExtras)[] = [
  "padding", "paddingX", "paddingY",
  "paddingTop", "paddingBottom", "paddingLeft", "paddingRight",
  "margin", "marginX", "marginY",
  "marginTop", "marginBottom", "marginLeft", "marginRight",
  "gap",
]

/**
 * Bir rest objesini Spacing-aware (sayıya çevrilmiş) ve geri kalan Ink
 * prop'ları olarak ikiye ayırır. Ink Box `margin/padding/gap`'i `number`
 * olarak bekler; biz `Spacing` kabul edip burada çözümleriz.
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
// Yatay yığın: soldan sağa, opsiyonel gap, align, justify.

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
// Dikey yığın: yukarıdan aşağı.

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
// Esnek boşluk. flexGrow=1 ile diğer elementleri iter.
// Kullanım: <HStack><Text>sol</Text><Spacer /><Text>sağ</Text></HStack>

export function Spacer({ minSize = 1 }: { minSize?: number }) {
  return <Box flexGrow={1} flexShrink={0} minWidth={minSize} />
}

export function VSpacer({ minSize = 1 }: { minSize?: number }) {
  return <Box flexGrow={1} flexShrink={0} minHeight={minSize} />
}

// ── Center ────────────────────────────────────────────────────────────────────
// İçeriği hem yatay hem dikey ortalar.

export interface CenterProps extends Omit<DesignBoxProps, "alignItems" | "justifyContent"> {
  minHeight?: number | string
  minWidth?:  number | string
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
// Wrap'lı inline grup — birçok küçük element için (tag, badge listesi).
// wrap threshold vermen gerekir; otomatik hesaplanmaz (terminal genişliği bilinmiyor render-time).

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
// Yatay ince çizgi — genelde Stack'ler arası ayraç.

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

  // Yatay: terminal genişliğini alıp çizgi çiz
  const width = useTerminalSize().columns
  const fillWidth = Math.max(0, width - indent)
  const line = "─".repeat(fillWidth)

  if (!label) {
    return <Box paddingLeft={indent}><Text color={c}>{line}</Text></Box>
  }

  // Label'lı: ─── label ───
  const dashSide = "─".repeat(2)
  return (
    <Box paddingLeft={indent}>
      <Text color={c}>{dashSide} </Text>
      <Text color={theme.textDim} dimColor>{label}</Text>
      <Text color={c}> {dashSide}</Text>
    </Box>
  )
}

// ── Re-export Box (mevcut kullanımlar için) ───────────────────────────────────
export { Box, Text }

// ── DesignBoxProps re-export ──────────────────────────────────────────────────
export type { DesignBoxProps } from "./types.js"
