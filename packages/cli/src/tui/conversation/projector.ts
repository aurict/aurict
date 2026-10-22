import { glyph, terminalText } from "../terminal-glyphs.js";
import { activityLabel, type RunActivity } from "../run-status.js";
import type { TranscriptMessage, TurnStats } from "./types.js";
import {
  coalesceInterruptedAssistantBlocks,
  collapseRepeatedAssistantText,
} from "./block-flow.js";
import { resolveLivePresentation } from "./live-state.js";
import { groupAdjacentToolBlocks } from "./tool-grouping.js";
import { terminalHyperlink } from "../terminal-text/hyperlink.js";
import { truncateDisplayWidth } from "../terminal-text/display-width.js";
import type { TranscriptLine, TranscriptRow, TranscriptSegment, TranscriptTone } from "./row-model.js";
import {
  cleanTranscriptText as clean,
  isBlankRow,
  pushGap,
  pushText,
  pushWrapped,
  wrapTranscriptText,
} from "./row-builder.js";
import {
  projectToolBlock,
  projectToolGroup,
  toolGroupKey,
} from "./tool-block-projector.js";

export type { TranscriptLine, TranscriptRow, TranscriptSegment, TranscriptTone } from "./row-model.js";
export { wrapTranscriptText } from "./row-builder.js";

export interface ProjectOptions {
  messages: TranscriptMessage[];
  width: number;
  streamingText: string | null;
  streamingReason: string | null;
  streamingError: string | null;
  loading?: boolean;
  activity?: RunActivity;
  activeTool?: string;
  paused?: boolean;
}

export type LiveTranscriptOptions = Omit<ProjectOptions, "messages"> & {
  hasAssistantHeader?: boolean;
  /** A separate status line reports activity; keep only the paused notice. */
  statusLine?: boolean;
};

function inlineSegments(text: string, tone: TranscriptTone): TranscriptSegment[] {
  const segments: TranscriptSegment[] = [];
  const pattern = /(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|__[^_]+__|~~[^~]+~~|`[^`]+`|\*[^*\n]+\*|_[^_\n]+_)/g;
  let cursor = 0;
  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > cursor) segments.push({ text: text.slice(cursor, index), tone });
    const token = match[0];
    const link = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      segments.push({ text: terminalHyperlink(link[1]!, link[2]!), tone, underline: true });
      segments.push({ text: ` (${truncateDisplayWidth(link[2]!, 40)})`, tone: "muted" });
    } else if (token.startsWith("`")) segments.push({ text: token.slice(1, -1), tone: "code" });
    else if (token.startsWith("**") || token.startsWith("__")) segments.push({ text: token.slice(2, -2), tone, bold: true });
    else if (token.startsWith("~~")) segments.push({ text: token.slice(2, -2), tone, strikethrough: true });
    else segments.push({ text: token.slice(1, -1), tone, italic: true });
    cursor = index + token.length;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor), tone });
  return segments.length > 0 ? segments : [{ text: "", tone }];
}

function markdownSegments(line: string, tone: TranscriptTone, inCode: boolean): { segments: TranscriptSegment[]; toggleCode: boolean; hidden?: boolean } {
  // Fences toggle code mode but print nothing; code lines keep their indentation.
  if (/^```/.test(line)) return { segments: [], toggleCode: true, hidden: true };
  if (inCode) return { segments: [{ text: line, tone: "code" }], toggleCode: false };
  const heading = line.match(/^(#{1,6})\s+(.+)$/);
  if (heading) {
    const level = heading[1]!.length;
    return {
      segments: inlineSegments(heading[2]!, tone).map((segment) => ({
        ...segment,
        ...(level <= 3 ? { bold: true } : {}),
        ...(level === 1 ? { underline: true } : {}),
        ...(level >= 3 ? { italic: true } : {}),
      })),
      toggleCode: false,
    };
  }
  if (/^(---+|\*\*\*+)\s*$/.test(line)) return { segments: [{ text: glyph("divider").repeat(16), tone: "muted", dim: true }], toggleCode: false };
  if (line.startsWith(">")) return { segments: [{ text: "> ", tone: "success" }, ...inlineSegments(line.replace(/^>\s?/, ""), "success")], toggleCode: false };
  const task = line.match(/^(\s*)[-*]\s+\[([ xX])\]\s+(.*)$/);
  if (task) {
    const done = task[2]!.toLowerCase() === "x";
    return { segments: [{ text: `${task[1]}${done ? glyph("check") : glyph("box")} `, tone: done ? "success" : "muted" }, ...inlineSegments(task[3]!, tone).map((segment) => (done ? { ...segment, strikethrough: true, dim: true } : segment))], toggleCode: false };
  }
  const list = line.match(/^(\s*)[-*]\s+(.*)$/);
  if (list) return { segments: [{ text: `${list[1]}- `, tone: "muted" }, ...inlineSegments(list[2]!, tone)], toggleCode: false };
  const ordered = line.match(/^(\s*)(\d+[.)])\s+(.*)$/);
  if (ordered) return { segments: [{ text: `${ordered[1]}${ordered[2]} `, tone: "code" }, ...inlineSegments(ordered[3]!, tone)], toggleCode: false };
  return { segments: inlineSegments(line, tone), toggleCode: false };
}

function pushMarkdown(rows: TranscriptRow[], id: string, text: string, tone: TranscriptTone, width: number): void {
  let inCode = false;
  for (const [index, source] of clean(text).split("\n").entries()) {
    if (!inCode && !source.trim()) {
      pushGap(rows, `${id}:${index}:gap`);
      continue;
    }
    const formatted = markdownSegments(source, tone, inCode);
    if (formatted.toggleCode) inCode = !inCode;
    if (formatted.hidden) continue;
    pushWrapped(rows, `${id}:${index}`, formatted.segments, width);
  }
}

/**
 * Codex's two-column gutter: the first content row of a cell gets the marker,
 * every other content row gets two spaces; blank rows stay empty.
 */
function prefixCell(rows: TranscriptRow[], start: number, marker: TranscriptSegment): void {
  let first = true;
  for (let index = start; index < rows.length; index++) {
    const row = rows[index]!;
    if (isBlankRow(row)) continue;
    row.segments.unshift(first ? marker : { text: "  ", tone: "muted" });
    first = false;
  }
}

/** One plain blank row between cells, as Codex inserts before every history cell. */
function pushCellGap(rows: TranscriptRow[], id: string): void {
  const last = rows[rows.length - 1];
  if (rows.length === 0 || (isBlankRow(last) && !last!.surface)) return;
  rows.push({ id, segments: [{ text: "", tone: "muted" }] });
}

/** `  Worked for 12s • 1.5k tokens • $0.0041` closes a finished turn. */
/** Codex's elapsed label: "<1s", "45s", "2m 5s", "1h 0m 3s". */
function workedFor(durationMs: number): string {
  const total = Math.floor(durationMs / 1000);
  const hours = Math.floor(total / 3600), minutes = Math.floor((total % 3600) / 60), seconds = total % 60;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return seconds === 0 ? "<1s" : `${seconds}s`;
}

/** "3:07 PM", with the date when the turn finished on another day (and year). */
function completedLabel(at: number, now = new Date()): string {
  const date = new Date(at);
  const hours = date.getHours();
  const time = `${hours % 12 || 12}:${String(date.getMinutes()).padStart(2, "0")} ${hours < 12 ? "AM" : "PM"}`;
  if (date.toDateString() === now.toDateString()) return time;
  const day = date.toLocaleDateString("en-US", { month: "short", day: "numeric", ...(date.getFullYear() === now.getFullYear() ? {} : { year: "numeric" }) });
  return `${day} at ${time}`;
}

/** The dim completion line Codex prints under a finished turn. */
export function turnStatsRow(id: string, stats: TurnStats, _width: number): TranscriptRow {
  const parts = [`Worked for ${workedFor(stats.durationMs)}`];
  if (stats.completedAt !== undefined) parts.push(completedLabel(stats.completedAt));
  return { id, segments: [{ text: `  ${parts.join(` ${glyph("bullet")} `)}`, tone: "muted", dim: true }] };
}

function projectUser(rows: TranscriptRow[], id: string, text: string, width: number): void {
  const start = rows.length;
  rows.push({ id: `${id}:pad-top`, segments: [{ text: "", tone: "muted" }] });
  for (const [index, line] of wrapTranscriptText(text, Math.max(8, width - 1)).entries())
    rows.push({ id: `${id}:line:${index}`, segments: [{ text: index === 0 ? `${glyph("input")} ` : "  ", tone: "accent", bold: index === 0 }, { text: line, tone: "user" }] });
  rows.push({ id: `${id}:pad-bottom`, segments: [{ text: "", tone: "muted" }] });
  for (let index = start; index < rows.length; index++) rows[index]!.surface = "user";
}

function projectMessage(rows: TranscriptRow[], message: TranscriptMessage, index: number, width: number): void {
  const id = message.id ?? `message-${index}`;
  const bodyWidth = Math.max(8, width - 2);
  if (message.role === "system" && message.notice) {
    pushCellGap(rows, `${id}:gap`);
    const { marker, parts } = message.notice;
    const markerTone = marker === "check" ? "success" : marker === "error" ? "error" : "muted";
    const start = rows.length;
    pushWrapped(rows, `${id}:notice`, parts.map((part) => ({ text: part.text, tone: "assistant" as const, ...(part.bold ? { bold: true } : {}), ...(part.dim ? { dim: true, tone: "muted" as const } : {}) })), bodyWidth);
    prefixCell(rows, start, { text: `${glyph(marker)} `, tone: markerTone, ...(marker === "stop" ? { dim: true } : { bold: true }) });
    return;
  }
  if (message.role === "system") {
    pushCellGap(rows, `${id}:gap`);
    const start = rows.length;
    pushText(rows, `${id}:notice`, message.content, "muted", bodyWidth);
    prefixCell(rows, start, { text: `${glyph("bullet")} `, tone: "muted", dim: true });
    return;
  }
  if (message.role === "error") {
    const error = message.errorPresentation;
    pushCellGap(rows, `${id}:gap`);
    const start = rows.length;
    pushText(rows, `${id}:error`, error?.title ?? message.content, "error", bodyWidth);
    if (error?.detail && error.detail !== error.title) pushText(rows, `${id}:detail`, error.detail, "muted", bodyWidth);
    if (error?.action) pushText(rows, `${id}:action`, `${glyph("action")} ${error.action}`, "muted", bodyWidth);
    prefixCell(rows, start, { text: `${glyph("stop")} `, tone: "error", bold: true });
    return;
  }
  if (message.role === "tool_result") return;
  if (message.role === "tool_call") {
    pushCellGap(rows, `${id}:gap`);
    projectToolBlock(rows, `${id}:tool`, { type: "tool", id, tool: message.tool ?? "tool", args: message.content, pending: Boolean(message.pending), ...(message.resultContent !== undefined ? { resultContent: message.resultContent } : {}), ...(message.artifact !== undefined ? { artifact: message.artifact } : {}) }, width);
    return;
  }
  if (message.role === "user") {
    pushCellGap(rows, `${id}:gap`);
    projectUser(rows, id, message.content, width);
    return;
  }
  const blocks = message.blocks?.length
    ? collapseRepeatedAssistantText(coalesceInterruptedAssistantBlocks(message.blocks))
    : [{ block: { type: "text" as const, content: message.resultContent ?? message.content }, sourceIndex: 0 }];
  for (const item of groupAdjacentToolBlocks(blocks, toolGroupKey)) {
    pushCellGap(rows, `${id}:cell:${item.kind === "single" ? item.entry.sourceIndex : item.entries[0]!.sourceIndex}`);
    if (item.kind === "tool-group") { projectToolGroup(rows, id, item.entries, width); continue; }
    const { block, sourceIndex } = item.entry;
    if (block.type === "tool") { projectToolBlock(rows, `${id}:tool:${sourceIndex}`, block, width); continue; }
    if (!block.content.trim()) continue;
    const start = rows.length;
    pushMarkdown(rows, `${id}:text:${sourceIndex}`, block.content, "assistant", bodyWidth);
    while (rows.length > start && isBlankRow(rows[rows.length - 1])) rows.pop();
    prefixCell(rows, start, { text: `${glyph("bullet")} `, tone: "muted", dim: true });
  }
  if (message.turnStats) {
    pushCellGap(rows, `${id}:stats-gap`);
    rows.push(turnStatsRow(`${id}:stats`, message.turnStats, width));
  }
}

export function projectStableTranscript(messages: TranscriptMessage[], width: number): TranscriptRow[] {
  const rows: TranscriptRow[] = [];
  messages.forEach((message, index) => {
    rows.push(...projectStableMessage(message, index, width));
    if (message.role !== "tool_call") return;
    const nextVisible = messages.slice(index + 1).find((candidate) => candidate.role !== "tool_result");
    if (nextVisible?.role !== "tool_call") pushGap(rows, `${message.id ?? `message-${index}`}:tool-gap`);
  });
  return rows;
}

export function projectStableMessage(
  message: TranscriptMessage,
  index: number,
  width: number,
): TranscriptRow[] {
  const rows: TranscriptRow[] = [];
  projectMessage(rows, message, index, Math.max(12, width - 2));
  // Messages are projected (and committed) one at a time; the trailing blank
  // row is the gap Codex puts before the next history cell.
  pushCellGap(rows, `${message.id ?? `message-${index}`}:end`);
  return normalizeTerminalRows(rows);
}

export function projectLiveTranscript(options: LiveTranscriptOptions): TranscriptRow[] {
  const rows: TranscriptRow[] = [];
  const width = Math.max(12, options.width - 2);
  const presentation = resolveLivePresentation({
    loading: Boolean(options.loading),
    paused: Boolean(options.paused),
    hasText: Boolean(options.streamingText),
    hasReasoning: Boolean(options.streamingReason),
    hasActiveTool: Boolean(options.activeTool),
  });
  // With a status line, reasoning shows there (as in Codex) instead of in the transcript.
  if (presentation === "reasoning" && !options.statusLine)
    rows.push({ id: "stream:reason", segments: [{ text: `${glyph("running")} `, tone: "muted", dim: true }, { text: "Thinking", tone: "muted", italic: true }] });
  if (presentation === "text" && options.streamingText) {
    pushCellGap(rows, "stream:gap");
    const start = rows.length;
    pushMarkdown(rows, "stream:text", options.streamingText, "assistant", Math.max(8, width - 2));
    prefixCell(rows, start, { text: `${glyph("bullet")} `, tone: "muted", dim: true });
  }
  if (presentation === "paused" || (presentation === "activity" && !options.statusLine)) {
    const paused = presentation === "paused";
    const label = paused ? "live output paused · Ctrl+L resume" : activityLabel(options.activity);
    rows.push({
      id: "stream:activity",
      segments: [
        { text: `${glyph(paused ? "paused" : "running")} `, tone: "muted", dim: true },
        { text: label, tone: "muted", italic: true },
      ],
    });
  }
  if (options.streamingError) {
    const start = rows.length;
    pushText(rows, "stream:error", options.streamingError, "error", Math.max(8, width - 2));
    prefixCell(rows, start, { text: `${glyph("stop")} `, tone: "error", bold: true });
  }
  return normalizeTerminalRows(rows);
}

function normalizeTerminalRows(rows: TranscriptRow[]): TranscriptRow[] {
  return rows.map((row) => ({
    ...row,
    segments: row.segments.map((segment) => ({ ...segment, text: terminalText(segment.text) })),
  }));
}

/** Cells carry no "Aurict" header any more; kept for callers that still pass it through. */
export function hasAssistantHeader(_rows: readonly TranscriptRow[]): boolean {
  return false;
}

export function projectTranscript(options: ProjectOptions): TranscriptRow[] {
  const stable = projectStableTranscript(options.messages, options.width);
  const live = projectLiveTranscript({
    width: options.width,
    streamingText: options.streamingText,
    streamingReason: options.streamingReason,
    streamingError: options.streamingError,
    hasAssistantHeader: hasAssistantHeader(stable),
    ...(options.loading !== undefined ? { loading: options.loading } : {}),
    ...(options.activity !== undefined ? { activity: options.activity } : {}),
    ...(options.activeTool !== undefined ? { activeTool: options.activeTool } : {}),
    ...(options.paused !== undefined ? { paused: options.paused } : {}),
  });
  const rows = [...stable, ...live];
  return rows.length > 0 ? rows : [{ id: "empty", segments: [{ text: "", tone: "muted" }] }];
}

/** Compatibility export for callers moving from the old flat line buffer. */
export const buildTranscriptLines = (
  messages: TranscriptMessage[], width: number, streamingText: string | null,
  streamingReason: string | null, streamingError: string | null,
): TranscriptLine[] => projectTranscript({ messages, width, streamingText, streamingReason, streamingError }).map((row) => {
  const first = row.segments[0];
  return {
    id: row.id,
    text: row.segments.map((segment) => segment.text).join(""),
    tone: first?.tone ?? "muted",
    ...(row.segments.some((segment) => segment.bold) ? { bold: true } : {}),
    ...(row.segments.some((segment) => segment.italic) ? { italic: true } : {}),
    ...(row.detailId ? { detailId: row.detailId } : {}),
  };
});
