---
name: api-mocking
description: "API mocking: MSW v2 service workers, Vitest/Jest mocks, test isolation, avoiding mock drift, contract testing."
triggers:
  deps: ["msw", "nock", "@mswjs/data", "jest-fetch-mock"]
  keywords: ["mock", "stub", "intercept", "MSW", "fake API", "test isolation"]
auto_load_when: "Writing tests that call APIs or external services"
tags: ["testing", "mocking", "msw", "vitest", "jest"]
priority: 7
---

# API Mocking Patterns

## Quick Reference

```
MSW v2 (browser + Node):  http.get("/api/users", () => HttpResponse.json(data))
Vitest module mock:        vi.mock("../lib/api", () => ({ fetchUser: vi.fn().mockResolvedValue(user) }))
Reset between tests:       beforeEach(() => { server.resetHandlers(); vi.clearAllMocks() })
One-off override:          server.use(http.get("/api/users", () => HttpResponse.error()))
Contract test:             validate mock shape matches real API response schema
```

---

## Decision Tree

```
What to mock?
├── External APIs (Stripe, SendGrid, GitHub) → MSW — intercepts at network level
├── Internal service calls → MSW or module mock depending on coupling
├── Database → use real test DB (Docker) or in-memory (SQLite) — avoid mocking DB
└── Time / random → vi.useFakeTimers(), vi.spyOn(Math, "random")

MSW vs module mock?
├── Testing HTTP behavior (status codes, headers, network errors) → MSW
├── Testing logic that calls a function → vi.mock() module mock
├── Testing React Query / SWR / fetch-based hooks → MSW (closer to real behavior)
└── Unit testing pure functions that import API modules → vi.mock()

How to avoid mock drift (mock != real API)?
├── Zod schema validation in mock handlers — throw if response doesn't match schema
├── Contract tests (Pact) — both sides agree on the shape
└── Generate mocks from OpenAPI spec — always in sync with real API definition
```

---

## Anti-Patterns

- Mocking the database instead of using a real test DB — mock and real DB diverge; tests pass, prod fails
- Never resetting mock state between tests — test 1's mock bleeds into test 2; order-dependent failures
- Mocking what you don't own (third-party libs) — mock the boundary (HTTP), not the library internals
- Over-mocking: mocking 8 things for a 10-line test — if that many mocks are needed, split the function
- Hardcoded mock data that drifts from real API shape — validate mock responses against schema
- `jest.mock()` at the top of the file for every test — only mock what's necessary for that specific test

---

## Key Rules

1. Mock at the boundary (HTTP, filesystem, time) — not deep inside your own code
2. Always reset handlers and mocks in `beforeEach` — prevents test pollution
3. Test error paths explicitly: `server.use(http.get("/api", () => new HttpResponse(null, { status: 500 })))`
4. Validate mock response shapes with Zod — catches mock drift at test time, not in prod
5. Real DB > mocked DB — use in-memory SQLite or Docker Postgres for data layer tests

---

## Implementation

**MSW v2 setup (Vitest + Node):**
```typescript
// src/mocks/handlers.ts
import { http, HttpResponse } from "msw"
export const handlers = [
  http.get("/api/users", () => HttpResponse.json([{ id: 1, name: "Alice" }])),
  http.post("/api/users", async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({ id: 2, ...body as object }, { status: 201 })
  }),
]

// src/mocks/server.ts
import { setupServer } from "msw/node"
import { handlers } from "./handlers"
export const server = setupServer(...handlers)

// vitest.setup.ts
import { server } from "./src/mocks/server"
beforeAll(() => server.listen({ onUnhandledRequest: "error" }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

**One-off error scenario:**
```typescript
it("shows error state when API fails", async () => {
  server.use(http.get("/api/users", () => new HttpResponse(null, { status: 503 })))
  render(<UserList />)
  expect(await screen.findByText("Failed to load users")).toBeInTheDocument()
})
```

**Schema-validated mock (prevent drift):**
```typescript
import { z } from "zod"
const UserSchema = z.object({ id: z.number(), name: z.string(), email: z.string().email() })

http.get("/api/users/:id", ({ params }) => {
  const user = { id: Number(params.id), name: "Alice", email: "alice@test.com" }
  UserSchema.parse(user) // throws if mock doesn't match schema — caught at test time
  return HttpResponse.json(user)
})
```
