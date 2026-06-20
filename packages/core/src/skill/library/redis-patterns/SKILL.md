---
name: redis-patterns
description: "Redis Patterns: Data structures, cache strategies, pub/sub, distributed locks." 
triggers:
  keywords: ["Redis", "cache", "session", "pub/sub", "rate limit", "distributed lock", "sorted set", "pipeline"]
auto_load_when: "Using Redis for caching or pub/sub"
agent: infra-specialist
tools: ["Read", "Write", "Bash"]
---

# Redis Patterns

**Focus:** In-memory data structures, caching, session storage

## 1. Data Structures

```
String:
├── Simple key-value
├── Used for: cache, counters, flags
└── Commands: SET, GET, INCR

Hash:
├── Field-value pairs
├── Used for: objects, metadata
└── Commands: HSET, HGET, HGETALL

List:
├── Ordered strings
├── Used for: queues, logs
└── Commands: LPUSH, RPOP, LRANGE

Set:
├── Unique strings, no order
├── Used for: tags, unique visitors
└── Commands: SADD, SMEMBERS

Sorted Set:
├── Score-value pairs, ordered
├── Used for: rankings, time-series
└── Commands: ZADD, ZRANGE
```

---

## 2. Caching Strategies

```
Cache patterns:
├── Cache-aside: App checks cache first
├── Write-through: Update cache on write
├── Write-behind: Async cache update
└── Refresh-ahead: Proactive refresh

TTL: Set expiration for all cache keys
```

---

## 3. When to Use Redis

```
Use Redis for:
├── Session storage
├── Real-time features
├── Rate limiting
├── Message queues
├── Pub/sub
├── Leaderboards
└── Caching layer

Avoid Redis for:
├── Primary data store (without persistence)
├── Complex queries
├── Large blobs (>1MB)
└── Data that doesn't fit in RAM
```

---

## 4. Distributed Locks

```
Redlock pattern:
├── Acquire lock with SET NX + TTL
├── Only one client succeeds
├── Release with DEL
└── Add expiration to prevent deadlocks

Consider: Redisson library
```

---

## 5. Pub/Sub

```
Pattern:
├── Channel-based messaging
├── Publisher → Channel → Subscribers
└── Fire-and-forget

Use cases:
├── Real-time notifications
├── Cache invalidation
└── Event distribution
```

---

## 6. Performance Tips

```
Best practices:
├── Use pipelines for bulk ops
├── Choose right data structure
├── Avoid KEYS in production (use SCAN)
├── Monitor memory
└── Use connection pooling
```

---

## 7. Persistence Options

```
RDB (snapshots):
├── Periodic snapshots
├── Good for backups
└── Data loss possible

AOF (append-only):
├── Every write logged
├── Slower, more data
└── More durable
```

---

## Key Patterns

1. **Cache-aside** - check before DB
2. **String/Hash** - for objects
3. **Sorted Set** - rankings
4. **Pub/Sub** - real-time
5. **TTL** - auto-expiration

(End of file - 82 lines)

---

## Anti-Patterns

```
❌ Storing large objects (>1MB) in Redis
✅ Redis for hot, small data; use S3/DB for large blobs

❌ No TTL on cached keys — memory fills up
✅ Every cache key has a TTL; use allkeys-lru eviction policy

❌ KEYS * in production (blocks Redis)
✅ Use SCAN with cursor for key iteration

❌ Using Redis as primary data store
✅ Redis is cache / queue / pub-sub — not source of truth

❌ No Redis Sentinel / Cluster for production
✅ Sentinel for HA; Cluster for horizontal scale
```

---

## Quick Reference

| Use case | Redis type | Command |
|---|---|---|
| Cache key-value | String | SET key val EX 300 |
| Rate limiting | String + INCR | INCR + EXPIRE |
| Session store | Hash | HSET session:id field val |
| Queue | List | LPUSH / BRPOP |
| Pub/sub | Pub/Sub | PUBLISH / SUBSCRIBE |
| Leaderboard | Sorted Set | ZADD / ZRANGE |
| Distributed lock | String + NX | SET lock nx ex 30 |
