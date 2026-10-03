import React from "react";
import { describe, expect, test } from "bun:test";
import { render } from "ink-testing-library";
import { Text } from "ink";
import { InlineAppShell, inlineFrameLayout, inlineFrameLimit } from "../src/tui/app-shell/InlineAppShell.js";
import { shellHorizontalInset } from "../src/tui/app-shell/layout-metrics.js";
import { TranscriptProjectionCache } from "../src/tui/conversation/projection-cache.js";
import { planInlineCommit, settledRowCount } from "../src/tui/conversation/inline-commit.js";
import type { TranscriptRow } from "../src/tui/conversation/projector.js";
import type { TranscriptMessage } from "../src/tui/conversation/types.js";
import { displayWidth } from "../src/tui/terminal-text/display-width.js";
import { DEFAULT_THEME, THEMES } from "../src/utils/theme.js";
import { terminalScenarios, terminalSizes } from "./fixtures/terminal-scenarios.js";

const flush = () => new Promise((resolve) => setTimeout(resolve, 20));
const rowText = (row: TranscriptRow) => row.segments.map((segment) => segment.text).join("");

/** The width AppScreen hands the inline transcript. */
const transcriptWidth = (columns: number) => Math.max(20, columns - 9);

/** Replays a conversation the way it arrives: each new message starts pending. */
function streamCommits(messages: TranscriptMessage[], width: number) {
  const cache = new TranscriptProjectionCache();
  let committed: TranscriptRow[] = [];
  let resets = 0;
  for (let count = 1; count <= messages.length; count++) {
    const visible = messages.slice(0, count).map((message, index) =>
      index === count - 1 && count < messages.length ? { ...message, pending: true } : message);
    const rowsByMessage = cache.projectByMessage(visible, width);
    const plan = planInlineCommit(committed, rowsByMessage.flat(), settledRowCount(visible, rowsByMessage, width));
    if (plan.kind === "reset") resets++;
    if (plan.kind === "append") committed = [...committed, ...plan.rows];
    if (plan.kind === "reset") committed = plan.rows;
  }
  return { committed, resets, final: cache.project(messages, width) };
}

describe("inline layout contract", () => {
  for (const size of terminalSizes) {
    const inset = shellHorizontalInset(size.columns);
    for (const [name, messages] of Object.entries(terminalScenarios)) {
      test(`${name} commits every row exactly once and fits ${size.columns}x${size.rows}`, () => {
        const { committed, resets, final } = streamCommits(messages, transcriptWidth(size.columns));
        expect(resets).toBe(0);
        expect(committed.map((row) => row.id)).toEqual(final.map((row) => row.id));
        expect(new Set(committed.map((row) => row.id)).size).toBe(committed.length);
        // Rail ("│ ") plus the shell inset on both sides never truncates content.
        const room = size.columns - inset * 2 - 2;
        expect(committed.every((row) => displayWidth(rowText(row)) <= room)).toBe(true);
      });
    }

    test(`live frame never reaches the screen height at ${size.columns}x${size.rows}`, () => {
      for (const bottomRows of [3, 7, 12, size.rows + 5]) {
        for (const headerRows of [0, 4]) {
          for (const tailRows of [0, 5, 500]) {
            for (const overlay of [false, true]) {
              const layout = inlineFrameLayout({ rows: size.rows, headerRows, bottomRows, tailRows, overlay });
              expect(layout.height).toBeLessThanOrEqual(inlineFrameLimit(size.rows));
              expect(layout.visibleTailRows).toBeLessThanOrEqual(tailRows);
              const room = Math.max(0, size.rows - 1 - headerRows - bottomRows);
              expect(layout.visibleTailRows).toBe(Math.min(tailRows, room));
            }
          }
        }
      }
    });
  }

  // ink-testing-library renders at a fixed 100 columns, so the real-frame check
  // covers the reference sizes up to that width.
  for (const size of terminalSizes.filter((candidate) => candidate.columns <= 100)) {
    test(`rendered frame stays within ${size.columns}x${size.rows} while streaming`, async () => {
      const longStream = Array.from({ length: 60 }, (_, index) => `streamed line ${index + 1} with enough words to matter`).join("\n");
      const view = render(
        <InlineAppShell
          rows={size.rows}
          columns={size.columns}
          theme={THEMES[DEFAULT_THEME]!}
          keybindingContext="streaming"
          intro={<Text>INTRO</Text>}
          transcript={{
            messages: [...terminalScenarios.normal!, { id: "p1", role: "assistant", content: "", pending: true }],
            width: transcriptWidth(size.columns),
            loading: true,
            streamingText: longStream,
            streamingReason: null,
            streamingError: null,
            paused: false,
          }}
          header={null}
          transcriptVisible
          overlay={null}
          overlayOpen={false}
          bottom={<Text>COMPOSER</Text>}
          exiting={false}
        />,
      );
      await flush();
      const lines = view.lastFrame()!.split("\n");
      const live = lines.slice(lines.findIndex((line) => line.includes("streamed line")));
      expect(live.length).toBeLessThanOrEqual(inlineFrameLimit(size.rows));
      expect(live.at(-1)).toContain("COMPOSER");
      expect(lines.every((line) => displayWidth(line) <= size.columns)).toBe(true);
      expect(lines.filter((line) => line.includes("INTRO"))).toHaveLength(1);
      view.unmount();
    });
  }
});
