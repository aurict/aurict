import React, { useMemo, useState, useCallback } from "react"
import { Box, Text, useInput } from "ink"
import { useTheme } from "../utils/theme.js"
import type { PermissionDecision, PermissionRequest, PermissionResponse } from "@aurict/core"
import { Select, type SelectOption } from "./Select.js"
import { BashPermissionRequest } from "./BashPermissionRequest.js"
import { FallbackPermissionRequest } from "./FallbackPermissionRequest.js"
import { PermissionScaffold } from "./PermissionScaffold.js"

type Decision = PermissionDecision | "deny_abort" | "edit"
export type PermissionPromptDecision = Decision | PermissionResponse

interface Props {
  request:  PermissionRequest
  onDecide: (d: PermissionPromptDecision) => void
}

// ── Granular patch UI — multi-file apply_patch with file selector ─────────────

function patchFileLabel(file: NonNullable<PermissionRequest["files"]>[number]): string {
  if (file.action === "move" && file.targetPath) return `${file.path} -> ${file.targetPath}`
  return `${file.action} ${file.path}`
}

function patchFileKeys(file: NonNullable<PermissionRequest["files"]>[number]): string[] {
  return file.action === "move" && file.targetPath ? [file.path, file.targetPath] : [file.path]
}

function patchPreviewLines(patchText: string, maxLines = 80): string[] {
  const lines = patchText.split("\n")
  return lines.length > maxLines
    ? [...lines.slice(0, maxLines), `... ${lines.length - maxLines} more lines`]
    : lines
}

function GranularPatchRequest({ request, onDecide }: Props) {
  const theme = useTheme()
  const files  = request.files ?? []
  const patchText = request.patch?.text
  const selectableFileKeys = useMemo(() => files.map(patchFileKeys), [files])
  const allSelectedFiles   = useMemo(() => selectableFileKeys.flat(), [selectableFileKeys])
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(() => new Set(allSelectedFiles))
  const [fileIdx,   setFileIdx]   = useState(0)
  const [showPatch, setShowPatch] = useState(Boolean(patchText))

  const selectedCount = files.filter((f) => patchFileKeys(f).some((p) => selectedFiles.has(p))).length

  const options: SelectOption<Decision>[] = [
    { id: "allow_partial",   label: "Apply selected",     hint: `${selectedCount}/${files.length} file${files.length === 1 ? "" : "s"}` },
    { id: "allow_directory", label: "Apply + allow dirs", hint: "remember touched folders for this session" },
    { id: "allow_once",      label: "Apply all once",     hint: "ignore file selection for this patch" },
    { id: "deny",            label: "Deny",               hint: "reject patch, AI receives error", color: theme.error },
  ]
  const [selectIdx, setSelectIdx] = useState(0)

  const handleSelect = useCallback((opt: SelectOption<Decision>) => {
    if (opt.id === "allow_partial") {
      const approvedFiles = allSelectedFiles.filter((p) => selectedFiles.has(p))
      if (approvedFiles.length === 0) return
      onDecide({ decision: "allow_partial", approvedFiles })
      return
    }
    onDecide(opt.id)
  }, [allSelectedFiles, selectedFiles, onDecide])

  useInput((char, key) => {
    if (key.leftArrow)  { setFileIdx(i => Math.max(0, i - 1)); return }
    if (key.rightArrow) { setFileIdx(i => Math.min(files.length - 1, i + 1)); return }
    if (char === " ") {
      const keys = selectableFileKeys[fileIdx] ?? []
      if (keys.length > 0) {
        setSelectedFiles((cur) => {
          const next = new Set(cur)
          const sel  = keys.some((p) => next.has(p))
          for (const p of keys) sel ? next.delete(p) : next.add(p)
          return next
        })
      }
      return
    }
    if (char === "d" && patchText) setShowPatch(v => !v)
  })

  const subtitle = `${selectedCount} of ${files.length} file${files.length === 1 ? "" : "s"} selected`

  const header = (
    <Box flexDirection="column" marginBottom={1}>
      {/* File selector */}
      <Box flexDirection="column" marginBottom={1}>
        <Box gap={2} marginBottom={1}>
          <Text color={theme.textDim} dimColor>←/→ navigate  Space toggle</Text>
        </Box>
        {files.slice(Math.max(0, fileIdx - 2), Math.min(files.length, fileIdx + 3)).map((file, offset) => {
          const actualIdx = Math.max(0, fileIdx - 2) + offset
          const fileSel   = patchFileKeys(file).some(p => selectedFiles.has(p))
          const focused   = actualIdx === fileIdx
          return (
            <Box key={`${file.path}-${actualIdx}`} gap={1}>
              <Text color={focused ? theme.accent : theme.borderBright}>{focused ? "❯" : " "}</Text>
              <Text color={fileSel ? theme.success : theme.textDim}>{fileSel ? "[x]" : "[ ]"}</Text>
              <Text color={focused ? theme.textPrimary : theme.textDim}>{patchFileLabel(file)}</Text>
            </Box>
          )
        })}
      </Box>
      {/* Patch preview */}
      {patchText && showPatch && (
        <Box flexDirection="column" marginBottom={1}
             borderStyle="single" borderColor={theme.borderDim} paddingX={1}>
          <Box gap={2}>
            <Text color={theme.textDim} dimColor>diff</Text>
            <Text color={theme.textDim} dimColor>d hide</Text>
          </Box>
          {patchPreviewLines(patchText).map((line, i) => {
            const color = line.startsWith("+") ? theme.success
              : line.startsWith("-") ? theme.error
                : line.startsWith("***") ? theme.accent
                  : line.startsWith("@@") ? theme.warning
                    : theme.textDim
            return <Text key={i} color={color}>{line}</Text>
          })}
        </Box>
      )}
    </Box>
  )

  return (
    <PermissionScaffold title="Patch apply" subtitle={subtitle} color={theme.accent} header={header}>
      <Select
        options={options}
        selectedIndex={selectIdx}
        onChange={setSelectIdx}
        onSelect={handleSelect}
        onCancel={() => onDecide("deny")}
      />
      <Box marginTop={1}>
        <Text color={theme.textDim} dimColor>
          ↑↓ select  Enter confirm  Esc deny  ←/→ file  Space toggle
          {patchText ? "  d diff" : ""}
        </Text>
      </Box>
    </PermissionScaffold>
  )
}

// ── Route ─────────────────────────────────────────────────────────────────────

export function PermissionPrompt({ request, onDecide }: Props) {
  const isGranularPatch = request.tool === "apply_patch"
    && request.patch?.granular === true
    && (request.files ?? []).length > 0

  if (isGranularPatch) {
    return <GranularPatchRequest request={request} onDecide={onDecide} />
  }

  if (request.tool === "bash" || request.tool === "shell") {
    return <BashPermissionRequest request={request} onDecide={onDecide} />
  }

  return <FallbackPermissionRequest request={request} onDecide={onDecide} />
}
