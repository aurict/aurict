import type { CoreMessage } from "@aurict/core";

/** Last turns of the main conversation, as plain text context for background workers. */
export function formatRecentHistory(history: readonly CoreMessage[], limit = 10): string {
  return history
    .slice(-limit)
    .map((message) =>
      `${message.role}: ${typeof message.content === "string" ? message.content : JSON.stringify(message.content)}`,
    )
    .join("\n");
}
