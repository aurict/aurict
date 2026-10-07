/**
 * Inline-mode commit model.
 *
 * In inline mode finished transcript rows are written once into the
 * terminal's native scrollback and can never be redrawn. This module decides
 * which leading rows of the stable projection are final:
 *
 * - every message before the first pending message is final;
 * - inside the first pending assistant message, completed blocks before the
 *   last safe section boundary are final, but only the rows that a
 *   projection of those blocks alone reproduces exactly. Anything a later
 *   block could still regroup, coalesce, or re-space stays live.
 *
 * `planInlineCommit` compares that result with what was already written.
 * Committed rows that are no longer a prefix of the projection (history
 * rewrite, /clear, width change) require a full reprint.
 */
import { projectStableMessage, type TranscriptRow } from "./projector.js";
import { toolGroupKey } from "./tool-block-projector.js";
import type { TranscriptBlock, TranscriptMessage } from "./types.js";

type MessageProjector = (message: TranscriptMessage, index: number, width: number) => TranscriptRow[];

export type InlineCommitPlan =
  | { kind: "none" }
  | { kind: "append"; rows: TranscriptRow[] }
  | { kind: "reset"; rows: TranscriptRow[] };

const signatures = new WeakMap<TranscriptRow, string>();

function rowSignature(row: TranscriptRow): string {
  let signature = signatures.get(row);
  if (signature === undefined) {
    signature = JSON.stringify([row.id, row.surface, row.detailId, row.segments]);
    signatures.set(row, signature);
  }
  return signature;
}

export function sameTranscriptRow(left: TranscriptRow, right: TranscriptRow | undefined): boolean {
  return right !== undefined && (left === right || rowSignature(left) === rowSignature(right));
}

function canShareGroup(previous: TranscriptBlock, current: TranscriptBlock): boolean {
  if (previous.type !== "tool" || current.type !== "tool") return false;
  const previousKey = toolGroupKey(previous);
  if (previousKey === undefined) return false;
  // A pending call has no key yet; once it succeeds it may join the group.
  return current.pending || toolGroupKey(current) === previousKey;
}

/** Index of the last block boundary that no future block can move. */
export function settledBlockBoundary(blocks: readonly TranscriptBlock[]): number {
  let boundary = 0;
  for (let index = 1; index < blocks.length; index++) {
    const previous = blocks[index - 1]!;
    if (previous.type === "tool" && previous.pending) break;
    if (!canShareGroup(previous, blocks[index]!)) boundary = index;
  }
  return boundary;
}

function settledRowsOfOpenMessage(
  message: TranscriptMessage,
  index: number,
  rows: readonly TranscriptRow[],
  width: number,
  projectMessage: MessageProjector,
): number {
  if (message.role !== "assistant" || !message.blocks?.length) return 0;
  const boundary = settledBlockBoundary(message.blocks);
  if (boundary === 0) return 0;
  const settled = projectMessage({ ...message, blocks: message.blocks.slice(0, boundary) }, index, width);
  // The truncated projection ends with the message's closing gap, which the
  // full message only emits after its real last block.
  const limit = Math.min(rows.length, settled.length - 1);
  let common = 0;
  while (common < limit && sameTranscriptRow(settled[common]!, rows[common])) common++;
  return common;
}

/** Number of leading stable rows that can be written to scrollback. */
export function settledRowCount(
  messages: readonly TranscriptMessage[],
  rowsByMessage: readonly (readonly TranscriptRow[])[],
  width: number,
  projectMessage: MessageProjector = projectStableMessage,
): number {
  const open = messages.findIndex((message) => message.pending);
  const end = open === -1 ? messages.length : open;
  let count = 0;
  for (let index = 0; index < end; index++) count += rowsByMessage[index]?.length ?? 0;
  if (open === -1) return count;
  // A legacy tool call's trailing gap depends on the message after it.
  if (end > 0 && messages[end - 1]!.role === "tool_call") return count - (rowsByMessage[end - 1]?.length ?? 0);
  return count + settledRowsOfOpenMessage(messages[open]!, open, rowsByMessage[open] ?? [], width, projectMessage);
}

export function planInlineCommit(
  committed: readonly TranscriptRow[],
  stable: readonly TranscriptRow[],
  settled: number,
): InlineCommitPlan {
  for (let index = 0; index < committed.length; index++) {
    if (!sameTranscriptRow(committed[index]!, stable[index])) {
      return { kind: "reset", rows: stable.slice(0, settled) };
    }
  }
  if (settled > committed.length) return { kind: "append", rows: stable.slice(committed.length, settled) };
  return { kind: "none" };
}
