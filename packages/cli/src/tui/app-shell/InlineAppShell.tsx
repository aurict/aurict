import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Box, Static, measureElement, useStdout, type DOMElement } from "../design-system/renderer.js";
import type { Theme } from "../../utils/theme.js";
import { ThemeContext } from "../../utils/theme.js";
import type { Context as KeybindingContext } from "../../keybindings/index.js";
import { KeybindingsProvider } from "../../keybindings/index.js";
import { TerminalSizeContext } from "../TerminalSizeContext.js";
import { TranscriptRows } from "../TranscriptRows.js";
import { hasAssistantHeader, projectLiveTranscript, type TranscriptRow } from "../conversation/projector.js";
import type { TranscriptMessage } from "../conversation/types.js";
import type { RunActivity } from "../run-status.js";
import { useInlineTranscript } from "../hooks/useInlineTranscript.js";
import { OverlayStack } from "./OverlayStack.js";
import { shellHorizontalInset } from "./layout-metrics.js";
import { setAlternateScreenActive } from "../alternate-screen-state.js";

export interface InlineTranscriptProps {
  messages: TranscriptMessage[];
  width: number;
  loading: boolean;
  streamingText: string | null;
  streamingReason: string | null;
  streamingError: string | null;
  paused: boolean;
  activeTool?: string | undefined;
  activity?: RunActivity | undefined;
}

interface Props {
  rows: number;
  columns: number;
  theme: Theme;
  keybindingContext: KeybindingContext;
  /** Printed once at the top of scrollback (and again after a full reprint). */
  intro: React.ReactNode;
  transcript: InlineTranscriptProps;
  /** Replaces the live transcript tail, e.g. while a subagent is inspected. */
  header?: React.ReactNode;
  transcriptVisible: boolean;
  overlay: React.ReactNode;
  overlayOpen: boolean;
  overlayBackdrop?: boolean | undefined;
  bottom: React.ReactNode;
  /** Final frame before exit: write every row to scrollback, draw no live area. */
  exiting: boolean;
}

type ScrollbackItem = { kind: "intro" } | { kind: "row"; row: TranscriptRow };
const ENTER_ALTERNATE_SCREEN = "\x1b[?1049h\x1b[H";
const EXIT_ALTERNATE_SCREEN = "\x1b[?1049l";
const INTRO_ITEM: ScrollbackItem = { kind: "intro" };
const INITIAL_CHROME_ROWS = 6;

/** Ink repaints the whole terminal when a frame reaches the screen height. */
export function inlineFrameLimit(rows: number): number {
  return Math.max(1, rows - 1);
}

/**
 * Live-frame geometry: the newest transcript rows that fit between the
 * measured header and bottom chrome, and a height that never reaches the
 * screen height (an open modal takes the whole allowance).
 */
export function inlineFrameLayout(input: {
  rows: number;
  headerRows: number;
  bottomRows: number;
  tailRows: number;
  overlay: boolean;
}): { visibleTailRows: number; height: number } {
  const limit = inlineFrameLimit(input.rows);
  const budget = Math.max(0, limit - input.headerRows - input.bottomRows);
  const visibleTailRows = Math.min(input.tailRows, budget);
  return {
    visibleTailRows,
    height: input.overlay ? limit : Math.min(limit, input.headerRows + visibleTailRows + input.bottomRows),
  };
}

export function InlineAppShell(props: Props) {
  return (
    <TerminalSizeContext.Provider value={{ columns: props.columns, rows: props.rows }}>
      <ThemeContext.Provider value={props.theme}>
        <KeybindingsProvider initialContext={props.keybindingContext}>
          <InlineSurface {...props} />
        </KeybindingsProvider>
      </ThemeContext.Provider>
    </TerminalSizeContext.Provider>
  );
}

function useMeasuredRows(ref: React.RefObject<DOMElement>, fallback: number): number {
  const [rows, setRows] = useState(fallback);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const { height } = measureElement(ref.current);
    if (height !== rows) setRows(height);
  });
  return rows;
}

/**
 * Full-height modals would grow the live frame and push history up, leaving
 * the composer stranded mid-screen once they close. They open on the
 * alternate screen instead; leaving it restores the main buffer untouched.
 * The switch runs through Ink's writer, which erases the live frame before
 * the write and redraws it after, so the frame never lands in the wrong
 * buffer. The flag flips only after the switch, so a modal is never drawn
 * into the main buffer.
 */
function useModalScreen(wanted: boolean): boolean {
  const { write } = useStdout();
  const [active, setActive] = useState(false);
  useLayoutEffect(() => {
    if (wanted === active) return;
    write(wanted ? ENTER_ALTERNATE_SCREEN : EXIT_ALTERNATE_SCREEN);
    setAlternateScreenActive(wanted);
    setActive(wanted);
  }, [active, wanted, write]);
  return active;
}

function InlineSurface(props: Props) {
  const { transcript } = props;
  // Ink repaints on resize before React state catches up; never size the
  // frame for more rows than the terminal Ink is drawing into has now.
  const { stdout } = useStdout();
  const rows = Math.min(props.rows, stdout.rows || props.rows);
  const inset = shellHorizontalInset(props.columns);
  const rail = props.columns >= 60;
  const modalScreen = useModalScreen(props.overlayOpen && !props.exiting);
  const inline = useInlineTranscript({
    messages: transcript.messages,
    width: transcript.width,
    flushAll: props.exiting,
    hold: modalScreen,
  });
  const assistantHeaderShown = useMemo(
    () => hasAssistantHeader(inline.committed) || hasAssistantHeader(inline.pending),
    [inline.committed, inline.pending],
  );
  const live = useMemo(() => projectLiveTranscript({
    width: inline.width,
    streamingText: transcript.streamingText,
    streamingReason: transcript.streamingReason,
    streamingError: transcript.streamingError,
    loading: transcript.loading,
    paused: transcript.paused,
    hasAssistantHeader: assistantHeaderShown,
    statusLine: true,
    ...(transcript.activity ? { activity: transcript.activity } : {}),
    ...(transcript.activeTool ? { activeTool: transcript.activeTool } : {}),
  }), [
    inline.width, transcript.streamingText, transcript.streamingReason,
    transcript.streamingError, transcript.loading, transcript.paused,
    transcript.activity, transcript.activeTool, assistantHeaderShown,
  ]);

  const items = useMemo<ScrollbackItem[]>(
    () => [INTRO_ITEM, ...inline.committed.map((row) => ({ kind: "row" as const, row }))],
    [inline.committed],
  );

  const headerRef = useRef<DOMElement>(null);
  const bottomRef = useRef<DOMElement>(null);
  const headerRows = useMeasuredRows(headerRef, 0);
  const bottomRows = useMeasuredRows(bottomRef, INITIAL_CHROME_ROWS);
  const limit = inlineFrameLimit(rows);
  const tail = props.transcriptVisible ? [...inline.pending, ...live] : [];
  const overlayShown = props.overlayOpen && modalScreen;
  const { visibleTailRows, height } = inlineFrameLayout({
    rows,
    headerRows,
    bottomRows,
    tailRows: tail.length,
    overlay: overlayShown,
  });
  const shown = visibleTailRows > 0 ? tail.slice(-visibleTailRows) : [];

  // Ink marks <Static> dirty (forcing an unthrottled repaint) whenever its
  // style prop changes identity, so it must be stable between frames.
  const scrollbackStyle = useMemo(() => ({ width: props.columns }), [props.columns]);
  const scrollback = (
    <Static key={inline.epoch} items={items} style={scrollbackStyle}>
      {(item, index) => item.kind === "intro"
        ? <Box key="intro" flexDirection="column" width={props.columns}>{props.intro}</Box>
        : (
          <Box key={`${index}:${item.row.id}`} paddingX={inset} width={props.columns}>
            <TranscriptRows rows={[item.row]} rail={rail} />
          </Box>
        )}
    </Static>
  );

  if (props.exiting && !modalScreen) return scrollback;
  return (
    <>
      {scrollback}
      <Box position="relative" flexDirection="column" width={props.columns} height={height} overflow="hidden">
        <Box ref={headerRef} flexDirection="column" flexShrink={0}>
          {props.header}
        </Box>
        <Box flexDirection="column" flexGrow={1} flexShrink={1} overflow="hidden" justifyContent="flex-end" paddingX={inset}>
          {shown.length > 0 && <TranscriptRows rows={shown} rail={rail} />}
        </Box>
        <Box ref={bottomRef} flexDirection="column" flexShrink={0}>
          {props.bottom}
        </Box>
        <OverlayStack
          open={overlayShown}
          columns={props.columns}
          rows={limit}
          backdrop={props.overlayBackdrop}
        >
          {props.overlay}
        </OverlayStack>
      </Box>
    </>
  );
}
