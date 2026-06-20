/**
 * StartupBanner — Aurict başlangıç banner'ı
 *
 * Sol tarafta gradient sphere (logo), sağ tarafta version/provider/model/workdir.
 * Design system primitive'leri (Surface, HStack, VStack, Center, Divider, Typo) ile
 * inşa edilmiştir.
 */

import React from "react"
import { Text } from "ink"
import { HStack, VStack, Center, Divider, Typo, Badge } from "./design-system/index.js"
import { useTheme } from "../utils/theme.js"

// Gradient sphere — mavi → cyan → teal
// Her satır daha dar (üst/alt) veya geniş (orta) — 3D küre hissi
const SPHERE: Array<{ row: string; color: string }> = [
  { row: "    ░▒▓████▓▒░    ",     color: "#1e3a8a" },  // koyu mavi (üst kenar)
  { row: "  ░▒▓██████████▓▒░  ",   color: "#1d4ed8" },  // mavi
  { row: " ▒▓████████████████▓▒ ", color: "#0284c7" },  // açık mavi
  { row: " ▓██████████████████▓ ", color: "#06b6d4" },  // cyan (en parlak)
  { row: " ▒▓████████████████▓▒ ", color: "#0d9488" },  // teal
  { row: "  ░▒▓██████████▓▒░  ",   color: "#0f766e" },  // koyu teal
  { row: "    ░▒▓████▓▒░    ",     color: "#134e4a" },  // çok koyu teal (alt kenar)
]

// AURICT harflerinin renkleri (gradient)
const LOGO_COLORS = ["#f59e0b", "#d97706", "#06b6d4", "#0891b2", "#1d4ed8", "#2563eb"]
const LOGO_LETTERS = ["A", "U", "R", "I", "C", "T"]

interface Props {
  version:  string
  provider: string
  model:    string
  workdir:  string
}

export function StartupBanner({ version, provider, model, workdir }: Props) {
  const theme = useTheme()
  const user  = process.env["USER"] || process.env["USERNAME"] || "user"
  const dir   = workdir.replace(process.env["HOME"] ?? "", "~")

  return (
    <HStack paddingX="md" paddingY="sm" gap="lg" borderStyle="round" borderColor={theme.borderDim}>
      {/* Sol — gradient sphere */}
      <Center>
        <VStack>
          {SPHERE.map((s, i) => (
            <Text key={i} color={s.color}>{s.row}</Text>
          ))}
        </VStack>
      </Center>

      {/* Dikey ayraç */}
      <Divider orientation="vertical" color={theme.borderDim} />

      {/* Sağ — bilgiler */}
      <VStack justify="center" gap="none">

        {/* Logo yazısı (gradient harfler) */}
        <HStack marginBottom="sm">
          {LOGO_LETTERS.map((letter, i) => (
            <Text key={i} color={LOGO_COLORS[i] ?? "#06b6d4"} bold>{letter}</Text>
          ))}
          <Text color="#475569">{"  v"}{version}</Text>
        </HStack>

        {/* Ayırıcı çizgi */}
        <Divider color={theme.borderDim} />

        {/* Model + Provider */}
        <HStack gap="xs" marginTop="sm">
          <Typo variant="body" tone="dim">{provider}</Typo>
          <Typo variant="body" tone="muted">·</Typo>
          <Typo variant="body" tone="secondary">{model}</Typo>
        </HStack>

        {/* Workdir + user */}
        <HStack gap="xs">
          <Typo variant="body" tone="muted">{user}</Typo>
          <Typo variant="body" tone="muted">@</Typo>
          <Typo variant="body" tone="dim">{dir}</Typo>
        </HStack>

        {/* Ayırıcı çizgi (boşluk bırakır) */}
        <Divider color={theme.borderDim} />

        {/* Kısa ipuçları — Badge olarak */}
        <HStack gap="sm" marginTop="sm">
          <Badge tone="info" variant="ghost">/help</Badge>
          <Badge tone="info" variant="ghost">/models</Badge>
          <Badge tone="info" variant="ghost">/memory</Badge>
          <Badge tone="info" variant="ghost">/btw</Badge>
        </HStack>
        <Typo variant="caption" tone="muted" dimColor>type a message or / for commands</Typo>
      </VStack>
    </HStack>
  )
}
