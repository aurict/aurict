import { describe, expect, it } from "bun:test"
import {
  buildTranscriptLines,
  projectLiveTranscript,
  projectStableTranscript,
  wrapTranscriptText,
} from "../src/tui/conversation/line-buffer.js"
import { wrapLine } from "../src/tui/event-system/wrap-line.js"
import type { DisplayMessage } from "../src/tui/conversation/types.js"
import { coalesceInterruptedAssistantBlocks } from "../src/tui/conversation/block-flow.js"

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

  it("keeps ordered assistant text and tool output as individual Codex cells", () => {
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
            args: JSON.stringify({ path: "report.md" }),
            pending: false,
            resultContent: "Created report.md",
          },
          { type: "text", content: "The report is ready." },
        ],
      },
    ]

    const visible = buildTranscriptLines(messages, 48, null, null, null).map((line) => line.text)
    expect(visible).toEqual(expect.arrayContaining([
      "❯ write a report",
      "• I will prepare it.",
      expect.stringMatching(/^• Edited report\.md/),
      "• The report is ready.",
    ]))
    const prose = visible.indexOf("• I will prepare it.")
    const tool = visible.findIndex((line) => line.startsWith("• Edited report.md"))
    expect(prose).toBeLessThan(tool)
    expect(tool).toBeLessThan(visible.indexOf("• The report is ready."))
  })

  it("separates every cell with exactly one blank row", () => {
    const lines = buildTranscriptLines([{
      id: "rhythm",
      role: "assistant",
      content: "",
      blocks: [
        { type: "text", content: "I will inspect it." },
        { type: "tool", id: "read", tool: "read", args: JSON.stringify({ path: "src/app.ts" }), pending: false, resultContent: "source" },
        { type: "text", content: "The implementation is clear." },
      ],
    }], 80, null, null, null)
    const visible = lines.map((line) => line.text)
    const tool = visible.indexOf("• Explored")
    const response = visible.indexOf("• The implementation is clear.")

    expect(visible[0]).toBe("• I will inspect it.")
    expect(visible[tool - 1]).toBe("")
    expect(visible[tool + 1]).toBe("  └ Read app.ts")
    expect(visible[response - 1]).toBe("")
    expect(visible[response - 2]).toBe("  └ Read app.ts")
  })

  it("gives every shell command its own Ran cell with an output tree", () => {
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
    const status = visible.indexOf("• Ran git status")
    const diff = visible.indexOf("• Ran git diff")

    expect(visible[status - 1]).toBe("")
    expect(visible[status + 1]).toBe("  └ (no output)")
    expect(visible[status + 2]).toBe("")
    expect(diff).toBe(status + 3)
    expect(lines[status]?.detailId).toBe("tool-cluster:tool:1")
    expect(lines[diff]?.detailId).toBe("tool-cluster:tool:2")
  })

  it("collapses adjacent reads and searches into one Explored cell", () => {
    const visible = buildTranscriptLines([{
      id: "explore",
      role: "assistant",
      content: "",
      blocks: [
        { type: "tool", id: "a", tool: "read", args: JSON.stringify({ path: "src/a.ts" }), pending: false, resultContent: "a" },
        { type: "tool", id: "b", tool: "read", args: JSON.stringify({ path: "src/b.ts" }), pending: false, resultContent: "b" },
        { type: "tool", id: "c", tool: "grep", args: JSON.stringify({ pattern: "TODO", path: "src" }), pending: false, resultContent: "c" },
      ],
    }], 80, null, null, null).map((line) => line.text)

    expect(visible.slice(0, 3)).toEqual([
      "• Explored",
      "  └ Read a.ts, b.ts",
      "    Search TODO in src",
    ])
  })

  it("keeps a blank row between consecutive tool failures", () => {
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
    const followingActivity = rows.findIndex((row) => row.id.startsWith("error-spacing:explore:4:header"))

    expect(visible[firstError]).toBe("• Ran first")
    expect(rows[firstError]?.segments[0]).toMatchObject({ text: "• ", tone: "error", bold: true })
    expect(visible[firstError - 1]).toBe("")
    expect(visible[secondError - 1]).toBe("")
    expect(visible[secondError - 2]).toBe("  └ first failure")
    expect(visible[followingActivity - 1]).toBe("")
  })

  it("marks user rows, including their padding, for the tinted prompt surface", () => {
    const rows = projectStableTranscript([
      { id: "user-surface", role: "user", content: "Modern terminal" },
      { id: "assistant-surface", role: "assistant", content: "Borderless response" },
    ], 80)
    const user = rows.filter((row) => row.id.startsWith("user-surface:") && row.id !== "user-surface:end")
    expect(user.map((row) => row.segments.map((segment) => segment.text).join(""))).toEqual(["", "❯ Modern terminal", ""])
    expect(user.every((row) => row.surface === "user")).toBe(true)
    expect(rows.find((row) => row.id === "user-surface:end")?.surface).toBeUndefined()
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

  it("shows repeated tool-step commentary once without mutating raw blocks", () => {
    const rawBlocks: NonNullable<DisplayMessage["blocks"]> = [
      { type: "text", content: "Önemli bulgular!" },
      { type: "tool", id: "one", tool: "read", args: "a.ts", pending: false },
      { type: "text", content: "Önemli   bulgular!" },
      { type: "tool", id: "two", tool: "grep", args: "pattern", pending: false },
      { type: "text", content: "Önemli bulgular!" },
      { type: "text", content: "Müthiş bulgular: escalation vector confirmed." },
    ]
    const lines = buildTranscriptLines([{
      id: "repeated-commentary",
      role: "assistant",
      content: "",
      blocks: rawBlocks,
    }], 100, null, null, null)
    const prose = lines.map(line => line.text.replace(/^(?:• | {2})/, ""))

    expect(prose.filter(line => line === "Önemli bulgular!")).toHaveLength(1)
    expect(prose).toContain("Müthiş bulgular: escalation vector confirmed.")
    expect(rawBlocks).toHaveLength(6)
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
    expect(visible.indexOf("• Ran git status"))
      .toBeLessThan(visible.findIndex((line) => line.includes("var mı diye. İyidir")))
    expect(lines.find((line) => line.text === "• Ran git status")?.detailId)
      .toBe("assistant:tool:1")
  })

  it("prefixes user and assistant cells with Codex gutters instead of headers", () => {
    const visible = buildTranscriptLines(
      [
        { id: "user", role: "user", content: "Hello", timestamp: new Date(2026, 0, 1, 9, 5).getTime() },
        { id: "assistant", role: "assistant", content: "Hi\nthere", timestamp: new Date(2026, 0, 1, 9, 6).getTime() },
      ],
      80,
      null,
      null,
      null,
    ).map((line) => line.text)

    expect(visible).toEqual(["", "❯ Hello", "", "", "• Hi", "  there", ""])

    const rows = projectStableTranscript([
      { id: "timed", role: "assistant", content: "Done", timestamp: new Date(2026, 0, 1, 9, 6).getTime() },
    ], 80)
    expect(rows[0]?.segments).toEqual([
      expect.objectContaining({ text: "• ", tone: "muted", dim: true }),
      expect.objectContaining({ text: "Done", tone: "assistant" }),
    ])
  })

  it("renders Markdown structure inside the cell gutter", () => {
    const rows = projectStableTranscript([{
      id: "markdown",
      role: "assistant",
      content: "# Plan\n- [x] Complete\n- [ ] Pending\n- Review next\n> Review this\n```ts\nconst ready = true\n```",
    }], 48)
    const visible = rows.map((row) => row.segments.map((segment) => segment.text).join(""))
    expect(visible).toEqual([
      "• Plan",
      "  ✔ Complete",
      "  □ Pending",
      "  - Review next",
      "  > Review this",
      "  const ready = true",
      "",
    ])
    expect(rows[0]!.segments[1]).toMatchObject({ text: "Plan", bold: true, underline: true })
    expect(rows[1]!.segments[1]).toMatchObject({ text: "✔ ", tone: "success" })
    expect(rows[1]!.segments[2]).toMatchObject({ text: "Complete", strikethrough: true })
    expect(rows[4]!.segments[1]).toMatchObject({ text: "> ", tone: "success" })
    expect(rows[5]!.segments[1]).toMatchObject({ text: "const ready = true", tone: "code" })
  })

  it("hides code fences and keeps code lines tight with the surrounding prose", () => {
    const visible = buildTranscriptLines([{
      id: "code-rhythm",
      role: "assistant",
      content: "Before.\n```ts\nconst ready = true\n```\nAfter.",
    }], 80, null, null, null).map((line) => line.text)

    expect(visible).toEqual(["• Before.", "  const ready = true", "  After.", ""])
  })

  it("renders headings as bold text without extra rows, like Codex", () => {
    const lines = buildTranscriptLines([{
      id: "readability",
      role: "assistant",
      content: "Intro paragraph.\n**Changes:**\n- First item\n## Verification\nAll checks passed.",
    }], 80, null, null, null)
    expect(lines.map((line) => line.text)).toEqual([
      "• Intro paragraph.",
      "  Changes:",
      "  - First item",
      "  Verification",
      "  All checks passed.",
      "",
    ])
    expect(lines[1]).toMatchObject({ bold: true })
    expect(lines[3]).toMatchObject({ bold: true })
  })

  it("keeps inline emphasis inline", () => {
    const rows = projectStableTranscript([{
      id: "inline",
      role: "assistant",
      content: "Use **semantic color** here.\n**This is a complete sentence.**",
    }], 80)
    const visible = rows.map((row) => row.segments.map((segment) => segment.text).join(""))
    expect(visible.slice(0, 2)).toEqual(["• Use semantic color here.", "  This is a complete sentence."])
    expect(rows[0]!.segments).toContainEqual(expect.objectContaining({ text: "semantic color", bold: true }))
    expect(rows[1]!.segments[1]).toMatchObject({ text: "This is a complete sentence.", tone: "assistant", bold: true })
  })

  it("wraps prose at the full width behind the two-column gutter", () => {
    const lines = buildTranscriptLines([{
      id: "wide",
      role: "assistant",
      content: "word ".repeat(60),
    }], 140, null, null, null)
    const prose = lines.filter((line) => line.text.trim().startsWith("word") || line.text.startsWith("• word"))
    expect(prose.length).toBeGreaterThan(1)
    expect(prose[0]!.text.startsWith("• word")).toBe(true)
    expect(prose.slice(1).every((line) => line.text.startsWith("  word"))).toBe(true)
    expect(prose.every((line) => line.text.length <= 138)).toBe(true)
  })

  it("steps heading emphasis down by level", () => {
    const rows = projectStableTranscript([{
      id: "levels",
      role: "assistant",
      content: "# Primary\n### Tertiary\n#### Detail",
    }], 80)
    const segment = (text: string) => rows.flatMap((row) => row.segments).find((item) => item.text === text)
    expect(segment("Primary")).toMatchObject({ bold: true, underline: true })
    expect(segment("Tertiary")).toMatchObject({ bold: true, italic: true })
    expect(segment("Detail")).toMatchObject({ italic: true })
    expect(segment("Detail")?.bold).toBeUndefined()
  })

  it("keeps list items tight with the prose around them", () => {
    const visible = buildTranscriptLines([{
      id: "list-rhythm",
      role: "assistant",
      content: "Before\n- First\n- Second\nAfter",
    }], 80, null, null, null).map((line) => line.text)
    expect(visible).toEqual(["• Before", "  - First", "  - Second", "  After", ""])
  })

  it("keeps reasoning out of the transcript, as Codex does", () => {
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

    expect(lines.map((line) => line.text)).toEqual(["• Answer", ""])
    expect(lines.some((line) => line.tone === "thinking")).toBe(false)
  })

  it("shows live reasoning only when no status line reports it", () => {
    const lines = buildTranscriptLines([], 80, null, "Checking the test output", null)
    expect(lines).toEqual([
      expect.objectContaining({ text: "◦ Thinking", italic: true }),
    ])
    expect(projectLiveTranscript({ width: 80, streamingText: null, streamingReason: "Checking", streamingError: null, statusLine: true })).toEqual([])
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

  it("shows emitted workspace diffs under an Edited header with detail identity", () => {
    const message: DisplayMessage = {
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
    }
    const lines = buildTranscriptLines([message], 80, null, null, null)

    expect(lines).toEqual(expect.arrayContaining([
      expect.objectContaining({ text: "• Edited src/file.ts (+1 -1)", detailId: "change:tool:0" }),
      expect.objectContaining({ text: "    1 -old", detailId: "change:tool:0" }),
      expect.objectContaining({ text: "    1 +new", detailId: "change:tool:0" }),
    ]))
    const rows = projectStableTranscript([message], 80)
    expect(rows.find((row) => row.segments.map((segment) => segment.text).join("") === "    1 -old")?.surface).toBe("diff-remove")
    expect(rows.find((row) => row.segments.map((segment) => segment.text).join("") === "    1 +new")?.surface).toBe("diff-add")
  })
})
