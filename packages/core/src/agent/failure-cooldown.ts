import type { DistilledToolResult } from "../tool/result-distiller.js"

export interface FailureCooldownEntry {
  fingerprint: string
  tool: string
  count: number
  firstSeenAt: number
  lastSeenAt: number
  strategyShiftRequired: boolean
  reason: string
}

export interface FailureCooldownSnapshot {
  entries: FailureCooldownEntry[]
  active: FailureCooldownEntry[]
}

const failures = new Map<string, Map<string, FailureCooldownEntry>>()

export function recordFailureCooldown(
  sessionId: string,
  tool: string,
  args: Record<string, unknown>,
  distilled: DistilledToolResult,
): FailureCooldownEntry | null {
  if (process.env["AURICT_DISABLE_FAILURE_COOLDOWN"] === "1") return null
  if (distilled.status !== "error" && distilled.errors.length === 0) return null
  const key = normalizeSessionId(sessionId)
  const fingerprint = makeFingerprint(tool, args, distilled)
  const now = Date.now()
  const byFingerprint = failures.get(key) ?? new Map<string, FailureCooldownEntry>()
  const existing = byFingerprint.get(fingerprint)
  const next: FailureCooldownEntry = {
    fingerprint,
    tool,
    count: (existing?.count ?? 0) + 1,
    firstSeenAt: existing?.firstSeenAt ?? now,
    lastSeenAt: now,
    strategyShiftRequired: (existing?.count ?? 0) + 1 >= 3,
    reason: distilled.errors[0] ?? distilled.outputPreview,
  }
  byFingerprint.set(fingerprint, next)
  failures.set(key, byFingerprint)
  return next
}

export function getFailureCooldownSnapshot(sessionId: string): FailureCooldownSnapshot {
  const entries = [...(failures.get(normalizeSessionId(sessionId))?.values() ?? [])]
    .sort((a, b) => b.lastSeenAt - a.lastSeenAt)
    .slice(0, 20)
  return {
    entries,
    active: entries.filter(entry => entry.strategyShiftRequired),
  }
}

export function restoreFailureCooldown(sessionId: string, snapshot?: FailureCooldownSnapshot | null): void {
  const key = normalizeSessionId(sessionId)
  if (!snapshot || snapshot.entries.length === 0) {
    failures.delete(key)
    return
  }
  failures.set(key, new Map(snapshot.entries.map(entry => [entry.fingerprint, entry])))
}

export function clearFailureCooldown(sessionId?: string): void {
  if (sessionId === undefined) failures.clear()
  else failures.delete(normalizeSessionId(sessionId))
}

export function failureCooldownBlocksRetry(): boolean {
  return process.env["AURICT_ENABLE_FAILURE_COOLDOWN_BLOCK"] === "1"
}

function makeFingerprint(tool: string, args: Record<string, unknown>, distilled: DistilledToolResult): string {
  const path = String(args["path"] ?? distilled.filePaths[0] ?? "")
  const command = tool === "bash" ? String(args["command"] ?? "").replace(/\s+/g, " ").slice(0, 160) : ""
  const error = (distilled.errors[0] ?? distilled.outputPreview).toLowerCase().replace(/\s+/g, " ").slice(0, 180)
  return `${tool}:${path}:${command}:${error}`
}

function normalizeSessionId(sessionId: string): string {
  return sessionId || "__default__"
}
