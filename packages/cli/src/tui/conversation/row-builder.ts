import { wrapLine } from "../event-system/wrap-line.js";
import { wrapStyledSegments } from "../terminal-text/wrap-segments.js";
import type { TranscriptRow, TranscriptSegment, TranscriptTone } from "./row-model.js";

const ANSI = /\x1B\[[0-?]*[ -/]*[@-~]/g;
const OSC = /\x1B\](?:[^\x07\x1B]|\x1B(?!\\))*(?:\x07|\x1B\\)/g;

export function cleanTranscriptText(text: string): string {
  return text.replace(OSC, "").replace(ANSI, "").replace(/\r/g, "").replace(/\t/g, "    ");
}

export function wrapTranscriptText(text: string, width: number): string[] {
  const output: string[] = [];
  for (const line of cleanTranscriptText(text).split("\n"))
    output.push(...wrapLine(line, Math.max(12, width)));
  return output.length > 0 ? output : [""];
}

export function pushWrapped(
  rows: TranscriptRow[],
  id: string,
  segments: TranscriptSegment[],
  width: number,
  detailId?: string,
): void {
  wrapStyledSegments(segments, Math.max(12, width)).forEach((line, index) => rows.push({
    id: `${id}:${index}`,
    segments: line,
    ...(detailId ? { detailId } : {}),
  }));
}

export function pushText(
  rows: TranscriptRow[],
  id: string,
  text: string,
  tone: TranscriptTone,
  width: number,
  detailId?: string,
): void {
  for (const [lineIndex, line] of cleanTranscriptText(text).split("\n").entries())
    pushWrapped(rows, `${id}:${lineIndex}`, [{ text: line, tone }], width, detailId);
}

export function isBlankRow(row: TranscriptRow | undefined): boolean {
  return Boolean(row) && row!.segments.every((segment) => segment.text === "");
}

export function pushGap(rows: TranscriptRow[], id: string): void {
  if (rows.length === 0 || isBlankRow(rows[rows.length - 1])) return;
  rows.push({ id, segments: [{ text: "", tone: "muted" }] });
}
