import { describe, expect, test } from "bun:test";
import { projectTranscript } from "../src/tui/conversation/projector.js";
import { terminalScenarios, terminalSizes } from "./fixtures/terminal-scenarios.js";

function rowText(row: ReturnType<typeof projectTranscript>[number]): string {
  return row.segments.map((segment) => segment.text).join("");
}

describe("terminal layout contract", () => {
  for (const size of terminalSizes) {
    for (const [name, messages] of Object.entries(terminalScenarios)) {
      test(`${name} remains bounded at ${size.columns}x${size.rows}`, () => {
        const rows = projectTranscript({
          messages,
          width: size.columns,
          streamingText: name === "streaming" ? "Applying the new registry boundary while preserving the public API." : null,
          streamingReason: name === "streaming" ? "checking dependencies" : null,
          streamingError: null,
        });
        expect(rows.length).toBeGreaterThan(0);
        expect(rows.every((row) => rowText(row).length <= size.columns)).toBe(true);
        expect(new Set(rows.map((row) => row.id)).size).toBe(rows.length);
      });
    }
  }

  test("diff and shell scenarios keep inspectable summaries", () => {
    const diff = projectTranscript({ messages: terminalScenarios.multiFileDiff!, width: 80, streamingText: null, streamingReason: null, streamingError: null });
    const shell = projectTranscript({ messages: terminalScenarios.shell!, width: 80, streamingText: null, streamingReason: null, streamingError: null });
    expect(diff.map(rowText).join("\n")).toMatch(/│ change\s+2 files · \+2 −2/);
    expect(diff.map(rowText).join("\n")).toContain("└ completed");
    expect(shell.map(rowText).join("\n")).toMatch(/80 passed · 0 failed\s+details \^O/);
  });
});
