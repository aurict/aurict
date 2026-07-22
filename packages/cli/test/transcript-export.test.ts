import { describe, expect, it } from "bun:test";
import {
  formatExitTranscript,
  lastAssistantCodeBlock,
  lastAssistantText,
} from "../src/tui/conversation/transcript-export.js";
import type { TranscriptMessage } from "../src/tui/conversation/types.js";

describe("terminal transcript handoff", () => {
  const messages: TranscriptMessage[] = [
    { id: "old", role: "user", content: "old request" },
    { id: "old-answer", role: "assistant", content: "old answer" },
    { id: "u1", role: "user", content: "first recent request" },
    {
      id: "a1",
      role: "assistant",
      content: "",
      blocks: [
        { type: "text", content: "I checked it." },
        { type: "tool", id: "read", tool: "read", args: "{}", pending: false },
        { type: "text", content: "```ts\nconst ready = true\n```" },
      ],
    },
    { id: "u2", role: "user", content: "second recent request" },
    { id: "a2", role: "assistant", content: "Final answer" },
  ];

  it("prints a bounded readable transcript after leaving the alternate screen", () => {
    const output = formatExitTranscript(messages, "Refactor", 2);
    expect(output).toContain("Refactor · recent transcript");
    expect(output).toContain("first recent request");
    expect(output).toContain("[tool: read]");
    expect(output).toContain("Final answer");
    expect(output).not.toContain("old request");
    expect(output).toContain("/export md");
  });

  it("finds the latest assistant response and fenced code for clipboard shortcuts", () => {
    expect(lastAssistantText(messages)).toBe("Final answer");
    expect(lastAssistantCodeBlock(messages)).toBeUndefined();
    expect(lastAssistantCodeBlock(messages.slice(0, -2))).toBe("const ready = true");
  });

  it("does not print an empty handoff for a new session", () => {
    expect(formatExitTranscript([])).toBe("");
  });
});
