---
name: cloudflare-workers
description: "Cloudflare Workers: edge runtime, D1 SQLite, KV store, R2 object storage, Durable Objects, bindings."
triggers:
  filenames: ["wrangler.toml", "wrangler.jsonc"]
  deps: ["@cloudflare/workers-types", "wrangler", "hono"]
  directories: [".wrangler/"]
auto_load_when: "Deploying to Cloudflare Workers or Pages"
tags: ["cloudflare", "edge", "workers", "d1", "kv", "r2"]
priority: 8
---

# Cloudflare Workers Patterns

## Quick Reference

```
Entry:   export default { fetch(req, env, ctx): Response|Promise<Response> }
D1:      env.DB.prepare("SELECT ...").bind(value).all() → { results }
KV:      await env.KV.get("key") | put("key", value, { expirationTtl: 60 })
R2:      await env.BUCKET.put(key, body) | get(key) → R2Object | null
Queue:   await env.QUEUE.send({ type, payload })
DO:      env.COUNTER.get(env.COUNTER.idFromName("room-1"))
```

**Minimal Worker:**
```typescript
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname === "/") return new Response("Hello edge!")
    return new Response("Not found", { status: 404 })
  }
}
```

---

## Decision Tree

```
Storage type?
├── Structured data → D1 (SQLite, global replicas, SQL queries)
├── Key/value cache → KV (eventually consistent, great for config/sessions)
├── Files/blobs     → R2 (S3-compatible, zero egress cost)
└── Stateful sync   → Durable Objects (single-instance, WebSocket hub, counters)

Framework?
├── API only → vanilla Workers fetch handler
├── Routing  → Hono (edge-native, tiny, type-safe) — recommended
└── Full SSR → Remix or Next.js on Pages (heavier, needs CF Pages adapter)

D1 or KV?
├── Need SQL queries, JOINs, transactions → D1
├── Need simple get/set, globally fast reads → KV
└── Need real-time coordination → Durable Objects

Deployment?
├── Workers → wrangler deploy (individual scripts)
└── Pages   → wrangler pages deploy (static + functions/)
```

---

## Anti-Patterns

- Long-running async operations without `ctx.waitUntil()` — Workers terminate at response; use `ctx.waitUntil(promise)` for fire-and-forget
- `console.log` for production logging — use `wrangler tail` or structured logs to Logpush
- D1 N+1 queries — batch with `env.DB.batch([stmt1, stmt2])` or use JOINs
- KV for user session data that changes often — KV is eventually consistent; D1 or DO for strong consistency
- Storing secrets in `wrangler.toml` — use `wrangler secret put MY_SECRET` for sensitive values
- `fetch()` without timeout — Workers have 30s CPU limit; set `signal: AbortSignal.timeout(5000)`
- Blocking on D1 queries in loops — batch queries; D1 latency adds up in loops

---

## Key Rules

1. Env bindings are injected — define in `wrangler.toml` `[vars]`/`[[d1_databases]]`/`[[kv_namespaces]]` and typed in `Env` interface
2. Workers run on V8 isolates — no `process`, no Node.js built-ins (unless using `nodejs_compat` flag)
3. D1 is SQLite — standard SQL, WAL mode by default, global replicas with eventual consistency
4. R2 `get()` returns null if not found — always null-check before reading body
5. Durable Objects: one DO instance per name, serialized requests, ideal for rooms/sessions/counters
6. `wrangler dev` for local development — wraps your Worker with a local simulator

---

## Implementation

**Hono + D1 REST API:**
```typescript
import { Hono } from "hono"
type Bindings = { DB: D1Database }
const app = new Hono<{ Bindings: Bindings }>()

app.get("/users", async (c) => {
  const { results } = await c.env.DB.prepare("SELECT id, name, email FROM users").all()
  return c.json(results)
})

app.post("/users", async (c) => {
  const { name, email } = await c.req.json<{ name: string; email: string }>()
  await c.env.DB.prepare("INSERT INTO users (name, email) VALUES (?, ?)").bind(name, email).run()
  return c.json({ ok: true }, 201)
})

export default app
```

**KV session pattern:**
```typescript
async function getSession(env: Env, token: string) {
  const raw = await env.SESSIONS.get(token)
  return raw ? JSON.parse(raw) as Session : null
}
async function setSession(env: Env, token: string, session: Session) {
  await env.SESSIONS.put(token, JSON.stringify(session), { expirationTtl: 86400 })
}
```
