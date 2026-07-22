import type { ToolArtifact } from "./tool-artifact.js";
import { toolDisplayIdentity } from "./tool-identity.js";

function structuredSummary(artifact: ToolArtifact): string | undefined {
  const presentation = artifact.presentation;
  if (!presentation) return undefined;
  const failed = presentation.verification.filter((item) => item.status === "failed" || item.status === "timeout");
  const passed = presentation.verification.filter((item) => item.status === "passed");
  const skipped = presentation.verification.filter((item) => item.status === "skipped");
  if (failed.length > 0) return failed.length === 1
    ? `${failed[0]!.check} ${failed[0]!.status}`
    : `${failed.length} checks failed`;
  if (presentation.status === "error" && presentation.errors[0]) return presentation.errors[0]!.slice(0, 120);
  if (passed.length > 0) return passed.length === 1
    ? `${passed[0]!.check} passed`
    : `${passed.length} checks passed`;
  if (skipped.length > 0) return skipped.length === 1
    ? `${skipped[0]!.check} skipped`
    : `${skipped.length} checks skipped`;
  if (presentation.changedFiles.length > 0) {
    const count = presentation.changedFiles.length;
    return `${count} file${count === 1 ? "" : "s"} changed`;
  }
  if (presentation.filePaths.length > 0) {
    const count = presentation.filePaths.length;
    return `${count} file${count === 1 ? "" : "s"} inspected`;
  }
  if (presentation.importantLines.length === 1)
    return presentation.importantLines[0]!.slice(0, 120);
  if (presentation.importantLines.length > 1)
    return `${presentation.importantLines.length} notable results`;
  return undefined;
}

function linesOf(output: string): string[] {
  return output
    .replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, "")
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function countMatches(lines: string[], pattern: RegExp): number {
  return lines.filter((line) => pattern.test(line)).length;
}

function matchedFileCount(lines: string[]): number {
  const files = new Set<string>();
  for (const line of lines) {
    const match = line.match(/^(.+?):\d+(?::\d+)?:/);
    if (match?.[1]) files.add(match[1]);
  }
  return files.size;
}

function testSummary(lines: string[]): string | undefined {
  const joined = lines.join("\n");
  const passed = [...joined.matchAll(/(?:^|\s)(\d+)\s+(?:tests?\s+)?pass(?:ed)?\b/gim)].at(-1)?.[1];
  const failed = [...joined.matchAll(/(?:^|\s)(\d+)\s+(?:tests?\s+)?fail(?:ed)?\b/gim)].at(-1)?.[1];
  if (passed || failed) return `${passed ?? "0"} passed · ${failed ?? "0"} failed`;

  const passingLines = countMatches(lines, /\bpass(?:ed)?\b/i);
  const failingLines = countMatches(lines, /\bfail(?:ed)?\b/i);
  if (passingLines || failingLines)
    return `${passingLines} passed · ${failingLines} failed`;
  return undefined;
}

function gitStatusSummary(lines: string[]): string {
  if (lines.some((line) => /working tree clean/i.test(line))) return "working tree clean";
  const untracked = lines.filter((line) => /^\?\?\s/.test(line)).length;
  const changed = lines.filter((line) => /^(?:[ MADRCU!]{2}|[MADRCU!]\s)/.test(line)).length;
  if (changed > 0 || untracked > 0)
    return [changed > 0 ? `${changed} changed` : "", untracked > 0 ? `${untracked} untracked` : ""]
      .filter(Boolean).join(" · ");
  return `${lines.length} status lines`;
}

function gitAction(artifact: ToolArtifact): string | undefined {
  const identity = toolDisplayIdentity(artifact.tool, artifact);
  return identity.key === "git" ? identity.operation : undefined;
}

function backgroundSummary(lines: string[]): string | undefined {
  const sessionId = lines.find((line) => /^Session ID:/i.test(line))?.replace(/^Session ID:\s*/i, "");
  if (sessionId) return `background started · session ${sessionId}`;
  const status = lines.find((line) => /^Status:/i.test(line))?.replace(/^Status:\s*/i, "");
  if (status) return `${status} · ${Math.max(0, lines.length - 2)} output lines`;
  return undefined;
}

function environmentSummary(artifact: ToolArtifact, lines: string[]): string | undefined {
  if (artifact.tool !== "env_inspect") return undefined;
  const sections = lines.filter((line) => /^##\s+/.test(line)).length;
  return sections > 0
    ? `${sections} section${sections === 1 ? "" : "s"} inspected`
    : `${lines.length} environment lines`;
}

/** Produces one quiet transcript row; the complete result remains available in tool details. */
export function toolOutputSummary(artifact: ToolArtifact): string | undefined {
  const structured = structuredSummary(artifact);
  if (structured) return structured;
  const lines = linesOf(artifact.result ?? artifact.output);
  if (lines.length === 0 || (lines.length === 1 && lines[0] === "(no output)")) return undefined;

  const background = backgroundSummary(lines);
  if (background) return background;

  const environment = environmentSummary(artifact, lines);
  if (environment) return environment;

  const command = artifact.command?.trim() ?? "";
  const semanticGitAction = gitAction(artifact);
  if (semanticGitAction === "status") return gitStatusSummary(lines);
  if (semanticGitAction === "log") return `${lines.length} commits`;
  if (/^git\s+status\b/.test(command)) return gitStatusSummary(lines);
  if (/^git\s+(?:diff|show)\b/.test(command)) {
    const stats = [...lines].reverse().find((line) => /\bfiles? changed\b/.test(line));
    return stats ?? `${lines.length} diff lines`;
  }
  if (/^git\s+log\b/.test(command)) return `${lines.length} commits`;

  const tests = /(?:^|\s)(?:bun|npm|pnpm|yarn|pytest|jest|vitest|cargo|go)\b.*\btest\b|\btest\b/i.test(command)
    ? testSummary(lines)
    : undefined;
  if (tests) return tests;

  if (/\b(?:build|compile|typecheck|tsc)\b/i.test(command)
    && lines.some((line) => /success|finished|built|compiled|done/i.test(line)))
    return `completed · ${lines.length} lines`;

  if (/^(?:rg|grep|find)\b/.test(command)) {
    const files = matchedFileCount(lines);
    return `${lines.length} matches${files > 0 ? ` · ${files} files` : ""}`;
  }
  if (/^(?:ls|fd)\b/.test(command)) return `${lines.length} entries`;
  if (lines.length === 1) return lines[0]!.slice(0, 120);
  return `${lines.length} lines`;
}
