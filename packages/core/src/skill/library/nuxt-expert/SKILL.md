---
name: nuxt-expert
description: "Nuxt 3/4: Pages, composables, server routes, data fetching (useFetch/useAsyncData), Nitro, auto-imports, modules."
triggers:
  extensions: [".vue", ".ts"]
  filenames: ["nuxt.config.ts", "nuxt.config.js"]
  directories: ["pages/", "composables/", "server/api/"]
  keywords: ["nuxt", "useFetch", "useAsyncData", "defineNuxtConfig", "NuxtPage", "NuxtLayout", "useRoute", "navigateTo"]
auto_load_when: "Building a Nuxt application"
agent: frontend-ops
tools: ["Read", "Write", "Bash"]
---

# Nuxt 3/4 Patterns

**Version:** Nuxt 3.x | **Focus:** Pages, composables, server routes, data fetching, modules

---

## 1. Project Structure

```
nuxt-app/
├── pages/           ← file-based routing
│   ├── index.vue
│   └── posts/
│       ├── index.vue        (/posts)
│       └── [id].vue         (/posts/:id)
├── components/      ← auto-imported
├── composables/     ← auto-imported (useXxx)
├── server/
│   ├── api/         ← API routes (Nitro)
│   └── middleware/
├── layouts/         ← page layouts
├── middleware/      ← route middleware
├── plugins/         ← Nuxt plugins
└── nuxt.config.ts
```

---

## 2. Data Fetching

```vue
<!-- pages/posts/[id].vue -->
<script setup lang="ts">
const route = useRoute();

// useFetch: auto-fetches, SSR-compatible, deduplicates
const { data: post, error, refresh } = await useFetch(`/api/posts/${route.params.id}`, {
  key: `post-${route.params.id}`,   // cache key
  pick: ['id', 'title', 'body'],    // only fetch needed fields
});

// useAsyncData: for custom logic
const { data: user } = await useAsyncData('user', () => $fetch('/api/me'));

// Client-only fetch (no SSR)
const { data } = useFetch('/api/dashboard', { server: false });
</script>

<template>
  <div>
    <h1>{{ post?.title }}</h1>
    <p>{{ post?.body }}</p>
    <button @click="refresh">Refresh</button>
  </div>
</template>
```

---

## 3. Server Routes (Nitro)

```ts
// server/api/posts/index.get.ts
import { defineEventHandler, getQuery } from 'h3';
export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  return db.post.findMany({ skip: Number(query.page) * 20, take: 20 });
});

// server/api/posts/[id].put.ts
import { defineEventHandler, readBody, getRouterParam } from 'h3';
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const body = await readBody(event);
  return db.post.update({ where: { id }, data: body });
});

// server/api/auth/login.post.ts
export default defineEventHandler(async (event) => {
  const { email, password } = await readBody(event);
  // auth logic...
  setCookie(event, 'session', sessionToken, { httpOnly: true, secure: true });
  return { ok: true };
});
```

---

## 4. Composables (Auto-Imported)

```ts
// composables/useCounter.ts
export function useCounter(initial = 0) {
  const count = ref(initial);
  const increment = () => count.value++;
  const decrement = () => count.value--;
  return { count: readonly(count), increment, decrement };
}

// composables/useUser.ts
export function useUser() {
  // useCookie is auto-imported
  const token = useCookie<string>('auth_token');
  const { data: user } = useFetch('/api/me', {
    headers: computed(() => ({ Authorization: `Bearer ${token.value}` })),
    watch: [token], // re-fetch when token changes
  });
  return { user, token };
}
```

---

## 5. Route Middleware

```ts
// middleware/auth.ts
export default defineNuxtRouteMiddleware((to) => {
  const { user } = useUser();
  if (!user.value && to.path !== '/login') {
    return navigateTo('/login');
  }
});

// pages/dashboard.vue — apply middleware
definePageMeta({ middleware: ['auth'] });
```

---

## 6. nuxt.config.ts

```ts
export default defineNuxtConfig({
  modules: ['@nuxtjs/tailwindcss', '@nuxt/image', '@pinia/nuxt', 'nuxt-auth-utils'],
  runtimeConfig: {
    // Server-only (env vars)
    dbUrl: process.env.DATABASE_URL,
    // Public (accessible in browser)
    public: { apiBase: '/api' },
  },
  nitro: {
    preset: 'vercel',  // or 'node-server', 'cloudflare-pages'
  },
  experimental: { typedPages: true },
});
```

---

## Quick Reference

| Need | API |
|------|-----|
| Fetch data (SSR) | `useFetch('/api/...')` |
| Custom async logic | `useAsyncData('key', () => ...)` |
| API endpoint | `server/api/[name].[method].ts` |
| Route params | `useRoute().params.id` |
| Query params | `useRoute().query.page` |
| Redirect | `navigateTo('/path')` |
| Cookies | `useCookie('name')` |
| State | `useState('key', () => defaultVal)` |

## Anti-Patterns

```
❌ Using axios/fetch directly in components for initial data
✅ useFetch handles SSR, deduplication, and caching automatically

❌ Not specifying key in useFetch inside loops
✅ Always unique key: useFetch(url, { key: `item-${id}` })

❌ Server routes in pages/ directory
✅ Server routes must be in server/api/ (Nitro)

❌ Mutating useRoute() directly for navigation
✅ navigateTo('/path') or router.push() for programmatic nav
```
