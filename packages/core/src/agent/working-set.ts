import type { DistilledToolResult } from "../tool/result-distiller.js"

export type WorkingSetKind = "file" | "test" | "command" | "error" | "decision" | "verification"

export interface WorkingSetItem {
  id: string
  kind: WorkingSetKind
  label: string
  score: number
  lastSeenAt: number
  source: string
  reason: string
  status?: "active" | "resolved" | "failed" | "passed" | "skipped" | undefined
  path?: string | undefined
}

export interface WorkingSetSnapshot {
  items: WorkingSetItem[]
  updatedAt: number
}

const workingSets = new Map<string, Map<string, WorkingSetItem>>()

export function updateWorkingSetFromTool(
  sessionId: string,
  workdir: string,
  distilled: DistilledToolResult,
): WorkingSetSnapshot {
  if (isDisabled()) return getWorkingSetSnapshot(sessionId)
  const now = Date.now()
  for (const file of distilled.filePaths.slice(0, 12)) {
    upsert(sessionId, {
      id: `file:${file}`,
      kind: "file",
      label: file,
      path: file,
      score: distilled.changedFiles.includes(file) ? 95 : 70,
      lastSeenAt: now,
      source: distilled.tool,
      reason: distilled.changedFiles.includes(file) ? "changed file" : "referenced file",
      status: "active",
    })
  }
  for (const line of distilled.errors.slice(0, 6)) {
    upsert(sessionId, {
      id: `error:${hashKey(line)}`,
      kind: "error",
      label: line,
      score: 100,
      lastSeenAt: now,
      source: distilled.tool,
      reason: "recent tool error",
      status: "failed",
    })
  }
  for (const line of distilled.verification.slice(0, 6)) {
    const failed = /\b(failed|error|ts\d+)\b/i.test(line)
    const skipped = /\bskipped|timeout|timed out\b/i.test(line)
    upsert(sessionId, {
      id: `verification:${hashKey(line)}`,
      kind: "verification",
      label: line,
      score: failed ? 98 : skipped ? 88 : 82,
      lastSeenAt: now,
      source: distilled.tool,
      reason: "verification signal",
      status: failed ? "failed" : skipped ? "skipped" : "passed",
    })
  }
  if (distilled.tool === "bash" && distilled.outputPreview) {
    upsert(sessionId, {
      id: `command:${hashKey(distilled.outputPreview)}`,
      kind: "command",
      label: distilled.outputPreview,
      score: distilled.status === "error" ? 85 : 45,
      lastSeenAt: now,
      source: distilled.tool,
      reason: distilled.status === "error" ? "failed command" : "recent command",
      status: distilled.status === "error" ? "failed" : "passed",
    })
  }
  prune(sessionId)
  void workdir
  return getWorkingSetSnapshot(sessionId)
}

export function restoreWorkingSet(sessionId: string, snapshot?: WorkingSetSnapshot | null): void {
  const key = normalizeSessionId(sessionId)
  if (!snapshot || snapshot.items.length === 0) {
    workingSets.delete(key)
    return
  }
  workingSets.set(key, new Map(snapshot.items.map(item => [item.id, item])))
}

export function getWorkingSetSnapshot(sessionId: string, limit = 24): WorkingSetSnapshot {
  const items = [...(workingSets.get(normalizeSessionId(sessionId))?.values() ?? [])]
    .sort((a, b) => b.score - a.score || b.lastSeenAt - a.lastSeenAt)
    .slice(0, limit)
  return {
    items,
    updatedAt: items.reduce((max, item) => Math.max(max, item.lastSeenAt), 0),
  }
}

export function clearWorkingSet(sessionId?: string): void {
  if (sessionId === undefined) workingSets.clear()
  else workingSets.delete(normalizeSessionId(sessionId))
}

function upsert(sessionId: string, item: WorkingSetItem): void {
  const key = normalizeSessionId(sessionId)
  const set = workingSets.get(key) ?? new Map<string, WorkingSetItem>()
  const existing = set.get(item.id)
  set.set(item.id, existing ? { ...existing, ...item, score: Math.max(existing.score, item.score) } : item)
  workingSets.set(key, set)
}

function prune(sessionId: string): void {
  const key = normalizeSessionId(sessionId)
  const set = workingSets.get(key)
  if (!set || set.size <= 80) return
  const keep = [...set.values()]
    .sort((a, b) => b.score - a.score || b.lastSeenAt - a.lastSeenAt)
    .slice(0, 80)
  workingSets.set(key, new Map(keep.map(item => [item.id, item])))
}

function hashKey(text: string): string {
  let hash = 0
  for (let i = 0; i < text.length; i++) hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0
  return Math.abs(hash).toString(16)
}

function normalizeSessionId(sessionId: string): string {
  return sessionId || "__default__"
}

function isDisabled(): boolean {
  return process.env["AURICT_DISABLE_WORKING_SET"] === "1"
}
