import { useEffect } from "react";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import crypto from "node:crypto";
import { SessionManager } from "@aurict/core";
import type { CoreMessage } from "@aurict/core";
import type { DisplayMessage } from "../conversation/types.js";

interface Params {
  /** Session id from `--resume`, or "latest" for `--continue`. */
  sessionId: string | undefined;
  mainSessionId: MutableRefObject<string>;
  setHistory: Dispatch<SetStateAction<CoreMessage[]>>;
  setMessages: Dispatch<SetStateAction<DisplayMessage[]>>;
  addSystemMsg: (content: string) => void;
}

export function resolveResumeTarget(sessionId: string): string | undefined {
  if (sessionId !== "latest") return SessionManager.get(sessionId) ? sessionId : undefined;
  return SessionManager.list()
    .filter((session) => !session.parentId)
    .sort((left, right) => right.updatedAt - left.updatedAt)[0]?.id;
}

/** Restores a persisted session once on mount and keeps appending to it. */
export function useResumeSession(params: Params): void {
  useEffect(() => {
    if (!params.sessionId) return;
    const target = resolveResumeTarget(params.sessionId);
    if (!target) {
      params.addSystemMsg(params.sessionId === "latest"
        ? "⚠ No previous session to continue"
        : `⚠ Session not found: ${params.sessionId} · /resume lists saved sessions`);
      return;
    }
    const turns = SessionManager.getParts(target)
      .filter((part) => part.role === "user" || part.role === "assistant")
      .map((part) => ({ role: part.role as "user" | "assistant", content: part.content }));
    params.mainSessionId.current = target;
    params.setHistory(turns);
    params.setMessages(turns.map((turn) => ({ ...turn, id: crypto.randomUUID() })));
    const title = SessionManager.get(target)?.title;
    params.addSystemMsg(`Resumed ${title ? `"${title}"` : target} · ${turns.length} messages`);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
