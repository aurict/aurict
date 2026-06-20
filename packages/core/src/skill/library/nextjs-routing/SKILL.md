---
name: nextjs-routing
description: "Next.js 16 App Router: Routing, Parallel/Intercepting Routes, Layouts, Route Groups, Middleware. Complete pattern reference for enterprise routing."
---

# Next.js 16 Routing Mastery

**Version:** Next.js 16.2 | **Focus:** App Router patterns, route architecture

## When to Activate
- Complex routing requirements
- Parallel/Intercepting routes implementation
- Middleware-based auth/redirects
- Route groups and API design

---

## 1. Route Structure Fundamentals

```
app/
├── page.tsx              → /
├── layout.tsx            → root layout (all routes)
├── loading.tsx           → route-level loading
├── error.tsx             → error boundary
├── not-found.tsx        → 404 page
├── (group)/              → route group (no URL impact)
│   ├── page.tsx         → /group
│   └── layout.tsx       → group-specific layout
└── [slug]/              → dynamic segment
    ├── page.tsx         → /anything
    └── [...catchall]/   → catch-all segment
```

**Key principle:** Every folder = route segment. File-based routing.

---

## 2. Route Groups

### Organization Without URL Impact

```
app/
├── (marketing)/          # No /marketing in URL
│   ├── page.tsx         → /
│   ├── about/page.tsx   → /about
│   └── layout.tsx       # Marketing-specific layout
├── (dashboard)/         # No /dashboard in URL
│   ├── settings/page.tsx → /settings
│   └── layout.tsx       # Dashboard-specific layout
└── layout.tsx           # Root layout
```

Use for: Different layouts per section, code organization, optional layouts.

### Dynamic Route Groups

```
app/
├── [tenantId]/         # Multi-tenant: /acme, /company
│   ├── page.tsx
│   └── (auth)/         # Auth routes for tenant
│       ├── login/page.tsx → /acme/login
│       └── layout.tsx
└── [...catchall]/       # 404 for unknown routes
    └── page.tsx
```

---

## 3. Parallel Routes (@slot)

### Concept
Render multiple routes simultaneously in same layout slot.

```
app/
├── dashboard/
│   ├── layout.tsx       # Main layout
│   ├── page.tsx        → /dashboard
│   ├── @analytics/     # Parallel slot
│   │   └── page.tsx    → /dashboard/analytics
│   ├── @revenue/       # Parallel slot
│   │   └── page.tsx    → /dashboard/revenue
│   └── @notifications/ # Parallel slot
│       └── page.tsx    → /dashboard/notifications
```

### Layout Implementation

```typescript
// dashboard/layout.tsx
export default function DashboardLayout({
  children,
  analytics,
  revenue,
  notifications,
}: {
  children: React.ReactNode
  analytics: React.ReactNode
  revenue: React.ReactNode
  notifications: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-4 gap-4">
      <main className="col-span-3">{children}</main>
      <aside className="space-y-4">
        <div>{analytics}</div>
        <div>{revenue}</div>
        <div>{notifications}</div>
      </aside>
    </div>
  )
}
```

### Use Cases
- **Dashboards:** Multiple independent data widgets
- **Modals:** Side-by-side with main content
- **Feeds:** Main feed + sidebar content

---

## 4. Intercepting Routes (..)

### Concept
Intercept navigation to show modal while preserving context.

```
app/
├── feed/
│   ├── page.tsx              → /feed (photo grid)
│   └── (..)photo/            # Intercepting route
│       └── [id]/
│           └── page.tsx      → /feed/photo/123 (modal)
└── photo/
    └── [id]/
        └── page.tsx          → /photo/123 (full page)
```

### URL Behavior
| Navigation | URL | Rendered |
|-----------|-----|----------|
| Click photo in feed | `/feed/photo/123` | Modal (intercepted) |
| Direct visit | `/photo/123` | Full page |
| Refresh modal | `/feed/photo/123` | Full page (fallback) |

### Implementation

```typescript
// feed/(..)photo/[id]/page.tsx - Intercepted modal
import { Dialog } from '@/components/Dialog'
import { PhotoDetail } from '@/components/PhotoDetail'

export default function PhotoModal({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Dialog>
      <PhotoDetail id={params.id} />
    </Dialog>
  )
}

// This still renders at /photo/123 when intercepted
// But parent /feed context is preserved
```

### Combined: Parallel + Intercepting

```
app/
├── (.)photos/           # Intercept to modal
│   └── [id]/page.tsx
├── photos/              # Full page
│   └── [id]/page.tsx
└── feed/
    ├── page.tsx         # Shows grid
    └── @modal/          # Parallel slot
        └── (.)photos/  # Both combined!
            └── [id]/page.tsx
```

---

## 5. Dynamic Segments

### Basic Dynamic

```
app/
├── products/
│   └── [category]/      # /products/electronics, /products/clothing
│       └── [id]/        # /products/electronics/123
```

```typescript
// products/[category]/[id]/page.tsx
export default async function ProductPage(props: {
  params: Promise<{ category: string; id: string }>
}) {
  const { category, id } = await props.params
  const product = await getProduct(category, id)

  return <ProductDetail product={product} />
}
```

### Optional Segments

```
app/
├── [...slug]/           # /anything, /a/b/c, /x/y/z
```

```typescript
// [...slug]/page.tsx
export default async function CatchAll(props: {
  params: Promise<{ slug: string[] }>
}) {
  const { slug } = await props.params
  // slug = ['a', 'b'] for /a/b

  return <div>Path: {slug.join(' / ')}</div>
}
```

### Constraint Patterns

| Pattern | Example | Matches |
|---------|---------|---------|
| `[slug]` | `[id]` | `/123`, `/abc` |
| `[...slug]` | `[...path]` | `/a/b/c` (array) |
| `[[...slug]]` | `[[...catch]]` | `/` or `/a/b` (optional) |

---

## 6. Middleware

### Setup

```typescript
// middleware.ts (root or app/)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Auth check
  const token = request.cookies.get('auth-token')

  // Protect routes
  if (pathname.startsWith('/dashboard') && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // A/B testing
  if (pathname === '/') {
    const bucket = Math.random() < 0.5 ? 'a' : 'b'
    const response = NextResponse.next()
    response.cookies.set('ab-bucket', bucket)
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/'],
}
```

### Advanced: Edge Runtime Compatible

```typescript
export const runtime = 'edge'

export async function middleware(request: NextRequest) {
  // Geo-based routing
  const country = request.geo?.country ?? 'US'

  if (country === 'DE') {
    return NextResponse.redirect(new URL('/de', request.url))
  }

  // Header manipulation
  const response = NextResponse.next()
  response.headers.set('x-custom-header', 'value')
  return response
}
```

### use cases
- Authentication/Authorization
- A/B testing
- Geo-redirection
- Rate limiting
- Feature flags
- Request logging

---

## 7. Route Handlers (API Routes)

### When to Use
- **Server Actions:** 95% of mutations (forms, updates, deletes)
- **Route Handlers:** Webhooks, file downloads, explicit HTTP control

### Basic Handler

```typescript
// app/api/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const payload = await request.json()

  // Verify webhook signature
  const signature = request.headers.get('x-signature')
  if (!verifyWebhook(signature, payload)) {
    return NextResponse.json({ error: 'Invalid' }, { status: 401 })
  }

  await processWebhook(payload)
  return NextResponse.json({ received: true })
}

// With explicit caching
export const dynamic = 'force-static' // Cache this handler
```

### Streaming Response

```typescript
// app/api/stream/route.ts
export async function GET() {
  const stream = new ReadableStream({
    async start(controller) {
      for (let i = 0; i < 10; i++) {
        controller.enqueue(`data: ${i}\n\n`)
        await new Promise(r => setTimeout(r, 1000))
      }
      controller.close()
    }
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  })
}
```

---

## 8. Navigation Patterns

### useRouter (Client)

```typescript
'use client'
import { useRouter } from 'next/navigation'

export function BackButton() {
  const router = useRouter()

  return (
    <button onClick={() => router.back()}>
      Go Back
    </button>
  )
}

// Other methods
router.push('/path')           // Navigate
router.replace('/path')         // Navigate without history
router.refresh()               // Revalidate current route
router.prefetch('/path')       // Preload
```

### usePathname

```typescript
'use client'
import { usePathname } from 'next/navigation'

export function ActiveNav() {
  const pathname = usePathname()

  return (
    <nav>
      <a href="/dashboard" className={pathname === '/dashboard' ? 'active' : ''}>
        Dashboard
      </a>
    </nav>
  )
}
```

### useSearchParams

```typescript
'use client'
import { useSearchParams } from 'next/navigation'

export function FilterUI() {
  const searchParams = useSearchParams()
  const sort = searchParams.get('sort') ?? 'newest'

  return <div>Current sort: {sort}</div>
}
```

**Note:** Must use `Suspense` wrapper if accessing in client components.

---

## 9. Advanced Patterns

### Intercepted + Parallel Combined

```
app/
├── photos/
│   └── [id]/page.tsx      # Full page: /photos/123
├── feed/
│   ├── page.tsx           # Grid
│   └── @modal/            # Parallel slot
│       └── (.)photos/     # Intercepting within parallel
│           └── [id]/
│               └── page.tsx  # Modal at /feed/photos/123
```

This enables: Grid → click photo → modal opens → refresh → full page fallback.

### Conditional Routes

```typescript
// Middleware-based conditional routing
export function middleware(request: NextRequest) {
  const isMobile = request.userAgent.includes('Mobile')

  if (isMobile && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/m/dashboard', request.url))
  }
}
```

### Route Prefetching

```typescript
// Automatic prefetching (default)
// Links in viewport are prefetched

// Manual prefetch
<Link href="/dashboard" prefetch={false}>No prefetch</Link>

// With prefetch intent
<Link href="/dashboard" prefetch="auto"> // default behavior
```

---

## 10. Performance & Caching

| Technique | Use When |
|-----------|----------|
| Route-level `loading.tsx` | Simple loading states |
| Component-level `<Suspense>` | Granular streaming |
| Intercepting routes | Modal with context |
| Parallel routes | Independent widgets |
| Middleware | Auth, redirects, A/B |

---

## Key Takeaways

1. **Route groups** organize without URL changes
2. **Parallel routes** render multiple slots simultaneously
3. **Intercepting** shows modal while preserving parent context
4. **Middleware** runs before every request (Edge compatible)
5. **Server Actions** for mutations, Route Handlers for external APIs

---

## Anti-Patterns

```
❌ Using pages/ router patterns in App Router (getServerSideProps, etc.)
✅ App Router: fetch in async Server Components; no lifecycle functions

❌ Middleware that imports heavy Node.js modules (fs, crypto)
✅ Middleware is Edge Runtime — use Web APIs only (fetch, crypto.subtle)

❌ Nested dynamic segments with overlapping patterns (/[id] and /[slug])
✅ Use distinct segment names; add route matchers to differentiate

❌ Intercepting route that breaks on full-page refresh
✅ Always provide full-page fallback at the real route path

❌ Client-side navigation to protect routes (easy to bypass)
✅ Auth check in middleware — runs before any page is rendered
```

---

## Quick Reference

| Pattern | File convention | Use case |
|---|---|---|
| Dynamic segment | [id]/page.tsx | Detail pages |
| Catch-all | [...slug]/page.tsx | CMS, docs |
| Optional catch-all | [[...slug]]/page.tsx | Root + nested |
| Route group | (group)/page.tsx | Organize without URL change |
| Parallel route | @slot/page.tsx | Dashboard widgets |
| Intercepting | (.)path/page.tsx | Modal overlay |
| Layout | layout.tsx | Shared chrome |
| Loading | loading.tsx | Streaming skeleton |
| Error | error.tsx | Error boundary |
| Not found | not-found.tsx | 404 page |

---

## Decision Tree

```
Which routing feature?
├── Same route, different layouts per section → route group: (marketing)/, (dashboard)/
├── Multiple independent widgets on one page  → parallel routes: @analytics/, @sidebar/
├── Click link shows modal, refresh shows page → intercepting: (..)photo/[id]/page.tsx
└── Run logic before every request            → middleware.ts at root

Middleware or layout guard?
├── Auth check / redirect                     → middleware (runs before render, Edge)
├── Token verification (JWT)                  → middleware (can't use heavy libs)
├── DB-based permission check                 → layout.tsx Server Component (has Node.js)
└── A/B / geo / feature flags                → middleware

Dynamic segments?
├── Single variable part                      → [id]/page.tsx
├── Any depth path                            → [...slug]/page.tsx (array)
└── Optional catch-all (includes root)        → [[...slug]]/page.tsx
```

---

## Key Rules

1. Route groups `(name)` organize code without affecting URL
2. Parallel routes `@slot` need `default.tsx` — or the slot renders blank on direct nav
3. Intercepting route must have full-page fallback at the real path (refresh)
4. Middleware is Edge Runtime — no `fs`, no `crypto` (use `crypto.subtle`), no Prisma
5. Auth in middleware — never rely on client-side checks
6. Server Actions for mutations, Route Handlers only for webhooks and file downloads
7. `useSearchParams()` requires `<Suspense>` wrapper in Client Components

---

## Implementation

```typescript
// Middleware auth guard — protect /dashboard routes
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token    = request.cookies.get('session')?.value
  const isDash   = request.nextUrl.pathname.startsWith('/dashboard')

  if (isDash && !token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }
  return NextResponse.next()
}

export const config = { matcher: ['/dashboard/:path*'] }

// Parallel routes layout — dashboard with independent slots
// app/dashboard/layout.tsx
export default function DashboardLayout({
  children, analytics, notifications,
}: {
  children:      React.ReactNode
  analytics:     React.ReactNode
  notifications: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-[1fr_300px] gap-4 p-4">
      <main>{children}</main>
      <aside className="space-y-4">
        {analytics}
        {notifications}
      </aside>
    </div>
  )
}

// app/dashboard/@analytics/default.tsx — required fallback
export default function AnalyticsDefault() {
  return <div>No analytics selected</div>
}
```
