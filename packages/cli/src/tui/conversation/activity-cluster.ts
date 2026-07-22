import type { ToolArtifact } from "./tool-artifact.js";
import { normalizeToolOperation, toolDisplayIdentity } from "./tool-identity.js";
import { toolOutputSummary } from "./tool-output-summary.js";
import { alignToolRow, formatToolDuration, type ToolRowModel } from "./tool-row-model.js";
import { displayWidth } from "../terminal-text/display-width.js";

export interface ActivityClusterEntry {
  tool: string;
  artifact: ToolArtifact;
  sourceIndex: number;
  durationMs?: number;
}

export interface ActivityClusterRow extends ToolRowModel {
  key: string;
  detailSourceIndex: number;
}

export interface ActivityClusterModel {
  rows: ActivityClusterRow[];
  completed: ToolRowModel;
}

function artifactPaths(artifacts: ToolArtifact[]): string[] {
  return [...new Set(artifacts.flatMap((artifact) => artifact.files ?? (artifact.filePath ? [artifact.filePath] : [])))];
}

function parsedAction(artifact: ToolArtifact): string | undefined {
  try {
    const args = JSON.parse(artifact.args) as Record<string, unknown>;
    return typeof args["action"] === "string" ? args["action"].replace(/[_-]+/g, " ") : undefined;
  } catch {
    return undefined;
  }
}

function entryOperation(entry: ActivityClusterEntry): string | undefined {
  const identity = toolDisplayIdentity(entry.tool, entry.artifact);
  const raw = identity.operation ?? parsedAction(entry.artifact);
  if (!raw) return undefined;
  const normalized = normalizeToolOperation(raw, identity.label);
  return normalized || undefined;
}

function resultSummary(artifact: ToolArtifact): string | undefined {
  if (artifact.kind === "diff") return `+${artifact.additions ?? 0} −${artifact.deletions ?? 0}`;
  return toolOutputSummary(artifact);
}

function verificationSummary(artifacts: ToolArtifact[]): string {
  const structured = artifacts.flatMap((artifact) => artifact.presentation?.verification ?? []);
  if (structured.length > 0) {
    const failed = structured.filter((item) => item.status === "failed" || item.status === "timeout");
    const passed = structured.filter((item) => item.status === "passed");
    if (failed.length === 1) return `${failed[0]!.check} ${failed[0]!.status}`;
    if (failed.length > 1) return `${failed.length} checks failed`;
    if (passed.length === 1) return `${passed[0]!.check} passed`;
    if (passed.length > 1) return `${passed.length} checks passed`;
    return `${structured.length} checks skipped`;
  }
  let passed = 0;
  let failed = 0;
  let foundTests = false;
  for (const artifact of artifacts) {
    const summary = resultSummary(artifact) ?? "";
    const passMatch = summary.match(/(\d+) passed/i);
    const failMatch = summary.match(/(\d+) failed/i);
    if (passMatch || failMatch) foundTests = true;
    passed += Number(passMatch?.[1] ?? 0);
    failed += Number(failMatch?.[1] ?? 0);
  }
  if (foundTests) return `${passed} passed${failed > 0 ? ` · ${failed} failed` : ""}`;
  return artifacts.length === 1 ? "completed" : `${artifacts.length} checks`;
}

function searchSummary(artifacts: ToolArtifact[]): string {
  const files = new Set<string>();
  const matches = artifacts.reduce((sum, artifact) => {
    for (const path of artifact.files ?? (artifact.filePath ? [artifact.filePath] : [])) files.add(path);
    const output = (artifact.result ?? artifact.output).trim();
    if (!output || /^(?:no matches|\(no output\))\.?$/i.test(output)) return sum;
    const resultLines = output.split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !/^\.\.\. \((?:truncated|timed out)/i.test(line));
    for (const line of resultLines) {
      const match = line.match(/^(.+?):\d+(?::\d+)?:/);
      if (match?.[1]) files.add(match[1]);
    }
    return sum + resultLines.length;
  }, 0);
  const count = matches === 1 ? "1 match" : `${matches} matches`;
  return `${count}${files.size > 0 ? ` · ${files.size} file${files.size === 1 ? "" : "s"}` : ""}`;
}

function familySummary(key: string, entries: ActivityClusterEntry[]): string {
  const artifacts = entries.map((entry) => entry.artifact);
  if (key === "read") {
    const count = artifactPaths(artifacts).length || artifacts.length;
    return `${count} file${count === 1 ? "" : "s"}`;
  }
  if (key === "search") return searchSummary(artifacts);
  if (key === "change") {
    const count = artifactPaths(artifacts).length || artifacts.length;
    const additions = artifacts.reduce((sum, artifact) => sum + (artifact.additions ?? 0), 0);
    const deletions = artifacts.reduce((sum, artifact) => sum + (artifact.deletions ?? 0), 0);
    const stats = additions > 0 || deletions > 0 ? ` · +${additions} −${deletions}` : "";
    return `${count} file${count === 1 ? "" : "s"}${stats}`;
  }
  if (key === "verify") return verificationSummary(artifacts);
  if (key === "git") {
    const operations = [...new Set(entries
      .map(entryOperation)
      .filter((value): value is string => Boolean(value)))];
    const outcome = [...artifacts].reverse().map(resultSummary).find(Boolean);
    return [operations.join(", "), outcome].filter(Boolean).join(" · ") || `${entries.length} operations`;
  }
  if (key === "run") return `${entries.length} command${entries.length === 1 ? "" : "s"}`;
  if (key === "environment") {
    const outcome = [...artifacts].reverse().map(resultSummary).find(Boolean);
    return outcome ?? `${entries.length} inspection${entries.length === 1 ? "" : "s"}`;
  }
  if (key === "web") return `${entries.length} source${entries.length === 1 ? "" : "s"}`;
  if (key === "agent") return `${entries.length} agent${entries.length === 1 ? "" : "s"}`;

  const operations = [...new Set(entries
    .map(entryOperation)
    .filter((value): value is string => Boolean(value)))];
  return operations.length > 0 ? operations.join(", ") : `${entries.length} call${entries.length === 1 ? "" : "s"}`;
}

function completedRow(totalDuration: number, width: number): ToolRowModel {
  const action = "completed";
  const metadata = totalDuration > 0 ? formatToolDuration(totalDuration) : "";
  const used = 2 + displayWidth(action) + displayWidth(metadata);
  return {
    layout: "inline",
    action,
    subject: "",
    separator: "",
    spacer: metadata ? " ".repeat(Math.max(2, width - used)) : "",
    metadata,
  };
}

export function activityClusterModel(entries: ActivityClusterEntry[], width: number): ActivityClusterModel {
  const families = new Map<string, { label: string; entries: ActivityClusterEntry[] }>();
  for (const entry of entries) {
    const identity = toolDisplayIdentity(entry.tool, entry.artifact);
    const family = families.get(identity.key) ?? { label: identity.label, entries: [] };
    family.entries.push(entry);
    families.set(identity.key, family);
  }

  const rows = [...families.entries()].map(([key, family]) => ({
    key,
    detailSourceIndex: family.entries[0]!.sourceIndex,
    ...alignToolRow(family.label, familySummary(key, family.entries), "", width),
  }));
  const totalDuration = entries.reduce((sum, entry) => sum + (entry.durationMs ?? 0), 0);
  return { rows, completed: completedRow(totalDuration, width) };
}
