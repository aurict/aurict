/**
 * RunStatusLine — the single "what is Aurict doing right now" row shown above
 * the composer while a turn runs:
 *
 *   ◌ Working (12s · esc to interrupt) · running read · Planning the refactor
 *
 * It owns its one-second clock so only this row re-renders while time passes.
 */
import React, { useEffect, useRef, useState } from "react";
import { Box, Text } from "./design-system/renderer.js";
import { motionEnabled, usePulseFrame } from "./design-system/motion.js";
import { useSemanticTheme } from "./theme/semantic-theme.js";
import { activityLabel, formatElapsed, type RunActivity } from "./run-status.js";
import { glyph } from "./terminal-glyphs.js";
import { truncateDisplayWidth } from "./terminal-text/display-width.js";

export { formatElapsed } from "./run-status.js";

export interface RunStatusLineProps {
  loading: boolean;
  activity?: RunActivity | undefined;
  activeTool?: string | undefined;
  /** Raw streamed reasoning; its latest bold heading becomes the subtitle. */
  reasoning?: string | null | undefined;
  queued?: number | undefined;
  paused?: boolean | undefined;
  columns: number;
}

/** Reasoning models announce steps as `**Heading**`; show the most recent one. */
export function reasoningHeadline(reasoning: string | null | undefined): string | undefined {
  if (!reasoning) return undefined;
  const headings = [...reasoning.matchAll(/\*\*([^*\n]{3,80})\*\*/g)];
  return headings.at(-1)?.[1]?.trim();
}

function useElapsed(running: boolean): number {
  const startedAt = useRef<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  if (running && startedAt.current === null) startedAt.current = Date.now();
  if (!running) startedAt.current = null;
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [running]);
  return startedAt.current === null ? 0 : Math.max(0, now - startedAt.current);
}

export function RunStatusLine(props: RunStatusLineProps) {
  const theme = useSemanticTheme();
  const elapsed = useElapsed(props.loading);
  const pulse = usePulseFrame(props.loading);
  if (!props.loading) return null;

  const action = props.activeTool
    ? `${activityLabel("using_tool")} ${props.activeTool}`
    : activityLabel(props.activity);
  const headline = reasoningHeadline(props.reasoning);
  const marker = motionEnabled() && pulse % 2 === 1 ? glyph("thinking") : glyph("working");
  const separator = ` ${glyph("statusTiny")} `;
  const detail = [action, ...(headline ? [headline] : []), ...(props.queued ? [`${props.queued} queued`] : [])].join(separator);
  const fixed = `${marker} Working (${formatElapsed(elapsed)}${separator}esc to interrupt)`;
  const room = Math.max(0, props.columns - fixed.length - separator.length - 4);

  return (
    <Box paddingX={1}>
      <Text wrap="truncate-end">
        <Text color={theme.activity.running}>{marker} </Text>
        <Text color={theme.foreground.primary} bold>Working</Text>
        <Text color={theme.foreground.muted}> ({formatElapsed(elapsed)}{separator}</Text>
        <Text color={theme.foreground.secondary}>esc</Text>
        <Text color={theme.foreground.muted}> to interrupt)</Text>
        {props.paused && <Text color={theme.status.warning}>{separator}output paused</Text>}
        {room > 8 && <Text color={theme.foreground.muted}>{separator}{truncateDisplayWidth(detail, room, glyph("ellipsis"))}</Text>}
      </Text>
    </Box>
  );
}
