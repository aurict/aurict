import { describe, expect, it, mock } from "bun:test";
import { TranscriptProjectionCache } from "../src/tui/conversation/projection-cache.js";
import { projectStableMessage } from "../src/tui/conversation/projector.js";
import type { TranscriptMessage } from "../src/tui/conversation/types.js";

describe("incremental transcript projection", () => {
  it("reuses unchanged message rows and only projects appended/replaced messages", () => {
    const projector = mock(projectStableMessage);
    const cache = new TranscriptProjectionCache(projector);
    const first: TranscriptMessage = { id: "first", role: "user", content: "hello" };
    const second: TranscriptMessage = { id: "second", role: "assistant", content: "world" };

    const initial = cache.project([first], 80);
    const appended = cache.project([first, second], 80);
    expect(projector).toHaveBeenCalledTimes(2);
    expect(appended[0]).toBe(initial[0]);

    const replaced = { ...second, content: "updated" };
    cache.project([first, replaced], 80);
    expect(projector).toHaveBeenCalledTimes(3);
  });

  it("reprojects at a new terminal width", () => {
    const projector = mock(projectStableMessage);
    const cache = new TranscriptProjectionCache(projector);
    const message: TranscriptMessage = { id: "message", role: "assistant", content: "wide text" };
    cache.project([message], 80);
    cache.project([message], 60);
    expect(projector).toHaveBeenCalledTimes(2);
  });
});
