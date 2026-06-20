---
name: logging-patterns
description: "Logging: Log levels, structured logging, log aggregation, and debugging strategies." 
triggers:
  extensions: [".ts"]
  keywords: ["logger", "log", "winston", "pino", "structured logging", "trace", "span", "observability"]
auto_load_when: "Implementing logging or observability"
agent: devops-engineer
tools: ["Read", "Write", "Bash"]
---

# Logging Patterns

**Focus:** Log management, debugging, compliance

---

## 1. Log Levels

```
When to use each level:

├── ERROR
│   └── Unexpected failures
│   └── Impact: request failed, action not completed
│   └── Example: exception, timeout, connection refused
│
├── WARN
│   └── Known limitations, degraded behavior
│   └── Impact: working but suboptimal
│   └── Example: retry after multiple attempts, fallback used
│
├── INFO
│   └── Significant business events
│   └── Impact: normal operations
│   └── Example: user action, payment processed, order created
│
├── DEBUG
│   └── Detailed diagnostic info
│   └── Only in development/staging
│   └── Example: variable values, loop iterations
│
└── TRACE
    └── Finest granularity
    └── Heavy instrumentation
    └── Example: entry/exit of every function
```

---

## 2. Structured Logging

```
When to use structured vs plain text:

├── Structured (JSON)
│   └── Use when: log aggregation (ELK, Loki)
│   └── Use when: programmatic parsing
│   └── Use when: need to search/filter fields
│   └── Include: timestamp, level, message, context
│
└── Plain text
    └── Use when: human readability in console
    └── Use when: simple scripts
    └── Avoid: in production systems
```

```
Standard fields for structured logs:
├── timestamp: ISO 8601 format
├── level: ERROR, WARN, INFO, DEBUG
├── message: human-readable description
├── service: name of service
├── trace_id: correlation ID
├── user_id: user context (if applicable)
├── metadata: key-value pairs for context
```

---

## 3. Log Aggregation

```
When to use each aggregation system:

├── ELK Stack (Elasticsearch, Logstash, Kibana)
│   └── Use when: full-text search needed
│   └── Use when: complex queries
│   └── Good for: high log volume, rich analysis
│
├── Loki (with Grafana)
│   └── Use when: already using Prometheus/Grafana
│   └── Use when: cost-effective storage needed
│   └── Good for: labels-based filtering
│
├── CloudWatch Logs
│   └── Use when: AWS infrastructure
│   └── Use when: native AWS integration
│   └── Good for: serverless applications
│
└── Datadog
    └── Use when: APM integration needed
    └── Use when: unified monitoring
    └── Good for: distributed systems
```

---

## 4. What to Log

```
Log these events:

├── Request lifecycle
│   ├── Incoming request (method, path, ID)
│   ├── Outgoing calls (service, duration, status)
│   └── Response (status, duration)
│
├── Business events
│   ├── User actions (login, purchase, signup)
│   ├── State changes (order placed, status updated)
│   └── Important decisions (fraud detected, approved)
│
└── Errors and warnings
    ├── Exceptions (stack trace, context)
    ├── Degraded behavior (fallback activated)
    └── Configuration issues (missing/invalid)
```

```
Avoid logging:
├── Sensitive data (passwords, tokens, PII)
├── Large payloads (request bodies unless needed)
├── High-frequency debug logs in production
└── Duplicate information
```

---

## 5. Log Performance

```
How to handle logging at scale:

├── Async logging
│   └── Non-blocking writes
│   └── Queue-based (discard on overflow)
│
├── Sampling
│   └── Log 1 in N requests
│   └── Always log errors
│   └── Useful for high-volume services
│
├── Buffering
│   └── Batch writes
│   └── Reduce I/O overhead
│
└── Compression
    └── Compress logs before storage
    └── Reduces storage costs
```

---

## Key Patterns

1. **Correlation IDs** — Pass trace_id through entire request
2. **Sensitive data** — Never log passwords, tokens, credit cards
3. **Parseable format** — JSON preferred for production
4. **Contextual logging** — Include request ID, user ID, service name
5. **Retention policy** — Define what to keep and for how long

---

## Anti-Patterns

```
❌ console.log in application code
✅ Structured logger (pino/winston) with log levels

❌ Logging sensitive data (passwords, tokens, PII)
✅ Redact sensitive fields; log IDs not values

❌ Logging inside tight loops (millions/sec)
✅ Log entry/exit of operations; aggregate metrics instead

❌ No correlation ID across service calls
✅ Propagate trace-id/request-id header; include in every log line

❌ Log statements that say what, not why
✅ Log context: what was being attempted, not just the error
```

---

## Quick Reference

| Level | When to use | Example |
|---|---|---|
| error | Unhandled exceptions, outages | DB connection failed |
| warn | Recoverable issues, deprecations | Fallback used |
| info | Business events, lifecycle | User signed up |
| debug | Diagnostic detail | Query took 200ms |
| trace | Very verbose paths | Enter function X |

| Field | Always include | Optional |
|---|---|---|
| timestamp | ISO 8601 | — |
| level | string | — |
| message | string | — |
| trace_id | string | — |
| service | string | version |
| user_id | string | — |

---

## Decision Tree

```
Which log level?
├── Unhandled exception, data loss risk     → error
├── Degraded / fallback activated          → warn
├── Business event (signup, purchase)      → info
├── Diagnostic detail (query timing)       → debug (disabled in production)
└── Very verbose trace                     → trace (disabled unless profiling)

Structured or plain text?
├── Production / going to aggregator       → structured JSON always
├── Dev console readability               → pretty-print (pino-pretty in dev)
└── Simple script / CLI tool             → plain text ok

Log aggregation?
├── Already on AWS                         → CloudWatch Logs
├── Using Grafana/Prometheus stack         → Loki (label-based)
├── Need full-text search on logs          → Elasticsearch (ELK)
└── All-in-one APM (logs + traces + APM)  → Datadog
```

---

## Key Rules

1. Structured JSON in production — never `console.log` string concatenation
2. `trace_id` + `service` in every log line — link logs to distributed traces
3. Never log sensitive data: passwords, tokens, credit card numbers, SSNs
4. Redact sensitive fields at logger config, not by manual filtering
5. INFO for observable business events; DEBUG only for troubleshooting (off in prod)
6. Async / buffered logging — never block request thread on log I/O
7. Include request context (user_id, path, method) in child logger per request

---

## Implementation

```typescript
// pino — fast structured logger with redaction + request context
import pino from 'pino'

export const logger = pino({
  level:  process.env.LOG_LEVEL ?? 'info',
  base:   { service: 'api', env: process.env.NODE_ENV },
  // Redact sensitive fields anywhere in the log object
  redact: ['req.headers.authorization', 'body.password', '*.token', '*.secret'],
  timestamp: pino.stdTimeFunctions.isoTime,
  // Pretty-print in dev only
  transport: process.env.NODE_ENV === 'development'
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
})

// Request middleware — per-request child logger
export function requestLogger(req: any, res: any, next: any) {
  const traceId = (req.headers['x-trace-id'] as string) ?? crypto.randomUUID()
  // Child logger inherits all fields + adds request context
  req.log = logger.child({ traceId, userId: req.user?.id, path: req.path })
  res.setHeader('x-trace-id', traceId)

  const start = Date.now()
  res.on('finish', () => {
    const level = res.statusCode >= 500 ? 'error'
                : res.statusCode >= 400 ? 'warn'
                : 'info'
    req.log[level]({ status: res.statusCode, ms: Date.now() - start }, 'request completed')
  })
  next()
}

// Usage in service — attach business context
async function processPayment(req: any, amount: number) {
  req.log.info({ amount, currency: 'USD' }, 'payment initiated')
  try {
    const result = await stripe.charge(amount)
    req.log.info({ chargeId: result.id }, 'payment succeeded')
    return result
  } catch (err) {
    req.log.error({ err, amount }, 'payment failed')
    throw err
  }
}
```
