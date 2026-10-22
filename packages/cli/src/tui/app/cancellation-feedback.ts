import type { TranscriptNotice } from "../conversation/types.js";

// Codex prints this, dimmed with a "■" marker, whenever a turn is interrupted.
export const TURN_CANCELLED_NOTICE = "Conversation interrupted - tell the model what to do differently";
export const TURN_INTERRUPTED: TranscriptNotice = { marker: "stop", parts: [{ text: TURN_CANCELLED_NOTICE, dim: true }] };
