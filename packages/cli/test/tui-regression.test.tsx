import { describe, it, expect, afterEach } from "bun:test"
import React from "react"
import { render, cleanup } from "ink-testing-library"
import { StatusBar } from "../src/tui/StatusBar.js"
import { TaskFloatingPanel } from "../src/tui/TaskFloatingPanel.js"
import { ExpandableOutput } from "../src/tui/ExpandableOutput.js"
import { Markdown } from "../src/tui/Markdown.js"
import { Message } from "../src/tui/Message.js"
import type { Task } from "@aurict/core"

afterEach(() => { cleanup() })

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
  it("renders status bar across terminal breakpoints", () => {
    // tiny: sadece kısa model adı gösterilir
    const tiny = render(<StatusBar {...DEFAULT_STATUS_PROPS} cols={50} />).lastFrame() ?? ""
    expect(tiny).toContain("opus-4-5")
    cleanup()

    // compact: ctx yüzdesi gösterilir (ör. "25%")
    const compact = render(
      <StatusBar {...DEFAULT_STATUS_PROPS} cols={75} contextTokens={50_000} />,
    ).lastFrame() ?? ""
    expect(compact).toContain("25%")
    cleanup()

    // normal: "ctx XX%" ve token sayısı
    const normal = render(
      <StatusBar {...DEFAULT_STATUS_PROPS} cols={100} contextTokens={50_000} contextWindow={200_000} />,
    ).lastFrame() ?? ""
    expect(normal).toContain("ctx")
    expect(normal).toContain("15k")
    cleanup()

    // wide: dir ve model görünür
    const wide = render(
      <StatusBar {...DEFAULT_STATUS_PROPS} cols={140} />,
    ).lastFrame() ?? ""
    expect(wide).toContain("opus-4-5")
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
  it("renders long tool output with bounded preview", () => {
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

    expect(frame).toContain("120 lines")
    expect(frame).toContain("line 001")
    expect(frame).toContain("line 120")
    expect(frame).toContain("113 hidden lines")
  })

  it("handles small terminal expanded-output paging", () => {
    const view = withTerminalSize(60, 12, () => {
      const content = Array.from({ length: 20 }, (_, i) => `row-${i + 1}`).join("\n")
      return render(<ExpandableOutput content={content} toolName="bash" onClose={() => {}} />)
    })

    expect(view.lastFrame()).toContain("1-5 / 20")
    expect(view.lastFrame()).toContain("g/G top/bottom")
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
