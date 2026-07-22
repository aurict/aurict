import { truncateDisplayWidth } from "../terminal-text/display-width.js";
import { projectStableTranscript } from "./projector.js";
import { assistantTranscriptText } from "./transcript-export.js";
import type { TranscriptMessage } from "./types.js";

export interface TranscriptSearchMatch {
  messageId: string;
  role: "You" | "Aurict" | "System" | "Error";
  snippet: string;
}

function searchableText(message: TranscriptMessage): string {
  return message.role === "assistant" ? assistantTranscriptText(message) : message.content;
}

export function findTranscriptMatches(
  messages: TranscriptMessage[],
  query: string,
  limit = 20,
): TranscriptSearchMatch[] {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return [];
  const matches: TranscriptSearchMatch[] = [];
  for (let index = messages.length - 1; index >= 0 && matches.length < limit; index--) {
    const message = messages[index]!;
    const text = searchableText(message).replace(/\s+/g, " ").trim();
    const found = text.toLocaleLowerCase().indexOf(needle);
    if (found < 0) continue;
    const start = Math.max(0, found - 28);
    const end = Math.min(text.length, found + needle.length + 52);
    const snippet = `${start > 0 ? "…" : ""}${text.slice(start, end)}${end < text.length ? "…" : ""}`;
    matches.push({
      messageId: message.id ?? `message-${index}`,
      role: message.role === "user" ? "You" : message.role === "assistant" ? "Aurict" : message.role === "error" ? "Error" : "System",
      snippet: truncateDisplayWidth(snippet, 86),
    });
  }
  return matches;
}

export function transcriptOffsetForMessage(
  messages: TranscriptMessage[],
  width: number,
  viewportRows: number,
  messageId: string,
): number {
  const rows = projectStableTranscript(messages, width);
  const rowIndex = rows.findIndex((row) => row.id === messageId || row.id.startsWith(`${messageId}:`));
  if (rowIndex < 0) return 0;
  const maxOffset = Math.max(0, rows.length - Math.max(1, viewportRows));
  const desiredStart = Math.max(0, rowIndex - Math.floor(viewportRows / 3));
  return Math.max(0, Math.min(maxOffset, maxOffset - desiredStart));
}
