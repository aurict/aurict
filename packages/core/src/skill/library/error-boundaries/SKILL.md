---
name: error-boundaries
description: "React Error Boundaries: placement strategy, fallback UI, error recovery, Next.js error.tsx, async error handling."
triggers:
  deps: ["react", "react-dom", "next"]
  extensions: [".tsx", ".jsx"]
  keywords: ["ErrorBoundary", "error.tsx", "onError", "fallback"]
auto_load_when: "Adding error boundaries or handling React rendering errors"
tags: ["react", "error-handling", "error-boundary", "next", "resilience"]
priority: 6
---

# React Error Boundary Patterns

## Quick Reference

```
Class EB:    class EB extends Component { static getDerivedStateFromError(e) { return { hasError: true } } }
Next.js:     error.tsx co-located with page.tsx → automatic boundary
Layout EB:   layout error.tsx catches all pages in that segment
Reset:       <ErrorBoundary onReset={() => reset()}> | router.refresh() in Next.js error.tsx
```

**Minimal error boundary:**
```tsx
class ErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }> {
  state = { hasError: false, error: null as Error | null }
  static getDerivedStateFromError(error: Error) { return { hasError: true, error } }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error(error, info.componentStack) }
  render() { return this.state.hasError ? this.props.fallback : this.props.children }
}
```

---

## Decision Tree

```
Error scope?
├── Entire app       → root layout.tsx + global error.tsx (Next.js)
├── Route/page       → error.tsx next to page.tsx
├── Widget/section   → wrap component in <ErrorBoundary fallback={<FallbackUI />}>
└── Third-party lib  → wrap in EB to prevent unknown libs from crashing app

Recovery action?
├── Retry same data → reset button + error.tsx reset() prop from Next.js
├── Navigate away   → redirect to home or safe page
├── Show cached     → render last known good state from ref
└── Report only     → log to Sentry/monitoring, show generic message

Async errors?
├── Server Components → throw in async function → caught by error.tsx
├── Client mutations  → try/catch in event handler → local error state
└── useEffect fetch   → catch in effect → setError state → render error UI
```

---

## Anti-Patterns

- Single root-level error boundary — too coarse; one crash takes down entire app
- Catching errors in error boundaries and re-throwing — EB renders, caught state is final; don't re-throw
- `try/catch` around JSX — ErrorBoundaries catch render errors; `try/catch` can't
- No reset mechanism — user stuck on error screen with no way out
- Showing raw error messages in production — leak implementation details; show friendly message, log technical details
- Not logging errors in `componentDidCatch` — silent failures are harder to debug
- `useEffect` with missing error handler — always handle promise rejections in effects

---

## Key Rules

1. Error Boundaries only catch errors in render, lifecycle methods, and constructors — NOT in event handlers or async code
2. For event handler errors: use `try/catch` + local state
3. Next.js `error.tsx`: must be a Client Component (`"use client"`), receives `{ error, reset }` props
4. `global-error.tsx` catches root layout errors and replaces the entire page — must include `<html>` and `<body>`
5. Multiple granular boundaries > one large boundary — limits blast radius
6. Always log to error monitoring service in `componentDidCatch`

---

## Implementation

**Next.js error.tsx with retry:**
```tsx
"use client"
import { useEffect } from "react"

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error) // or send to Sentry
  }, [error])

  return (
    <div>
      <h2>Something went wrong</h2>
      <p>{process.env.NODE_ENV === "development" ? error.message : "An unexpected error occurred"}</p>
      <button onClick={reset}>Try again</button>
    </div>
  )
}
```

**Reusable class ErrorBoundary with logging:**
```tsx
class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, { componentStack }: ErrorInfo) {
    reportError({ error, componentStack, userId: getCurrentUserId() })
  }

  handleReset = () => {
    this.setState({ hasError: false })
    this.props.onReset?.()
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} onRetry={this.handleReset} />
    }
    return this.props.children
  }
}
```
