import { glyph } from "../terminal-glyphs.js";
import { displayWidth, truncateDisplayWidth } from "../terminal-text/display-width.js";
import { activityClusterModel } from "./activity-cluster.js";
import { projectInlineDiff } from "./inline-diff.js";
import { pushGap, pushWrapped } from "./row-builder.js";
import { parseToolArtifact, type ToolArtifact } from "./tool-artifact.js";
import { toolOutputSummary } from "./tool-output-summary.js";
import { toolRowModel, type ToolRowModel } from "./tool-row-model.js";
import type { TranscriptRow, TranscriptSegment, TranscriptTone } from "./row-model.js";
import type { TranscriptBlock } from "./types.js";

const INLINE_DIFF_TOOLS = new Set(["write", "edit", "apply_patch"]);
const QUIET_RESULT_TOOLS = new Set(["read", "grep", "glob", "websearch", "webfetch"]);

type ToolBlock = Extract<TranscriptBlock, { type: "tool" }>;
type ToolGroupEntry = { block: ToolBlock; sourceIndex: number };

function shouldRenderInlineDiff(tool: string, rawDiff: string | undefined): rawDiff is string {
  return INLINE_DIFF_TOOLS.has(tool) && Boolean(rawDiff);
}

function rowSegments(
  presentation: ToolRowModel,
  prefix: string,
  continuationPrefix: string,
  actionTone: TranscriptTone,
): TranscriptSegment[][] {
  const first: TranscriptSegment[] = [
    { text: prefix, tone: actionTone },
    { text: presentation.action, tone: actionTone, bold: true },
    ...(presentation.separator ? [{ text: presentation.separator, tone: "muted" as const }] : []),
    ...(presentation.layout === "inline" && presentation.subject
      ? [{ text: presentation.subject, tone: "assistant" as const }]
      : []),
    ...(presentation.metadata ? [
      { text: presentation.spacer, tone: "muted" as const },
      { text: presentation.metadata, tone: "muted" as const },
    ] : []),
  ];
  if (presentation.layout === "inline" || !presentation.subject) return [first];
  return [first, [
    { text: continuationPrefix, tone: "muted" },
    { text: presentation.subject, tone: "assistant" },
  ]];
}

function pushToolRow(
  rows: TranscriptRow[],
  id: string,
  presentation: ToolRowModel,
  prefix: string,
  continuationPrefix: string,
  actionTone: TranscriptTone,
  width: number,
  detailId: string,
): void {
  rowSegments(presentation, prefix, continuationPrefix, actionTone).forEach((segments, index) =>
    pushWrapped(rows, `${id}:${index}`, segments, width, detailId));
}

function outcomeTone(artifact: ToolArtifact, summary: string): TranscriptTone {
  // The failed call already owns the red status marker; keep its explanation readable.
  if (artifact.kind === "error" || artifact.presentation?.status === "error") return "assistant";
  if (artifact.presentation?.status === "success"
    && (artifact.presentation.verification.length > 0 || artifact.presentation.changedFiles.length > 0))
    return "success";
  return /\b(?:passed|completed|working tree clean)\b/i.test(summary) ? "success" : "assistant";
}

function outcomeSummary(tool: string, artifact: ToolArtifact): string | undefined {
  if (artifact.kind === "diff") {
    const target = artifact.files && artifact.files.length > 1
      ? `${artifact.files.length} files · ${artifact.files.join(", ")}`
      : artifact.filePath ?? "file";
    return `${target} · +${artifact.additions ?? 0} −${artifact.deletions ?? 0}`;
  }
  if (artifact.kind === "write") return `${artifact.totalLines ?? 0} lines · preview`;
  if (artifact.kind === "patch") return `+${artifact.additions ?? 0} −${artifact.deletions ?? 0}`;
  if (artifact.kind === "error") {
    const firstLine = artifact.output.split("\n").map((line) => line.trim()).find(Boolean);
    return (firstLine || "tool failed").replace(/^ERROR:\s*/i, "");
  }
  if (!artifact.result || QUIET_RESULT_TOOLS.has(tool)) return undefined;
  return toolOutputSummary(artifact);
}

function pushOutcome(
  rows: TranscriptRow[],
  id: string,
  summary: string,
  tone: TranscriptTone,
  width: number,
  detailId: string,
): void {
  const prefix = `  ${glyph("close")} `;
  const hint = width >= 48 ? "details ^O" : width >= 24 ? "^O" : "";
  const reserved = displayWidth(prefix) + (hint ? displayWidth(hint) + 2 : 0);
  const visibleSummary = truncateDisplayWidth(summary, Math.max(4, width - reserved));
  const used = displayWidth(prefix) + displayWidth(visibleSummary) + displayWidth(hint);
  const spacer = hint ? " ".repeat(Math.max(2, width - used)) : "";
  pushWrapped(rows, id, [
    { text: prefix, tone: "muted" },
    { text: visibleSummary, tone, ...(tone === "error" ? { bold: true } : {}) },
    ...(hint ? [
      { text: spacer, tone: "muted" as const },
      { text: hint, tone: "muted" as const },
    ] : []),
  ], width, detailId);
}

export function toolGroupKey(block: ToolBlock): string | undefined {
  if (block.pending) return undefined;
  const artifact = parseToolArtifact(block.tool, block.args, block.resultContent, block.artifact);
  return artifact.kind === "error" ? undefined : "activity";
}

export function toolSectionKind(block: ToolBlock): "tool" | "error" {
  if (block.pending) return "tool";
  const artifact = parseToolArtifact(block.tool, block.args, block.resultContent, block.artifact);
  return artifact.kind === "error" ? "error" : "tool";
}

export function projectToolBlock(
  rows: TranscriptRow[],
  id: string,
  block: ToolBlock,
  width: number,
): void {
  const artifact = parseToolArtifact(block.tool, block.args, block.resultContent, block.artifact);
  const failed = !block.pending && artifact.kind === "error";
  const statusTone = failed ? "error" : block.pending ? "thinking" : "tool";
  const presentation = toolRowModel(block.tool, artifact, width, block.durationMs);
  pushToolRow(
    rows,
    `${id}:summary`,
    presentation,
    `${block.pending ? glyph("working") : failed ? glyph("error") : glyph("tool")} `,
    "    ",
    statusTone,
    width,
    id,
  );
  if (block.pending) return;

  if (artifact.kind === "diff" && shouldRenderInlineDiff(block.tool, artifact.rawDiff)) {
    pushGap(rows, `${id}:result-gap`);
    rows.push(...projectInlineDiff(artifact.rawDiff, `${id}:diff`, id, width));
    return;
  }

  const summary = outcomeSummary(block.tool, artifact);
  if (!summary) return;
  pushGap(rows, `${id}:result-gap`);
  pushOutcome(rows, `${id}:${failed ? "error" : "result"}`, summary, outcomeTone(artifact, summary), width, id);
}

export function projectToolGroup(
  rows: TranscriptRow[],
  messageId: string,
  entries: ToolGroupEntry[],
  width: number,
): void {
  const firstSourceIndex = entries[0]!.sourceIndex;
  const cluster = activityClusterModel(entries.map(({ block, sourceIndex }) => ({
    tool: block.tool,
    artifact: parseToolArtifact(block.tool, block.args, block.resultContent, block.artifact),
    sourceIndex,
    ...(block.durationMs !== undefined ? { durationMs: block.durationMs } : {}),
  })), width);

  pushWrapped(rows, `${messageId}:activity:${firstSourceIndex}:header`, [
    { text: `${glyph("open")} `, tone: "tool" },
    { text: "activity", tone: "tool", bold: true },
  ], width);
  cluster.rows.forEach((presentation) => {
    const detailId = `${messageId}:tool:${presentation.detailSourceIndex}`;
    pushToolRow(
      rows,
      `${messageId}:activity:${firstSourceIndex}:${presentation.key}`,
      presentation,
      `${glyph("quote")} `,
      `${glyph("quote")}   `,
      "tool",
      width,
      detailId,
    );
  });

  const diffs = entries.flatMap(({ block, sourceIndex }) => {
    const artifact = parseToolArtifact(block.tool, block.args, block.resultContent, block.artifact);
    return shouldRenderInlineDiff(block.tool, artifact.rawDiff)
      ? [{ rawDiff: artifact.rawDiff, sourceIndex }]
      : [];
  });
  if (diffs.length > 0) pushGap(rows, `${messageId}:activity:${firstSourceIndex}:diff-gap`);
  diffs.forEach(({ rawDiff, sourceIndex }, index) => {
    if (index > 0) pushGap(rows, `${messageId}:activity:${firstSourceIndex}:diff:${sourceIndex}:gap`);
    rows.push(...projectInlineDiff(
      rawDiff,
      `${messageId}:activity:${firstSourceIndex}:diff:${sourceIndex}`,
      `${messageId}:tool:${sourceIndex}`,
      width,
    ));
  });
  if (diffs.length > 0) pushGap(rows, `${messageId}:activity:${firstSourceIndex}:completed-gap`);

  pushWrapped(rows, `${messageId}:activity:${firstSourceIndex}:completed`, [
    { text: `${glyph("close")} `, tone: "muted" },
    { text: cluster.completed.action, tone: "success", bold: true },
    ...(cluster.completed.metadata ? [
      { text: cluster.completed.spacer, tone: "muted" as const },
      { text: cluster.completed.metadata, tone: "muted" as const },
    ] : []),
  ], width);
}
