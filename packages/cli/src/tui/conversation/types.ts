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
}

// Stable aliases for command/runtime code that still uses the earlier names.
export type AssistantContentBlock = TranscriptBlock;
export type DisplayMessage = TranscriptMessage;
