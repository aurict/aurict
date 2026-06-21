import type { PermissionDecision, PermissionResponse, CategoryPermission } from "./types.js"
import type { ToolCategory } from "../tool/types.js"
import { getToolCategory } from "./categories.js"

// Session boyunca onaylanan/reddedilen izinleri tutar
const approved = new Set<string>()
// Kategori bazlı session izinleri ("write" → "allow_session")
const categoryApprovals = new Map<ToolCategory, CategoryPermission>()

function key(tool: string, pattern: string) {
  return `${tool}:${pattern}`
}

export const PermissionStore = {
  isApproved(tool: string, pattern: string): boolean {
    return approved.has(key(tool, pattern))
  },
  approve(tool: string, pattern: string): void {
    approved.add(key(tool, pattern))
  },
  clear(): void {
    approved.clear()
    categoryApprovals.clear()
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
}

// TUI → executor köprüsü: ask kararlarını bekler
type ResponseResolver = (response: PermissionResponse) => void
const pending = new Map<string, ResponseResolver>()

function normalizeResponse(response: PermissionDecision | PermissionResponse): PermissionResponse {
  return typeof response === "string" ? { decision: response } : response
}

export const PermissionGate = {
  // Executor tarafından çağrılır — kullanıcı kararını bekler
  wait(id: string): Promise<PermissionResponse> {
    return new Promise((resolve) => {
      pending.set(id, resolve)
    })
  },

  // TUI tarafından çağrılır — kullanıcı Y/N'ye bastı
  respond(id: string, decision: PermissionDecision | PermissionResponse): void {
    const resolve = pending.get(id)
    if (resolve) {
      resolve(normalizeResponse(decision))
      pending.delete(id)
    }
  },

  hasPending(): boolean {
    return pending.size > 0
  },

  // Abort / Ctrl+C sırasında çağrılır — bekleyen tüm izin isteklerini reddet
  cancelPending(): void {
    for (const resolve of pending.values()) {
      resolve({ decision: "deny" })
    }
    pending.clear()
  },
}
