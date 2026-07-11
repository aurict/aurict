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
}

export function createMemoryMetrics(): MetricsSink {
  const startedAt = new Date()
  const responsesByStatus: Record<string, number> = {}
  const responsesByRoute: Record<string, number> = {}
  let requestsTotal = 0
  let latencyTotal = 0
  return {
    recordRequest(route, status, latencyMs) {
      requestsTotal += 1
      latencyTotal += latencyMs
      responsesByStatus[String(status)] = (responsesByStatus[String(status)] ?? 0) + 1
      responsesByRoute[route] = (responsesByRoute[route] ?? 0) + 1
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
  const route = `${c.req.method} ${path}`
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
