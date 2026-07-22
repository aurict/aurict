import { glyph, terminalText } from "../terminal-glyphs.js";
import { activityLabel, type RunActivity } from "../run-status.js";
import type { TranscriptMessage, TranscriptBlock } from "./types.js";
import { coalesceInterruptedAssistantBlocks } from "./block-flow.js";
import { resolveLivePresentation } from "./live-state.js";
import { groupAdjacentToolBlocks } from "./tool-grouping.js";
import { isMarkdownHeading, isMarkdownListItem, proseLayout, standaloneSectionTitle } from "./readability.js";
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
  toolSectionKind,
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

function markdownSegments(line: string, tone: TranscriptTone, inCode: boolean): { segments: TranscriptSegment[]; toggleCode: boolean } {
  const fence = line.match(/^```\s*([^\s]*)/);
  if (fence) return { segments: [{ text: inCode ? glyph("close") : `${glyph("open")} ${fence[1] || "code"}`, tone: "code" }], toggleCode: true };
  if (inCode) return { segments: [{ text: line, tone: "code" }], toggleCode: false };
  const heading = line.match(/^(#{1,6})\s+(.+)$/);
  if (heading) {
    const level = heading[1]!.length;
    return {
      segments: [{
        text: `${glyph(level < 3 ? "headingMajor" : "headingMinor")} ${heading[2]!}`,
        tone: level <= 2 ? "heading" : "assistant",
        ...(level <= 3 ? { bold: true } : {}),
      }],
      toggleCode: false,
    };
  }
  const sectionTitle = standaloneSectionTitle(line);
  if (sectionTitle) return { segments: [{ text: sectionTitle, tone: "heading", bold: true }], toggleCode: false };
  if (/^(---+|\*\*\*+)\s*$/.test(line)) return { segments: [{ text: glyph("divider").repeat(16), tone: "muted" }], toggleCode: false };
  if (line.startsWith(">")) return { segments: [{ text: `${glyph("quote")} ${line.replace(/^>\s?/, "")}`, tone: "quote", italic: true }], toggleCode: false };
  const task = line.match(/^(\s*)[-*]\s+\[([ xX])\]\s+(.*)$/);
  if (task) return { segments: [{ text: `${task[1]}${task[2]!.toLowerCase() === "x" ? glyph("done") : glyph("todo")} `, tone: task[2]!.toLowerCase() === "x" ? "success" : "muted" }, ...inlineSegments(task[3]!, tone)], toggleCode: false };
  const list = line.match(/^(\s*)[-*]\s+(.*)$/);
  if (list) return { segments: [{ text: `${list[1]}${glyph("bullet")} `, tone: "bullet" }, ...inlineSegments(list[2]!, tone)], toggleCode: false };
  return { segments: inlineSegments(line, tone), toggleCode: false };
}

function pushMarkdown(rows: TranscriptRow[], id: string, text: string, tone: TranscriptTone, width: number): void {
  let inCode = false;
  const layout = proseLayout(width);
  const inset = layout.leftInset > 0 ? " ".repeat(layout.leftInset) : "";
  const sources = clean(text).split("\n");
  for (const [index, source] of sources.entries()) {
    if (!inCode && !source.trim()) {
      pushGap(rows, `${id}:${index}:gap`);
      continue;
    }
    const wasInCode = inCode;
    const codeFence = /^```/.test(source);
    const sectionHeading = !inCode && (isMarkdownHeading(source) || standaloneSectionTitle(source) !== undefined);
    const listItem = !inCode && isMarkdownListItem(source);
    const previousListItem = index > 0 && isMarkdownListItem(sources[index - 1]!);
    const nextListItem = index + 1 < sources.length && isMarkdownListItem(sources[index + 1]!);
    if (sectionHeading) pushGap(rows, `${id}:${index}:before`);
    if (listItem && !previousListItem) pushGap(rows, `${id}:${index}:list-before`);
    if (codeFence && !wasInCode) pushGap(rows, `${id}:${index}:code-before`);
    const formatted = markdownSegments(source, tone, inCode);
    const codeLine = inCode || formatted.toggleCode;
    if (formatted.toggleCode) inCode = !inCode;
    const firstRow = rows.length;
    pushWrapped(rows, `${id}:${index}`, formatted.segments, codeLine ? width : layout.contentWidth);
    if (inset && !codeLine) {
      for (let rowIndex = firstRow; rowIndex < rows.length; rowIndex++)
        rows[rowIndex]!.segments.unshift({ text: inset, tone: "muted" });
    }
    if (sectionHeading) pushGap(rows, `${id}:${index}:after`);
    if (listItem && !nextListItem) pushGap(rows, `${id}:${index}:list-after`);
    if (codeFence && wasInCode) pushGap(rows, `${id}:${index}:code-after`);
  }
}

function thinkingSummary(content: string): string {
  const normalized = content.toLowerCase();
  const stage = /test|verify|check|lint|build/.test(normalized) ? "verifying"
    : /search|research|source|investigat/.test(normalized) ? "researching"
      : /plan|approach|step|first/.test(normalized) ? "planning" : "thinking";
  return `${glyph("thinking")} ${stage} · Ctrl+O inspect`;
}

function timestamp(timestamp: number | undefined): string {
  if (timestamp === undefined) return "";
  const date = new Date(timestamp);
  return ` · ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
}

function projectMessage(rows: TranscriptRow[], message: TranscriptMessage, index: number, width: number): void {
  const id = message.id ?? `message-${index}`;
  if (message.role === "system") {
    pushWrapped(rows, `${id}:notice`, [{ text: `${glyph("system")} `, tone: "muted" }, { text: message.content, tone: "muted" }], width);
    return;
  }
  if (message.role === "error") {
    const error = message.errorPresentation;
    pushWrapped(rows, `${id}:error`, [{ text: `${glyph("error")} `, tone: "error", bold: true }, { text: error?.title ?? message.content, tone: "error", bold: true }], width);
    if (error?.detail && error.detail !== error.title) pushText(rows, `${id}:detail`, `  ${error.detail}`, "muted", width);
    if (error?.action) pushText(rows, `${id}:action`, `  ${glyph("action")} ${error.action}`, "muted", width);
    pushGap(rows, `${id}:gap`);
    return;
  }
  if (message.role === "tool_result") return;
  if (message.role === "tool_call") {
    projectToolBlock(rows, `${id}:tool`, { type: "tool", id, tool: message.tool ?? "tool", args: message.content, pending: Boolean(message.pending), ...(message.resultContent !== undefined ? { resultContent: message.resultContent } : {}), ...(message.artifact !== undefined ? { artifact: message.artifact } : {}) }, width);
    return;
  }
  const tone = message.role === "user" ? "user" : "assistant";
  const messageStart = rows.length;
  const toolOnly = message.role === "assistant" && Boolean(message.blocks?.length) && message.blocks!.every((block) => block.type === "tool");
  if (!toolOnly) {
    const marker = message.role === "user" ? glyph("headingMinor") : glyph("assistant");
    const time = timestamp(message.timestamp);
    rows.push({ id: `${id}:header`, segments: [
      { text: `${marker} ${message.role === "user" ? "You" : "Aurict"}`, tone, bold: true },
      ...(time ? [{ text: time, tone: "muted" as const }] : []),
    ] });
  }
  if (message.reasoningContent) rows.push({ id: `${id}:thinking`, segments: [{ text: thinkingSummary(message.reasoningContent), tone: "thinking", italic: true }], detailId: `${id}:thinking` });
  if (message.blocks?.length) {
    const displayBlocks = message.role === "assistant"
      ? coalesceInterruptedAssistantBlocks(message.blocks)
      : message.blocks.map((block, sourceIndex) => ({ block, sourceIndex }));
    const groupedBlocks = groupAdjacentToolBlocks(displayBlocks, toolGroupKey);
    let previousKind: TranscriptBlock["type"] | "error" | undefined;
    for (const item of groupedBlocks) {
      const { block, sourceIndex } = item.kind === "single" ? item.entry : item.entries[0]!;
      const kind = item.kind === "tool-group" ? "tool" : block.type;
      const sectionKind = item.kind === "single" && block.type === "tool"
        ? toolSectionKind(block)
        : kind;
      if (previousKind && previousKind !== sectionKind)
        pushGap(rows, `${id}:flow:${sourceIndex}:gap`);
      if (item.kind === "tool-group") {
        projectToolGroup(rows, id, item.entries, width);
      } else if (block.type === "tool") projectToolBlock(rows, `${id}:tool:${sourceIndex}`, block, width);
      else {
        if (block.reasoningContent) rows.push({ id: `${id}:text:${sourceIndex}:thinking`, segments: [{ text: thinkingSummary(block.reasoningContent), tone: "thinking", italic: true }], detailId: `${id}:text:${sourceIndex}:thinking` });
        pushMarkdown(rows, `${id}:text:${sourceIndex}`, block.content, tone, width);
      }
      previousKind = sectionKind;
    }
  } else pushMarkdown(rows, `${id}:body`, message.resultContent ?? message.content, tone, width);
  pushGap(rows, `${id}:gap`);
  if (message.role === "user") {
    for (let rowIndex = messageStart; rowIndex < rows.length; rowIndex++) {
      const row = rows[rowIndex]!;
      if (!isBlankRow(row)) row.surface = "user";
    }
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
  if (presentation === "reasoning")
    rows.push({ id: "stream:reason", segments: [{ text: `${glyph("thinking")} thinking…`, tone: "thinking", italic: true }] });
  if (presentation === "text" && options.streamingText) {
    if (!options.hasAssistantHeader)
      rows.push({ id: "stream:header", segments: [{ text: `${glyph("assistant")} Aurict`, tone: "assistant", bold: true }] });
    pushMarkdown(rows, "stream:text", options.streamingText, "assistant", width);
  }
  if (presentation === "paused" || presentation === "activity") {
    const paused = presentation === "paused";
    const label = paused ? "live output paused · Ctrl+L resume" : activityLabel(options.activity);
    rows.push({
      id: "stream:activity",
      segments: [
        { text: `${glyph(paused ? "paused" : "working")} `, tone: "thinking" },
        { text: label, tone: "muted", italic: true },
      ],
    });
  }
  if (options.streamingError) pushText(rows, "stream:error", `${glyph("error")} ${options.streamingError}`, "error", width);
  return normalizeTerminalRows(rows);
}

function normalizeTerminalRows(rows: TranscriptRow[]): TranscriptRow[] {
  return rows.map((row) => ({
    ...row,
    segments: row.segments.map((segment) => ({ ...segment, text: terminalText(segment.text) })),
  }));
}

function hasAssistantHeader(rows: TranscriptRow[]): boolean {
  return rows.some((row) => row.id.endsWith(":header") && row.segments.some((segment) => segment.text.toLowerCase().includes("aurict")));
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
