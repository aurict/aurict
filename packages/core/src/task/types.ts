export type TaskStatus =
  | "pending"
  | "ready"
  | "in_progress"
  | "verifying"
  | "done"
  | "error"
  | "blocked"
  | "cancelled"

export interface Task {
  id: string
  subject: string
  owner?: string       // Hangi ajan (agentId veya role) bu görevi aldı
  status: TaskStatus
  blockedBy: string[]  // Bu görevin başlayabilmesi için bitmesi gereken diğer görevlerin ID'leri
  context?: string     // Üst görevlerden (bağımlılıklardan) gelen aktarılmış veriler (Context Passing)
  error?: string
  result?: string
  startedAt?: number
  dependencies?: string[]
  attempts?: number
  evidence?: string[]
  workspaceRevision?: string
  createdAt?: number
  updatedAt?: number
}

export interface TaskScope {
  workdir: string
  sessionId: string
}

export type TaskEventType = "created" | "updated" | "completed" | "failed"

export interface TaskEvent {
  sequence: number
  type: TaskEventType
  taskId: string
  task: Task
  at: number
}
