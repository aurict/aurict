---
name: edge-computing
description: "Edge functions, serverless edge, Cloudflare Workers, and edge computing patterns for low-latency applications." 
triggers:
  keywords: ["edge", "CDN", "Cloudflare Workers", "Vercel edge", "middleware", "edge function", "serverless"]
auto_load_when: "Implementing edge functions or CDN logic"
agent: devops-engineer
tools: ["Read", "Write", "Bash"]
---

# Edge Computing Patterns

## 1. When to Use Edge

```
Use edge when:
├── <50ms latency required
├── Static content + light processing
├── Request rate >100k/month
├── Geographic distribution needed
└── Cost reduction for simple logic

Use traditional server when:
├── Complex long-running processes
├── Large payload processing
├── WebSockets/streaming
├── Database connections heavy
└── Specialized libraries needed
```

## 2. Platform Selection

```
Edge platforms:
├── Cloudflare Workers: 35+ PoPs, KV, D1, Durable Objects
├── Vercel Edge: Next.js integration, Middleware
├── Netlify Edge: Functions, identity
├── Deno Deploy: Deno runtime, KV
├── AWS Lambda@Edge: CloudFront integration
└── Fastly Compute: Full compute, FQL
```

## 3. Cloudflare Workers Patterns

```
Architecture:
├── Workers: JavaScript/TypeScript, W3C standard
├── KV: Key-value store (eventual consistency)
├── D1: SQLite database
├── Durable Objects: State, WebSocket coordination
├── R2: S3-compatible storage, no egress fees
└── Queues: Async processing

Use cases:
├── A/B testing at edge
├── Request rewriting/redirecting
├── Auth verification (JWT)
├── API rate limiting
├── Static site enhancement
└── Bot detection
```

## 4. Cold Start Patterns

```
Cold start characteristics:
├── First request after idle (ms to seconds)
├── Subsequent requests: warm
├── Varies by platform

Strategies:
├── Code split: Minimal main entry
├── Keep warm: Scheduled pings
├── Prefetch: Predictive warming
└── Hybrid: Fallback to origin

Measure:
├── Track cold start latency
├── Adjust timeout accordingly
└── Accept some slow first requests
```

## 5. State Management

```
Stateless patterns:
├── Always possible: Embed state in request
├── URL-based: Query params, path params
├── Headers: X- prefix for custom
└── Cookies: Signed, encrypted

Stateful patterns:
├── Durable Objects (CF): Single instance
├── External DB: Connection per request
└── External cache: Redis, Memcached

Prefer stateless:
├── Better scaling
├── No affinity issues
└── Simpler operations
```

## 6. Data Patterns

```
Edge-optimized data:
├── Edge KV: Read-heavy, <1ms typical
├── D1: SQLite, relational needs
├── R2: Large objects, media
└── External API: Origin as source

Patterns:
├── Cache at edge: Stale-while-revalidate
├── Replicate: Multi-region
├── Read-through: Proxy to origin
└── Write-back: Async to origin
```

## 7. API Patterns

```
Edge API design:
├── Stateless endpoints: No server state
├── Idempotent operations: Safe retries
├── Versioned: /v1/, /v2/
├── Compressed: gzip/brotli
└── Cached: Cache-Control headers

Request handling:
├── Body parsing: Native/streaming
├── Validation: Schema validation
├── Transform: Request/response mapping
└── Route: Clean URL patterns
```

## 8. Security Patterns

```
Edge security:
├── Origin verification: Challenge passwords
├── Rate limiting: Token bucket, distributed
├── Bot detection: Edge-specific services
├── Auth: JWT verification edge-side
└── Secrets: Environment variables

Data protection:
├── TLS always: Edge to origin
├── Signed URLs: Private content
└── Gzip: Reduced exposure
```

## 9. Migration Patterns

```
Moving to edge:
├── Start with static: Cache everything possible
├── Add middleware: Edge functions for logic
├── Migrate APIs: Stateless first
├── Database last: Heavy state moves expensive

Hybrid approach:
├── Edge for public, fast
├── Server for private, complex
└── Clear split responsibility
```

## Key Patterns

1. **Stateless preferred** - Embed all needed in request
2. **Cache aggressively** - Edge caches are powerful
3. **Test latency** - Measure from user locations
4. **Start simple** - Migrate static first
5. **Handle cold starts** - Accept warm-up latency
6. **Watch costs** - Many platforms have free tiers

---

## Anti-Patterns

```
❌ Running Node.js-only APIs at edge (unsupported runtime)
✅ Use Edge Runtime compatible APIs: fetch, crypto, TextEncoder only

❌ Accessing database directly from edge worker
✅ Use edge-compatible DBs (PlanetScale, Neon, Turso) or cache layer

❌ Edge functions for long-running tasks (>30s limit)
✅ Edge for short-lived transformations; offload heavy work to serverless

❌ No geo-awareness — same content to every region
✅ Edge KV for regionally replicated data; vary by cf-ipcountry header

❌ Debugging edge with console.log (no runtime visibility)
✅ Use structured logging + wrangler tail / Cloudflare Logpush
```

---

## Quick Reference

| Platform | Runtime limit | Best for |
|---|---|---|
| Cloudflare Workers | 50ms CPU | Global low-latency |
| Vercel Edge | 25s wall clock | Next.js middleware |
| Deno Deploy | Generous | Full Deno APIs |
| Fastly Compute | 50ms | CDN logic |
| AWS Lambda@Edge | 5s | CloudFront integration |
