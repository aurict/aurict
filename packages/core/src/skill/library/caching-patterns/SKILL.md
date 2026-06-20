---
name: caching-patterns
description: "Caching: Cache strategies, invalidation, TTL, CDN patterns, and performance optimization." 
triggers:
  extensions: [".ts"]
  keywords: ["cache", "redis", "TTL", "invalidate", "memoize", "stale", "revalidate"]
auto_load_when: "Implementing caching strategy"
agent: infra-specialist
tools: ["Read", "Write", "Bash"]
---

# Caching Patterns

**Focus:** Performance, consistency, scalability

---

## 1. Cache Strategies

```
When to use each strategy:

├── Cache-aside (most common)
│   └── Flow: app checks cache → miss → fetch from DB → write cache
│   └── Use when: read-heavy, data changes infrequently
│   └── Risk: cache stampede (simultaneous misses)
│
├── Write-through
│   └── Flow: write to cache and DB simultaneously
│   └── Use when: data must be immediately consistent
│   └── Risk: write latency increase
│
├── Write-back
│   └── Flow: write to cache → async write to DB
│   └── Use when: write-heavy, can tolerate eventual consistency
│   └── Risk: data loss if cache fails before sync
│
└── Cache-first
    └── Flow: check cache, fallback to DB only on miss
    └── Use when: stale data acceptable
    └── Risk: serving outdated data
```

---

## 2. Cache Invalidation

```
When to use invalidation strategy:

├── Time-based (TTL)
│   └── Use when: eventual consistency acceptable
│   └── Set TTL based on data volatility
│   └── Simple, no need for complex invalidation
│
├── Event-based
│   └── Use when: need immediate consistency
│   └── Invalidate on write (Pub/Sub, cache invalidate message)
│   └── Complex but precise
│
├── Version-based
│   └── Use when: multiple versions of data
│   └── Key includes version: user:v2
│   └── On write, increment version and write new key
│
└── Manual
    └── Use when: rare need to clear specific data
    └── Admin endpoints for cache clearing
```

```
TTL guidelines:
├── Static content: 1 day to 1 week
├── User profile: 5-15 minutes
├── List queries: 30 seconds to 5 minutes
└── Search results: 1-5 minutes
```

---

## 3. CDN Patterns

```
When to use CDN:

├── Static assets
│   └── Images, CSS, JS, fonts
│   └── Cache at edge, long TTL
│   └── Serve close to user
│
├── API responses
│   └── Public, unpersonalized endpoints
│   └── Cache at edge with short TTL
│   └── Vary by Accept-Language, GeoIP
│
└── Not for CDN
    └── Personalized data
    └── Real-time data
    └── Frequently changing content
```

---

## 4. Cache Location

```
Where to cache:

├── Client-side
│   ├── LocalStorage, SessionStorage
│   ├── Use when: data doesn't change often
│   ├── Cache-Control: max-age
│
├── CDN edge
│   ├── Use when: public, static content
│   ├── Cache-Control: s-maxage, public
│
├── API gateway
│   ├── Use when: multiple backend services
│   ├── Vary: headers, query params
│
├── Application (Redis/Memcached)
│   ├── Use when: shared across instances
│   ├── Session data, computed values
│
└── Database query cache
    ├── Use when: expensive queries
    ├── Query result caching
```

---

## 5. Common Issues

```
How to handle:

├── Cache stampede
│   ├── Problem: many requests hit DB simultaneously
│   ├── Solution: random jitter, request coalescing, locks
│
├── Thundering herd
│   ├── Problem: all requests retry at once after failure
│   ├── Solution: exponential backoff, circuit breaker
│
├── Cache penetration
│   ├── Problem: requests for non-existent keys
│   ├── Solution: cache null responses, bloom filters
│
└── Memory pressure
    ├── Problem: cache consumes too much memory
    └── Solution: LRU eviction, max memory limits
```

---

## Key Patterns

1. **Cache on read, invalidate on write** — Most common pattern
2. **Two levels** — Local (in-memory) + distributed (Redis)
3. **Graceful degradation** — App works without cache
4. **Monitor hit rate** — Target 90%+ for frequently accessed data
5. **Stale-while-revalidate** — Serve stale while updating

---

## Anti-Patterns

```
❌ Caching mutable data without TTL
✅ Every cache entry has a TTL or explicit invalidation

❌ Cache stampede — all entries expire simultaneously
✅ Jitter on TTLs; probabilistic early expiration

❌ Caching at multiple layers with different stale states
✅ Define cache hierarchy: browser → CDN → app → DB query

❌ Not caching because "it's complex"
✅ Start with simple TTL caching; add complexity only if needed

❌ Sensitive data in shared caches
✅ User-specific data in private cache (no CDN); strip auth headers
```

---

## Quick Reference

| Layer | Tool | TTL guidance |
|---|---|---|
| Browser | Cache-Control, ETag | Static: 1y, HTML: no-cache |
| CDN | Cloudflare / Fastly | Vary on Accept-Encoding |
| App memory | node-cache / LRU | Short TTL, small hot set |
| Distributed | Redis | Session: 24h, API: 5-60s |
| DB query | Prisma + Redis | Heavy aggregations |
| Full-page | Next.js ISR | revalidate: 60 |

---

## Decision Tree

```
Which cache strategy?
├── Read-heavy, infrequent writes          → cache-aside (check → miss → fetch → write)
├── Must be immediately consistent        → write-through (write cache + DB together)
├── Write-heavy, eventual consistency ok  → write-back (cache first, async DB sync)
└── Stale data acceptable, serve fast     → cache-first (only miss hits DB)

Which cache layer?
├── Single user / browser                 → Cache-Control header (no-store sensitive data)
├── Public static content                 → CDN edge (Cloudflare / Fastly)
├── Shared across app instances           → Redis (distributed)
├── Hot data per process                  → node-cache / LRU-cache (in-memory)
└── DB query results                      → Redis with query hash as key

Cache invalidation strategy?
├── Acceptable eventual consistency       → TTL (set and forget)
├── Must invalidate on write              → event-based (publish invalidation message)
├── Versioned data                        → key versioning: `user:v2:${id}`
└── Admin-triggered clear                 → manual cache delete endpoint
```

---

## Key Rules

1. Every cache entry must have a TTL — never cache without expiry
2. Add random jitter to TTLs to prevent cache stampede (± 10–20%)
3. Cache key includes all parameters that affect the response
4. Never cache user-specific data in shared/CDN cache
5. App works correctly when cache is empty — graceful degradation
6. Monitor hit rate: target > 80%; below that, re-examine what you're caching
7. Two-level caching: L1 in-process (sub-ms) → L2 Redis (1-5ms)

---

## Implementation

```typescript
// Two-level cache: L1 LRU + L2 Redis (cache-aside pattern)
import LRUCache from 'lru-cache'
import { redis } from '@/lib/redis'

const l1 = new LRUCache<string, unknown>({ max: 500, ttl: 30_000 })

async function getWithCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds = 60
): Promise<T> {
  // L1 hit
  const l1hit = l1.get(key)
  if (l1hit !== undefined) return l1hit as T

  // L2 hit
  const l2hit = await redis.get(key)
  if (l2hit) {
    const value = JSON.parse(l2hit) as T
    l1.set(key, value)  // warm L1
    return value
  }

  // Cache miss — fetch from source
  const value = await fetcher()
  const jitteredTtl = ttlSeconds + Math.floor(Math.random() * ttlSeconds * 0.2)

  await redis.set(key, JSON.stringify(value), { EX: jitteredTtl })
  l1.set(key, value)
  return value
}

// Invalidation on write
async function updateUser(id: string, data: Partial<User>) {
  await db.user.update({ where: { id }, data })
  // Invalidate all related keys
  await redis.del(`user:${id}`)
  await redis.del(`user:profile:${id}`)
  l1.delete(`user:${id}`)
}

// Cache stampede prevention with lock
async function getWithLock<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const lockKey = `lock:${key}`
  const locked = await redis.set(lockKey, '1', { NX: true, EX: 5 })
  if (!locked) {
    // Another process is fetching — poll briefly
    await new Promise(r => setTimeout(r, 100))
    const cached = await redis.get(key)
    if (cached) return JSON.parse(cached) as T
  }
  const value = await fetcher()
  await redis.set(key, JSON.stringify(value), { EX: 60 })
  await redis.del(lockKey)
  return value
}
```
