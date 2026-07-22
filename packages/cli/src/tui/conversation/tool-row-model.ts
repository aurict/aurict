import type { ToolArtifact } from "./tool-artifact.js";
import { toolDisplayIdentity } from "./tool-identity.js";
import {
  displayWidth,
  padDisplayEnd,
  truncateDisplayMiddle,
  truncateDisplayWidth,
} from "../terminal-text/display-width.js";

export interface ToolRowModel {
  layout: "inline" | "stacked";
  action: string;
  subject: string;
  separator: string;
  spacer: string;
  metadata: string;
}

const PREFIX_WIDTH = 2;
const STACKED_MAX_WIDTH = 51;

function argumentSubject(artifact: ToolArtifact): string {
  if (artifact.command) return artifact.command.replace(/\n/g, " ");
  try {
    const parsed = JSON.parse(artifact.args) as Record<string, unknown>;
    for (const key of ["path", "filePath", "file", "query", "pattern", "url", "action"])
      if (typeof parsed[key] === "string") return String(parsed[key]).replace(/\n/g, " ");
  } catch {
    // Plain-text tool input is a valid subject.
  }
  return artifact.args.replace(/\n/g, " ");
}

function compact(value: string, max: number): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  return truncateDisplayWidth(normalized, max);
}

function compactMetadata(value: string, max: number): string {
  return max < 8 ? compact(value, max) : truncateDisplayMiddle(value, max);
}

export function alignToolRow(action: string, subject: string, metadata: string, width: number): ToolRowModel {
  if (width <= STACKED_MAX_WIDTH && subject.trim()) {
    const visibleMetadata = compactMetadata(metadata, Math.max(0, Math.floor(width * 0.3)));
    const metadataWidth = visibleMetadata ? displayWidth(visibleMetadata) + 2 : 0;
    const visibleAction = compact(action, Math.max(4, width - PREFIX_WIDTH - metadataWidth));
    const used = PREFIX_WIDTH + displayWidth(visibleAction) + displayWidth(visibleMetadata);
    return {
      layout: "stacked",
      action: visibleAction,
      subject: compact(subject, Math.max(4, width - 4)),
      separator: "",
      spacer: visibleMetadata ? " ".repeat(Math.max(2, width - used)) : "",
      metadata: visibleMetadata,
    };
  }

  const actionWidth = width >= 100 ? 16 : 11;
  const actionColumn = padDisplayEnd(truncateDisplayWidth(action, actionWidth), actionWidth);
  const separator = subject.trim() ? "  " : "";
  const available = Math.max(8, width - PREFIX_WIDTH - displayWidth(actionColumn) - displayWidth(separator));
  const maxMetadata = Math.max(0, Math.min(displayWidth(metadata), Math.floor(available * 0.5)));
  const visibleMetadata = maxMetadata > 0 ? compactMetadata(metadata, maxMetadata) : "";
  const metadataWidth = visibleMetadata ? displayWidth(visibleMetadata) + 2 : 0;
  const visibleSubject = compact(subject, Math.max(4, available - metadataWidth));
  const used = PREFIX_WIDTH + displayWidth(actionColumn) + displayWidth(separator)
    + displayWidth(visibleSubject) + displayWidth(visibleMetadata);
  const spacer = visibleMetadata ? " ".repeat(Math.max(2, width - used)) : "";
  return {
    layout: "inline",
    action: actionColumn,
    subject: visibleSubject,
    separator,
    spacer,
    metadata: visibleMetadata,
  };
}

export function formatToolDuration(durationMs: number): string {
  if (durationMs < 1_000) return `${durationMs}ms`;
  if (durationMs < 60_000) return `${(durationMs / 1_000).toFixed(1).replace(/\.0$/, "")}s`;
  const minutes = Math.floor(durationMs / 60_000);
  const seconds = Math.round((durationMs % 60_000) / 1_000);
  return `${minutes}m ${seconds}s`;
}

export function toolRowModel(
  tool: string,
  artifact: ToolArtifact,
  width: number,
  durationMs?: number,
): ToolRowModel {
  const identity = toolDisplayIdentity(tool, artifact);
  const rawSubject = identity.operation
    ?? (artifact.files && artifact.files.length > 1
      ? `${artifact.files.length} files`
      : artifact.filePath ?? argumentSubject(artifact));
  const metadata = durationMs !== undefined && durationMs >= 1_000
    ? formatToolDuration(durationMs)
    : "";
  return alignToolRow(
    identity.label,
    rawSubject,
    metadata,
    width,
  );
}
