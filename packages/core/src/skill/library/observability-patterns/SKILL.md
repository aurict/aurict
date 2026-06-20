---
name: observability-patterns
description: "Observability: Metrics, Logging, Tracing, OpenTelemetry, Alerting, Dashboards, SLI/SLO/SLA."
triggers:
  files: ["otel.config.ts", "prometheus.yml"]
  directories: ["monitoring/", "telemetry/"]
  keywords: ["observability", "metrics", "tracing", "opentelemetry", "prometheus", "datadog", "logs"]
auto_load_when: "Setting up monitoring, logging, or tracing for applications"
agent: devops-engineer
tools: ["Read", "Write", "Bash"]
---

# Observability Architecture Patterns

**Focus:** Metrics, logging, tracing, alerting, SLI/SLO

## 1. The Three Pillars

```
Metrics:
├── Numeric measurements over time
├── Counters (increasing values): requests_total, errors_total
├── Gauges (point-in-time): memory_usage, active_connections
├── Histograms (distributions): request_duration_ms, response_size
└── Aggregatable, efficient storage

Logs:
├── Discrete events with timestamps
├── Structured (JSON) vs unstructured
├── Levels: DEBUG, INFO, WARN, ERROR, FATAL
├── Context: request_id, user_id, metadata
└── Best for debugging specific issues

Traces:
├── End-to-end request flow across services
├── Spans: individual operations
├── Trace ID: correlates entire request
├── Span ID: individual operation
└── Best for understanding latency, dependencies
```

---

## 2. Metrics Patterns

```
Prometheus Metrics:
const counter = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'status', 'path']
});

const histogram = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  buckets: [0.1, 0.5, 1, 2, 5]
});

const gauge = new active_users_current{
  name: 'active_users',
  help: 'Currently active users'
};

// Usage
app.use((req, res, next) => {
  const start = Date.now()
  res.on('finish', () => {
    counter.inc({ method: req.method, status: res.statusCode })
    histogram.observe((Date.now() - start) / 1000)
  })
  next()
})

SLI (Service Level Indicator):
├── Availability: (successful requests / total requests) × 100
├── Latency: p95 response time < 200ms
├── Error rate: errors / total requests < 0.1%
└── Throughput: requests per second

SLO (Service Level Objective):
├── "99.9% of requests complete within 200ms"
├── "99.5% of API calls return successfully"
└── "99.99% uptime per month"

SLA (Service Level Agreement):
├── Contractual commitment to customers
├── Often stricter than SLO (99.99% vs 99.9%)
└── Financial penalties for breach
```

---

## 3. Logging Patterns

```
Structured Logging:
const logger = {
  info: (msg, meta) => console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'INFO',
    message: msg,
    ...meta
  })),

  error: (msg, error) => console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'ERROR',
    message: msg,
    error: {
      message: error.message,
      stack: error.stack
    }
  }))
}

Log Context:
logger.info('Processing request', {
  requestId: req.id,
  userId: user.id,
  path: req.path,
  method: req.method
})

Log Correlation:
const express = require('express')
const { v4: uuidv4 } = require('uuid')

app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || uuidv4()
  res.setHeader('x-request-id', req.id)

  logger.info('Request started', { requestId: req.id })
  res.on('finish', () => {
    logger.info('Request completed', {
      requestId: req.id,
      status: res.statusCode,
      duration: Date.now() - req.startTime
    })
  })

  next()
})

Log Levels:
├── DEBUG: Detailed for development
├── INFO: General operational events
├── WARN: Unexpected but recoverable
├── ERROR: Failures that need attention
└── FATAL: Service crash
```

---

## 4. Tracing Patterns

```
OpenTelemetry Basic:
const { trace } = require('@opentelemetry/api')
const { JaegerExporter } = require('@opentelemetry/exporter-jaeger')
const { NodeSDK } = require('@opentelemetry/sdk-node')

const sdk = new NodeSDK({
  traceExporter: new JaegerExporter(),
  serviceName: 'my-service'
})

sdk.start()

// Usage in code
const tracer = trace.getTracer('my-service')

app.use((req, res, next) => {
  const span = tracer.startSpan('http.request', {
    kind: SpanKind.SERVER,
    attributes: {
      'http.method': req.method,
      'http.url': req.url,
      'http.route': req.route
    }
  })

  res.on('finish', () => {
    span.setAttribute('http.status_code', res.statusCode)
    span.end()
  })

  next()
})

Distributed Trace:
Request Flow:
User → API Gateway → Auth Service → User Service → Database
  ↓
Trace: [trace_id: abc123]
  - span: api-gateway (5ms)
  - span: auth-service (10ms)
    - span: validate-token (2ms)
  - span: user-service (50ms)
    - span: db-query (45ms)

Trace Context Propagation:
// Send trace ID to downstream services
headers['x-trace-id'] = span.spanContext().traceId
headers['x-span-id'] = span.spanContext().spanId
```

---

## 5. Alerting Patterns

```
Prometheus Alerting Rules:
groups:
- name: service-alerts
  rules:
  - alert: HighErrorRate
    expr: sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) > 0.05
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "High error rate detected"
      description: "Error rate is {{ $value | humanizePercentage }}"

  - alert: HighLatency
    expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High latency detected"
      description: "p95 latency is {{ $value }}s"

  - alert: HighMemoryUsage
    expr: (container_memory_usage_bytes / container_spec_memory_limit_bytes) > 0.9
    for: 10m
    labels:
      severity: warning

Alert Design Principles:
├── Alert on symptoms, not causes
├── Set reasonable for durations (5m, 10m)
├── Avoid alert fatigue: prioritize critical
├── Include runbook link in annotations
└── Test alerts in staging

On-Call Rotation:
├── PagerDuty, Opsgenie integration
├── Escalation policy: 15m → 30m → 1h
├── Night/weekend covered by on-call
└── Runbooks for every alert
```

---

## 6. Dashboards

```
Grafana Dashboard Structure:
├── Overview (high-level)
│   ├── Total requests, error rate, latency (last 24h)
│   ├── Service health status
│   └── Active users, revenue (if applicable)

├── Service Detail
│   ├── Request rate by endpoint
│   ├── Error rate by endpoint
│   ├── Latency p50, p95, p99
│   └── CPU, Memory, Disk

├── Database
│   ├── Query rate
│   ├── Slow queries
│   ├── Connection pool usage
│   └── Replication lag

└── Kubernetes
    ├── Pod status, node resource usage
    ├── Deployment status, rollout progress
    └── Network I/O, ingress/egress

Dashboard Best Practices:
├── Show SLI trends, not just current values
├── Include past 24h + 7d views
├── Color code: green/yellow/red for thresholds
├── Link to runbooks from alert panels
└── Minimize cognitive load, prioritize
```

---

## 7. OpenTelemetry

```
OTel Architecture:
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Application │     │   OTel      │     │   Backend   │
│  (Code)     │────▶│   Collector │────▶│ (Jaeger,    │
│             │     │             │     │  Prometheus,│
│             │     │             │     │  Datadog)   │
└─────────────┘     └─────────────┘     └─────────────┘

Otel Collector:
receivers:
  otlp:
    protocols:
      grpc:
      http:
  prometheus:
    config:
      scrape_configs:
      - job_name: my-app

processors:
  batch:
    timeout: 10s
  memory_limiter:
    limit_mib: 400

exporters:
  otlp:
    endpoint: jaeger:4317
  prometheus:
    endpoint: 0.0.0.0:8889

Auto-instrumentation:
// Node.js auto-instrumentation
require('@opentelemetry/auto-instrumentations-node').register()

// Python auto-instrumentation
from opentelemetry import trace
trace.get_tracer_provider().add_span_processor(
    BatchSpanProcessor(ConsoleSpanExporter())
)
```

---

## Key Patterns

1. **Use all three pillars** — Metrics + Logs + Tracing together
2. **Standardize on OpenTelemetry** — Vendor-neutral instrumentation
3. **Define SLI/SLO first** — What matters to users
4. **Alert on symptoms** — Not every error, but real impact
5. **Correlate data** — Link logs to traces to metrics
6. **Instrument early** — Add observability at start

---

## Anti-Patterns

```
❌ Logging everything at DEBUG
✅ Log at INFO/WARN, DEBUG only in development

❌ No correlation IDs
✅ Add trace_id/request_id to all logs

❌ Alerts on every error
✅ Alert on SLI breach, not exceptions

❌ No runbooks for alerts
✅ Document what to do for each alert

❌ Metrics without labels
✅ Use labels for drill-down capability

❌ Manual tracing
✅ Use OpenTelemetry auto-instrumentation

❌ Single dashboard for all
✅ Role-specific dashboards

❌ No error budget/SLO
✅ Track SLO, plan error budget
```

---

## Quick Reference

| Concern | Tool | Pattern |
|---|---|---|
| Metrics | Prometheus | counter, histogram, gauge |
| Logs | ELK, Loki | Structured JSON |
| Traces | Jaeger, Zipkin | OpenTelemetry |
| Alerting | Prometheus Alertmanager | SLI-based alerts |
| Dashboards | Grafana | Service-focused |
| Correlation | Trace ID | Link all three pillars |
| SLO | Error budget | Track allowed failures |

---

## Decision Tree

```
Metrics, logs, or traces?
├── "How many / how fast / what rate?"       → metrics (counter, histogram, gauge)
├── "What exactly happened at time T?"      → logs (structured JSON with context)
└── "Why is this request slow?"             → traces (spans, latency breakdown)

When to add alert?
├── Maps to user-visible impact              → yes (error rate, latency breach)
├── Internal technical indicator only       → no (disk 70%, CPU spike — use dashboard)
└── For every exception                     → no — alert on SLI breach, not individual errors

Which logging level?
├── Development debugging                   → DEBUG (disable in prod)
├── Normal operation events                 → INFO
├── Something unexpected but recoverable   → WARN
├── Error requiring attention               → ERROR
└── Service unrecoverable                   → FATAL

Vendor choice?
├── Open-source / self-hosted               → OpenTelemetry + Jaeger + Prometheus + Grafana
├── Managed / startup speed                 → Datadog or New Relic (all-in-one)
└── Already on AWS                          → CloudWatch + X-Ray
```

---

## Key Rules

1. Structured JSON logging always — never `console.log('user updated ' + id)`
2. `trace_id` + `request_id` in every log line — enables log → trace correlation
3. Alert on SLI breaches only — not every exception or warning
4. SLO defined before adding alerts — know your error budget first
5. OpenTelemetry as instrumentation layer — swap backends without code changes
6. Runbook link in every alert annotation — not a raw expression
7. `for: 5m` on alert rules — prevents flap on transient spikes

---

## Implementation

```typescript
// Pino structured logger + request correlation middleware
import pino from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  base: { service: 'api', version: process.env.npm_package_version },
  timestamp: pino.stdTimeFunctions.isoTime,
})

// Express / Hono middleware — attach request context
export function requestLogger(req: any, res: any, next: any) {
  const traceId  = req.headers['x-trace-id'] ?? crypto.randomUUID()
  const log      = logger.child({ traceId, path: req.path, method: req.method })
  req.log        = log
  res.setHeader('x-trace-id', traceId)
  const start    = Date.now()
  res.on('finish', () => log.info({ status: res.statusCode, ms: Date.now() - start }, 'request'))
  next()
}

// OpenTelemetry span — manual instrumentation for DB calls
import { trace, SpanStatusCode } from '@opentelemetry/api'
const tracer = trace.getTracer('api')

export async function queryUser(id: string) {
  return tracer.startActiveSpan('db.user.find', async (span) => {
    span.setAttribute('db.system', 'postgresql')
    span.setAttribute('user.id', id)
    try {
      const user = await db.user.findUnique({ where: { id } })
      span.setStatus({ code: SpanStatusCode.OK })
      return user
    } catch (err) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: String(err) })
      span.recordException(err as Error)
      throw err
    } finally {
      span.end()
    }
  })
}

// Prometheus SLI alert rule
/*
- alert: HighErrorRate
  expr: |
    sum(rate(http_requests_total{status=~"5.."}[5m]))
    / sum(rate(http_requests_total[5m])) > 0.01
  for: 5m
  labels: { severity: critical }
  annotations:
    summary: "Error rate > 1% for 5 minutes"
    runbook: "https://wiki/runbooks/high-error-rate"
*/
```
