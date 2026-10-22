import React from "react"
import { Box, Text } from "./design-system/renderer.js"
import { useTerminalSize } from "./TerminalSizeContext.js"
import { shellHorizontalInset } from "./app-shell/layout-metrics.js"

export type PermissionTone = "safe" | "warning" | "danger" | "accent"

interface Props {
  title:          string
  subtitle?:      string | undefined
  color:          string
  tone?:          PermissionTone
  innerPaddingX?: number | undefined
  children?:      React.ReactNode
}

/**
 * Codex-style approval block: no frame, a bold question, then the request
 * details and a numbered choice list, all indented two columns.
 */
export function PermissionDialog({ title, subtitle, color, children }: Props) {
  const { columns } = useTerminalSize()
  const horizontalInset = shellHorizontalInset(columns)

  return (
    <Box flexDirection="column" paddingLeft={horizontalInset + 2} paddingRight={2}>
      <Text bold wrap="wrap">{title}</Text>
      {subtitle && <Text color={color}>{subtitle}</Text>}
      <Box flexDirection="column" marginTop={1}>
        {children}
      </Box>
    </Box>
  )
}
