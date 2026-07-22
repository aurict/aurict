import { describe, expect, it } from "bun:test";
import React from "react";
import { render } from "ink-testing-library";
import { Message } from "../src/tui/Message.js";
import { TerminalSizeContext } from "../src/tui/TerminalSizeContext.js";
import { projectStableTranscript } from "../src/tui/conversation/projector.js";
import { alignToolRow } from "../src/tui/conversation/tool-row-model.js";
import { displayWidth } from "../src/tui/terminal-text/display-width.js";

const stripAnsi = (value: string): string => value.replace(/\x1b\[[0-9;]*m/g, "");
const rowText = (row: ReturnType<typeof projectStableTranscript>[number]): string =>
  row.segments.map((segment) => segment.text).join("");

describe("tool transcript readability", () => {
  it("always separates a full-width action label from its subject", () => {
    const row = alignToolRow("env inspect", "34 variables", "1.2s", 80);
    const visible = `  ${row.action}${row.separator}${row.subject}${row.spacer}${row.metadata}`;

    expect(row.layout).toBe("inline");
    expect(row.separator).toBe("  ");
    expect(visible).toContain("env inspect  34 variables");
    expect(visible).not.toContain("inspect34");
    expect(displayWidth(visible)).toBeLessThanOrEqual(80);
  });

  it("stacks the subject without losing metadata on narrow terminals", () => {
    const row = alignToolRow("dependency docs", "zod@3 safeParse", "820ms", 40);

    expect(row.layout).toBe("stacked");
    expect(displayWidth(`  ${row.action}${row.spacer}${row.metadata}`)).toBeLessThanOrEqual(40);
    expect(displayWidth(`    ${row.subject}`)).toBeLessThanOrEqual(40);
  });

  it("places exactly one breathing row between a call and its short outcome", () => {
    const rows = projectStableTranscript([{
      id: "verify-result",
      role: "tool_call",
      tool: "bash",
      content: JSON.stringify({ command: "bun test" }),
      resultContent: "380 pass\n0 fail",
    }], 80);
    const visible = rows.map(rowText);
    const call = rows.findIndex((row) => row.id.startsWith("verify-result:tool:summary"));
    const result = rows.findIndex((row) => row.id.startsWith("verify-result:tool:result:"));

    expect(result).toBe(call + 2);
    expect(visible[call + 1]).toBe("");
    expect(visible[result]).toMatch(/380 passed · 0 failed\s+details \^O/);
    expect(rows[result]!.segments.some((segment) => segment.tone === "success")).toBe(true);
  });

  it("uses red for failure status without turning its explanation into a red wall", () => {
    const rows = projectStableTranscript([{
      id: "failed-run",
      role: "tool_call",
      tool: "bash",
      content: JSON.stringify({ command: "bun run build" }),
      artifact: { kind: "error", output: "ERROR: TypeScript compilation failed", outputLines: 1 },
    }], 80);
    const call = rows.find((row) => row.id.startsWith("failed-run:tool:summary"));
    const outcome = rows.find((row) => row.id.startsWith("failed-run:tool:error:"));

    expect(call?.segments.some((segment) => segment.tone === "error")).toBe(true);
    expect(outcome?.segments.some((segment) => segment.tone === "error")).toBe(false);
    expect(rowText(outcome!)).toContain("TypeScript compilation failed");
  });

  it("summarizes environment inspection without joining the count to its label", () => {
    const output = "## Runtimes\n  bun 1.3.12\n\n## Available Tools\n  git";
    const rows = projectStableTranscript([{
      id: "environment",
      role: "assistant",
      content: "",
      blocks: [
        { type: "tool", id: "one", tool: "env_inspect", args: "{}", resultContent: output, pending: false },
        { type: "tool", id: "two", tool: "env_inspect", args: "{}", resultContent: output, pending: false },
      ],
    }], 80);
    const visible = rows.map(rowText).join("\n");

    expect(visible).toMatch(/│ env inspect\s{2,}2 sections inspected/);
    expect(visible).not.toContain("inspect2");
  });

  it("adds file distribution to search summaries when paths are available", () => {
    const rows = projectStableTranscript([{
      id: "search-result",
      role: "tool_call",
      tool: "bash",
      content: JSON.stringify({ command: "rg TODO src" }),
      resultContent: "src/a.ts:1:TODO\nsrc/a.ts:8:TODO\nsrc/b.ts:3:TODO",
    }], 100);

    expect(rows.map(rowText).join("\n")).toMatch(/3 matches · 2 files\s+details \^O/);
  });

  it("renders the spacing contract through the real Ink component", () => {
    const frame = stripAnsi(render(
      <TerminalSizeContext.Provider value={{ columns: 80, rows: 24 }}>
        <Message message={{
          id: "ink-result",
          role: "tool_call",
          tool: "bash",
          content: JSON.stringify({ command: "bun test" }),
          resultContent: "12 pass\n0 fail",
        }} />
      </TerminalSizeContext.Provider>,
    ).lastFrame() ?? "");

    expect(frame).toMatch(/bun test[^\n]*\n\s*\n\s*└ 12 passed · 0 failed/);
    expect(frame).toContain("details ^O");
  });

  it("keeps tool rows bounded across compact and wide terminal widths", () => {
    for (const width of [40, 60, 80, 120, 160]) {
      const rows = projectStableTranscript([{
        id: `width-${width}`,
        role: "tool_call",
        tool: "mcp:dependency_docs:search_export",
        content: JSON.stringify({ query: "日本語 safeParse 👩🏽‍💻" }),
        resultContent: "12 matching exports",
        durationMs: 1_280,
      }], width);

      expect(rows.every((row) => displayWidth(rowText(row)) <= width)).toBe(true);
      expect(rows.flatMap((row) => row.segments).some((segment) => segment.text.includes("�"))).toBe(false);
    }
  });

  it("renders the stacked layout through Ink on a compact terminal", () => {
    const frame = stripAnsi(render(
      <TerminalSizeContext.Provider value={{ columns: 40, rows: 20 }}>
        <Message message={{
          id: "compact-env",
          role: "tool_call",
          tool: "env_inspect",
          content: "workspace",
          resultContent: "## Runtimes\n  bun 1.3.12",
        }} />
      </TerminalSizeContext.Provider>,
    ).lastFrame() ?? "");

    expect(frame).toMatch(/› env inspect\n\s+workspace\n\s*\n\s*└ 1 section inspected/);
    expect(frame.split("\n").every((line) => displayWidth(line) <= 40)).toBe(true);
  });
});
