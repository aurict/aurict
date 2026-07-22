import stringWidth from "string-width";
import { clampGraphemeBoundary, graphemeSegments } from "./graphemes.js";

export function displayWidth(value: string): number {
  return stringWidth(value);
}

function takeStart(value: string, width: number): string {
  let result = "";
  let used = 0;
  for (const part of graphemeSegments(value)) {
    const next = displayWidth(part.segment);
    if (used + next > width) break;
    result += part.segment;
    used += next;
  }
  return result;
}

function takeEnd(value: string, width: number): string {
  let result = "";
  let used = 0;
  const parts = graphemeSegments(value);
  for (let index = parts.length - 1; index >= 0; index--) {
    const segment = parts[index]!.segment;
    const next = displayWidth(segment);
    if (used + next > width) break;
    result = segment + result;
    used += next;
  }
  return result;
}

export function truncateDisplayWidth(value: string, maxWidth: number, suffix = "…"): string {
  const width = Math.max(0, maxWidth);
  if (displayWidth(value) <= width) return value;
  const suffixWidth = displayWidth(suffix);
  if (width <= suffixWidth) return takeStart(suffix, width);
  return `${takeStart(value, width - suffixWidth)}${suffix}`;
}

export function truncateDisplayMiddle(value: string, maxWidth: number, marker = "…"): string {
  const width = Math.max(0, maxWidth);
  if (displayWidth(value) <= width) return value;
  const markerWidth = displayWidth(marker);
  if (width <= markerWidth) return takeStart(marker, width);
  const remaining = width - markerWidth;
  const tailWidth = Math.min(18, Math.floor(remaining * 0.55));
  const headWidth = remaining - tailWidth;
  return `${takeStart(value, headWidth)}${marker}${takeEnd(value, tailWidth)}`;
}

export function padDisplayEnd(value: string, targetWidth: number): string {
  return value + " ".repeat(Math.max(0, targetWidth - displayWidth(value)));
}

export function offsetToDisplayColumn(value: string, offset: number): number {
  const boundary = clampGraphemeBoundary(value, offset);
  return displayWidth(value.slice(0, boundary));
}

export function displayColumnToOffset(value: string, column: number): number {
  const target = Math.max(0, column);
  let used = 0;
  for (const part of graphemeSegments(value)) {
    const width = displayWidth(part.segment);
    if (target <= used) return part.start;
    if (target < used + width)
      return target - used < width / 2 ? part.start : part.end;
    used += width;
  }
  return value.length;
}
