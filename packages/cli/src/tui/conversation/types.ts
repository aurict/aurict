import type { ToolResultArtifact } from "@aurict/core";
import type { TranscriptErrorPresentation } from "./error-presentation.js";

export type TranscriptRole =
  | "user"
  | "assistant"
  | "tool_call"
  | "tool_result"
  | "system"
  | "error";

export type TranscriptBlock =
  | {
      type: "text";
      content: string;
      reasoningContent?: string;
    }
  | {
      type: "tool";
      id: string;
      tool: string;
      args: string;
      pending: boolean;
      resultContent?: string;
      durationMs?: number;
      artifact?: ToolResultArtifact;
    };

/** UI-facing transcript event. Provider payloads are normalized before rendering. */
export interface TranscriptMessage {
  id?: string;
  role: TranscriptRole;
  content: string;
  blocks?: TranscriptBlock[];
  tool?: string;
  pending?: boolean;
  resultContent?: string;
  reasoningContent?: string;
  timestamp?: number;
  durationMs?: number;
  artifact?: ToolResultArtifact;
  errorPresentation?: TranscriptErrorPresentation;
  /** Set on the assistant message that closed a turn. */
  turnStats?: TurnStats;
  /** A styled history line such as an approval decision or an interruption. */
  notice?: TranscriptNotice;
}

/** Codex decision/interruption cells: `✔ You approved …`, `■ Conversation interrupted …`. */
export interface TranscriptNotice {
  marker: "check" | "error" | "stop";
  parts: Array<{ text: string; bold?: boolean; dim?: boolean }>;
}

export interface TurnStats {
  durationMs: number;
  tokens: number;
  /** 0 when the model has no known price. */
  costUsd: number;
  /** Epoch ms the turn finished; shown after the elapsed time, as Codex does. */
  completedAt?: number;
}

// Stable aliases for command/runtime code that still uses the earlier names.
export type AssistantContentBlock = TranscriptBlock;
export type DisplayMessage = TranscriptMessage;
