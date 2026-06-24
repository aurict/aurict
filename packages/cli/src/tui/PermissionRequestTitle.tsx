import React from "react"
import { Box, Text } from "ink"

interface Props {
  title:     string
  subtitle?: string | undefined
  color:     string
}

export function PermissionRequestTitle({ title, subtitle, color }: Props) {
  return (
    <Box flexDirection="column">
      <Text bold color={color}>{title}</Text>
      {subtitle && <Text dimColor>{subtitle}</Text>}
    </Box>
  )
}
