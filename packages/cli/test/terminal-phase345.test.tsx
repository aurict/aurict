import { describe, expect, test } from "bun:test";
import React from "react";
import { render } from "ink-testing-library";
import { PermissionPrompt } from "../src/tui/PermissionPrompt.js";
import { InlinePermissionPane } from "../src/tui/app-shell/InlinePermissionPane.js";
import { CrashNoticeBanner } from "../src/tui/app-shell/CrashNotice.js";
import { Box, Text } from "../src/tui/design-system/renderer.js";
import { TerminalSizeContext } from "../src/tui/TerminalSizeContext.js";
import { parseRawDiff } from "../src/tui/DiffRenderer/logic.js";
import { presentTranscriptError } from "../src/tui/conversation/error-presentation.js";
import { projectTranscript } from "../src/tui/conversation/projector.js";
import { isCrashReportUnseen } from "../src/util/draft.js";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const rowText = (row: ReturnType<typeof projectTranscript>[number]) => row.segments.map((segment) => segment.text).join("");

describe("terminal phases 3-5", () => {
  test("projects live and paused activity into the scrollable transcript", () => {
    const live = projectTranscript({ messages: [], width: 80, streamingText: null, streamingReason: null, streamingError: null, loading: true, activity: "waiting_for_provider" });
    const paused = projectTranscript({ messages: [], width: 80, streamingText: "partial", streamingReason: null, streamingError: null, loading: true, paused: true });
    expect(live.map(rowText).join("\n")).toContain("waiting for provider");
    expect(paused.map(rowText).join("\n")).toContain("live output paused · Ctrl+L resume");
  });

  test("gives live commentary and pending tools a single visual owner", () => {
    const commentary = projectTranscript({
      messages: [], width: 80, streamingText: "I am checking the repository.",
      streamingReason: "reasoning", streamingError: null, loading: true,
      activity: "waiting_for_provider", activeTool: "bash",
    });
    expect(commentary.map(rowText).join("\n")).toContain("• I am checking the repository.");
    expect(commentary.map(rowText).join("\n")).not.toContain("waiting for provider");
    expect(commentary.map(rowText).join("\n")).not.toContain("running tool");

    const pendingTool = projectTranscript({
      messages: [{ id: "a", role: "assistant", content: "", blocks: [
        { type: "tool", id: "tool", tool: "bash", args: "git status", pending: true },
      ] }],
      width: 80, streamingText: null, streamingReason: "reasoning",
      streamingError: null, loading: true, activeTool: "bash",
    });
    const text = pendingTool.map(rowText).join("\n");
    expect(text.match(/• Running git status/g)?.length).toBe(1);
    expect(text).not.toContain("running tool");
    expect(text).not.toContain("Thinking");
  });

  test("preserves file identity for every hunk in a multi-file diff", () => {
    const parsed = parseRawDiff("--- a/a.ts\n+++ b/a.ts\n@@ -1 +1 @@\n-a\n+A\n--- a/b.ts\n+++ b/b.ts\n@@ -2 +2 @@\n-b\n+B");
    expect(parsed.fileNames).toEqual(["a.ts", "b.ts"]);
    expect(parsed.hunks.map((hunk) => hunk.fileName)).toEqual(["a.ts", "b.ts"]);
  });

  test("renders reads as Explored and a running command as a Running cell", () => {
    const rows = projectTranscript({
      width: 80, streamingText: null, streamingReason: null, streamingError: null,
      messages: [{ id: "a", role: "assistant", content: "", blocks: [
        { type: "tool", id: "one", tool: "read", args: '{"path":"a.ts"}', pending: false, resultContent: "one", durationMs: 1_280 },
        { type: "tool", id: "two", tool: "bash", args: '{"command":"bun test"}', pending: true },
      ] }],
    });
    const text = rows.map(rowText).join("\n");
    expect(text).toContain("• Explored\n  └ Read a.ts");
    expect(text).toContain("• Running bun test");
    expect(text).not.toContain("1.3s");
  });

  test("shows short command output under the Ran cell", () => {
    const rows = projectTranscript({
      width: 90, streamingText: null, streamingReason: null, streamingError: null,
      messages: [{ id: "shell-summary", role: "assistant", content: "", blocks: [
        {
          type: "tool",
          id: "tests",
          tool: "bash",
          args: '{"command":"bun test"}',
          pending: false,
          resultContent: "test one: passed\ntest two: passed\n2 pass\n0 fail",
        },
      ] }],
    });
    const text = rows.map(rowText).join("\n");
    expect(text).toContain("• Ran bun test\n  └ test one: passed\n    test two: passed\n    2 pass\n    0 fail");
    expect(text).not.toContain("lines (^O to view details)");
  });

  test("prints the command's own output even when structured metadata exists", () => {
    const rows = projectTranscript({
      width: 90, streamingText: null, streamingReason: null, streamingError: null,
      messages: [{ id: "structured-verify", role: "assistant", content: "", blocks: [{
        type: "tool",
        id: "verify",
        tool: "bash",
        args: '{"command":"bun test"}',
        pending: false,
        resultContent: "すべてのテストが完了しました",
        artifact: {
          kind: "shell",
          output: "すべてのテストが完了しました",
          outputLines: 1,
          presentation: {
            status: "success",
            changedFiles: [],
            filePaths: [],
            errors: [],
            importantLines: [],
            verification: [{ check: "test", status: "passed" }],
          },
        },
      }] }],
    });
    const text = rows.map(rowText).join("\n");
    expect(text).toContain("• Ran bun test\n  └ すべてのテストが完了しました");
  });

  test("truncates long git diff output around a hidden-line marker", () => {
    const rows = projectTranscript({
      width: 90, streamingText: null, streamingReason: null, streamingError: null,
      messages: [{ id: "git-diff", role: "assistant", content: "", blocks: [
        {
          type: "tool",
          id: "diff",
          tool: "bash",
          args: '{"command":"git diff"}',
          pending: false,
          resultContent: "diff --git a/src/a.ts b/src/a.ts\n--- a/src/a.ts\n+++ b/src/a.ts\n@@ -1 +1 @@\n-old\n+new",
        },
      ] }],
    });
    const text = rows.map(rowText).join("\n");
    expect(text).toContain("• Ran git diff");
    expect(text).toContain("  └ diff --git a/src/a.ts b/src/a.ts\n    --- a/src/a.ts\n    … +2 lines (^O to view details)\n    -old\n    +new");
  });

  test("folds adjacent reads into one Explored cell", () => {
    const rows = projectTranscript({
      width: 100, streamingText: null, streamingReason: null, streamingError: null,
      messages: [{ id: "group", role: "assistant", content: "", blocks: [
        { type: "tool", id: "one", tool: "read", args: '{"path":"src/a.ts"}', pending: false, resultContent: "a" },
        { type: "tool", id: "two", tool: "read", args: '{"path":"src/b.ts"}', pending: false, resultContent: "b" },
        { type: "tool", id: "three", tool: "read", args: '{"path":"src/c.ts"}', pending: false, resultContent: "c" },
      ] }],
    });
    const header = rows.find((row) => rowText(row) === "• Explored");
    const headerIndex = header ? rows.indexOf(header) : -1;
    expect(header?.detailId).toBe("group:tool:0");
    expect(rowText(rows[headerIndex + 1]!)).toBe("  └ Read a.ts, b.ts, c.ts");
    expect(rows[headerIndex + 1]!.detailId).toBe("group:tool:0");
    expect(rows.filter((row) => rowText(row).includes("Read ")).length).toBe(1);
  });

  test("keeps exploration, edits and commands in separate Codex cells", () => {
    const rows = projectTranscript({
      width: 100, streamingText: null, streamingReason: null, streamingError: null,
      messages: [{ id: "mixed", role: "assistant", content: "", blocks: [
        ...["a", "b", "c", "d", "e", "f"].map((name, index) => ({
          type: "tool" as const, id: `read-${name}`, tool: "read", args: `{"path":"src/${name}.ts"}`,
          resultContent: "source", pending: false, ...(index === 0 ? { durationMs: 2_400 } : {}),
        })),
        { type: "tool", id: "search", tool: "grep", args: '{"pattern":"TODO"}', resultContent: Array.from({ length: 14 }, (_, index) => `src/a.ts:${index + 1}`).join("\n"), pending: false, durationMs: 3_000 },
        { type: "tool", id: "change", tool: "apply_patch", args: "{}", resultContent: "", pending: false, durationMs: 3_000,
          artifact: { kind: "patch", output: "", outputLines: 0, files: ["a.ts", "b.ts", "c.ts"], additions: 42, deletions: 18 } },
        { type: "tool", id: "test", tool: "bash", args: '{"command":"bun test"}', resultContent: "340 pass\n0 fail", pending: false, durationMs: 10_000 },
      ] }],
    });
    const text = rows.map(rowText).join("\n");
    expect(text).toContain("• Explored\n  └ Read a.ts, b.ts, c.ts, d.ts, e.ts, f.ts\n    Search TODO");
    expect(text).toContain("\n\n• Edited 3 files (+42 -18)");
    expect(text).toContain("\n\n• Ran bun test\n  └ 340 pass\n    0 fail");
    expect(text).not.toContain("activity");
  });

  test("renders other tools as Called cells with their output", () => {
    const rows = projectTranscript({
      width: 90, streamingText: null, streamingReason: null, streamingError: null,
      messages: [{ id: "git-tools", role: "assistant", content: "", blocks: [
        { type: "tool", id: "builtin", tool: "git", args: '{"action":"status"}', resultContent: " M src/a.ts", pending: false },
        { type: "tool", id: "mcp-flat", tool: "mcp_git_git_log", args: '{"max_count":2}', resultContent: "abc first\ndef second", pending: false },
        { type: "tool", id: "mcp-double", tool: "mcp__git__git_diff", args: "{}", resultContent: "No changes.", pending: false },
        { type: "tool", id: "github", tool: "mcp:github:list_pull_requests", args: '{"state":"open"}', resultContent: "#42", pending: false },
        { type: "tool", id: "unknown-one", tool: "tool-1", args: "{}", resultContent: "ok", pending: false },
        { type: "tool", id: "unknown-two", tool: "tool-2", args: "{}", resultContent: "ok", pending: false },
      ] }],
    });
    const text = rows.map(rowText).join("\n");
    expect(text.match(/^• Called /gm)?.length).toBe(6);
    expect(text).toContain('• Called git({"action":"status"})');
    expect(text).toContain('• Called github.list_pull_requests({"state":"open"})\n  └ #42');
    expect(text).toContain("• Called tool-1({})\n  └ ok");
    expect(text).not.toContain("mcp:github:list_pull_requests");
  });

  test("maps common provider failures to an action", () => {
    expect(presentTranscriptError("401 Unauthorized: bad API key")).toMatchObject({ title: "Authentication required" });
    expect(presentTranscriptError("fetch failed: ECONNREFUSED").action).toContain("Check the connection");
  });

  test("supports direct allow and deny permission keys", async () => {
    const decisions: string[] = [];
    const view = render(
      <TerminalSizeContext.Provider value={{ columns: 80, rows: 24 }}>
        <PermissionPrompt request={{ id: "p", tool: "write", pattern: "a.ts", level: "warning" }} onDecide={(decision) => decisions.push(typeof decision === "string" ? decision : decision.decision)} />
      </TerminalSizeContext.Provider>,
    );
    await sleep(30);
    view.stdin.write("y");
    await sleep(20);
    expect(decisions).toEqual(["allow_once"]);
    view.unmount();
  });

  test("presents shell file readers as reviewable rather than destructive", () => {
    const view = render(
      <TerminalSizeContext.Provider value={{ columns: 80, rows: 24 }}>
        <PermissionPrompt
          request={{
            id: "cat", tool: "bash", pattern: "cat package.json", level: "warning",
            reason: "Shell file readers bypass workspace path protections; review the target path",
            sandbox: { backend: "policy", reason: "read-only command", envScrubbed: true },
            command: { executables: ["cat"], readOnly: true },
          }}
          onDecide={() => {}}
        />
      </TerminalSizeContext.Provider>,
    );
    const frame = view.lastFrame() ?? "";
    expect(frame).toContain("Would you like to run the following command?");
    expect(frame).toContain("$ cat package.json");
    expect(frame).toContain("Reason: Shell file readers bypass workspace path protections");
    expect(frame).not.toContain("Destructive operation");
    view.unmount();
  });

  test("keeps permission decisions inline immediately above the composer", () => {
    const view = render(
      <TerminalSizeContext.Provider value={{ columns: 80, rows: 24 }}>
        <Box flexDirection="column">
          <Text>conversation tail</Text>
          <InlinePermissionPane
            request={{ id: "inline", tool: "bash", pattern: "bun test", level: "warning" }}
            onDecide={() => {}}
            queueLength={2}
          />
          <Text>composer surface</Text>
        </Box>
      </TerminalSizeContext.Provider>,
    );
    const frame = view.lastFrame() ?? "";
    const question = "Would you like to run the following command?";
    expect(frame.indexOf("conversation tail")).toBeLessThan(frame.indexOf(question));
    expect(frame.indexOf(question)).toBeLessThan(frame.indexOf("composer surface"));
    expect(frame).toContain("› 1. Yes, proceed (y)");
    expect(frame).toContain("2. No, and tell Aurict what to do differently (esc)");
    expect(frame).toContain("Press enter to confirm or esc to cancel");
  });

  test("renders crash recovery as a bounded snackbar instead of transcript prose", () => {
    const view = render(
      <TerminalSizeContext.Provider value={{ columns: 80, rows: 24 }}>
        <CrashNoticeBanner />
      </TerminalSizeContext.Provider>,
    );
    const plain = (view.lastFrame() ?? "").replace(/\x1b\[[0-9;]*m/g, "");
    expect(plain).toContain("Previous run ended unexpectedly · /crashes");
    expect(plain.split("\n").every((line) => line.length <= 80)).toBe(true);
    expect(isCrashReportUnseen(200, undefined)).toBe(true);
    expect(isCrashReportUnseen(200, 100)).toBe(true);
    expect(isCrashReportUnseen(200, 200)).toBe(false);
  });

  test("navigates the numbered permission choices with up and down arrows", async () => {
    const decisions: string[] = [];
    const view = render(
      <TerminalSizeContext.Provider value={{ columns: 80, rows: 24 }}>
        <PermissionPrompt
          request={{ id: "bash-horizontal", tool: "bash", pattern: "bun test", level: "warning" }}
          onDecide={(decision) => decisions.push(typeof decision === "string" ? decision : decision.decision)}
        />
      </TerminalSizeContext.Provider>,
    );
    await sleep(30);
    view.stdin.write("\x1b[B");
    await sleep(20);
    expect(view.lastFrame()).toContain("› 2. No, and tell Aurict what to do differently (esc)");
    view.stdin.write("\x1b[A");
    await sleep(20);
    view.stdin.write("\r");
    await sleep(20);
    expect(decisions).toEqual(["allow_once"]);
    view.unmount();
  });
});
