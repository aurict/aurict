import type { PermissionDecision, PermissionRequest } from "@aurict/core";
import type { TranscriptNotice } from "./conversation/types.js";

type PermissionAction = PermissionDecision | "deny_abort";

const SNIPPET_LIMIT = 80;

/** First line of the command, " ..." when more follow, at most 80 characters (Codex). */
function snippet(command: string): string {
  const [first = "", ...rest] = command.trim().split(/\r?\n/);
  const line = rest.length > 0 ? `${first} ...` : first;
  return [...line].length > SNIPPET_LIMIT ? `${[...line].slice(0, SNIPPET_LIMIT - 3).join("")}...` : line;
}

function isShell(tool: string): boolean {
  return tool === "bash" || tool === "shell";
}

/**
 * The decision cell Codex writes to history after an approval. Edits get no
 * cell (the edit itself is the record); other tools get Codex's plain
 * permission lines.
 */
export function approvalNotice(action: PermissionAction, request: Pick<PermissionRequest, "tool" | "pattern" | "prefixRule">): TranscriptNotice | null {
  if (["write", "edit", "apply_patch"].includes(request.tool)) return null;
  const command = snippet(request.pattern);
  if (!isShell(request.tool)) {
    const granted = action !== "deny" && action !== "deny_abort";
    return { marker: granted ? "check" : "error", parts: [{ text: granted ? action === "allow" ? "You granted additional permissions for this session" : "You granted additional permissions" : "You did not grant additional permissions" }] };
  }
  const approved = (verb: string, ...rest: TranscriptNotice["parts"]): TranscriptNotice => ({ marker: "check", parts: [{ text: "You " }, { text: verb, bold: true }, ...rest] });
  const rejected = (verb: string, ...rest: TranscriptNotice["parts"]): TranscriptNotice => ({ marker: "error", parts: [{ text: "You " }, { text: verb, bold: true }, ...rest] });
  switch (action) {
    case "allow_once":
      return approved("approved", { text: " aurict to run " }, { text: command, dim: true }, { text: " this time", bold: true });
    case "allow":
    case "allow_directory":
      return approved("approved", { text: " aurict to run " }, { text: command, dim: true }, { text: " every time this session", bold: true });
    case "allow_prefix":
      return approved("approved", { text: " aurict to always run commands that start with " }, { text: request.prefixRule ?? command, dim: true });
    case "deny":
      return rejected("did not approve", { text: " aurict to run " }, { text: command, dim: true });
    case "deny_abort":
      return rejected("canceled", { text: " the request to run " }, { text: command, dim: true });
    default:
      return null;
  }
}
