import type { AgentToolResultEvent } from "../agent/types.js"
import type { ExecuteResult, ToolDef } from "../tool/types.js"
import type { ToolEffect, ToolOutcome } from "./contracts.js"

export function toolOutcomeFromExecuteResult(
  tool: ToolDef,
  result: ExecuteResult,
  durationMs: number,
): ToolOutcome {
  const output = result.output ?? ""
  return {
    status: result.error ? "failed" : "succeeded",
    summary: result.error ?? firstLine(output) ?? `${tool.id} completed`,
    display: output,
    modelContent: result.error ? `ERROR: ${result.error}\n${output}` : output,
    effects: effectsFor(tool, result),
    artifacts: [],
    verification: verificationFrom(result),
    retry: {
      safety: retrySafetyFor(tool, result),
      effectCommitted: Boolean(result.metadata?.changedFiles?.length || result.metadata?.patch),
    },
    metrics: { durationMs, outputBytes: Buffer.byteLength(output) },
    source: "native",
  }
}

export function legacyToolOutcome(event: Omit<AgentToolResultEvent, "outcome">): ToolOutcome {
  return {
    status: "unknown",
    summary: firstLine(event.result) ?? `${event.tool} returned output`,
    display: event.result,
    modelContent: event.result,
    effects: [{ kind: "unknown" }],
    artifacts: [event.artifact],
    verification: [],
    retry: { safety: "unknown", effectCommitted: false },
    metrics: { durationMs: event.durationMs, outputBytes: Buffer.byteLength(event.result) },
    source: "legacy_adapter",
  }
}

function effectsFor(tool: ToolDef, result: ExecuteResult): ToolEffect[] {
  const changedFiles = result.metadata?.changedFiles ?? []
  if (changedFiles.length > 0) return [{ kind: "workspace_write", paths: changedFiles }]
  switch (tool.spec?.category) {
    case "read": return [{ kind: "read", paths: [] }]
    case "write": return [{ kind: "workspace_write", paths: [] }]
    case "execute": return [{ kind: "process" }]
    case "network": return [{ kind: "network_read" }]
    case "system": return [{ kind: "unknown" }]
    default: return [{ kind: "unknown" }]
  }
}

function retrySafetyFor(tool: ToolDef, result: ExecuteResult): ToolOutcome["retry"]["safety"] {
  if (result.metadata?.changedFiles?.length || result.metadata?.patch) return "reconcilable"
  if (tool.spec?.category === "read") return "pure"
  if (tool.spec?.category === "network" && tool.spec.riskLevel === "low") return "pure"
  if (tool.spec?.category === "write") return "reconcilable"
  if (tool.spec?.category === "execute") return "unknown"
  return "unknown"
}

function verificationFrom(result: ExecuteResult): ToolOutcome["verification"] {
  return Object.entries(result.metadata?.verification ?? {}).map(([check, value]) => {
    const summary = value.output ? firstLine(value.output) : value.reason
    return {
      check,
      status: value.status,
      ...(summary ? { summary } : {}),
      ...(value.workspaceRevision ? { workspaceRevision: value.workspaceRevision } : {}),
      ...(value.baseRevision ? { baseRevision: value.baseRevision } : {}),
    }
  })
}

function firstLine(value: string): string | undefined {
  const line = value.split(/\r?\n/).map(item => item.trim()).find(Boolean)
  return line ? line.slice(0, 300) : undefined
}
