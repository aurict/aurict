import React from "react"
import { PermissionDialog } from "./PermissionDialog.js"

interface Props {
  title:          string
  subtitle?:      string | undefined
  color:          string
  innerPaddingX?: number | undefined
  header?:        React.ReactNode
  children?:      React.ReactNode
}

export function PermissionScaffold({ title, subtitle, color, innerPaddingX, header, children }: Props) {
  return (
    <PermissionDialog title={title} subtitle={subtitle} color={color} innerPaddingX={innerPaddingX}>
      {header}
      {children}
    </PermissionDialog>
  )
}
