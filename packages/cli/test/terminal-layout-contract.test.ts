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
    const diffText = diff.map(rowText).join("\n");
    const shellText = shell.map(rowText).join("\n");
    // Each edit is its own Codex "Edited" cell with a numbered diff below it.
    expect(diffText).toContain("• Edited src/header.tsx (+1 -1)");
    expect(diffText).toContain("• Edited src/footer.tsx (+1 -1)");
    expect(diffText).toContain("    1 -old");
    expect(diffText).toContain("    1 +new");
    // Long command output keeps its head and tail around a hidden-line marker.
    expect(shellText).toContain("• Ran bun test");
    expect(shellText).toContain("  └ test 1: passed");
    expect(shellText).toContain("    … +76 lines (^O to view details)");
    expect(shellText).toContain("    test 80: passed");
  });
});
