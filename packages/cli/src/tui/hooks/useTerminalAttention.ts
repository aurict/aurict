import { useEffect, useRef } from "react";
import type { PermissionRequest } from "@aurict/core";
import { useTerminalFocus } from "../event-system/use-terminal-focus.js";
import { notifyTerminal, writeTerminalTitle } from "../event-system/terminal-attention.js";

interface Params {
  loading: boolean;
  permission: PermissionRequest | null;
  sessionTitle?: string | undefined;
}

export function useTerminalAttention(params: Params): void {
  const focused = useTerminalFocus();
  const previousLoading = useRef(params.loading);
  const previousPermission = useRef<string | null>(params.permission?.id ?? null);
  const title = params.sessionTitle ?? "new session";
  const state = params.permission ? "permission" : params.loading ? "running" : "ready";

  useEffect(() => {
    writeTerminalTitle(title, state);
  }, [state, title]);

  useEffect(() => {
    const completed = previousLoading.current && !params.loading;
    previousLoading.current = params.loading;
    if (completed && !focused) notifyTerminal(`${title}: turn finished`);
  }, [focused, params.loading, title]);

  useEffect(() => {
    const permissionId = params.permission?.id ?? null;
    const arrived = permissionId !== null && permissionId !== previousPermission.current;
    previousPermission.current = permissionId;
    if (arrived && !focused)
      notifyTerminal(`${title}: permission required for ${params.permission?.tool ?? "tool"}`);
  }, [focused, params.permission, title]);

  useEffect(() => () => writeTerminalTitle("Aurict", "ready"), []);
}
