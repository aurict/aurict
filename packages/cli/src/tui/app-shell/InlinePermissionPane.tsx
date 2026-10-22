import React from "react";
import type { PermissionRequest } from "@aurict/core";
import { Box } from "../design-system/renderer.js";
import { PermissionPrompt } from "../PermissionPrompt.js";
import type { PermissionPromptDecision } from "../PermissionPrompt.js";

interface Props {
  request: PermissionRequest;
  onDecide: (decision: PermissionPromptDecision) => void;
  /** Codex shows one request at a time; later ones wait their turn silently. */
  queueLength: number;
}

/** Keeps permission decisions in the conversation flow, directly above the composer. */
export function InlinePermissionPane({ request, onDecide }: Props) {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <PermissionPrompt request={request} onDecide={onDecide} />
    </Box>
  );
}
