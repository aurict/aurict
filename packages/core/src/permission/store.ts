import type { PermissionDecision, PermissionResponse, CategoryPermission } from "./types.js"
import type { ToolCategory } from "../tool/types.js"
import { getToolCategory } from "./categories.js"
import { readJsonFileSync, writeJsonFileAtomicSync } from "../storage/persisted-json.js"

// Session boyunca onaylanan/reddedilen izinleri tutar
interface PermissionState {
  approved: Set<string>
  approvedDirs: Set<string>
  categoryApprovals: Map<ToolCategory, CategoryPermission>
}

const states = new Map<string, PermissionState>()

function state(scope = "global"): PermissionState {
  const existing = states.get(scope)
  if (existing) return existing
  const created: PermissionState = {
    approved: new Set(),
    approvedDirs: new Set(),
    categoryApprovals: new Map(),
  }
  states.set(scope, created)
  return created
}

interface PersistedData {
  version: 1
  approved:     string[]
  approvedDirs: string[]
}

function key(tool: string, pattern: string) {
  return `${tool}:${pattern}`
}

function normalizePathLike(path: string): string {
  return path.replace(/\\/g, "/").replace(/\/+$/g, "") || "/"
}

function dirname(path: string): string {
  const normalized = normalizePathLike(path)
  if (normalized === "/") return "/"
  const idx = normalized.lastIndexOf("/")
  if (idx <= 0) return "."
  return normalized.slice(0, idx)
}

function isInsideDir(path: string, dir: string): boolean {
  const p = normalizePathLike(path)
  const d = normalizePathLike(dir)
  return p === d || p.startsWith(d.endsWith("/") ? d : `${d}/`)
}

export const PermissionStore = {
  isApproved(tool: string, pattern: string, scope = "global"): boolean {
    const candidates = scope === "global" ? [state()] : [state(scope), state()]
    for (const candidate of candidates) {
      if (candidate.approved.has(key(tool, pattern))) return true
      for (const dir of candidate.approvedDirs) {
        const idx = dir.indexOf(":")
        if (idx < 0) continue
        const dirTool = dir.slice(0, idx)
        const dirPath = dir.slice(idx + 1)
        if (dirTool === tool && dirPath && isInsideDir(pattern, dirPath)) return true
      }
    }
    return false
  },
  approve(tool: string, pattern: string, scope = "global"): void {
    state(scope).approved.add(key(tool, pattern))
  },
  approveDirectory(tool: string, pattern: string, scope = "global"): void {
    state(scope).approvedDirs.add(key(tool, dirname(pattern)))
  },
  clear(scope?: string): void {
    if (scope !== undefined) states.delete(scope)
    else states.clear()
  },

  loadPersisted(path: string): void {
    const data = readJsonFileSync<PersistedData>(path, {
      optional: true,
      description: "permission store",
      validate: isPersistedPermissionData,
    })
    if (!data) return
    for (const entry of data.approved)     state().approved.add(entry)
    for (const entry of data.approvedDirs) state().approvedDirs.add(entry)
  },

  savePersisted(path: string): void {
    const data: PersistedData = {
      version:      1,
      approved:     [...state().approved],
      approvedDirs: [...state().approvedDirs],
    }
    writeJsonFileAtomicSync(path, data, { backup: true, mode: 0o600 })
  },

  // ── Kategori bazlı onay ────────────────────────────────────────────────────
  /** "Bu session boyunca tüm write işlemlerine izin ver" gibi toplu onay */
  approveCategory(category: ToolCategory, perm: CategoryPermission = "allow_session", scope = "global"): void {
    state(scope).categoryApprovals.set(category, perm)
  },
  /** Tool adından kategorisini bulup session izni var mı kontrol et */
  isCategoryApproved(toolName: string, scope = "global"): boolean {
    const cat = getToolCategory(toolName)
    return state(scope).categoryApprovals.get(cat) === "allow_session"
      || (scope !== "global" && state().categoryApprovals.get(cat) === "allow_session")
  },
  getCategoryPermission(toolName: string, scope = "global"): CategoryPermission | undefined {
    const cat = getToolCategory(toolName)
    return state(scope).categoryApprovals.get(cat) ?? (scope !== "global" ? state().categoryApprovals.get(cat) : undefined)
  },
  listCategoryApprovals(scope = "global"): Array<{ category: ToolCategory; perm: CategoryPermission }> {
    return [...state(scope).categoryApprovals.entries()].map(([category, perm]) => ({ category, perm }))
  },
  listDirectoryApprovals(scope = "global"): Array<{ tool: string; dir: string }> {
    return [...state(scope).approvedDirs].map((entry) => {
      const idx = entry.indexOf(":")
      return { tool: entry.slice(0, idx), dir: entry.slice(idx + 1) }
    })
  },
}

function isPersistedPermissionData(value: unknown): value is PersistedData {
  if (!value || typeof value !== "object") return false
  const data = value as Partial<PersistedData>
  return data.version === 1
    && Array.isArray(data.approved) && data.approved.every(entry => typeof entry === "string")
    && Array.isArray(data.approvedDirs) && data.approvedDirs.every(entry => typeof entry === "string")
}

// TUI → executor köprüsü: ask kararlarını bekler
export type PermissionSettlementReason = "response" | "timeout" | "abort" | "cancel"
export interface PermissionSettlement {
  id: string
  response: PermissionResponse
  reason: PermissionSettlementReason
}

type SettlementListener = (settlement: PermissionSettlement) => void
type ResponseResolver = (
  response: PermissionResponse,
  reason?: PermissionSettlementReason,
) => void
interface PendingPermission {
  resolve: ResponseResolver
}
const pending = new Map<string, PendingPermission>()
const earlyResponses = new Map<string, PermissionResponse>()
const settlementListeners = new Set<SettlementListener>()

function normalizeResponse(response: PermissionDecision | PermissionResponse): PermissionResponse {
  return typeof response === "string" ? { decision: response } : response
}

function emitSettlement(settlement: PermissionSettlement): void {
  for (const listener of settlementListeners) {
    try {
      listener(settlement)
    } catch (error) {
      console.error("[aurict] permission settlement listener failed", error)
    }
  }
}

export const PermissionGate = {
  // Executor tarafından çağrılır — kullanıcı kararını bekler
  wait(id: string, opts: { signal?: AbortSignal; timeoutMs?: number } = {}): Promise<PermissionResponse> {
    return new Promise((resolve) => {
      const early = earlyResponses.get(id)
      if (early) {
        earlyResponses.delete(id)
        emitSettlement({
          id,
          response: early,
          reason: "response",
        })
        resolve(early)
        return
      }

      let settled = false
      let timer: ReturnType<typeof setTimeout> | undefined

      const finish = (
        response: PermissionResponse,
        reason: PermissionSettlementReason = "response",
      ) => {
        if (settled) return
        settled = true
        if (timer) clearTimeout(timer)
        opts.signal?.removeEventListener("abort", onAbort)
        pending.delete(id)
        resolve(response)
        emitSettlement({ id, response, reason })
      }
      const onAbort = () => finish({ decision: "deny" }, "abort")

      if (opts.signal?.aborted) {
        const response = { decision: "deny" } as const
        resolve(response)
        emitSettlement({
          id,
          response,
          reason: "abort",
        })
        return
      }
      opts.signal?.addEventListener("abort", onAbort, { once: true })
      if (opts.timeoutMs && opts.timeoutMs > 0) {
        timer = setTimeout(
          () => finish({ decision: "deny" }, "timeout"),
          opts.timeoutMs,
        )
      }

      pending.set(id, {
        resolve: finish,
      })
    })
  },

  // TUI tarafından çağrılır — kullanıcı Y/N'ye bastı
  respond(id: string, decision: PermissionDecision | PermissionResponse): void {
    const entry = pending.get(id)
    const response = normalizeResponse(decision)
    if (entry) {
      entry.resolve(response, "response")
    } else {
      earlyResponses.set(id, response)
    }
  },

  hasPending(id?: string): boolean {
    return id === undefined ? pending.size > 0 : pending.has(id)
  },

  onSettled(listener: SettlementListener): () => void {
    settlementListeners.add(listener)
    return () => settlementListeners.delete(listener)
  },

  // Abort / Ctrl+C sırasında çağrılır — bekleyen tüm izin isteklerini reddet
  cancelPending(): void {
    for (const entry of pending.values()) {
      entry.resolve({ decision: "deny" }, "cancel")
    }
    pending.clear()
    earlyResponses.clear()
  },
}
