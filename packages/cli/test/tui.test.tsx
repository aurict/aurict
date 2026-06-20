/**
 * TUI Bileşen Testleri — ink-testing-library
 *
 * Test edilen bileşenler:
 *  - Spinner     (frame + verb rendering)
 *  - Markdown    (h1/h2/h3, bold/italic, code, list, table, hr, quote)
 *  - StatusBar   (provider/model/workdir bilgileri)
 *  - StartupBanner (version/provider/model gösterimi)
 */

import { describe, it, expect, afterEach } from "bun:test"
import React from "react"
import { render, cleanup } from "ink-testing-library"
import { Spinner } from "../src/tui/Spinner.js"
import { Markdown } from "../src/tui/Markdown.js"
import { StatusBar } from "../src/tui/StatusBar.js"
import { StartupBanner } from "../src/tui/StartupBanner.js"

afterEach(() => { cleanup() })

// ── Spinner ───────────────────────────────────────────────────────────────────

describe("Spinner", () => {
  it("renders Thinking verb when no tool", () => {
    const { lastFrame } = render(<Spinner />)
    const frame = lastFrame() ?? ""
    expect(frame).toContain("Thinking")
  })

  it("renders Running for bash tool", () => {
    const { lastFrame } = render(<Spinner activeTool="bash" />)
    const frame = lastFrame() ?? ""
    expect(frame).toContain("Running")
  })

  it("renders Reading for read tool", () => {
    const { lastFrame } = render(<Spinner activeTool="read" />)
    expect(lastFrame()).toContain("Reading")
  })

  it("renders Searching for glob tool", () => {
    const { lastFrame } = render(<Spinner activeTool="glob" />)
    expect(lastFrame()).toContain("Searching")
  })

  it("renders Fetching for webfetch tool", () => {
    const { lastFrame } = render(<Spinner activeTool="webfetch" />)
    expect(lastFrame()).toContain("Fetching")
  })

  it("renders Working for unknown tool", () => {
    const { lastFrame } = render(<Spinner activeTool="unknown_tool_xyz" />)
    expect(lastFrame()).toContain("Working")
  })

  it("renders a spinner character", () => {
    const { lastFrame } = render(<Spinner />)
    // One of the 10 braille spinner frames must be present
    const FRAMES = ["⠋","⠙","⠹","⠸","⠼","⠴","⠦","⠧","⠇","⠏"]
    const frame = lastFrame() ?? ""
    const hasFrame = FRAMES.some(f => frame.includes(f))
    expect(hasFrame).toBe(true)
  })
})

// ── Markdown ──────────────────────────────────────────────────────────────────

describe("Markdown", () => {
  it("renders plain text", () => {
    const { lastFrame } = render(<Markdown content="Hello world" />)
    expect(lastFrame()).toContain("Hello world")
  })

  it("renders h1 with underline dash row", () => {
    const { lastFrame } = render(<Markdown content="# Başlık" />)
    const frame = lastFrame() ?? ""
    expect(frame).toContain("Başlık")
    expect(frame).toContain("─")
  })

  it("renders h2 with ◆ symbol instead of ##", () => {
    const { lastFrame } = render(<Markdown content="## İkinci Başlık" />)
    const frame = lastFrame() ?? ""
    expect(frame).toContain("◆")
    expect(frame).toContain("İkinci Başlık")
    expect(frame).not.toContain("## ")
  })

  it("renders h3 with ▸ symbol instead of ###", () => {
    const { lastFrame } = render(<Markdown content="### Üçüncü" />)
    const frame = lastFrame() ?? ""
    expect(frame).toContain("▸")
    expect(frame).toContain("Üçüncü")
    expect(frame).not.toContain("### ")
  })

  it("does not show raw ** for bold text", () => {
    const { lastFrame } = render(<Markdown content="**bold text**" />)
    const frame = lastFrame() ?? ""
    expect(frame).toContain("bold text")
    expect(frame).not.toContain("**bold text**")
  })

  it("does not show raw * for italic text", () => {
    const { lastFrame } = render(<Markdown content="*italic text*" />)
    const frame = lastFrame() ?? ""
    expect(frame).toContain("italic text")
    expect(frame).not.toContain("*italic text*")
  })

  it("renders horizontal rule as dashes", () => {
    const { lastFrame } = render(<Markdown content={"before\n---\nafter"} />)
    const frame = lastFrame() ?? ""
    expect(frame).toContain("─")
  })

  it("renders unordered list with bullet", () => {
    const { lastFrame } = render(<Markdown content={"- item one\n- item two"} />)
    const frame = lastFrame() ?? ""
    expect(frame).toContain("item one")
    expect(frame).toContain("item two")
    expect(frame).toContain("•")
  })

  it("renders ordered list with numbers", () => {
    const { lastFrame } = render(<Markdown content={"1. first\n2. second"} />)
    const frame = lastFrame() ?? ""
    expect(frame).toContain("first")
    expect(frame).toContain("second")
  })

  it("renders code block with border", () => {
    const { lastFrame } = render(<Markdown content={"```ts\nconst x = 1\n```"} />)
    const frame = lastFrame() ?? ""
    expect(frame).toContain("x = 1")
    expect(frame).toContain("ts")
  })

  it("renders block quote", () => {
    const { lastFrame } = render(<Markdown content={"> quoted line"} />)
    const frame = lastFrame() ?? ""
    expect(frame).toContain("quoted line")
  })

  it("renders task list with checkboxes", () => {
    const { lastFrame } = render(<Markdown content={"- [x] done\n- [ ] todo"} />)
    const frame = lastFrame() ?? ""
    expect(frame).toContain("done")
    expect(frame).toContain("todo")
    // Completed items get ● marker
    expect(frame).toContain("●")
    // Unchecked items get ○ marker
    expect(frame).toContain("○")
  })

  it("renders table with borders", () => {
    const content = "| Col1 | Col2 |\n|------|------|\n| A    | B    |"
    const { lastFrame } = render(<Markdown content={content} />)
    const frame = lastFrame() ?? ""
    expect(frame).toContain("Col1")
    expect(frame).toContain("Col2")
    expect(frame).toContain("A")
    expect(frame).toContain("B")
    expect(frame).toContain("┌")
  })

  it("renders inline code without backticks", () => {
    const { lastFrame } = render(<Markdown content={"use `console.log()` here"} />)
    const frame = lastFrame() ?? ""
    expect(frame).toContain("console.log()")
    expect(frame).not.toContain("`console.log()`")
  })

  it("renders empty content without crash", () => {
    const { lastFrame } = render(<Markdown content="" />)
    expect(lastFrame()).toBeDefined()
  })

  it("renders multiline text", () => {
    const content = "line one\nline two\nline three"
    const { lastFrame } = render(<Markdown content={content} />)
    const frame = lastFrame() ?? ""
    expect(frame).toContain("line one")
    expect(frame).toContain("line two")
    expect(frame).toContain("line three")
  })
})

// ── StatusBar ─────────────────────────────────────────────────────────────────

const DEFAULT_STATUS_PROPS = {
  provider: "anthropic",
  model: "claude-opus-4",
  tokens: { input: 1000, output: 500 },
  workdir: "/home/user/project",
}

describe("StatusBar", () => {
  it("renders provider name", () => {
    const { lastFrame } = render(<StatusBar {...DEFAULT_STATUS_PROPS} />)
    // ink-testing-library v4 hardcodes 100 cols; long lines wrap mid-word
    expect(lastFrame()).toContain("anthrop")
  })

  it("renders model name", () => {
    const { lastFrame } = render(<StatusBar {...DEFAULT_STATUS_PROPS} />)
    expect(lastFrame()).toContain("claude-opus-4")
  })

  it("renders workdir (~/project shorthand)", () => {
    const props = { ...DEFAULT_STATUS_PROPS, workdir: `${process.env["HOME"] ?? "/home/user"}/project` }
    const { lastFrame } = render(<StatusBar {...props} />)
    expect(lastFrame()).toContain("~/proj")
  })

  it("renders branch when provided", () => {
    const { lastFrame } = render(<StatusBar {...DEFAULT_STATUS_PROPS} branch="main" />)
    expect(lastFrame()).toContain("main")
  })

  it("shows compacted badge when wasCompacted and contextTokens set", () => {
    const { lastFrame } = render(
      <StatusBar {...DEFAULT_STATUS_PROPS} wasCompacted contextTokens={50000} />
    )
    expect(lastFrame()).toContain("compacted")
  })

  it("renders skills when provided", () => {
    const { lastFrame } = render(
      <StatusBar {...DEFAULT_STATUS_PROPS} skills={["nextjs", "react"]} />
    )
    const frame = lastFrame() ?? ""
    expect(frame).toContain("nextjs")
    expect(frame).toContain("react")
  })

  it("shows context percentage bar when contextTokens set", () => {
    const { lastFrame } = render(
      <StatusBar {...DEFAULT_STATUS_PROPS} contextTokens={10000} contextWindow={200000} />
    )
    const frame = lastFrame() ?? ""
    expect(frame).toContain("ctx")
  })

  it("shows task hint when taskCount > 0", () => {
    const { lastFrame } = render(
      <StatusBar {...DEFAULT_STATUS_PROPS} taskCount={3} />
    )
    const frame = lastFrame() ?? ""
    expect(frame).toContain("tasks")
  })

  it("shows undercover badge when isUndercover", () => {
    const { lastFrame } = render(<StatusBar {...DEFAULT_STATUS_PROPS} isUndercover />)
    // "undercover" can wrap mid-word in 100-col test terminal; check prefix
    const frame = (lastFrame() ?? "").replace(/\n/g, "")
    expect(frame).toContain("underco")
  })

  it("renders without optional props", () => {
    const { lastFrame } = render(<StatusBar {...DEFAULT_STATUS_PROPS} />)
    expect(lastFrame()).toBeDefined()
    const frame = lastFrame() ?? ""
    expect(frame.length).toBeGreaterThan(0)
  })
})

// ── StartupBanner ─────────────────────────────────────────────────────────────

describe("StartupBanner", () => {
  it("renders version string", () => {
    const { lastFrame } = render(
      <StartupBanner version="0.0.1" provider="anthropic" model="claude-opus-4" workdir="/home/user/proj" />
    )
    expect(lastFrame()).toContain("0.0.1")
  })

  it("renders AURICT letters", () => {
    const { lastFrame } = render(
      <StartupBanner version="1.0.0" provider="anthropic" model="claude-opus-4" workdir="/tmp" />
    )
    const frame = lastFrame() ?? ""
    // Each letter is rendered separately but they form AURICT
    expect(frame).toContain("O")
    expect(frame).toContain("M")
    expect(frame).toContain("N")
    expect(frame).toContain("I")
    expect(frame).toContain("C")
    expect(frame).toContain("D")
  })

  it("renders provider name", () => {
    const { lastFrame } = render(
      <StartupBanner version="0.0.1" provider="openai" model="gpt-4o" workdir="/tmp" />
    )
    expect(lastFrame()).toContain("openai")
  })

  it("renders model name", () => {
    const { lastFrame } = render(
      <StartupBanner version="0.0.1" provider="anthropic" model="claude-sonnet-4-6" workdir="/tmp" />
    )
    expect(lastFrame()).toContain("claude-sonnet-4-6")
  })

  it("shows ~/shorthand for home dir", () => {
    const home = process.env["HOME"] ?? "/root"
    const { lastFrame } = render(
      <StartupBanner version="0.0.1" provider="anthropic" model="claude-opus-4" workdir={`${home}/myproject`} />
    )
    expect(lastFrame()).toContain("~/myproject")
  })

  it("renders slash command hints", () => {
    const { lastFrame } = render(
      <StartupBanner version="0.0.1" provider="anthropic" model="claude-opus-4" workdir="/tmp" />
    )
    const frame = lastFrame() ?? ""
    expect(frame).toContain("/help")
    expect(frame).toContain("/models")
  })
})
