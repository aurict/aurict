/**
 * KeyboardShortcuts — an overlay showing all keyboard shortcuts
 *
 * Opened with the ? key. Shows a categorized list of shortcuts.
 * Closed with Esc.
 */

import React from "react"
import { Box, Text, useInput } from "./design-system/renderer.js"
import { useTheme } from "../utils/theme.js"
import { HStack, VStack, Surface, Typo } from "./design-system/index.js"

interface Props {
  onClose: () => void
}

interface ShortcutGroup {
  title: string
  shortcuts: Array<{ keys: string; description: string }>
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: "General",
    shortcuts: [
      { keys: "Esc",        description: "Close overlay / Exit (when empty)" },
      { keys: "Ctrl+C",     description: "Abort current task / Exit (twice)" },
      { keys: "?",          description: "Show this help" },
      { keys: "Tab",        description: "Cycle through agents" },
    ],
  },
  {
    title: "Navigation",
    shortcuts: [
      { keys: "Ctrl+F",     description: "Find in conversation" },
      { keys: "Ctrl+Shift+F", description: "Search saved sessions" },
      { keys: "Ctrl+R",     description: "Reverse history search" },
      { keys: "Ctrl+P",     description: "Command palette" },
      { keys: "Ctrl+T",     description: "Toggle task panel" },
      { keys: "Ctrl+X",     description: "Cycle subagent views" },
      { keys: "← →",        description: "Navigate subagent views" },
    ],
  },
  {
    title: "Input",
    shortcuts: [
      { keys: "Enter",      description: "Send message" },
      { keys: "Shift+Enter", description: "New line" },
      { keys: "Ctrl+V",     description: "Paste from clipboard" },
      { keys: "Ctrl+A",     description: "Attach file" },
      { keys: "Ctrl+E",     description: "Edit last user message" },
      { keys: "↑ ↓",        description: "Navigate input history" },
      { keys: "Ctrl+← →",   description: "Jump by word" },
      { keys: "Ctrl+W",     description: "Delete word backward" },
      { keys: "Ctrl+Z",     description: "Undo input edit" },
      { keys: "Ctrl+Shift+Z / Alt+Z", description: "Redo input edit" },
    ],
  },
  {
    title: "Output",
    shortcuts: [
      { keys: "Ctrl+O",     description: "Inspect latest tool, diff, or reasoning" },
      { keys: "Ctrl+Y / Alt+Y", description: "Copy last response / code block" },
      { keys: "[ / ]",      description: "Browse transcript details while inspecting" },
      { keys: "Ctrl+S",     description: "Open settings" },
    ],
  },
  {
    title: "Input Modes",
    shortcuts: [
      { keys: "/",          description: "Start command (e.g. /help, /clear)" },
      { keys: "@file.ts",   description: "Attach file context" },
      { keys: "@file.ts:fn", description: "Attach specific symbol" },
    ],
  },
]

export function KeyboardShortcuts({ onClose }: Props) {
  const theme = useTheme()

  useInput((_input, key) => {
    if (key.escape || (key.ctrl && _input === "c")) {
      onClose()
    }
  })

  return (
    <Surface variant="raised" tone="accent" paddingX="md" paddingY="sm" marginX="md">
      <VStack gap="sm">
        {/* Title */}
        <HStack gap="sm">
          <Typo variant="heading" tone="accent">⌨ Keyboard Shortcuts</Typo>
        </HStack>

        {/* Gruplar */}
        {SHORTCUT_GROUPS.map((group) => (
          <VStack key={group.title} gap="none">
            <Typo variant="bodyEmphasis" tone="secondary">{group.title}</Typo>
            <VStack gap="none" paddingLeft="md">
              {group.shortcuts.map((s) => (
                <HStack key={s.keys} gap="md">
                  <Box width={16}>
                    <Text color={theme.accent} bold>{s.keys}</Text>
                  </Box>
                  <Typo variant="body" tone="muted">{s.description}</Typo>
                </HStack>
              ))}
            </VStack>
          </VStack>
        ))}

        {/* Footer */}
        <HStack gap="md" paddingLeft="md">
          <Typo variant="caption" tone="muted" dimColor>Esc close</Typo>
          <Typo variant="caption" tone="muted" dimColor>type / for commands</Typo>
        </HStack>
      </VStack>
    </Surface>
  )
}
