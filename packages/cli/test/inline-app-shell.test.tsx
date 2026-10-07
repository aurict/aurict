import React from "react";
import { describe, expect, test } from "bun:test";
import { render } from "ink-testing-library";
import { Text } from "ink";
import { InlineAppShell, inlineFrameLimit, type InlineTranscriptProps } from "../src/tui/app-shell/InlineAppShell.js";
import { DEFAULT_THEME, THEMES } from "../src/utils/theme.js";
import type { TranscriptMessage } from "../src/tui/conversation/types.js";

const flush = () => new Promise((resolve) => setTimeout(resolve, 20));

const streamed = Array.from({ length: 80 }, (_, index) => `stream line ${index + 1}`).join("\n");

function transcript(overrides: Partial<InlineTranscriptProps> = {}): InlineTranscriptProps {
  const messages: TranscriptMessage[] = [
    { id: "u1", role: "user", content: "first question" },
    { id: "a1", role: "assistant", content: "first answer" },
    { id: "u2", role: "user", content: "second question" },
    { id: "a2", role: "assistant", content: "", pending: true },
  ];
  return {
    messages,
    width: 91,
    loading: true,
    streamingText: streamed,
    streamingReason: null,
    streamingError: null,
    paused: false,
    ...overrides,
  };
}

function shell(props: { exiting?: boolean; transcript?: InlineTranscriptProps } = {}) {
  return (
    <InlineAppShell
      rows={24}
      columns={100}
      theme={THEMES[DEFAULT_THEME]!}
      keybindingContext="ready"
      intro={<Text>INTRO BANNER</Text>}
      transcript={props.transcript ?? transcript()}
      header={null}
      transcriptVisible
      overlay={null}
      overlayOpen={false}
      bottom={<Text>COMPOSER</Text>}
      exiting={props.exiting ?? false}
    />
  );
}

describe("InlineAppShell", () => {
  test("writes settled history once and keeps the live frame below the terminal height", async () => {
    const view = render(shell());
    await flush();
    const frame = view.lastFrame()!;
    const lines = frame.split("\n");
    const live = lines.slice(lines.findIndex((line) => line.includes("stream line")));
    expect(frame.match(/INTRO BANNER/g)).toHaveLength(1);
    expect(frame.match(/first answer/g)).toHaveLength(1);
    expect(frame).toContain("stream line 80");
    expect(frame).not.toContain("stream line 1\n");
    expect(live.length).toBe(inlineFrameLimit(24));
    expect(lines.at(-1)).toContain("COMPOSER");
    view.unmount();
  });

  test("the exit frame flushes every row to scrollback and erases the live area", async () => {
    const finished = transcript({
      messages: [
        { id: "u1", role: "user", content: "first question" },
        { id: "a1", role: "assistant", content: "final pending answer", pending: true },
      ],
      loading: false,
      streamingText: null,
    });
    const view = render(shell({ transcript: finished }));
    await flush();
    expect(view.lastFrame()).toContain("COMPOSER");
    view.rerender(shell({ transcript: finished, exiting: true }));
    await flush();
    const frame = view.lastFrame()!;
    expect(frame).toContain("final pending answer");
    expect(frame).not.toContain("COMPOSER");
    view.unmount();
  });
});
