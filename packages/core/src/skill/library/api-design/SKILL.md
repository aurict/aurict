---
name: api-design
description: "API Design: Resource structure, HTTP method selection, Response patterns, Error handling." 
triggers:
  extensions: [".ts", ".yaml", ".json"]
  directories: ["api/"]
  keywords: ["REST", "openapi", "swagger", "versioning", "pagination", "resource"]
auto_load_when: "Designing API contracts or OpenAPI specs"
agent: architect
tools: ["Read", "Write", "Bash"]
---

# API Design Patterns

**Focus:** REST, HTTP semantics, conventions

## 1. Resource Design

```
How to structure URLs:
├── Nouns (resources), not verbs
├── Plural (users, not user)
├── Kebab-case (order-items, not orderItems)
└── Hierarchical for relationships (users/123/orders)

What to expose:
├── Resources user interacts with
├── Fields needed by client
└── Links to related resources

What NOT to expose:
├── Internal IDs (use UUID)
├── Implementation details
└── Database fields
```

---

## 2. HTTP Method Selection

```
Methods and their use:
├── GET: retrieve data, idempotent
├── POST: create new resource
├── PUT: replace entire resource (idempotent)
├── PATCH: partial update (idempotent)
├── DELETE: remove resource (idempotent)

Idempotency:
├── GET, PUT, DELETE: safe to retry
├── POST: NOT idempotent, careful with retry
└── PATCH: usually idempotent if designed right
```

---

## 3. Response Format

```
Success patterns:
├── Single: { data: {...} }
├── List: { data: [...], meta: {...} }
├── Created: { data: {...}, message: ... }

Error patterns:
├── 400: { error: { code, message, details: [...] } }
├── 401: { error: { code, message } }
├── 404: { error: { code, message } }
└── 500: { error: { code, message } }

Meta for collections:
├── Pagination: page, perPage, total
├── Filtering: filters applied
└── Sorting: sort parameters used
```

---

## 4. Pagination Strategy

```
When to paginate:
├── Always for lists (default 20-50)
└── Prevent large responses

Offset-based:
├── Simple: page, per_page
├── Good for: user-facing, sequential
└── Problem: skip performance on large offsets

Cursor-based:
├── Complex: cursor (last seen ID)
├── Good for: large datasets, real-time
└── Problem: can't jump to specific page
```

---

## 5. Filtering & Sorting

```
Filter patterns:
├── Query params: ?status=active
├── Multiple: ?status=active&type=premium
├── Range: ?price_gte=10&price_lte=100
└── Complex: ?filter=field_eq_value

Sort patterns:
├── Single: ?sort=created_at
├── Multiple: ?sort=-created_at,name (desc first, then asc)
└── Default: always sort (predictable)
```

---

## 6. Versioning Strategy

```
When to version:
├── Breaking changes
├── Removing fields
└── Changing response structure

Version in:
├── URL: /api/v1/users (preferred)
├── Header: Accept: application/vnd.api.v1+json
└── Query: ?version=1 (avoid)

Deprecation:
├── Sunset header
├── Link to new version
└── Warn in response
```

---

## 7. Error Handling

```
Error response structure:
├── Code: machine-readable (VALIDATION_ERROR)
├── Message: human-readable
└── Details: field-specific errors

When to use codes:
├── 400: validation error
├── 401: authentication failed
├── 403: authorization failed
├── 404: resource not found
├── 409: conflict (duplicate)
├── 422: unprocessable (business logic)
└── 429: rate limited
```

---

## Key Patterns

1. **Nouns for resources** - /users not /getUsers
2. **GET for read** - safe, idempotent
3. **POST for create** - non-idempotent
4. **Consistent format** - data/meta/error
5. **Pagination always** - for lists
6. **Version in URL** - /api/v1/

---

## Anti-Patterns

```
❌ Verbs in REST URLs (/getUser, /deletePost)
✅ Nouns only: GET /users/:id, DELETE /posts/:id

❌ Breaking changes without versioning
✅ Version with /v1/ prefix; never remove fields from v1

❌ Inconsistent response shapes per endpoint
✅ Standard envelope: { data, meta, error }

❌ 200 OK for errors ("success: false" in body)
✅ Correct HTTP status codes: 400, 401, 403, 404, 422, 500

❌ No pagination — returning all records
✅ Cursor-based pagination; document max page size
```

---

## Quick Reference

| HTTP Method | Semantics | Idempotent? |
|---|---|---|
| GET | Read resource | Yes |
| POST | Create resource | No |
| PUT | Replace resource | Yes |
| PATCH | Partial update | No |
| DELETE | Remove resource | Yes |

| Status | Meaning | When |
|---|---|---|
| 200 | OK | Success |
| 201 | Created | POST success |
| 204 | No Content | DELETE success |
| 400 | Bad Request | Validation fail |
| 401 | Unauthorized | No auth |
| 403 | Forbidden | No permission |
| 404 | Not Found | Resource missing |
| 422 | Unprocessable | Semantic error |

---

## Decision Tree

```
Which HTTP method?
├── Read data (no side effects)         → GET
├── Create new resource                 → POST (not idempotent)
├── Replace full resource               → PUT (idempotent)
├── Partial update                      → PATCH (usually idempotent)
└── Remove resource                     → DELETE

Which status code on success?
├── GET / PUT / PATCH retrieved data   → 200 OK
├── POST created new resource          → 201 Created + Location header
└── DELETE with no body to return      → 204 No Content

Which error code?
├── Missing / invalid input            → 400 Bad Request
├── No valid credentials               → 401 Unauthorized
├── Valid auth but wrong permission    → 403 Forbidden
├── Resource doesn't exist            → 404 Not Found
├── Duplicate / conflicting state      → 409 Conflict
├── Business rule violation            → 422 Unprocessable
└── Server fault                       → 500 + correlation ID in body

Pagination strategy?
├── User-facing, jump to page N        → offset-based (?page=2&per_page=20)
├── Real-time feed, large dataset      → cursor-based (?cursor=<opaque>&limit=20)
└── Admin export, no paging needed     → streaming / bulk endpoint
```

---

## Key Rules

1. Use nouns for resources: `/users/:id`, not `/getUser/:id`
2. Never break a versioned contract — add fields, don't remove; bump `/v2/` for breaking changes
3. Standard envelope: `{ data, meta, error }` — consistent across all endpoints
4. Correct HTTP status codes — never 200 for errors, never 404 for "no results"
5. RFC 7807 error body: `{ type, title, status, detail, instance }`
6. Cursor-based pagination for any list that can exceed 1000 rows
7. Idempotency-Key header on any POST that triggers side effects (payments, emails)

---

## Implementation

```typescript
// RFC 7807 error helper
function problemJson(status: number, title: string, detail: string, extra?: Record<string, unknown>) {
  return Response.json(
    { type: `https://api.example.com/errors/${title.toLowerCase().replace(' ', '-')}`,
      title, status, detail, ...extra },
    { status, headers: { 'Content-Type': 'application/problem+json' } }
  )
}

// Cursor-based pagination (Next.js Route Handler)
// GET /api/posts?cursor=<id>&limit=20
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const cursor = searchParams.get('cursor')
  const limit = Math.min(Number(searchParams.get('limit') ?? 20), 100)

  const rows = await db.post.findMany({
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { id: 'desc' },
  })

  const hasMore = rows.length > limit
  const items = rows.slice(0, limit)
  const nextCursor = hasMore ? items[items.length - 1].id : null

  return Response.json({
    data: items,
    meta: { limit, hasMore, nextCursor },
  })
}

// Standard success response helper
function ok<T>(data: T, meta?: Record<string, unknown>) {
  return Response.json({ data, ...(meta ? { meta } : {}) })
}
// Usage: return ok(user) → { data: {...} }
// Usage: return problemJson(404, 'Not Found', 'User not found')
```
