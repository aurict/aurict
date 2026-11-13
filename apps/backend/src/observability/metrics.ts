import type { Context, Next } from "hono"
import type { AppBindings } from "../types"

export type MetricsSnapshot = {
  startedAt: string
  requestsTotal: number
  responsesByStatus: Record<string, number>
  responsesByRoute: Record<string, number>
  averageLatencyMs: number
}

export type MetricsSink = {
  recordRequest(route: string, status: number, latencyMs: number): void
  snapshot(): MetricsSnapshot
  /** Prometheus text exposition of the request metrics, security events and process gauges. */
  prometheus(): string
}

// Latency buckets in seconds.
const BUCKETS = [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5]

// Security-relevant outcomes worth alerting on, counted wherever they happen (see countEvent).
// The set is fixed so label cardinality stays bounded.
export const SECURITY_EVENTS = [
  "invalid_credentials",
  "refresh_reuse_detected",
  "rate_limited",
  "rate_limit_store_unavailable",
  "device_signature_invalid",
  "remote_signature_invalid",
  "remote_fingerprint_mismatch",
  "trust_grant_invalid",
  "sender_signature_invalid",
  "claim_signature_invalid",
  "fingerprint_mismatch",
  "invalid_reauthentication",
] as const
export type SecurityEvent = (typeof SECURITY_EVENTS)[number]
const securityEvents = new Map<SecurityEvent, number>()

export function countEvent(event: string) {
  if ((SECURITY_EVENTS as readonly string[]).includes(event)) {
    securityEvents.set(event as SecurityEvent, (securityEvents.get(event as SecurityEvent) ?? 0) + 1)
  }
}

export function createMemoryMetrics(): MetricsSink {
  const startedAt = new Date()
  const responsesByStatus: Record<string, number> = {}
  const responsesByRoute: Record<string, number> = {}
  // key: `${route}\u0000${statusClass}` -> count; histograms keyed by route.
  const requestsByRouteStatus = new Map<string, number>()
  const histograms = new Map<string, { buckets: number[]; sum: number; count: number }>()
  let requestsTotal = 0
  let latencyTotal = 0
  return {
    recordRequest(route, status, latencyMs) {
      requestsTotal += 1
      latencyTotal += latencyMs
      responsesByStatus[String(status)] = (responsesByStatus[String(status)] ?? 0) + 1
      responsesByRoute[route] = (responsesByRoute[route] ?? 0) + 1
      const key = `${route}\u0000${Math.floor(status / 100)}xx`
      requestsByRouteStatus.set(key, (requestsByRouteStatus.get(key) ?? 0) + 1)
      const seconds = latencyMs / 1000
      const histogram = histograms.get(route) ?? { buckets: BUCKETS.map(() => 0), sum: 0, count: 0 }
      BUCKETS.forEach((bound, index) => { if (seconds <= bound) histogram.buckets[index]! += 1 })
      histogram.sum += seconds
      histogram.count += 1
      histograms.set(route, histogram)
    },
    prometheus() {
      const lines: string[] = []
      lines.push("# HELP aurict_http_requests_total HTTP requests by route pattern and status class.")
      lines.push("# TYPE aurict_http_requests_total counter")
      for (const [key, value] of requestsByRouteStatus) {
        const [route = "", statusClass = ""] = key.split("\u0000")
        const [method = "", path = ""] = route.split(" ")
        lines.push(`aurict_http_requests_total{method="${esc(method)}",route="${esc(path)}",status="${statusClass}"} ${value}`)
      }
      lines.push("# HELP aurict_http_request_duration_seconds HTTP request latency by route pattern.")
      lines.push("# TYPE aurict_http_request_duration_seconds histogram")
      for (const [route, histogram] of histograms) {
        const [method = "", path = ""] = route.split(" ")
        const labels = `method="${esc(method)}",route="${esc(path)}"`
        BUCKETS.forEach((bound, index) => lines.push(`aurict_http_request_duration_seconds_bucket{${labels},le="${bound}"} ${histogram.buckets[index]}`))
        lines.push(`aurict_http_request_duration_seconds_bucket{${labels},le="+Inf"} ${histogram.count}`)
        lines.push(`aurict_http_request_duration_seconds_sum{${labels}} ${histogram.sum}`)
        lines.push(`aurict_http_request_duration_seconds_count{${labels}} ${histogram.count}`)
      }
      lines.push("# HELP aurict_security_events_total Rejected credentials, signatures and rate-limit hits.")
      lines.push("# TYPE aurict_security_events_total counter")
      for (const event of SECURITY_EVENTS) lines.push(`aurict_security_events_total{event="${event}"} ${securityEvents.get(event) ?? 0}`)
      const memory = process.memoryUsage()
      lines.push("# TYPE process_resident_memory_bytes gauge", `process_resident_memory_bytes ${memory.rss}`)
      lines.push("# TYPE process_start_time_seconds gauge", `process_start_time_seconds ${Math.floor(startedAt.getTime() / 1000)}`)
      return `${lines.join("\n")}\n`
    },
    snapshot() {
      return {
        startedAt: startedAt.toISOString(),
        requestsTotal,
        responsesByStatus,
        responsesByRoute,
        averageLatencyMs: requestsTotal ? Math.round((latencyTotal / requestsTotal) * 100) / 100 : 0,
      }
    },
  }
}

function sanitizedPath(url: string) {
  return new URL(url).pathname
    .split("/")
    .map((segment) => {
      if (/^[a-z]+_[0-9a-f]{32}$/i.test(segment)) return ":id"
      if (/^[0-9a-f]{32}$/i.test(segment)) return ":id"
      if (/^[0-9a-f-]{36}$/i.test(segment)) return ":id"
      return segment
    })
    .join("/")
}

export async function observeRequest(c: Context<AppBindings>, next: Next) {
  const started = performance.now()
  await next()
  const latencyMs = Math.round((performance.now() - started) * 100) / 100
  const path = sanitizedPath(c.req.url)
  // Label by the registered route pattern, never the raw path: random URLs would otherwise
  // each create a new series and grow memory without bound.
  const route = `${c.req.method} ${routePattern(c)}`
  c.get("metrics").recordRequest(route, c.res.status, latencyMs)
  if (c.get("env").REQUEST_LOGS) {
    console.log(JSON.stringify({
      level: c.res.status >= 500 ? "error" : "info",
      event: "http.request",
      requestId: c.get("requestId"),
      method: c.req.method,
      path,
      status: c.res.status,
      latencyMs,
    }))
  }
}

function routePattern(c: Context<AppBindings>): string {
  const handler = [...c.req.matchedRoutes].reverse().find((route) => route.method !== "ALL" && route.path !== "*" && route.path !== "/*")
  return handler?.path ?? "unmatched"
}

function esc(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')
}
