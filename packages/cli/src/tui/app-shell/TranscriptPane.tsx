import React from "react";
import type { TranscriptMessage } from "../conversation/types.js";
import { ConversationViewport } from "../ConversationViewport.js";
import type { RunActivity } from "../run-status.js";

interface Props {
  visible: boolean;
  height: number;
  width: number;
  messages: TranscriptMessage[];
  loading: boolean;
  streamingText: string | null;
  streamingReason: string | null;
  streamingError: string | null;
  scrollLocked: boolean;
  offsetRowsFromBottom: number;
  unseenCount?: number;
  unseenLabel?: string;
  activeTool?: string;
  activity?: RunActivity;
  onScrollRange: (maximum: number) => void;
  onAnchorShift: (rows: number) => void;
}

export function TranscriptPane({ visible, ...props }: Props) {
  if (!visible) return null;
  return <ConversationViewport {...props} />;
}
