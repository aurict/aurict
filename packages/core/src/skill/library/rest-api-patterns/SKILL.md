---
name: rest-api-patterns
description: "REST API: Resource design, HTTP methods, Status codes, HATEOAS, Versioning, Caching strategies."
triggers:
  extensions: [".ts", ".js", ".py"]
  directories: ["api/", "routes/", "endpoints/", "rest/"]
  keywords: ["REST", "GET", "POST", "PUT", "PATCH", "DELETE", "resource", "endpoint", "http status"]
auto_load_when: "Building or reviewing REST APIs"
agent: architect
tools: ["Read", "Write", "Bash"]
---

# REST API Architecture Patterns

**Focus:** Resource modeling, HTTP semantics, API design best practices

## 1. Resource Design

```
Resource Naming:
├── Use nouns, not verbs: /users NOT /getUsers
├── Use plural: /users NOT /user
├── Use lowercase: /user-profiles NOT /userProfiles
├── Use kebab-case: /order-items NOT /orderItems
└── Use hyphens for readability: /customer-orders

Resource Hierarchy:
├── Simple: /users
├── Nested: /users/{id}/orders (one level only)
├── Cross-resource: /orders?user_id=123 (use query params)
└── Actions: /users/{id}/activate (for non-CRUD actions)

Anti-patterns:
❌ /getUserById/123     → GET /users/123
❌ /user/create         → POST /users
❌ /usersList           → GET /users
❌ /users/123/orders/456/items  → Too deep
```

---

## 2. HTTP Method Selection

```
GET (Read)
├── GET /users              → List users
├── GET /users/123          → Get single user
├── GET /users?role=admin  → Filtered list
└── GET /users?sort=name   → Sorted list

POST (Create)
├── POST /users             → Create new user
├── POST /users/123/orders  → Create order for user
└── Request body contains resource data

PUT (Full Update)
├── PUT /users/123          → Replace user entirely
└── Request body contains complete resource

PATCH (Partial Update)
├── PATCH /users/123        → Update specific fields
└── Request body contains only changed fields

DELETE (Remove)
├── DELETE /users/123       → Delete user
└── Return 204 No Content

Safety & Idempotency:
├── Safe: GET, HEAD, OPTIONS (no side effects)
├── Idempotent: PUT, DELETE (multiple same request = same result)
└── POST, PATCH are NOT idempotent
```

---

## 3. Status Codes

```
2xx Success
├── 200 OK                  → Successful GET, PUT, PATCH
├── 201 Created            → Resource created via POST
├── 204 No Content         → Successful DELETE, no response body
└── 202 Accepted           → Async processing started

4xx Client Errors
├── 400 Bad Request         → Invalid syntax, validation failed
├── 401 Unauthorized        → Missing or invalid auth
├── 403 Forbidden           → Auth OK, but no permission
├── 404 Not Found           → Resource doesn't exist
├── 405 Method Not Allowed → Endpoint exists but method not allowed
├── 409 Conflict            → Duplicate, version conflict
├── 422 Unprocessable       → Valid syntax but semantic error
├── 429 Too Many Requests   → Rate limit exceeded
└── 415 Unsupported Media   → Wrong Content-Type

5xx Server Errors
├── 500 Internal Server     → Generic error
├── 502 Bad Gateway         → Upstream failure
├── 503 Service Unavailable → Temporarily overloaded
└── 504 Gateway Timeout     → Upstream timeout

Pagination Errors:
├── 400 if page < 1
├── 400 if per_page > max (e.g., 100)
└── Return 206 Partial Content for ranges
```

---

## 4. API Versioning

```
Versioning Strategies:

URL Path (Most Common - Recommended):
├── /api/v1/users
├── /api/v2/users
├── Pro: Easy to test, clear versioning
└── Con: URL changes on version bump

Query Parameter:
├── GET /users?version=2
├── Pro: Single URL
└── Con: Harder to cache, client complexity

Header:
├── Accept: application/vnd.api+json;version=2
├── Pro: Clean URLs
└── Con: Developer experience poor

Deprecation Strategy:
├── Add Deprecation header: Deprecation: Sun, 01 Jan 2025 00:00:00 GMT
├── Add Sunset header: Sunset: Sat, 01 Feb 2025 00:00:00 GMT
├── Document in response: { warning: "v1 deprecated" }
└── Maintain for 12+ months minimum
```

---

## 5. Pagination Patterns

```
Offset-based (Simple):
├── GET /users?page=2&per_page=20
├── Response: { data: [...], meta: { page: 2, total: 1000, total_pages: 50 } }
└── Con: Slow on large offsets (OFFSET 100000)

Cursor-based (Recommended):
├── GET /users?cursor=abc123
├── Response: { data: [...], meta: { next_cursor: "def456", has_more: true } }
└── Pro: Fast, works with real-time data

Keyset (Performance):
├── GET /users?since_id=123&limit=20
├── Use for time-ordered data
└── Pro: Fastest for large datasets

Link Header (RFC 5988):
├── Link: <https://api.example.com/users?page=2>; rel="next"
├── Link: <https://api.example.com/users?page=5>; rel="last"
└── Pro: Decoupled from response body
```

---

## 6. Filtering & Sorting

```
Filtering:
├── Query params: /users?role=admin&status=active
├── Multiple values: /users?role=admin,user (OR) vs role=admin&role=user (AND)
├── Operators: /users?age_gte=18&age_lte=65 (gte, lte, gt, lt)
├── Full-text: /users?q=john (search in multiple fields)
└── Complex: POST /users/search with JSON body

Sorting:
├── Single: /users?sort=name
├── Multiple: /users?sort=name,created_at
├── Direction: /users?sort=-name (desc), /users?sort=name (asc)
└── Default: Always sort for pagination consistency

Filtering Best Practices:
├── Validate all query params
├── Whitelist allowed filters (never allow arbitrary field queries)
├── Index filtered columns in database
└── Cache common filter combinations
```

---

## 7. Error Response Format

```
RFC 7807 Problem Details (Recommended):
{
  "type": "https://api.example.com/errors/validation-failed",
  "title": "Validation Failed",
  "status": 400,
  "detail": "The request body contains invalid fields",
  "instance": "/users/123",
  "errors": [
    { "field": "email", "message": "Invalid email format" },
    { "field": "age", "message": "Must be greater than 0" }
  ]
}

Field-level Errors:
{
  "message": "Validation failed",
  "errors": {
    "email": "Invalid email format",
    "password": "Must be at least 8 characters"
  }
}

Error Code Enum:
├── VALIDATION_ERROR
├── NOT_FOUND
├── DUPLICATE_ERROR
├── RATE_LIMIT_EXCEEDED
├── AUTHENTICATION_FAILED
└── INSUFFICIENT_PERMISSION
```

---

## 8. Caching & ETags

```
Cache-Control Headers:
├── Cache-Control: max-age=3600 (cache for 1 hour)
├── Cache-Control: no-cache (revalidate each time)
├── Cache-Control: no-store (never cache)
├── Cache-Control: private (browser only)
└── Cache-Control: public (CDN, proxies)

ETag Pattern:
├── Response: ETag: "abc123"
├── Next Request: If-None-Match: "abc123"
├── Match: 304 Not Modified (return empty)
└── No Match: 200 OK with new data

Version-based Invalidation:
├── ETag from version field: ETag: "v2-abc123"
├── On resource update, ETag changes
└── Clients re-fetch automatically

Stale-while-revalidate:
├── Cache-Control: max-age=60, stale-while-revalidate=300
├── Serve cached for 60s, allow stale for 300s more
└── Background refresh in background
```

---

## Key Patterns

1. **Nouns for resources** — /users not /getUsers
2. **HTTP methods semantically** — GET reads, POST creates
3. **Version in URL** — /api/v1/users
4. **Paginate everything** — Cursor-based for large datasets
5. **RFC 7807 errors** — Consistent problem details format
6. **Cache wisely** — ETags + Cache-Control

---

## Anti-Patterns

```
❌ /getUserById/123 or /users/get/123
✅ Use HTTP methods: GET /users/123

❌ Same endpoint for different actions: POST /user/update
✅ Use proper HTTP methods: PUT /users/123

❌ All responses: { success: true, data: ... }
✅ Use proper status codes: 200, 201, 400, etc.

❌ No pagination on list endpoints
✅ Always paginate, default limit 20, max 100

❌ Different error formats per endpoint
✅ RFC 7807 everywhere, consistent structure

❌ No versioning, breaking changes in production
✅ Version in URL, deprecate gracefully

❌ No caching headers
✅ Add Cache-Control and ETags for GET
```

---

## Quick Reference

| Concern | Pattern | Implementation |
|---|---|---|
| Resources | Nouns, plurals | GET /users not /user |
| Methods | CRUD mapping | GET=read, POST=create |
| Status | Semantic codes | 200, 201, 400, 404, 500 |
| Versioning | URL path | /api/v1/users |
| Pagination | Cursor-based | next_cursor, has_more |
| Errors | RFC 7807 | type, title, status, detail |
| Caching | ETags + Cache-Control | ETag header |
| Filtering | Query params | ?role=admin&status=active |

---

## Decision Tree

```
HTTP method?
├── Reading data (no side effects)    → GET
├── Creating a new resource           → POST  → 201 Created
├── Replacing resource entirely       → PUT   → 200 OK
├── Partial update                    → PATCH → 200 OK
└── Deleting                          → DELETE → 204 No Content

Status code?
├── Success, returns body             → 200 OK
├── Created                          → 201 + Location header
├── Async started                    → 202 Accepted
├── Invalid input / validation        → 400 Bad Request
├── Missing/invalid auth token        → 401 Unauthorized
├── Auth OK, no permission            → 403 Forbidden
├── Resource doesn't exist            → 404 Not Found
├── Duplicate / version conflict      → 409 Conflict
└── Rate limit exceeded               → 429 Too Many Requests

Pagination strategy?
├── List < 1 000 rows, simple UX     → offset: ?page=2&per_page=20
├── Large tables / infinite scroll   → cursor: ?cursor=abc123
└── Time-ordered feed                → keyset: ?since_id=123&limit=20

Versioning strategy?
├── New API, multiple clients        → URL path /api/v1/
├── Internal only / single client   → header versioning ok
└── Never break → maintain v1 for 12+ months after v2 ships
```

---

## Key Rules

1. Use nouns (plurals, kebab-case) for resources — `/user-profiles` not `/getUserProfile`
2. HTTP methods carry semantic meaning — GET is idempotent, POST is not
3. URL versioning `/api/v1/` as default — easiest to test and cache
4. Cursor pagination for any list that can grow > 1 000 rows
5. RFC 7807 error format everywhere — `type`, `title`, `status`, `detail`, field `errors[]`
6. ETags + `Cache-Control` headers on every GET endpoint
7. Whitelist allowed filter params — never let clients query arbitrary DB fields
8. Add `Deprecation` + `Sunset` headers at least 12 months before removing a version

---

## Implementation

```typescript
// RFC 7807 error response helper
function problemDetail(status: number, title: string, detail: string, errors?: object) {
  return Response.json(
    { type: `https://api.example.com/errors/${title.toLowerCase().replace(/ /g, '-')}`,
      title, status, detail, ...(errors ? { errors } : {}) },
    { status }
  )
}

// Validation error
export async function POST(req: Request) {
  const body = await req.json()
  const result = CreateUserSchema.safeParse(body)
  if (!result.success) {
    return problemDetail(400, 'Validation Failed',
      'Request body contains invalid fields',
      result.error.flatten().fieldErrors)
  }
  const user = await db.user.create({ data: result.data })
  return Response.json(user, { status: 201 })
}

// Cursor pagination response
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const cursor = searchParams.get('cursor')
  const limit  = Math.min(Number(searchParams.get('limit') ?? 20), 100)

  const items = await db.item.findMany({
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: 'desc' },
  })

  const hasMore   = items.length > limit
  const data      = hasMore ? items.slice(0, limit) : items
  const nextCursor = hasMore ? data[data.length - 1].id : null

  return Response.json({ data, meta: { nextCursor, hasMore } })
}
```
