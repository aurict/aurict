---
name: bundle-optimization
description: "Code splitting, tree shaking, lazy loading" 
triggers:
  filenames: ["vite.config", "webpack.config", "next.config", "rollup.config"]
  keywords: ["bundle", "chunk", "tree-shaking", "lazy", "code split", "dynamic import"]
auto_load_when: "Optimizing bundle size or code splitting"
agent: frontend-ops
tools: ["Read", "Write", "Bash"]
---

# Bundle Optimization Patterns

Focus: Code splitting, tree shaking, lazy loading

## 1. Code Splitting Decision Tree

```
When to split by route:
├── SPA with routes → yes
├── Independent pages → yes
├── Different user paths → yes
└── Single page → no split needed

When to split vendor:
├── Large dependencies → yes
├── Separate updates → yes
├── Caching → yes
└── Small deps → include in app

When to split common:
├── Shared code → yes
├── Multiple routes → yes
├── Entry points → yes
└── Unused common → dynamic import
```

## 2. Dynamic Import Decision Tree

```
When to use dynamic import:
├── Route-based code → yes
├── Modal/dialog → yes
├── Heavy feature → yes
└── User interaction required → yes

When to prefetch:
├── High likelihood → yes (<link rel="prefetch">)
├── Next likely page → yes
├── Low likelihood → no
└── Slow connection → no

When to preload:
├── Critical → yes
├── Next navigation → yes
├── User action triggers → no
└── Uncertain → no
```

## 3. Tree Shaking Decision Tree

```
When tree shaking works:
├── ES modules → yes
├── Side-effect free → yes
├── Named exports → yes
├── Re-exported → depends

When tree shaking fails:
├── CommonJS → no
├── Dynamic require → no
├── Side effects → declared
├── Uglify/compress → verify

How to enable:
├── ES modules → use "type": "module"
├── sideEffects → declare
├── Clean imports → verify
└── Verify output → check bundle
```

## 4. Lazy Loading Decision Tree

```
When to lazy load:
├── Below fold → yes
├── Not in viewport → yes
├── User action required → yes
└── Heavy component → yes

When to eager load:
├── Above fold → yes
├── Likely interaction → yes
├── Initial route → yes
└── Critical UI → yes

When to use loading=lazy:
├── Images → below fold
├── Iframes → optional content
└── Native lazy → yes
```

## 5. Bundle Analysis Decision Tree

```
When to analyze:
├── Large bundle → yes
├── Unexpected size → yes
├── Before deploy → yes
└── Monitoring → yes

What to look for:
├── Duplicate code → deduplicate
├── Large dependencies → code split
├── Unused code → remove
├── Wrong format → optimize

Tools decision:
├── webpack-bundle-analyzer → webpack
├── source-map-explorer → source maps
├── rollup-plugin-visualizer → rollup
└── Package size → npm
```

## 6. Size Budget Decision Tree

```
When to set budget:
├── Any project → yes
├── Performance goals → yes
├── Team ownership → yes
└── CI integration → yes

Budget guidelines:
├── Initial load → < 170KB compressed
├── Individual chunk → < 40KB
├── Per route → < 100KB
└── Total JS → < 500KB compressed

When to exceed:
├── Trade-off documented → yes
├── Performance impact known → yes
├── No alternative → yes
└── CI warning → investigate
```

## When to Use Decision Summary

1. Split by route: dynamic imports for each route
2. Lazy load below fold, eager load above fold
3. Tree shake: ES modules, declare sideEffects
4. Analyze bundles regularly, set size budgets
5. Use prefetch for likely, preload for critical

---

## Anti-Patterns

```
❌ Importing entire library for one utility (import _ from 'lodash')
✅ Named imports only: import { debounce } from 'lodash-es'

❌ No code splitting — one 2MB bundle
✅ Dynamic import() for routes and heavy components

❌ Images not compressed or sized
✅ Next/Image or <picture> with srcset; WebP/AVIF formats

❌ Third-party scripts blocking render
✅ async/defer for non-critical; load analytics after interaction

❌ No tree-shaking (CommonJS modules)
✅ ESM everywhere — enables dead code elimination
```

---

## Quick Reference

| Optimization | Technique | Impact |
|---|---|---|
| Route splitting | dynamic import() | Large |
| Tree shaking | ESM named imports | Medium–Large |
| Image formats | WebP/AVIF + srcset | Large |
| Font loading | font-display: swap + subset | Medium |
| Compression | Brotli / gzip | Medium |
| Preload | <link rel=preload> | Medium |
| Bundle analysis | webpack-bundle-analyzer | Discovery |

---

## Decision Tree

```
Split code?
├── SPA with multiple routes            → dynamic import() per route
├── Heavy component below fold         → dynamic import() + React.lazy
├── Feature used rarely (admin panel)  → dynamic import on user action
└── Small util (<5KB), used everywhere → keep in main bundle

Tree shaking working?
├── Named import from ESM              → tree shaking works
├── import * as lodash from 'lodash'   → no tree shaking — use lodash-es
├── CommonJS require()                 → no tree shaking
└── sideEffects: false in package.json → signals bundler to remove dead code

Image optimization?
├── Photos, complex images             → WebP/AVIF + srcset
├── Simple icons/logos                 → SVG inline
├── Next.js                            → <Image /> component (automatic)
└── Plain HTML                         → <picture> with srcset + loading="lazy"

Bundle too large?
└── Analyze first: npx vite-bundle-visualizer / webpack-bundle-analyzer
    ├── Duplicate deps                 → dedupe in package.json
    ├── One large lib                  → lazy import it
    └── Many small chunks (>50)       → adjust minChunkSize
```

---

## Key Rules

1. Route-level code splitting by default — never ship one monolithic bundle
2. Named ESM imports only: `import { debounce } from 'lodash-es'`, not `import _ from 'lodash'`
3. Analyze before optimizing — webpack-bundle-analyzer or vite-bundle-visualizer first
4. Images: WebP/AVIF with srcset; `loading="lazy"` for below-fold images
5. Initial JS budget: < 170KB compressed; per route < 100KB
6. `font-display: swap` on web fonts; subset to used characters only
7. Third-party scripts: `async` or `defer`; load analytics after first interaction

---

## Implementation

```typescript
// React route-level splitting (Next.js or React Router)
import { lazy, Suspense } from 'react'

const AdminPanel = lazy(() => import('./AdminPanel'))
const Chart = lazy(() => import('./Chart'))

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminPanel />
    </Suspense>
  )
}

// Dynamic import on user action
async function loadHeavyFeature() {
  const { HeavyFeature } = await import('./HeavyFeature')
  return HeavyFeature
}

// vite.config.ts — manual chunks for vendor splitting
import { defineConfig } from 'vite'
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui:     ['@radix-ui/react-dialog', '@radix-ui/react-tooltip'],
        },
      },
    },
  },
})

// next.config.ts — bundle analysis
import bundleAnalyzer from '@next/bundle-analyzer'
const withBundleAnalyzer = bundleAnalyzer({ enabled: process.env.ANALYZE === 'true' })
export default withBundleAnalyzer({ /* config */ })
// Usage: ANALYZE=true next build
```
