import type { TranscriptBlock, TranscriptMessage } from "./types.js";

function blockText(block: TranscriptBlock): string {
  if (block.type === "text") return block.content.trim();
  return `[tool: ${block.tool}]`;
}

export function assistantTranscriptText(message: TranscriptMessage): string {
  if (message.blocks?.length)
    return message.blocks.map(blockText).filter(Boolean).join("\n\n");
  return message.content.trim();
}

export function lastAssistantText(messages: TranscriptMessage[]): string | undefined {
  for (let index = messages.length - 1; index >= 0; index--) {
    const message = messages[index]!;
    if (message.role !== "assistant") continue;
    const text = assistantTranscriptText(message);
    if (text) return text;
  }
  return undefined;
}

export function lastAssistantCodeBlock(messages: TranscriptMessage[]): string | undefined {
  const text = lastAssistantText(messages);
  if (!text) return undefined;
  return [...text.matchAll(/```[^\n]*\n([\s\S]*?)```/g)].at(-1)?.[1]?.replace(/\n$/, "");
}

function recentTurns(messages: TranscriptMessage[], maxTurns: number): TranscriptMessage[] {
  let userTurns = 0;
  let start = messages.length;
  for (let index = messages.length - 1; index >= 0; index--) {
    const message = messages[index]!;
    if (message.role !== "user" && message.role !== "assistant") continue;
    start = index;
    if (message.role === "user" && ++userTurns >= maxTurns) break;
  }
  return messages.slice(start).filter((message) =>
    message.role === "user" || message.role === "assistant" || message.role === "error",
  );
}

export function formatExitTranscript(
  messages: TranscriptMessage[],
  title = "Aurict session",
  maxTurns = 3,
): string {
  const selected = recentTurns(messages, maxTurns);
  if (selected.length === 0) return "";
  const lines = [`── ${title} · recent transcript ──`];
  for (const message of selected) {
    const content = message.role === "assistant"
      ? assistantTranscriptText(message)
      : message.content.trim();
    if (!content) continue;
    lines.push("", message.role === "user" ? "You" : message.role === "assistant" ? "Aurict" : "Error", content);
  }
  lines.push("", "Use /export md to save the complete transcript.");
  return lines.join("\n");
}
