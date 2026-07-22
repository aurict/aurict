import {
  projectStableMessage,
  type TranscriptRow,
} from "./projector.js";
import type { TranscriptMessage } from "./types.js";

type MessageProjector = (
  message: TranscriptMessage,
  index: number,
  width: number,
) => TranscriptRow[];

interface CacheEntry {
  key: string;
  rows: TranscriptRow[];
}

export class TranscriptProjectionCache {
  private readonly messages = new WeakMap<TranscriptMessage, CacheEntry[]>();

  constructor(private readonly projectMessage: MessageProjector = projectStableMessage) {}

  project(messages: TranscriptMessage[], width: number): TranscriptRow[] {
    const output: TranscriptRow[] = [];
    messages.forEach((message, index) => {
      const key = `${width}:${message.id ? "stable" : index}`;
      const entries = this.messages.get(message) ?? [];
      let entry = entries.find((candidate) => candidate.key === key);
      if (!entry) {
        entry = { key, rows: this.projectMessage(message, index, width) };
        this.messages.set(message, [...entries.slice(-2), entry]);
      }
      output.push(...entry.rows);
      if (message.role === "tool_call" && shouldAppendToolGap(messages, index)) {
        output.push({
          id: `${message.id ?? `message-${index}`}:tool-gap`,
          segments: [{ text: "", tone: "muted" }],
        });
      }
    });
    return output;
  }
}

function shouldAppendToolGap(messages: TranscriptMessage[], index: number): boolean {
  const nextVisible = messages.slice(index + 1).find((message) => message.role !== "tool_result");
  return nextVisible?.role !== "tool_call";
}
