---
name: message-queues
description: "Message Queues: Queue vs pub/sub, ordering guarantees, consumers, and delivery patterns." 
triggers:
  keywords: ["queue", "BullMQ", "RabbitMQ", "Kafka", "SQS", "job", "worker", "retry", "dead letter"]
auto_load_when: "Implementing message queues or background jobs"
agent: infra-specialist
tools: ["Read", "Write", "Bash"]
---

# Message Queue Patterns

**Focus:** Async communication, reliability, scalability

---

## 1. Queue vs Pub/Sub

```
When to use Queue:

├── Point-to-point
│   └── One producer, one consumer (or competing consumers)
│   └── Example: processing orders, sending emails
│   └── Each message processed once
│
├── Task processing
│   └── Background jobs with workers
│   └── Rate limiting, load distribution
│   └── Example: image processing, report generation
│
└── Decoupling
    └── Producer doesn't need immediate response
    └── Different scaling requirements
```

```
When to use Pub/Sub:

├── Event broadcasting
    └── One publisher, multiple subscribers
    └── Example: notifications to multiple services
    └── Event-driven architecture
│
├── Fan-out patterns
│   └── Same message to multiple consumers
│   └── Example: analytics, logging, notifications
│
└── Independent components
    └── Services don't need to know about each other
    └── Loose coupling between services
```

---

## 2. Delivery Guarantees

```
At-least-once (most common):
├── Producer sends message
├── Consumer processes and acknowledges
├── If ack missing, message re-delivered
├── Risk: duplicate processing
├── Solution: idempotent consumers
└── Use when: duplicates OK, but no loss OK

At-most-once:
├── Send and forget, no ack needed
├── Risk: message loss
├── Use when: duplicates worse than loss
└── Example: metrics, telemetry
```

```
Exactly-once (rarely needed):
├── Too expensive for most use cases
├── Requires: transactional outbox pattern
├── Two-phase commit (expensive)
└── Use when: critical financial transactions
```

---

## 3. Ordering Guarantees

```
When to expect ordering:

├── Within partition (Kafka, RabbitMQ)
│   └── Messages in same queue/partition ordered
│   └── Use partition key to group related data
│   └── Example: same user events in order
│
├── No ordering (default)
│   └── Messages may arrive out of order
│   └── Consumer must handle reordering
│   └── Add sequence numbers or timestamps
│
└── Single consumer
    └── Only one consumer per queue
    └── Guarantees order
    └── Trade-off: no parallelism
```

---

## 4. Consumer Patterns

```
Competing consumers:
├── Multiple workers processing same queue
├── Each message processed by one worker
├── Use when: high throughput needed
├── Load balancing automatic
└── Example: background job processing

Fan-out consumer:
├── Each consumer gets all messages
├── Use when: multiple independent processing needed
└── Example: logging + analytics + notifications

Sequential consumer:
├── Single consumer, ordered processing
├── Use when: order matters
├── Trade-off: throughput limited
└── Example: state machine transitions
```

```
Dead Letter Queue (DLQ):
├── Failed messages after max retries
├── Inspect and reprocess manually
├── Prevent losing messages
└── Always configure DLQ for production
```

---

## 5. Message Design

```
What to include in messages:

├── Message ID
│   └── Unique identifier
│   └── For deduplication, tracing
│
├── Timestamp
│   └── When created
│   └── For ordering, TTL
│
├── Correlation ID
│   └── Links to original request
│   └── For tracing
│
├── Payload
│   └── Business data
│   └── Keep size reasonable (< 1MB)
│
└── Metadata
    └── Headers, routing info
    └── Avoid sensitive data
```

---

## Key Patterns

1. **Idempotent consumers** — Process same message multiple times safely
2. **DLQ for failures** — Never lose messages permanently
3. **Correlation IDs** — Trace messages through system
4. **Size limits** — Keep messages small (< 1MB)
5. **Backpressure** — Limit queue depth when consumers slow

---

## Anti-Patterns

```
❌ Fire-and-forget without acknowledging (message lost on crash)
✅ Explicit ack after successful processing; use dead letter queue

❌ Large payloads in queue messages (>256KB)
✅ Store payload in S3/DB; put reference ID in message

❌ No idempotency — processing same message twice causes duplicate
✅ Idempotency key per message; deduplicate before processing

❌ One queue for everything (low priority blocks high)
✅ Separate queues by priority; separate consumer groups

❌ No monitoring on queue depth
✅ Alert on queue depth > threshold and age > SLA
```

---

## Quick Reference

| System | Use case | Key feature |
|---|---|---|
| BullMQ (Redis) | Background jobs | Cron, retry, priority |
| RabbitMQ | Complex routing | Exchanges, topics |
| Kafka | Event streaming | High throughput, replay |
| SQS | AWS-native | Managed, DLQ built-in |
| Inngest | Serverless workflows | Step functions |
