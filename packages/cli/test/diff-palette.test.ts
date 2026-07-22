import { describe, expect, test } from "bun:test"
import React from "react"
import { render } from "ink-testing-library"
import { THEMES } from "../src/utils/theme.js"
import { getDiffPalette } from "../src/tui/DiffRenderer/palette.js"
import { DiffRenderer } from "../src/tui/DiffRenderer/index.js"
import { TerminalSizeContext } from "../src/tui/TerminalSizeContext.js"
import { ThemeContext } from "../src/utils/theme.js"
import { KeybindingsProvider } from "../src/keybindings/index.js"
import { TranscriptRows } from "../src/tui/TranscriptRows.js"
import { projectStableTranscript } from "../src/tui/conversation/projector.js"

describe("diff palette", () => {
  test("derives distinct add, remove, and word-highlight surfaces", () => {
    const palette = getDiffPalette(THEMES["oxblood"]!)

    expect(palette.addBg).not.toBe(palette.baseBg)
    expect(palette.removeBg).not.toBe(palette.baseBg)
    expect(palette.addWordBg).not.toBe(palette.addBg)
    expect(palette.removeWordBg).not.toBe(palette.removeBg)
  })

  test("keeps diff surfaces usable in the light palette", () => {
    const palette = getDiffPalette(THEMES.light!)

    expect(palette.addBg).toMatch(/^#[\da-f]{6}$/i)
    expect(palette.removeBg).toMatch(/^#[\da-f]{6}$/i)
    expect(palette.hunkBg).toMatch(/^#[\da-f]{6}$/i)
  })

  test("renders a readable unified diff with line and word changes", () => {
    const { lastFrame } = render(
      React.createElement(
        ThemeContext.Provider,
        { value: THEMES["oxblood"]! },
        React.createElement(
          KeybindingsProvider,
          { initialContext: "modal", overrides: {} },
          React.createElement(
            TerminalSizeContext.Provider,
            { value: { columns: 100, rows: 30 } },
            React.createElement(DiffRenderer, {
              rawDiff: "--- a/example.ts\n+++ b/example.ts\n@@ -1 +1 @@\n-const status = 'old'\n+const status = 'new'",
              initialMode: "unified",
              width: 72,
            }),
          ),
        ),
      ),
    )
    const frame = lastFrame() ?? ""

    expect(frame).toContain("example.ts")
    expect(frame).toContain("status = 'old'")
    expect(frame).toContain("status = 'new'")
  })

  test("renders projected change rows through the real transcript component", () => {
    const rows = projectStableTranscript([{
      id: "change",
      role: "tool_call",
      tool: "edit",
      content: JSON.stringify({ path: "example.ts" }),
      resultContent: "Updated example.ts\n__UNIFIED_DIFF__\n--- a/example.ts\n+++ b/example.ts\n@@ -1,1 +1,1 @@\n-old value\n+new value",
    }], 80)
    const { lastFrame } = render(
      React.createElement(
        ThemeContext.Provider,
        { value: THEMES["oxblood"]! },
        React.createElement(TranscriptRows, { rows }),
      ),
    )
    const frame = lastFrame() ?? ""
    expect(frame).toContain("example.ts")
    expect(frame).toContain("old value")
    expect(frame).toContain("new value")
  })
})
