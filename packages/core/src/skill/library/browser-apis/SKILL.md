---
name: browser-apis
description: "Browser APIs: Storage, IndexedDB, BroadcastChannel, SharedWorker, Clipboard" 
triggers:
  extensions: [".ts", ".tsx"]
  keywords: ["navigator", "localStorage", "IndexedDB", "ServiceWorker", "clipboard", "geolocation", "notification", "Web API"]
auto_load_when: "Using browser-native APIs"
agent: frontend-ops
tools: ["Read", "Write", "Bash"]
---

# Browser APIs Patterns

**Focus:** Client-side storage, cross-tab communication, background processing

## 1. Storage Decision Tree

```
Use localStorage when:
├── Simple key-value pairs
├── String data only
├── Under 5MB
└── Synchronous access OK

Use sessionStorage when:
├── Tab-specific data
├── Auto-clear on tab close
└── Sensitive data (per tab)

Use IndexedDB when:
├── Large structured data
├── Complex queries needed
├── Binary data (blobs)
└── Transaction support needed

Use Cache API when:
├── HTTP response caching
├── Offline support
└── Network-first/fallback
```

---

## 2. IndexedDB Patterns

```
Schema design:
├── Object stores: like tables
├── Indexes: for query performance
└── Version increment: for migrations

Transaction modes:
├── Read-only: safe, concurrent
├── Read-write: single writer
└── Version change: schema changes

Async patterns:
├── Promises (modern)
├── Event-based (legacy)
└── Cursor for large datasets

Common mistakes:
├── Not handling version upgrades
├── Transaction too long
└── Storing non-serializable
```

---

## 3. BroadcastChannel Patterns

```
Use case: Cross-tab sync
├── Same-origin tabs only
├── Real-time communication
└── No server needed

Implementation:
├── Create: new BroadcastChannel('name')
├── Send: channel.postMessage(data)
└── Receive: channel.onmessage

Use patterns:
├── Login state sync
├── Theme changes
├── Cache invalidation
└── Form state sharing

Limits:
├── 1MB message size
├── Not supported in all browsers
└── Safari: limited support
```

---

## 4. SharedWorker Patterns

```
Use case:
├── Shared state across tabs
├── Background processing
└── Single connection management

Communication:
├── Port-based messaging
├── MessageChannel for direct comm
└── Shared state via IndexedDB

Lifecycle:
├── Created on first connection
├── Stays alive while any tab connected
└── Dies when last tab closes

Warning:
├── Debugging is hard
├── Memory leaks possible
└── Browser support varies
```

---

## 5. Clipboard API Patterns

```
Read (paste):
├── Requires permission (navigator.permissions)
├── Support varies by browser
└── Handle plain text and HTML

Write (copy):
├── navigator.clipboard.writeText()
├── Modern: write() with ClipboardItem
├── Fallback: execCommand (deprecated)

Security:
├── User gesture required
├── Permission prompts
└── Don't trust clipboard content

Pattern:
├── Try modern API first
├── Handle errors gracefully
└── Provide fallback UI
```

---

## 6. Storage Limits & Quotas

```
localStorage:
├── 5-10MB per origin
├── Synchronous, blocking
└── No transactions

sessionStorage:
├── Same limit as localStorage
├── Per-tab isolation
└── Cleared on close

IndexedDB:
├── Variable: 50MB+
├── User can increase
└── Async, non-blocking

Cache API:
├── No fixed limit
├── Browser-managed eviction
└── Per-origin quota
```

---

## Key Patterns

1. **IndexedDB for complexity** - Queries, large data
2. **localStorage for simple** - Quick, synchronous
3. **BroadcastChannel** - Cross-tab sync, no server
4. **SharedWorker** - Shared background processing
5. **Clipboard requires gesture** - Don't rely on read
6. **Always handle quota errors** - Storage limited

---

## Anti-Patterns

```
❌ IntersectionObserver not disconnected after element removed
✅ observer.disconnect() in cleanup / useEffect return

❌ Blocking main thread with synchronous XHR
✅ Always async: fetch() with await

❌ Storing sensitive data in localStorage (XSS accessible)
✅ Sensitive data in HttpOnly cookies; localStorage only for non-sensitive

❌ Registering event listeners without removing on unmount
✅ Return cleanup function in useEffect; removeEventListener

❌ navigator.geolocation without feature detect
✅ Always feature-detect: if ('geolocation' in navigator)
```

---

## Quick Reference

| API | Use case | MDN |
|---|---|---|
| IntersectionObserver | Lazy load, scroll trigger | observe/unobserve |
| ResizeObserver | Responsive components | observe element |
| MutationObserver | Watch DOM changes | observe with config |
| Web Workers | Off-thread computation | postMessage |
| IndexedDB | Large client storage | via idb library |
| Web Crypto | Client-side crypto | subtle.digest, encrypt |

---

## Decision Tree

```
Client-side storage: which API?
├── Simple config, theme, token < 5KB  → localStorage (sync, string only)
├── Per-tab session data                → sessionStorage (cleared on tab close)
├── Large structured data / blobs      → IndexedDB (async, transactions)
└── HTTP response caching / offline    → Cache API (Service Worker)

Cross-tab communication?
├── Simple broadcast (same origin)     → BroadcastChannel
├── Shared state + background work     → SharedWorker + MessagePort
└── Heavy computation off main thread  → Web Worker (isolated, no shared DOM)

Observer pattern?
├── Watch element entering viewport    → IntersectionObserver (lazy load, infinite scroll)
├── Watch element size change          → ResizeObserver (responsive components)
└── Watch DOM mutations                → MutationObserver (third-party DOM changes)

Clipboard operation?
├── Write (copy to clipboard)          → navigator.clipboard.writeText() — requires focus
├── Read (paste from clipboard)        → navigator.clipboard.readText() — requires permission
└── No user gesture available          → document.execCommand('copy') fallback (deprecated)
```

---

## Key Rules

1. Never store sensitive data in localStorage — XSS can read it; use HttpOnly cookies
2. Always feature-detect before using browser APIs: `if ('geolocation' in navigator)`
3. Disconnect observers when element is removed: `observer.disconnect()` in cleanup
4. Remove event listeners on unmount to prevent memory leaks
5. IndexedDB: always handle `versionchange` and `upgradeneeded` events for migrations
6. Service Workers: register after `load` event — don't block initial page parse
7. Clipboard API requires a transient user gesture — don't call from async without it

---

## Implementation

```typescript
// localStorage wrapper with JSON support
const storage = {
  get<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : fallback
    } catch { return fallback }
  },
  set(key: string, value: unknown) {
    localStorage.setItem(key, JSON.stringify(value))
  },
  remove(key: string) { localStorage.removeItem(key) },
}

// IntersectionObserver for lazy loading
function useLazyLoad(callback: () => void) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        callback()
        observer.disconnect()
      }
    }, { threshold: 0.1 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [callback])

  return ref
}

// BroadcastChannel for cross-tab sync
const channel = new BroadcastChannel('auth-state')

function logout() {
  clearSession()
  channel.postMessage({ type: 'logout' })
}

channel.onmessage = (event) => {
  if (event.data.type === 'logout') {
    window.location.href = '/login'
  }
}

// Clipboard copy with fallback
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Legacy fallback
    const el = document.createElement('textarea')
    el.value = text
    document.body.appendChild(el)
    el.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(el)
    return ok
  }
}
```
