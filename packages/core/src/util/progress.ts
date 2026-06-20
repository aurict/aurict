/**
 * Streaming Tool Progress
 * 
 * Tool çalışırken kullanıcıya canlı progress gösterir.
 * TUI'da spinner, elapsed time, ve tool-specific bilgi gösterilir.
 */

export type ToolProgressStatus = "starting" | "running" | "finishing" | "done" | "error"

export interface ToolProgressEvent {
  toolId: string
  status: ToolProgressStatus
  message?: string
  elapsedMs: number
  metadata?: Record<string, unknown>
}

export type ToolProgressCallback = (event: ToolProgressEvent) => void

/**
 * Tool progress tracker — her tool çağrısı için progress event'leri emit eder.
 */
export class ToolProgressTracker {
  private listeners = new Set<ToolProgressCallback>()
  private activeTools = new Map<string, {
    startTime: number
    status: ToolProgressStatus
    message?: string
  }>()

  /**
   * Progress listener ekle.
   */
  onProgress(callback: ToolProgressCallback): () => void {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  /**
   * Tool başladığında çağrılır.
   */
  start(toolId: string, message?: string): void {
    const now = Date.now()
    this.activeTools.set(toolId, {
      startTime: now,
      status: "starting",
      ...(message !== undefined ? { message } : {}),
    })

    this.emit({
      toolId,
      status: "starting",
      elapsedMs: 0,
      ...(message !== undefined ? { message } : {}),
    })

    // Running'e geç
    this.activeTools.get(toolId)!.status = "running"
    this.emit({
      toolId,
      status: "running",
      elapsedMs: 0,
      ...(message !== undefined ? { message } : {}),
    })
  }

  /**
   * Tool ilerlemesini günceller.
   */
  update(toolId: string, message?: string, metadata?: Record<string, unknown>): void {
    const active = this.activeTools.get(toolId)
    if (!active) return

    if (message !== undefined) active.message = message
    active.status = "running"

    this.emit({
      toolId,
      status: "running",
      elapsedMs: Date.now() - active.startTime,
      ...(message !== undefined ? { message } : {}),
      ...(metadata !== undefined ? { metadata } : {}),
    })
  }

  /**
   * Tool bittiğinde çağrılır.
   */
  finish(toolId: string, message?: string): void {
    const active = this.activeTools.get(toolId)
    if (!active) return

    const elapsed = Date.now() - active.startTime

    this.emit({
      toolId,
      status: "done",
      elapsedMs: elapsed,
      ...(message !== undefined ? { message } : {}),
    })

    this.activeTools.delete(toolId)
  }

  /**
   * Tool hata verdiğinde çağrılır.
   */
  error(toolId: string, errorMessage: string): void {
    const active = this.activeTools.get(toolId)
    if (!active) return

    const elapsed = Date.now() - active.startTime

    this.emit({
      toolId,
      status: "error",
      message: errorMessage,
      elapsedMs: elapsed,
    })

    this.activeTools.delete(toolId)
  }

  /**
   * Aktif tool'ları listeler.
   */
  getActiveTools(): Array<{ toolId: string; elapsedMs: number; message?: string }> {
    const now = Date.now()
    return [...this.activeTools.entries()].map(([toolId, info]) => ({
      toolId,
      elapsedMs: now - info.startTime,
      ...(info.message !== undefined ? { message: info.message } : {}),
    }))
  }

  /**
   * Tüm listener'ları temizler.
   */
  clear(): void {
    this.listeners.clear()
    this.activeTools.clear()
  }

  private emit(event: ToolProgressEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event)
      } catch {
        // Listener hatası progress'i durdurmamalı
      }
    }
  }
}

/**
 * Tool-specific progress message'leri oluşturur.
 */
export function getToolProgressMessage(toolId: string, args: Record<string, unknown>): string {
  switch (toolId) {
    case "read":
      return `Reading ${args["path"] ?? "file"}...`
    case "write":
      return `Writing ${args["path"] ?? "file"}...`
    case "edit":
      return `Editing ${args["path"] ?? "file"}...`
    case "glob":
      return `Searching for ${args["pattern"] ?? "files"}...`
    case "grep":
      return `Searching for "${args["pattern"] ?? "pattern"}"...`
    case "bash":
      return `Running: ${args["command"] ?? "command"}`
    case "webfetch":
      return `Fetching ${args["url"] ?? "URL"}...`
    case "websearch":
      return `Searching web for "${args["query"] ?? "query"}"...`
    case "lsp":
      return `Running diagnostics...`
    case "verify":
      return `Verifying...`
    case "subagent":
      return `Spawning agent: ${args["type"] ?? "unknown"}...`
    default:
      return `Running ${toolId}...`
  }
}

/**
 * Global singleton progress tracker.
 */
export const progressTracker = new ToolProgressTracker()
