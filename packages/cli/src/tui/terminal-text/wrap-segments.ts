import { displayWidth } from "./display-width.js";
import { graphemeSegments } from "./graphemes.js";

export interface StyledTextSegment {
  text: string;
}

interface Atom<T extends StyledTextSegment> {
  segment: string;
  source: T;
  sourceIndex: number;
}

function isWhitespace(atom: Atom<StyledTextSegment>): boolean {
  return /^\s$/u.test(atom.segment);
}

function collapse<T extends StyledTextSegment>(atoms: Atom<T>[]): T[] {
  const result: T[] = [];
  let sourceIndex = -1;
  for (const atom of atoms) {
    if (sourceIndex === atom.sourceIndex) {
      result[result.length - 1]!.text += atom.segment;
    } else {
      result.push({ ...atom.source, text: atom.segment });
      sourceIndex = atom.sourceIndex;
    }
  }
  return result;
}

function trimBoundaryWhitespace<T extends StyledTextSegment>(atoms: Atom<T>[]): Atom<T>[] {
  let start = 0;
  let end = atoms.length;
  while (start < end && isWhitespace(atoms[start]!)) start++;
  while (end > start && isWhitespace(atoms[end - 1]!)) end--;
  return atoms.slice(start, end);
}

function trimTrailingWhitespace<T extends StyledTextSegment>(atoms: Atom<T>[]): Atom<T>[] {
  let end = atoms.length;
  while (end > 0 && isWhitespace(atoms[end - 1]!)) end--;
  return atoms.slice(0, end);
}

function lastWhitespaceIndex<T extends StyledTextSegment>(atoms: Atom<T>[]): number {
  for (let index = atoms.length - 1; index >= 0; index--)
    if (isWhitespace(atoms[index]!)) return index;
  return -1;
}

export function wrapStyledSegments<T extends StyledTextSegment>(segments: T[], maxWidth: number): T[][] {
  const width = Math.max(1, maxWidth);
  const atoms = segments.flatMap((source, sourceIndex) =>
    graphemeSegments(source.text).map((part) => ({ segment: part.segment, source, sourceIndex })),
  );
  if (atoms.length === 0) return [[]];

  const rows: T[][] = [];
  let row: Atom<T>[] = [];
  let rowWidth = 0;

  const emit = () => {
    rows.push(collapse(trimTrailingWhitespace(row)));
    row = [];
    rowWidth = 0;
  };

  for (const atom of atoms) {
    const atomWidth = displayWidth(atom.segment);
    if (rowWidth + atomWidth <= width || row.length === 0) {
      row.push(atom);
      rowWidth += atomWidth;
      continue;
    }

    const breakAt = lastWhitespaceIndex(row);
    const breakHead = breakAt >= 0 ? trimTrailingWhitespace(row.slice(0, breakAt)) : [];
    if (breakAt >= 0 && breakHead.some((part) => !isWhitespace(part))) {
      const carry = trimBoundaryWhitespace(row.slice(breakAt + 1));
      row = breakHead;
      emit();
      row = carry;
      rowWidth = displayWidth(carry.map((part) => part.segment).join(""));
    } else {
      emit();
    }

    if (isWhitespace(atom)) continue;
    if (rowWidth + atomWidth > width && row.length > 0) emit();
    row.push(atom);
    rowWidth += atomWidth;
  }

  if (row.length > 0 || rows.length === 0) emit();
  return rows;
}
