---
name: event-driven-patterns
description: "Event-driven: Event sourcing, CQRS, event patterns, choreography vs orchestration." 
triggers:
  keywords: ["event", "emit", "subscribe", "pub/sub", "event bus", "event sourcing", "CQRS", "choreography"]
auto_load_when: "Designing event-driven systems"
agent: infra-specialist
tools: ["Read", "Write", "Bash"]
---

# Event-Driven Architecture Patterns

**Focus:** Events, commands, event sourcing

---

## 1. When to Use Event-Driven

```
When event-driven makes sense:

├── Multiple subsystems need same data
│   └── Orders affect inventory, notifications, analytics
│   └── Each service owns its data
│
├── Loose coupling required
│   └── Services shouldn't call each other directly
│   └── Teams work independently
│
├── Real-time reactions needed
│   └── Notifications, dashboards, sync
│   └── Users see updates immediately
│
├── Audit trail important
│   └── Every change recorded
│   └── Replay for debugging
│
└── Scalability needed
    └── Handle burst traffic
    └── Decouple producers from consumers
```

```
When NOT to use:

├── Simple CRUD app
│   └── Direct database access is simpler
│
├── Strong consistency required
│   └── Eventual consistency issues
│   └── Use synchronous when can't lose data
│
├── Small team
│   └── Complexity overhead not worth it
│
└── Debugging difficult
    └── Hard to trace event chains
```

---

## 2. Event Patterns

```
Event types:

├── Domain events
    └── Something happened in domain
    └── Orders: OrderPlaced, OrderShipped
    └── Meaningful to business
│
├── Integration events
    └── Cross-service communication
    └── OrderPlaced → NotifyCustomer
    └── Technical, not business
│
└── Commands
    └── Intent to do something
    └── Expects response/action
    └── Not an event, a request
```

```
Event structure:
├── Event type: what happened
├── Payload: data about event
├── Metadata: timestamp, source, correlation ID
└── Event ID: unique identifier
```

---

## 3. Event Sourcing

```
When to use event sourcing:

├── Need complete audit trail
│   └── Every change stored as event
│   └── Can replay to any point
│
├── Complex state changes
│   └── State derived from event history
│   └── Shopping cart, workflow engines
│
├── Temporal queries
│   └── What was state at time T?
│   └── Reports, analytics, debugging
│
└── Long-running processes
    └── Saga, workflows
    └── Can resume from checkpoint
```

```
Challenges:
├── Learning curve for team
├── Event schema evolution (versioning)
├── Snapshotting for performance
└── Storage size over time
```

---

## 4. CQRS Pattern

```
When to use CQRS:

├── Read and write patterns differ
│   └── Writes: complex validation
│   └── Reads: multiple views, aggregations
│
├── Different scaling needs
│   └── Many more reads than writes
│   └── Scale read replicas independently
│
├── Multiple read models
│   └── Same data, different formats
│   └── Product: list view, detail view, admin view
│
└── Performance critical
    └── Optimized read paths
    └── Denormalized for queries
```

```
Implementation:
├── Write side: normalized model
├── Read side: optimized projections
├── Sync: events update read models
└── Eventually consistent
```

---

## 5. Choreography vs Orchestration

```
Choreography (decentralized):

├── Each service knows its job
│   └── Orders: emit OrderPlaced
│   └── Inventory: listens, updates stock
│   └── Notifications: listens, sends email
│
├── Pros: loose coupling, independent
├── Cons: hard to track flow, debugging
└── Use when: simple flows, few services
```

```
Orchestration (centralized):

├── Orchestrator directs the flow
│   └── OrderService coordinates
│   └── Calls Inventory, then Notifications
│
├── Pros: clear flow, easier debugging
├── Cons: orchestrator is bottleneck
└── Use when: complex flows, need control
```

---

## 6. Idempotency

```
Why idempotency matters:

├── Events can be delivered multiple times
├── Network failures cause retries
└── Must handle duplicate events

How to achieve:

├── Event ID tracking
    └── Store processed event IDs
    └── Skip if already processed
│
├── Natural idempotency
    └── Same input = same output
    └── "Set status to shipped" is idempotent
│
└── Deduplication table
    └── Store event ID + result
    └── Fast lookup for duplicates
```

---

## Key Patterns

1. **Events over direct calls** — Loose coupling
2. **Idempotent consumers** — Handle duplicates
3. **Version events** — Plan for schema changes
4. **Choreography for simple, orchestration for complex**
5. **CQRS when read/write patterns differ**

---

## Anti-Patterns

```
❌ Event consumers with direct coupling to producers
✅ Events via broker (Kafka/SNS/EventBridge) — producer never calls consumer

❌ Events with no schema contract (free-form JSON)
✅ Schema registry (Confluent/Glue) or Zod schema for every event type

❌ Event handlers that throw and cause infinite retry loops
✅ Bounded retry + dead letter queue; separate poison pill handling

❌ Choreography only — no visibility into multi-step workflows
✅ Add distributed tracing correlation ID across all event hops

❌ Mutable events — changing an event after publish
✅ Events are immutable facts in the past; append-only log
```

---

## Quick Reference

| Pattern | When | Complexity |
|---|---|---|
| Choreography | Loose coupling, simple flows | Low |
| Orchestration | Complex workflows, visibility | Medium |
| Saga | Distributed transaction rollback | High |
| Event sourcing | Full audit trail | High |
| CQRS + events | Read/write separation | High |

---

## Decision Tree

```
Choreography or orchestration?
├── < 5 services, simple linear flow         → choreography (each service reacts)
├── Complex workflow with compensation       → orchestration (saga coordinator)
└── Both: choreography for integration,     → hybrid
     orchestration for business workflows

Event sourcing or standard events?
├── Need full audit trail + replay           → event sourcing (append-only log)
├── Cross-service integration only          → standard domain events
└── Complex state machine                   → event sourcing

CQRS?
├── Read patterns differ from write         → CQRS (separate models)
├── Scale reads independently               → CQRS with read replicas
└── Simple CRUD, same patterns              → no CQRS (unnecessary complexity)

Which broker?
├── Very high throughput + replay            → Kafka
├── Simple queue + managed                   → SQS/SNS
├── Multi-service event bus + rules          → EventBridge
└── Lightweight / self-hosted               → RabbitMQ
```

---

## Key Rules

1. Events are immutable facts in the past — never mutate after publish
2. Idempotent consumers always — check event ID before processing
3. Schema contract for every event type — schema registry or Zod schema
4. Dead letter queue for every consumer — bounded retry + alert on DLQ
5. Correlation ID in every event — propagate across all hops for tracing
6. Choreography for loose coupling; orchestration when you need visibility
7. Versioned event types (`OrderPlacedV2`) — never break existing consumers

---

## Implementation

```typescript
// Type-safe event bus with BullMQ (Node.js)
import { Queue, Worker } from 'bullmq'
import { z } from 'zod'

// Event schemas — single source of truth
const OrderPlacedSchema = z.object({
  eventType:     z.literal('order.placed'),
  orderId:       z.string(),
  userId:        z.string(),
  totalCents:    z.number(),
  correlationId: z.string(),
  occurredAt:    z.string(),
})
type OrderPlaced = z.infer<typeof OrderPlacedSchema>

const orderQueue = new Queue<OrderPlaced>('orders', { connection: redis })

// Publisher
export async function placeOrder(userId: string, items: Item[]) {
  const order = await db.order.create({ data: { userId, items } })
  await orderQueue.add('order.placed', {
    eventType: 'order.placed', orderId: order.id,
    userId, totalCents: order.totalCents,
    correlationId: crypto.randomUUID(),
    occurredAt: new Date().toISOString(),
  })
  return order
}

// Consumer — idempotent + schema validated
const worker = new Worker<OrderPlaced>('orders', async (job) => {
  const event = OrderPlacedSchema.parse(job.data)

  // Idempotency check
  const already = await redis.get(`event:${job.id}`)
  if (already) return

  switch (event.eventType) {
    case 'order.placed':
      await fulfillmentService.reserve(event.orderId)
      await notificationService.sendConfirmation(event.userId)
      break
  }

  await redis.set(`event:${job.id}`, '1', { EX: 86400 })
}, { connection: redis })

worker.on('failed', (job, err) => {
  console.error({ correlationId: job?.data.correlationId, err })
})
```

| Broker | Throughput | Durability |
|---|---|---|
| Kafka | Very high | Durable replay |
| RabbitMQ | High | Configurable |
| SNS/SQS | High | Managed |
| EventBridge | Medium | Managed |
