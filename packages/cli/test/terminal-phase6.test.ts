import { describe, expect, test } from "bun:test";
import {
  projectLiveTranscript,
  projectStableTranscript,
  projectTranscript,
} from "../src/tui/conversation/projector.js";
import type { TranscriptMessage } from "../src/tui/conversation/types.js";

function text(rows: ReturnType<typeof projectStableTranscript>): string {
  return rows.map((row) => row.segments.map((segment) => segment.text).join("")).join("\n");
}

function withAscii<T>(run: () => T): T {
  const previous = process.env["AURICT_ASCII"];
  process.env["AURICT_ASCII"] = "1";
  try {
    return run();
  } finally {
    if (previous === undefined) delete process.env["AURICT_ASCII"];
    else process.env["AURICT_ASCII"] = previous;
  }
}

describe("terminal phase 6 hardening", () => {
  const messages: TranscriptMessage[] = [
    { id: "u", role: "user", content: "Check the renderer" },
    { id: "a", role: "assistant", content: "## Plan\n- Keep stable history" },
  ];

  test("stable history projection is independent from live stream updates", () => {
    const stable = projectStableTranscript(messages, 80);
    const firstLive = projectLiveTranscript({ width: 80, streamingText: "first", streamingReason: null, streamingError: null, loading: true, activity: "responding", hasAssistantHeader: true });
    const secondLive = projectLiveTranscript({ width: 80, streamingText: "second", streamingReason: null, streamingError: null, loading: true, activity: "responding", hasAssistantHeader: true });

    expect(text(stable)).toContain("Keep stable history");
    expect(text(firstLive)).toContain("first");
    expect(text(secondLive)).toContain("second");
    expect(firstLive.every((row) => row.id.startsWith("stream:"))).toBe(true);
    expect(secondLive.every((row) => row.id.startsWith("stream:"))).toBe(true);
  });

  test("split projection preserves the public combined projector contract", () => {
    const combined = projectTranscript({ messages, width: 80, streamingText: "live", streamingReason: null, streamingError: null, loading: true });
    const stable = projectStableTranscript(messages, 80);
    const live = projectLiveTranscript({ width: 80, streamingText: "live", streamingReason: null, streamingError: null, loading: true, hasAssistantHeader: true });
    expect(combined).toEqual([...stable, ...live]);
  });

  test("removes decorative Unicode from transcript chrome in ASCII mode", () => withAscii(() => {
    const rows = projectTranscript({
      width: 80,
      streamingText: null,
      streamingReason: null,
      streamingError: null,
      loading: true,
      paused: true,
      messages: [{ id: "e", role: "error", content: "failed", errorPresentation: { title: "Request failed", action: "Retry now." } }],
    });
    expect(text(rows)).not.toMatch(/[◆◇▸∴›⌕✦↗│•●○✗→◌◦⏸±⌥…⋯−─·└⋮✔□■]/);
    expect(text(rows)).toContain("# Request failed");
    expect(text(rows)).toContain("  > Retry now.");
    expect(text(rows)).toContain("P live output paused . Ctrl+L resume");
  }));
});
