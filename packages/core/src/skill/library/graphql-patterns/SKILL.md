---
name: graphql-patterns
description: "GraphQL: Schema design, resolvers, pagination, caching, subscriptions, vs REST decisions" 
triggers:
  extensions: [".graphql", ".gql", ".ts"]
  keywords: ["GraphQL", "query", "mutation", "resolver", "schema", "Apollo", "DataLoader"]
auto_load_when: "Building GraphQL APIs or clients"
agent: architect
tools: ["Read", "Write", "Bash"]
---

# GraphQL Patterns

**Focus:** When to choose GraphQL, schema architecture, data fetching strategies

## 1. When to Use GraphQL

```
Choose GraphQL when:
├── Multiple clients (web, mobile, TV) with different needs
├── Complex domain with many related entities
├── Client needs flexible queries (dashboard builders)
└── Frequent mobile bandwidth constraints

Choose REST when:
├── Simple CRUD operations
├── Public API with stable, predictable responses
├── Caching at CDN level is critical
└── Team unfamiliar with GraphQL
```

---

## 2. Schema Design Patterns

```
Schema structure:
├── Query: read operations
├── Mutation: write operations
├── Subscription: real-time updates
└── Types: objects, inputs, enums, scalars

Naming conventions:
├── Nouns for types (User, Order)
├── Verbs for operations (createUser, updateOrder)
├── Use plural for lists (users, orders)
└── Prefix mutations with action (create, update, delete)
```

---

## 3. Pagination Patterns

```
Offset-based (simple):
├── Arguments: first, after (cursor), last, before
├── Good for: sequential browsing
└── Problem: expensive on large offsets

Cursor-based (efficient):
├── Use: opaque cursor string
├── Good for: infinite scroll, large datasets
└── Never expose DB IDs directly

Connection pattern:
├── nodes: actual data array
├── pageInfo: hasNextPage, hasPreviousPage, startCursor, endCursor
└── Standardized: relay-spec compatible
```

---

## 4. Caching Strategies

```
Client-side:
├── Normalized cache (Apollo Client)
├── Key by type + ID
└── Optimistic updates

Server-side:
├── DataLoader: batch + cache
├── Use for: N+1 prevention
└── Per-request caching

CDN challenges:
├── Complex: varies by query
└── Solution: persisted queries, POST cache
```

---

## 5. Subscription Patterns

```
Implementation options:
├── WebSockets: full-duplex, persistent
├── Server-Sent Events: one-way, simpler
└── Polling: fallback, simple

Design patterns:
├── Subscribe to entity changes (userUpdated)
├── Subscribe to collections (newOrders)
└── Subscribe to global events (broadcast)

Reconnection:
├── Exponential backoff
├── Resume with last known state
└── Refetch on disconnect
```

---

## 6. Resolver Patterns

```
Resolver structure:
├── Root (previous result)
├── Args (query arguments)
├── Context (auth, services)
└── Info (query metadata)

DataLoader pattern:
├── Batch: collect IDs across field resolution
├── Cache: dedupe within request
└── Promise: async resolution

Error handling:
├── GraphQL errors: partial data, error array
└── Security: never leak internal errors
```

---

## Key Patterns

1. **Schema-first** - Design types before implementation
2. **DataLoader** - Prevent N+1 queries
3. **Connection** - Standard pagination
4. **Subscriptions** - Use sparingly, WebSocket over SSE
5. **Errors in response** - Don't throw, return errors array

---

## Anti-Patterns

```
❌ N+1 queries — resolver fetches per-item inside list
✅ Use DataLoader to batch & deduplicate DB calls

❌ Returning full objects when client needs 2 fields
✅ Let GraphQL projection do the work; never over-fetch in resolvers

❌ Deeply nested mutations that do too much
✅ Single-responsibility mutations, max 2 levels deep

❌ No query depth/complexity limits
✅ Set max depth (10) and max complexity (1000) per query

❌ Exposing internal DB IDs as GraphQL IDs directly
✅ Opaque cursor-based IDs for relay-compatible pagination
```

---

## Quick Reference

| Scenario | Solution | Library |
|---|---|---|
| Batch DB calls | DataLoader | dataloader |
| Input validation | Input types + Zod/yup | graphql-shield |
| Auth per field | Field-level directives | graphql-shield |
| Real-time | Subscriptions over WS | graphql-ws |
| File upload | multipart request | graphql-upload |
| Schema-first | SDL + codegen | @graphql-codegen |
| Code-first | Resolver decorators | TypeGraphQL / Pothos |
