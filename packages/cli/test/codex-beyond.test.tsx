import React from "react";
import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { render } from "ink-testing-library";
import { sessionSnapshotScope, snapshotManager, type PermissionRequest } from "@aurict/core";
import {
  checkpointChangedFiles,
  checkpointForMessage,
  createTurnCheckpoint,
  restoreCheckpointFiles,
  rewindChoiceItems,
} from "../src/tui/app/turn-checkpoints.js";
import {
  initialPatchSelection,
  patchSelectionResponse,
  patchSelectionRows,
  rowState,
  togglePatchRow,
  type PatchFile,
} from "../src/tui/patch-selection.js";
import { GranularPatchRequest } from "../src/tui/GranularPatchRequest.js";
import { projectInlineDiff, diffLanguage } from "../src/tui/conversation/inline-diff.js";
import { syntaxPalette } from "../src/tui/TranscriptRows.js";
import { projectStableMessage, turnStatsRow } from "../src/tui/conversation/projector.js";
import { SessionFooter } from "../src/tui/SessionChrome.js";
import { editLastQueuedMessage } from "../src/tui/app/app-keyboard-actions.js";
import type { AppKeyboardParams } from "../src/tui/app/app-keyboard-types.js";
import { getCommand } from "../src/commands/registry.js";
import type { CommandContext } from "../src/commands/types.js";
import type { DisplayMessage } from "../src/tui/conversation/types.js";
import { THEMES } from "../src/utils/theme.js";

const flush = () => new Promise((resolve) => setTimeout(resolve, 20));
const text = (row: { segments: Array<{ text: string }> }) => row.segments.map((segment) => segment.text).join("");

describe("turn checkpoints", () => {
  let dir: string;
  const original = snapshotManager.getStorageDir();

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "aurict-turns-"));
    snapshotManager.setStorageDir(join(dir, ".snapshots"));
    snapshotManager.clear();
  });

  afterEach(() => {
    snapshotManager.clear();
    snapshotManager.setStorageDir(original);
    rmSync(dir, { recursive: true, force: true });
  });

  test("restores every file the agent changed after the prompt, in the session's tool scope", async () => {
    const file = join(dir, "app.ts");
    writeFileSync(file, "before\n");
    const messages: DisplayMessage[] = [{ id: "u0", role: "user", content: "earlier" }];
    const checkpoint = createTurnCheckpoint({ messages, history: [], workdir: dir, sessionId: "s1", prompt: "refactor the app" });
    expect(checkpoint.scope).toBe(sessionSnapshotScope(dir, "s1"));
    expect(checkpoint.label).toBe("refactor the app");

    // What edit/write/apply_patch do before touching a file:
    await snapshotManager.takeSnapshot(file, sessionSnapshotScope(dir, "s1"));
    writeFileSync(file, "after one\n");
    await snapshotManager.takeSnapshot(file, sessionSnapshotScope(dir, "s1"));
    writeFileSync(file, "after two\n");

    expect(checkpointChangedFiles(checkpoint)).toEqual([file]);
    expect(await restoreCheckpointFiles(checkpoint)).toEqual([file, file]);
    expect(readFileSync(file, "utf8")).toBe("before\n");
    expect(checkpointChangedFiles(checkpoint)).toEqual([]);
  });

  test("finds the checkpoint taken right before a prompt", () => {
    const messages: DisplayMessage[] = [
      { id: "u1", role: "user", content: "first" },
      { id: "a1", role: "assistant", content: "ok" },
      { id: "u2", role: "user", content: "second" },
    ];
    const first = createTurnCheckpoint({ messages: [], history: [], workdir: dir, sessionId: "s", prompt: "first" });
    const second = createTurnCheckpoint({ messages: messages.slice(0, 2), history: [], workdir: dir, sessionId: "s", prompt: "second" });
    expect(checkpointForMessage([first, second], messages, 2)).toBe(1);
    expect(checkpointForMessage([first, second], messages, 0)).toBe(0);
    expect(checkpointForMessage([first, second], messages, 1)).toBe(-1);
  });

  test("offers a file restore only with the files it would touch", () => {
    const items = rewindChoiceItems(["/w/src/a.ts", "/w/src/b.ts", "/w/c.ts", "/w/d.ts"]);
    expect(items.map((item) => item.id)).toEqual(["files", "conversation", "cancel"]);
    expect(items[0]!.hint).toBe("restore 4 files: a.ts, b.ts, c.ts +1");
  });
});

describe("rewind commands", () => {
  const checkpoints = [
    { mark: 0, messages: [], history: [], label: "first", prompt: "first", createdAt: 0 },
    { mark: 1, messages: [], history: [], label: "second", prompt: "second", createdAt: 0 },
  ];

  test("/rewind lists prompts newest first and asks before rewinding", () => {
    const requested: number[] = [];
    const ctx = { checkpoints, checkpointFiles: () => [], requestRewind: (index: number) => requested.push(index) } as unknown as CommandContext;
    const result = getCommand("rewind")!.handler([], ctx);
    if (result instanceof Promise || result.type !== "picker") throw new Error("expected picker");
    expect(result.items.map((item) => item.label)).toEqual(['before "second"', 'before "first"']);
    result.onSelect(result.items[1]!);
    expect(requested).toEqual([0]);
    getCommand("rewind")!.handler(["1"], ctx);
    expect(requested).toEqual([0, 1]);
  });

  test("/undo N restores files and conversation N prompts back", async () => {
    const rewound: Array<[number, boolean]> = [];
    const ctx = { checkpoints, rewindTo: async (index: number, files: boolean) => { rewound.push([index, files]); return []; } } as unknown as CommandContext;
    await getCommand("undo")!.handler(["2"], ctx);
    expect(rewound).toEqual([[0, true]]);
  });
});

const files: PatchFile[] = [
  { path: "app.ts", action: "update", hunks: [{ context: "first", added: 1, removed: 1 }, { context: "second", added: 2, removed: 0 }] },
  { path: "notes.md", action: "add" },
];

describe("patch hunk selection model", () => {
  test("multi-chunk updates expose a row per chunk", () => {
    expect(patchSelectionRows(files)).toEqual([
      { kind: "file", fileIndex: 0 },
      { kind: "hunk", fileIndex: 0, hunkIndex: 0 },
      { kind: "hunk", fileIndex: 0, hunkIndex: 1 },
      { kind: "file", fileIndex: 1 },
    ]);
  });

  test("a partially selected update approves only its chosen chunks", () => {
    const rows = patchSelectionRows(files);
    const selection = togglePatchRow(initialPatchSelection(files), files, rows[1]!);
    expect(rowState(selection, files, rows[0]!)).toBe("some");
    expect(patchSelectionResponse(selection, files)).toEqual({ approvedFiles: ["app.ts", "notes.md"], approvedHunks: { "app.ts": [1] } });
  });

  test("toggling a file selects all its chunks unless all are selected", () => {
    const rows = patchSelectionRows(files);
    let selection = togglePatchRow(initialPatchSelection(files), files, rows[1]!);
    selection = togglePatchRow(selection, files, rows[0]!);
    expect(rowState(selection, files, rows[0]!)).toBe("all");
    selection = togglePatchRow(selection, files, rows[0]!);
    selection = togglePatchRow(selection, files, rows[3]!);
    expect(patchSelectionResponse(selection, files)).toBeNull();
  });
});

describe("GranularPatchRequest", () => {
  test("lists chunks and sends the chunk selection", async () => {
    const onDecide = mock((_decision: unknown) => {});
    const request: PermissionRequest = { id: "p1", tool: "apply_patch", pattern: "app.ts", files, patch: { text: "*** Begin Patch\n*** End Patch", granular: true } };
    const view = render(<GranularPatchRequest request={request} onDecide={onDecide} />);
    await flush();
    expect(view.lastFrame()).toContain("@@ first  +1 −1");
    expect(view.lastFrame()).toContain("@@ second  +2 −0");
    view.stdin.write("\x1b[C");
    await flush();
    view.stdin.write(" ");
    await flush();
    expect(view.lastFrame()).toContain("[~]");
    view.stdin.write("\r");
    await flush();
    expect(onDecide).toHaveBeenCalledWith({ decision: "allow_partial", approvedFiles: ["app.ts", "notes.md"], approvedHunks: { "app.ts": [1] } });
    view.unmount();
  });
});

describe("syntax-highlighted diffs", () => {
  const diff = [
    "--- a/src/app.ts",
    "+++ b/src/app.ts",
    "@@ -1,2 +1,2 @@",
    " const name = \"aurict\"",
    "-return 1",
    "+return 2",
  ].join("\n");

  test("added and context lines carry syntax kinds, removed lines keep the removal tone", () => {
    const rows = projectInlineDiff(diff, "d", "d", 100);
    const context = rows.find((row) => text(row).includes("const name"))!;
    const removed = rows.find((row) => text(row).includes("return 1"))!;
    const added = rows.find((row) => text(row).includes("return 2"))!;
    expect(context.segments.some((segment) => segment.syntax === "keyword")).toBe(true);
    expect(context.segments.some((segment) => segment.syntax === "string")).toBe(true);
    expect(added.segments.some((segment) => segment.syntax === "keyword")).toBe(true);
    expect(removed.segments.some((segment) => segment.syntax)).toBe(false);
    expect(diffLanguage("README")).toBeUndefined();
  });

  test("only dark brand themes get syntax colours", () => {
    expect(syntaxPalette(THEMES["high-contrast"]!)).toBeNull();
    expect(syntaxPalette(THEMES["light"]!)).toBeNull();
    expect(syntaxPalette(THEMES["system-ansi"]!)).toBeNull();
    expect(syntaxPalette(THEMES["whiskey-amber"]!)).not.toBeNull();
  });
});

describe("turn stats", () => {
  test("a finished turn closes with duration, tokens, and cost", () => {
    expect(text(turnStatsRow("r", { durationMs: 12_400, tokens: 1540, costUsd: 0.0041 }, 80)))
      .toMatch(/^── Worked for 12s · 1\.5k tokens · \$0\.0041 ─+$/);
    expect(text(turnStatsRow("r", { durationMs: 900, tokens: 0, costUsd: 0 }, 80))).toMatch(/^── Worked for 0s ─+$/);
  });

  test("the stats row is the assistant message's last content row", () => {
    const rows = projectStableMessage({ id: "a1", role: "assistant", content: "Done.", turnStats: { durationMs: 65_000, tokens: 10, costUsd: 0 } }, 0, 80);
    expect(rows.at(-2)!.id).toBe("a1:stats");
    expect(text(rows.at(-2)!)).toContain("Worked for 1m 05s");
  });
});

describe("inline footer extras", () => {
  test("shows proof, cost, and a /compact nudge near the context limit", () => {
    const view = render(
      <SessionFooter
        cols={140}
        sandboxBackend="policy"
        proof={{ status: "passed", evidenceCount: 3, criteria: [] } as never}
        costUsd={0.0123}
        session={{ provider: "anthropic", model: "claude-sonnet-5-5", contextTokens: 180_000, contextWindow: 200_000 }}
      />,
    );
    const frame = view.lastFrame()!;
    expect(frame).toContain("ctx 90% /compact");
    expect(frame).toContain("proof 3");
    expect(frame).toContain("$0.012");
    view.unmount();
  });
});

describe("editable queue", () => {
  test("Alt+Up takes the newest queued message back into an empty composer", () => {
    let queue = [{ id: "q1", kind: "steer" as const, text: "first" }, { id: "q2", kind: "queued" as const, text: "second" }];
    let input = "";
    const params = {
      composerQueue: queue,
      inputRef: { current: "" },
      setComposerQueue: (update: (items: typeof queue) => typeof queue) => { queue = update(queue); },
      setInput: (value: string) => { input = value; },
    } as unknown as AppKeyboardParams;
    expect(editLastQueuedMessage(params)).toBe(true);
    expect(input).toBe("second");
    expect(queue.map((item) => item.id)).toEqual(["q1"]);
  });

  test("never overwrites a draft", () => {
    const params = { composerQueue: [{ id: "q1", kind: "queued", text: "x" }], inputRef: { current: "draft" } } as unknown as AppKeyboardParams;
    expect(editLastQueuedMessage(params)).toBe(false);
  });
});
