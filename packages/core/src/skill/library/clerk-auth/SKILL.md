---
name: clerk-auth
description: "Clerk: Drop-in auth UI, Organizations, User management, JWT templates, webhooks, Next.js middleware integration."
triggers:
  extensions: [".ts", ".tsx"]
  directories: ["auth/"]
  filenames: ["middleware.ts", "clerk.ts"]
  keywords: ["clerk", "clerkMiddleware", "currentUser", "auth()", "useUser", "useAuth", "SignIn", "SignUp", "UserButton", "OrganizationSwitcher"]
auto_load_when: "Using Clerk for authentication"
agent: security-officer
tools: ["Read", "Write", "Bash"]
---

# Clerk Authentication Patterns

**Version:** Clerk v6 (Next.js App Router) | **Focus:** Middleware, components, server helpers

---

## 1. Installation & Setup

```bash
npm install @clerk/nextjs
```

```ts
// .env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
```

```tsx
// app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs';
export default function RootLayout({ children }) {
  return <ClerkProvider><html><body>{children}</body></html></ClerkProvider>;
}
```

---

## 2. Middleware (Route Protection)

```ts
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/', '/sign-in(.*)', '/sign-up(.*)', '/api/webhooks/(.*)',
]);

export default clerkMiddleware((auth, request) => {
  if (!isPublicRoute(request)) auth().protect();
});

export const config = { matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'] };
```

---

## 3. Server-Side Auth

```ts
// Server Component
import { auth, currentUser } from '@clerk/nextjs/server';

export default async function DashboardPage() {
  const { userId, orgId, sessionClaims } = auth();
  if (!userId) redirect('/sign-in');

  const user = await currentUser();
  return <div>Hello {user?.firstName}</div>;
}

// Server Action
'use server';
import { auth } from '@clerk/nextjs/server';
export async function createPost(data: FormData) {
  const { userId } = auth();
  if (!userId) throw new Error('Unauthorized');
  return db.post.create({ data: { ...Object.fromEntries(data), authorId: userId } });
}

// Route Handler
import { auth } from '@clerk/nextjs/server';
export async function GET() {
  const { userId } = auth();
  if (!userId) return new Response('Unauthorized', { status: 401 });
  const data = await getDataForUser(userId);
  return Response.json(data);
}
```

---

## 4. Client-Side Hooks

```tsx
'use client';
import { useUser, useAuth, useClerk } from '@clerk/nextjs';

export function UserProfile() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { userId, sessionId, getToken } = useAuth();
  const { signOut } = useClerk();

  if (!isLoaded) return <Spinner />;
  if (!isSignedIn) return <RedirectToSignIn />;

  // Get JWT for external API calls
  const token = await getToken({ template: 'my-jwt-template' });

  return (
    <div>
      <p>{user.fullName}</p>
      <button onClick={() => signOut()}>Sign out</button>
    </div>
  );
}
```

---

## 5. Pre-built UI Components

```tsx
import { SignIn, SignUp, UserButton, OrganizationSwitcher } from '@clerk/nextjs';

// Auth pages
// app/sign-in/[[...sign-in]]/page.tsx
export default function SignInPage() {
  return <SignIn />;
}

// Navigation bar components
export function Navbar() {
  return (
    <nav>
      <UserButton afterSignOutUrl="/" />  {/* avatar + dropdown */}
      <OrganizationSwitcher />            {/* org picker (if using orgs) */}
    </nav>
  );
}
```

---

## 6. Webhooks (Sync Users to DB)

```ts
// app/api/webhooks/clerk/route.ts
import { Webhook } from 'svix';
import { WebhookEvent } from '@clerk/nextjs/server';

export async function POST(req: Request) {
  const body = await req.text();
  const svix_id = req.headers.get('svix-id')!;
  const svix_timestamp = req.headers.get('svix-timestamp')!;
  const svix_signature = req.headers.get('svix-signature')!;

  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);
  let event: WebhookEvent;
  try {
    event = wh.verify(body, { 'svix-id': svix_id, 'svix-timestamp': svix_timestamp, 'svix-signature': svix_signature }) as WebhookEvent;
  } catch { return new Response('Invalid signature', { status: 400 }); }

  if (event.type === 'user.created') {
    await db.user.create({ data: { clerkId: event.data.id, email: event.data.email_addresses[0].email_address } });
  }
  if (event.type === 'user.deleted') {
    await db.user.delete({ where: { clerkId: event.data.id! } });
  }

  return new Response('OK');
}
```

---

## Quick Reference

| Need | Clerk API |
|------|-----------|
| Protect all routes | `clerkMiddleware` + `createRouteMatcher` |
| Get userId (server) | `auth().userId` |
| Get full user (server) | `currentUser()` |
| Client user info | `useUser()` hook |
| Sign out | `useClerk().signOut()` |
| JWT for 3rd party API | `getToken({ template: 'name' })` |
| Sync to DB | Webhooks via svix |

## Anti-Patterns

```
❌ Protecting routes with middleware only for some pages
✅ Blocklist approach: allow only specific public routes explicitly

❌ Calling currentUser() in every component (slow N+1)
✅ Call once at page level, pass as prop or use React Context

❌ Trusting userId from client without re-verifying
✅ Always use auth() server-side — client can be spoofed

❌ Building custom user sync without webhooks
✅ Use clerk webhooks (svix) to keep your DB in sync
```
