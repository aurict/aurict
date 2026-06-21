/**
 * HistorySearch — Ters komut geçmişi araması (Ctrl+R)
 *
 * Bash/zsh tarzı reverse search. Kullanıcı yazdıkça history'de
 * fuzzy match yapılır. Enter ile seçilir, Esc ile kapatılır.
 *
 * Özellikler:
 * - Gerçek zamanlı fuzzy matching
 * - ↑↓ ile sonuçlar arasında gezinme
 * - Tab ile otomatik tamamlama
 * - Eşleşen kısım vurgulama
 */

import React, { useState, useEffect, useMemo, useRef } from "react"
import { Box, Text, useInput } from "ink"
import { useTheme } from "../utils/theme.js"
import { HStack, VStack, Surface, Typo } from "./design-system/index.js"

interface Props {
  history:    string[]
  onSelect:   (text: string) => void
  onClose:    () => void
}

/**
 * Fuzzy match — arama teriminin tüm karakterleri hedef string'de sırayla var mı?
 * Eşleşen pozisyonları döndürür (highlight için).
 */
function fuzzyMatch(query: string, target: string): { score: number; positions: number[] } | null {
  if (!query) return { score: 0, positions: [] }

  const q = query.toLowerCase()
  const t = target.toLowerCase()
  const positions: number[] = []
  let qi = 0
  let score = 0
  let lastMatchIdx = -2

  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      positions.push(ti)
      // Ardışık eşleşme bonusu
      if (ti === lastMatchIdx + 1) score += 3
      // Başlangıç bonusu
      else if (ti === 0) score += 2
      else score += 1
      lastMatchIdx = ti
      qi++
    }
  }

  // Tüm karakterler eşleşmediyse null
  if (qi < q.length) return null

  // Kısa hedef + çok eşleşme = yüksek skor
  score += Math.max(0, 10 - (target.length - query.length))

  return { score, positions }
}

/**
 * Eşleşen pozisyonları vurgulayarak metni render et
 */
function HighlightedText({ text, positions, theme }: { text: string; positions: number[]; theme: ReturnType<typeof useTheme> }) {
  const posSet = new Set(positions)
  const parts: Array<{ char: string; highlighted: boolean }> = []

  for (let i = 0; i < text.length; i++) {
    parts.push({ char: text[i]!, highlighted: posSet.has(i) })
  }

  // Ardışık highlighted karakterleri grupla
  const groups: Array<{ text: string; highlighted: boolean }> = []
  for (const part of parts) {
    const last = groups[groups.length - 1]
    if (last && last.highlighted === part.highlighted) {
      last.text += part.char
    } else {
      groups.push({ text: part.char, highlighted: part.highlighted })
    }
  }

  return (
    <Text>
      {groups.map((g, i) => (
        <Text key={i} color={g.highlighted ? theme.accent : theme.textPrimary} bold={g.highlighted}>
          {g.text}
        </Text>
      ))}
    </Text>
  )
}

export function HistorySearch({ history, onSelect, onClose }: Props) {
  const theme = useTheme()
  const [query, setQuery] = useState("")
  const [selectedIdx, setSelectedIdx] = useState(0)
  const inputRef = useRef(query)
  useEffect(() => { inputRef.current = query }, [query])

  // Fuzzy match sonuçları
  const matches = useMemo(() => {
    if (!query) {
      // Arama terimi yoksa son 20 history öğesini göster
      return history.slice(-20).reverse().map((text, i) => ({
        text,
        score: 0,
        positions: [] as number[],
        index: history.length - 1 - i,
      }))
    }

    const results: Array<{ text: string; score: number; positions: number[]; index: number }> = []
    // Tersten ara (en son kullanılan önce)
    for (let i = history.length - 1; i >= 0; i--) {
      const match = fuzzyMatch(query, history[i]!)
      if (match) {
        results.push({
          text: history[i]!,
          score: match.score,
          positions: match.positions,
          index: i,
        })
      }
    }

    // Skora göre sırala (en yüksek önce)
    results.sort((a, b) => b.score - a.score)
    return results.slice(0, 10)
  }, [query, history])

  // Selected index bounds kontrolü
  useEffect(() => {
    if (selectedIdx >= matches.length) {
      setSelectedIdx(Math.max(0, matches.length - 1))
    }
  }, [matches.length, selectedIdx])

  useInput((input, key) => {
    // Esc: kapat
    if (key.escape) {
      onClose()
      return
    }

    // Enter: seçili öğeyi al
    if (key.return) {
      const selected = matches[selectedIdx]
      if (selected) {
        onSelect(selected.text)
      }
      return
    }

    // ↑↓: sonuçlar arasında gezin
    if (key.upArrow) {
      setSelectedIdx(i => Math.max(0, i - 1))
      return
    }
    if (key.downArrow) {
      setSelectedIdx(i => Math.min(matches.length - 1, i + 1))
      return
    }

    // Tab: ilk sonucu otomatik tamamla
    if (key.tab) {
      const first = matches[0]
      if (first) {
        onSelect(first.text)
      }
      return
    }

    // Backspace
    if (key.backspace || key.delete) {
      setQuery(q => q.slice(0, -1))
      return
    }

    // Ctrl+C: kapat
    if (key.ctrl && input === "c") {
      onClose()
      return
    }

    // Karakter ekle
    if (input && !key.ctrl && !key.meta) {
      setQuery(q => q + input)
      return
    }
  })

  return (
    <Surface variant="raised" tone="accent" paddingX="sm" paddingY="sm" marginX="md">
      <VStack gap="sm">
        {/* Başlık */}
        <HStack gap="sm">
          <Typo variant="bodyEmphasis" tone="accent">⌕</Typo>
          <Typo variant="bodyEmphasis" tone="accent">reverse search</Typo>
          <Typo variant="caption" tone="muted" dimColor>(Ctrl+R)</Typo>
        </HStack>

        {/* Arama input'u */}
        <HStack gap="sm">
          <Typo variant="body" tone="muted">❯</Typo>
          <Text color={theme.textPrimary}>{query || <Text color={theme.textDim} dimColor>type to search...</Text>}</Text>
          <Text color={theme.accent}>▋</Text>
        </HStack>

        {/* Sonuçlar */}
        {matches.length > 0 && (
          <VStack gap="none" paddingLeft="md">
            {matches.map((m, i) => (
              <Box key={m.index}>
                {i === selectedIdx && (
                  <Text color={theme.accent}>▶ </Text>
                )}
                {i !== selectedIdx && <Text color={theme.borderBright}>  </Text>}
                <HighlightedText
                  text={m.text.length > 60 ? m.text.slice(0, 57) + "…" : m.text}
                  positions={m.positions}
                  theme={theme}
                />
              </Box>
            ))}
          </VStack>
        )}

        {/* Sonuç yoksa */}
        {query && matches.length === 0 && (
          <Typo variant="body" tone="muted" dimColor>  No matches found</Typo>
        )}

        {/* Yardım */}
        <HStack gap="md" paddingLeft="md">
          <Typo variant="caption" tone="muted" dimColor>↑↓ navigate</Typo>
          <Typo variant="caption" tone="muted" dimColor>Enter select</Typo>
          <Typo variant="caption" tone="muted" dimColor>Tab complete</Typo>
          <Typo variant="caption" tone="muted" dimColor>Esc close</Typo>
        </HStack>
      </VStack>
    </Surface>
  )
}
