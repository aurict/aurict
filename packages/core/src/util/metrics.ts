/**
 * Metrics Collector — Optimizasyonların etkisini ölçmek için.
 * 
 * Tool call süreleri, cache hit rate, provider switch, compaction verileri
 * toplar. Session sonunda snapshot alınarak .aurict/ altına yazılabilir.
 * 
 * Thread-safe değildir — Bun single-threaded model için tasarlandı.
 */

export interface ToolMetric {
  toolId:       string
  callCount:    number
  cacheHits:    number
  cacheMisses:  number
  totalMs:      number
  avgMs:        number
  minMs:        number
  maxMs:        number
  errorCount:   number
}

export interface ProviderSwitchEntry {
  from:     string
  to:       string
  reason:   string
  timestamp: number
}

export interface CompactionEntry {
  tokensBefore: number
  tokensAfter:  number
  strategy:     string
  timestamp:    number
}

export interface MetricsSnapshot {
  // Tool metrics
  toolCallCount:       number
  toolCallDuration:    Record<string, { avg: number; total: number; count: number }>
  cacheHitRate:        number  // 0-1
  cacheTotalHits:      number
  cacheTotalMisses:    number

  // Provider metrics
  providerSwitchCount: number
  providerSwitches:    ProviderSwitchEntry[]

  // Compaction metrics
  compactionCount:     number
  compactions:         CompactionEntry[]
  totalTokensSaved:    number

  // Timing
  sessionStartMs:      number
  sessionDurationMs:   number
  avgResponseTime:     number

  // Error tracking
  totalErrors:         number
  errorsByTool:        Record<string, number>
}

class MetricsCollectorImpl {
  private tools = new Map<string, {
    count:    number
    cacheHit: number
    cacheMiss: number
    totalMs:  number
    minMs:    number
    maxMs:    number
    errors:   number
  }>()

  private providerSwitches: ProviderSwitchEntry[] = []
  private compactions:      CompactionEntry[]     = []
  private sessionStartMs:   number

  constructor() {
    this.sessionStartMs = Date.now()
  }

  // ─── Tool Metrics ───────────────────────────────────────────────────────────

  /** Tool çağrısını kaydet. */
  record(toolId: string, durationMs: number, cached: boolean): void {
    let entry = this.tools.get(toolId)
    if (!entry) {
      entry = { count: 0, cacheHit: 0, cacheMiss: 0, totalMs: 0, minMs: Infinity, maxMs: 0, errors: 0 }
      this.tools.set(toolId, entry)
    }

    entry.count++
    entry.totalMs += durationMs
    entry.minMs = Math.min(entry.minMs, durationMs)
    entry.maxMs = Math.max(entry.maxMs, durationMs)

    if (cached) {
      entry.cacheHit++
    } else {
      entry.cacheMiss++
    }
  }

  /** Tool hatasını kaydet. */
  recordError(toolId: string): void {
    let entry = this.tools.get(toolId)
    if (!entry) {
      entry = { count: 0, cacheHit: 0, cacheMiss: 0, totalMs: 0, minMs: Infinity, maxMs: 0, errors: 0 }
      this.tools.set(toolId, entry)
    }
    entry.errors++
  }

  /** Tek bir tool'un metrics'ini döner. */
  getToolMetric(toolId: string): ToolMetric | null {
    const entry = this.tools.get(toolId)
    if (!entry) return null

    return {
      toolId,
      callCount:   entry.count,
      cacheHits:   entry.cacheHit,
      cacheMisses: entry.cacheMiss,
      totalMs:     entry.totalMs,
      avgMs:       entry.count > 0 ? entry.totalMs / entry.count : 0,
      minMs:       entry.minMs === Infinity ? 0 : entry.minMs,
      maxMs:       entry.maxMs,
      errorCount:  entry.errors,
    }
  }

  /** Tüm tool metrics'lerini döner. */
  getAllToolMetrics(): ToolMetric[] {
    return [...this.tools.entries()].map(([toolId, entry]) => ({
      toolId,
      callCount:   entry.count,
      cacheHits:   entry.cacheHit,
      cacheMisses: entry.cacheMiss,
      totalMs:     entry.totalMs,
      avgMs:       entry.count > 0 ? entry.totalMs / entry.count : 0,
      minMs:       entry.minMs === Infinity ? 0 : entry.minMs,
      maxMs:       entry.maxMs,
      errorCount:  entry.errors,
    }))
  }

  // ─── Provider Metrics ───────────────────────────────────────────────────────

  /** Provider değişikliğini kaydet. */
  recordProviderSwitch(from: string, to: string, reason: string): void {
    this.providerSwitches.push({
      from,
      to,
      reason,
      timestamp: Date.now(),
    })
  }

  // ─── Compaction Metrics ─────────────────────────────────────────────────────

  /** Compaction'ı kaydet. */
  recordCompaction(tokensBefore: number, tokensAfter: number, strategy: string = "unknown"): void {
    this.compactions.push({
      tokensBefore,
      tokensAfter,
      strategy,
      timestamp: Date.now(),
    })
  }

  // ─── Snapshot ───────────────────────────────────────────────────────────────

  /** Tam metrics snapshot'u döner. */
  getSnapshot(): MetricsSnapshot {
    let totalCacheHits   = 0
    let totalCacheMisses = 0
    let totalCalls       = 0
    let totalMs          = 0
    let totalErrors      = 0
    const toolDuration: Record<string, { avg: number; total: number; count: number }> = {}
    const errorsByTool: Record<string, number> = {}

    for (const [toolId, entry] of this.tools) {
      totalCacheHits   += entry.cacheHit
      totalCacheMisses += entry.cacheMiss
      totalCalls       += entry.count
      totalMs          += entry.totalMs
      totalErrors      += entry.errors

      toolDuration[toolId] = {
        avg:   entry.count > 0 ? entry.totalMs / entry.count : 0,
        total: entry.totalMs,
        count: entry.count,
      }

      if (entry.errors > 0) {
        errorsByTool[toolId] = entry.errors
      }
    }

    const totalCacheRequests = totalCacheHits + totalCacheMisses
    const cacheHitRate = totalCacheRequests > 0 ? totalCacheHits / totalCacheRequests : 0

    const totalTokensSaved = this.compactions.reduce(
      (sum, c) => sum + (c.tokensBefore - c.tokensAfter), 0
    )

    const sessionDurationMs = Date.now() - this.sessionStartMs

    return {
      toolCallCount:       totalCalls,
      toolCallDuration:    toolDuration,
      cacheHitRate,
      cacheTotalHits:      totalCacheHits,
      cacheTotalMisses:    totalCacheMisses,
      providerSwitchCount: this.providerSwitches.length,
      providerSwitches:    [...this.providerSwitches],
      compactionCount:     this.compactions.length,
      compactions:         [...this.compactions],
      totalTokensSaved,
      sessionStartMs:      this.sessionStartMs,
      sessionDurationMs,
      avgResponseTime:     totalCalls > 0 ? totalMs / totalCalls : 0,
      totalErrors,
      errorsByTool,
    }
  }

  /** Snapshot'u human-readable string olarak döner. */
  formatSnapshot(): string {
    const s = this.getSnapshot()
    const lines: string[] = [
      "## Metrics Snapshot",
      "",
      `**Session Duration:** ${(s.sessionDurationMs / 1000).toFixed(1)}s`,
      `**Tool Calls:** ${s.toolCallCount}`,
      `**Cache Hit Rate:** ${(s.cacheHitRate * 100).toFixed(1)}% (${s.cacheTotalHits}/${s.cacheTotalHits + s.cacheTotalMisses})`,
      `**Avg Response Time:** ${s.avgResponseTime.toFixed(1)}ms`,
      `**Provider Switches:** ${s.providerSwitchCount}`,
      `**Compactions:** ${s.compactionCount} (saved ${s.totalTokensSaved} tokens)`,
      `**Total Errors:** ${s.totalErrors}`,
    ]

    if (Object.keys(s.toolCallDuration).length > 0) {
      lines.push("", "### Tool Breakdown")
      for (const [tool, data] of Object.entries(s.toolCallDuration)) {
        lines.push(`- **${tool}**: ${data.count} calls, avg ${data.avg.toFixed(1)}ms, total ${data.total.toFixed(0)}ms`)
      }
    }

    if (s.errorsByTool && Object.keys(s.errorsByTool).length > 0) {
      lines.push("", "### Errors by Tool")
      for (const [tool, count] of Object.entries(s.errorsByTool)) {
        lines.push(`- **${tool}**: ${count} errors`)
      }
    }

    return lines.join("\n")
  }

  /** Tüm metrics'leri sıfırla. */
  reset(): void {
    this.tools.clear()
    this.providerSwitches = []
    this.compactions = []
    this.sessionStartMs = Date.now()
  }
}

/** Global singleton metrics collector. */
export const metrics = new MetricsCollectorImpl()

/** Test veya çoklu session için yeni instance oluştur. */
export function createMetricsCollector(): MetricsCollectorImpl {
  return new MetricsCollectorImpl()
}
