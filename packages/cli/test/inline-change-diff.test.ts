import { describe, expect, it } from "bun:test"
import { buildTranscriptLines, projectStableTranscript } from "../src/tui/conversation/line-buffer.js"
import type { DisplayMessage } from "../src/tui/conversation/types.js"

function diff(path: string, before: string, after: string): string {
  return `Updated ${path}\n__UNIFIED_DIFF__\n--- a/${path}\n+++ b/${path}\n@@ -1,1 +1,1 @@\n-${before}\n+${after}`
}

describe("inline change diffs", () => {
  it("renders every new-file line directly in the transcript", () => {
    const lines = buildTranscriptLines([{
      id: "create",
      role: "tool_call",
      tool: "write",
      content: JSON.stringify({ path: "src/new.ts" }),
      resultContent: "Created src/new.ts\n__UNIFIED_DIFF__\n--- /dev/null\n+++ b/src/new.ts\n@@ -0,0 +1,3 @@\n+one\n+two\n+three",
    }], 80, null, null, null)
    const visible = lines.map((line) => line.text)
    expect(visible[0]).toMatch(/^• \w+ src\/new\.ts \(\+3 -0\)$/)
    expect(visible.slice(1, 4)).toEqual(["    1 +one", "    2 +two", "    3 +three"])
  })

  it("gives each change its own Edited cell followed by its diff", () => {
    const message: DisplayMessage = {
      id: "changes",
      role: "assistant",
      content: "",
      blocks: [
        { type: "tool", id: "a", tool: "edit", args: JSON.stringify({ path: "a.ts" }), resultContent: diff("a.ts", "old-a", "new-a"), pending: false },
        { type: "tool", id: "b", tool: "apply_patch", args: "{}", resultContent: diff("b.ts", "old-b", "new-b"), pending: false },
      ],
    }
    const visible = buildTranscriptLines([message], 80, null, null, null).map((line) => line.text)
    expect(visible).toEqual([
      "• Edited a.ts (+1 -1)",
      "    1 -old-a",
      "    1 +new-a",
      "",
      "• Edited b.ts (+1 -1)",
      "    1 -old-b",
      "    1 +new-b",
      "",
    ])
  })

  it("shows diff output from non-change tools as plain command output", () => {
    const output = "--- a/a.ts\n+++ b/a.ts\n@@ -1,1 +1,1 @@\n-old\n+new"
    const message = {
      id: "git-diff",
      role: "tool_call" as const,
      tool: "bash",
      content: JSON.stringify({ command: "git diff" }),
      resultContent: output,
    }
    const visible = buildTranscriptLines([message], 80, null, null, null).map((line) => line.text)
    expect(visible.slice(0, 6)).toEqual([
      "• Ran git diff",
      "  └ --- a/a.ts",
      "    +++ b/a.ts",
      "    @@ -1,1 +1,1 @@",
      "    -old",
      "    +new",
    ])
    expect(projectStableTranscript([message], 80).some((row) => row.surface === "diff-add" || row.surface === "diff-remove")).toBe(false)
  })

  it("keeps wrapped change content complete and styled", () => {
    const long = "new-" + "value".repeat(20)
    const rows = projectStableTranscript([{
      id: "wrapped",
      role: "tool_call",
      tool: "edit",
      content: JSON.stringify({ path: "a.ts" }),
      resultContent: diff("a.ts", "old", long),
    }], 32)
    const added = rows.filter((row) => row.id.includes(":line:1:"))
    expect(added.length).toBeGreaterThan(1)
    expect(added.map((row) => row.segments.slice(2).map((segment) => segment.text).join("")).join(""))
      .toBe(long)
    expect(added.every((row) => row.surface === "diff-add")).toBe(true)
  })

  it("uses the lossless artifact when standalone display text was truncated", () => {
    const rawDiff = "--- a/a.ts\n+++ b/a.ts\n@@ -1,1 +1,1 @@\n-old\n+new"
    const visible = buildTranscriptLines([{
      id: "lossless",
      role: "tool_call",
      tool: "edit",
      content: JSON.stringify({ path: "a.ts" }),
      resultContent: "truncated model-facing output",
      artifact: {
        kind: "diff",
        output: "truncated model-facing output",
        rawDiff,
        filePath: "a.ts",
        files: ["a.ts"],
        additions: 1,
        deletions: 1,
        outputLines: 1,
      },
    }], 80, null, null, null).map((line) => line.text)
    expect(visible).toEqual(expect.arrayContaining(["• Edited a.ts (+1 -1)", "    1 -old", "    1 +new"]))
  })
})
