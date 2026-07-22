import { describe, expect, test } from "bun:test";
import React from "react";
import { cleanup, render } from "ink-testing-library";
import { ConversationViewport, viewportTopPadding } from "../src/tui/ConversationViewport.js";
import { StartupBanner } from "../src/tui/StartupBanner.js";
import { TerminalSizeContext } from "../src/tui/TerminalSizeContext.js";
import { Typo } from "../src/tui/design-system/index.js";
import { CockpitHeader } from "../src/tui/CockpitHeader.js";
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

  test("centers a large branded startup wordmark on capable terminals", () => {
    const frame = stripAnsi(render(
      <StartupBanner
        version="v1.2.7"
        provider="opencode"
        model="deepseek-v4"
        workdir="/workspace/aurict"
        cols={100}
        rows={30}
        quip="Reality compiled. Warnings remain."
      />,
    ).lastFrame() ?? "");
    const lines = frame.split("\n");
    expect(frame).toContain("AURICT");
    expect(frame).toContain("AGENTIC ENGINEERING SYSTEM");
    expect(frame).toContain("Reality compiled. Warnings remain.");
    expect(lines.some((line) => line.startsWith("                    ") && line.includes("█████"))).toBe(true);
    expect(lines.every((line) => line.length <= 100)).toBe(true);
  });

  test("keeps the selected startup quip stable across rerenders", () => {
    const banner = render(
      <StartupBanner
        version="v1.2.7"
        provider="opencode"
        model="deepseek-v4"
        workdir="/workspace/aurict"
        cols={100}
        rows={30}
        quip="Reality compiled. Warnings remain."
      />,
    );
    banner.rerender(
      <StartupBanner
        version="v1.2.7"
        provider="opencode"
        model="deepseek-v4"
        workdir="/workspace/aurict"
        cols={100}
        rows={30}
        quip="This must not replace the launch selection."
      />,
    );
    const frame = stripAnsi(banner.lastFrame() ?? "");
    expect(frame).toContain("Reality compiled. Warnings remain.");
    expect(frame).not.toContain("This must not replace the launch selection.");
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
    expect(frame).toContain("Ask Aurict to plan, explain, or build");
    expect(plain).toContain("PROMPT workspace input");
    expect(frame).toContain("commands");
    expect(frame).not.toContain("INSERT");
    expect(frame).not.toContain("tasks");
    expect(frame).not.toContain("history");
  });

  test("renders the transcript as a subtle timeline", () => {
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
    expect(frame).toContain("│ ▸ You");
    expect(frame).toContain("│ Modern terminal");
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

  test("gives the cockpit and composer the same outer frame width", () => {
    const cockpit = stripAnsi(render(
      <TerminalSizeContext.Provider value={{ columns: 100, rows: 30 }}>
        <CockpitHeader
          provider="opencode"
          model="deepseek-v4"
          workdir="/workspace/aurict"
          tokens={{ input: 100, output: 50 }}
          contextTokens={25_000}
          cols={100}
        />
      </TerminalSizeContext.Provider>,
    ).lastFrame() ?? "");
    cleanup();
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
    const cockpitBorder = cockpit.split("\n").find((line) => line.includes("╭"));
    const composerBorder = composer.split("\n").find((line) => line.includes("╭"));
    expect(cockpitBorder).toBeDefined();
    expect(cockpitBorder?.length).toBe(composerBorder?.length);
  });

  test("does not combine a semantic muted color with ANSI dim", () => {
    const frame = render(<Typo variant="caption" tone="muted" dimColor>metadata</Typo>).lastFrame() ?? "";
    expect(frame).toContain("metadata");
    expect(frame).not.toContain("\u001b[2m");
  });
});
