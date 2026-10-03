/**
 * ChatInput — User input area (Cockpit v2)
 *
 * MultilineInput + mode indicator + prompt marker inside a bordered
 * container + an (optional) queued-message indicator. A segmented hint bar
 * below. Border color changes based on disabled/paste state.
 *
 * Design system: VStack, HStack, Surface, Typo.
 */

import React from "react"
import { Box, Text } from "./design-system/renderer.js"
import { MultilineInput } from "./MultilineInput.js"
import { useTheme } from "../utils/theme.js"
import { HStack, VStack, Surface, StatusDot, Typo } from "./design-system/index.js"
import { useTerminalSize } from "./TerminalSizeContext.js"
import type { ComposerQueueItem } from "./composer-queue.js"
import { glyph, prefersAsciiGlyphs, terminalText } from "./terminal-glyphs.js"
import { useSemanticTheme } from "./theme/semantic-theme.js"

interface Props {
  value:              string
  onChange:           (v: string) => void
  onSubmit:           (v: string) => void
  onQueue?:           ((v: string) => void) | undefined
  disabled:           boolean
  working?:           boolean | undefined
  history?:           string[]
  queued?:            ComposerQueueItem[] | undefined
  inlineSuggestionActive?: boolean
  onInputTruncated?:  (originalLen: number, truncatedLen: number) => void
  onCopied?:          (charCount: number) => void
}

const MAX_QUEUE_PREVIEW = 3

// Bottom hint-bar cells — chosen based on terminal width
const HINTS: { key: string; label: string }[] = [
  { key: "/", label: "commands" },
  { key: "@", label: "files" },
  { key: "⌃P", label: "more" },
]

export function ChatInput({ value, onChange, onSubmit, onQueue, disabled, working = false, history = [], queued, inlineSuggestionActive = false, onInputTruncated, onCopied }: Props) {
  const theme = useTheme()
  const semantic = useSemanticTheme()
  const promptChar = glyph("headingMinor")
  const borderColor = disabled ? theme.borderDim : working ? theme.accentAlt : theme.borderActive

  const termCols  = useTerminalSize().columns
  const isNarrow  = termCols < 80
  const hints     = termCols >= 100 ? HINTS : HINTS.slice(0, 2)
  const showHints = termCols >= 60
  const charCount = value.length

  const Sep = () => <Text color={theme.borderDim}> {glyph("statusTiny")} </Text>

  return (
    <VStack flexGrow={1} flexShrink={1}>
      {queued && queued.length > 0 && (
        <VStack paddingX="md">
          {queued.slice(0, MAX_QUEUE_PREVIEW).map((item, index) => (
            <HStack key={item.id} gap="sm">
              <Typo variant="body" tone="warning">{index + 1}. {item.kind}</Typo>
              <Typo variant="body" tone="muted" dimColor>"{item.text.replace(/\s+/g, " ").slice(0, 42)}{item.text.length > 42 ? glyph("ellipsis") : ""}"</Typo>
              {index === Math.min(queued.length, MAX_QUEUE_PREVIEW) - 1 && (
                <Typo variant="caption" tone="muted">{queued.length > MAX_QUEUE_PREVIEW ? `+${queued.length - MAX_QUEUE_PREVIEW} more ${glyph("statusTiny")} ` : ""}{prefersAsciiGlyphs() ? "Alt+Up" : "⌥↑"} edit last</Typo>
              )}
            </HStack>
          ))}
        </VStack>
      )}

      <Surface
        variant="raised"
        tone="default"
        accentColor={borderColor}
        {...(theme.bgCard !== undefined ? { backgroundColor: theme.bgCard } : {})}
        paddingX="md"
        paddingY="none"
        flexGrow={1}
        flexShrink={1}
      >
        {!isNarrow && (
          <HStack justify="space-between">
            <HStack gap="sm">
              <StatusDot tone={disabled ? "muted" : working ? "accent" : "safe"} active={working} size="sm" />
              <Typo variant="caption" tone={working ? "accentAlt" : "muted"} bold>
                {working ? "STEER" : "PROMPT"}
              </Typo>
              <Typo variant="caption" tone="muted">
                {working ? "agent is running" : "workspace input"}
              </Typo>
            </HStack>
            <HStack gap="sm">
              {(queued?.length ?? 0) > 0 && <Typo variant="caption" tone="warning">queue {queued!.length}</Typo>}
              {charCount > 0 && <Typo variant="caption" tone="muted">{charCount.toLocaleString()} chars</Typo>}
            </HStack>
          </HStack>
        )}
        <HStack flexGrow={1} flexShrink={1} gap="xs">
          <Typo
            variant="bodyEmphasis"
            tone={disabled ? "muted" : "accentAlt"}
            bold
          >
            {promptChar}
          </Typo>
          <Box flexGrow={1} flexShrink={1}>
            <MultilineInput
              value={value}
              onChange={onChange}
              onSubmit={onSubmit}
              {...(working && onQueue ? { onQueue } : {})}
              disabled={disabled}
              history={history}
              inlineSuggestionActive={inlineSuggestionActive}
              placeholder={working ? "Steer the next step…" : "Ask Aurict to plan, explain, or build…"}
              {...(onInputTruncated !== undefined ? { onInputTruncated } : {})}
              {...(onCopied !== undefined ? { onCopied } : {})}
            />
          </Box>
          {isNarrow && charCount > 0 && <Typo variant="caption" tone="muted" dimColor>{charCount.toLocaleString()}</Typo>}
        </HStack>
      </Surface>

      {showHints && (
        <HStack paddingX="md" justify="space-between">
          <HStack gap="none">
            {hints.map((h, i) => (
              <React.Fragment key={h.key}>
                {i > 0 && <Sep />}
                <Text color={semantic.status.info} bold>{terminalText(h.key)}</Text>
                <Text color={theme.textDim}> {h.label}</Text>
              </React.Fragment>
            ))}
          </HStack>
          <Text color={theme.textDim}>
            {working ? `Enter steer ${glyph("statusTiny")} Tab queue` : `${terminalText("⇧⏎")} newline ${glyph("statusTiny")} Enter send`}
          </Text>
        </HStack>
      )}
    </VStack>
  )
}
