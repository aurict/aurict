---
name: next-fullstack
description: "Next.js 15 App Router + TypeScript + Prisma/Drizzle fullstack patterns. Data fetching, Server Actions, auth, caching, error handling."
triggers:
  deps: ["next", "@prisma/client", "drizzle-orm"]
  directories: ["app/", "src/app/"]
  filenames: ["next.config.ts", "next.config.js"]
auto_load_when: "Working in a Next.js fullstack project with database"
tags: ["next", "fullstack", "typescript", "prisma", "drizzle"]
priority: 11
---

# Next.js Fullstack Patterns

## Quick Reference

```
Data flow: Client → Server Action → DB → revalidate → re-render
Auth gate: middleware.ts (matcher) + session check in Server Actions
Error: error.tsx (auto-catches throws) + notFound() for 404s
Cache: fetch cache="force-cache" | revalidateTag() | unstable_cache()
```

**Server Action anatomy:**
```typescript
"use server"
export async function createPost(formData: FormData) {
  const session = await auth(); if (!session) throw new Error("Unauthorized")
  const title = formData.get("title") as string
  await db.insert(posts).values({ title, userId: session.user.id })
  revalidatePath("/posts")
}
```

---

## Decision Tree

```
Need data in component?
├── Server Component (default)
│   ├── One-time fetch → async component + await db.query()
│   ├── Cacheable → unstable_cache(fn, [key], { revalidate: 60 })
│   └── Auth-gated → check session before query, throw if missing
│
└── Client Component (user interaction needed)
    ├── Mutations → useActionState(serverAction, initialState)
    ├── Optimistic → useOptimistic() + server action
    └── Real-time → SWR/React Query with polling or websocket

Route type?
├── /app/page.tsx          → Server Component by default
├── /app/api/route.ts      → Route Handler (REST endpoints, webhooks)
├── /app/[id]/page.tsx     → Dynamic segment, generateStaticParams for SSG
└── middleware.ts          → Auth, redirects, rate limiting (runs on edge)
```

---

## Anti-Patterns

- `useEffect` + fetch in Server Components — Server Components are async, `await` directly
- Calling Server Actions from Server Components — Server Actions are for mutations from Client Components
- `fetch` without cache strategy — defaults to `no-store` in Next.js 15; always specify intent
- Passing non-serializable objects to Client Components — use primitives, plain objects, arrays
- Database queries in middleware — middleware runs on edge, use lightweight checks (JWT, session cookie) only
- `prisma.$connect()` in every request — use global singleton: `let prisma = global.prisma || new PrismaClient()`
- Missing `revalidatePath`/`revalidateTag` after mutations — cache stays stale after write

---

## Key Rules

1. `"use client"` only when: event handlers, browser APIs, useState/useEffect, Client Context
2. Server Actions require `"use server"` at top of file or first line of async function
3. Parallel routes (`@modal/`) for modals that don't block navigation
4. `loading.tsx` and `error.tsx` co-located with page for automatic Suspense/ErrorBoundary
5. Prisma singleton pattern to avoid "Too many connections" in hot reload:
   ```typescript
   // lib/prisma.ts
   const globalForPrisma = global as unknown as { prisma: PrismaClient }
   export const prisma = globalForPrisma.prisma ?? new PrismaClient()
   if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
   ```
6. Environment: `NEXT_PUBLIC_*` for client, never expose secrets to client bundle

---

## Implementation

**Fullstack form pattern (Server Action + useActionState):**
```typescript
// app/actions.ts
"use server"
export async function submitForm(prev: State, formData: FormData): Promise<State> {
  const parsed = schema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.flatten() }
  await db.insert(items).values(parsed.data)
  revalidatePath("/items")
  return { success: true }
}

// app/form.tsx (Client Component)
"use client"
const [state, action, isPending] = useActionState(submitForm, null)
```

**Protected page pattern:**
```typescript
// app/dashboard/page.tsx (Server Component)
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
export default async function Dashboard() {
  const session = await auth()
  if (!session) redirect("/login")
  const data = await db.select().from(users).where(eq(users.id, session.user.id))
  return <DashboardClient data={data} />
}
```
