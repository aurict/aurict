export type ToolResultArtifactKind = "diff" | "write" | "patch" | "shell" | "error" | "output";

export type ToolVerificationStatus = "passed" | "failed" | "skipped" | "timeout";

export interface ToolResultPresentation {
  status: "success" | "error";
  changedFiles: string[];
  filePaths: string[];
  errors: string[];
  importantLines: string[];
  verification: Array<{ check: string; status: ToolVerificationStatus }>;
}

export interface ToolResultArtifact {
  kind: ToolResultArtifactKind;
  output: string;
  filePath?: string;
  files?: string[];
  rawDiff?: string;
  additions?: number;
  deletions?: number;
  totalLines?: number;
  preview?: string;
  outputLines: number;
  presentation?: ToolResultPresentation;
}

function diffStats(rawDiff: string): { additions: number; deletions: number } {
  let additions = 0;
  let deletions = 0;
  for (const line of rawDiff.split("\n")) {
    if (line.startsWith("+") && !line.startsWith("+++")) additions++;
    if (line.startsWith("-") && !line.startsWith("---")) deletions++;
  }
  return { additions, deletions };
}

function diffFiles(rawDiff: string): string[] {
  const files: string[] = [];
  let oldPath: string | undefined;
  for (const line of rawDiff.split("\n")) {
    if (line.startsWith("--- ")) {
      const candidate = line.slice(4).trim().replace(/^a\//, "");
      oldPath = candidate === "/dev/null" ? undefined : candidate;
      continue;
    }
    if (!line.startsWith("+++ ")) continue;
    const candidate = line.slice(4).trim().replace(/^b\//, "");
    const path = candidate === "/dev/null" ? oldPath : candidate;
    if (path && !files.includes(path)) files.push(path);
  }
  return files;
}

function pathFromOutput(output: string): string | undefined {
  return output.match(/^(?:Updated|Created)\s+(.+?)(?:\s+\(no changes\))?$/m)?.[1]?.trim();
}

function patchSummary(output: string): { files: string[]; additions: number; deletions: number } | undefined {
  const filesLine = output.match(/^Changed files:\s*(.+)$/m)?.[1];
  const stats = output.match(/^Stats:\s*\+(\d+)\s+-(\d+)$/m);
  if (!filesLine || !stats) return undefined;
  return {
    files: filesLine.split(",").map((file) => file.trim()).filter(Boolean),
    additions: Number(stats[1]),
    deletions: Number(stats[2]),
  };
}

function embeddedDiff(output: string): string | undefined {
  const directMarker = "__UNIFIED_DIFF__\n";
  const directIndex = output.indexOf(directMarker);
  if (directIndex >= 0) return output.slice(directIndex + directMarker.length);
  const patchMarker = /Patch content:\n[^\n]*\n/;
  const marker = patchMarker.exec(output);
  if (marker?.index === undefined) return undefined;
  const candidate = output.slice(marker.index + marker[0].length);
  return /^(?:diff --git|---\s)/m.test(candidate) ? candidate : undefined;
}

function directDiff(output: string): string | undefined {
  const plain = output.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, "").replace(/\r/g, "");
  const start = plain.search(/^(?:diff --git\s|---\s)/m);
  return start >= 0 ? plain.slice(start) : undefined;
}

/** Converts provider-facing string output into a stable UI/IPC artifact once. */
export function classifyToolResult(
  tool: string,
  output: string,
  presentation?: ToolResultPresentation,
): ToolResultArtifact {
  const outputLines = output ? output.replace(/\n$/, "").split("\n").length : 0;
  const base = { output, outputLines, ...(presentation ? { presentation } : {}) };
  if (presentation?.status === "error" || /^ERROR:/m.test(output)) return { ...base, kind: "error" };

  const rawDiff = embeddedDiff(output) ?? directDiff(output);
  if (rawDiff) {
    const files = diffFiles(rawDiff);
    return {
      ...base,
      kind: "diff",
      rawDiff,
      ...diffStats(rawDiff),
      ...(files[0] ? { filePath: files[0] } : {}),
      ...(files.length > 0 ? { files } : {}),
    };
  }

  const writeMarker = "__WRITE_CREATE__\n";
  const writeIndex = output.indexOf(writeMarker);
  if (writeIndex >= 0) {
    const lines = output.slice(writeIndex + writeMarker.length).split("\n");
    const totalLines = Number(lines.shift());
    if (Number.isInteger(totalLines) && totalLines >= 0) {
      const filePath = pathFromOutput(output);
      return {
        ...base,
        kind: "write",
        totalLines,
        preview: lines.join("\n"),
        ...(filePath ? { filePath } : {}),
      };
    }
  }

  const patch = patchSummary(output);
  if (patch) return { ...base, kind: "patch", ...patch };
  if (tool === "bash" || tool === "shell") return { ...base, kind: "shell" };
  const filePath = pathFromOutput(output);
  return { ...base, kind: "output", ...(filePath ? { filePath } : {}) };
}
