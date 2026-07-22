import { displayColumnToOffset, offsetToDisplayColumn } from "./display-width.js";

export function verticalCursorOffset(sourceLine: string, targetLine: string, sourceOffset: number): number {
  return displayColumnToOffset(targetLine, offsetToDisplayColumn(sourceLine, sourceOffset));
}
