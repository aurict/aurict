import type { TranscriptMessage } from "./types.js";

export interface UnseenSummary {
  count: number;
  label: string;
}

function toolBlocks(messages: TranscriptMessage[]) {
  return messages.flatMap((message) => message.blocks?.filter((block) => block.type === "tool") ?? []);
}

/** Describes unseen work without exposing raw tool output in the viewport chrome. */
export function summarizeUnseenMessages(messages: TranscriptMessage[]): UnseenSummary {
  const count = messages.length;
  if (count === 0) return { count: 0, label: "" };

  const tools = toolBlocks(messages);
  const verifyFailed = tools.some((block) =>
    block.artifact?.presentation?.verification.some((check) =>
      check.status === "failed" || check.status === "timeout"));
  if (verifyFailed) return { count, label: "verify failed" };
  if (messages.some((message) => message.role === "error")
    || tools.some((block) => block.artifact?.kind === "error"))
    return { count, label: "error" };

  const latest = messages[count - 1]!;
  if (latest.role === "assistant") {
    if (latest.blocks?.some((block) => block.type === "text" && block.content.trim()))
      return { count, label: "response" };
    if (latest.blocks?.some((block) => block.type === "tool"))
      return { count, label: "tool result" };
    return { count, label: "response" };
  }
  if (latest.role === "tool_call" || latest.role === "tool_result") return { count, label: "tool result" };
  if (latest.role === "system") return { count, label: "notice" };
  return { count, label: "message" };
}
