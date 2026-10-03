import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useStdout } from "../design-system/renderer.js";
import type { TranscriptMessage } from "../conversation/types.js";
import type { TranscriptRow } from "../conversation/projector.js";
import { TranscriptProjectionCache } from "../conversation/projection-cache.js";
import { planInlineCommit, settledRowCount } from "../conversation/inline-commit.js";

/** Clears the visible screen and the scrollback, then homes the cursor. */
export const CLEAR_TERMINAL_AND_SCROLLBACK = "\x1b[2J\x1b[3J\x1b[H";
const RESIZE_SETTLE_MS = 150;

export interface InlineTranscriptState {
  /** Increments on every full reprint; the scrollback writer remounts on change. */
  epoch: number;
  /** Rows already written to terminal scrollback, in order. */
  committed: TranscriptRow[];
  /** Stable rows that are not final yet; rendered in the live area. */
  pending: TranscriptRow[];
  /** Projection width; lags terminal resizes until they settle. */
  width: number;
}

interface Params {
  messages: TranscriptMessage[];
  width: number;
  /** Commit everything, including pending rows (used right before exit). */
  flushAll: boolean;
  /** Defer every scrollback write, e.g. while a modal owns the alternate screen. */
  hold: boolean;
}

/** Debounces width so a drag-resize triggers one reprint instead of dozens. */
function useSettledWidth(width: number): number {
  const [settled, setSettled] = useState(width);
  useEffect(() => {
    if (width === settled) return;
    const timer = setTimeout(() => setSettled(width), RESIZE_SETTLE_MS);
    return () => clearTimeout(timer);
  }, [settled, width]);
  return settled;
}

export function useInlineTranscript({ messages, width: liveWidth, flushAll, hold }: Params): InlineTranscriptState {
  const { write } = useStdout();
  const width = useSettledWidth(liveWidth);
  const cache = useRef<TranscriptProjectionCache>();
  if (!cache.current) cache.current = new TranscriptProjectionCache();
  const rowsByMessage = useMemo(
    () => cache.current!.projectByMessage(messages, width),
    [messages, width],
  );
  const stable = useMemo(() => rowsByMessage.flat(), [rowsByMessage]);
  const settled = flushAll ? stable.length : settledRowCount(messages, rowsByMessage, width);

  const [state, setState] = useState<{ epoch: number; committed: TranscriptRow[] }>({ epoch: 0, committed: [] });
  const plan = hold ? { kind: "none" as const } : planInlineCommit(state.committed, stable, settled);
  // Appends are derived state: commit them in this render so the new rows
  // reach scrollback in the same frame that drops them from the live area.
  if (plan.kind === "append") setState({ epoch: state.epoch, committed: [...state.committed, ...plan.rows] });

  const resetRows = plan.kind === "reset" ? plan.rows : null;
  // Keyed by the projection that required the reprint: a persistent mismatch
  // with unchanged input can never loop.
  const resetKey = resetRows ? stable : null;
  useLayoutEffect(() => {
    if (!resetRows) return;
    // Ink erases the live frame, writes this, then redraws the frame; the
    // remounted scrollback writer then prints the full history once.
    write(CLEAR_TERMINAL_AND_SCROLLBACK);
    setState((current) => ({ epoch: current.epoch + 1, committed: resetRows }));
  }, [resetKey, write]); // eslint-disable-line react-hooks/exhaustive-deps

  const committedCount = plan.kind === "reset" ? plan.rows.length : state.committed.length;
  return {
    epoch: state.epoch,
    committed: state.committed,
    pending: stable.slice(committedCount),
    width,
  };
}
