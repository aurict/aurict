import { describe, it, expect, afterEach } from "bun:test"
import React from "react"
import { render, cleanup } from "ink-testing-library"
import { StatusBar } from "../src/tui/StatusBar.js"
import { CockpitHeader } from "../src/tui/CockpitHeader.js"
import { TaskFloatingPanel } from "../src/tui/TaskFloatingPanel.js"
import { ExpandableOutput } from "../src/tui/ExpandableOutput.js"
import { Markdown } from "../src/tui/Markdown.js"
import { Message } from "../src/tui/Message.js"
import { StartupBanner } from "../src/tui/StartupBanner.js"
import { CockpitSignal } from "../src/tui/CockpitSignal.js"
import type { Task } from "@aurict/core"

afterEach(() => { cleanup() })

// eslint-disable-next-line no-control-regex
const stripAnsi = (s: string): string => s.replace(/\x1b\[[0-9;]*m/g, "")

const DEFAULT_STATUS_PROPS = {
  provider: "anthropic",
  model: "claude-opus-4-5-20251001",
  tokens: { input: 12_000, output: 3_000 },
  workdir: "/home/user/projects/aurict",
}

function withTerminalSize<T>(cols: number, rows: number, fn: () => T): T {
  const colDesc = Object.getOwnPropertyDescriptor(process.stdout, "columns")
  const rowDesc = Object.getOwnPropertyDescriptor(process.stdout, "rows")
  Object.defineProperty(process.stdout, "columns", { configurable: true, value: cols })
  Object.defineProperty(process.stdout, "rows", { configurable: true, value: rows })
  try {
    return fn()
  } finally {
    if (colDesc) Object.defineProperty(process.stdout, "columns", colDesc)
    else delete (process.stdout as { columns?: number }).columns
    if (rowDesc) Object.defineProperty(process.stdout, "rows", rowDesc)
    else delete (process.stdout as { rows?: number }).rows
  }
}

describe("TUI responsive regression", () => {
  it("keeps startup density stable on wide terminals", () => {
    const medium = render(
      <StartupBanner
        version="v1.1.5"
        provider="opencode"
        model="gemini-3-flash"
        workdir="/home/user/projects/aurict"
        cols={120}
        rows={40}
        quip="Reality compiled. Warnings remain."
      />,
    ).lastFrame() ?? ""
    cleanup()

    const wide = render(
      <StartupBanner
        version="v1.1.5"
        provider="opencode"
        model="gemini-3-flash"
        workdir="/home/user/projects/aurict"
        cols={180}
        rows={40}
        quip="Reality compiled. Warnings remain."
      />,
    ).lastFrame() ?? ""

    expect(stripAnsi(medium)).toContain("Reality compiled. Warnings remain.")
    expect(stripAnsi(medium).split("\n").length).toBe(11)
    expect(stripAnsi(wide).split("\n").length).toBe(11)
  })

  it("uses height-aware startup banner density", () => {
    const shortWide = render(
      <StartupBanner
        version="v1.1.5"
        provider="anthropic"
        model="claude-sonnet-4-6"
        workdir="/home/user/projects/aurict"
        cols={120}
        rows={24}
      />,
    ).lastFrame() ?? ""
    expect(shortWide).toContain("AURICT")
    expect(shortWide).toContain("v1.1.5")
    expect(shortWide).toContain("/help")
    expect(shortWide).not.toContain("SYSTEMS ONLINE")
    expect(shortWide.split("\n").length).toBeLessThanOrEqual(11)
    cleanup()

    const tiny = render(
      <StartupBanner
        version="v1.1.5"
        provider="anthropic"
        model="claude-sonnet-4-6"
        workdir="/home/user/projects/aurict"
        cols={120}
        rows={16}
      />,
    ).lastFrame() ?? ""
    expect(tiny).toContain("AURICT v1.1.5")
    expect(tiny.split("\n").length).toBeLessThanOrEqual(4)
  })

  it("renders unified session chrome across terminal breakpoints", () => {
    const tiny = stripAnsi(render(<CockpitHeader {...DEFAULT_STATUS_PROPS} contextTokens={0} cols={50} />).lastFrame() ?? "")
    expect(tiny).toContain("opus-4-5")
    expect(tiny.split("\n")).toHaveLength(3)
    expect(tiny.split("\n").every((line) => line.length <= 50)).toBe(true)
    cleanup()

    const compact = render(
      <CockpitHeader {...DEFAULT_STATUS_PROPS} cols={75} contextTokens={50_000} />,
    ).lastFrame() ?? ""
    expect(compact).toContain("25%")
    cleanup()

    const normal = render(
      <CockpitHeader {...DEFAULT_STATUS_PROPS} cols={100} contextTokens={50_000} contextWindow={200_000} />,
    ).lastFrame() ?? ""
    expect(normal).toContain("ctx")
    cleanup()

    const wide = render(
      <CockpitHeader {...DEFAULT_STATUS_PROPS} cols={140} contextTokens={50_000} />,
    ).lastFrame() ?? ""
    expect(wide).toContain("projects/aurict")
    expect(wide).toContain("opus-4-5")
    cleanup()

    const footer = render(
      <StatusBar cols={140} sandboxBackend="policy" />,
    ).lastFrame() ?? ""
    expect(footer).toContain("ready")
    expect(footer).toContain("policy")
    expect(footer).not.toContain("projects/aurict")
    expect(footer).not.toContain("opus-4-5")
  })

  it("keeps the micro-cockpit compact and exposes wide telemetry", () => {
    const compact = stripAnsi(render(
      <CockpitHeader
        {...DEFAULT_STATUS_PROPS}
        cols={75}
        contextTokens={50_000}
        loading
        activeAgent="omni"
        activeAgentCount={2}
        bgTaskCount={1}
        taskSummary={{ pending: 2, inProgress: 1, done: 1, error: 0 }}
      />,
    ).lastFrame() ?? "")
    expect(compact).not.toContain("tasks 1/4")
    expect(compact).not.toContain("agents 2")
    expect(compact.split("\n").every((line) => line.length <= 75)).toBe(true)
    cleanup()

    const wide = stripAnsi(render(
      <CockpitHeader
        {...DEFAULT_STATUS_PROPS}
        cols={140}
        contextTokens={50_000}
        loading
        activity="responding"
        branch="feature/cockpit"
        activeAgent="omni"
        activeAgentCount={2}
        bgTaskCount={1}
        taskSummary={{ pending: 2, inProgress: 1, done: 1, error: 0 }}
      />,
    ).lastFrame() ?? "")
    expect(wide).toContain("tasks 1/4")
    expect(wide).toContain("agents 2")
    expect(wide).toContain("bg 1")
    expect(wide).toContain("feature/cockpit")
    expect(wide).toContain("tasks 1/4 · agents 2 · bg 1 · anthropic")
    expect(wide).toContain("single-agent")
    expect(wide.split("\n")).toHaveLength(4)
    expect(wide.split("\n").every((line) => line.length <= 140)).toBe(true)
    cleanup()

    const minimumWide = stripAnsi(render(
      <CockpitHeader
        {...DEFAULT_STATUS_PROPS}
        cols={120}
        contextTokens={50_000}
        loading
        activity="responding"
        branch="feature/cockpit"
        activeAgent="omni"
        activeAgentCount={2}
        bgTaskCount={1}
        taskSummary={{ pending: 2, inProgress: 1, done: 1, error: 0 }}
      />,
    ).lastFrame() ?? "")
    expect(minimumWide.split("\n")).toHaveLength(4)
    expect(minimumWide.split("\n").every((line) => line.length <= 120)).toBe(true)
  })

  it("surfaces durable proof state in the cockpit", () => {
    const frame = stripAnsi(render(
      <CockpitHeader
        {...DEFAULT_STATUS_PROPS}
        cols={120}
        contextTokens={20_000}
        title="Verified terminal redesign"
        proof={{
          version: 1,
          sessionId: "session-1",
          objective: "modernize the terminal",
          status: "passed",
          criteria: [],
          evidenceCount: 4,
          createdAt: 1,
          updatedAt: 2,
        }}
      />,
    ).lastFrame() ?? "")
    expect(frame).toContain("Verified terminal redesign")
    expect(frame).toContain("proof 4")
  })

  it("renders a stable ASCII cockpit signal when motion is disabled", () => {
    const previousAscii = process.env["AURICT_ASCII"]
    const previousMotion = process.env["AURICT_NO_MOTION"]
    process.env["AURICT_ASCII"] = "1"
    process.env["AURICT_NO_MOTION"] = "1"
    try {
      const frame = stripAnsi(render(<CockpitSignal active />).lastFrame() ?? "")
      expect(frame).toBe("---")
    } finally {
      if (previousAscii === undefined) delete process.env["AURICT_ASCII"]
      else process.env["AURICT_ASCII"] = previousAscii
      if (previousMotion === undefined) delete process.env["AURICT_NO_MOTION"]
      else process.env["AURICT_NO_MOTION"] = previousMotion
    }
  })

  it("keeps markdown tables bounded in narrow terminals", () => {
    const frame = withTerminalSize(50, 20, () => {
      const table = [
        "| Column One | Very Long Column Two |",
        "| ---------- | -------------------- |",
        "| alpha value with extra words | beta value with extra words that should fit |",
      ].join("\n")
      return render(<Markdown content={table} />).lastFrame() ?? ""
    })

    expect(frame).toContain("Column")
    expect(frame).toContain("alpha")
    expect(frame).toContain("┌")
  })
})

describe("TUI stress regression", () => {
  it("renders long tool output as a bounded summary", () => {
    const output = Array.from({ length: 120 }, (_, i) => `line ${String(i + 1).padStart(3, "0")}`).join("\n")
    const frame = render(
      <Message
        message={{
          role: "tool_call",
          tool: "bash",
          content: JSON.stringify({ command: "bun test --verbose" }),
          resultContent: output,
        }}
        onExpand={() => {}}
      />,
    ).lastFrame() ?? ""

    expect(frame).toMatch(/120 lines\s+details \^O/)
    expect(frame).not.toContain("line 001")
    expect(frame).not.toContain("line 120")
  })

  it("handles small terminal expanded-output paging", () => {
    const view = withTerminalSize(60, 12, () => {
      const content = Array.from({ length: 20 }, (_, i) => `row-${i + 1}`).join("\n")
      return render(<ExpandableOutput content={content} toolName="bash" onClose={() => {}} />)
    })

    expect(view.lastFrame()).toContain("1-5 / 20")
    expect(view.lastFrame()).toContain("g/G ends")
  })

  it("renders task panel scroll and keyboard hints for long task lists", () => {
    const tasks: Task[] = Array.from({ length: 18 }, (_, i) => ({
      id: String(i + 1),
      subject: `Task ${i + 1}`,
      status: i === 0 ? "in_progress" : i % 5 === 0 ? "done" : "pending",
      blockedBy: [],
    }))

    const view = render(<TaskFloatingPanel tasks={tasks} onClose={() => {}} />)
    const frame = view.lastFrame() ?? ""
    expect(frame).toContain("Task 1")
    expect(frame).toContain("↓ 6 below")
    expect(frame).toContain("g/G")
  })
})
