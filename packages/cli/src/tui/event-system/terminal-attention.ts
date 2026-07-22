import { truncateDisplayWidth } from "../terminal-text/display-width.js";

export type TerminalAttentionState = "ready" | "running" | "permission";
export type TerminalWriter = (value: string) => unknown;

function safeText(value: string): string {
  return value.replace(/[\x00-\x1F\x7F]/g, " ").replace(/\s+/g, " ").trim();
}

export function terminalTitleSequence(title: string, state: TerminalAttentionState): string {
  const marker = state === "running" ? "●" : state === "permission" ? "!" : "·";
  const label = truncateDisplayWidth(safeText(title) || "Aurict", 48);
  return `\x1b]0;${marker} Aurict — ${label}\x07`;
}

export function terminalNotificationSequence(message: string): string {
  const label = truncateDisplayWidth(safeText(message), 120);
  return `\x07\x1b]9;${label}\x07`;
}

export function writeTerminalTitle(
  title: string,
  state: TerminalAttentionState,
  write: TerminalWriter = (value) => process.stdout.write(value),
): void {
  if (!process.stdout.isTTY) return;
  write(terminalTitleSequence(title, state));
}

export function notifyTerminal(
  message: string,
  write: TerminalWriter = (value) => process.stdout.write(value),
): void {
  if (!process.stdout.isTTY) return;
  write(terminalNotificationSequence(message));
}
