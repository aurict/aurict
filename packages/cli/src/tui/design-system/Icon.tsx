/**
 * Design System — Icon
 *
 * Tutarlı ikon sistemi. Üç seviye fallback:
 * 1. Nerd Font (modern terminal) — zengin semboller
 * 2. Unicode (varsayılan) — çapraz terminal uyumluluğu
 * 3. ASCII (legacy) — en eski terminal'ler
 *
 * Otomatik algılama: $AURICT_ICON_SET veya terminal capability probe.
 */

import React from "react"
import { Text } from "ink"
import { useTheme } from "../../utils/theme.js"

// ── Icon set tipi ──────────────────────────────────────────────────────────────

export type IconSet = "nerd" | "unicode" | "ascii"

// ── Capability detection ───────────────────────────────────────────────────────

let cachedIconSet: IconSet | null = null

export function detectIconSet(): IconSet {
  if (cachedIconSet) return cachedIconSet
  const env = process.env["AURICT_ICON_SET"]?.toLowerCase()
  if (env === "nerd" || env === "unicode" || env === "ascii") {
    cachedIconSet = env
    return cachedIconSet
  }
  // Otomatik: TERM, LC_ALL, LANG kontrolü
  const term = (process.env["TERM"] ?? "").toLowerCase()
  const termProgram = (process.env["TERM_PROGRAM"] ?? "").toLowerCase()
  if (termProgram === "iterm.app" || termProgram === "apple_terminal" || termProgram === "vscode") {
    cachedIconSet = "unicode"
  } else if (term.includes("xterm-256color") || term.includes("screen-256color") || term.includes("tmux-256color")) {
    cachedIconSet = "unicode"
  } else {
    cachedIconSet = "unicode"
  }
  return cachedIconSet
}

// ── Icon registry ──────────────────────────────────────────────────────────────
// Her ikon, üç set için tanımlanır. Eksikse unicode'a fallback.

export type IconName =
  // Prompt / input
  | "prompt" | "promptDisabled" | "inputCursor"
  // Status
  | "success" | "error" | "warning" | "info" | "pending" | "running" | "done"
  // Arrows
  | "arrowRight" | "arrowLeft" | "arrowUp" | "arrowDown" | "arrowReturn"
  | "chevronRight" | "chevronLeft" | "chevronUp" | "chevronDown"
  // Actions
  | "check" | "cross" | "plus" | "minus" | "edit" | "delete" | "save" | "close"
  | "search" | "filter" | "settings" | "help" | "exit"
  // UI
  | "menu" | "expand" | "collapse" | "more" | "less" | "ellipsis" | "bullet"
  | "star" | "heart" | "fire" | "sparkle" | "brain" | "memory" | "compass"
  // Tools
  | "tool" | "bash" | "read" | "write" | "edit-file" | "search-file"
  | "web" | "subagent" | "memory-tool" | "question" | "plan"
  // Misc
  | "user" | "bot" | "folder" | "file" | "branch" | "tag" | "clock" | "calendar"
  | "eye" | "lock" | "unlock" | "key" | "lightning" | "compass-rose"

const ICONS_NERD: Partial<Record<IconName, string>> = {
  prompt:         "❯",
  promptDisabled: "○",
  inputCursor:    "▍",
  success:        "✓",
  error:          "✗",
  warning:        "⚠",
  info:           "ℹ",
  pending:        "○",
  running:        "◉",
  done:           "●",
  arrowRight:     "→",
  arrowLeft:      "←",
  arrowUp:        "↑",
  arrowDown:      "↓",
  arrowReturn:    "↵",
  chevronRight:   "▸",
  chevronLeft:    "◂",
  chevronUp:      "▴",
  chevronDown:    "▾",
  check:          "✔",
  cross:          "✘",
  plus:           "＋",
  minus:          "−",
  edit:           "✎",
  delete:         "🗑",
  save:           "💾",
  close:          "✕",
  search:         "🔍",
  filter:         "▼",
  settings:       "⚙",
  help:           "❓",
  exit:           "⎋",
  menu:           "☰",
  expand:         "⊞",
  collapse:       "⊟",
  more:           "▾",
  less:           "▴",
  ellipsis:       "…",
  bullet:         "•",
  star:           "★",
  heart:          "♥",
  fire:           "🔥",
  sparkle:        "✦",
  brain:          "🧠",
  memory:         "💭",
  compass:        "🧭",
  tool:           "🛠",
  bash:           "$",
  read:           "≡",
  write:          "✎",
  "edit-file":    "✎",
  "search-file":  "🔎",
  web:            "🌐",
  subagent:       "⇢",
  "memory-tool":  "🧠",
  question:       "❔",
  plan:           "◈",
  user:           "👤",
  bot:            "🤖",
  folder:         "📁",
  file:           "📄",
  branch:         "⎇",
  tag:            "#",
  clock:          "⏱",
  calendar:       "📅",
  eye:            "👁",
  lock:           "🔒",
  unlock:         "🔓",
  key:            "🔑",
  lightning:      "⚡",
  "compass-rose": "✦",
}

const ICONS_UNICODE: Record<IconName, string> = {
  prompt:         "❯",
  promptDisabled: "○",
  inputCursor:    "▋",
  success:        "✓",
  error:          "✗",
  warning:        "⚠",
  info:           "ℹ",
  pending:        "○",
  running:        "◉",
  done:           "●",
  arrowRight:     "→",
  arrowLeft:      "←",
  arrowUp:        "↑",
  arrowDown:      "↓",
  arrowReturn:    "↵",
  chevronRight:   "▸",
  chevronLeft:    "◂",
  chevronUp:      "▴",
  chevronDown:    "▾",
  check:          "✓",
  cross:          "✗",
  plus:           "+",
  minus:          "-",
  edit:           "✎",
  delete:         "⌫",
  save:           "↓",
  close:          "✕",
  search:         "⌕",
  filter:         "▼",
  settings:       "⚙",
  help:           "?",
  exit:           "⎋",
  menu:           "≡",
  expand:         "⊞",
  collapse:       "⊟",
  more:           "▾",
  less:           "▴",
  ellipsis:       "…",
  bullet:         "•",
  star:           "★",
  heart:          "♥",
  fire:           "▲",
  sparkle:        "✦",
  brain:          "◉",
  memory:         "○",
  compass:        "✸",
  tool:           "◆",
  bash:           "$",
  read:           "≡",
  write:          "✎",
  "edit-file":    "✎",
  "search-file":  "⌕",
  web:            "◉",
  subagent:       "⇢",
  "memory-tool":  "◉",
  question:       "?",
  plan:           "◈",
  user:           "❯",
  bot:            "●",
  folder:         "▢",
  file:           "▭",
  branch:         "⎇",
  tag:            "#",
  clock:          "⏱",
  calendar:       "▦",
  eye:            "◉",
  lock:           "⚿",
  unlock:         "○",
  key:            "⚷",
  lightning:      "⚡",
  "compass-rose": "✦",
}

const ICONS_ASCII: Record<IconName, string> = {
  prompt:         ">",
  promptDisabled: "o",
  inputCursor:    "|",
  success:        "OK",
  error:          "!!",
  warning:        "!?",
  info:           "i",
  pending:        "o",
  running:        "*",
  done:           "*",
  arrowRight:     "->",
  arrowLeft:      "<-",
  arrowUp:        "^",
  arrowDown:      "v",
  arrowReturn:    "<-",
  chevronRight:   ">",
  chevronLeft:    "<",
  chevronUp:      "^",
  chevronDown:    "v",
  check:          "+",
  cross:          "x",
  plus:           "+",
  minus:          "-",
  edit:           "~",
  delete:         "x",
  save:           "v",
  close:          "x",
  search:         "?",
  filter:         "v",
  settings:       "*",
  help:           "?",
  exit:           "x",
  menu:           "=",
  expand:         "+",
  collapse:       "-",
  more:           "v",
  less:           "^",
  ellipsis:       "...",
  bullet:         "*",
  star:           "*",
  heart:          "<3",
  fire:           "^",
  sparkle:        "*",
  brain:          "@",
  memory:         "o",
  compass:        "*",
  tool:           "*",
  bash:           "$",
  read:           "=",
  write:          "~",
  "edit-file":    "~",
  "search-file":  "?",
  web:            "@",
  subagent:       ">",
  "memory-tool":  "@",
  question:       "?",
  plan:           "#",
  user:           ">",
  bot:            "*",
  folder:         "[+]",
  file:           "[-]",
  branch:         "|",
  tag:            "#",
  clock:          "t",
  calendar:       "#",
  eye:            "o",
  lock:           "[#]",
  unlock:         "[ ]",
  key:            "k",
  lightning:      "!",
  "compass-rose": "*",
}

// ── Public API ─────────────────────────────────────────────────────────────────

export function getIcon(name: IconName, set?: IconSet): string {
  const useSet = set ?? detectIconSet()
  if (useSet === "nerd")   return ICONS_NERD[name]   ?? ICONS_UNICODE[name]
  if (useSet === "ascii")  return ICONS_ASCII[name]
  return ICONS_UNICODE[name]
}

// ── React component ────────────────────────────────────────────────────────────

export interface IconProps {
  name:  IconName
  set?:  IconSet
  color?: string
  bold?:  boolean
}

export function Icon({ name, set, color, bold }: IconProps) {
  const theme = useTheme()
  const sym   = getIcon(name, set)
  const c     = color ?? theme.textPrimary
  return (
    <Text color={c} {...(bold ? { bold: true } : {})}>
      {sym}
    </Text>
  )
}

// ── Test/override hook ─────────────────────────────────────────────────────────

export function _setIconSetForTesting(set: IconSet | null) {
  cachedIconSet = set
}
