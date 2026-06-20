---
name: state-management
description: "State patterns: When to use what, Zustand vs Context vs Query, Performance strategies, Persistence." 
triggers:
  extensions: [".tsx", ".ts"]
  keywords: ["state", "Zustand", "Redux", "Jotai", "Recoil", "context", "store", "atom", "selector"]
auto_load_when: "Choosing or implementing state management"
agent: frontend-ops
tools: ["Read", "Write", "Bash"]
---

# State Management Architecture Patterns

**Focus:** Decision trees, when-to-use-what, performance

## 1. State Type Decision Tree

```
What type of state?
├── Transient UI state (modal open, tab active)
│   └── useState for component-local
│   └── Zustand for cross-component
│
├── Persisted UI state (theme, user preferences)
│   └── Zustand with persist middleware
│   └── Sync to localStorage/IndexedDB
│
├── Server state (API data, fetched content)
│   └── TanStack Query / SWR (NOT Zustand!)
│   └── Caching, refetching, invalidation built-in
│
└── Complex form state
    └── useReducer or Zustand
    └── Validation in separate layer
```

**Why NOT Zustand for server state:**
- No caching strategy built-in
- Manual refetch logic needed
- No invalidation helpers

---

## 2. Zustand When-to-Use

```
Use Zustand for:
├── Global UI state (auth user, theme, sidebar)
├── Shared component state (cart, notifications)
├── Complex client state (multi-step wizard)
└── State with actions (not just data)

Don't use Zustand for:
├── Server data → use TanStack Query
├── Simple local state → use useState
├── High-frequency updates → consider atoms
└── Derived calculations → use selectors
```

---

## 3. State Architecture

```
How to organize store:
├── Single store vs multiple stores
│   └── Single: small-medium apps, simple state
│   └── Multiple: large apps, distinct domains
│
├── Normalized vs nested
│   └── Normalized: flat, ID-based references
│   └── Nested: component-friendly, harder to update
│
└── Actions organization
    └── By feature (auth: login, logout)
    └── By type (user: get, update, delete)
```

---

## 4. Performance Patterns

```
When to optimize (measure first!):
├── Component re-renders on state change
│   └── Use selectors: useStore(s => s.specificField)
│   └── Don't use: useStore() - subscribes to entire state
│
├── Expensive computed values
│   └── Use memoized selectors
│   └── Formula: useStore(s => compute(s.field))
│
└── Frequent updates
    └── Batch updates when possible
    └── Consider atomic updates (Jotai)
```

---

## 5. Persistence Strategy

```
What to persist:
├── User preferences (theme, language)
├── Auth state (token, refresh token)
└── Cart/wishlist (if multi-session)

What NOT to persist:
├── Server data (use server state management)
├── Large datasets
└── Security-critical data (tokens in memory only)

Implementation:
├── Zustand persist middleware
├── Choose storage: localStorage (simple), IndexedDB (large)
└── Handle hydration mismatch
```

---

## 6. Context vs Zustand

```
When to use Context:
├── Low-frequency updates (theme, locale)
├── Simple values (no complex logic)
└── App-wide constants

When to use Zustand:
├── Medium-high frequency updates
├── Complex state with actions
├── Need selectors (performance)
└── Need middleware (persist, immer)
```

**Note:** Zustand with selectors = better performance than Context in most cases.

---

## 7. Testing Strategy

```
What to test:
├── Actions produce correct state changes
├── Selectors return correct values
└── Selectors only re-render when dependencies change

What NOT to test:
├── Implementation details (how state is stored)
├── Internal selector logic (test behavior instead)
└── UI rendering (that's component test)
```

---

## Key Patterns

1. **Server data** → TanStack Query, NOT local state
2. **UI state** → Zustand for cross-component
3. **Select everywhere** - Don't subscribe to full state
4. **Persist only what makes sense** - Auth, preferences
5. **Test behavior** - Not implementation

---

## Anti-Patterns

```
❌ Global state for everything (even local UI state)
✅ Keep state as local as possible; hoist only when needed

❌ Storing server data in Redux/Zustand (duplicates cache)
✅ Use TanStack Query / SWR for server state; client store for UI state

❌ Deeply nested state objects
✅ Normalize state: entities by ID map + IDs array

❌ Mutating state directly (bypassing immutability)
✅ Immer or spread for immutable updates — never direct mutation

❌ Synchronizing two separate state slices manually
✅ Derive computed values with selectors — don't duplicate state
```

---

## Quick Reference

| State type | Solution | Why |
|---|---|---|
| Server data | TanStack Query / SWR | Cache + deduplicate |
| Global UI | Zustand | Minimal boilerplate |
| Complex global | Redux Toolkit | Time-travel debug |
| Component local | useState | No over-engineering |
| Form | react-hook-form | Performance |
| URL state | searchParams | Shareable, bookmarkable |
