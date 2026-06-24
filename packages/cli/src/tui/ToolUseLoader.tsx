import React from "react"
import { Text } from "ink"
import { useTheme } from "../utils/theme.js"
import { useSpinnerFrame } from "./design-system/index.js"

interface Props {
  /** Tool aktif olarak çalışıyor mu (animate) */
  shouldAnimate: boolean
  /** Henüz tamamlanmadı mı */
  isUnresolved: boolean
  /** Hata ile mi bitti */
  isError: boolean
}

export function ToolUseLoader({ shouldAnimate, isUnresolved, isError }: Props) {
  const theme = useTheme()
  const spin  = useSpinnerFrame("dots")

  if (isError)         return <Text color={theme.error}>✗</Text>
  if (!isUnresolved)   return <Text color={theme.success}>✓</Text>
  if (shouldAnimate)   return <Text color={theme.accent}>{spin}</Text>
  return                      <Text color={theme.textDim} dimColor>○</Text>
}
