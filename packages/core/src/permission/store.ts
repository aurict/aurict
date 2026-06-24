import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { dirname as pathDirname } from "node:path"
import type { PermissionDecision, PermissionResponse, CategoryPermission } from "./types.js"
import type { ToolCategory } from "../tool/types.js"
import { getToolCategory } from "./categories.js"

// Session boyunca onaylanan/reddedilen izinleri tutar
const approved = new Set<string>()
const approvedDirs = new Set<string>()
// Kategori bazlı session izinleri ("write" → "allow_session")
const categoryApprovals = new Map<ToolCategory, CategoryPermission>()

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
  isApproved(tool: string, pattern: string): boolean {
    if (approved.has(key(tool, pattern))) return true
    for (const dir of approvedDirs) {
      const [dirTool, dirPath] = dir.split(":", 2)
      if (dirTool === tool && dirPath && isInsideDir(pattern, dirPath)) return true
    }
    return false
  },
  approve(tool: string, pattern: string): void {
    approved.add(key(tool, pattern))
  },
  approveDirectory(tool: string, pattern: string): void {
    approvedDirs.add(key(tool, dirname(pattern)))
  },
  clear(): void {
    approved.clear()
    approvedDirs.clear()
    categoryApprovals.clear()
  },

  loadPersisted(path: string): void {
    try {
      const raw  = readFileSync(path, "utf8")
      const data = JSON.parse(raw) as PersistedData
      if (data.version !== 1) return
      for (const entry of data.approved)     approved.add(entry)
      for (const entry of data.approvedDirs) approvedDirs.add(entry)
    } catch { /* file absent or malformed — silent skip */ }
  },

  savePersisted(path: string): void {
    try {
      mkdirSync(pathDirname(path), { recursive: true })
      const data: PersistedData = {
        version:      1,
        approved:     [...approved],
        approvedDirs: [...approvedDirs],
      }
      writeFileSync(path, JSON.stringify(data, null, 2), "utf8")
    } catch { /* non-fatal */ }
  },

  // ── Kategori bazlı onay ────────────────────────────────────────────────────
  /** "Bu session boyunca tüm write işlemlerine izin ver" gibi toplu onay */
  approveCategory(category: ToolCategory, perm: CategoryPermission = "allow_session"): void {
    categoryApprovals.set(category, perm)
  },
  /** Tool adından kategorisini bulup session izni var mı kontrol et */
  isCategoryApproved(toolName: string): boolean {
    const cat = getToolCategory(toolName)
    return categoryApprovals.get(cat) === "allow_session"
  },
  getCategoryPermission(toolName: string): CategoryPermission | undefined {
    const cat = getToolCategory(toolName)
    return categoryApprovals.get(cat)
  },
  listCategoryApprovals(): Array<{ category: ToolCategory; perm: CategoryPermission }> {
    return [...categoryApprovals.entries()].map(([category, perm]) => ({ category, perm }))
  },
  listDirectoryApprovals(): Array<{ tool: string; dir: string }> {
    return [...approvedDirs].map((entry) => {
      const idx = entry.indexOf(":")
      return { tool: entry.slice(0, idx), dir: entry.slice(idx + 1) }
    })
  },
}

// TUI → executor köprüsü: ask kararlarını bekler
type ResponseResolver = (response: PermissionResponse) => void
interface PendingPermission {
  resolve: ResponseResolver
}
const pending = new Map<string, PendingPermission>()
const earlyResponses = new Map<string, PermissionResponse>()

function normalizeResponse(response: PermissionDecision | PermissionResponse): PermissionResponse {
  return typeof response === "string" ? { decision: response } : response
}

export const PermissionGate = {
  // Executor tarafından çağrılır — kullanıcı kararını bekler
  wait(id: string, opts: { signal?: AbortSignal; timeoutMs?: number } = {}): Promise<PermissionResponse> {
    return new Promise((resolve) => {
      const early = earlyResponses.get(id)
      if (early) {
        earlyResponses.delete(id)
        resolve(early)
        return
      }

      let settled = false
      let timer: ReturnType<typeof setTimeout> | undefined

      const finish = (response: PermissionResponse) => {
        if (settled) return
        settled = true
        if (timer) clearTimeout(timer)
        opts.signal?.removeEventListener("abort", onAbort)
        pending.delete(id)
        resolve(response)
      }
      const onAbort = () => finish({ decision: "deny" })

      if (opts.signal?.aborted) {
        resolve({ decision: "deny" })
        return
      }
      opts.signal?.addEventListener("abort", onAbort, { once: true })
      if (opts.timeoutMs && opts.timeoutMs > 0) {
        timer = setTimeout(() => finish({ decision: "deny" }), opts.timeoutMs)
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
      entry.resolve(response)
    } else {
      earlyResponses.set(id, response)
    }
  },

  hasPending(): boolean {
    return pending.size > 0
  },

  // Abort / Ctrl+C sırasında çağrılır — bekleyen tüm izin isteklerini reddet
  cancelPending(): void {
    for (const entry of pending.values()) {
      entry.resolve({ decision: "deny" })
    }
    pending.clear()
    earlyResponses.clear()
  },
}
