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
  summary?: string
  permissionSummary?: string
  sandbox?: {
    backend: "none" | "policy" | "docker"
    reason:  string
    envScrubbed?: boolean
  }
  command?: {
    executables: string[]
    readOnly:    boolean
  }
  files?: Array<{
    path: string
    action: "add" | "delete" | "update" | "move"
    targetPath?: string
  }>
  diff?: {
    added: number
    removed: number
    fileCount: number
  }
  patch?: {
    text: string
    granular?: boolean
  }
}

// allow           = bu kez izin ver + session'a kaydet (tekrar sorma)
// allow_directory = bu kez izin ver + aynı klasör altında session boyunca hatırla
// allow_once      = sadece bu kez izin ver, kaydetme
// deny            = reddet, agent hata alır ama devam eder
export type PermissionDecision = "allow" | "allow_directory" | "allow_once" | "allow_partial" | "deny"

export interface PermissionResponse {
  decision: PermissionDecision
  approvedFiles?: string[]
}
