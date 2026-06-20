---
name: chaos-engineering
description: "Chaos Engineering: Fault injection, resilience testing, game days, chaos mesh, litmus." 
triggers:
  extensions: [".yaml", ".json", ".py"]
  directories: ["chaos/", "resilience/", "testing/"]
  keywords: ["chaos", "resilience", "fault injection", "game day", "chaos mesh", "litmus", "gremlin", "failure"]
auto_load_when: "Building resilient systems or testing fault tolerance"
agent: platform-engineer
tools: ["Read", "Write", "Bash"]
---

# Chaos Engineering Patterns

**Focus:** Resilience testing, fault injection, observability

## 1. Chaos Principles

```
Chaos Engineering Principles:
├── Start by defining steady state
│   ├── Normal behavior metrics
│   └── "System should serve 99% of requests under 200ms"
│
├── Hypothesize about behavior
│   ├── "If service A fails, service B should..."
│   └── Document expected behavior
│
├── Inject real failures
│   ├── Kill processes
│   ├── Network latency
│   └── Resource exhaustion
│   └── Real problems, not simulated
│
├── Test in production (carefully)
│   ├── Or production-like staging
│   └── Small blast radius
│   && Observe, don't break
│
└── Automate & run continuously
    └── Run as part of CI/CD
    └── Reproducible
```

---

## 2. Failure Scenarios

```
Common Failure Tests:
├── Service failure
│   ├── Kill a pod/service
│   ├── CPU/memory exhaustion
│   └── Process crash
│
├── Network failure
│   ├── Latency injection
│   ├── Packet loss
│   └── DNS failure
│   └── Network partition
│
├── Dependency failure
│   ├── External API timeout
│   ├── Database unavailable
│   └── Cache unavailable
│
├── Infrastructure failure
│   ├── AZ failure
│   └── Instance termination
│   └── Disk full
│
└── Configuration failure
    ├── Bad config deploy
    └── Feature flag off
    └── Secret rotation
```

---

## 3. Implementation Patterns

```
Chaos Tools:
├── Kubernetes-native
│   ├── Chaos Mesh (CNCF)
│   ├── LitmusChaos
│   └── Crossplane for chaos
│
├── VM-based
│   ├── Gremlin
│   └── Chaos Monkey (Netflix)
│
└── Cloud-native
    ├── AWS Fault Injection Simulator
    └── GCP chaos experiments

Example Chaos Mesh YAML:
```yaml
apiVersion: chaos-mesh.org/v1alpha1
kind: PodChaos
metadata:
  name: pod-kill
spec:
  action: pod-failure
  mode: one
  duration: 30s
```
```

---

## 4. Observability During Chaos

```
Observability Requirements:
├── Metrics
│   ├── Latency (p50, p95, p99)
│   ├── Error rate
│   └── Throughput
│
├── Distributed tracing
│   ├── Trace each request
│   ├── See failure propagation
│   └── Identify bottlenecks
│
├── Logging
│   ├── Correlation IDs
│   └── Structured logging
│   └── Log levels
│
└── Alerts
    ├── Threshold alerts
    └── Anomaly detection
    └── On-call rotation
```

---

## 5. Game Days

```
Game Day Process:
├── Pre-game day
│   ├── Define scenario
│   ├── Plan rollback
│   └── Communicate (don't alarm)
│
├── Execute
│   ├── Run during low traffic
│   └── Observe metrics
│   └── Document observations
│
├── Post-game day
│   ├── What worked
│   ├── What failed (intentionally and not)
│   └── Fix discovered issues
│
└── Example scenarios
    ├── "Kill database primary, verify failover"
    └── "Network partition between two services"
    └── "Add 10x load, verify auto-scaling"
```

---

## Key Patterns

1. **Start simple** - Process crash, not multi-region failure
2. **Blast radius** - Small at first, expand as confidence grows
3. **Stop on degradation** - If system degrades unexpectedly, abort
4. **Document hypothesis** - What should happen before injecting
5. **Automate** - Manual chaos is not repeatable

---

## Anti-Patterns

```
❌ Test in production without guardrails — causing outage
✅ Test in staging first, small blast radius in prod

❌ No rollback plan — can't recover
✅ Always know how to stop the experiment

❌ No hypothesis — random chaos, no learning
✅ Define: "Should X happen when Y fails"

❌ Not observability — can't see what's happening
✅ Ensure metrics/traces visible before test

❌ One-time test — no continuous validation
✅ Automate as part of CI/CD pipeline
```

---

## Quick Reference

| Tool | Focus | Environment |
|---|---|---|
| Chaos Mesh | K8s pod/network chaos | K8s |
| LitmusChaos | K8s, cloud-native | K8s |
| Gremlin | Multi-platform | Any |
| FIS | AWS | AWS |
| Pumba | Docker chaos | Docker |

---

## Decision Tree

```
Ready to start chaos testing?
├── No observability (metrics/traces)   → set up observability first
├── No DLQ / circuit breaker in place   → fix resiliency gaps first
└── Observability and DLQ ready         → start with small blast radius

Which failure to inject first?
├── Single process/pod crash            → start here (simplest, most realistic)
├── Network latency between services    → inject 100-500ms delay
├── External dependency timeout         → mock timeout at the edge
└── AZ failure / disk full              → only after above pass

Chaos in prod or staging?
├── First experiment on a flow          → staging with prod-like data
├── Proven scenario, small blast radius → canary subset of prod
└── Full prod chaos                     → only with rollback plan + on-call ready

Tool selection?
├── Kubernetes cluster                  → Chaos Mesh (CNCF, declarative YAML)
├── AWS                                 → FIS (Fault Injection Simulator)
├── Docker Compose / single host        → Pumba
└── Multi-platform, commercial          → Gremlin
```

---

## Key Rules

1. Define the steady state before every experiment: specific SLO metric (e.g. p99 < 200ms)
2. Write hypothesis before injecting: "If pod X crashes, pod Y should serve from cache"
3. Always have a documented rollback: how to stop the experiment in under 60 seconds
4. Start with the smallest blast radius (one pod, 1% traffic) — expand as confidence grows
5. Abort experiment immediately if unintended degradation is observed
6. Never run chaos in prod without on-call coverage and stakeholder awareness
7. Automate experiments in CI/CD — manual-only chaos is not continuous validation

---

## Implementation

```yaml
# Chaos Mesh: pod failure for 30 seconds
apiVersion: chaos-mesh.org/v1alpha1
kind: PodChaos
metadata:
  name: payment-service-kill
  namespace: chaos-testing
spec:
  action: pod-failure
  mode: one
  duration: 30s
  selector:
    namespaces: [production]
    labelSelectors:
      app: payment-service
```

```yaml
# Chaos Mesh: network latency injection (100ms + 10ms jitter)
apiVersion: chaos-mesh.org/v1alpha1
kind: NetworkChaos
metadata:
  name: db-latency-injection
spec:
  action: delay
  mode: one
  selector:
    namespaces: [production]
    labelSelectors:
      app: api-server
  delay:
    latency: 100ms
    jitter: 10ms
  direction: to
  target:
    selector:
      namespaces: [production]
      labelSelectors:
        app: postgres
    mode: all
  duration: 60s
```

```typescript
// Circuit breaker pattern (defend against dependency failure)
// Use cockatiel or opossum library
import { Policy, ConsecutiveBreaker, SamplingBreaker } from 'cockatiel'

const circuitBreaker = Policy.handleAll()
  .circuitBreaker(10_000, new ConsecutiveBreaker(5))

export async function callExternalService(payload: unknown) {
  return circuitBreaker.execute(() => fetch('/external-api', {
    method: 'POST',
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(3000),  // 3s timeout
  }))
}
// When circuit opens after 5 consecutive failures,
// subsequent calls throw immediately for 10s (no waiting on timeout)
```
