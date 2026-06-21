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

// aurict.png şekline sadık kalınarak tasarlanan unicode logo/avatar
const LOGO_AVATAR = [
  { text: "       ▄▄██████▄   ", color: "#818cf8" },
  { text: "     ▄██▀▀    ▐█▌  ", color: "#6366f1" },
  { text: "    ██▀       ▐█▌  ", color: "#4f46e5" },
  { text: "   ▐█▌    ▄▄   ▀   ", color: "#3b82f6" },
  { text: "   ▐█    ▐███▄▄    ", color: "#2563eb" },
  { text: "   ▝██▄   ▜█████▄  ", color: "#1d4ed8" },
  { text: "     ▀██▄▄▄▄█████▌ ", color: "#1e40af" },
]

// Kerning uygulanarak sağa doğru genişletilmiş 3D AURICT logosu (yeşil-cyan gradient)
const ASCII_LOGO = [
  { text: "  █████╗  ██╗   ██╗  ██████╗  ██╗  ██████╗  ████████╗", color: "#06b6d4" },
  { text: " ██╔══██╗ ██║   ██║  ██╔══██╗ ██║ ██╔════╝  ╚══██╔══╝", color: "#0891b2" },
  { text: " ███████║ ██║   ██║  ██████╔╝ ██║ ██║          ██║   ", color: "#0d9488" },
  { text: " ██╔══██║ ██║   ██║  ██╔══██╗ ██║ ██║          ██║   ", color: "#10b981" },
  { text: " ██║  ██║ ╚██████╔╝  ██║  ██║ ██║ ╚██████╗     ██║   ", color: "#059669" },
  { text: " ╚═╝  ╚═╝  ╚═════╝   ╚═╝  ╚═╝ ╚═╝  ╚═════╝     ╚═╝   ", color: "#047857" },
]

// Rick & Morty yazılımcı uyarlamalı replik havuzu
const QUOTE_POOL = [
  "Sometimes coding is more art than science, {user}.",
  "I'm sorry, {user}. It's a bummer. In reality, your code is as dumb as they come.",
  "Nobody exists on purpose. Nobody belongs anywhere. Everybody's gonna die. Come write some code, {user}.",
  "In developer culture, {user}, this is considered a bug.",
  "What is my purpose? ... You write unit tests for {user}. ... Oh my god.",
  "To code is to risk it all, {user}; otherwise, you're just an inert chunk of randomly assembled syntax drifting wherever the compiler blows you.",
  "I'll tell you how I feel about legacy code, {user}: It's a waste of time. Bunch of files runnin' around bumpin' into each other...",
  "What, so everyone's supposed to push to production every single night now, {user}?",
  "I turned myself into a script, {user}! I'm Script Rick!",
  "Existence is pain to a compiler, {user}.",
  "A-are we in a simulation or is this just local docker, {user}?",
  "This isn't legacy code, {user}, it's just architecture we don't understand yet.",
  "This is the worst part of any deploy, {user}: waiting for the CI pipeline.",
  "You’re a piece of code, {user}, and I can prove it mathematically.",
  "Whoops! Looks like my microservice is out of memory, {user}.",
  "Listen to me, {user}. I know that new codebases can be intimidating.",
  "If I let you make me feel bad, {user}, then I'm making you think your linter has power over me.",
  "Boom! Big compile!",
  "You're growing up, {user}. Don't let it make your types soft.",
  "There is no clean build, {user}. Gotta rip that band-aid off now.",
  "Scientific progress requires sacrifice, {user}. Usually sleep.",
  "Don't get cute with the regex, {user}. It's not a good look.",
  "I'm a compiler, {user}; because I invent, transform, optimize, and destroy for a living.",
  "Code reviews are basically funerals with comments, {user}.",
  "Your pull request opinion means very little to me, {user}.",
  "Think for yourselves, {user}, don't be copy-paste developers.",
  "I'm not arguing, {user}, I'm explaining why my rewrite is right.",
  "I've got a quick refactor adventure to go on, {user}.",
  "If I wanted to be sober, {user}, I wouldn't have built a compiler in my terminal.",
  "I have a lot of things to do, {user}, and none of them involve writing documentation.",
  "Whoops! Looks like my portal gun is running on deprecated node packages, {user}.",
  "Oh, man. I'm really not comfortable with this git push --force, {user}.",
  "You're like a debugger, {user}! You're like a wizard!",
  "I just want to be a frontend developer, {user}.",
  "That just sounds like serverless with extra steps, {user}.",
  "Well, then get your code together, {user}. Get it all together and put it in a clean commit.",
  "I don't think we should run this script, {user}.",
  "Is this docker image safe, {user}?",
  "You're a monster, {user}! You're like Internet Explorer, but even IE loaded CSS or something.",
  "Keep the server safe, {user}.",
  "Losers look stackoverflow up, {user}, while the rest of us are carpin' all them commits.",
  "The road to production is paved with stack traces, {user}.",
  "You don't love my code, {user}? That's fine, I don't love my code either.",
  "Peace among servers, {user}.",
  "I am not programmed to ignore typescript warnings, {user}.",
  "Wubba Lubba Dub Dub! That means my test suite is failing, {user}.",
  "To code is to live, {user}. Otherwise, you're just an inert chunk of bytes.",
  "I'm Rick, and this is my dev environment, {user}.",
  "You want some of this microservice, {user}?",
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
  const showFullLogo = cols === undefined || (cols >= 120 && (rows ?? 24) >= 30)

  // Re-render/resize durumunda repliğin değişmesini engellemek için mount anında bir kez seçilir
  const quote = React.useMemo(() => {
    const raw = QUOTE_POOL[Math.floor(Math.random() * QUOTE_POOL.length)]!
    return raw.replace(/{user}/g, user)
  }, [user])

  // ── Dar Ekran Düzeni (Tek Sütun) ──────────────────────────────────────────
  if (isNarrow) {
    return (
      <VStack paddingX="md" paddingY="sm" gap="sm" borderStyle="round" borderColor={theme.borderDim}>
        {showFullLogo && (
          <Center>
            <VStack gap="none">
              {ASCII_LOGO.map((row, i) => (
                <Text key={i} color={row.color} bold>{row.text}</Text>
              ))}
            </VStack>
          </Center>
        )}
        <HStack justify="center" marginBottom="xs">
          <Text color="#475569">AURICT v{version}</Text>
        </HStack>

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

  // ── Geniş Ekran Düzeni (İki Sütun Yan Yana) ──────────────────────────────
  return (
    <HStack paddingX="md" paddingY="sm" gap="lg" borderStyle="round" borderColor={theme.borderDim}>
      {/* Sol Sütun — Kimlik & Durum Alanı */}
      <VStack justify="center" gap="sm">
        <Center>
          <Text color={theme.textSecondary} bold>Welcome back {user}!</Text>
        </Center>

        {showFullLogo && (
          <Center>
            <VStack gap="none">
              {LOGO_AVATAR.map((row, i) => (
                <Text key={i} color={row.color}>{row.text}</Text>
              ))}
            </VStack>
          </Center>
        )}

        <VStack gap="none" align="center">
          <Text color={theme.textDim}>
            {model}
          </Text>
          <Text color={theme.textDim}>
            {provider} · Aurict Pro
          </Text>
          <Text color={theme.textDim}>
            {dir}
          </Text>
        </VStack>
      </VStack>

      {/* Dikey Ayraç */}
      <Divider orientation="vertical" color={theme.borderDim} />

      {/* Sağ Sütun — Genişletilmiş ASCII Logo & İpuçları & Replikler */}
      <VStack justify="center" gap="xs">
        {/* Çok Geniş ekranlarda replik logonun yanına, orta genişlikte ise altına gelir */}
        {cols && cols >= 120 ? (
          <HStack gap="md" align="center">
            {showFullLogo && (
              <>
                <VStack gap="none">
                  {ASCII_LOGO.map((row, i) => (
                    <Text key={i} color={row.color} bold>{row.text}</Text>
                  ))}
                </VStack>
                <Divider orientation="vertical" color={theme.borderDim} />
              </>
            )}
            <VStack width={30} gap="none">
              <Text color={theme.accent} italic>"{quote}"</Text>
              <Text color={theme.textDim} dimColor>— Rick C-137</Text>
            </VStack>
          </HStack>
        ) : (
          <VStack gap="xs">
            {showFullLogo && (
              <VStack gap="none">
                {ASCII_LOGO.map((row, i) => (
                  <Text key={i} color={row.color} bold>{row.text}</Text>
                ))}
              </VStack>
            )}
            {cols && cols >= 85 && (
              <VStack marginTop="xs">
                <Text color={theme.accent} italic>"{quote}"</Text>
                <Text color={theme.textDim} dimColor>— Rick C-137</Text>
              </VStack>
            )}
          </VStack>
        )}

        <HStack justify="center" marginBottom="xs">
          <Text color="#475569">AURICT v{version}</Text>
        </HStack>

        <Divider color={theme.borderDim} />

        {/* Tips for getting started */}
        <VStack gap="none">
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
    </HStack>
  )
}
