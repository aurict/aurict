import { describe, expect, it } from "bun:test"
import {
  buildTranscriptLines,
  projectStableTranscript,
  wrapTranscriptText,
} from "../src/tui/conversation/line-buffer.js"
import { wrapLine } from "../src/tui/event-system/wrap-line.js"
import type { DisplayMessage } from "../src/tui/conversation/types.js"
import { coalesceInterruptedAssistantBlocks } from "../src/tui/conversation/block-flow.js"
import { proseLayout } from "../src/tui/conversation/readability.js"

describe("conversation line buffer", () => {
  it("uses Ink's exact hard-wrap algorithm for every transcript line", () => {
    const content = `start ${"x".repeat(80)}\nsecond paragraph`
    expect(wrapTranscriptText(content, 24)).toEqual([
      ...wrapLine(`start ${"x".repeat(80)}`, 24),
      ...wrapLine("second paragraph", 24),
    ])
  })

  it("removes terminal control sequences before persisting visual rows", () => {
    expect(wrapTranscriptText("\u001b[31mfailed\u001b[0m", 20)).toEqual(["failed"])
  })

  it("projects inline emphasis and safe links without raw markdown syntax", () => {
    const rows = projectStableTranscript([{
      id: "inline-markdown",
      role: "assistant",
      content: "Use *care* and ~~legacy~~; read [docs](https://example.com/guide).",
    }], 100)
    const segments = rows.flatMap((row) => row.segments)
    const visible = segments.map((segment) => segment.text).join("")

    expect(segments).toContainEqual(expect.objectContaining({ text: "care", italic: true }))
    expect(segments).toContainEqual(expect.objectContaining({ text: "legacy", strikethrough: true }))
    expect(segments.some((segment) => segment.text.includes("\x1b]8;;https://example.com/guide"))).toBe(true)
    expect(visible).not.toContain("*care*")
    expect(visible).not.toContain("~~legacy~~")
  })

  it("keeps ordered assistant text and tool output as individual visual rows", () => {
    const messages: DisplayMessage[] = [
      { id: "user", role: "user", content: "write a report" },
      {
        id: "assistant",
        role: "assistant",
        content: "",
        blocks: [
          { type: "text", content: "I will prepare it." },
          {
            type: "tool",
            id: "tool-1",
            tool: "write",
            args: "report.md",
            pending: false,
            resultContent: "saved report.md",
          },
          { type: "text", content: "The report is ready." },
        ],
      },
    ]

    const lines = buildTranscriptLines(messages, 48, null, null, null)
    expect(lines.map((line) => line.text)).toEqual(expect.arrayContaining([
      "▸ You",
      "write a report",
      "◇ Aurict",
      "I will prepare it.",
      "› change",
      "    report.md",
      expect.stringMatching(/  └ saved report\.md\s+\^O/),
      "The report is ready.",
    ]))
    expect(lines.findIndex((line) => line.text === "I will prepare it."))
      .toBeLessThan(lines.findIndex((line) => line.text === "› change"))
  })

  it("adds one breathing row at prose and tool boundaries", () => {
    const lines = buildTranscriptLines([{
      id: "rhythm",
      role: "assistant",
      content: "",
      blocks: [
        { type: "text", content: "I will inspect it." },
        { type: "tool", id: "read", tool: "read", args: "src/app.ts", pending: false, resultContent: "source" },
        { type: "text", content: "The implementation is clear." },
      ],
    }], 80, null, null, null)
    const visible = lines.map((line) => line.text)
    const tool = visible.findIndex((line) => /› read\s+src\/app\.ts/.test(line))
    const response = visible.indexOf("The implementation is clear.")

    expect(visible[tool - 1]).toBe("")
    expect(visible[response - 1]).toBe("")
  })

  it("keeps adjacent tool calls in one tight activity cluster", () => {
    const lines = buildTranscriptLines([{
      id: "tool-cluster",
      role: "assistant",
      content: "",
      blocks: [
        { type: "text", content: "Checking both commands." },
        { type: "tool", id: "one", tool: "bash", args: "git status", pending: false },
        { type: "tool", id: "two", tool: "bash", args: "git diff", pending: false },
        { type: "text", content: "The workspace is consistent." },
      ],
    }], 80, null, null, null)
    const visible = lines.map((line) => line.text)
    const tool = visible.findIndex((line) => /│ git\s+status, diff/.test(line))

    expect(visible[tool - 1]).toBe("┌ activity")
    expect(visible[tool + 1]).toBe("└ completed")
    expect(lines[tool]?.detailId).toBe("tool-cluster:tool:1")
    expect(visible.some((line) => /› git\s+status/.test(line))).toBe(false)
    expect(visible.some((line) => /› git\s+diff/.test(line))).toBe(false)
  })

  it("adds breathing room around consecutive tool failures", () => {
    const rows = projectStableTranscript([{
      id: "error-spacing",
      role: "assistant",
      content: "",
      blocks: [
        { type: "tool", id: "read-a", tool: "read", args: "a.ts", pending: false, resultContent: "a" },
        { type: "tool", id: "read-b", tool: "read", args: "b.ts", pending: false, resultContent: "b" },
        { type: "tool", id: "fail-a", tool: "bash", args: "first", pending: false,
          artifact: { kind: "error", output: "first failure", outputLines: 1 } },
        { type: "tool", id: "fail-b", tool: "bash", args: "second", pending: false,
          artifact: { kind: "error", output: "second failure", outputLines: 1 } },
        { type: "tool", id: "grep-a", tool: "grep", args: "one", pending: false, resultContent: "one" },
        { type: "tool", id: "grep-b", tool: "grep", args: "two", pending: false, resultContent: "two" },
      ],
    }], 80)
    const visible = rows.map((row) => row.segments.map((segment) => segment.text).join(""))
    const firstError = rows.findIndex((row) => row.id.startsWith("error-spacing:tool:2:summary"))
    const secondError = rows.findIndex((row) => row.id.startsWith("error-spacing:tool:3:summary"))
    const followingActivity = rows.findIndex((row) => row.id.startsWith("error-spacing:activity:4:header"))

    expect(visible[firstError - 1]).toBe("")
    expect(visible[secondError - 1]).toContain("first failure")
    expect(visible[followingActivity - 1]).toBe("")
  })

  it("marks user rows for a quiet raised transcript surface", () => {
    const rows = projectStableTranscript([
      { id: "user-surface", role: "user", content: "Modern terminal" },
      { id: "assistant-surface", role: "assistant", content: "Borderless response" },
    ], 80)
    expect(rows
      .filter((row) => row.id.startsWith("user-surface") && row.segments.some((segment) => segment.text))
      .every((row) => row.surface === "user")).toBe(true)
    expect(rows
      .filter((row) => row.id.startsWith("assistant-surface") && row.segments.some((segment) => segment.text))
      .every((row) => row.surface === undefined)).toBe(true)
  })

  it("defers an unfinished pre-tool paragraph and rejoins it after tool activity", () => {
    const blocks = coalesceInterruptedAssistantBlocks([
      { type: "text", content: "First paragraph.\n\nLet me check whether there is more to do" },
      { type: "tool", id: "one", tool: "bash", args: "git log", pending: false },
      { type: "tool", id: "two", tool: "bash", args: "git status", pending: false },
      { type: "text", content: "before answering.Thanks, I am well." },
    ])

    expect(blocks).toEqual([
      { block: { type: "text", content: "First paragraph." }, sourceIndex: 0 },
      { block: { type: "tool", id: "one", tool: "bash", args: "git log", pending: false }, sourceIndex: 1 },
      { block: { type: "tool", id: "two", tool: "bash", args: "git status", pending: false }, sourceIndex: 2 },
      { block: { type: "text", content: "Let me check whether there is more to do before answering. Thanks, I am well." }, sourceIndex: 3 },
    ])
  })

  it("keeps complete commentary before a tool in chronological order", () => {
    const blocks = coalesceInterruptedAssistantBlocks([
      { type: "text", content: "I will inspect the repository." },
      { type: "tool", id: "one", tool: "bash", args: "git status", pending: false },
      { type: "text", content: "The repository has changes." },
    ])

    expect(blocks.map(({ block }) => block.type === "text" ? block.content : block.tool)).toEqual([
      "I will inspect the repository.",
      "bash",
      "The repository has changes.",
    ])
  })

  it("keeps tool detail identity while repairing the observed mid-sentence split", () => {
    const lines = buildTranscriptLines([{
      id: "assistant",
      role: "assistant",
      content: "",
      blocks: [
        { type: "text", content: "Bakayım en son nerede kaldık, yapılacak bir şey var mı" },
        { type: "tool", id: "status", tool: "bash", args: "git status", pending: false },
        { type: "text", content: "diye.İyidir ya, sağ ol." },
      ],
    }], 100, null, null, null)

    const visible = lines.map((line) => line.text)
    expect(visible.findIndex((line) => /› git\s+status/.test(line)))
      .toBeLessThan(visible.findIndex((line) => line.includes("var mı diye. İyidir")))
    expect(lines.find((line) => /› git\s+status/.test(line.text))?.detailId)
      .toBe("assistant:tool:1")
  })

  it("uses distinct identity markers and preserves message timestamps", () => {
    const lines = buildTranscriptLines(
      [
        { id: "user", role: "user", content: "Hello", timestamp: new Date(2026, 0, 1, 9, 5).getTime() },
        { id: "assistant", role: "assistant", content: "Hi", timestamp: new Date(2026, 0, 1, 9, 6).getTime() },
      ],
      80,
      null,
      null,
      null,
    )

    expect(lines.map((line) => line.text)).toEqual(expect.arrayContaining([
      "▸ You · 09:05",
      "◇ Aurict · 09:06",
    ]))

    const rows = projectStableTranscript([
      { id: "timed", role: "assistant", content: "Done", timestamp: new Date(2026, 0, 1, 9, 6).getTime() },
    ], 80)
    expect(rows[0]?.segments).toEqual([
      expect.objectContaining({ text: "◇ Aurict", tone: "assistant", bold: true }),
      expect.objectContaining({ text: " · 09:06", tone: "muted" }),
    ])
  })

  it("preserves Markdown structure without delegating row height to Ink", () => {
    const lines = buildTranscriptLines(
      [
        {
          id: "markdown",
          role: "assistant",
          content: "# Plan\n- [x] Complete\n- Review next\n> Review this\n```ts\nconst ready = true\n```",
        },
      ],
      48,
      null,
      null,
      null,
    )

    expect(lines).toEqual(expect.arrayContaining([
      expect.objectContaining({ text: "◆ Plan", tone: "heading", bold: true }),
      expect.objectContaining({ text: "● Complete", tone: "success" }),
      expect.objectContaining({ text: "• Review next", tone: "bullet" }),
      expect.objectContaining({ text: "│ Review this", tone: "quote", italic: true }),
      expect.objectContaining({ text: "┌ ts", tone: "code" }),
      expect.objectContaining({ text: "const ready = true", tone: "code" }),
    ]))
  })

  it("gives fenced code one surrounding row without loosening its body", () => {
    const lines = buildTranscriptLines([{
      id: "code-rhythm",
      role: "assistant",
      content: "Before.\n```ts\nconst ready = true\n```\nAfter.",
    }], 80, null, null, null)
    const visible = lines.map((line) => line.text)
    const open = visible.indexOf("┌ ts")
    const body = visible.indexOf("const ready = true")
    const close = visible.indexOf("└")

    expect(visible[open - 1]).toBe("")
    expect(body).toBe(open + 1)
    expect(close).toBe(body + 1)
    expect(visible[close + 1]).toBe("")
  })

  it("gives Markdown and bold-only section headings one readable row above and below", () => {
    const lines = buildTranscriptLines([{
      id: "readability",
      role: "assistant",
      content: "Intro paragraph.\n**Changes:**\n- First item\n## Verification\nAll checks passed.",
    }], 80, null, null, null)
    const visible = lines.map((line) => line.text)
    const boldSection = visible.indexOf("Changes:")
    const markdownSection = visible.indexOf("◆ Verification")

    expect(visible[boldSection - 1]).toBe("")
    expect(visible[boldSection + 1]).toBe("")
    expect(visible[markdownSection - 1]).toBe("")
    expect(visible[markdownSection + 1]).toBe("")
    expect(lines[boldSection]).toMatchObject({ tone: "heading", bold: true })
  })

  it("does not add section spacing around inline emphasis or bold sentences", () => {
    const lines = buildTranscriptLines([{
      id: "inline",
      role: "assistant",
      content: "Use **semantic color** here.\n**This is a complete sentence.**",
    }], 80, null, null, null)
    const visible = lines.map((line) => line.text)
    expect(visible).toContain("Use semantic color here.")
    expect(lines.find((line) => line.text === "This is a complete sentence.")?.tone).toBe("assistant")
  })

  it("caps wide prose with a small inset while leaving compact terminals fluid", () => {
    expect(proseLayout(78)).toEqual({ contentWidth: 78, leftInset: 0 })
    expect(proseLayout(138)).toEqual({ contentWidth: 110, leftInset: 2 })

    const lines = buildTranscriptLines([{
      id: "wide",
      role: "assistant",
      content: "word ".repeat(60),
    }], 140, null, null, null)
    const prose = lines.filter((line) => line.text.trim().startsWith("word"))
    expect(prose.length).toBeGreaterThan(1)
    expect(prose.every((line) => line.text.startsWith("  ") && line.text.length <= 112)).toBe(true)
  })

  it("steps down weight and tone for deeper heading levels", () => {
    const lines = buildTranscriptLines([{
      id: "levels",
      role: "assistant",
      content: "# Primary\n### Tertiary\n#### Detail",
    }], 80, null, null, null)
    expect(lines.find((line) => line.text === "◆ Primary")).toMatchObject({ tone: "heading", bold: true })
    expect(lines.find((line) => line.text === "▸ Tertiary")).toMatchObject({ tone: "assistant", bold: true })
    expect(lines.find((line) => line.text === "▸ Detail")).toMatchObject({ tone: "assistant" })
    expect(lines.find((line) => line.text === "▸ Detail")?.bold).toBeUndefined()
  })

  it("keeps list items tight while giving the list one surrounding row", () => {
    const lines = buildTranscriptLines([{
      id: "list-rhythm",
      role: "assistant",
      content: "Before\n- First\n- Second\nAfter",
    }], 80, null, null, null)
    const visible = lines.map((line) => line.text)
    const first = visible.indexOf("• First")
    const second = visible.indexOf("• Second")
    expect(visible[first - 1]).toBe("")
    expect(second).toBe(first + 1)
    expect(visible[second + 1]).toBe("")
  })

  it("keeps message and block thinking summaries visible", () => {
    const lines = buildTranscriptLines(
      [
        {
          id: "reasoning",
          role: "assistant",
          content: "",
          reasoningContent: "First thought\nSecond thought",
          blocks: [
            {
              type: "text",
              content: "Answer",
              reasoningContent: "A tool-related thought",
            },
          ],
        },
      ],
      80,
      null,
      null,
      null,
    )

    expect(lines.filter((line) => line.tone === "thinking")).toEqual([
      expect.objectContaining({ text: "∴ planning · Ctrl+O inspect", detailId: "reasoning:thinking" }),
      expect.objectContaining({ text: "∴ thinking · Ctrl+O inspect", detailId: "reasoning:text:0:thinking" }),
    ])
  })

  it("renders live reasoning independently of live answer text", () => {
    const lines = buildTranscriptLines([], 80, null, "Checking the test output", null)
    expect(lines).toEqual(expect.arrayContaining([
      expect.objectContaining({
        text: "∴ thinking…",
        tone: "thinking",
      }),
    ]))
  })

  it("rebuilds a deterministic, bounded row list after a terminal resize", () => {
    const messages: DisplayMessage[] = [
      { id: "message", role: "assistant", content: "word ".repeat(70) },
    ]
    const narrow = buildTranscriptLines(messages, 32, null, null, null)
    const wide = buildTranscriptLines(messages, 100, null, null, null)

    expect(narrow.length).toBeGreaterThan(wide.length)
    expect(narrow.every((line) => line.id.length > 0)).toBe(true)
    expect(narrow.filter((line) => line.text !== "").every((line) => line.text.length > 0)).toBe(true)
  })

  it("summarizes emitted workspace diffs while retaining their detail identity", () => {
    const lines = buildTranscriptLines([
      {
        id: "change",
        role: "assistant",
        content: "",
        blocks: [{
          type: "tool",
          id: "edit-1",
          tool: "edit",
          args: JSON.stringify({ path: "src/file.ts" }),
          pending: false,
          resultContent: [
            "Updated src/file.ts",
            "__UNIFIED_DIFF__",
            "--- a/src/file.ts",
            "+++ b/src/file.ts",
            "@@ -1 +1 @@",
            "-old",
            "+new",
          ].join("\n"),
        }],
      },
    ], 80, null, null, null)

    expect(lines).toEqual(expect.arrayContaining([
      expect.objectContaining({ text: "  ◆ src/file.ts  +1 −1  · details ^O", detailId: "change:tool:0" }),
      expect.objectContaining({ text: "   1      − old", tone: "diff-remove", detailId: "change:tool:0" }),
      expect.objectContaining({ text: "        1 + new", tone: "diff-add", detailId: "change:tool:0" }),
    ]))
  })
})
