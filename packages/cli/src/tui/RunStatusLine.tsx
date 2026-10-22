/**
 * RunStatusLine — the single "what is Aurict doing right now" row shown above
 * the composer while a turn runs:
 *
 *   • Planning the refactor (12s • esc to interrupt) · running read
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

/** Shown in place of Codex's "Working" while no reasoning heading is available. */
export const RUN_PHRASES = [
  "Wubba lubba dub dub",
  "Getting schwifty",
  "Pickle Rick-ing",
  "Squanching",
  "Summoning a Meeseeks",
  "Portal hopping",
  "Polishing the plumbus",
  "Riggity riggity wrecking",
  "Refilling portal fluid",
  "Consulting the Council of Ricks",
  "Flipping through interdimensional cable",
  "Aw geez, thinking",
  "Ooh-wee",
  "Peace among worlds",
] as const;

/** One phrase per turn (random start), rotating every 10 seconds. */
export function runPhrase(seed: number, elapsedMs: number): string {
  return RUN_PHRASES[(seed + Math.floor(elapsedMs / 10_000)) % RUN_PHRASES.length]!;
}

export type ShimmerLevel = "dim" | "normal" | "bold";

/**
 * Codex's shimmer: a band ten cells wide sweeps across the title every two
 * seconds. This is its no-RGB fallback (dim / normal / bold), grouped into runs.
 */
export function shimmerRuns(text: string, timeMs: number): Array<{ text: string; level: ShimmerLevel }> {
  const chars = [...text];
  const padding = 10;
  const period = chars.length + padding * 2;
  const position = Math.floor(((timeMs / 1000) % 2) / 2 * period);
  const runs: Array<{ text: string; level: ShimmerLevel }> = [];
  chars.forEach((char, index) => {
    const distance = Math.abs(index + padding - position);
    const intensity = distance <= 5 ? 0.5 * (1 + Math.cos(Math.PI * (distance / 5))) : 0;
    const level: ShimmerLevel = intensity < 0.2 ? "dim" : intensity < 0.6 ? "normal" : "bold";
    const last = runs.at(-1);
    if (last?.level === level) last.text += char;
    else runs.push({ text: char, level });
  });
  return runs;
}

const SHIMMER_TICK_MS = 120;

/** Wall-clock milliseconds, refreshed every shimmer tick while active. */
function useShimmerClock(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active || !motionEnabled()) return;
    const timer = setInterval(() => setNow(Date.now()), SHIMMER_TICK_MS);
    return () => clearInterval(timer);
  }, [active]);
  return now;
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
  const shimmerNow = useShimmerClock(props.loading);
  const seed = useRef<number | null>(null);
  if (!props.loading) seed.current = null;
  else if (seed.current === null) seed.current = Math.floor(Math.random() * RUN_PHRASES.length);
  if (!props.loading) return null;

  // Codex shows the latest reasoning heading as the title; a run phrase otherwise.
  const title = reasoningHeadline(props.reasoning) ?? runPhrase(seed.current ?? 0, elapsed);
  const action = props.activeTool
    ? `${activityLabel("using_tool")} ${props.activeTool}`
    : activityLabel(props.activity);
  const marker = motionEnabled() && pulse % 2 === 1 ? glyph("running") : glyph("bullet");
  const separator = ` ${glyph("bullet")} `;
  const detail = [action, ...(props.queued ? [`${props.queued} queued`] : [])].join(` ${glyph("statusTiny")} `);
  const fixed = `${marker} ${title} (${formatElapsed(elapsed)}${separator}esc to interrupt)`;
  const room = Math.max(0, props.columns - fixed.length - 6);

  return (
    <Box>
      <Text wrap="truncate-end">
        <Text color={theme.activity.running}>{marker} </Text>
        {motionEnabled()
          ? shimmerRuns(title, shimmerNow).map((run, index) => (
            <Text key={index} bold={run.level === "bold"} dimColor={run.level === "dim"}>{run.text}</Text>
          ))
          : <Text bold {...(theme.foreground.primary ? { color: theme.foreground.primary } : {})}>{title}</Text>}
        <Text dimColor> ({formatElapsed(elapsed)}{separator}</Text>
        <Text bold>esc</Text>
        <Text dimColor> to interrupt)</Text>
        {props.paused && <Text color={theme.status.warning}> {glyph("statusTiny")} output paused</Text>}
        {room > 8 && <Text dimColor> {glyph("statusTiny")} {truncateDisplayWidth(detail, room, glyph("ellipsis"))}</Text>}
      </Text>
    </Box>
  );
}
