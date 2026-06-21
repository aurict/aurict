import React, { useMemo, useState } from "react"
import { Box, Text, useInput } from "ink"
import { useTheme } from "../utils/theme.js"
import type { PermissionDecision, PermissionRequest, PermissionResponse } from "@aurict/core"

type Decision = PermissionDecision | "deny_abort" | "edit"
export type PermissionPromptDecision = Decision | PermissionResponse

interface Option {
  id:      Decision
  label:   string
  hint:    string
  color?:  string
  danger?: boolean
}

interface Props {
  request:  PermissionRequest
  onDecide: (d: PermissionPromptDecision) => void
}

function riskLabel(level?: string): { text: string; detail: string } {
  if (level === "danger")  return { text: "DANGER", detail: "destructive or privileged action" }
  if (level === "warning") return { text: "WARNING", detail: "mutating or network-capable action" }
  if (level === "safe")    return { text: "SAFE", detail: "read-only command" }
  return                          { text: "NOTICE", detail: "confirmation required" }
}

function sandboxLabel(request: PermissionRequest): { text: string; detail: string } {
  const sandbox = request.sandbox
  if (!sandbox) return { text: "UNKNOWN", detail: "no sandbox metadata" }
  if (sandbox.backend === "policy") return { text: "POLICY", detail: sandbox.envScrubbed ? "env scrubbed" : "guarded execution" }
  if (sandbox.backend === "docker") return { text: "DOCKER", detail: "container backend requested" }
  return { text: "NONE", detail: sandbox.reason }
}

// Komut özeti — bash ise daha geniş göster
function formatPattern(pattern: string, tool: string, isDanger: boolean): string {
  // Danger'da tam göster, diğerlerinde 80 char kırp
  const maxLen = isDanger ? 200 : 80
  if (pattern.length <= maxLen) return pattern
  return pattern.slice(0, maxLen - 1) + "…"
}

// "2 hours ago" benzeri relative timestamp — kullanılabilir olursa
function _relativeTime(ms: number): string {
  const s = Math.floor((Date.now() - ms) / 1000)
  if (s < 5)   return "just now"
  if (s < 60)  return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  return `${Math.floor(s / 3600)}h ago`
}

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

export function PermissionPrompt({ request, onDecide }: Props) {
  const theme     = useTheme()
  const isDanger  = request.level === "danger"
  const isWarning = request.level === "warning"
  const risk      = riskLabel(request.level)
  const sandbox   = sandboxLabel(request)
  const isBashTool = request.tool === "bash" || request.tool === "shell"
  const supportsDirectoryApproval = request.tool === "write" || request.tool === "edit" || request.tool === "apply_patch"
  const files = request.files ?? []
  const diff = request.diff
  const patchText = request.patch?.text
  const granularPatch = request.tool === "apply_patch" && request.patch?.granular === true && files.length > 0
  const selectableFileKeys = useMemo(() => files.map((file) => patchFileKeys(file)), [files])
  const allSelectedFiles = useMemo(() => selectableFileKeys.flat(), [selectableFileKeys])
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(() => new Set(allSelectedFiles))
  const [fileIdx, setFileIdx] = useState(0)
  const [showPatch, setShowPatch] = useState(Boolean(patchText))
  const selectedCount = files.filter((file) =>
    patchFileKeys(file).some((path) => selectedFiles.has(path))
  ).length

  // Seçenek listesi — tehlike seviyesine göre değişir
  const options: Option[] = granularPatch
    ? [
        { id: "allow_partial", label: "Apply selected", hint: `${selectedCount}/${files.length} file${files.length === 1 ? "" : "s"}` },
        { id: "allow_directory", label: "Apply + allow dirs", hint: "remember touched folders for this session" },
        { id: "allow_once", label: "Apply all once", hint: "ignore file selection for this patch" },
        { id: "deny", label: "Deny", hint: "reject patch, AI receives error", color: theme.error },
      ]
    : isDanger
    ? [
        { id: "allow_once", label: "Allow once",       hint: "allow this time (risky)",          color: theme.warning, danger: true },
        ...(isBashTool ? [{ id: "edit" as const, label: "Edit command", hint: "deny and move command to input", color: theme.accent }] : []),
        { id: "deny",       label: "Deny",              hint: "safest default, AI receives error", color: theme.success },
        { id: "deny_abort", label: "Deny & stop agent", hint: "reject and abort execution",        color: theme.error },
      ]
    : [
        { id: "allow_once", label: "Allow once",       hint: "just this time, don't remember" },
        ...(supportsDirectoryApproval ? [{ id: "allow_directory" as const, label: "Allow directory", hint: "remember this folder for session" }] : []),
        { id: "allow",      label: "Allow for session", hint: "remember until exit" },
        ...(isBashTool ? [{ id: "edit" as const, label: "Edit command", hint: "deny and move command to input", color: theme.accent }] : []),
        { id: "deny",       label: "Deny",              hint: "reject, AI continues with error",   color: theme.error },
      ]

  // Danger = default Deny, normal = default Allow once.
  const [idx, setIdx] = useState(isDanger && !granularPatch ? (isBashTool ? 2 : 1) : 0)

  useInput((char, key) => {
    if (key.upArrow)   { setIdx(i => Math.max(0, i - 1)); return }
    if (key.downArrow) { setIdx(i => Math.min(options.length - 1, i + 1)); return }
    if (granularPatch && key.leftArrow) { setFileIdx(i => Math.max(0, i - 1)); return }
    if (granularPatch && key.rightArrow) { setFileIdx(i => Math.min(files.length - 1, i + 1)); return }
    if (granularPatch && char === " ") {
      const keys = selectableFileKeys[fileIdx] ?? []
      if (keys.length > 0) {
        setSelectedFiles((current) => {
          const next = new Set(current)
          const selected = keys.some((path) => next.has(path))
          for (const path of keys) {
            if (selected) next.delete(path)
            else next.add(path)
          }
          return next
        })
      }
      return
    }
    if (char === "d" && patchText) { setShowPatch((v) => !v); return }
    if (key.return) {
      const option = options[idx]!.id
      if (option === "allow_partial") {
        const approvedFiles = allSelectedFiles.filter((path) => selectedFiles.has(path))
        if (approvedFiles.length === 0) return
        onDecide({ decision: "allow_partial", approvedFiles })
        return
      }
      onDecide(option)
      return
    }
    if (key.escape)    { onDecide("deny"); return }
  })

  // Border rengi — risk seviyesine göre
  const borderColor = isDanger  ? theme.error
                    : isWarning ? theme.warning
                    :             theme.accent

  // Risk badge rengi
  const badgeColor  = isDanger  ? theme.error
                    : isWarning ? theme.warning
                    :             theme.accent

  const displayPattern = formatPattern(request.pattern, request.tool, isDanger)
  const commandExecutables = request.command?.executables?.filter(Boolean) ?? []

  return (
    <Box flexDirection="column" borderStyle="round" borderColor={borderColor}
         paddingX={2} paddingY={1} marginY={1}>

      {/* ── Başlık satırı ────────────────────────────────────────────────────── */}
      <Box gap={2} marginBottom={1}>
        <Box gap={1}>
          <Text color={badgeColor} bold>{risk.text}</Text>
          <Text color={theme.textDim} dimColor>— permission required</Text>
        </Box>
      </Box>

      <Box flexDirection="column" marginBottom={1}>
        <Box gap={2}>
          <Text color={theme.textDim} dimColor>risk   </Text>
          <Text color={badgeColor} bold>{risk.text}</Text>
          <Text color={theme.textDim} dimColor>{risk.detail}</Text>
        </Box>
        {isBashTool && (
          <Box gap={2}>
            <Text color={theme.textDim} dimColor>sandbox</Text>
            <Text
              color={
                request.sandbox?.backend === "policy" ? theme.accent
                  : request.sandbox?.backend === "docker" ? theme.warning
                    : theme.textDim
              }
              bold={request.sandbox?.backend === "policy"}
            >
              {sandbox.text}
            </Text>
            <Text color={theme.textDim} dimColor>{sandbox.detail}</Text>
          </Box>
        )}
        {request.sandbox?.reason && request.sandbox.reason !== sandbox.detail && (
          <Box gap={2}>
            <Text color={theme.textDim} dimColor>why    </Text>
            <Text color={theme.textDim}>{request.sandbox.reason}</Text>
          </Box>
        )}
      </Box>

      {/* ── "Bu izin neden gerekli?" — vurgulu bölüm ─────────────────────────── */}
      {request.reason && (
        <Box
          borderStyle="single"
          borderColor={borderColor}
          borderTop={false} borderLeft={true} borderRight={false} borderBottom={false}
          paddingLeft={1} marginBottom={1}
        >
          <Text color={isWarning || isDanger ? badgeColor : theme.accent} wrap="wrap">
            {request.reason}
          </Text>
        </Box>
      )}

      {/* ── Tool + komut detayları ────────────────────────────────────────────── */}
      <Box flexDirection="column" gap={0} marginBottom={1} paddingLeft={2}>
        <Box gap={2}>
          <Text color={theme.textDim} dimColor>tool</Text>
          <Text color={theme.accent} bold>{request.tool}</Text>
          {request.summary && (
            <Text color={theme.textDim} dimColor>— {request.summary}</Text>
          )}
        </Box>

        <Box gap={2}>
          <Text color={theme.textDim} dimColor>cmd </Text>
          {/* bash komutları mono görünümde, danger'da kırmızı */}
          <Text
            color={isDanger ? theme.error : isWarning ? theme.warning : theme.textPrimary}
            bold={isDanger}
          >
            {isBashTool ? `$ ${displayPattern}` : displayPattern}
          </Text>
        </Box>

        {commandExecutables.length > 0 && (
          <Box gap={2}>
            <Text color={theme.textDim} dimColor>exec</Text>
            <Text color={theme.textDim}>{commandExecutables.join(", ")}</Text>
          </Box>
        )}

        {diff && (
          <Box gap={2}>
            <Text color={theme.textDim} dimColor>diff</Text>
            <Text color={theme.success}>+{diff.added}</Text>
            <Text color={theme.error}>-{diff.removed}</Text>
            <Text color={theme.textDim}>{diff.fileCount} file{diff.fileCount === 1 ? "" : "s"}</Text>
          </Box>
        )}

        {files.length > 0 && (
          <Box flexDirection="column">
            <Box gap={2}>
              <Text color={theme.textDim} dimColor>files</Text>
              <Text color={theme.textDim}>
                {files.slice(0, 5).map((file) => patchFileLabel(file)).join(", ")}
              </Text>
            </Box>
            {files.length > 5 && (
              <Box paddingLeft={7}>
                <Text color={theme.textDim} dimColor>{files.length - 5} more file{files.length - 5 === 1 ? "" : "s"}</Text>
              </Box>
            )}
          </Box>
        )}

        {granularPatch && (
          <Box flexDirection="column" marginTop={1}>
            <Box gap={2}>
              <Text color={theme.textDim} dimColor>select</Text>
              <Text color={theme.textDim}>{selectedCount}/{files.length}</Text>
              <Text color={theme.textDim} dimColor>Left/Right file  Space toggle</Text>
            </Box>
            {files.slice(Math.max(0, fileIdx - 2), Math.min(files.length, fileIdx + 3)).map((file, offset) => {
              const actualIdx = Math.max(0, fileIdx - 2) + offset
              const selected = patchFileKeys(file).some((path) => selectedFiles.has(path))
              const focused = actualIdx === fileIdx
              return (
                <Box key={`${file.path}-${actualIdx}`} gap={1} paddingLeft={2}>
                  <Text color={focused ? theme.accent : theme.borderBright}>{focused ? "▶" : " "}</Text>
                  <Text color={selected ? theme.success : theme.textDim}>{selected ? "[x]" : "[ ]"}</Text>
                  <Text color={focused ? theme.textPrimary : theme.textDim}>{patchFileLabel(file)}</Text>
                </Box>
              )
            })}
          </Box>
        )}

        {patchText && showPatch && (
          <Box flexDirection="column" marginTop={1} borderStyle="single" borderColor={theme.borderDim} paddingX={1}>
            <Box gap={2}>
              <Text color={theme.textDim} dimColor>patch preview</Text>
              <Text color={theme.textDim} dimColor>d hide</Text>
            </Box>
            {patchPreviewLines(patchText).map((line, lineIdx) => {
              const color = line.startsWith("+") ? theme.success
                : line.startsWith("-") ? theme.error
                  : line.startsWith("***") ? theme.accent
                    : line.startsWith("@@") ? theme.warning
                      : theme.textDim
              return <Text key={lineIdx} color={color}>{line}</Text>
            })}
          </Box>
        )}

        {/* reason yoksa ama summary varsa buraya düş */}
        {!request.reason && request.permissionSummary && (
          <Box gap={2} marginTop={0}>
            <Text color={theme.textDim} dimColor>why </Text>
            <Text color={theme.textDim}>{request.permissionSummary}</Text>
          </Box>
        )}
      </Box>

      {/* ── Seçenekler ────────────────────────────────────────────────────────── */}
      <Box flexDirection="column" borderStyle="single"
           borderColor={theme.borderDim} paddingX={1} paddingY={0}
           borderTop={true} borderLeft={false} borderRight={false} borderBottom={false}>
        {options.map((opt, i) => {
          const selected = i === idx
          const color    = selected
            ? (opt.color ?? theme.accent)
            : theme.textDim

          return (
            <Box key={opt.id} gap={2} paddingY={0}>
              <Text color={selected ? (opt.color ?? theme.accent) : theme.borderBright}>
                {selected ? "▶" : " "}
              </Text>
              <Text color={color} bold={selected}>{opt.label}</Text>
              <Text color={theme.borderBright} dimColor>{opt.hint}</Text>
            </Box>
          )
        })}
      </Box>

      {/* ── Klavye ipuçları — risk seviyesine göre değişir ────────────────────── */}
      <Box marginTop={1} paddingLeft={2}>
        <Text color={theme.textDim} dimColor>
          {isDanger
            ? `↑↓ action  Enter confirm  Esc deny${patchText ? "  d preview" : ""}${granularPatch ? "  ←/→ file  Space toggle" : ""}`
            : `↑↓ action  Enter confirm  Esc deny${patchText ? "  d preview" : ""}${granularPatch ? "  ←/→ file  Space toggle" : ""}`}
        </Text>
      </Box>
    </Box>
  )
}
