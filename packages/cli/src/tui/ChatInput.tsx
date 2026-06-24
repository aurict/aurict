/**
 * ChatInput — Kullanıcı giriş alanı
 *
 * Border'lı bir container içinde MultilineInput + prompt işareti + (opsiyonel)
 * queued mesaj göstergesi. Border rengi disabled durumuna göre değişir.
 * Paste sırasında border rengi uyarı rengine döner.
 *
 * Input boşken ghost hint gösterilir: "/" komutları ve kısayollar.
 *
 * Design system: VStack, HStack, Surface, Typo, Icon.
 */

import React, { useState } from "react"
import { Box, Text } from "ink"
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

// Ghost hint içeriği — terminale sığacak şekilde kısa tutuldu
const GHOST_HINT_WIDE  = "Try /help, /model, /agents, or paste a file path. Shift+Enter inserts a newline."
const GHOST_HINT_SHORT = "/help  /model  /agents  Shift+Enter newline"

export function ChatInput({ value, onChange, onSubmit, disabled, history = [], queued, onPasteTruncated }: Props) {
  const theme = useTheme()
  const [isPasting, setIsPasting] = useState(false)
  const promptChar = "❯"
  const borderColor = isPasting ? theme.warning : disabled ? theme.borderDim : theme.borderBright

  // Ghost hint: sadece input boş, disabled değil ve paste yokken göster
  const showGhostHint = !disabled && !isPasting && value === "" && !queued

  // Terminal genişliğine göre hint seç
  const termCols  = process.stdout.columns ?? 80
  const ghostHint = termCols >= 100 ? GHOST_HINT_WIDE : GHOST_HINT_SHORT

  return (
    <VStack flexGrow={1} flexShrink={1}>
      {queued && (
        <HStack paddingX="md" gap="xs">
          <Typo variant="body" tone="warning" dimColor>⟳ queued:</Typo>
          <Typo variant="body" tone="muted" dimColor>"{queued.slice(0, 50)}{queued.length > 50 ? "…" : ""}"</Typo>
        </HStack>
      )}

      <Surface
        variant="flat"
        tone="default"
        accentColor={borderColor}
        paddingX="md"
        paddingY="none"
        flexGrow={1}
        flexShrink={1}
      >
        <HStack flexGrow={1} flexShrink={1} gap="xs">
          <Typo
            variant="bodyEmphasis"
            tone={disabled ? "muted" : isPasting ? "warning" : "accent"}
            bold
          >
            {isPasting ? "paste" : promptChar}
          </Typo>
          <Box flexGrow={1} flexShrink={1}>
            <MultilineInput
              value={value}
              onChange={onChange}
              onSubmit={onSubmit}
              disabled={disabled}
              history={history}
              {...(onPasteTruncated !== undefined ? { onPasteTruncated } : {})}
              onPasteStart={() => setIsPasting(true)}
              onPasteEnd={() => setIsPasting(false)}
            />
          </Box>
          {disabled && <Typo variant="body" tone="muted" dimColor>working</Typo>}
        </HStack>
      </Surface>

      {/* Ghost hint — input boşken gösterilir */}
      {showGhostHint && (
        <Box paddingLeft={2}>
          <Text color={theme.borderBright} dimColor>
            {ghostHint}
          </Text>
        </Box>
      )}
    </VStack>
  )
}
