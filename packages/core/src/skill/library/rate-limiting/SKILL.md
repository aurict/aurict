---
name: rate-limiting
description: "API rate limiting: token bucket, sliding window, Redis-based, express-rate-limit, Cloudflare, per-user vs global."
triggers:
  deps: ["express-rate-limit", "rate-limiter-flexible", "@upstash/ratelimit"]
  keywords: ["rate limit", "throttle", "429", "too many requests", "rate-limiter"]
auto_load_when: "Implementing rate limiting on APIs or protecting endpoints"
tags: ["api", "security", "rate-limiting", "redis", "express"]
priority: 7
---

# Rate Limiting Patterns

## Quick Reference

```
Algorithm:    Token bucket (smooth bursts) vs Fixed window (simple) vs Sliding window (accurate)
Express:      rateLimit({ windowMs: 60_000, max: 100, standardHeaders: true })
Redis:        rate-limiter-flexible → survives restarts, works across replicas
Upstash:      Ratelimit.slidingWindow(10, "1 m") → serverless-friendly Redis
Headers:      RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset, Retry-After
Status code:  429 Too Many Requests (not 403)
```

---

## Decision Tree

```
Scope of limiting?
├── Global (all users) → simple in-memory sufficient for single server
├── Per IP           → easy but bypassable; good for anonymous endpoints
├── Per user/API key → accurate; requires auth middleware to run first
└── Per endpoint     → different limits for /login (strict) vs /search (relaxed)

Single server or distributed?
├── Single server  → in-memory (express-rate-limit without store)
├── Multiple replicas → Redis store (rate-limiter-flexible, @upstash/ratelimit)
└── Edge/serverless   → Upstash Ratelimit or Cloudflare rate limiting rules

Algorithm?
├── Fixed window    → simplest; allows burst at window reset boundary
├── Sliding window  → accurate, no burst at boundary; slightly more complex
└── Token bucket    → smooth rate; good for endpoints where burst is acceptable

What to do on limit exceeded?
├── Return 429 with Retry-After header
├── Log the IP/userId for abuse monitoring
└── Consider: queue instead of reject for non-critical background jobs
```

---

## Anti-Patterns

- No rate limiting on auth endpoints — brute-force attacks; /login and /reset-password need strict limits (5-10 req/min)
- Same limit for all endpoints — /search needs different limits than /payment; apply per-route
- Returning 403 instead of 429 — 429 is the correct status for rate limiting; clients can auto-retry with backoff
- Not sending Retry-After header — clients don't know when to retry; always include it
- In-memory store on multi-replica deployment — each replica has independent counter; users get 10x the intended limit
- Rate limiting after expensive operations — check rate limit BEFORE doing DB queries, not after
- Blocking legitimate bursts entirely — use token bucket to allow short bursts while maintaining average rate

---

## Key Rules

1. Auth endpoints (login, password reset, OTP) need the strictest limits: 5-10 requests/min max
2. Always return `Retry-After` header — RFC 6585 standard; clients can implement exponential backoff
3. Use Redis store for multi-replica or serverless — in-memory doesn't share state across instances
4. Rate limit by user ID (not just IP) after authentication — IP-based only is bypassable with proxies
5. Sliding window > fixed window — avoids the "reset burst" problem at window boundaries
6. Return `RateLimit-*` headers on ALL responses (not just 429) — clients can implement proactive throttling

---

## Implementation

**Express per-route rate limiting:**
```typescript
import rateLimit from "express-rate-limit"
import RedisStore from "rate-limit-redis"
import { createClient } from "redis"

const redis = createClient({ url: process.env.REDIS_URL })

// Strict limit for auth
const authLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  store: new RedisStore({ sendCommand: (...args) => redis.sendCommand(args) }),
  handler: (req, res) => res.status(429).json({ error: "Too many attempts", retryAfter: 60 }),
})

// Relaxed limit for general API
const apiLimiter = rateLimit({ windowMs: 60_000, max: 200, standardHeaders: "draft-7" })

app.post("/auth/login", authLimiter, loginHandler)
app.use("/api", apiLimiter)
```

**Upstash for serverless / edge:**
```typescript
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 m"),
  analytics: true,
})

export async function middleware(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "anonymous"
  const { success, reset, remaining } = await ratelimit.limit(ip)
  if (!success) {
    return new Response("Too many requests", {
      status: 429,
      headers: { "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)) },
    })
  }
}
```
