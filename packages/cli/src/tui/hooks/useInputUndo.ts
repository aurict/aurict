import { useCallback, useRef } from "react";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";

interface Cursor { row: number; col: number }
interface Snapshot { lines: string[]; cursor: Cursor }

interface Params {
  linesRef: MutableRefObject<string[]>;
  cursorRef: MutableRefObject<Cursor>;
  setLines: Dispatch<SetStateAction<string[]>>;
  setCursor: Dispatch<SetStateAction<Cursor>>;
  limit?: number;
}

export function useInputUndo(params: Params) {
  const past = useRef<Snapshot[]>([]);
  const future = useRef<Snapshot[]>([]);
  const limit = params.limit ?? 30;

  const current = useCallback((): Snapshot => ({
    lines: [...params.linesRef.current],
    cursor: { ...params.cursorRef.current },
  }), [params.cursorRef, params.linesRef]);

  const restore = useCallback((snapshot: Snapshot) => {
    params.linesRef.current = snapshot.lines;
    params.cursorRef.current = snapshot.cursor;
    params.setLines(snapshot.lines);
    params.setCursor(snapshot.cursor);
  }, [params]);

  const checkpoint = useCallback(() => {
    const snapshot = current();
    const last = past.current.at(-1);
    if (!last || last.lines.join("\n") !== snapshot.lines.join("\n") ||
        last.cursor.row !== snapshot.cursor.row || last.cursor.col !== snapshot.cursor.col)
      past.current = [...past.current.slice(-(limit - 1)), snapshot];
    future.current = [];
  }, [current, limit]);

  const undo = useCallback(() => {
    const snapshot = past.current.pop();
    if (!snapshot) return false;
    future.current.push(current());
    restore(snapshot);
    return true;
  }, [current, restore]);

  const redo = useCallback(() => {
    const snapshot = future.current.pop();
    if (!snapshot) return false;
    past.current.push(current());
    restore(snapshot);
    return true;
  }, [current, restore]);

  return { checkpoint, undo, redo };
}
