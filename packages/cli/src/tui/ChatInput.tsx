/**
 * ChatInput — the Codex-style composer: no border, a tinted block one row
 * taller than the text on each side, and a `›` prompt in the first column.
 *
 *   • Queued follow-up inputs
 *     ↳ fix the failing test
 *   ▒                                            ▒
 *   ▒› Ask Aurict to do anything                 ▒
 *   ▒                                            ▒
 *
 * Key hints live in the footer below (SessionFooter), not inside the composer.
 */

import React from "react"
import { Box, Text } from "./design-system/renderer.js"
import { MultilineInput } from "./MultilineInput.js"
import { useTheme } from "../utils/theme.js"
import type { ComposerQueueItem } from "./composer-queue.js"
import { glyph, prefersAsciiGlyphs } from "./terminal-glyphs.js"
import { truncateDisplayWidth } from "./terminal-text/display-width.js"
import { useTerminalSize } from "./TerminalSizeContext.js"

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

export function ChatInput({ value, onChange, onSubmit, onQueue, disabled, working = false, history = [], queued, inlineSuggestionActive = false, onInputTruncated, onCopied }: Props) {
  const theme = useTheme()
  const columns = useTerminalSize().columns
  const dim = theme.textDim
  // Same tint as sent user messages (semantic surface.selected), as in Codex.
  const tint = theme.bgCardHover ?? theme.bgHighlight
  const arrow = prefersAsciiGlyphs() ? "->" : "↳"
  const editKey = prefersAsciiGlyphs() ? "alt+up" : "⌥↑"

  return (
    <Box flexDirection="column" flexGrow={1} flexShrink={1}>
      {queued && queued.length > 0 && (
        <Box flexDirection="column" marginBottom={1}>
          <Text><Text dimColor>{glyph("bullet")} </Text><Text>Queued follow-up inputs</Text></Text>
          {queued.slice(0, MAX_QUEUE_PREVIEW).map((item) => (
            <Text key={item.id} wrap="truncate-end"><Text dimColor>  {arrow} </Text><Text dimColor italic>{truncateDisplayWidth(item.text.replace(/\s+/g, " "), Math.max(12, columns - 8), glyph("ellipsis"))}</Text></Text>
          ))}
          {queued.length > MAX_QUEUE_PREVIEW && <Text dimColor>    +{queued.length - MAX_QUEUE_PREVIEW} more</Text>}
          <Text color={dim}>    {editKey} edit last queued message</Text>
        </Box>
      )}

      <Box flexDirection="row" flexGrow={1} flexShrink={1} paddingY={1} {...(tint ? { backgroundColor: tint } : {})}>
        <Box width={2} flexShrink={0}>
          <Text bold color={theme.accent} dimColor={disabled}>{glyph("input")}</Text>
        </Box>
        <Box flexGrow={1} flexShrink={1}>
          <MultilineInput
            value={value}
            onChange={onChange}
            onSubmit={onSubmit}
            {...(working && onQueue ? { onQueue } : {})}
            disabled={disabled}
            history={history}
            inlineSuggestionActive={inlineSuggestionActive}
            placeholder="Ask Aurict to do anything"
            {...(onInputTruncated !== undefined ? { onInputTruncated } : {})}
            {...(onCopied !== undefined ? { onCopied } : {})}
          />
        </Box>
      </Box>
    </Box>
  )
}
