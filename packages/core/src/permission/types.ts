export type PermissionAction   = "allow" | "ask" | "deny"
export type PermissionScope    = "session" | "project" | "global"
export type CategoryPermission = "allow_session" | "deny"

export interface PermissionRule {
  tool:      string           // "shell" | "write" | "read" | "*"
  pattern:   string           // glob — "git *", "rm *", "/etc/*"
  action:    PermissionAction
  scope:     PermissionScope
}

export interface PermissionRequest {
  id:      string
  tool:    string
  pattern: string           // komut veya dosya yolu
  level?:  "safe" | "warning" | "danger"
  reason?: string
}

// allow        = bu kez izin ver + session'a kaydet (tekrar sorma)
// allow_once   = sadece bu kez izin ver, kaydetme
// deny         = reddet, agent hata alır ama devam eder
export type PermissionDecision = "allow" | "allow_once" | "deny"
