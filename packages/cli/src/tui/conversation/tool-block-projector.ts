import { glyph } from "../terminal-glyphs.js";
import { displayWidth, truncateDisplayMiddle } from "../terminal-text/display-width.js";
import { projectInlineDiff } from "./inline-diff.js";
import { cleanTranscriptText, pushWrapped } from "./row-builder.js";
import { parseToolArtifact, type ToolArtifact } from "./tool-artifact.js";
import { toolDisplayIdentity } from "./tool-identity.js";
import type { TranscriptRow, TranscriptSegment, TranscriptTone } from "./row-model.js";
import type { TranscriptBlock } from "./types.js";

// Codex-style tool cells: "• Ran cmd" with a "  └ " output tree, "• Explored"
// for read/search runs, "• Edited file (+a -b)" followed by the diff.

const INLINE_DIFF_TOOLS = new Set(["write", "edit", "apply_patch"]);
const EXPLORE_KEYS = new Set(["read", "search"]);
const OUTPUT_MAX_LINES = 5;
const COMMAND_MAX_LINES = 2;

type ToolBlock = Extract<TranscriptBlock, { type: "tool" }>;
type ToolGroupEntry = { block: ToolBlock; sourceIndex: number };

const BRANCH = () => `  ${glyph("close")} `;
const STEM = () => `  ${glyph("quote")} `;
const INDENT = "    ";

function artifactOf(block: ToolBlock): ToolArtifact {
  return parseToolArtifact(block.tool, block.args, block.resultContent, block.artifact);
}

function args(artifact: ToolArtifact): Record<string, unknown> {
  try {
    const parsed = JSON.parse(artifact.args) as unknown;
    return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

function argText(artifact: ToolArtifact, keys: string[]): string | undefined {
  const parsed = args(artifact);
  for (const key of keys) if (typeof parsed[key] === "string" && parsed[key]) return String(parsed[key]);
  return undefined;
}

function bulletSegment(state: "pending" | "success" | "error" | "neutral"): TranscriptSegment {
  if (state === "pending") return { text: `${glyph("bullet")} `, tone: "muted", dim: true };
  if (state === "success") return { text: `${glyph("bullet")} `, tone: "success", bold: true };
  if (state === "error") return { text: `${glyph("bullet")} `, tone: "error", bold: true };
  return { text: `${glyph("bullet")} `, tone: "muted", dim: true };
}

/** Keeps the first and last lines and marks how many were hidden, like Codex. */
function truncateMiddle(lines: string[], max: number): { lines: string[]; hidden: number } {
  if (lines.length <= max) return { lines, hidden: 0 };
  const head = Math.ceil((max - 1) / 2);
  const tail = max - 1 - head;
  return { lines: [...lines.slice(0, head), ...lines.slice(lines.length - tail)], hidden: lines.length - head - tail };
}

function pushTree(rows: TranscriptRow[], id: string, lines: Array<{ text: string; tone: TranscriptTone; dim?: boolean }>, width: number, detailId: string): void {
  lines.forEach((line, index) => {
    const prefix = index === 0 ? BRANCH() : INDENT;
    const start = rows.length;
    pushWrapped(rows, `${id}:${index}`, [{ text: line.text, tone: line.tone, ...(line.dim ? { dim: true } : {}) }], Math.max(8, width - displayWidth(prefix)), detailId);
    for (let row = start; row < rows.length; row++)
      rows[row]!.segments.unshift({ text: row === start ? prefix : INDENT, tone: "muted", dim: true });
  });
}

function outputTree(rows: TranscriptRow[], id: string, output: string, failed: boolean, width: number, detailId: string): void {
  const all = cleanTranscriptText(output).replace(/\n+$/, "").split("\n");
  if (all.length === 1 && !all[0]!.trim()) {
    pushTree(rows, id, [{ text: "(no output)", tone: "muted", dim: true }], width, detailId);
    return;
  }
  const { lines, hidden } = truncateMiddle(all, OUTPUT_MAX_LINES);
  const head = Math.ceil((OUTPUT_MAX_LINES - 1) / 2);
  const tree = lines.map((text) => ({ text, tone: (failed ? "error" : "muted") as TranscriptTone, dim: !failed }));
  if (hidden > 0) tree.splice(head, 0, { text: `${glyph("ellipsis")} +${hidden} lines (^O to view details)`, tone: "muted", dim: true });
  pushTree(rows, id, tree, width, detailId);
}

function pushHeader(rows: TranscriptRow[], id: string, segments: TranscriptSegment[], width: number, detailId: string): void {
  const start = rows.length;
  pushWrapped(rows, id, segments, Math.max(8, width), detailId);
  for (let row = start + 1; row < rows.length; row++) rows[row]!.segments.unshift({ text: "  ", tone: "muted" });
}

function execCell(rows: TranscriptRow[], id: string, block: ToolBlock, artifact: ToolArtifact, width: number): void {
  const failed = !block.pending && artifact.kind === "error";
  const command = (artifact.command ?? argText(artifact, ["command"]) ?? artifact.args).trim();
  const [first = "", ...rest] = command.split("\n");
  pushHeader(rows, `${id}:summary`, [
    bulletSegment(block.pending ? "pending" : failed ? "error" : "success"),
    { text: block.pending ? "Running " : "Ran ", tone: "assistant", bold: true },
    { text: first, tone: "code" },
  ], width, id);
  if (rest.length > 0) {
    const shown = rest.slice(0, COMMAND_MAX_LINES);
    shown.forEach((line, index) => rows.push({ id: `${id}:command:${index}`, segments: [{ text: STEM(), tone: "muted", dim: true }, { text: line, tone: "code" }], detailId: id }));
    if (rest.length > shown.length) rows.push({ id: `${id}:command:more`, segments: [{ text: STEM(), tone: "muted", dim: true }, { text: `${glyph("ellipsis")} +${rest.length - shown.length} lines`, tone: "muted", dim: true }], detailId: id });
  }
  if (block.pending) return;
  outputTree(rows, `${id}:output`, artifact.output, failed, width, id);
}

function changeCell(rows: TranscriptRow[], id: string, block: ToolBlock, artifact: ToolArtifact, width: number): void {
  const failed = artifact.kind === "error";
  const files = artifact.files && artifact.files.length > 1 ? artifact.files : undefined;
  const target = files ? `${files.length} files` : artifact.filePath ?? argText(artifact, ["path", "filePath", "file"]) ?? "file";
  // A diff from /dev/null is a new file too.
  const added = artifact.kind === "write" || (!files && /^--- \/dev\/null$/m.test(artifact.rawDiff ?? ""));
  const additions = artifact.additions ?? (artifact.kind === "write" ? artifact.totalLines : undefined);
  const hasStats = additions !== undefined || artifact.deletions !== undefined;
  const verb = block.pending ? "Editing" : failed ? "Edit failed" : added ? "Added" : "Edited";
  pushHeader(rows, `${id}:summary`, [
    bulletSegment(block.pending ? "pending" : failed ? "error" : "neutral"),
    { text: `${verb} `, tone: "assistant", bold: true },
    { text: target, tone: "assistant" },
    ...(!block.pending && !failed && hasStats ? [
      { text: " (", tone: "muted" as const },
      { text: `+${additions ?? 0}`, tone: "diff-add" as const },
      { text: " ", tone: "muted" as const },
      { text: `-${artifact.deletions ?? 0}`, tone: "diff-remove" as const },
      { text: ")", tone: "muted" as const },
    ] : []),
  ], width, id);
  if (block.pending) return;
  if (failed) { outputTree(rows, `${id}:error`, artifact.output, true, width, id); return; }
  if (INLINE_DIFF_TOOLS.has(block.tool) && artifact.rawDiff) rows.push(...projectInlineDiff(artifact.rawDiff, `${id}:diff`, id, width, Boolean(files)));
}

function callCell(rows: TranscriptRow[], id: string, block: ToolBlock, artifact: ToolArtifact, width: number): void {
  const failed = !block.pending && artifact.kind === "error";
  const identity = toolDisplayIdentity(block.tool, artifact);
  const web = identity.key === "web";
  const subject = web
    ? argText(artifact, ["query", "url"]) ?? ""
    : truncateDisplayMiddle(artifact.args.replace(/\s+/g, " ").trim(), Math.max(16, width - 24));
  // MCP tools read as server.tool (git MCP tools share the "git" identity key).
  const name = /^mcp[:_]/i.test(block.tool) && identity.operation ? `${identity.label}.${identity.operation.replace(/\s+/g, "_")}` : block.tool;
  const header: TranscriptSegment[] = web
    ? [{ text: block.tool === "webfetch" ? (block.pending ? "Fetching " : "Fetched ") : (block.pending ? "Searching the web for " : "Searched the web for "), tone: "assistant", bold: true }, { text: subject, tone: "assistant" }]
    : [{ text: block.pending ? "Calling " : "Called ", tone: "assistant", bold: true }, { text: name, tone: "code" }, { text: `(${subject})`, tone: "muted", dim: true }];
  pushHeader(rows, `${id}:summary`, [bulletSegment(block.pending ? "pending" : failed ? "error" : web ? "neutral" : "success"), ...header], width, id);
  if (block.pending || (web && !failed)) return;
  if (failed || artifact.output.trim()) outputTree(rows, `${id}:output`, artifact.output, failed, width, id);
}

const AGENT_TOOLS = new Set(["subagent", "task", "orchestrate"]);
const AGENT_PROMPT_LIMIT = 160;
const AGENT_PREVIEW_LIMIT = 240;

function clip(text: string, limit: number): string {
  const graphemes = [...text.replace(/\s+/g, " ").trim()];
  return graphemes.length > limit ? `${graphemes.slice(0, limit - 1).join("")}${glyph("ellipsis")}` : graphemes.join("");
}

function capitalize(value: string): string {
  return value ? value[0]!.toUpperCase() + value.slice(1) : value;
}

/**
 * Codex collab cells. A subagent call spawns and waits in one step, so it
 * renders as "• Spawned Label [type]" and then "• Waiting for …" or, once it
 * returns, "• Finished waiting" with the agent's status and preview.
 */
function agentCell(rows: TranscriptRow[], id: string, block: ToolBlock, artifact: ToolArtifact, width: number): void {
  const parsed = args(artifact);
  const type = String(parsed["type"] ?? parsed["agentType"] ?? (block.tool === "orchestrate" ? "orchestrator" : "agent"));
  const name = String(parsed["role"] ?? parsed["description"] ?? "") || capitalize(type);
  const prompt = String(parsed["prompt"] ?? parsed["objective"] ?? parsed["description"] ?? "");
  const label: TranscriptSegment[] = [{ text: clip(name, 40), tone: "code", bold: true }, { text: ` [${type}]`, tone: "assistant" }];
  const plan = Array.isArray(parsed["plan"]) ? (parsed["plan"] as Array<Record<string, unknown>>) : [];
  const gap = (suffix: string) => rows.push({ id: `${id}:${suffix}`, segments: [{ text: "", tone: "muted" }] });
  const tree = (key: string, lines: TranscriptSegment[][]) => lines.forEach((segments, index) => {
    const prefix = index === 0 ? BRANCH() : INDENT;
    const start = rows.length;
    pushWrapped(rows, `${id}:${key}:${index}`, segments, Math.max(8, width - displayWidth(prefix)), id);
    for (let row = start; row < rows.length; row++) rows[row]!.segments.unshift({ text: row === start ? prefix : INDENT, tone: "muted", dim: true });
  });

  if (block.tool === "orchestrate") {
    const count = Math.max(1, plan.length);
    pushHeader(rows, `${id}:spawn`, [bulletSegment("neutral"), { text: block.pending ? `Waiting for ${count} agent${count === 1 ? "" : "s"}` : "Finished waiting", tone: "assistant", bold: true }], width, id);
    const members = plan.length > 0
      ? plan.map((node) => [{ text: String(node["id"] ?? "agent"), tone: "code" as const, bold: true }, { text: ` [${String(node["agentType"] ?? "agent")}]`, tone: "assistant" as const }])
      : [[{ text: clip(prompt, AGENT_PROMPT_LIMIT), tone: "assistant" as const }]];
    if (block.pending) { tree("members", members); return; }
    const failed = artifact.kind === "error";
    tree("result", [[...members[0]!, { text: ": ", tone: "muted" }, ...statusSegments(failed, artifact)]]);
    return;
  }

  pushHeader(rows, `${id}:spawn`, [bulletSegment("neutral"), { text: "Spawned ", tone: "assistant", bold: true }, ...label, ...(parsed["model"] ? [{ text: ` (${String(parsed["model"])})`, tone: "thinking" as const }] : [])], width, id);
  if (prompt) tree("prompt", [[{ text: clip(prompt, AGENT_PROMPT_LIMIT), tone: "assistant" }]]);
  gap("wait-gap");
  if (block.pending) {
    pushHeader(rows, `${id}:wait`, [bulletSegment("neutral"), { text: "Waiting for ", tone: "assistant", bold: true }, ...label], width, id);
    return;
  }
  pushHeader(rows, `${id}:wait`, [bulletSegment("neutral"), { text: "Finished waiting", tone: "assistant", bold: true }], width, id);
  tree("result", [[...label, { text: ": ", tone: "muted" }, ...statusSegments(artifact.kind === "error", artifact)]]);
}

function statusSegments(failed: boolean, artifact: ToolArtifact): TranscriptSegment[] {
  const output = cleanTranscriptText(artifact.output).replace(/<\/?subagent-result[^>]*>/g, "");
  const preview = clip(output.split("\n").map((line) => line.trim()).find(Boolean) ?? "", AGENT_PREVIEW_LIMIT);
  if (failed) return [{ text: "Error", tone: "error" }, ...(preview ? [{ text: ` - ${preview.replace(/^ERROR:\s*/i, "")}`, tone: "muted" as const, dim: true }] : [])];
  return [{ text: "Completed", tone: "success" }, ...(preview ? [{ text: " - ", tone: "muted" as const, dim: true }, { text: preview, tone: "assistant" as const }] : [])];
}

/** `todo` results become Codex's "Updated Plan" checklist. */
function planCell(rows: TranscriptRow[], id: string, block: ToolBlock, artifact: ToolArtifact, width: number): boolean {
  const output = cleanTranscriptText(artifact.output);
  const listed = [...output.matchAll(/^\[([ xX])\]\s+\S+\s+(.+)$/gm)].map((match) => ({ done: match[1] !== " ", text: match[2]!.trim() }));
  const single = /^(Added|Done):\s*(?:\[\w+\]\s*)?(.+)$/m.exec(output);
  const items = listed.length > 0 ? listed : single ? [{ done: single[1] === "Done", text: single[2]!.trim() }] : [];
  if (items.length === 0) return false;
  pushHeader(rows, `${id}:summary`, [bulletSegment("neutral"), { text: "Updated Plan", tone: "assistant", bold: true }], width, id);
  items.forEach((item, index) => {
    const prefix = index === 0 ? BRANCH() : INDENT;
    const start = rows.length;
    pushWrapped(rows, `${id}:item:${index}`, [
      { text: `${item.done ? glyph("check") : glyph("box")} `, tone: item.done ? "success" : "muted", ...(item.done ? {} : { dim: true }) },
      { text: item.text, tone: "assistant", ...(item.done ? { strikethrough: true, dim: true } : {}) },
    ], Math.max(8, width - displayWidth(prefix)), id);
    for (let row = start; row < rows.length; row++)
      rows[row]!.segments.unshift({ text: row === start ? prefix : INDENT, tone: "muted", dim: true });
  });
  return true;
}

function exploreLine(block: ToolBlock, artifact: ToolArtifact): TranscriptSegment[] {
  const identity = toolDisplayIdentity(block.tool, artifact);
  const command = artifact.command ?? argText(artifact, ["command"]);
  if (identity.key === "read") {
    const path = artifact.filePath ?? argText(artifact, ["path", "filePath", "file"]) ?? command ?? (artifact.args.trim() || "file");
    return [{ text: "Read ", tone: "code" }, { text: path.split("/").pop() || path, tone: "assistant" }];
  }
  const query = argText(artifact, ["pattern", "query"]) ?? command ?? "";
  const scope = argText(artifact, ["path", "cwd", "directory"]);
  const title = block.tool === "glob" ? "List " : "Search ";
  return [{ text: title, tone: "code" }, { text: query, tone: "assistant" }, ...(scope ? [{ text: " in ", tone: "muted" as const, dim: true }, { text: scope, tone: "assistant" as const }] : [])];
}

export function toolGroupKey(block: ToolBlock): string | undefined {
  if (block.pending) return undefined;
  const artifact = artifactOf(block);
  if (artifact.kind === "error") return undefined;
  return EXPLORE_KEYS.has(toolDisplayIdentity(block.tool, artifact).key) ? "explore" : undefined;
}

export function projectToolBlock(rows: TranscriptRow[], id: string, block: ToolBlock, width: number): void {
  const artifact = artifactOf(block);
  const identity = toolDisplayIdentity(block.tool, artifact);
  // Reads and searches — including `cat`/`rg` run through bash — are "Explored", as in Codex.
  if (INLINE_DIFF_TOOLS.has(block.tool)) changeCell(rows, id, block, artifact, width);
  else if (AGENT_TOOLS.has(block.tool)) agentCell(rows, id, block, artifact, width);
  else if (block.tool === "todo" && !block.pending && artifact.kind !== "error" && planCell(rows, id, block, artifact, width)) return;
  else if (EXPLORE_KEYS.has(identity.key) && artifact.kind !== "error") projectToolGroup(rows, id, [{ block, sourceIndex: 0 }], width, id);
  else if (block.tool === "bash" || block.tool === "shell") execCell(rows, id, block, artifact, width);
  else callCell(rows, id, block, artifact, width);
}

/** Consecutive reads and searches become one "Explored" cell. */
export function projectToolGroup(rows: TranscriptRow[], messageId: string, entries: ToolGroupEntry[], width: number, cellId?: string): void {
  const id = cellId ?? `${messageId}:explore:${entries[0]!.sourceIndex}`;
  const active = entries.some(({ block }) => block.pending);
  pushHeader(rows, `${id}:header`, [bulletSegment(active ? "pending" : "neutral"), { text: active ? "Exploring" : "Explored", tone: "assistant", bold: true }], width, `${messageId}:tool:${entries[0]!.sourceIndex}`);
  // Consecutive reads collapse into one "Read a, b, c" line.
  const lines: Array<{ segments: TranscriptSegment[]; detailId: string }> = [];
  for (const { block, sourceIndex } of entries) {
    const segments = exploreLine(block, artifactOf(block));
    const detailId = `${messageId}:tool:${sourceIndex}`;
    const previous = lines[lines.length - 1];
    if (previous && previous.segments[0]?.text === "Read " && segments[0]?.text === "Read ") {
      previous.segments.push({ text: ", ", tone: "muted", dim: true }, segments[1]!);
      continue;
    }
    lines.push({ segments, detailId });
  }
  lines.forEach((line, index) => {
    const prefix = index === 0 ? BRANCH() : INDENT;
    const start = rows.length;
    pushWrapped(rows, `${id}:row:${index}`, line.segments, Math.max(8, width - displayWidth(prefix)), line.detailId);
    for (let row = start; row < rows.length; row++)
      rows[row]!.segments.unshift({ text: row === start ? prefix : INDENT, tone: "muted", dim: true });
  });
}
