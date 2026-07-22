import React, { useEffect, useMemo, useRef } from "react";
import { Box, Text } from "./design-system/renderer.js";
import type { TranscriptMessage } from "./conversation/types.js";
import { useTheme } from "../utils/theme.js";
import { projectLiveTranscript, type TranscriptRow } from "./conversation/projector.js";
import { TranscriptRows } from "./TranscriptRows.js";
import type { RunActivity } from "./run-status.js";
import { useTerminalSize } from "./TerminalSizeContext.js";
import { shellHorizontalInset } from "./app-shell/layout-metrics.js";
import { TranscriptProjectionCache } from "./conversation/projection-cache.js";

export interface ConversationViewportProps {
  height: number;
  width: number;
  messages: TranscriptMessage[];
  loading: boolean;
  activeTool?: string;
  activity?: RunActivity;
  streamingText: string | null;
  streamingReason: string | null;
  streamingError: string | null;
  scrollLocked: boolean;
  offsetRowsFromBottom: number;
  unseenCount?: number;
  unseenLabel?: string;
  onScrollRange?: (maxOffset: number) => void;
  onAnchorShift?: (deltaRows: number) => void;
}

/** Keeps short conversations close to the composer while scrolled history stays top-aligned. */
export function viewportTopPadding(contentRows: number, viewportRows: number, offsetRowsFromBottom: number): number {
  if (offsetRowsFromBottom > 0 || contentRows >= viewportRows) return 0;
  return Math.max(0, viewportRows - contentRows);
}

export function ConversationViewport(props: ConversationViewportProps) {
  const theme = useTheme();
  const columns = useTerminalSize().columns;
  const projectionCache = useRef<TranscriptProjectionCache>();
  if (!projectionCache.current) projectionCache.current = new TranscriptProjectionCache();
  const stableLines = useMemo(
    () => projectionCache.current!.project(props.messages, props.width),
    [props.messages, props.width],
  );
  const hasAssistantHeader = useMemo(
    () => stableLines.some((row) => row.id.endsWith(":header") && row.segments.some((segment) => segment.text.toLowerCase().includes("aurict"))),
    [stableLines],
  );
  const liveLines = useMemo(
    () => projectLiveTranscript({
        width: props.width,
        streamingText: props.streamingText,
        streamingReason: props.streamingReason,
        streamingError: props.streamingError,
        hasAssistantHeader,
        loading: props.loading,
        paused: props.scrollLocked,
        ...(props.activity ? { activity: props.activity } : {}),
        ...(props.activeTool ? { activeTool: props.activeTool } : {}),
      }),
    [
      props.width,
      props.streamingText,
      props.streamingReason,
      props.streamingError,
      props.loading,
      props.scrollLocked,
      props.activity,
      props.activeTool,
      hasAssistantHeader,
    ],
  );
  const lines = useMemo<TranscriptRow[]>(() => {
    const rows = [...stableLines, ...liveLines];
    return rows.length > 0 ? rows : [{ id: "empty", segments: [{ text: "", tone: "muted" }] }];
  }, [stableLines, liveLines]);
  const reserveUnseen = (props.unseenCount ?? 0) > 0
    && (props.scrollLocked || props.offsetRowsFromBottom > 0);
  const viewportRows = Math.max(1, props.height - (reserveUnseen ? 1 : 0));
  const maxOffset = Math.max(0, lines.length - viewportRows);
  const offset = Math.min(props.offsetRowsFromBottom, maxOffset);
  const start = maxOffset - offset;
  const topPaddingRows = viewportTopPadding(lines.length, viewportRows, offset);
  const previousLineCount = useRef(lines.length);

  useEffect(() => {
    props.onScrollRange?.(maxOffset);
  }, [maxOffset, props.onScrollRange]);
  useEffect(() => {
    const delta = lines.length - previousLineCount.current;
    previousLineCount.current = lines.length;
    if (delta > 0 && props.offsetRowsFromBottom > 0)
      props.onAnchorShift?.(delta);
  }, [lines.length, props.offsetRowsFromBottom, props.onAnchorShift]);

  return (
    <Box
      height={props.height}
      flexDirection="column"
      overflow="hidden"
      paddingX={shellHorizontalInset(columns)}
      {...(theme.bgDeep !== undefined ? { backgroundColor: theme.bgDeep } : {})}
    >
      {reserveUnseen && (
        <Text color={theme.accent} bold>
          ⋯ {props.unseenCount} new · {props.unseenLabel ?? "content"} ↓
        </Text>
      )}
      {topPaddingRows > 0 && <Box height={topPaddingRows} flexShrink={0} />}
      <TranscriptRows rows={lines.slice(start, start + viewportRows)} rail={columns >= 60} />
    </Box>
  );
}
