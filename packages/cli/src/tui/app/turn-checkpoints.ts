/**
 * Turn checkpoints: one per user prompt, taken before the prompt runs.
 *
 * A checkpoint stores the conversation as it was and the length of the
 * session's file-snapshot history at that moment. File tools record a
 * pre-image before every write in the same snapshot scope, so restoring to the
 * mark puts every file the agent changed since then back to its earlier
 * content.
 */
import crypto from "node:crypto";
import { sessionSnapshotScope, snapshotManager } from "@aurict/core";
import type { CoreMessage } from "@aurict/core";
import type { PickerItem } from "../../commands/types.js";
import type { DisplayMessage } from "../conversation/types.js";
import type { Checkpoint } from "./app-state-types.js";

export function createTurnCheckpoint(input: {
  messages: DisplayMessage[];
  history: CoreMessage[];
  workdir: string;
  sessionId: string;
  prompt: string;
}): Checkpoint {
  const scope = sessionSnapshotScope(input.workdir, input.sessionId);
  return {
    id: crypto.randomUUID(),
    mark: snapshotManager.mark(scope),
    scope,
    messages: input.messages.slice(),
    history: input.history.slice(),
    prompt: input.prompt,
    label: checkpointLabel(input.prompt),
    createdAt: Date.now(),
  };
}

export function checkpointLabel(prompt: string): string {
  const line = prompt.replace(/\s+/g, " ").trim();
  return line.length > 60 ? `${line.slice(0, 59)}…` : line || "(empty prompt)";
}

/** Files a restore to this checkpoint would rewrite. */
export function checkpointChangedFiles(checkpoint: Checkpoint): string[] {
  return snapshotManager.changedFilesSince(checkpoint.mark, checkpoint.scope);
}

export function restoreCheckpointFiles(checkpoint: Checkpoint): Promise<string[]> {
  return snapshotManager.restoreToMark(checkpoint.mark, checkpoint.scope);
}

/** The checkpoint taken right before the user message at `messageIndex`, if any. */
export function checkpointForMessage(
  checkpoints: readonly Checkpoint[],
  messages: readonly DisplayMessage[],
  messageIndex: number,
): number {
  const message = messages[messageIndex];
  if (!message || message.role !== "user") return -1;
  return checkpoints.findIndex((checkpoint) =>
    checkpoint.messages.length === messageIndex && checkpoint.prompt === message.content);
}

export type RewindChoice = "files" | "conversation" | "cancel";

export function rewindChoiceItems(files: readonly string[]): PickerItem[] {
  const shown = files.slice(0, 3).map((file) => file.split("/").at(-1)).join(", ");
  const more = files.length > 3 ? ` +${files.length - 3}` : "";
  return [
    { id: "files", label: "Rewind conversation and files", hint: `restore ${files.length} file${files.length === 1 ? "" : "s"}: ${shown}${more}` },
    { id: "conversation", label: "Rewind conversation only", hint: "keep files as they are now" },
    { id: "cancel", label: "Cancel", hint: "change nothing" },
  ];
}

export function checkpointTime(checkpoint: Checkpoint): string {
  return new Date(checkpoint.createdAt).toTimeString().slice(0, 5);
}
