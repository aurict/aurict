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

function toolLabel(tool: string): string {
  const map: Record<string, string> = {
    write:       "File write",
    edit:        "File edit",
    read:        "File read",
    apply_patch: "Patch apply",
    glob:        "Path search",
    grep:        "Content search",
    webfetch:    "HTTP request",
    websearch:   "Web search",
    subagent:    "Spawn subagent",
    todo:        "Task update",
  }
  return map[tool] ?? `Tool use: ${tool}`
}

export function FallbackPermissionRequest({ request, onDecide }: Props) {
  const theme       = useTheme()
  const isDanger    = request.level === "danger"
  const isWarning   = request.level === "warning"
  const accentColor = isDanger ? theme.error : isWarning ? theme.warning : theme.accent
  const supportsDir = request.tool === "write" || request.tool === "edit" || request.tool === "apply_patch"

  const options: SelectOption<Decision>[] = isDanger
    ? [
        { id: "allow_once", label: "Allow once",       hint: "allow this time (risky)", color: theme.warning },
        { id: "deny",       label: "Deny",              hint: "safest, AI receives error", color: theme.success },
        { id: "deny_abort", label: "Deny & stop agent", hint: "reject and abort",          color: theme.error   },
      ]
    : [
        { id: "allow_once",      label: "Allow once",        hint: "just this time" },
        ...(supportsDir ? [{ id: "allow_directory" as Decision, label: "Allow directory", hint: "remember folder for session" }] : []),
        { id: "allow",           label: "Allow for session",  hint: "remember until exit" },
        { id: "deny",            label: "Deny",               hint: "reject, AI continues with error", color: theme.error },
      ]

  const [selectIdx, setSelectIdx] = useState(isDanger ? 1 : 0)

  const handleSelect = useCallback((opt: SelectOption<Decision>) => {
    onDecide(opt.id)
  }, [onDecide])

  const subtitle = isDanger ? "destructive operation" : isWarning ? "elevated privileges" : undefined

  const header = (
    <Box flexDirection="column" marginBottom={1}>
      <Text color={isDanger ? theme.error : theme.textPrimary} bold={isDanger}>
        {request.pattern}
      </Text>
      {request.summary && (
        <Text color={theme.textDim} dimColor>{request.summary}</Text>
      )}
      {request.diff && (
        <Box gap={2}>
          <Text color={theme.success}>+{request.diff.added}</Text>
          <Text color={theme.error}>-{request.diff.removed}</Text>
          <Text color={theme.textDim} dimColor>
            {request.diff.fileCount} file{request.diff.fileCount === 1 ? "" : "s"}
          </Text>
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
    <PermissionScaffold title={toolLabel(request.tool)} subtitle={subtitle} color={accentColor} header={header}>
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
