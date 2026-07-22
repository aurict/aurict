import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import type { DisplayMessage } from "../conversation/types.js";
import { injectInput, useMouseEvents } from "../mouse.js";
import { summarizeUnseenMessages } from "../conversation/unseen-summary.js";

interface ConversationViewportParams {
  messages: DisplayMessage[];
  terminalRows: number;
  overlayOpen: boolean;
  viewingSubagent: boolean;
  pickerOpen: boolean;
  permissionOpen: boolean;
  questionOpen: boolean;
}

export function useConversationViewport(params: ConversationViewportParams) {
  const [scrollLocked, setScrollLockedState] = useState(false);
  const scrollLockedRef = useRef(false);
  const [conversationOffsetRows, setConversationOffsetRows] = useState(0);
  const [measuredViewportRows, setMeasuredViewportRows] = useState(() =>
    Math.max(6, params.terminalRows - 8),
  );
  const maxScrollOffsetRef = useRef(0);
  const scrollLockMessageCountRef = useRef(0);

  useEffect(() => {
    scrollLockedRef.current = scrollLocked;
  }, [scrollLocked]);
  const setScrollLocked = useCallback<Dispatch<SetStateAction<boolean>>>((nextValue) => {
    setScrollLockedState((current) => {
      const next = typeof nextValue === "function" ? nextValue(current) : nextValue;
      if (next && !current) scrollLockMessageCountRef.current = params.messages.length;
      return next;
    });
  }, [params.messages.length]);
  const unseen = useMemo(
    () => scrollLocked
      ? summarizeUnseenMessages(params.messages.slice(scrollLockMessageCountRef.current))
      : { count: 0, label: "" },
    [params.messages, scrollLocked],
  );

  const scrollConversation = useCallback((deltaRows: number) => {
    if (deltaRows === 0) return;
    setConversationOffsetRows((previous) =>
      Math.max(0, Math.min(maxScrollOffsetRef.current, previous + deltaRows)),
    );
  }, []);
  const handleScrollRange = useCallback((maxOffset: number) => {
    maxScrollOffsetRef.current = maxOffset;
    setConversationOffsetRows((previous) =>
      previous > maxOffset ? maxOffset : previous,
    );
  }, []);
  const pageConversation = useCallback((direction: -1 | 1) => {
    const page = Math.max(3, Math.floor(measuredViewportRows * 0.8));
    scrollConversation(direction * page);
  }, [measuredViewportRows, scrollConversation]);

  useMouseEvents((event) => {
    if (event.type !== "scroll") return;
    if (params.pickerOpen || params.permissionOpen || params.questionOpen) {
      if (event.button === "scroll-up") injectInput("\x1b[A");
      if (event.button === "scroll-down") injectInput("\x1b[B");
      return;
    }
    if (params.overlayOpen || params.viewingSubagent) return;
    scrollConversation(event.button === "scroll-up" ? 3 : -3);
  }, true);

  return {
    scrollLocked,
    setScrollLocked,
    scrollLockedRef,
    conversationOffsetRows,
    setConversationOffsetRows,
    measuredViewportRows,
    setMeasuredViewportRows,
    unseenCount: unseen.count,
    unseenLabel: unseen.label,
    scrollConversation,
    handleScrollRange,
    pageConversation,
  };
}
