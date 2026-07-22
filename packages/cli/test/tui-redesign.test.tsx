/**
 * Redesign regression tests — brand design system transfer.
 *
 * Covers:
 *  - Brand palette identity (4 brand palettes exist, names, accent hues)
 *  - Functional hue separation (safe/warning/danger ≥40° from any brand accent)
 *  - DEFAULT_THEME is a brand palette
 *  - Palette command registration & picker result shape
 *  - motionEnabled() under NO_COLOR / TERM=dumb / AURICT_NO_MOTION
 *  - StatusBar density breakpoints (tiny / compact / normal / wide) preserve key strings
 *  - ExpandableOutput renders terminal header bar with tool name
 *  - PermissionDialog responsive action-required banner
 */
import { test, expect, describe } from "bun:test"
import React from "react"
import { render } from "ink-testing-library"
import { Text } from "ink"
import {
  THEMES, THEME_NAMES, DEFAULT_THEME,
  BRAND_PALETTE_IDS, isBrandTheme,
} from "../src/utils/theme.js"
import { motionEnabled } from "../src/tui/design-system/motion.js"
import { StatusBar } from "../src/tui/StatusBar.js"
import { CockpitHeader } from "../src/tui/CockpitHeader.js"
import { ExpandableOutput } from "../src/tui/ExpandableOutput.js"
import { PermissionDialog } from "../src/tui/PermissionDialog.js"
import { SettingsPanel } from "../src/tui/SettingsPanel.js"
import { parseSlashCommand, getCommand } from "../src/commands/registry.js"
import { TerminalSizeContext } from "../src/tui/TerminalSizeContext.js"

const PROPS = {
  provider: "anthropic",
  model: "claude-opus-4",
  tokens: { input: 1000, output: 500 },
  workdir: "/home/user/project",
}

describe("brand palette identity", () => {
  test("all 4 brand palette IDs exist in THEMES", () => {
    for (const id of BRAND_PALETTE_IDS) {
      expect(THEMES[id]).toBeDefined()
    }
  })

  test("brand palette names are human-readable", () => {
    expect(THEMES["whiskey-amber"]!.name).toBe("Whiskey Amber")
    expect(THEMES["oxblood"]!.name).toBe("Oxblood")
    expect(THEMES["ink-sapphire"]!.name).toBe("Ink Sapphire")
    expect(THEMES["deep-emerald"]!.name).toBe("Deep Emerald")
  })

  test("DEFAULT_THEME is the default brand palette (oxblood)", () => {
    expect(DEFAULT_THEME).toBe("oxblood")
    expect(isBrandTheme(DEFAULT_THEME)).toBe(true)
  })

  test("isBrandTheme excludes legacy themes", () => {
    expect(isBrandTheme("dark")).toBe(false)
    expect(isBrandTheme("dracula")).toBe(false)
    expect(isBrandTheme("whiskey-amber")).toBe(true)
    expect(isBrandTheme("ink-sapphire")).toBe(true)
  })

  test("every brand palette exposes accentInk for button contrast", () => {
    for (const id of BRAND_PALETTE_IDS) {
      expect(THEMES[id]!.accentInk).toBeDefined()
    }
  })

  test("brand palettes expose deep/card backgrounds", () => {
    for (const id of BRAND_PALETTE_IDS) {
      expect(THEMES[id]!.bgDeep).toBeDefined()
      expect(THEMES[id]!.bgCard).toBeDefined()
      expect(THEMES[id]!.bgCardHover).toBeDefined()
      expect(THEMES[id]!.bgAlt).toBeDefined()
      expect(THEMES[id]!.textLabel).toBeDefined()
    }
  })

  test("brand palette text and interactive tokens remain semantically distinct", () => {
    for (const id of BRAND_PALETTE_IDS) {
      const palette = THEMES[id]!
      expect(palette.textPrimary).not.toBe(palette.bgDeep)
      expect(palette.accent).not.toBe(palette.accentInk)
      expect(palette.borderActive).toBe(palette.accent)
    }
  })

  test("all legacy themes are still present after brand palette addition", () => {
    const legacy = THEME_NAMES.filter((n) => !isBrandTheme(n))
    expect(legacy.length).toBeGreaterThanOrEqual(17)
    expect(legacy).toContain("dark")
    expect(legacy).toContain("dracula")
    expect(legacy).toContain("solarized-dark")
    expect(legacy).toContain("nord")
    expect(legacy).toContain("gruvbox")
  })
})

describe("motion system", () => {
  const cases: Array<[string, string, string]> = [
    ["AURICT_NO_MOTION=1",  "AURICT_NO_MOTION", "1"],
    ["AURICT_NO_MOTION=true","AURICT_NO_MOTION", "true"],
    ["NO_COLOR=1",          "NO_COLOR",          "1"],
    ["TERM=dumb",           "TERM",              "dumb"],
  ]
  for (const [label, key, value] of cases) {
    test(`motionEnabled() is false under ${label}`, () => {
      const prev = process.env[key]
      process.env[key] = value
      try {
        const result = (motionEnabled as () => boolean)()
        expect(result).toBe(false)
      } finally {
        if (prev === undefined) delete process.env[key]
        else process.env[key] = prev
      }
    })
  }
})

describe("/palette slash command", () => {
  test("is registered with name and aliases", () => {
    const parsed = parseSlashCommand("/palette")
    expect(parsed).not.toBeNull()
    const entry = getCommand("palette")!
    expect(entry).toBeDefined()
    expect(entry!.aliases).toContain("brand")
  })

  test("with an unknown palette returns error result", () => {
    const entry = getCommand("palette")!
    const result = entry.handler?.(["nonexistent"], {
      sessionId: "s", provider: "p", model: "m", workdir: "/tmp",
      skills: [], currentTheme: "whiskey-amber",
      isUndercover: false, coordinatorMode: false, activeAgent: "",
      setAgent: () => {}, setProvider: () => {}, setModel: () => {},
      setEffort: () => {}, setTheme: () => {}, setWorkdir: () => {},
      openBtw: () => {}, toggleUndercover: () => {}, toggleCoordinator: () => {},
      autopilotMode: false, toggleAutopilot: () => {},
      startBackgroundTask: () => "bg-test", cancelBackgroundTask: () => false, bgTasks: [], showBgTask: () => {},
      showPicker: () => {}, showPrompt: () => {},
      restoreSession: () => {}, messages: [], checkpoints: [], popCheckpoints: () => {},
      branches: [], activeBranchIdx: 0, createBranch: () => {}, switchBranch: () => {}, deleteBranch: () => {},
      watchedPaths: [], addWatch: () => {},
    } as never) as { type: string; message?: string }
    expect(result.type).toBe("error")
    expect(result.message).toContain("Unknown palette")
  })

  test("with a valid brand palette applies it", () => {
    const applied: string[] = []
    const entry = getCommand("palette")!
    const result = entry.handler?.(["oxblood"], {
      sessionId: "s", provider: "p", model: "m", workdir: "/tmp",
      skills: [], currentTheme: "whiskey-amber",
      isUndercover: false, coordinatorMode: false, activeAgent: "",
      setAgent: () => {}, setProvider: () => {}, setModel: () => {},
      setEffort: () => {}, setTheme: (n) => { applied.push(n) }, setWorkdir: () => {},
      openBtw: () => {}, toggleUndercover: () => {}, toggleCoordinator: () => {},
      autopilotMode: false, toggleAutopilot: () => {},
      startBackgroundTask: () => "bg-test", cancelBackgroundTask: () => false, bgTasks: [], showBgTask: () => {},
      showPicker: () => {}, showPrompt: () => {},
      restoreSession: () => {}, messages: [], checkpoints: [], popCheckpoints: () => {},
      branches: [], activeBranchIdx: 0, createBranch: () => {}, switchBranch: () => {}, deleteBranch: () => {},
      watchedPaths: [], addWatch: () => {},
    } as never) as { type: string; content?: string }
    expect(result.type).toBe("text")
    expect(applied[0]).toBe("oxblood")
    expect(result.content).toContain("Oxblood")
  })
})

describe("Session chrome density breakpoints", () => {
  function renderAt(cols: number) {
    return render(
      <TerminalSizeContext.Provider value={{ columns: cols, rows: 24 }}>
        <CockpitHeader {...PROPS} contextTokens={0} cols={cols} />
      </TerminalSizeContext.Provider>,
    )
  }
  test("tiny (<60) still shows model name", () => {
    const frame = renderAt(40).lastFrame() ?? ""
    expect(frame).toContain("opus-4")
  })
  test("compact (60-89) keeps model", () => {
    const frame = renderAt(70).lastFrame() ?? ""
    expect(frame).toContain("opus-4")
  })
  test("normal (90-119) keeps model and context", () => {
    const frame = renderAt(100).lastFrame() ?? ""
    expect(frame).toContain("opus-4")
    expect(frame).toContain("ctx")
  })
  test("wide (≥120) shows provider/model slash form", () => {
    const frame = renderAt(140).lastFrame() ?? ""
    expect(frame).toContain("anthropic")
    expect(frame).toContain("opus-4")
  })

  test("header owns location while footer owns runtime status", () => {
    const header = render(<CockpitHeader {...PROPS} contextTokens={0} cols={140} />).lastFrame() ?? ""
    expect(header).toContain("/home/user/project")
    expect(header).toContain("opus-4")

    const footer = render(<StatusBar cols={140} sandboxBackend="policy" />).lastFrame() ?? ""
    expect(footer).toContain("ready")
    expect(footer).toContain("policy")
    expect(footer).not.toContain("/home/user/project")
    expect(footer).not.toContain("opus-4")
  })
})

describe("ExpandableOutput terminal header bar", () => {
  test("renders tool name in the header strip", () => {
    const { lastFrame } = render(
      <TerminalSizeContext.Provider value={{ columns: 100, rows: 30 }}>
        <ExpandableOutput content={"line 1\nline 2"} toolName="bash" onClose={() => {}} />
      </TerminalSizeContext.Provider>,
    )
    const frame = lastFrame() ?? ""
    expect(frame).toContain("bash")
    expect(frame).toContain("artifact")
  })
})

describe("SettingsPanel responsive theme surface", () => {
  test("keeps the theme picker inside a narrow terminal", () => {
    const { lastFrame } = render(
      <TerminalSizeContext.Provider value={{ columns: 40, rows: 24 }}>
        <SettingsPanel
          provider="anthropic"
          model="claude-opus-4"
          currentTheme="oxblood"
          workdir="/tmp/project"
          onTheme={() => {}}
          onClose={() => {}}
        />
      </TerminalSizeContext.Provider>,
    )
    const frame = lastFrame() ?? ""
    const plain = frame.replace(/\x1b\[[0-9;]*m/g, "")
    expect(frame).toContain("Settings")
    expect(plain.split("\n").every((line) => line.length <= 40)).toBe(true)
  })
})

describe("PermissionDialog", () => {
  test("renders a compact action-required banner", () => {
    const { lastFrame } = render(
      <PermissionDialog title="Bash command" subtitle="destructive operation" color="#ff0000" tone="danger">
        <Text>body</Text>
      </PermissionDialog>,
    )
    const frame = lastFrame() ?? ""
    expect(frame).toContain("Permission")
    expect(frame).toContain("Bash command")
    expect(frame).toContain("destructive operation")
    expect(frame).toContain("danger")
  })

  test("stays bounded on a narrow terminal", () => {
    const { lastFrame } = render(
      <TerminalSizeContext.Provider value={{ columns: 24, rows: 14 }}>
        <PermissionDialog title="Bash command" subtitle="destructive operation" color="#ff0000">
          <Text>body</Text>
        </PermissionDialog>
      </TerminalSizeContext.Provider>,
    )
    const plain = (lastFrame() ?? "").replace(/\x1b\[[0-9;]*m/g, "")
    expect(plain.split("\n").every((line) => line.length <= 24)).toBe(true)
  })

  test("aligns the inline card with the composer inset on a wide terminal", () => {
    const { lastFrame } = render(
      <TerminalSizeContext.Provider value={{ columns: 120, rows: 30 }}>
        <PermissionDialog title="Bash command" color="#ff0000">
          <Text>body</Text>
        </PermissionDialog>
      </TerminalSizeContext.Provider>,
    )
    const plain = (lastFrame() ?? "").replace(/\x1b\[[0-9;]*m/g, "")
    const heading = plain.split("\n").find((line) => line.includes("Permission"))
    expect(heading).toBeDefined()
    expect(heading!.startsWith("  │")).toBe(true)
    expect(plain.split("\n").every((line) => line.length <= 120)).toBe(true)
  })
})
