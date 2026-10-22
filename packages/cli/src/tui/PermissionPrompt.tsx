import React, { useRef, useState } from "react"
import { Box, Text, useInput } from "./design-system/renderer.js"
import type { PermissionDecision, PermissionRequest, PermissionResponse } from "@aurict/core"
import { useTheme } from "../utils/theme.js"
import { glyph } from "./terminal-glyphs.js"
import { PermissionCommandPreview } from "./PermissionCommandPreview.js"
import { useTerminalSize } from "./TerminalSizeContext.js"
import { wrapSpans } from "./terminal-text/wrap-spans.js"

type HeaderSpan = { text: string; italic?: boolean; color?: string }

type Decision = PermissionDecision | "deny_abort"
export type PermissionPromptDecision = Decision | PermissionResponse

interface ApprovalOption { label: string; key: string; decision: Decision }
interface ApprovalVariant { title: string; header: Array<{ label?: string; text: string; italic?: boolean; command?: boolean }>; options: ApprovalOption[] }

const SHELL_TOOLS = new Set(["bash", "shell"])
const EDIT_TOOLS = new Set(["write", "edit", "apply_patch"])
const NETWORK_TOOLS = new Set(["webfetch", "websearch", "http_request", "browser"])
const CANCEL: ApprovalOption = { label: "No, and tell Aurict what to do differently", key: "esc", decision: "deny_abort" }

function host(pattern: string): string {
  try { return new URL(pattern).host || pattern } catch { return pattern }
}

/** Builds the Codex approval request for each kind of tool call. */
export function approvalVariant(request: PermissionRequest): ApprovalVariant {
  const reason = request.reason ?? request.permissionSummary ?? request.summary
  const header: ApprovalVariant["header"] = reason ? [{ label: "Reason: ", text: reason, italic: true }] : []
  if (SHELL_TOOLS.has(request.tool)) {
    return {
      title: "Would you like to run the following command?",
      header: [...header, { text: request.pattern, command: true }],
      options: [
        { label: "Yes, proceed", key: "y", decision: "allow_once" },
        ...(request.prefixRule ? [{ label: `Yes, and don't ask again for commands that start with \`${request.prefixRule}\``, key: "p", decision: "allow_prefix" as const }] : []),
        CANCEL,
      ],
    }
  }
  if (EDIT_TOOLS.has(request.tool)) {
    return {
      title: "Would you like to make the following edits?",
      header,
      options: [
        { label: "Yes, proceed", key: "y", decision: "allow_once" },
        { label: "Yes, and don't ask again for these files", key: "a", decision: "allow" },
        CANCEL,
      ],
    }
  }
  if (NETWORK_TOOLS.has(request.tool)) {
    return {
      title: `Do you want to approve network access to "${host(request.pattern)}"?`,
      header,
      options: [
        { label: "Yes, just this once", key: "y", decision: "allow_once" },
        { label: "Yes, and allow this host for this conversation", key: "a", decision: "allow" },
        CANCEL,
      ],
    }
  }
  return {
    title: "Would you like to grant these permissions?",
    header: [...header, { label: "Permission rule: ", text: `${request.tool} \`${request.pattern}\`` }],
    options: [
      { label: "Yes, grant these permissions for this turn", key: "y", decision: "allow_once" },
      { label: "Yes, grant these permissions for this session", key: "a", decision: "allow" },
      { label: "No, continue without permissions", key: "d", decision: "deny" },
    ],
  }
}

/** Esc cancels and interrupts, except for plain permission grants where Codex only declines. */
export function escapeDecision(request: PermissionRequest): "deny" | "deny_abort" {
  return approvalVariant(request).options.some((option) => option.key === "esc") ? "deny_abort" : "deny"
}

/** While the ctrl+a detail view is open, Esc closes it instead of cancelling the request. */
export const approvalDetailState = { open: false }

interface Props {
  request:  PermissionRequest
  onDecide: (d: PermissionPromptDecision) => void
}

/**
 * The Codex approval overlay:
 *
 *   Would you like to run the following command?
 *
 *   Reason: …
 *
 *   $ echo hello world
 *
 * › 1. Yes, proceed (y)
 *   2. No, and tell Aurict what to do differently (esc)
 *
 *   Press enter to confirm or esc to cancel
 */
export function PermissionPrompt({ request, onDecide }: Props) {
  const theme = useTheme()
  const { columns } = useTerminalSize()
  const variant = approvalVariant(request)
  // Danger-rated requests start on the refusal so a stray Enter never approves them.
  const initial = request.level === "danger" ? variant.options.length - 1 : 0
  const [selected, setSelected] = useState(initial)
  const [fullscreen, setFullscreen] = useState(false)
  const selectedRef = useRef(initial)
  const choose = (index: number) => { const option = variant.options[index]; if (option) onDecide(option.decision) }
  approvalDetailState.open = fullscreen

  useInput((char, key) => {
    if (key.ctrl && char === "a") { setFullscreen((open) => !open); return }
    if (key.ctrl || key.meta) return
    if (key.upArrow) { selectedRef.current = Math.max(0, selectedRef.current - 1); setSelected(selectedRef.current); return }
    if (key.downArrow) { selectedRef.current = Math.min(variant.options.length - 1, selectedRef.current + 1); setSelected(selectedRef.current); return }
    if (key.return) { choose(selectedRef.current); return }
    const shortcut = variant.options.findIndex((option) => option.key === char.toLowerCase())
    if (shortcut >= 0) choose(shortcut)
  }, { isActive: !fullscreen })

  if (fullscreen) return <PermissionCommandPreview command={request.patch?.text ?? request.pattern} open onOpenChange={setFullscreen} label={request.tool} linePrefix={SHELL_TOOLS.has(request.tool) ? "$ " : ""} />

  const dim = theme.textDim
  const width = Math.max(10, columns - 4)
  return (
    <Box flexDirection="column">
      <Text> </Text>
      <Box flexDirection="column" paddingLeft={2}>
        {wrapSpans([{ text: variant.title }], width).map((row, index) => <Text key={index} bold>{row[0]?.text}</Text>)}
      </Box>
      {variant.header.map((line, index) => (
        <Box key={index} flexDirection="column" marginTop={1} paddingLeft={2}>
          {line.text.split("\n").flatMap((part, partIndex) => wrapSpans<HeaderSpan>([
            ...(partIndex > 0 ? [] : line.command ? [{ text: "$ ", color: theme.accent }] : line.label ? [{ text: line.label }] : []),
            { text: part, italic: Boolean(line.italic) },
          ], width)).map((row, rowIndex) => (
            <Text key={rowIndex}>{row.map((span, spanIndex) => <Text key={spanIndex} italic={Boolean(span.italic)} {...(span.color ? { color: span.color } : {})}>{span.text}</Text>)}</Text>
          ))}
        </Box>
      ))}
      <Box flexDirection="column" marginTop={2}>
        {variant.options.map((option, index) => {
          const active = index === selected
          const tone = active ? { color: theme.accent, bold: true } : {}
          // Long labels wrap with a hanging indent under the label, as in Codex.
          return (
            <Box key={option.key} flexDirection="row">
              <Text {...tone}>{active ? `${glyph("prompt")} ` : "  "}{index + 1}. </Text>
              <Box flexShrink={1}>
                <Text wrap="wrap" {...tone}>
                  {option.label} <Text color={active ? theme.accent : dim}>(</Text><Text bold>{option.key}</Text><Text color={active ? theme.accent : dim}>)</Text>
                </Text>
              </Box>
            </Box>
          )
        })}
      </Box>
      <Box marginTop={1}>
        <Text color={dim}>  Press <Text bold>enter</Text> to confirm or <Text bold>esc</Text> to cancel</Text>
      </Box>
    </Box>
  )
}
