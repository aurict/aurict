import { describe, it, expect } from "bun:test"
import { metrics, createMetricsCollector } from "../src/util/metrics.js"

describe("MetricsCollector", () => {
  it("records tool calls", () => {
    const m = createMetricsCollector()
    m.record("read", 50, false)
    m.record("read", 30, false)

    const metric = m.getToolMetric("read")
    expect(metric).not.toBeNull()
    expect(metric!.callCount).toBe(2)
    expect(metric!.totalMs).toBe(80)
    expect(metric!.avgMs).toBe(40)
    expect(metric!.minMs).toBe(30)
    expect(metric!.maxMs).toBe(50)
  })

  it("tracks cache hits and misses", () => {
    const m = createMetricsCollector()
    m.record("read", 50, false)   // miss
    m.record("read", 5, true)     // hit
    m.record("read", 3, true)     // hit

    const metric = m.getToolMetric("read")
    expect(metric!.cacheHits).toBe(2)
    expect(metric!.cacheMisses).toBe(1)
  })

  it("tracks errors", () => {
    const m = createMetricsCollector()
    m.record("bash", 100, false)
    m.recordError("bash")
    m.recordError("bash")

    const metric = m.getToolMetric("bash")
    expect(metric!.errorCount).toBe(2)
  })

  it("returns null for unknown tool", () => {
    const m = createMetricsCollector()
    expect(m.getToolMetric("nonexistent")).toBeNull()
  })

  it("getAllToolMetrics returns all tools", () => {
    const m = createMetricsCollector()
    m.record("read", 10, false)
    m.record("grep", 20, false)
    m.record("glob", 30, false)

    const all = m.getAllToolMetrics()
    expect(all.length).toBe(3)
    expect(all.map(t => t.toolId).sort()).toEqual(["glob", "grep", "read"])
  })

  it("records provider switches", () => {
    const m = createMetricsCollector()
    m.recordProviderSwitch("anthropic", "openai", "429 rate limit")
    m.recordProviderSwitch("openai", "google", "503 unavailable")

    const snapshot = m.getSnapshot()
    expect(snapshot.providerSwitchCount).toBe(2)
    expect(snapshot.providerSwitches[0]!.from).toBe("anthropic")
    expect(snapshot.providerSwitches[0]!.to).toBe("openai")
  })

  it("records compactions", () => {
    const m = createMetricsCollector()
    m.recordCompaction(100000, 50000, "session")
    m.recordCompaction(80000, 40000, "snip")

    const snapshot = m.getSnapshot()
    expect(snapshot.compactionCount).toBe(2)
    expect(snapshot.totalTokensSaved).toBe(90000)
    expect(snapshot.compactions[0]!.strategy).toBe("session")
  })

  it("getSnapshot computes cache hit rate", () => {
    const m = createMetricsCollector()
    m.record("read", 10, true)    // hit
    m.record("read", 10, true)    // hit
    m.record("read", 10, false)   // miss
    m.record("grep", 10, false)   // miss

    const snapshot = m.getSnapshot()
    expect(snapshot.cacheTotalHits).toBe(2)
    expect(snapshot.cacheTotalMisses).toBe(2)
    expect(snapshot.cacheHitRate).toBe(0.5)
  })

  it("getSnapshot includes session timing", () => {
    const m = createMetricsCollector()
    const snapshot = m.getSnapshot()
    expect(snapshot.sessionStartMs).toBeGreaterThan(0)
    expect(snapshot.sessionDurationMs).toBeGreaterThanOrEqual(0)
  })

  it("formatSnapshot produces readable output", () => {
    const m = createMetricsCollector()
    m.record("read", 50, false)
    m.record("read", 5, true)
    m.record("bash", 200, false)
    m.recordError("bash")
    m.recordProviderSwitch("anthropic", "openai", "rate limit")
    m.recordCompaction(100000, 50000, "session")

    const formatted = m.formatSnapshot()
    expect(formatted).toContain("Metrics Snapshot")
    expect(formatted).toContain("**Tool Calls:** 3")
    expect(formatted).toContain("Cache Hit Rate:")
    expect(formatted).toContain("**Provider Switches:** 1")
    expect(formatted).toContain("**Compactions:** 1")
    expect(formatted).toContain("saved 50000 tokens")
    expect(formatted).toContain("Tool Breakdown")
    expect(formatted).toContain("Errors by Tool")
  })

  it("reset clears all data", () => {
    const m = createMetricsCollector()
    m.record("read", 50, false)
    m.recordProviderSwitch("anthropic", "openai", "test")
    m.recordCompaction(100, 50, "test")

    m.reset()

    const snapshot = m.getSnapshot()
    expect(snapshot.toolCallCount).toBe(0)
    expect(snapshot.providerSwitchCount).toBe(0)
    expect(snapshot.compactionCount).toBe(0)
  })

  it("global singleton works", () => {
    metrics.record("test-tool", 10, false)
    const metric = metrics.getToolMetric("test-tool")
    expect(metric).not.toBeNull()
    expect(metric!.callCount).toBeGreaterThanOrEqual(1)
    metrics.reset()
  })
})
