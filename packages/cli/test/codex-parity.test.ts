import { describe, expect, test } from "bun:test";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  approvalModeFrom,
  fullAccessApproves,
  parseApprovalMode,
} from "../src/tui/approval-mode.js";
import { formatExitSummary } from "../src/util/exit-summary.js";
import { fuzzyPathScore, rankPaths } from "../src/tui/file-search.js";
import { withDirectories } from "../src/tui/file-index.js";
import { expandPastePlaceholders, isLargePaste, pastePlaceholder } from "../src/tui/composer-paste.js";
import { formatElapsed, reasoningHeadline } from "../src/tui/RunStatusLine.js";
import { pagerOffsetForAnchor } from "../src/tui/TranscriptPager.js";
import { workingTreeDiff } from "../src/commands/git-working-diff.js";
import { getCommand } from "../src/commands/registry.js";
import type { CommandContext } from "../src/commands/types.js";
import type { TranscriptRow } from "../src/tui/conversation/projector.js";

describe("approval modes", () => {
  test("accepts the documented names and common synonyms", () => {
    expect(parseApprovalMode("ask")).toBe("ask");
    expect(parseApprovalMode("read-only")).toBe("ask");
    expect(parseApprovalMode("AUTO")).toBe("auto");
    expect(parseApprovalMode("full-access")).toBe("full");
    expect(parseApprovalMode("yolo")).toBeUndefined();
  });

  test("full access outranks Project Auto in the derived mode", () => {
    expect(approvalModeFrom(false, false)).toBe("ask");
    expect(approvalModeFrom(true, false)).toBe("auto");
    expect(approvalModeFrom(true, true)).toBe("full");
  });

  test("full access never waives a danger rating", () => {
    expect(fullAccessApproves({ level: "warning" })).toBe(true);
    expect(fullAccessApproves({})).toBe(true);
    expect(fullAccessApproves({ level: "danger" })).toBe(false);
  });

  test("/approvals sets a mode directly or offers a picker", () => {
    const command = getCommand("approvals")!;
    const chosen: string[] = [];
    const ctx = { approvalMode: "ask", setApprovalMode: (mode: string) => chosen.push(mode) } as unknown as CommandContext;
    expect(command.handler(["full"], ctx)).toEqual({ type: "text", content: "" });
    expect(chosen).toEqual(["full"]);
    expect(command.handler(["sometimes"], ctx)).toMatchObject({ type: "error" });
    const picker = command.handler([], ctx);
    expect(picker).toMatchObject({ type: "picker" });
    if (picker instanceof Promise || picker.type !== "picker") throw new Error("expected picker");
    expect(picker.items.map((item) => item.id)).toEqual(["ask", "auto", "full"]);
    expect(picker.items[0]!.label.startsWith("●")).toBe(true);
    picker.onSelect(picker.items[1]!);
    expect(chosen).toEqual(["full", "auto"]);
  });
});

describe("session commands", () => {
  test("/new, /diff, and /resume resolve to their own commands", () => {
    expect(getCommand("new")?.name).toBe("new");
    expect(getCommand("diff")?.name).toBe("diff");
    expect(getCommand("resume")?.name).toBe("sessions");
    expect(getCommand("new")!.handler([], {} as CommandContext)).toEqual({ type: "new" });
  });
});

describe("exit summary", () => {
  test("prints usage and the resume command after a session with prompts", () => {
    const lines = formatExitSummary({
      sessionId: "abc-123",
      turns: 2,
      tokens: { input: 1200, output: 340, cacheRead: 800, cacheWrite: 0, reasoning: 0 },
    });
    expect(lines).toEqual([
      "Token usage: 2,340 total · 1,200 input (+800 cached) · 340 output",
      "To continue this session, run: aurict --resume abc-123",
    ]);
  });

  test("stays silent when nothing was asked", () => {
    expect(formatExitSummary(null)).toEqual([]);
    expect(formatExitSummary({ sessionId: "x", turns: 0, tokens: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0 } })).toEqual([]);
  });
});

describe("fuzzy file search", () => {
  const paths = withDirectories([
    "README.md",
    "packages/cli/src/tui/App.tsx",
    "packages/cli/src/tui/app/AppScreen.tsx",
    "packages/cli/src/tui/MultilineInput.tsx",
    "packages/cli/test/terminal-input-queue.test.ts",
    "packages/core/src/agent/loop.ts",
    "docs/terminal-design-baseline.md",
  ]);

  test("indexes parent directories for path browsing", () => {
    expect(paths).toContain("packages/cli/src/tui/");
    expect(paths).toContain("docs/");
  });

  test("requires the query characters in order", () => {
    expect(fuzzyPathScore("mli", "packages/cli/src/tui/MultilineInput.tsx")).not.toBeNull();
    expect(fuzzyPathScore("zzz", "packages/cli/src/tui/App.tsx")).toBeNull();
  });

  test("ranks basename and segment-start matches first", () => {
    expect(rankPaths("app", paths, 3).map((match) => match.path)[0]).toBe("packages/cli/src/tui/App.tsx");
    expect(rankPaths("baseline", paths, 1)[0]!.path).toBe("docs/terminal-design-baseline.md");
    // camelCase word starts beat a scattered match across a longer name
    expect(rankPaths("mlinput", paths, 1)[0]!.path).toBe("packages/cli/src/tui/MultilineInput.tsx");
  });

  test("returns at most the requested number of matches", () => {
    expect(rankPaths("s", paths, 2)).toHaveLength(2);
  });
});

describe("large paste placeholders", () => {
  test("only multi-line or long pastes collapse", () => {
    expect(isLargePaste("short text")).toBe(false);
    expect(isLargePaste("a\nb\nc")).toBe(false);
    expect(isLargePaste("1\n2\n3\n4\n5\n6")).toBe(true);
    expect(isLargePaste("x".repeat(1001))).toBe(true);
  });

  test("placeholders describe the paste and expand back exactly", () => {
    const content = Array.from({ length: 40 }, (_, index) => `line ${index}`).join("\n");
    const placeholder = pastePlaceholder(1, content);
    expect(placeholder).toBe("[Pasted text #1 · 40 lines]");
    const draft = `Please review ${placeholder} carefully`;
    expect(expandPastePlaceholders(draft, new Map([[placeholder, content]]))).toBe(`Please review ${content} carefully`);
  });

  test("an edited placeholder is sent as typed", () => {
    expect(expandPastePlaceholders("[Pasted text #1 · 4 lines", new Map([["[Pasted text #1 · 40 lines]", "x"]])))
      .toBe("[Pasted text #1 · 4 lines");
  });
});

describe("run status line", () => {
  test("formats elapsed time compactly", () => {
    expect(formatElapsed(0)).toBe("0s");
    expect(formatElapsed(59_900)).toBe("59s");
    expect(formatElapsed(65_000)).toBe("1m 05s");
    expect(formatElapsed(3_725_000)).toBe("1h 02m");
  });

  test("uses the latest bold reasoning heading as the subtitle", () => {
    expect(reasoningHeadline("**Reading files**\nlooking...\n**Planning the refactor**\n...")).toBe("Planning the refactor");
    expect(reasoningHeadline("plain reasoning")).toBeUndefined();
    expect(reasoningHeadline(null)).toBeUndefined();
  });
});

describe("transcript pager", () => {
  const rows: TranscriptRow[] = Array.from({ length: 50 }, (_, index) => ({
    id: `m${Math.floor(index / 10)}:${index}`,
    segments: [{ text: `row ${index}` }],
  }));

  test("opens at the bottom unless a message is anchored", () => {
    expect(pagerOffsetForAnchor(rows, 10, null)).toBe(0);
    expect(pagerOffsetForAnchor(rows, 10, "missing")).toBe(0);
  });

  test("an anchored message starts at the top of the view", () => {
    const offset = pagerOffsetForAnchor(rows, 10, "m2");
    expect(rows.length - 10 - offset).toBe(20);
    expect(pagerOffsetForAnchor(rows, 10, "m0")).toBe(40);
  });
});

describe("working tree diff", () => {
  test("includes staged, unstaged, and untracked changes", async () => {
    const repo = mkdtempSync(join(tmpdir(), "aurict-diff-"));
    try {
      const git = (...args: string[]) => execFileSync("git", args, { cwd: repo, stdio: "pipe" });
      git("init", "-q");
      git("config", "user.email", "test@example.com");
      git("config", "user.name", "Test");
      writeFileSync(join(repo, "tracked.txt"), "one\n");
      git("add", ".");
      git("commit", "-qm", "init");
      writeFileSync(join(repo, "tracked.txt"), "one\ntwo\n");
      writeFileSync(join(repo, "new.txt"), "fresh\n");
      const result = await workingTreeDiff(repo);
      expect(result.trackedFiles).toBe(1);
      expect(result.untrackedFiles).toBe(1);
      expect(result.diff).toContain("+two");
      expect(result.diff).toContain("+fresh");
    } finally {
      rmSync(repo, { recursive: true, force: true });
    }
  });

  test("fails loudly outside a repository", async () => {
    const directory = mkdtempSync(join(tmpdir(), "aurict-nodiff-"));
    try {
      await expect(workingTreeDiff(directory)).rejects.toThrow("Not a git repository");
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
