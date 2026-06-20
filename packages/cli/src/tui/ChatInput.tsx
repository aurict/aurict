/**
 * ChatInput — Kullanıcı giriş alanı
 *
 * Border'lı bir container içinde MultilineInput + prompt işareti + (opsiyonel)
 * queued mesaj göstergesi. Border rengi disabled durumuna göre değişir.
 *
 * Design system: VStack, HStack, Surface, Typo, Icon.
 */

import React from "react"
import { Box } from "ink"
import { MultilineInput } from "./MultilineInput.js"
import { useTheme } from "../utils/theme.js"
import { HStack, VStack, Surface, Typo } from "./design-system/index.js"

interface Props {
  value:              string
  onChange:           (v: string) => void
  onSubmit:           (v: string) => void
  disabled:           boolean
  history?:           string[]
  queued?:            string | undefined
  onPasteTruncated?:  (originalLen: number, truncatedLen: number) => void
}

export function ChatInput({ value, onChange, onSubmit, disabled, history = [], queued, onPasteTruncated }: Props) {
  const theme = useTheme()
  const promptChar = "❯"
  const borderColor = disabled ? theme.borderBright : theme.accent

  return (
    <VStack flexGrow={1} flexShrink={1}>
      {queued && (
        <HStack paddingX="md" gap="xs">
          <Typo variant="body" tone="warning" dimColor>⟳ queued:</Typo>
          <Typo variant="body" tone="muted" dimColor>"{queued.slice(0, 50)}{queued.length > 50 ? "…" : ""}"</Typo>
        </HStack>
      )}

      <Surface
        variant="raised"
        tone="default"
        accentColor={borderColor}
        paddingX="sm"
        paddingY="none"
        flexGrow={1}
        flexShrink={1}
      >
        <HStack flexGrow={1} flexShrink={1} gap="xs">
          <Typo
            variant="bodyEmphasis"
            tone={disabled ? "muted" : "success"}
            bold
          >
            {promptChar}
          </Typo>
          <Box flexGrow={1} flexShrink={1}>
            <MultilineInput
              value={value}
              onChange={onChange}
              onSubmit={onSubmit}
              disabled={disabled}
              history={history}
              {...(onPasteTruncated !== undefined ? { onPasteTruncated } : {})}
            />
          </Box>
          {disabled && <Typo variant="body" tone="muted" dimColor>⟳</Typo>}
        </HStack>
      </Surface>
    </VStack>
  )
}
