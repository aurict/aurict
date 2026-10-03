import { useCallback, useRef, useState } from "react";
import type { TuiMode } from "../render-mode.js";

/**
 * Inline mode needs one last frame before Ink unmounts: it writes every
 * remaining transcript row to scrollback and erases the live area, so the
 * terminal keeps the whole session instead of a half-drawn composer.
 */
export function useModeAwareExit(exit: () => void, mode: TuiMode, beforeExit?: () => void) {
  const [exiting, setExiting] = useState(false);
  const beforeExitRef = useRef(beforeExit);
  beforeExitRef.current = beforeExit;
  const requestExit = useCallback(() => {
    beforeExitRef.current?.();
    if (mode !== "inline") {
      exit();
      return;
    }
    setExiting(true);
    setTimeout(exit, 0);
  }, [exit, mode]);
  return { exiting, exit: requestExit };
}
