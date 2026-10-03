import { describe, expect, test } from "bun:test";
import {
  planInlineCommit,
  settledBlockBoundary,
  settledRowCount,
} from "../src/tui/conversation/inline-commit.js";
import { TranscriptProjectionCache } from "../src/tui/conversation/projection-cache.js";
import type { TranscriptBlock, TranscriptMessage } from "../src/tui/conversation/types.js";
import { terminalScenarios } from "./fixtures/terminal-scenarios.js";

const WIDTH = 80;

function tool(id: string, pending = false, tool = "read"): TranscriptBlock {
  return pending
    ? { type: "tool", id, tool, args: `{"path":"${id}.ts"}`, pending: true }
    : { type: "tool", id, tool, args: `{"path":"${id}.ts"}`, pending: false, resultContent: "ok", durationMs: 4 };
}

function text(content: string): TranscriptBlock {
  return { type: "text", content };
}

function settle(messages: TranscriptMessage[]) {
  const rowsByMessage = new TranscriptProjectionCache().projectByMessage(messages, WIDTH);
  return { rowsByMessage, stable: rowsByMessage.flat(), settled: settledRowCount(messages, rowsByMessage, WIDTH) };
}

function rowIds(messages: TranscriptMessage[]): string[] {
  const { stable, settled } = settle(messages);
  return stable.slice(0, settled).map((row) => row.id);
}

describe("settledBlockBoundary", () => {
  test("stops before a pending call that may still join the previous activity group", () => {
    expect(settledBlockBoundary([tool("a"), tool("b", true)])).toBe(0);
    expect(settledBlockBoundary([text("Looking first."), tool("a"), tool("b", true)])).toBe(1);
  });

  test("prose ends a tool group, so completed groups before it are final", () => {
    expect(settledBlockBoundary([tool("a"), tool("b"), text("Next step."), tool("c", true)])).toBe(3);
  });

  test("never settles past an unfinished call", () => {
    expect(settledBlockBoundary([tool("a", true), text("later")])).toBe(0);
  });
});

describe("settledRowCount", () => {
  test("every row is final once no message is pending", () => {
    const messages = terminalScenarios.normal!;
    const { stable, settled } = settle(messages);
    expect(settled).toBe(stable.length);
  });

  test("nothing after the first pending message is committed", () => {
    const messages: TranscriptMessage[] = [
      { id: "u1", role: "user", content: "hello" },
      { id: "a1", role: "assistant", content: "", pending: true },
      { id: "s1", role: "system", content: "dependency change" },
    ];
    const ids = rowIds(messages);
    expect(ids.every((id) => id.startsWith("u1:"))).toBe(true);
    expect(ids.length).toBeGreaterThan(0);
  });

  test("an open assistant turn commits only blocks before its last safe boundary", () => {
    const messages: TranscriptMessage[] = [
      { id: "u1", role: "user", content: "inspect" },
      {
        id: "a1",
        role: "assistant",
        content: "",
        pending: true,
        blocks: [text("I'll inspect the workspace first."), tool("a"), text("Now reading the README."), tool("b", true)],
      },
    ];
    const ids = rowIds(messages);
    expect(ids).toContain("a1:header");
    expect(ids.some((id) => id.startsWith("a1:tool:1"))).toBe(true);
    expect(ids.some((id) => id.startsWith("a1:text:2"))).toBe(true);
    expect(ids.some((id) => id.startsWith("a1:tool:3"))).toBe(false);
  });

  test("committed rows stay a prefix as the open turn grows and finishes", () => {
    const blocks = [text("I'll inspect the workspace first."), tool("a"), text("Now reading the README.")];
    const turn = (extra: TranscriptBlock[], pending: boolean): TranscriptMessage[] => [
      { id: "u1", role: "user", content: "inspect" },
      { id: "a1", role: "assistant", content: "", pending, blocks: [...blocks, ...extra] },
    ];
    const steps = [
      turn([tool("b", true)], true),
      turn([tool("b")], true),
      turn([tool("b"), tool("c", true)], true),
      turn([tool("b"), tool("c"), text("Done.")], false),
    ];
    let committed: ReturnType<typeof settle>["stable"] = [];
    for (const messages of steps) {
      const { stable, settled } = settle(messages);
      const plan = planInlineCommit(committed, stable, settled);
      expect(plan.kind).not.toBe("reset");
      if (plan.kind === "append") committed = [...committed, ...plan.rows];
    }
    const final = settle(steps.at(-1)!);
    expect(committed.map((row) => row.id)).toEqual(final.stable.map((row) => row.id));
  });
});

describe("planInlineCommit", () => {
  const { stable } = settle(terminalScenarios.normal!);

  test("appends newly settled rows", () => {
    const plan = planInlineCommit(stable.slice(0, 2), stable, stable.length);
    expect(plan).toEqual({ kind: "append", rows: stable.slice(2) });
  });

  test("does nothing while the committed prefix is unchanged", () => {
    expect(planInlineCommit(stable.slice(0, 3), stable, 3)).toEqual({ kind: "none" });
  });

  test("requests a full reprint when history no longer starts with what was written", () => {
    const rewritten = settle([{ id: "x1", role: "system", content: "History cleared" }]);
    const plan = planInlineCommit(stable, rewritten.stable, rewritten.settled);
    expect(plan).toEqual({ kind: "reset", rows: rewritten.stable });
  });

  test("a width change is a rewrite", () => {
    const narrow = new TranscriptProjectionCache().project(terminalScenarios.normal!, 40);
    expect(planInlineCommit(stable, narrow, narrow.length).kind).toBe("reset");
  });
});
