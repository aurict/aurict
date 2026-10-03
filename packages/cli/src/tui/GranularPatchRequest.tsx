import React, { useCallback, useMemo, useState } from "react"
import { Box, Text, useInput } from "./design-system/renderer.js"
import { useTheme } from "../utils/theme.js"
import type { PermissionDecision, PermissionRequest, PermissionResponse } from "@aurict/core"
import { Select, type SelectOption } from "./Select.js"
import { PermissionScaffold } from "./PermissionScaffold.js"
import { PermissionCommandPreview } from "./PermissionCommandPreview.js"
import {
  initialPatchSelection,
  patchSelectionResponse,
  patchSelectionRows,
  rowState,
  selectedFileCount,
  togglePatchRow,
  type PatchFile,
  type PatchSelectionRow,
} from "./patch-selection.js"

type Decision = PermissionDecision | "deny_abort" | "edit"

interface Props {
  request:  PermissionRequest
  onDecide: (d: Decision | PermissionResponse) => void
}

const VISIBLE_ROWS = 5

function fileLabel(file: PatchFile): string {
  if (file.action === "move" && file.targetPath) return `${file.path} -> ${file.targetPath}`
  return `${file.action} ${file.path}`
}

function hunkLabel(file: PatchFile, hunkIndex: number): string {
  const hunk = file.hunks![hunkIndex]!
  return `@@ ${hunk.context ?? `chunk ${hunkIndex + 1}`}  +${hunk.added} −${hunk.removed}`
}

/** apply_patch approval with file and per-chunk (`@@`) selection. */
export function GranularPatchRequest({ request, onDecide }: Props) {
  const theme = useTheme()
  const files = request.files ?? []
  const patchText = request.patch?.text
  const rows = useMemo(() => patchSelectionRows(files), [files])
  const [selection, setSelection] = useState(() => initialPatchSelection(files))
  const [rowIdx, setRowIdx] = useState(0)
  const [showPatch, setShowPatch] = useState(false)
  const [selectIdx, setSelectIdx] = useState(0)

  const chosenFiles = selectedFileCount(selection, files)
  const partial = rows.some((row) => row.kind === "file" && rowState(selection, files, row) === "some")
  const options: SelectOption<Decision>[] = [
    { id: "allow_partial",   label: "Apply selected",     hint: `${chosenFiles}/${files.length} file${files.length === 1 ? "" : "s"}${partial ? " · some chunks skipped" : ""}` },
    { id: "allow_directory", label: "Apply + allow dirs", hint: "remember touched folders for this session" },
    { id: "allow_once",      label: "Apply all once",     hint: "ignore the selection for this patch" },
    { id: "deny",            label: "Deny",               hint: "reject patch, AI receives error", color: theme.error },
  ]

  const handleSelect = useCallback((option: SelectOption<Decision>) => {
    if (option.id === "allow_partial") {
      const response = patchSelectionResponse(selection, files)
      if (!response) return
      onDecide({
        decision: "allow_partial",
        approvedFiles: response.approvedFiles,
        ...(Object.keys(response.approvedHunks).length > 0 ? { approvedHunks: response.approvedHunks } : {}),
      })
      return
    }
    onDecide(option.id)
  }, [files, onDecide, selection])

  useInput((char, key) => {
    if (showPatch) return
    if (key.leftArrow)  { setRowIdx((index) => Math.max(0, index - 1)); return }
    if (key.rightArrow) { setRowIdx((index) => Math.min(rows.length - 1, index + 1)); return }
    if (char === " ") {
      const row = rows[rowIdx]
      if (row) setSelection((current) => togglePatchRow(current, files, row))
      return
    }
    if (char === "d" && patchText) setShowPatch((value) => !value)
  })

  const first = Math.max(0, Math.min(rowIdx - 1, rows.length - VISIBLE_ROWS))
  const renderRow = (row: PatchSelectionRow, index: number) => {
    const file = files[row.fileIndex]!
    const state = rowState(selection, files, row)
    const focused = index === rowIdx
    const box = state === "all" ? "[x]" : state === "some" ? "[~]" : "[ ]"
    return (
      <Box key={row.kind === "file" ? `f${row.fileIndex}` : `h${row.fileIndex}:${row.hunkIndex}`} gap={1}>
        <Text color={focused ? theme.accent : theme.borderBright}>{focused ? "❯" : " "}</Text>
        {row.kind === "hunk" && <Text color={theme.borderDim}>  </Text>}
        <Text color={state === "none" ? theme.textDim : theme.success}>{box}</Text>
        <Text color={focused ? theme.textPrimary : theme.textDim} wrap="truncate-end">
          {row.kind === "file" ? fileLabel(file) : hunkLabel(file, row.hunkIndex!)}
        </Text>
      </Box>
    )
  }

  const header = (
    <Box flexDirection="column">
      <Box flexDirection="column">
        {rows.slice(first, first + VISIBLE_ROWS).map((row, offset) => renderRow(row, first + offset))}
        {rows.length > VISIBLE_ROWS && <Text color={theme.textDim} dimColor>  {rowIdx + 1}/{rows.length}</Text>}
      </Box>
      {patchText && (
        <PermissionCommandPreview
          command={patchText}
          open={showPatch}
          onOpenChange={setShowPatch}
          label="patch"
          linePrefix=""
        />
      )}
    </Box>
  )

  return (
    <PermissionScaffold
      title="Patch apply"
      subtitle={`${chosenFiles} of ${files.length} file${files.length === 1 ? "" : "s"} selected`}
      color={theme.accent}
      header={header}
    >
      <Select
        options={options}
        selectedIndex={selectIdx}
        onChange={setSelectIdx}
        onSelect={handleSelect}
        onCancel={() => onDecide("deny")}
      />
      <Box>
        <Text color={theme.textDim} dimColor>
          y apply all  n deny  ↑↓ action  Enter confirm  ←/→ file/chunk  Space toggle
          {patchText ? "  d diff" : ""}
        </Text>
      </Box>
    </PermissionScaffold>
  )
}
