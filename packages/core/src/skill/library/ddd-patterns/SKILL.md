---
name: ddd-patterns
description: "DDD Patterns: Domain logic, aggregates, value objects, bounded contexts, domain events." 
triggers:
  keywords: ["domain", "aggregate", "entity", "value object", "repository", "bounded context", "domain event", "ubiquitous language"]
auto_load_when: "Designing domain models or business logic"
agent: architect
tools: ["Read", "Write", "Bash"]
---

# Domain-Driven Design Patterns

**Focus:** Ubiquitous language, bounded contexts, domain modeling

## 1. Building Blocks

```
DDD Tactical Patterns:
├── Entities - identity, mutable
├── Value Objects - immutable, no identity
├── Aggregates - consistency boundary
├── Domain Services - stateless logic
├── Domain Events - something happened
├── Repositories - collection-like access
└── Factories - complex creation
```

---

## 2. Entity vs Value Object

```
Entity:
├── Has unique ID
├── Mutable state
├── Equality by ID
└── Example: User, Order, Product

Value Object:
├── No ID
├── Immutable
├── Equality by attributes
└── Example: Address, Money, Color
```

---

## 3. Aggregate Pattern

```
Aggregate Root:
├── Entry point for access
├── Enforces invariants
├── Controls changes
└── Example: Order (contains OrderItems)

Aggregate Rules:
├── One root per aggregate
├── Only root accessible from outside
├── Changes via root only
├── Consistency boundary
└── Transaction scope = aggregate
```

---

## 4. Bounded Context

```
What is a BC:
├── Explicit boundary
├── Own domain model
├── Own ubiquitous language
└── Own team ownership

How to identify:
├── Different domain vocabularies
├── Different team responsibilities
├── Different scaling needs
└── Different DB schemas
```

---

## 5. Domain Events

```
Event structure:
├── Unique ID
├── Occurred at timestamp
├── Event type name
├── Payload (what happened)

When to use:
├── Decouple components
├── Audit trail
├── CQRS read models
└── Event sourcing
```

---

## 6. When to Apply DDD

```
Apply DDD when:
├── Complex business domain
├── Ubiquitous language exists
├── Domain experts available
├── Long-term investment
└── Team understands patterns

Avoid when:
├── CRUD-heavy app
├── Simple domain
├── No domain expert
└── Tight timeline
```

---

## 7. Repository Pattern

```
Repository:
├── Collection metaphor
├── Methods: add, remove, getById
├── Query methods (find)
└── Implementation: DB or API

Interface in domain
Implementation in infrastructure
```

---

## 8. Service Layer vs Domain Service

```
Application Service:
├── Orchestrates use cases
├── Transaction management
├── Coordinates entities
└── Thin, declarative

Domain Service:
├── Pure business logic
├── Stateless
├── Between entities
└── When logic doesn't fit entity
```

---

## Key Patterns

1. **Aggregate** - transactional boundary
2. **Value Object** - immutable descriptors
3. **Bounded Context** - model boundary
4. **Ubiquitous Language** - shared vocabulary
5. **Domain Events** - decoupled communication

(End of file - 90 lines)

---

## Anti-Patterns

```
❌ Anemic domain model (entities are just data structs)
✅ Rich entities with behavior — User.changeEmail(), Order.place()

❌ Aggregate that spans too many entities
✅ Keep aggregates small; one transaction = one aggregate

❌ Domain events published synchronously blocking the caller
✅ Collect events in aggregate; dispatch after transaction commits

❌ Business logic in application services or controllers
✅ Logic belongs to entities and domain services

❌ Exposing aggregate internals to the outside
✅ Only aggregate root is accessible from outside; internal objects are private
```

---

## Quick Reference

| Concept | Role | Rule |
|---|---|---|
| Entity | Identity + lifecycle | Mutable; identified by ID |
| Value Object | Describe by value | Immutable; no identity |
| Aggregate | Consistency boundary | One transaction per aggregate |
| Domain Event | Side effect trigger | Immutable; past tense name |
| Repository | Persistence facade | Returns full aggregates |
| Domain Service | Stateless logic | When logic doesn't fit entity |
| Bounded Context | Linguistic boundary | Each team owns its context |

---

## Decision Tree

```
Apply DDD at all?
├── Complex business logic, not CRUD   → yes
├── Multiple domain experts involved   → yes
├── Long-lived, growing codebase       → yes
├── Simple CRUD with no invariants     → no (over-engineering)
└── Tight deadline / MVP               → no (apply later)

Entity or Value Object?
├── Has unique identity (ID), mutates  → Entity
├── Defined only by its attributes     → Value Object (immutable record)
├── Can be shared / has no lifecycle   → Value Object (Money, Address, DateRange)
└── Has lifecycle + business behavior  → Entity

Aggregate boundary?
├── Always consistent together         → same aggregate (Order + OrderItems)
├── Eventually consistent is OK        → separate aggregates + domain event
├── Only one thing changes at a time   → likely separate aggregates
└── Large aggregate → always loaded    → split it — keep aggregates small

Domain Service or Entity method?
├── Logic belongs to one entity        → entity method (user.changeEmail())
├── Logic spans multiple entities      → Domain Service (stateless)
└── Crosses bounded contexts           → anti-corruption layer or domain event
```

---

## Key Rules

1. Aggregate root is the only entry point — never access inner entities from outside
2. Keep aggregates small — one transaction = one aggregate; avoid "god aggregates"
3. Collect domain events inside aggregate; dispatch AFTER transaction commits
4. Rich domain model: entities enforce their own invariants via methods, not data bags
5. Value Objects are immutable — create new instance on every change
6. Ubiquitous language: code names must match domain expert vocabulary exactly
7. One repository per aggregate root — never query aggregate internals directly

---

## Implementation

```typescript
// Value Object — immutable, equality by attributes
class Money {
  private constructor(readonly amount: number, readonly currency: string) {
    if (amount < 0) throw new Error('Amount must be non-negative')
  }
  static of(amount: number, currency: string) { return new Money(amount, currency) }
  add(other: Money): Money {
    if (other.currency !== this.currency) throw new Error('Currency mismatch')
    return new Money(this.amount + other.amount, this.currency)
  }
  equals(other: Money) { return this.amount === other.amount && this.currency === other.currency }
}

// Aggregate root — enforces invariants, collects events
class Order {
  private readonly _items: OrderItem[] = []
  private readonly _events: DomainEvent[] = []
  private _status: 'pending' | 'placed' | 'cancelled' = 'pending'

  constructor(readonly id: string, readonly customerId: string) {}

  addItem(productId: string, price: Money, qty: number) {
    if (this._status !== 'pending') throw new Error('Cannot modify placed order')
    this._items.push(new OrderItem(productId, price, qty))
  }

  place() {
    if (this._items.length === 0) throw new Error('Order must have items')
    this._status = 'placed'
    this._events.push({ type: 'OrderPlaced', orderId: this.id, at: new Date() })
  }

  get total() {
    return this._items.reduce((sum, item) => sum.add(item.subtotal), Money.of(0, 'USD'))
  }

  collectEvents(): DomainEvent[] {
    const events = [...this._events]
    this._events.length = 0
    return events
  }
}

// Application layer — dispatch events after commit
async function placeOrderUseCase(orderId: string) {
  const order = await orderRepo.findById(orderId)
  if (!order) throw new Error('ORDER_NOT_FOUND')

  order.place()
  await orderRepo.save(order)          // commit first

  const events = order.collectEvents()
  for (const event of events) await eventBus.publish(event)  // then publish
}
```
