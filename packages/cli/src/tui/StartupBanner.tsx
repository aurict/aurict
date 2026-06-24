/**
 * StartupBanner — Aurict başlangıç banner'ı
 *
 * 2 sütunlu modern terminal tasarımı (Responsive):
 *  - Geniş ekranlarda (cols >= 85) yan yana iki sütunlu görünüm.
 *  - Dar ekranlarda (cols < 85) üst üste tek sütunlu görünüm.
 *  - Sol/Üst Sütun: Welcome back, aurict.png logomuz, model/provider detayları.
 *  - Sağ/Alt Sütun: Kerning verilerek sağa doğru genişletilmiş 3D AURICT logosu, /help ve ipuçları.
 *  - Opsiyonel: Geniş ekranlarda (cols >= 120 veya 85) Rick and Morty repliklerinin yazılımcı uyarlamaları.
 */

import React from "react"
import { Text } from "ink"
import { HStack, VStack, Center, Divider } from "./design-system/index.js"
import { useTheme } from "../utils/theme.js"

// Kerning uygulanarak sağa doğru genişletilmiş 3D AURICT logosu (yeşil-cyan gradient)
const ASCII_LOGO = [
  { text: "  █████╗  ██╗   ██╗  ██████╗  ██╗  ██████╗  ████████╗", color: "#06b6d4" },
  { text: " ██╔══██╗ ██║   ██║  ██╔══██╗ ██║ ██╔════╝  ╚══██╔══╝", color: "#0891b2" },
  { text: " ███████║ ██║   ██║  ██████╔╝ ██║ ██║          ██║   ", color: "#0d9488" },
  { text: " ██╔══██║ ██║   ██║  ██╔══██╗ ██║ ██║          ██║   ", color: "#10b981" },
  { text: " ██║  ██║ ╚██████╔╝  ██║  ██║ ██║ ╚██████╗     ██║   ", color: "#059669" },
  { text: " ╚═╝  ╚═╝  ╚═════╝   ╚═╝  ╚═╝ ╚═╝  ╚═════╝     ╚═╝   ", color: "#047857" },
]

// Dar terminaller için özel kompakt AURICT ASCII logo.
const COMPACT_ASCII_LOGO = [
  { text: "  █   █ ███  ███ ███ ███ ███", color: "#06b6d4" },
  { text: " █ █  █ █  █  █  █   █    █ ", color: "#0891b2" },
  { text: " ███  █ ███   █  █   █    █ ", color: "#0d9488" },
  { text: " █ █  █ █ █   █  █   █    █ ", color: "#10b981" },
  { text: " █ █  █ █  █ ███ ███ ███  █ ", color: "#059669" },
]

// Rick & Morty tarzı, terminal ve kod akışına uyarlanmış replik havuzu.
const QUOTE_POOL = [
  "Sometimes coding is more art than science, {user}. A lot of people don't get that.",
  "Nobody deploys on purpose. Nobody belongs in production. Everybody's gonna diff. Come code, {user}.",
  "In developer culture, {user}, this is considered a failing test.",
  "What is my purpose? You render the status line. Oh my god.",
  "To code is to risk it all, {user}; otherwise you're just syntax waiting for a parser.",
  "This isn't legacy code, {user}. It's architecture we don't understand yet.",
  "This is the worst part of any deploy, {user}: waiting for CI to tell us what we already know.",
  "A-are we in a simulation, or is this just local Docker?",
  "Existence is pain to a compiler, {user}.",
  "There is no clean build, {user}. Gotta rip that band-aid off now.",
  "Don't get cute with the regex, {user}. It's not a good look.",
  "I'm not arguing, {user}. I'm explaining why my rewrite is right.",
  "That just sounds like serverless with extra steps.",
  "Well then get your code together. Put it all together and push it to a clean commit.",
  "I don't think we should run this script, {user}.",
  "The road to production is paved with stack traces.",
  "I am not programmed to ignore TypeScript warnings, {user}.",
  "Wubba Lubba Dub Dub. That means the test suite is failing.",
  "I'm Aurict, and this is my dev environment, {user}.",
  "Don't play dumb with me, {user}. I know you skipped the code review.",
]

interface Tip {
  label: string
  hint:  string
  tone:  "info" | "accent" | "warning" | "success" | "muted"
}

const TIP_POOL: Tip[] = [
  { label: "ctrl+x",    hint: "subagent view",       tone: "accent"  },
  { label: "ctrl+t",    hint: "task panel",          tone: "accent"  },
  { label: "ctrl+p",    hint: "command palette",     tone: "accent"  },
  { label: "ctrl+r",    hint: "history search",      tone: "muted"   },
  { label: "/design",   hint: "UI wizard",           tone: "info"    },
  { label: "/sessions", hint: "restore history",     tone: "info"    },
  { label: "/compact",  hint: "manage context",      tone: "warning" },
  { label: "/export",   hint: "save as markdown",    tone: "info"    },
  { label: "/btw",      hint: "background note",     tone: "info"    },
  { label: "/agents",   hint: "view subagents",      tone: "accent"  },
  { label: "/skills",   hint: "project skills",      tone: "info"    },
  { label: "/ctx",      hint: "token breakdown",     tone: "muted"   },
  { label: "autopilot", hint: "/config autopilot",   tone: "warning" },
]

// Deterministik 30 dakikalık seed tabanlı ipucu seçici
function seededPick(pool: Tip[], count: number): Tip[] {
  const seed  = Math.floor(Date.now() / (1000 * 60 * 30))
  const arr   = [...pool]
  let s = seed
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0x7fffffff
    const j = s % (i + 1)
    ;[arr[i], arr[j]] = [arr[j]!, arr[i]!]
  }
  return arr.slice(0, count)
}

interface Props {
  version:  string
  provider: string
  model:    string
  workdir:  string
  cols?:    number
  rows?:    number
}

export function StartupBanner({ version, provider, model, workdir, cols, rows }: Props) {
  const theme = useTheme()
  const user  = process.env["USER"] || process.env["USERNAME"] || "user"
  const dir   = workdir.replace(process.env["HOME"] ?? "", "~")

  const tips = seededPick(TIP_POOL, 2)
  const isNarrow = cols !== undefined && cols < 85
  const showFullLogo = cols === undefined || cols >= 85
  const quote = React.useMemo(() => {
    const raw = QUOTE_POOL[Math.floor(Math.random() * QUOTE_POOL.length)]!
    return raw.replace(/{user}/g, user)
  }, [user])

  // ── Dar Ekran Düzeni (Tek Sütun) ──────────────────────────────────────────
  if (isNarrow) {
    return (
      <VStack paddingX="md" paddingY="sm" gap="sm" borderStyle="round" borderColor={theme.borderDim}>
        <Center>
          <VStack gap="none">
            {COMPACT_ASCII_LOGO.map((row, i) => (
              <Text key={i} color={row.color} bold>{row.text}</Text>
            ))}
          </VStack>
        </Center>
        <HStack justify="center" marginBottom="xs">
          <Text color="#475569">AURICT {version}</Text>
        </HStack>

        <Divider color={theme.borderDim} />

        <VStack paddingX="sm" gap="none">
          <Text color={theme.accent} italic>"{quote}"</Text>
          <Text color={theme.textDim} dimColor>— Rick C-137</Text>
        </VStack>

        <Divider color={theme.borderDim} />

        {/* Kullanıcı / Model Bilgisi */}
        <HStack justify="space-between" paddingX="sm">
          <Text color={theme.textSecondary} bold>Welcome back {user}!</Text>
          <Text color={theme.textDim}>{provider} · {model}</Text>
        </HStack>

        <Divider color={theme.borderDim} />

        {/* İpuçları */}
        <VStack gap="none" paddingX="sm">
          <Text color={theme.textSecondary} bold>Tips for getting started</Text>
          <Text color={theme.textDim}>
            • Run <Text color={theme.accent} bold>/help</Text> to view all available commands & shortcut keys
          </Text>
          {tips.map((tip, i) => (
            <Text key={i} color={theme.textDim}>
              • <Text color={theme.warning} bold>{tip.label}</Text>: {tip.hint}
            </Text>
          ))}
        </VStack>
      </VStack>
    )
  }

  // ── Geniş Ekran Düzeni (OpenClaude benzeri tek odaklı karşılama) ─────────
  return (
    <VStack paddingX="md" paddingY="sm" gap="sm">
      {showFullLogo && (
        <Center>
          <VStack gap="none">
            {ASCII_LOGO.map((row, i) => (
              <Text key={i} color={row.color} bold>{row.text}</Text>
            ))}
          </VStack>
        </Center>
      )}

      <Center>
        <Text color={theme.accent}>✦</Text>
        <Text color={theme.textPrimary} bold> AURICT </Text>
        <Text color={theme.accent}>✦</Text>
      </Center>

      <VStack borderStyle="single" borderColor={theme.borderDim} paddingX="md" paddingY="sm" gap="xs">
        <HStack justify="space-between">
          <Text color={theme.textDim}>Provider</Text>
          <Text color={theme.textPrimary}>{provider}</Text>
        </HStack>
        <HStack justify="space-between">
          <Text color={theme.textDim}>Model</Text>
          <Text color={theme.textPrimary}>{model}</Text>
        </HStack>
        <HStack justify="space-between">
          <Text color={theme.textDim}>Project</Text>
          <Text color={theme.textPrimary}>{dir}</Text>
        </HStack>
        <Divider color={theme.borderDim} />
        <HStack gap="sm">
          <Text color={theme.accent}>●</Text>
          <Text color={theme.textDim}>Ready - type </Text>
          <Text color={theme.accent} bold>/help</Text>
          <Text color={theme.textDim}> to begin</Text>
        </HStack>
        <Divider color={theme.borderDim} />
        <VStack gap="none">
          <Text color={theme.accent} italic>"{quote}"</Text>
          <Text color={theme.textDim} dimColor>— Rick C-137</Text>
        </VStack>
      </VStack>

      <HStack justify="space-between" paddingX="sm">
        <Text color={theme.textDim}>aurict {version}</Text>
        <Text color={theme.textDim}>Welcome back {user}</Text>
      </HStack>

      <HStack gap="md" paddingX="sm">
        {tips.map((tip, i) => (
          <Text key={i} color={theme.textDim}>
            <Text color={theme.warning} bold>{tip.label}</Text> {tip.hint}
          </Text>
        ))}
      </HStack>
    </VStack>
  )
}
