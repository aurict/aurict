---
name: react-expert
description: "React 19: Hooks decision tree, State patterns, Component composition, Performance optimization strategy." 
triggers:
  extensions: [".tsx", ".jsx"]
  directories: ["components/", "app/"]
  keywords: ["React", "hooks", "useState", "useEffect", "useCallback", "Suspense", "use()"]
auto_load_when: "Writing React components or hooks"
agent: frontend-ops
tools: ["Read", "Write", "Bash"]
---

# React 19 Architecture Patterns

**Version:** React 19.2 | **Focus:** Decision trees, patterns, performance

## 1. use() Hook Decision

```
When to use use():
├── Promise in component → use(promise) pauses until resolved
├── Needs Suspense boundary → wraps in <Suspense>
├── Parallel data fetching → multiple use() in same component
│   └── React fetches all in parallel, streams in as ready
│
└── NOT for: client-side data, local state
```

**Pattern:**
```tsx
// BAD - blocking render
const data = await fetchData() // blocks entire component

// GOOD - uses Suspense
const data = use(fetchData()) // streams in, shows fallback while loading
```

---

## 2. State Pattern Selection

```
What type of state?
├── UI state (open/close, selected) → useState
│   └── Local component, simple transitions
│
├── Complex local state → useReducer
│   └── Multiple sub-values, complex transitions
│
├── Shared across components → Zustand/Context
│   └── Theme, auth, user preferences
│
└── Server data → React Query / TanStack Query
    └── NOT useState - cache on server
```

---

## 3. useOptimistic Pattern

```
When to use optimistic updates:
├── User action requires server round-trip
├── Want instant visual feedback
├── Can infer result from action
└── Should handle error case (rollback)

Flow:
1. User clicks
2. Update UI immediately (useOptimistic)
3. Send server request
4. On success: actual server data replaces optimistic
5. On error: optimistic reverts to original
```

---

## 4. useActionState Pattern

```
When to use:
├── Any form with server submission
├── Need validation errors displayed
├── Need pending state for loading UI
└── Want progressive enhancement (works without JS)

Flow:
1. Server Action returns { errors?, message? }
2. useActionState captures return value
3. formAction triggers Server Action
4. isPending shows loading state
5. Form re-renders with result
```

---

## 5. Component Composition

```
When to compose vs flatten:
├── Flat works when:
│   └── Few components, simple relationships
│
└── Compose (children/header/footer slots) when:
    └── Multiple page types share structure
    └── Need different content in same wrapper
    └── Parallel routes (@slot pattern)
    └── Intercepting routes (modal wrapper)
```

---

## 6. Performance Decision Tree

```
Is re-render a problem?
├── YES - measure first with React DevTools Profiler
│
├── If slow - fix causes, not symptoms:
│   ├── Too many components → flatten tree
│   ├── Large data → virtualization
│   ├── Expensive computation → useMemo/useCallback
│   └── Wrong dependency arrays → useCallback for functions
│
└── NO - don't optimize
```

**useMemo/useCallback rules:**
- Only use when calculation is expensive (>1ms)
- Dependency array changes = new calculation
- Don't wrap every function - only callbacks passed to children

---

## 7. Suspense Strategy

```
When to use Suspense:
├── Data fetching in components
├── Code splitting (lazy)
├── Image loading
└── Any async resource

Granular vs Route-level:
├── Route-level (loading.tsx) → OK for simple pages
│   └── All content loads together
│
└── Component-level (<Suspense>) → PREFERRED
    └── Different parts load independently
    └── User sees content faster
    └── Avoids "waterfall" loading
```

---

## 8. Server vs Client Decision

```
Should this be Server or Client Component?

Ask in order:
1. Does it need user interaction? → Client
2. Does it use browser APIs? → Client
3. Does it use hooks (useState, etc)? → Client
4. Does it fetch data for display? → Server
5. Does it render layout/structure? → Server
```

**Hybrid pattern:** Server Component fetches, passes data to Client Component that handles interaction.

---

## Key Patterns

1. **use() for async** - Suspense for data, not blocking
2. **Optimistic updates** - Instant feedback, handle errors
3. **Action state** - Forms with validation
4. **Compose when needed** - Flexibility over flatness
5. **Measure first** - Profile before optimizing

---

## Anti-Patterns

```
❌ useEffect for derived state
✅ Compute derived state inline during render — no effect needed

❌ Mutating state directly (array.push, obj.key = val)
✅ Always return new references: [...arr, item], { ...obj, key: val }

❌ Large components that re-render on every parent change
✅ React.memo on stable components; split fast-changing state down

❌ useCallback/useMemo everywhere as "optimization"
✅ Profile first; memoize only when renders measurably slow

❌ key={index} for dynamic lists
✅ key={item.id} — stable, unique identity prevents wrong reconciliation
```

---

## Quick Reference

| Hook | Use case | Note |
|---|---|---|
| useState | Local UI state | Simple values |
| useReducer | Complex state machine | Action-based |
| useContext | Cross-tree shared state | Don't overuse |
| useEffect | Side effects only | Not for derived state |
| useCallback | Stable function ref | Only when passed to memo'd child |
| useMemo | Expensive computation | Profile first |
| useRef | DOM ref / mutable | Doesn't trigger re-render |
| useTransition | Non-urgent updates | Mark slow state as transition |

---

## Decision Tree

```
State type?
├── Local UI (open/close, input value)       → useState
├── Complex: multiple sub-values / actions  → useReducer
├── Shared across components                 → Zustand or Context
└── Server data (async, cache needed)        → TanStack Query / SWR

Async in component?
├── Need Suspense boundary                   → use(promise)
├── Side effect after render                 → useEffect (not for fetching)
└── Form with server round-trip              → useActionState + Server Action

Performance problem?
├── Profile with React DevTools FIRST
├── Re-render cause: expensive compute       → useMemo
├── Re-render cause: callback recreation    → useCallback (only when passed to memo'd child)
├── Re-render cause: list key unstable       → key={item.id}, not key={index}
└── No measured problem                      → do NOT optimize
```

---

## Key Rules

1. Never mutate state directly — always return new refs: `[...arr, item]`, `{...obj, key: val}`
2. Derive computed values during render — not in a `useEffect` + `setState`
3. `key={item.id}` on dynamic lists — stable identity prevents reconciliation bugs
4. `useCallback` / `useMemo` only after profiling confirms a problem
5. Server fetches in Server Components → pass data as props to Client
6. `useEffect` for side effects only (subscriptions, DOM focus) — not initial data fetching
7. Measure with React DevTools Profiler before any optimization

---

## Implementation

```tsx
// useActionState — form with server validation + pending state
'use client'
import { useActionState } from 'react'
import { createUser } from './actions'

type State = { errors?: { email?: string; name?: string }; message?: string }

export function CreateUserForm() {
  const [state, formAction, isPending] = useActionState<State, FormData>(
    createUser,
    {}
  )
  return (
    <form action={formAction}>
      <input name="name" aria-invalid={!!state.errors?.name} />
      {state.errors?.name && <span>{state.errors.name}</span>}
      <input name="email" />
      {state.errors?.email && <span>{state.errors.email}</span>}
      <button disabled={isPending}>{isPending ? 'Saving…' : 'Create'}</button>
    </form>
  )
}

// useOptimistic — instant feedback, auto-rollback on error
'use client'
import { useOptimistic } from 'react'

export function LikeButton({ postId, initialLikes }: { postId: string; initialLikes: number }) {
  const [likes, addLike] = useOptimistic(initialLikes, (current) => current + 1)

  async function handleLike() {
    addLike(undefined)   // immediate UI update
    await likePost(postId)  // actual server call; error auto-reverts
  }

  return <button onClick={handleLike}>{likes} ♥</button>
}
```
