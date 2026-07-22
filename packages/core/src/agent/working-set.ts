import type { DistilledToolResult } from "../tool/result-distiller.js"

export type WorkingSetKind = "file" | "test" | "command" | "error" | "decision" | "verification" | "critique"

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
  workspaceRevision?: string | undefined
}

export interface WorkingSetSnapshot {
  items: WorkingSetItem[]
  updatedAt: number
}

const workingSets = new Map<string, Map<string, WorkingSetItem>>()
// Faz 4.2: son critique'ten (veya session başından) beri biriken değişen satır sayısı.
const critiqueLineCounters = new Map<string, number>()

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
    const skipped = /\bskipp(?:ed|ing)|timeout|timed out\b/i.test(line)
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

// Faz 4.2: zorunlu adversarial critique — büyük bir değişiklikten sonra
// bekleyen bir critique kaydı bırakır. completion-gate bunu görüp critique
// çalışana kadar auto-continue tetikler.
export function markCritiqueRequired(sessionId: string, changedFiles: string[], linesChanged: number): WorkingSetSnapshot {
  if (isDisabled()) return getWorkingSetSnapshot(sessionId)
  upsert(sessionId, {
    id: "critique:pending",
    kind: "critique",
    label: `${linesChanged} critical-path lines changed in ${changedFiles.slice(0, 5).join(", ") || "this turn"}`,
    score: 90,
    lastSeenAt: Date.now(),
    source: "executor",
    reason: "large change requires adversarial review",
    status: "active",
  })
  return getWorkingSetSnapshot(sessionId)
}

/** critique tool çalıştığında bekleyen kaydı çözülmüş olarak işaretler. */
export function resolveCritiqueRequired(sessionId: string): WorkingSetSnapshot {
  if (isDisabled()) return getWorkingSetSnapshot(sessionId)
  const set = workingSets.get(normalizeSessionId(sessionId))
  const existing = set?.get("critique:pending")
  if (existing) set!.set("critique:pending", { ...existing, status: "resolved", lastSeenAt: Date.now() })
  critiqueLineCounters.delete(normalizeSessionId(sessionId))
  return getWorkingSetSnapshot(sessionId)
}

export function recordVerificationRevision(
  sessionId: string,
  source: string,
  status: "passed" | "failed" | "skipped",
  workspaceRevision: string,
  label: string,
): WorkingSetSnapshot {
  upsert(sessionId, {
    id: `verification-revision:${source}`,
    kind: "verification",
    label: label.slice(0, 1_500),
    score: status === "failed" ? 99 : 90,
    lastSeenAt: Date.now(),
    source,
    reason: "revision-bound verification",
    status,
    workspaceRevision,
  })
  return getWorkingSetSnapshot(sessionId)
}

/**
 * Her edit/write çağrısında değişen satır sayısını session bazında biriktirir;
 * eşik (minLinesForAuto) aşılınca markCritiqueRequired'ı tetikler ve sayacı
 * sıfırlar. Tek büyük bir edit yerine birden fazla küçük edit'in toplamda
 * kritik-yol kodunu büyük ölçüde değiştirdiği durumu da yakalar.
 */
export function recordLinesChangedForCritique(
  sessionId: string,
  changedFiles: string[],
  linesChanged: number,
  minLinesForAuto: number,
): WorkingSetSnapshot {
  if (isDisabled() || linesChanged <= 0) return getWorkingSetSnapshot(sessionId)
  const key = normalizeSessionId(sessionId)
  const total = (critiqueLineCounters.get(key) ?? 0) + linesChanged
  if (total >= Math.max(1, minLinesForAuto)) {
    critiqueLineCounters.set(key, 0)
    return markCritiqueRequired(sessionId, changedFiles, total)
  }
  critiqueLineCounters.set(key, total)
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
  if (sessionId === undefined) {
    workingSets.clear()
    critiqueLineCounters.clear()
  } else {
    workingSets.delete(normalizeSessionId(sessionId))
    critiqueLineCounters.delete(normalizeSessionId(sessionId))
  }
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
