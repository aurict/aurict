/**
 * TUI regression tests — 2026-07 bug fix round:
 *   1. Coalesced arrow-key sequences must be split (key repeat drops)
 *   2. CommandSuggest must scroll past the visible window
 *   3. FullscreenLayout overlay must not lose rows when space is tight
 *   4. Picker page size must show more than one item on small terminals
 */
import { test, expect, describe } from "bun:test"
import React from "react"
import { render } from "ink-testing-library"
import { Box, Text } from "ink"
import stringWidth from "string-width"
import { FullscreenLayout } from "../src/tui/FullscreenLayout.js"
import { OverlayStack } from "../src/tui/app-shell/OverlayStack.js"
import { Picker } from "../src/tui/Picker.js"
import { CommandSuggest, getCommandMatches } from "../src/tui/CommandSuggest.js"
import { splitCoalescedKeys } from "../src/tui/mouse.js"
import { TerminalSizeContext } from "../src/tui/TerminalSizeContext.js"
import type { CommandDef } from "../src/commands/types.js"

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms))

describe("splitCoalescedKeys", () => {
  test("splits repeated down arrows into individual keypresses", () => {
    expect(splitCoalescedKeys("\x1b[B\x1b[B\x1b[B")).toEqual(["\x1b[B", "\x1b[B", "\x1b[B"])
  })

  test("splits mixed navigation sequences", () => {
    expect(splitCoalescedKeys("\x1b[A\x1b[B\x1b[1;5C\x1b[6~")).toEqual([
      "\x1b[A", "\x1b[B", "\x1b[1;5C", "\x1b[6~",
    ])
  })

  test("leaves single keypresses untouched", () => {
    expect(splitCoalescedKeys("\x1b[B")).toBeNull()
    expect(splitCoalescedKeys("a")).toBeNull()
  })

  test("does not split bracketed paste or plain text", () => {
    expect(splitCoalescedKeys("\x1b[200~hello\nworld\x1b[201~")).toBeNull()
    expect(splitCoalescedKeys("hello world")).toBeNull()
    expect(splitCoalescedKeys("\x1b[Bhello")).toBeNull()
  })
})

// ── CommandSuggest window scrolling ───────────────────────────────────────────

function makeCommands(n: number): CommandDef[] {
  return Array.from({ length: n }, (_, i) => ({
    name: `zcmd${String(i).padStart(2, "0")}`,
    description: `Test command number ${i}`,
    execute: async () => ({ type: "message", text: "" }) as never,
  })) as unknown as CommandDef[]
}

describe("CommandSuggest windowed scrolling", () => {
  test("stays within a narrow terminal and preserves Unicode glyphs", async () => {
    const commands = [{
      name: "review",
      description: "Review değişikliklerini satır satır incele",
      aliases: ["r"],
    }] as CommandDef[]
    const r = render(
      <TerminalSizeContext.Provider value={{ columns: 32, rows: 18 }}>
        <CommandSuggest filter="rev" commands={commands} isActive onExecute={() => {}} onFill={() => {}} />
      </TerminalSizeContext.Provider>,
    )
    await sleep(20)
    const lines = (r.lastFrame() ?? "").split("\n")
    expect(lines.some((line) => line.includes("/review"))).toBe(true)
    expect(lines.every((line) => stringWidth(line) <= 32)).toBe(true)
    r.unmount()
  })

  test("down arrow scrolls past the visible window", async () => {
    const cmds = makeCommands(20)
    const r = render(
      <TerminalSizeContext.Provider value={{ columns: 100, rows: 30 }}>
        <CommandSuggest filter="" commands={cmds} isActive onExecute={() => {}} onFill={() => {}} />
      </TerminalSizeContext.Provider>,
    )
    await sleep(30)
    // 6 visible — go down 10 times: the selection should land on the 11th command (index 10)
    for (let i = 0; i < 10; i++) {
      r.stdin.write("\x1b[B")
      await sleep(5)
    }
    await sleep(30)
    const frame = r.lastFrame() ?? ""
    // Codex popups mark the selection with a filled row, not a marker or counter.
    expect(frame).toContain("/zcmd10")          // the selected item is visible in the window
    expect(frame).not.toContain("/zcmd00")       // window scrolled, first item off-screen
    expect(frame).not.toContain("11/20")
    r.unmount()
  })

  test("enter executes the scrolled-to command", async () => {
    const cmds = makeCommands(20)
    let executed = ""
    const r = render(
      <TerminalSizeContext.Provider value={{ columns: 100, rows: 30 }}>
        <CommandSuggest filter="" commands={cmds} isActive onExecute={(n) => { executed = n }} onFill={() => {}} />
      </TerminalSizeContext.Provider>,
    )
    await sleep(30)
    for (let i = 0; i < 8; i++) {
      r.stdin.write("\x1b[B")
      await sleep(5)
    }
    r.stdin.write("\r")
    await sleep(30)
    expect(executed).toBe("zcmd08")
    r.unmount()
  })
})

describe("getCommandMatches broader matching", () => {
  const cmds = [
    { name: "model",       description: "Select model",  aliases: ["m"] },
    { name: "checkpoints", description: "List saved checkpoints", aliases: ["cp"] },
    { name: "compact",     description: "Compact context" },
  ] as unknown as CommandDef[]

  test("single-char substring matches command names", () => {
    // "o" → model, checkpoints, compact (hepsinde 'o' var)
    const names = getCommandMatches("o", cmds).map((c) => c.name)
    expect(names).toContain("model")
    expect(names).toContain("compact")
  })

  test("fuzzy subsequence matches", () => {
    const names = getCommandMatches("mdl", cmds).map((c) => c.name)
    expect(names).toContain("model")
  })
})

// ── Root overlay integrity ────────────────────────────────────────────────────

describe("OverlayStack", () => {
  test("renders above the layout without taking a flex slot", async () => {
    const items = [
      { id: "anthropic", label: "Anthropic", hint: "no key" },
      { id: "openai",    label: "OpenAI",    hint: "no key" },
      { id: "google",    label: "Google",    hint: "no key" },
      { id: "azure",     label: "Azure OpenAI", hint: "no key" },
      { id: "opencode",  label: "OpenCode (Zen)", hint: "no key" },
    ]
    const header = (
      <Box flexDirection="column">
        {Array.from({ length: 8 }, (_, i) => <Text key={i}>header line {i}</Text>)}
      </Box>
    )
    const scrollable = (
      <Box flexDirection="column">
        {Array.from({ length: 6 }, (_, i) => <Text key={i}>message {i}</Text>)}
      </Box>
    )
    const bottom = (
      <Box flexDirection="column">
        {Array.from({ length: 4 }, (_, i) => <Text key={i}>bottom {i}</Text>)}
      </Box>
    )
    const overlay = (
      <TerminalSizeContext.Provider value={{ columns: 80, rows: 20 }}>
        <Picker title="Select Provider" items={items} onSelect={() => {}} onCancel={() => {}} />
      </TerminalSizeContext.Provider>
    )
    const r = render(
      <Box position="relative" width={80} height={20}>
        <FullscreenLayout rows={20} header={header} scrollable={scrollable} bottom={bottom} />
        <OverlayStack open columns={80} rows={20}>{overlay}</OverlayStack>
      </Box>,
    )
    await sleep(60)
    const frame = r.lastFrame() ?? ""
    // The title and the SELECTED row (previously disappearing rows) should be visible
    expect(frame).toContain("Select Provider")
    expect(frame).toContain("› 1. Anthropic")
    r.unmount()
  })

  test("can preserve workspace context behind a compact decision card", async () => {
    const workspace = (
      <Box flexDirection="column">
        {Array.from({ length: 20 }, (_, i) => <Text key={i}>workspace line {i}</Text>)}
      </Box>
    )
    const r = render(
      <Box position="relative" width={80} height={20}>
        {workspace}
        <OverlayStack open columns={80} rows={20} backdrop={false}>
          <Box borderStyle="round" paddingX={1}>
            <Text>Permission card</Text>
          </Box>
        </OverlayStack>
      </Box>,
    )
    await sleep(30)
    const frame = r.lastFrame() ?? ""
    expect(frame).toContain("workspace line 2")
    expect(frame).toContain("Permission card")
    r.unmount()
  })
})

describe("Picker wide-glyph rows", () => {
  test("double-cell glyphs in hints do not create phantom blank rows", async () => {
    const items = [
      { id: "anthropic", label: "Anthropic", hint: "● active  ✗ no key" },
      { id: "openai",    label: "OpenAI",    hint: "✗ no key" },
      { id: "openrouter",label: "OpenRouter",hint: "✗ no key" },
    ]
    const r = render(
      <TerminalSizeContext.Provider value={{ columns: 110, rows: 40 }}>
        <Picker title="Select Provider" items={items} onSelect={()=>{}} onCancel={()=>{}} />
      </TerminalSizeContext.Provider>,
    )
    await sleep(60)
    const lines = (r.lastFrame() ?? "").split("\n")
    const anthropicIdx = lines.findIndex((l) => l.includes("Anthropic"))
    const openaiIdx    = lines.findIndex((l) => l.includes("OpenAI"))
    expect(anthropicIdx).toBeGreaterThan(-1)
    // The rows should be adjacent — no blank row caused by wrapping in between
    expect(openaiIdx).toBe(anthropicIdx + 1)
    r.unmount()
  })
})

describe("Picker page size", () => {
  test("does not force a minimum width larger than the terminal", async () => {
    const r = render(
      <TerminalSizeContext.Provider value={{ columns: 28, rows: 18 }}>
        <Picker title="Choose a model" items={[{ id: "m", label: "A very long model label" }]} onSelect={() => {}} onCancel={() => {}} />
      </TerminalSizeContext.Provider>,
    )
    await sleep(20)
    expect((r.lastFrame() ?? "").split("\n").every((line) => stringWidth(line) <= 28)).toBe(true)
    r.unmount()
  })

  test("small terminals still show multiple items", async () => {
    const items = Array.from({ length: 8 }, (_, i) => ({ id: `p${i}`, label: `Provider ${i}` }))
    const r = render(
      <TerminalSizeContext.Provider value={{ columns: 80, rows: 24 }}>
        <Picker title="Pick" items={items} onSelect={() => {}} onCancel={() => {}} />
      </TerminalSizeContext.Provider>,
    )
    await sleep(30)
    const frame = r.lastFrame() ?? ""
    expect(frame).toContain("Provider 0")
    expect(frame).toContain("Provider 1")   // previously pageSize=1: only a single item was visible
    expect(frame).toContain("Provider 2")
    r.unmount()
  })
})
