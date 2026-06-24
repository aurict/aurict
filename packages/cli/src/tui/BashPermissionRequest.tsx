import React, { useState, useCallback } from "react"
import { Box, Text } from "ink"
import { useTheme } from "../utils/theme.js"
import type { PermissionRequest } from "@aurict/core"
import { Select, type SelectOption } from "./Select.js"
import type { PermissionPromptDecision } from "./PermissionPrompt.js"
import type { PermissionDecision } from "@aurict/core"
import { PermissionScaffold } from "./PermissionScaffold.js"

type Decision = PermissionDecision | "deny_abort" | "edit"

interface Props {
  request:  PermissionRequest
  onDecide: (d: PermissionPromptDecision) => void
}

function sandboxLine(request: PermissionRequest): string | null {
  if (!request.sandbox) return null
  const { backend, reason } = request.sandbox
  if (backend === "policy") return reason ? `sandboxed · ${reason}` : "sandboxed"
  if (backend === "docker") return "docker sandbox"
  return reason ?? null
}

export function BashPermissionRequest({ request, onDecide }: Props) {
  const theme       = useTheme()
  const isDanger    = request.level === "danger"
  const isWarning   = request.level === "warning"
  const accentColor = isDanger ? theme.error : isWarning ? theme.warning : theme.accent

  const options: SelectOption<Decision>[] = isDanger
    ? [
        { id: "allow_once", label: "Allow once",       hint: "allow this time (risky)",           color: theme.warning },
        { id: "edit",       label: "Edit command",      hint: "move command to input",             color: theme.accent  },
        { id: "deny",       label: "Deny",              hint: "safest default, AI receives error", color: theme.success },
        { id: "deny_abort", label: "Deny & stop agent", hint: "reject and abort execution",        color: theme.error   },
      ]
    : [
        { id: "allow_once", label: "Allow once",        hint: "just this time, don't remember" },
        { id: "allow",      label: "Allow for session",  hint: "remember until exit" },
        { id: "edit",       label: "Edit command",       hint: "move command to input", color: theme.accent },
        { id: "deny",       label: "Deny",               hint: "reject, AI continues with error", color: theme.error },
      ]

  const [selectIdx, setSelectIdx] = useState(isDanger ? 2 : 0)

  const handleSelect = useCallback((opt: SelectOption<Decision>) => {
    onDecide(opt.id === "edit" ? "edit" : opt.id)
  }, [onDecide])

  const sandbox  = sandboxLine(request)
  const title    = request.sandbox?.backend === "none" ? "Bash command (unsandboxed)" : "Bash command"
  const subtitle = isDanger ? "destructive operation" : isWarning ? "elevated privileges" : undefined

  const header = (
    <Box flexDirection="column" marginBottom={1}>
      <Text color={isDanger ? theme.error : isWarning ? theme.warning : theme.textPrimary} bold={isDanger}>
        $ {request.pattern}
      </Text>
      {request.summary && (
        <Text color={theme.textDim} dimColor>{request.summary}</Text>
      )}
      {sandbox && (
        <Text color={theme.textDim} dimColor>{sandbox}</Text>
      )}
      {request.command?.executables && request.command.executables.length > 0 && (
        <Box gap={1}>
          <Text color={theme.textDim} dimColor>exec</Text>
          <Text color={theme.textDim}>{request.command.executables.filter(Boolean).join(", ")}</Text>
        </Box>
      )}
      {(request.reason || request.permissionSummary) && (
        <Box
          borderStyle="single"
          borderColor={accentColor}
          borderTop={false} borderLeft={true} borderRight={false} borderBottom={false}
          paddingLeft={1}
          marginTop={1}
        >
          <Text color={isDanger || isWarning ? accentColor : theme.accent} wrap="wrap">
            {request.reason ?? request.permissionSummary}
          </Text>
        </Box>
      )}
    </Box>
  )

  return (
    <PermissionScaffold title={title} subtitle={subtitle} color={accentColor} header={header}>
      <Box marginBottom={1}>
        <Text color={theme.textSecondary}>Do you want to proceed?</Text>
      </Box>
      <Select
        options={options}
        selectedIndex={selectIdx}
        onChange={setSelectIdx}
        onSelect={handleSelect}
        onCancel={() => onDecide("deny")}
      />
      <Box marginTop={1}>
        <Text color={theme.textDim} dimColor>↑↓ select  Enter confirm  Esc deny</Text>
      </Box>
    </PermissionScaffold>
  )
}
