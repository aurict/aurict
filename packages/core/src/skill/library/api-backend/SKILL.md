---
name: api-backend
description: "Backend: Middleware flow, Error handling strategy, Auth middleware pattern, Validation pattern." 
triggers:
  extensions: [".ts"]
  directories: ["api/", "routes/", "handlers/"]
  keywords: ["route", "handler", "middleware", "endpoint", "controller"]
auto_load_when: "Building or editing API routes/handlers"
agent: architect
tools: ["Read", "Write", "Bash"]
---

# Backend API Architecture Patterns

**Focus:** Middleware, errors, validation, auth flow

## 1. Middleware Flow

```
Request lifecycle:
1. Request arrives
2. CORS (allow origins)
3. Rate limit (check limits)
4. Parse body (JSON)
5. Auth (verify token)
6. Validate (Zod schema)
7. Route handler (business logic)
8. Error handler (catch errors)
9. Response (JSON)

What goes in middleware:
├── Cross-cutting concerns: CORS, logging, rate limit
├── Transformation: parse body, attach user
└── Validation: check auth, validate input

What goes in handlers:
└── Business logic only
```

---

## 2. Error Handling Pattern

```
How to structure errors:
├── Custom error class with status code
├── Error handler catches all, returns consistent format
├── Never leak internal errors to client
└── Log errors with stack trace for debugging

Response format:
├── Success: { data: ... }
├── Error: { error: { code, message } }
└── Validation: { error: { code, details: [...] } }

Never expose:
├── Stack traces
├── Internal file paths
├── Database errors
└── System information
```

---

## 3. Validation Pattern

```
Validation layers:
├── Route: middleware validates schema
├── Service: business rule validation
└── Database: constraints (unique, foreign key)

What to validate:
├── Type: correct data type
├── Required: all required fields present
├── Format: email, UUID, etc.
├── Range: min/max for numbers, length for strings
└── Business: custom rules (not overlapping dates, etc)
```

---

## 4. Auth Middleware Pattern

```
Auth flow:
1. Extract token from header (Bearer <token>)
2. Verify token (JWT.verify)
3. Attach user to request
4. Continue to handler

When to check auth:
├── All protected routes: middleware
├── Specific endpoints: check in handler
└── Role-based: middleware or handler

What to store in token:
├── User ID (for lookups)
├── Role/permissions (for fast checks)
└── Expiry (for token invalidation)
```

---

## 5. Response Format Strategy

```
When to use what status:
├── 200: successful GET, PUT, PATCH
├── 201: successful POST (created)
├── 204: successful DELETE
├── 400: validation error
├── 401: not authenticated
├── 403: authenticated but not authorized
├── 404: resource not found
├── 409: conflict (duplicate, etc)
└── 500: internal error

Pagination response:
├── data: results array
├── meta: { page, perPage, total }
└── links: { self, next, prev }
```

---

## 6. Rate Limiting Pattern

```
What to rate limit:
├── Per IP: general endpoints
├── Per user: authenticated endpoints
└── Per endpoint: expensive operations

How to limit:
├── Time window: X requests per Y minutes
├── Sliding window: continuous, more accurate
└── Token bucket: allows bursting

Response on limit:
├── 429 status
├── Retry-After header
└── Clear error message
```

---

## Key Patterns

1. **Middleware for cross-cutting** - Don't repeat in handlers
2. **Validate at boundary** - Early failure, clear errors
3. **Consistent response format** - Easier to consume
4. **Auth middleware** - Single place to check
5. **Never leak internals** - Error messages to user vs logs

---

## Anti-Patterns

```
❌ Returning raw DB errors to clients (exposes schema)
✅ Map all errors to application error types with safe messages

❌ No request validation at API boundary
✅ Validate every request with Zod/Joi before business logic

❌ Unbounded list endpoints (return all 1M records)
✅ Mandatory pagination with max page size

❌ Different error shapes per endpoint
✅ Consistent error envelope: { error: { code, message, details } }

❌ Mutation endpoints that are idempotent by accident
✅ Explicit idempotency key header for critical mutations
```

---

## Quick Reference

| Concern | Pattern | Implementation |
|---|---|---|
| Validation | Input schema | Zod + middleware |
| Auth | JWT + refresh token | Middleware layer |
| Pagination | Cursor-based | `next_cursor` in response |
| Rate limiting | Sliding window | Redis + middleware |
| Versioning | URL prefix /v1/ | Never break existing clients |
| Error format | RFC 7807 | application/problem+json |
| Logging | Correlation ID | trace-id header |

---

## Decision Tree

```
Where does this code belong?
├── CORS, rate limit, auth, logging    → middleware (runs on every request)
├── Parse/validate specific input      → middleware before handler
├── Business logic for this route      → handler (after middleware chain)
└── Map errors to HTTP responses       → global error handler (last middleware)

Which HTTP error to return?
├── Schema validation fails            → 400 Bad Request
├── No or invalid credentials          → 401 Unauthorized
├── Valid user, but no permission      → 403 Forbidden
├── Resource ID doesn't exist          → 404 Not Found
├── Same resource already exists       → 409 Conflict
├── Business rule violation            → 422 Unprocessable Entity
└── Unexpected failure                 → 500 + correlation ID (never leak internals)

Rate limiting strategy?
├── Public unauthenticated routes      → per IP (sliding window)
├── Authenticated endpoints            → per user ID
├── Expensive mutation (email, payment)→ per user + stricter limit
└── All of the above                   → layered: IP first, user second
```

---

## Key Rules

1. All cross-cutting logic (CORS, rate limit, logging, auth) in middleware — never repeat in handlers
2. Validate every incoming request at the boundary with Zod before business logic
3. Never return raw database or framework errors to clients — map to safe messages
4. Consistent error envelope: `{ error: { code, message, details? } }` on every endpoint
5. Mandatory pagination on all list endpoints — set and enforce a max page size
6. Attach a `trace-id` (or `x-request-id`) to every request for log correlation
7. Auth middleware attaches `req.user`; never re-fetch user in every handler

---

## Implementation

```typescript
// Hono middleware chain (same pattern in Express/Fastify)
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

type Env = { Variables: { userId: string } }
const app = new Hono<Env>()

// 1. Trace ID middleware
app.use('*', async (c, next) => {
  const traceId = c.req.header('x-request-id') ?? crypto.randomUUID()
  c.header('x-request-id', traceId)
  await next()
})

// 2. Auth middleware (attach user to context)
async function requireAuth(c: any, next: () => Promise<void>) {
  const token = c.req.header('authorization')?.replace('Bearer ', '')
  if (!token) return c.json({ error: { code: 'UNAUTHORIZED', message: 'Missing token' } }, 401)

  try {
    const payload = await verifyToken(token)
    c.set('userId', payload.sub as string)
    await next()
  } catch {
    return c.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } }, 401)
  }
}

// 3. Route with Zod validation
const createPostSchema = z.object({
  title:   z.string().min(1).max(200),
  content: z.string().min(1),
})

app.post('/posts', requireAuth, zValidator('json', createPostSchema), async (c) => {
  const userId = c.get('userId')
  const body   = c.req.valid('json')

  const post = await db.post.create({ data: { ...body, authorId: userId } })
  return c.json({ data: post }, 201)
})

// 4. Global error handler
app.onError((err, c) => {
  if (err instanceof AppError) {
    return c.json({ error: { code: err.code, message: err.message } }, err.status)
  }
  console.error({ err, traceId: c.res.headers.get('x-request-id') })
  return c.json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } }, 500)
})

class AppError extends Error {
  constructor(public code: string, message: string, public status: number) {
    super(message)
  }
}
```
