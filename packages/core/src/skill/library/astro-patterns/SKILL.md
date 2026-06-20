---
name: astro-patterns
description: "Astro: Content-focused web framework, Static Site Generation, Island Architecture, Component patterns, View Transitions."
triggers:
  files: ["astro.config.mjs", "astro.config.ts"]
  directories: ["src/pages/", "src/layouts/", "src/components/"]
  keywords: ["Astro", "astrojs", "island", "static", "SSG", "content collections"]
auto_load_when: "Building content sites, blogs, documentation, or landing pages with Astro"
agent: frontend-ops
tools: ["Read", "Write", "Bash"]
---

# Astro Framework Patterns

**Focus:** Content sites, static generation, island architecture, performance

## 1. Project Structure

```
Standard Astro Project:
src/
├── pages/
│   ├── index.astro              # Homepage
│   ├── blog/
│   │   ├── index.astro          # Blog listing
│   │   ├── [slug].astro        # Dynamic blog post
│   │   └── [...page].astro     # Pagination
│   └── api/
│       └── [...slug].ts        # API endpoints (SSR)
├── components/
│   ├── BaseHead.astro          # Meta tags, SEO
│   ├── Header.astro
│   ├── Footer.astro
│   ├── Card.astro              # Reusable card
│   └── react/                  # React components
│       ├── InteractiveMap.tsx
│       └── SearchBox.tsx
├── layouts/
│   ├── BaseLayout.astro        # Common HTML wrapper
│   ├── BlogPost.astro          # Blog post layout
│   └── PageLayout.astro        # Generic page layout
├── content/
│   ├── config.ts               # Collection schemas
│   ├── blog/                   # Markdown/MDX files
│   │   ├── post-1.md
│   │   └── post-2.mdx
│   └── docs/
│       └── getting-started.md
├── styles/
│   └── global.css
└── utils/
    ├── date.ts
    └── markdown.ts

astro.config.mjs:
import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import react from '@astrojs/react'

export default defineConfig({
  integrations: [mdx(), sitemap(), react()],
  output: 'static', // or 'server'/'hybrid'
  prefetch: true
})
```

---

## 2. Page Patterns

```
Static Page (default):
---
// Frontmatter (runs at build time)
const title = 'My Page'
const data = await fetch('https://api.example.com/data').then(r => r.json())
---
<html>
  <head>
    <title>{title}</title>
  </head>
  <body>
    <h1>{title}</h1>
    <p>{data.message}</p>
  </body>
</html>

Dynamic Route ([slug].astro):
---
export async function getStaticPaths() {
  const posts = await getAllPosts()
  return posts.map(post => ({
    params: { slug: post.slug },
    props: { post }
  }))
}

const { post } = Astro.props
---
<article>
  <h1>{post.title}</h1>
  <time>{post.date}</time>
  <div set:html={post.content} />
</article>

SSR Page (server output):
---
export const prerender = false // Enable SSR

const post = await getPost(Astro.params.slug)
if (!post) return Astro.redirect('/404')
---
<h1>{post.title}</h1>

API Endpoint ([...slug].ts):
export async function GET({ params }) {
  const data = await fetchData()
  return new Response(JSON.stringify(data))
}

Hybrid Mode:
---
// This page is static by default
export const prerender = true

// Or dynamic
export const prerender = false
---
```

---

## 3. Island Architecture

```
What are Islands?
├── Static HTML that can hydrate interactive components
├── Only the interactive parts send JavaScript
└── Everything else remains static HTML

Interactive Component (React/Preact/Svelte/Vue):
---
import SearchBox from '../components/react/SearchBox'
---
<SearchBox client:load />         // Hydrate immediately
<SearchBox client:idle />         // Hydrate when idle
<SearchBox client:visible />     // Hydrate when visible
<SearchBox client:media="(min-width: 768px)" /> // Hydrate on media query

Component Hydration Options:
client:load     → Immediate, for above-fold interactive content
client:idle     → When browser idle, for lower priority
client:visible → When scrolled into view, for below-fold
client:media    → On media query match, for responsive
client:only     → Skip SSR, client-only (for browser APIs)

Island Best Practices:
├── Keep island count low
├── Prefer client:visible over client:load
├── Use client:idle for non-critical
└── Extract heavy components to islands
```

---

## 4. Content Collections

```
Define Collection (src/content/config.ts):
import { defineCollection, z } from 'astro:content'

const blog = defineCollection({
  type: 'content', // 'content' or 'data'
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    heroImage: z.string().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false)
  })
})

const docs = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    order: z.number()
  })
})

export const collections = { blog, docs }

Query Collection:
---
import { getCollection } from 'astro:content'

const posts = await getCollection('blog', ({ data }) => {
  return !data.draft
})

const sortedPosts = posts.sort(
  (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
)
---
{posts.map(post => (
  <a href={`/blog/${post.slug}`}>{post.data.title}</a>
))}

Single Post:
---
import { getCollection } from 'astro:content'

export async function getStaticPaths() {
  const posts = await getCollection('blog')
  return posts.map(post => ({
    params: { slug: post.slug },
    props: { post }
  }))
}

const { Content } = await post.render()
---
<Content />
```

---

## 5. Layout & Component Patterns

```
Base Layout (src/layouts/BaseLayout.astro):
---
interface Props {
  title: string
  description?: string
}

const { title, description = 'Default description' } = Astro.props
---
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width" />
    <title>{title}</title>
    <meta name="description" content={description} />
  </head>
  <body>
    <slot />
  </body>
</html>

Page Using Layout:
---
import BaseLayout from '../layouts/BaseLayout.astro'
---
<BaseLayout title="My Page" description="Page desc">
  <main>
    <h1>Hello World</h1>
  </main>
</BaseLayout>

Slot Patterns:
Named Slots:
<BaseLayout>
  <header slot="header">My Header</header>
  <main>
    <slot />
  </main>
  <footer slot="footer">My Footer</footer>
</BaseLayout>

Fallback Content:
<slot>
  <p>Default content if no content provided</p>
</slot>
```

---

## 6. View Transitions

```
Enable in astro.config.mjs:
import { defineConfig } from 'astro/config'

export default defineConfig({
  prefetch: true,
  // View Transitions enabled by default in Astro 4+
})

Use Transitions:
---
import { ViewTransitions } from 'astro:transitions'
---
<head>
  <ViewTransitions />
</head>

Transition Directives:
<div transition:animate="slide">Content</div>
<div transition:animate="fade">Content</div>
<div transition:animate="none">No transition</div>

transition:persist:
<div transition:persist>Player continues playing</div>

transition:name:
<img src="..." transition:name="hero-image" />

Persist State:
---
import { keep } from 'astro:transitions/client'
---
<div data-persist-state={keep()}>
  <!-- State preserved across navigation -->
</div>
```

---

## 7. Data Fetching Patterns

```
Build-time Fetch (static):
---
const data = await fetch('https://api.example.com/data').then(r => r.json())
---

Server-time Fetch (SSR):
const data = await fetch('https://api.example.com/data').then(r => r.json())

Endpoint for external API:
src/pages/api/data.ts:
export async function GET() {
  const data = await fetch('https://api.example.com/data')
  return new Response(await data.text(), {
    headers: { 'Content-Type': 'application/json' }
  })
}

Multiple Parallel Fetch:
---
const [users, posts] = await Promise.all([
  fetch('/api/users').then(r => r.json()),
  fetch('/api/posts').then(r => r.json())
])
---

Caching Strategy:
Cache-Control headers for static content
Use fetch with no-store for dynamic

Fetch in Components:
---
const response = await fetch('https://api.example.com/data')
const data = await response.json()
---
```

---

## Key Patterns

1. **Content Collections** — Type-safe markdown/MDX management
2. **Island Architecture** — Only hydrate interactive parts
3. **Hybrid Rendering** — Mix static and dynamic pages
4. **View Transitions** — SPA-like navigation
5. **Component Scoped Styles** — CSS in .astro files
6. **Static by Default** — Opt-in to interactivity

---

## Anti-Patterns

```
❌ Too many client:load islands
✅ Use client:visible or client:idle for most

❌ Fetching in component body without loading state
✅ Use loading skeleton or client:only

❌ No fallback for images
✅ Use Astro's built-in image optimization

❌ Hardcoded content
✅ Use Content Collections with markdown

❌ No SEO meta tags
✅ Use BaseHead component on every page

❌ Large bundle JavaScript in islands
✅ Keep islands small, lazy load

❌ Not using getStaticPaths for dynamic routes
✅ Pre-render all possible paths
```

---

## Quick Reference

| Feature | Syntax | Note |
|---|---|---|
| Static page | .astro file | Default |
| Dynamic route | [slug].astro | Use getStaticPaths |
| SSR | prerender = false | Hybrid mode |
| Island | client:load/visible/idle | Hydration options |
| Collection | getCollection('name') | Type-safe content |
| Layout | <slot /> | Template slots |
| Transitions | transition:animate | View Transitions API |
| Images | <Image /> | Built-in optimization |

---

## Decision Tree

```
Static or SSR?
├── Blog, docs, marketing, landing pages   → static (output: 'static', default)
├── User-specific pages / auth             → hybrid (prerender = false per route)
├── Full dynamic app                       → server (output: 'server')
└── Both? Per page: export const prerender = false for dynamic, true for static

Which hydration directive for interactive component?
├── Above fold, critical interactivity     → client:load
├── Below fold, can wait for idle          → client:idle
├── Scrolled into view                     → client:visible (default choice)
├── Browser API, must not SSR              → client:only="react"
└── No interactivity needed               → no directive (pure HTML island)

Content: Collections or raw fetch?
├── Markdown/MDX blog posts, docs          → Content Collections with Zod schema
├── External CMS / Headless API            → fetch in frontmatter (build-time static)
└── Real-time / user-specific data         → prerender=false + fetch at request time
```

---

## Key Rules

1. Static by default — add `prerender = false` only for pages that need it
2. `client:visible` as default hydration — `client:load` only for above-fold critical UI
3. Content Collections with Zod schema — type-safe frontmatter, auto-validation
4. `getStaticPaths()` required for all dynamic `[slug].astro` routes
5. BaseHead component on every page — meta, OG tags, canonical URL
6. Islands small and focused — don't island an entire page, only interactive parts
7. Parallel data fetching: `await Promise.all([fetchA(), fetchB()])` in frontmatter

---

## Implementation

```astro
---
// src/content/config.ts (Content Collection schema)
import { defineCollection, z } from 'astro:content'

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title:       z.string(),
    description: z.string(),
    pubDate:     z.coerce.date(),
    tags:        z.array(z.string()).default([]),
    draft:       z.boolean().default(false),
  }),
})
export const collections = { blog }
---
```

```astro
---
// src/pages/blog/[slug].astro — dynamic route with Content Collections
import { getCollection } from 'astro:content'
import BaseLayout from '@/layouts/BaseLayout.astro'
import SearchBox from '@/components/react/SearchBox'

export async function getStaticPaths() {
  const posts = await getCollection('blog', ({ data }) => !data.draft)
  return posts.map((post) => ({ params: { slug: post.slug }, props: { post } }))
}

const { post } = Astro.props
const { Content } = await post.render()
---
<BaseLayout title={post.data.title} description={post.data.description}>
  <article>
    <h1>{post.data.title}</h1>
    <time datetime={post.data.pubDate.toISOString()}>
      {post.data.pubDate.toLocaleDateString()}
    </time>

    <Content />

    <!-- Island: only SearchBox sends JS to the browser -->
    <SearchBox client:visible />
  </article>
</BaseLayout>
```

```astro
---
// src/pages/dashboard.astro — SSR page (user-specific)
export const prerender = false

const session = Astro.cookies.get('session')
if (!session?.value) return Astro.redirect('/login')

const data = await fetch(`/api/user/${session.value}`).then(r => r.json())
---
<h1>Welcome, {data.name}</h1>
```
