/**
 * Audit Logging System
 * 
 * Güvenlik ve uyumluluk için audit log'ları tutar.
 * - Tool çağrıları
 * - Dosya değişiklikleri
 * - Permission kararları
 * - Hata olayları
 */

import { appendFileSync, mkdirSync } from "fs"
import { join } from "path"

export type AuditEventType =
  | "tool_call"
  | "file_write"
  | "file_delete"
  | "permission_grant"
  | "permission_deny"
  | "error"
  | "auth_success"
  | "auth_failure"
  | "rate_limit"
  | "security_alert"

export interface AuditEvent {
  timestamp: number
  type: AuditEventType
  severity: "info" | "warning" | "error" | "critical"
  actor: string           // Kullanıcı veya agent ID
  action: string          // Yapılan işlem
  resource?: string       // Etkilenen kaynak
  details?: Record<string, unknown> | undefined
  ip?: string
  sessionId?: string | undefined
}

export interface AuditLogConfig {
  enabled: boolean
  logPath: string
  maxFileSize: number     // bytes
  retentionDays: number
  includeDetails: boolean
}

const DEFAULT_CONFIG: AuditLogConfig = {
  enabled: true,
  logPath: ".aurict/audit.log",
  maxFileSize: 10_000_000, // 10MB
  retentionDays: 30,
  includeDetails: true,
}

/**
 * Audit logger — güvenlik olaylarını loglar.
 */
export class AuditLogger {
  private config: AuditLogConfig
  private buffer: AuditEvent[] = []
  private flushInterval: ReturnType<typeof setInterval> | null = null

  constructor(config: Partial<AuditLogConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    
    if (this.config.enabled) {
      // Her 5 saniyede bir buffer'ı flush et
      this.flushInterval = setInterval(() => this.flush(), 5000)
    }
  }

  /**
   * Audit event logla.
   */
  log(event: Omit<AuditEvent, "timestamp">): void {
    if (!this.config.enabled) return

    const fullEvent: AuditEvent = {
      ...event,
      timestamp: Date.now(),
    }

    this.buffer.push(fullEvent)

    // Buffer doluysa hemen flush et
    if (this.buffer.length >= 100) {
      this.flush()
    }
  }

  /**
   * Tool çağrısını logla.
   */
  logToolCall(
    actor: string,
    toolName: string,
    args: Record<string, unknown>,
    sessionId?: string,
  ): void {
    this.log({
      type: "tool_call",
      severity: "info",
      actor,
      action: `execute:${toolName}`,
      ...(this.config.includeDetails ? { details: { args } } : {}),
      ...(sessionId !== undefined ? { sessionId } : {}),
    })
  }

  /**
   * Dosya yazma işlemini logla.
   */
  logFileWrite(
    actor: string,
    filePath: string,
    sessionId?: string,
  ): void {
    this.log({
      type: "file_write",
      severity: "warning",
      actor,
      action: "write",
      resource: filePath,
      ...(sessionId !== undefined ? { sessionId } : {}),
    })
  }

  /**
   * Permission kararını logla.
   */
  logPermission(
    actor: string,
    granted: boolean,
    resource: string,
    reason?: string,
  ): void {
    this.log({
      type: granted ? "permission_grant" : "permission_deny",
      severity: granted ? "info" : "warning",
      actor,
      action: granted ? "grant" : "deny",
      resource,
      ...(reason !== undefined ? { details: { reason } } : {}),
    })
  }

  /**
   * Hata olayını logla.
   */
  logError(
    actor: string,
    error: string,
    context?: Record<string, unknown>,
  ): void {
    this.log({
      type: "error",
      severity: "error",
      actor,
      action: "error",
      details: { error, ...context },
    })
  }

  /**
   * Güvenlik uyarısını logla.
   */
  logSecurityAlert(
    actor: string,
    alert: string,
    severity: "warning" | "critical" = "warning",
    details?: Record<string, unknown>,
  ): void {
    this.log({
      type: "security_alert",
      severity,
      actor,
      action: "security_alert",
      details: { alert, ...details },
    })
  }

  /**
   * Rate limit olayını logla.
   */
  logRateLimit(
    actor: string,
    endpoint: string,
    retryAfterMs?: number,
  ): void {
    this.log({
      type: "rate_limit",
      severity: "warning",
      actor,
      action: "rate_limited",
      resource: endpoint,
      ...(retryAfterMs !== undefined ? { details: { retryAfterMs } } : {}),
    })
  }

  /**
   * Buffer'ı diske yaz.
   */
  flush(): void {
    if (this.buffer.length === 0) return

    try {
      const logDir = join(process.cwd(), ".aurict")
      mkdirSync(logDir, { recursive: true })

      const logPath = join(process.cwd(), this.config.logPath)
      const lines = this.buffer.map(event => JSON.stringify(event))
      appendFileSync(logPath, lines.join("\n") + "\n", "utf-8")

      this.buffer = []
    } catch (err) {
      // Log hatası uygulamayı durdurmamalı
      console.error("Audit log flush failed:", err)
    }
  }

  /**
   * Logger'ı kapat.
   */
  close(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
      this.flushInterval = null
    }
    this.flush()
  }

  /**
   * Buffer'daki event sayısını getir.
   */
  getBufferSize(): number {
    return this.buffer.length
  }
}

/**
 * Global audit logger instance.
 */
export const auditLogger = new AuditLogger()

/**
 * Audit log okuyucu — log dosyasını parse eder.
 */
export function readAuditLogs(
  logPath: string = ".aurict/audit.log",
  limit: number = 100,
): AuditEvent[] {
  try {
    const { readFileSync } = require("fs")
    const content = readFileSync(join(process.cwd(), logPath), "utf-8")
    const lines = content.trim().split("\n").filter(Boolean)
    
    return lines
      .slice(-limit)
      .map((line: string) => JSON.parse(line) as AuditEvent)
  } catch {
    return []
  }
}

/**
 * Audit log filtreleyici — belirli kriterlere göre filtreler.
 */
export function filterAuditLogs(
  events: AuditEvent[],
  filters: {
    type?: AuditEventType
    severity?: AuditEvent["severity"]
    actor?: string
    startDate?: number
    endDate?: number
  },
): AuditEvent[] {
  return events.filter(event => {
    if (filters.type && event.type !== filters.type) return false
    if (filters.severity && event.severity !== filters.severity) return false
    if (filters.actor && event.actor !== filters.actor) return false
    if (filters.startDate && event.timestamp < filters.startDate) return false
    if (filters.endDate && event.timestamp > filters.endDate) return false
    return true
  })
}
