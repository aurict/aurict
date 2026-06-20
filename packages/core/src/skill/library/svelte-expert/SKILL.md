---
name: svelte-expert
description: "Svelte: Reactive components, Stores, Transitions, SSR with SvelteKit, Performance patterns."
triggers:
  files: ["svelte.config.js", "svelte.config.ts"]
  directories: ["src/routes/", "src/lib/"]
  keywords: ["Svelte", "sveltejs", "SvelteKit", "store", "reactive"]
auto_load_when: "Building applications with Svelte or SvelteKit"
agent: frontend-ops
tools: ["Read", "Write", "Bash"]
---

# Svelte Architecture Patterns

**Focus:** Reactive components, stores, SSR, performance

## 1. Component Patterns

```
Svelte 5 Runes (New):
<script>
  let count = $state(0);
  let double = $derived(count * 2);

  function increment() {
    count += 1;
  }

  $effect(() => {
    console.log('Count changed:', count);
  });
</script>

<button onclick={increment}>
  {count} x 2 = {double}
</button>

Legacy Svelte 4:
<script>
  let count = 0;
  $: double = count * 2;
  $: console.log('Count:', count);
</script>

Component Props:
<script>
  let { name, age = 18, ...rest } = $props();
</script>

<h1 {...rest}>{name} - {age}</h1>

Component Events:
<script>
  let { onclick } = $props();
</script>

<button {onclick}>Click me</button>

export function createEventDispatcher() {
  return (type, detail) => {
    const e = new CustomEvent(type, { detail });
    dispatch('event', e);
  };
}
```

---

## 2. Stores & State

```
Writable Store:
import { writable } from 'svelte/store'

export const count = writable(0)

// Usage in component
<script>
  import { count } from './stores.js'
  $: console.log($count) // Reactive auto-subscription
</script>

<button onclick={() => $count++}>
  {$count}
</button>

Readable Store:
import { readable } from 'svelte/store'

export const time = readable(new Date(), set => {
  const interval = setInterval(() => set(new Date()), 1000)
  return () => clearInterval(interval)
})

Derived Store:
import { derived } from 'svelte/store'
export const doubled = derived(count, $count => $count * 2)

Store with Methods:
function createCounter() {
  const { subscribe, update } = writable(0)
  return {
    subscribe,
    increment: () => update(n => n + 1),
    decrement: () => update(n => n - 1),
    reset: () => update(() => 0)
  }
}
export const counter = createCounter()
```

---

## 3. SvelteKit Routing

```
File-based Routing:
src/routes/
├── +page.svelte          → /
├── +layout.svelte        → Shared layout
├── +page.server.ts        → SSR data loading
├── +page.ts              → Client-side loading
├── +error.svelte         → Error page
├── /api/
│   └── +server.ts        → API endpoint
└── /blog/
    ├── +page.svelte      → /blog
    └── [slug]/
        └── +page.svelte  → /blog/:slug

Page Data Loading:
export const load = async ({ params }) => {
  const post = await fetchPost(params.slug)
  return { post }
}

// +page.svelte
<script>
  let { data } = $props()
</script>

<h1>{data.post.title}</h1>

Form Actions:
export const actions = {
  default: async ({ request }) => {
    const data = await request.formData()
    await saveUser(Object.fromEntries(data))
    return { success: true }
  }
}

// +page.svelte
<form method="POST">
  <input name="name" />
  <button>Submit</button>
</form>
```

---

## 4. Transitions & Animations

```
Built-in Transitions:
<script>
  import { fade, fly, slide } from 'svelte/transition'
  let visible = true
</script>

{#if visible}
  <div transition:fade>Fades in and out</div>
  <div transition:fly={{ y: 20, duration: 300 }}>Flies in</div>
  <div transition:slide>Slides in and out</div>
{/if}

Custom Transitions:
<script>
  function spin(node, { duration }) {
    return {
      duration,
      css: t => `transform: rotate(${t * 360}deg)`
    }
  }
</script>

<div transition:spin={{ duration: 1000 }}>Spinning</div>

Keyed Transitions:
{#each items as item (item.id)}
  <div transition:fade>{item.name}</div>
{/each}

Motion (svelte/motion):
<script>
  import { spring, tweened } from 'svelte/motion'
  const count = spring(0, { stiffness: 0.1, damping: 0.4 })
  const progress = tweened(0, { duration: 500 })
</script>
```

---

## 5. SSR & Hydration

```
SSR Configuration (svelte.config.js):
import adapter from '@sveltejs/adapter-auto'

export default {
  kit: {
    adapter: adapter(),
    prerender: {
      entries: ['*']
    }
  }
}

Client-side Navigation:
import { goto } from '$app/navigation'
import { invalidateAll } from '$app/navigation'

// Navigate
goto('/profile')

// Invalidate data
invalidateAll()

// Invalidate specific URL
invalidate('data/url')

Load Options:
export const load = async ({ fetch, data, params }) => {
  // Server + client
}

export const ssr = true // Enable SSR
export const csr = true // Enable hydration
export const prerender = true // Static generation
```

---

## Key Patterns

1. **Use Runes (Svelte 5)** — $state, $derived, $effect for reactivity
2. **Stores for global state** — Use derived stores for computed values
3. **File-based routing** — SvelteKit standard routing
4. **Transitions built-in** — Use svelte/transition for animations
5. **SSR by default** — Use +page.server.ts for server data
6. **Form actions** — Use actions for server mutations

---

## Anti-Patterns

```
❌ Mutating objects directly
✅ Use $state() or $derived() in Svelte 5

❌ Using complex stores for local state
✅ Use local let variables

❌ No error boundaries
✅ Use +error.svelte for error handling

❌ Not using key blocks for list transitions
✅ Use {#each items as item (item.id)}

❌ Fetching in component without loading state
✅ Use +page.server.ts for data loading

❌ Large bundle sizes
✅ Use dynamic imports for heavy components

❌ Not using form actions
✅ Use actions for mutations, not fetch
```

---

## Quick Reference

| Feature | Syntax | Note |
|---|---|---|
| Reactive | $state(value) | Svelte 5 |
| Derived | $derived(expr) | Svelte 5 |
| Effect | $effect(() => {}) | Svelte 5 |
| Store | writable(initial) | Global state |
| Route load | +page.server.ts | SSR data |
| Form action | actions in +page.server.ts | Server mutation |
| Transition | transition:fade | Built-in |

---

## Decision Tree

```
Reactivity approach (Svelte 5)?
├── Local component state                  → $state(value)
├── Derived / computed value              → $derived(expression)
├── Side effect on state change           → $effect(() => { ... })
└── Global shared state                   → writable()/readable() store + $ prefix

Data loading: +page.server.ts or +page.ts?
├── DB access / server secrets / auth     → +page.server.ts (server-only)
├── Public API call (browser can also do) → +page.ts (both environments)
└── Static data at build time             → +page.ts with prerender = true

Mutation: Form action or fetch?
├── Standard form submit (progressive)    → +page.server.ts actions (recommended)
├── Complex client interaction needed     → fetch + endpoint
└── Real-time / optimistic UI             → fetch + $state for optimistic update
```

---

## Key Rules

1. Svelte 5 only: `$state`, `$derived`, `$effect` — not `let count = 0` + `$:` reactive
2. `$state` for local, `writable` store for global — never global `let` at module level
3. `{#each items as item (item.id)}` always — key required for correct list transitions
4. Form actions > client fetch for mutations — progressive enhancement, no JS needed
5. `+page.server.ts` for DB/secrets; never expose sensitive data through `+page.ts`
6. Dynamic imports for heavy components: `const Heavy = () => import('./Heavy.svelte')`
7. `$effect` cleanup: return a function from $effect to cancel subscriptions

---

## Implementation

```svelte
<!-- Svelte 5 runes — counter with derived + effect -->
<script lang="ts">
  let count    = $state(0)
  let doubled  = $derived(count * 2)
  let history  = $state<number[]>([])

  $effect(() => {
    history = [...history, count]
    // Return cleanup function (runs before next effect or on unmount)
    return () => console.log('cleanup')
  })
</script>

<button onclick={() => count++}>Count: {count} × 2 = {doubled}</button>
<p>History: {history.join(', ')}</p>

<!-- Form action — +page.server.ts -->
```

```typescript
// src/routes/posts/+page.server.ts
import type { Actions, PageServerLoad } from './$types'
import { fail, redirect } from '@sveltejs/kit'

export const load: PageServerLoad = async ({ locals }) => {
  const posts = await db.post.findMany({ where: { userId: locals.user.id } })
  return { posts }
}

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const data  = await request.formData()
    const title = data.get('title') as string

    if (!title || title.length < 1) {
      return fail(400, { errors: { title: 'Required' } })
    }

    await db.post.create({ data: { title, userId: locals.user.id } })
    throw redirect(303, '/posts')
  },
}
```

```svelte
<!-- src/routes/posts/+page.svelte -->
<script lang="ts">
  import { enhance } from '$app/forms'
  let { data, form } = $props()
</script>

<ul>
  {#each data.posts as post (post.id)}
    <li>{post.title}</li>
  {/each}
</ul>

<form method="POST" action="?/create" use:enhance>
  <input name="title" />
  {#if form?.errors?.title}<span>{form.errors.title}</span>{/if}
  <button>Create</button>
</form>
```
