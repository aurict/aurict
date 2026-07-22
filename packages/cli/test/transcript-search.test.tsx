import React from "react";
import { afterEach, describe, expect, it, mock } from "bun:test";
import { cleanup, render } from "ink-testing-library";
import { TranscriptSearch } from "../src/tui/TranscriptSearch.js";
import {
  findTranscriptMatches,
  transcriptOffsetForMessage,
} from "../src/tui/conversation/search-model.js";
import type { TranscriptMessage } from "../src/tui/conversation/types.js";

afterEach(() => cleanup());

const messages: TranscriptMessage[] = [
  { id: "u1", role: "user", content: "Find the latency regression" },
  { id: "a1", role: "assistant", content: "The regression starts in cache.ts." },
  { id: "u2", role: "user", content: "Verify the cache fix" },
  { id: "a2", role: "assistant", content: "All verification checks passed." },
];

describe("conversation transcript search", () => {
  it("finds newest matches and computes a real projected-row offset", () => {
    expect(findTranscriptMatches(messages, "cache").map((match) => match.messageId)).toEqual(["u2", "a1"]);
    const offset = transcriptOffsetForMessage(messages, 40, 4, "a1");
    expect(offset).toBeGreaterThan(0);
  });

  it("selects a matching message from the keyboard-driven overlay", async () => {
    const onSelect = mock((_id: string) => {});
    const view = render(<TranscriptSearch messages={messages} onSelect={onSelect} onClose={() => {}} />);
    await new Promise((resolve) => setTimeout(resolve, 0));
    view.stdin.write("latency");
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(view.lastFrame()).toContain("latency regression");
    view.stdin.write("\r");
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(onSelect).toHaveBeenCalledWith("u1");
  });
});
