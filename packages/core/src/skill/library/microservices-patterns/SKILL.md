---
name: microservices-patterns
description: "Microservices Patterns: Service decomposition, communication, data management, resilience." 
triggers:
  keywords: ["microservice", "service mesh", "API gateway", "circuit breaker", "service discovery", "saga"]
auto_load_when: "Designing or debugging microservices"
agent: architect
tools: ["Read", "Write", "Bash"]
---

# Microservices Patterns

**Focus:** Service boundaries, communication, distributed systems

## 1. Decomposition Strategies

```
How to split services:
├── By business capability (orders, payments, users)
├── By subdomain (DDD bounded contexts)
├── By team ( Conway's Law)
└── By operational need (scale, deployment)

Avoid:
├── By technical layer (all services share DB)
├── Too fine-grained (micromanagement)
└── Too coarse (distributed monolith)
```

---

## 2. Communication Patterns

```
Synchronous (request/response):
├── REST - CRUD, simple queries
├── gRPC - performance, contracts
└── GraphQL - flexible queries

Asynchronous (fire-and-forget):
├── Message queues (Kafka, RabbitMQ)
├── Pub/Sub patterns
└── Event-driven
```

---

## 3. Data Management

```
Database per service:
├── Each service owns its data
├── No shared databases
├── Polyglot persistence allowed

Patterns:
├── API composition (query across services)
├── CQRS (separate read/write models)
└── Saga pattern (distributed transactions)
```

---

## 4. Service Discovery

```
How services find each other:
├── Client-side (Eureka, Consul)
├── Server-side (API Gateway)
└── DNS-based (Cloud providers)

Key: Dynamic registration
```

---

## 5. Resilience Patterns

```
Circuit Breaker:
├── Fail fast after threshold
├── Fallback response
└── Auto-recovery

Retry with Backoff:
├── Exponential backoff
├── Jitter (randomization)
└── Dead letter queue

Bulkhead:
├── Isolate failures
├── Resource pools
└── Fail in isolation
```

---

## 6. API Gateway

```
What it does:
├── Routing
├── Authentication
├── Rate limiting
├── Request/response transformation
└── Protocol translation

Consider: Backend for Frontend (BFF)
```

---

## 7. Observability

```
The Three Pillars:
├── Logging - structured, correlated
├── Metrics - RED metrics (rate, errors, duration)
└── Tracing - request flow across services

Essential for debugging distributed systems
```

---

## 8. When Microservices

```
Use when:
├── Team size > 50 developers
├── Independent deployment needed
├── Different scaling requirements
└── Polyglot needed

Avoid when:
├── Team < 10
├── Tight deadline
├── Simple domain
└── No DevOps maturity
```

---

## Key Patterns

1. **API Gateway** - single entry point
2. **Circuit Breaker** - resilience
3. **Saga** - distributed transactions
4. **Service Discovery** - dynamic routing
5. **Observability** - debug distributed

(End of file - 84 lines)

---

## Anti-Patterns

```
❌ Distributed monolith — services that must deploy together
✅ True loose coupling: each service deploys independently

❌ Synchronous request chains (service A → B → C → D)
✅ Async event-driven for non-critical paths; aggregate at gateway

❌ No idempotency on message consumers
✅ Every consumer deduplicates by message ID

❌ Schema changes without backward compatibility
✅ Additive changes only; use schema registry for events

❌ No distributed tracing across service calls
✅ Propagate trace-id header; instrument with OpenTelemetry
```

---

## Quick Reference

| Pattern | Problem solved | Trade-off |
|---|---|---|
| API Gateway | Single entry point + auth | Extra hop |
| Circuit breaker | Cascade failures | Stale data |
| Saga | Distributed transactions | Complexity |
| CQRS | Read/write optimization | Two models to maintain |
| Event sourcing | Audit trail + replay | Storage growth |
| Sidecar | Cross-cutting concerns | Resource overhead |
| Service mesh | mTLS + observability | Ops complexity |
