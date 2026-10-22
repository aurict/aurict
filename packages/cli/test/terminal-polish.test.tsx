import { describe, expect, test } from "bun:test";
import React from "react";
import { render } from "ink-testing-library";
import { ConversationViewport, viewportTopPadding } from "../src/tui/ConversationViewport.js";
import { StartupBanner } from "../src/tui/StartupBanner.js";
import { TerminalSizeContext } from "../src/tui/TerminalSizeContext.js";
import { Typo } from "../src/tui/design-system/index.js";
import { ComposerPane } from "../src/tui/app-shell/ComposerPane.js";
import { TranscriptRows } from "../src/tui/TranscriptRows.js";

const stripAnsi = (value: string) => value.replace(/\x1b\[[0-9;]*m/g, "");

describe("terminal polish contract", () => {
  test("bottom-anchors short transcripts but not scrolled history", () => {
    expect(viewportTopPadding(3, 12, 0)).toBe(9);
    expect(viewportTopPadding(12, 12, 0)).toBe(0);
    expect(viewportTopPadding(3, 12, 2)).toBe(0);
  });

  test("places the latest short transcript row immediately above the composer boundary", () => {
    const frame = render(
      <ConversationViewport
        height={8}
        width={60}
        messages={[{ id: "notice", role: "system", content: "Latest result" }]}
        loading={false}
        streamingText={null}
        streamingReason={null}
        streamingError={null}
        scrollLocked={false}
        offsetRowsFromBottom={0}
      />,
    ).lastFrame() ?? "";
    const rows = stripAnsi(frame).split("\n");
    expect(rows.findIndex((row) => row.includes("Latest result"))).toBeGreaterThanOrEqual(6);
  });

  test("keeps a semantic unseen indicator visible while output is paused at the bottom", () => {
    const frame = stripAnsi(render(
      <ConversationViewport
        height={8}
        width={60}
        messages={[{ id: "notice", role: "system", content: "Latest result" }]}
        loading={false}
        streamingText={null}
        streamingReason={null}
        streamingError={null}
        scrollLocked
        offsetRowsFromBottom={0}
        unseenCount={1}
        unseenLabel="verify failed"
      />,
    ).lastFrame() ?? "");
    expect(frame).toContain("⋯ 1 new · verify failed ↓");
  });

  test("prints the aurict session header", () => {
    const frame = stripAnsi(render(
      <StartupBanner
        version="v1.2.7"
        provider="opencode"
        model="deepseek-v4"
        workdir="/workspace/aurict"
        cols={100}
        rows={30}
      />,
    ).lastFrame() ?? "");
    const lines = frame.split("\n");
    expect(frame).toContain("  aurict█ v1.2.7");
    expect(frame).toContain("\n  /workspace/aurict\n");
    expect(frame).toContain("  /init         create an AGENTS.md file");
    expect(frame).not.toContain("deepseek-v4");
    expect(frame).not.toContain("YOLO mode");
    expect(frame).toContain("To get started, describe a task or try one of these commands:");
    expect(frame).not.toContain("AURICT");
    // Only the wordmark cursor, never a block-letter logo.
    expect(frame.split("█")).toHaveLength(2);
    expect(lines.every((line) => line.length <= 100)).toBe(true);
  });

  test("marks full-access sessions with the YOLO line", () => {
    const frame = stripAnsi(render(
      <StartupBanner version="v1.2.7" provider="opencode" model="deepseek-v4" workdir="/workspace/aurict" fullAccess />,
    ).lastFrame() ?? "");
    expect(frame).toContain("  permissions: YOLO mode");
  });

  test("drops the command help on short terminals", () => {
    const frame = stripAnsi(render(
      <StartupBanner
        version="v1.2.7"
        provider="opencode"
        model="deepseek-v4"
        workdir="/workspace/aurict"
        cols={100}
        rows={16}
      />,
    ).lastFrame() ?? "");
    expect(frame).toContain("aurict█ v1.2.7");
    expect(frame).toContain("/workspace/aurict");
    expect(frame).not.toContain("To get started");
  });

  test("keeps the composer focused and removes dashboard-era labels", () => {
    const frame = render(
      <TerminalSizeContext.Provider value={{ columns: 100, rows: 30 }}>
        <ComposerPane
          visible
          value=""
          onChange={() => {}}
          onSubmit={() => {}}
          onQueue={() => {}}
          working={false}
          history={[]}
          queue={[]}
          inlineSuggestionActive={false}
          onInputTruncated={() => {}}
          onCopied={() => {}}
        />
      </TerminalSizeContext.Provider>,
    ).lastFrame() ?? "";
    const plain = stripAnsi(frame);
    // The empty input shows the block cursor between the prompt and the placeholder.
    expect(plain).toMatch(/❯ +Ask Aurict to do anything/);
    expect(plain).not.toContain("PROMPT");
    expect(plain).not.toContain("╭");
    expect(frame).not.toContain("INSERT");
    expect(frame).not.toContain("tasks");
    expect(frame).not.toContain("history");
  });

  test("renders a user turn with the brand prompt gutter and no rail", () => {
    const frame = stripAnsi(render(
      <TerminalSizeContext.Provider value={{ columns: 100, rows: 20 }}>
        <ConversationViewport
          height={6}
          width={91}
          messages={[{ id: "user", role: "user", content: "Modern terminal" }]}
          loading={false}
          streamingText={null}
          streamingReason={null}
          streamingError={null}
          scrollLocked={false}
          offsetRowsFromBottom={0}
        />
      </TerminalSizeContext.Provider>,
    ).lastFrame() ?? "");
    expect(frame).toContain("❯ Modern terminal");
    expect(frame).not.toContain("│");
    expect(frame).not.toContain("You ·");
  });

  test("turns semantic gap rows into true visual whitespace", () => {
    const frame = stripAnsi(render(
      <TranscriptRows
        rail
        rows={[
          { id: "before", segments: [{ text: "Before tool", tone: "assistant" }] },
          { id: "gap", segments: [{ text: "", tone: "muted" }] },
          { id: "after", segments: [{ text: "After tool", tone: "assistant" }] },
        ]}
      />,
    ).lastFrame() ?? "");
    expect(frame).toContain("│ Before tool\n\n│ After tool");
  });

  test("draws the composer as a frameless block one row taller on each side", () => {
    const composer = stripAnsi(render(
      <TerminalSizeContext.Provider value={{ columns: 100, rows: 30 }}>
        <ComposerPane
          visible
          value=""
          onChange={() => {}}
          onSubmit={() => {}}
          onQueue={() => {}}
          working={false}
          history={[]}
          queue={[]}
          inlineSuggestionActive={false}
          onInputTruncated={() => {}}
          onCopied={() => {}}
        />
      </TerminalSizeContext.Provider>,
    ).lastFrame() ?? "");
    const lines = composer.split("\n");
    const promptIndex = lines.findIndex((line) => /❯ +Ask Aurict to do anything/.test(line));
    expect(promptIndex).toBe(1);
    expect(lines).toHaveLength(3);
    expect(composer).not.toMatch(/[╭╮╰╯│─]/);
  });

  test("does not combine a semantic muted color with ANSI dim", () => {
    const frame = render(<Typo variant="caption" tone="muted" dimColor>metadata</Typo>).lastFrame() ?? "";
    expect(frame).toContain("metadata");
    expect(frame).not.toContain("\u001b[2m");
  });
});
