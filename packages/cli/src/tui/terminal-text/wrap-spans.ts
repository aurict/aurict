import { displayWidth } from "./display-width.js";
import { wrapLine } from "../event-system/wrap-line.js";

/**
 * Word-wraps a line of styled spans to `width` cells, keeping each word's span
 * props. Ink's own wrapping keeps the space a line breaks at, so a wrapped line
 * can start one cell to the right; pre-wrapping here avoids that.
 */
export function wrapSpans<T extends { text: string }>(spans: readonly T[], width: number): T[][] {
  const limit = Math.max(1, width);
  const lines: T[][] = [[]];
  let used = 0;
  const push = (span: T, text: string) => {
    const line = lines.at(-1)!;
    const last = line.at(-1);
    // Merge with the previous run when the props match, so lines stay few spans.
    if (last && sameProps(last, span)) line[line.length - 1] = { ...last, text: last.text + text };
    else line.push({ ...span, text });
    used += displayWidth(text);
  };
  for (const span of spans) {
    for (const [index, word] of span.text.split(" ").entries()) {
      const gap = index > 0 && used > 0 ? 1 : 0;
      if (word === "") { if (gap) push(span, " "); continue; }
      if (used > 0 && used + gap + displayWidth(word) > limit) { lines.push([]); used = 0; }
      else if (gap) push(span, " ");
      // Words longer than a line (paths, URLs) are hard-split.
      const pieces = displayWidth(word) > limit ? wrapLine(word, limit) : [word];
      pieces.forEach((piece, pieceIndex) => {
        if (pieceIndex > 0) { lines.push([]); used = 0; }
        push(span, piece);
      });
    }
  }
  return lines.map((line) => trimEnd(line));
}

function sameProps(left: object, right: object): boolean {
  const keys = new Set([...Object.keys(left), ...Object.keys(right)].filter((key) => key !== "text"));
  return [...keys].every((key) => (left as Record<string, unknown>)[key] === (right as Record<string, unknown>)[key]);
}

function trimEnd<T extends { text: string }>(line: T[]): T[] {
  const last = line.at(-1);
  if (!last || !last.text.endsWith(" ")) return line;
  const text = last.text.trimEnd();
  return text ? [...line.slice(0, -1), { ...last, text }] : line.slice(0, -1);
}
