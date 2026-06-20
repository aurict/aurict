import React, { useState } from "react"
import { Box, Text, useInput } from "ink"
import { useTheme } from "../utils/theme.js"
import { THEMES, THEME_NAMES } from "../utils/theme.js"
import { Typo, HStack, VStack, Badge } from "./design-system/index.js"
import { loadConfig } from "@aurict/core"

type Tab = "general" | "theme" | "keybindings" | "advanced"

interface Setting {
  key:     string
  label:   string
  value:   string
  hint?:   string
}

interface Props {
  provider:       string
  model:          string
  currentTheme:   string
  workdir:        string
  onTheme:        (name: string) => void
  onClose:        () => void
}

const TABS: Array<{ id: Tab; label: string }> = [
  { id: "general",     label: "General" },
  { id: "theme",       label: "Theme" },
  { id: "keybindings", label: "Keybindings" },
  { id: "advanced",    label: "Advanced" },
]

const KEYBINDING_ROWS = [
  { key: "Ctrl+C",       action: "Abort / Exit" },
  { key: "Ctrl+F",       action: "Quick Search" },
  { key: "Ctrl+P",       action: "Command Palette" },
  { key: "Ctrl+E",       action: "Edit last message" },
  { key: "Ctrl+T",       action: "Task Panel" },
  { key: "Ctrl+A",       action: "Add attachment" },
  { key: "Ctrl+O",       action: "Expand tool output" },
  { key: "Ctrl+X",       action: "View subagent" },
  { key: "Tab",          action: "Cycle agents" },
  { key: "Esc",          action: "Close overlay / cancel" },
  { key: "↑↓",           action: "Input history" },
  { key: "Enter",        action: "Send message" },
  { key: "Shift+Enter",  action: "Newline (multiline)" },
]

export function SettingsPanel({ provider, model, currentTheme, workdir, onTheme, onClose }: Props) {
  const theme   = useTheme()
  const [tab,    setTab]   = useState<Tab>("general")
  const [cursor, setCursor] = useState(0)

  const tabIdx = TABS.findIndex(t => t.id === tab)

  useInput((input, key) => {
    if (key.escape) { onClose(); return }

    // Tab switching with left/right
    if (key.leftArrow)  { const i = Math.max(0, tabIdx - 1); setTab(TABS[i]!.id); setCursor(0); return }
    if (key.rightArrow) { const i = Math.min(TABS.length - 1, tabIdx + 1); setTab(TABS[i]!.id); setCursor(0); return }
    if (key.upArrow)    { setCursor(c => Math.max(0, c - 1)); return }
    if (key.downArrow)  { setCursor(c => c + 1); return }

    // Theme tab: Enter to select theme
    if (tab === "theme" && key.return) {
      const name = THEME_NAMES[cursor]
      if (name) onTheme(name)
      return
    }
  })

  const cfg = (() => { try { return loadConfig(workdir) } catch { return null } })()

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={theme.accent}
      paddingX={1}
      width={70}
    >
      {/* Header */}
      <HStack gap="lg" marginBottom="xs">
        <Typo variant="bodyEmphasis" tone="primary">Settings</Typo>
        <Typo variant="caption" tone="muted">←→ tabs  ↑↓ navigate  Esc close</Typo>
      </HStack>

      {/* Tabs */}
      <HStack gap="md" marginBottom="xs">
        {TABS.map((t, i) => (
          <Text
            key={t.id}
            color={tab === t.id ? theme.accent : theme.textDim}
            bold={tab === t.id}
            underline={tab === t.id}
          >{t.label}</Text>
        ))}
      </HStack>
      <Text color={theme.borderDim}>{"─".repeat(66)}</Text>

      {/* General tab */}
      {tab === "general" && (
        <VStack gap="none">
          {[
            { label: "Provider",    value: provider },
            { label: "Model",       value: model },
            { label: "Theme",       value: currentTheme },
            { label: "Workdir",     value: workdir.replace(process.env["HOME"] ?? "", "~") },
            { label: "Config",      value: cfg ? "loaded" : "default" },
            { label: "Compaction",  value: cfg?.compaction?.strategy ?? "balanced" },
          ].map((row, i) => (
            <HStack key={i} gap="md">
              <Text color={theme.textDim} dimColor>{row.label.padEnd(14)}</Text>
              <Text color={theme.textPrimary}>{row.value}</Text>
            </HStack>
          ))}
          <Text color={theme.borderDim} dimColor>{"─".repeat(40)}</Text>
          <Typo variant="caption" tone="muted">Use /config to change provider/model settings</Typo>
          <Typo variant="caption" tone="muted">Use /theme to change theme interactively</Typo>
        </VStack>
      )}

      {/* Theme tab */}
      {tab === "theme" && (
        <VStack gap="none">
          <Typo variant="caption" tone="muted">Enter to apply theme</Typo>
          {THEME_NAMES.map((name, i) => {
            const selected = i === Math.min(cursor, THEME_NAMES.length - 1)
            const active   = name === currentTheme
            return (
              <HStack key={name} gap="sm">
                <Text color={selected ? theme.accent : theme.borderDim}>{selected ? "▶" : " "}</Text>
                <Text color={selected ? theme.textPrimary : theme.textSecondary} bold={active}>
                  {THEMES[name]?.name ?? name}
                </Text>
                {active && <Badge tone="success" variant="ghost">active</Badge>}
              </HStack>
            )
          })}
        </VStack>
      )}

      {/* Keybindings tab */}
      {tab === "keybindings" && (
        <VStack gap="none">
          <Typo variant="caption" tone="muted" dimColor>Default keybindings (not yet rebindable)</Typo>
          {KEYBINDING_ROWS.map((row, i) => (
            <HStack key={i} gap="md">
              <Text color={theme.accent} bold>{row.key.padEnd(16)}</Text>
              <Text color={theme.textSecondary}>{row.action}</Text>
            </HStack>
          ))}
        </VStack>
      )}

      {/* Advanced tab */}
      {tab === "advanced" && (
        <VStack gap="none">
          {[
            { label: "Compaction strategy",  value: cfg?.compaction?.strategy ?? "balanced" },
            { label: "Tail turns",           value: String(cfg?.compaction?.tailTurns ?? 6) },
            { label: "Max steps",            value: "20" },
            { label: "Session DB",           value: "~/.aurict/sessions.db" },
            { label: "Companion state",      value: "~/.aurict/companion.json" },
            { label: "Templates",            value: "~/.aurict/templates/" },
            { label: "Stash",               value: "~/.aurict/stash/stashes.json" },
            { label: "Crash reports",        value: "~/.aurict/crash/" },
          ].map((row, i) => (
            <HStack key={i} gap="md">
              <Text color={theme.textDim} dimColor>{row.label.padEnd(22)}</Text>
              <Text color={theme.textPrimary}>{row.value}</Text>
            </HStack>
          ))}
          <Text color={theme.borderDim} dimColor>{"─".repeat(40)}</Text>
          <Typo variant="caption" tone="muted">Edit ~/.aurict/config.json to change advanced settings</Typo>
        </VStack>
      )}
    </Box>
  )
}
