---
name: monitoring-patterns
description: "Monitoring: Metrics collection, alerting strategy, observability, and uptime tracking." 
triggers:
  keywords: ["metrics", "Prometheus", "Grafana", "alert", "observability", "APM", "Sentry", "Datadog", "uptime"]
auto_load_when: "Setting up monitoring or alerting"
agent: devops-engineer
tools: ["Read", "Write", "Bash"]
---

# Monitoring Patterns

**Focus:** System health, performance tracking, alerting philosophy

---

## 1. Metrics Strategy

```
What to monitor (USE method):

├── Utilization
│   ├── CPU, memory, disk usage
│   ├── Network bandwidth
│   └── Queue depths
│
├── Saturation
│   ├── How "full" resources are
│   ├── Request queue length
│   └── Connection pool usage
│
└── Errors
    ├── Error rate (errors per second)
    ├── HTTP 5xx ratio
    └── Exception count
```

```
Alternative approach (RED method):
├── Rate: requests per second
├── Errors: failed requests per second
└── Duration: latency distribution
```

---

## 2. Alerting Philosophy

```
When to create an alert:

├── Actionable
│   └── Can someone do something about it?
│   └── Alert fatigue comes from non-actionable alerts
│
├── Urgent
│   └── Does it need immediate attention?
│   └── Business impact: revenue, user experience
│
└── Observable
    └── Can you debug from the alert data?
    └── Include context: service, error, timeline
```

---

## 3. Alert Routing

```
Alert severity levels:

├── Critical (P1)
│   └── Immediate: phone call, SMS
│   └── Example: service down, data loss
│   └── SLA: respond in 15 minutes
│
├── Warning (P2)
│   └── Prompt: email, Slack
│   └── Example: high error rate, degraded performance
│   └── SLA: respond in 1 hour
│
├── Info (P3)
│   └── Dashboard only
│   └── Example: usage trends, capacity planning
│   └── SLA: respond in 24 hours
```

---

## 4. Observability Pillars

```
Three pillars (when to focus on each):

├── Logs
│   └── Use when: debugging specific requests
│   └── Store: structured, searchable format
│   └── Include: correlation IDs, timestamps
│
├── Metrics
│   └── Use when: trends over time, dashboards
│   └── Store: time-series database
│   └── Include: aggregations, percentiles
│
└── Traces
    └── Use when: distributed systems debugging
    └── Store: trace storage (Jaeger, Zipkin)
    └── Include: spans, timing, service map
```

---

## 5. Health Checks

```
Check types:

├── Liveness
│   └── Purpose: is process running?
│   └── Implementation: simple /health endpoint
│   └── Failure: restart container/pod
│
├── Readiness
│   └── Purpose: can handle requests?
│   └── Check: DB connection, downstream APIs
│   └── Failure: remove from load balancer
│
└── Startup
    └── Purpose: ready to receive traffic?
    └── Check: initialization complete
    └── Failure: timeout and restart
```

---

## Key Patterns

1. **SLI over SLO over SLA** — Focus on measurable indicators first
2. **Burn rate** — Track error budget consumption
3. **Golden signals** — Latency, traffic, errors, saturation
4. **Alert on symptoms** — Not causes (e.g., "high latency" not "DB slow")
5. **Runbook required** — Every alert needs documented response

---

## Anti-Patterns

```
❌ Alert on every error — alert fatigue kills response
✅ Alert only on symptoms that affect users (SLO breach)

❌ Logs with no structure (free-text printf)
✅ Structured JSON logs with trace_id, user_id, severity

❌ Single dashboard with 50 panels nobody reads
✅ Service-level dashboards: one golden signals view per service

❌ No runbook linked to alert
✅ Every alert links to a runbook with diagnosis steps

❌ Monitoring added after incidents
✅ Define SLOs and add observability in the same PR as the feature
```

---

## Quick Reference

| Signal | Tool | Alert threshold |
|---|---|---|
| Latency | Histogram p95/p99 | > SLO threshold |
| Error rate | Counter / rate() | > 1% (5xx) |
| Saturation | CPU/memory gauge | > 80% sustained |
| Availability | Synthetic probe | < 99.9% (30d) |
| Business KPI | Custom counter | Domain-defined |
| Traces | Span duration | Outlier detection |
