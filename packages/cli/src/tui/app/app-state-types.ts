import type { CoreMessage, TokenBreakdown } from "@aurict/core";
import type { DisplayMessage } from "../conversation/types.js";
import type { PickerItem } from "../../commands/types.js";

export interface PickerRequest {
  title: string;
  items: PickerItem[];
  onSelect: (item: PickerItem) => void;
}

export interface PromptRequest {
  title: string;
  placeholder: string | undefined;
  secret: boolean | undefined;
  onSubmit: (value: string) => void;
}

export interface WatchedPath {
  path: string;
  prompt?: string;
}

/** State before one user prompt ran; see `turn-checkpoints.ts`. */
export interface Checkpoint {
  id: string;
  /** File-snapshot history length in `scope` when the turn started. */
  mark: number;
  scope: string;
  messages: DisplayMessage[];
  history: CoreMessage[];
  prompt: string;
  label: string;
  createdAt: number;
}

export interface ConversationBranch {
  id: string;
  name: string;
  messages: DisplayMessage[];
  history: CoreMessage[];
  tokens: TokenBreakdown;
  createdAt: number;
}

export const ZERO_TOKENS: TokenBreakdown = {
  input: 0,
  output: 0,
  cacheRead: 0,
  cacheWrite: 0,
  reasoning: 0,
};

export const MAX_CHECKPOINTS = 20;
