export interface GraphemeSegment {
  segment: string;
  start: number;
  end: number;
}

const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });

export function graphemeSegments(value: string): GraphemeSegment[] {
  return [...segmenter.segment(value)].map(({ segment, index }) => ({
    segment,
    start: index,
    end: index + segment.length,
  }));
}

export function graphemeCount(value: string): number {
  return [...segmenter.segment(value)].length;
}

export function previousGraphemeBoundary(value: string, offset: number): number {
  const target = Math.max(0, Math.min(offset, value.length));
  let previous = 0;
  for (const part of segmenter.segment(value)) {
    if (part.index >= target) break;
    previous = part.index;
  }
  return previous;
}

export function nextGraphemeBoundary(value: string, offset: number): number {
  const target = Math.max(0, Math.min(offset, value.length));
  for (const part of segmenter.segment(value)) {
    const end = part.index + part.segment.length;
    if (end > target) return end;
  }
  return value.length;
}

export function clampGraphemeBoundary(
  value: string,
  offset: number,
  direction: "backward" | "forward" = "backward",
): number {
  const target = Math.max(0, Math.min(offset, value.length));
  if (target === 0 || target === value.length) return target;
  for (const part of segmenter.segment(value)) {
    if (part.index === target) return target;
    const end = part.index + part.segment.length;
    if (part.index < target && target < end)
      return direction === "forward" ? end : part.index;
  }
  return target;
}

export function graphemeAt(value: string, offset: number): GraphemeSegment | undefined {
  const target = clampGraphemeBoundary(value, offset);
  return graphemeSegments(value).find((part) => part.start === target);
}
