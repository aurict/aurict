import { useCallback, useRef } from "react";
import { expandPastePlaceholders, isLargePaste, pastePlaceholder } from "../composer-paste.js";

export function usePastePlaceholders() {
  const pastes = useRef(new Map<string, string>());
  const counter = useRef(0);
  /** Returns the text to insert: the paste itself, or a token standing for it. */
  const collapse = useCallback((text: string) => {
    if (!isLargePaste(text)) return text;
    const placeholder = pastePlaceholder(++counter.current, text);
    pastes.current.set(placeholder, text);
    return placeholder;
  }, []);
  /** Expands tokens for sending and forgets them; the draft is being cleared. */
  const take = useCallback((text: string) => {
    const expanded = expandPastePlaceholders(text, pastes.current);
    pastes.current.clear();
    return expanded;
  }, []);
  return { collapse, take };
}
