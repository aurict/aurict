import React from "react"
import { Box } from "ink"
import { PermissionRequestTitle } from "./PermissionRequestTitle.js"

interface Props {
  title:          string
  subtitle?:      string | undefined
  color:          string
  innerPaddingX?: number | undefined
  children?:      React.ReactNode
}

export function PermissionDialog({ title, subtitle, color, innerPaddingX = 2, children }: Props) {
  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor={color}
      borderTop={true}
      borderLeft={false}
      borderRight={false}
      borderBottom={false}
      marginY={1}
    >
      <Box paddingX={2} paddingTop={1} flexDirection="column" marginBottom={1}>
        <PermissionRequestTitle title={title} subtitle={subtitle} color={color} />
      </Box>
      <Box flexDirection="column" paddingX={innerPaddingX} paddingBottom={1}>
        {children}
      </Box>
    </Box>
  )
}
