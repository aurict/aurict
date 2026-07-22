import type { ToolArtifact } from "./tool-artifact.js";

export interface ToolDisplayIdentity {
  key: string;
  label: string;
  operation?: string;
}

function words(value: string): string {
  return value
    .replace(/^mcp[:_-]?/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function normalizeToolOperation(value: string, familyLabel: string): string {
  let operation = words(value);
  const family = words(familyLabel);
  while (operation === family || operation.startsWith(`${family} `)) {
    operation = operation.slice(family.length).trim();
  }
  return operation;
}

function shellCommand(artifact: ToolArtifact): string {
  if (artifact.command) return artifact.command.trim();
  try {
    const parsed = JSON.parse(artifact.args) as Record<string, unknown>;
    return typeof parsed["command"] === "string" ? parsed["command"].trim() : "";
  } catch {
    return artifact.args.trim();
  }
}

function artifactAction(artifact: ToolArtifact): string | undefined {
  try {
    const parsed = JSON.parse(artifact.args) as Record<string, unknown>;
    return typeof parsed["action"] === "string" ? parsed["action"] : undefined;
  } catch {
    return undefined;
  }
}

function mcpParts(tool: string): { server: string; operation: string } | undefined {
  if (tool.startsWith("mcp:")) {
    const [, server = "mcp", ...operation] = tool.split(":");
    return { server, operation: operation.join(" ") };
  }
  const doubleUnderscore = tool.match(/^mcp__([^_]+)__(.+)$/i);
  if (doubleUnderscore) return { server: doubleUnderscore[1]!, operation: doubleUnderscore[2]! };
  const flattened = tool.match(/^mcp[_-]([a-z0-9]+)[_-](.+)$/i);
  if (flattened) return { server: flattened[1]!, operation: flattened[2]! };
  const repeatedFamily = tool.match(/^([a-z0-9]+)[_-]\1[_-](.+)$/i);
  if (repeatedFamily) return { server: repeatedFamily[1]!, operation: repeatedFamily[2]! };
  return undefined;
}

function mcpIdentity(tool: string): ToolDisplayIdentity | undefined {
  const parts = mcpParts(tool);
  if (!parts) return undefined;
  const rawServer = parts.server;
  const label = words(rawServer) || "mcp";
  const operation = normalizeToolOperation(parts.operation, label);
  return {
    key: label === "git" ? "git" : `mcp:${label}`,
    label,
    ...(operation ? { operation } : {}),
  };
}

function isVerificationCommand(command: string): boolean {
  return /(?:^|\s)(?:test|tests|typecheck|lint|check|build|compile|tsc)(?:\s|$)/i.test(command)
    || /^(?:pytest|jest|vitest)\b/i.test(command);
}

export function toolDisplayIdentity(tool: string, artifact: ToolArtifact): ToolDisplayIdentity {
  const mcp = mcpIdentity(tool);
  if (mcp) return mcp;

  if (tool === "bash" || tool === "shell") {
    const command = shellCommand(artifact);
    if (isVerificationCommand(command)) return { key: "verify", label: "verify" };
    if (/^git\s+/i.test(command)) return { key: "git", label: "git", operation: words(command.split(/\s+/)[1] ?? "") };
    if (/^(?:cat|head|tail|less|more|sed\s+-n)\b/i.test(command)) return { key: "read", label: "read" };
    if (/^(?:rg|grep|find|fd)\b/i.test(command)) return { key: "search", label: "search" };
    return { key: "run", label: "run" };
  }

  if (["read", "file_stat", "ui_inspect", "blast_radius"].includes(tool))
    return { key: "read", label: "read" };
  if (tool === "env_inspect")
    return { key: "environment", label: "env inspect" };
  if (["grep", "glob", "code_map"].includes(tool))
    return { key: "search", label: "search" };
  if (["write", "edit", "apply_patch"].includes(tool))
    return { key: "change", label: "change" };
  if (["websearch", "webfetch", "http_request"].includes(tool))
    return { key: "web", label: "web" };
  if (tool === "git") {
    const operation = normalizeToolOperation(artifactAction(artifact) ?? "", "git");
    return { key: "git", label: "git", ...(operation ? { operation } : {}) };
  }
  if (tool === "git_context" || tool === "worktree")
    return { key: "git", label: "git" };
  if (/test|verify|lint|check/i.test(tool))
    return { key: "verify", label: "verify" };
  if (tool === "subagent" || tool === "orchestrate")
    return { key: "agent", label: "agent" };

  const label = words(tool) || "tool";
  return { key: `tool:${label}`, label };
}
