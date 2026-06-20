---
name: remix-expert
description: "Remix v2: Loaders, Actions, nested routes, error boundaries, optimistic UI, Form component, defer/Await patterns."
triggers:
  extensions: [".tsx", ".ts"]
  directories: ["app/routes/", "app/"]
  filenames: ["remix.config.js", "vite.config.ts"]
  keywords: ["remix", "useLoaderData", "useActionData", "loader", "action", "Form", "Outlet", "useNavigation", "defer", "Await"]
auto_load_when: "Building a Remix application"
agent: frontend-ops
tools: ["Read", "Write", "Bash"]
---

# Remix v2 Patterns

**Version:** Remix v2 | **Focus:** Loaders, Actions, routing, optimistic UI

---

## 1. Loader (Data Fetching)

```tsx
// app/routes/posts.$id.tsx
import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData, isRouteErrorResponse, useRouteError } from '@remix-run/react';

export async function loader({ params, request }: LoaderFunctionArgs) {
  const post = await db.post.findUnique({ where: { id: params.id } });
  if (!post) throw new Response('Not Found', { status: 404 });
  return json({ post });
}

export default function PostPage() {
  const { post } = useLoaderData<typeof loader>();
  return <article><h1>{post.title}</h1><p>{post.body}</p></article>;
}

// Error boundary (handles 404s, thrown responses, runtime errors)
export function ErrorBoundary() {
  const error = useRouteError();
  if (isRouteErrorResponse(error) && error.status === 404) {
    return <div>Post not found</div>;
  }
  return <div>Something went wrong</div>;
}
```

---

## 2. Action (Mutations)

```tsx
// app/routes/posts.new.tsx
import { json, redirect, type ActionFunctionArgs } from '@remix-run/node';
import { useActionData, Form, useNavigation } from '@remix-run/react';
import { z } from 'zod';

const schema = z.object({ title: z.string().min(1), body: z.string().min(10) });

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const result = schema.safeParse(Object.fromEntries(formData));

  if (!result.success) {
    return json({ errors: result.error.flatten().fieldErrors }, { status: 400 });
  }

  const post = await db.post.create({ data: result.data });
  return redirect(`/posts/${post.id}`);
}

export default function NewPost() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <Form method="post">
      <input name="title" />
      {actionData?.errors?.title && <p>{actionData.errors.title}</p>}
      <textarea name="body" />
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Create Post'}
      </button>
    </Form>
  );
}
```

---

## 3. Nested Routes & Layouts

```
app/routes/
  _layout.tsx          ← shared layout (has <Outlet />)
  _layout.dashboard.tsx ← /dashboard
  _layout.posts.tsx     ← /posts
  _layout.posts.$id.tsx ← /posts/:id
  posts.$id.edit.tsx    ← /posts/:id/edit
```

```tsx
// app/routes/_layout.tsx
import { Outlet, NavLink } from '@remix-run/react';
export default function Layout() {
  return (
    <div>
      <nav><NavLink to="/dashboard">Dashboard</NavLink></nav>
      <main><Outlet /></main>
    </div>
  );
}
```

---

## 4. Optimistic UI

```tsx
import { useFetcher } from '@remix-run/react';

export function LikeButton({ postId, likes }: { postId: string; likes: number }) {
  const fetcher = useFetcher();

  // Optimistic: show new like count before server responds
  const optimisticLikes = fetcher.formData
    ? likes + 1
    : likes;

  return (
    <fetcher.Form method="post" action={`/posts/${postId}/like`}>
      <button type="submit">❤️ {optimisticLikes}</button>
    </fetcher.Form>
  );
}
```

---

## 5. Deferred Loading (Streaming)

```tsx
import { defer } from '@remix-run/node';
import { Await, useLoaderData } from '@remix-run/react';
import { Suspense } from 'react';

export async function loader() {
  // Fast: await immediately
  const user = await getUser();
  // Slow: defer — stream when ready
  const recommendations = getRecommendations(); // no await!
  return defer({ user, recommendations });
}

export default function Page() {
  const { user, recommendations } = useLoaderData<typeof loader>();
  return (
    <div>
      <UserProfile user={user} />
      <Suspense fallback={<Skeleton />}>
        <Await resolve={recommendations}>
          {(recs) => <RecommendationList items={recs} />}
        </Await>
      </Suspense>
    </div>
  );
}
```

---

## Quick Reference

| Pattern | API |
|---------|-----|
| Load data | `export async function loader()` + `useLoaderData()` |
| Handle form | `export async function action()` + `Form` component |
| Form state | `useNavigation().state === 'submitting'` |
| Action result | `useActionData<typeof action>()` |
| Parallel mutations | `useFetcher()` (no navigation) |
| Redirect after action | `return redirect('/path')` |
| Not found / errors | `throw new Response('...', { status: 404 })` |
| Streaming | `defer()` + `<Await>` + `<Suspense>` |

## Anti-Patterns

```
❌ Using useState + fetch for form submission
✅ Use Remix Form + action — handles pending state, errors automatically

❌ One giant route with all data in one loader
✅ Nest routes — each route loads its own data, parallel by default

❌ Loading all data before rendering anything
✅ defer() slow data + Suspense/Await for progressive display

❌ Manual redirect after successful form in client
✅ return redirect() from action — proper HTTP redirect
```
