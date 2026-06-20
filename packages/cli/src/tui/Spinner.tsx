import React, { useState, useEffect } from "react"
import { Box, Text } from "ink"
import { useTheme } from "../utils/theme.js"

const FRAMES = ["⠋","⠙","⠹","⠸","⠼","⠴","⠦","⠧","⠇","⠏"]

const VERBS: Record<string, string> = {
  bash:         "Running",
  read:         "Reading",
  write:        "Writing",
  edit:         "Editing",
  glob:         "Searching",
  grep:         "Searching",
  webfetch:     "Fetching",
  websearch:    "Searching",
  todo:         "Checking",
  apply_patch:  "Patching",
  lsp:          "Checking",
  subagent:     "Spawning agent",
  task_create:  "Planning",
  task_update:  "Updating",
  task_complete:"Completing",
  plan_enter:   "Planning",
  plan_verify:  "Verifying",
  undo:         "Undoing",
  question:     "Asking",
}

interface Props {
  activeTool?: string | undefined
}

export function Spinner({ activeTool }: Props) {
  const theme = useTheme()
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setFrame((f) => (f + 1) % FRAMES.length), 80)
    return () => clearInterval(t)
  }, [])

  const verb = activeTool ? (VERBS[activeTool] ?? "Working") : "Thinking"
  const spin = FRAMES[frame]!

  return (
    <Box gap={1} paddingX={2} marginBottom={1}>
      <Text color={theme.accent}>{spin}</Text>
      <Text color={theme.textSecondary}>{verb}<Text color={theme.textDim}>...</Text></Text>
    </Box>
  )
}
