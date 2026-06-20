---
name: hono-patterns
description: "Hono: Edge-first HTTP framework, Middleware patterns, Cloudflare Workers, Deno Deploy, Performance optimization."
triggers:
  files: ["hono.config.ts", "hono.config.js"]
  directories: ["src/hono/", "routes/"]
  keywords: ["Hono", "honojs", "cloudflare workers", "edge", "deno"]
auto_load_when: "Building APIs with Hono framework or deploying to edge"
agent: architect
tools: ["Read", "Write", "Bash"]
---

# Hono Framework Patterns

**Focus:** Edge computing, middleware composition, performance, Cloudflare/Deno deployment

## 1. Project Structure

```
Standard Hono Project:
src/
├── index.ts           # Main app entry
├── app.ts             # App configuration
├── routes/
│   ├── users.ts       # User routes
│   ├── posts.ts       # Post routes
│   └── index.ts       # Route aggregation
├── middleware/        # Custom middleware
│   ├── auth.ts
│   └── logger.ts
├── services/          # Business logic
│   └── user.service.ts
├── utils/
│   └── response.ts    # Response helpers
└── types/
    └── index.ts       # TypeScript types

Entry Point Pattern:
import { Hono } from 'hono'
import { userRoutes } from './routes/users'
import { postRoutes } from './routes/posts'

const app = new Hono()

app.route('/users', userRoutes)
app.route('/posts', postRoutes)

export default app
```

---

## 2. Routing Patterns

```
Basic Routing:
const app = new Hono()

app.get('/', (c) => c.text('Hello'))
app.post('/users', createUser)
app.get('/users/:id', getUser)
app.put('/users/:id', updateUser)
app.delete('/users/:id', deleteUser)

Route Parameters:
app.get('/users/:id', (c) => {
  const id = c.req.param('id')
  return c.json({ id })
})

Query Parameters:
app.get('/search', (c) => {
  const query = c.req.query('q')
  const page = c.req.query('page') ?? '1'
  return c.json({ query, page })
})

Nested Routes:
const users = new Hono()
users.get('/', listUsers)
users.post('/', createUser)
users.get('/:id', getUser)

app.route('/api/users', users)

Wildcard Routes:
app.get('/files/*', (c) => {
  const path = c.req.param('*')
  return c.json({ path })
})

Route Methods Chain:
app
  .get('/user', getUserHandler)
  .post('/user', createUserHandler)
  .put('/user', updateUserHandler)
```

---

## 3. Middleware Patterns

```
Built-in Middleware:
import { cors, logger, poweredBy, timing, compress } from 'hono/middleware'

app.use('*', cors())
app.use('*', logger())
app.use('*', poweredBy({ name: 'MyApp' }))
app.use('*', timing())
app.use('*', compress())

Custom Middleware:
const timingMiddleware = async (c, next) => {
  const start = Date.now()
  await next()
  const end = Date.now()
  c.res.headers.set('X-Response-Time', `${end - start}ms`)
}

app.use('*', timingMiddleware)

Auth Middleware:
const authMiddleware = async (c, next) => {
  const token = c.req.header('Authorization')
  if (!token?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  const user = await verifyToken(token)
  c.set('user', user)
  await next()
}

app.use('/api/*', authMiddleware)

Error Handling Middleware:
app.onError((err, c) => {
  console.error(err)
  return c.json({ error: err.message }, 500)
})

Not Found:
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404)
})
```

---

## 4. Context & Request/Response

```
Request Object:
app.get('/request', (c) => {
  const method = c.req.method
  const path = c.req.path
  const query = c.req.query('name')
  const params = c.req.param('id')
  const header = c.req.header('Authorization')
  const body = await c.req.json()
  const rawBody = await c.req.text()
  const parsedBody = await c.req.parseBody()
  return c.json({ method, path, query, params, header })
})

Response Methods:
app.get('/', (c) => c.text('Plain text'))
app.get('/json', (c) => c.json({ key: 'value' }))
app.get('/html', (c) => c.html('<h1>HTML</h1>'))
app.get('/xml', (c) => c.xml('<root></root>'))
app.get('/redirect', (c) => c.redirect('/other'))
app.get('/stream', (c) => c.stream(async (stream) => {
  // Stream content
}))

Response Headers:
app.get('/', (c) => {
  return c.text('response', 200, {
    'X-Custom': 'header',
    'Cache-Control': 'max-age=3600'
  })
})

JSON Response with Status:
app.post('/users', async (c) => {
  const body = await c.req.json()
  const user = await createUser(body)
  return c.json(user, 201) // Created
})
```

---

## 5. Validation with Zod

```
Zod Middleware Pattern:
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'

const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().min(0).optional()
})

app.post('/users',
  zValidator('json', userSchema),
  (c) => {
    const user = c.req.valid('json')
    return c.json({ user })
  }
)

Validation Error Response:
app.onError((err, c) => {
  if (err instanceof z.ZodError) {
    return c.json({
      error: 'Validation failed',
      details: err.errors
    }, 400)
  }
  throw err
})

Path Validation:
const idSchema = z.object({
  id: z.string().uuid()
})

app.get('/users/:id',
  zValidator('param', idSchema),
  (c) => {
    const { id } = c.req.valid('param')
    return c.json({ id })
  }
)

Query Validation:
const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20)
})

app.get('/users',
  zValidator('query', paginationSchema),
  (c) => {
    const { page, limit } = c.req.valid('query')
    return c.json({ page, limit })
  }
)
```

---

## 6. Cloudflare Workers Deployment

```
wrangler.toml:
name = "my-hono-app"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[env.production]
name = "my-hono-prod"

Workers Entry:
import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()

app.use('*', cors())

app.get('/', (c) => c.text('Hello from Workers'))

export default app

Environment Variables:
app.get('/config', (c) => {
  const dbUrl = c.env.DATABASE_URL
  const apiKey = c.env.API_KEY
  return c.json({ dbUrl: !!dbUrl, apiKey: !!apiKey })
})

TypeScript Types:
type Env = {
  DB: D1Database
  API_KEY: string
}

const app = new Hono<{ Bindings: Env }>()

app.get('/db', async (c) => {
  const result = await c.env.DB.prepare('SELECT * FROM users').all()
  return c.json(result)
})

KV Storage:
app.get('/cache/:key', async (c) => {
  const key = c.req.param('key')
  const value = await c.env.KV.get(key)
  return c.text(value ?? 'Not found')
})

app.put('/cache/:key', async (c) => {
  const key = c.req.param('key')
  const value = await c.req.text()
  await c.env.KV.put(key, value)
  return c.text('OK')
})
```

---

## 7. Deno Deploy Patterns

```
Deno Entry:
import { Hono } from 'https://deno.land/x/hono/mod.ts'

const app = new Hono()

app.get('/', (c) => c.text('Hello Deno'))

Deno.fetchAdapter(app)

Static Files:
import { serveStatic } from 'https://deno.land/x/hono/middleware.ts'

app.use('/static/*', serveStatic({
  root: './public',
  pathRewrite: (path) => path.replace('/static/', '/')
}))

Fresh Integration (if using Fresh):
import { Hono } from 'https://deno.land/x/hono/fresh.ts'

Environment Variables:
const app = new Hono()

app.get('/env', (c) => {
  return c.json({
    nodeEnv: Deno.env.get('NODE_ENV'),
    customVar: Deno.env.get('CUSTOM_VAR')
  })
})
```

---

## 8. Performance Optimization

```
Streaming Responses:
app.get('/stream', (c) => {
  return c.stream(async (stream) => {
    for (let i = 0; i < 10; i++) {
      await stream.write(`data: ${i}\n\n`)
      await new Promise(r => setTimeout(r, 1000))
    }
  })
})

WebSocket Support:
import { websocket } from 'hono/websocket'

app.get('/ws', (c) => {
  const { socket } = Deno.upgradeWebSocket(c.req.raw)
  socket.onopen = () => console.log('connected')
  socket.onmessage = (e) => console.log(e.data)
  return socket
})

Lazy Initialization:
const dbPromise = createDbConnection()

app.get('/db', async (c) => {
  const db = await dbPromise
  return c.json(await db.query('SELECT 1'))
})

Avoid Global State:
const createApp = () => {
  const app = new Hono()
  app.get('/', (c) => c.text('Hello'))
  return app
}

export const app = createApp()
```

---

## Key Patterns

1. **Route modules** — Separate routes into modules, aggregate in index
2. **Middleware composition** — Stack middleware for cross-cutting concerns
3. **Zod validation** — Use zValidator for type-safe request parsing
4. **Edge deployment** — Optimize for Cloudflare/Deno, use D1/KV
5. **Streaming** — Use c.stream() for large responses
6. **Lazy init** — Defer expensive operations, avoid globals

---

## Anti-Patterns

```
❌ Large monolithic route file
✅ Split routes: users.ts, posts.ts, aggregate in index.ts

❌ No validation on inputs
✅ Use zValidator with Zod schemas for all inputs

❌ Synchronous DB calls blocking response
✅ Use async/await, consider connection pooling

❌ Hardcoded values in handlers
✅ Use environment variables, config objects

❌ No error handling middleware
✅ Add app.onError for centralized error handling

❌ Global mutable state
✅ Use context (c.set/c.get) or createApp factory

❌ Not using type generics
✅ App<HonoEnv> for proper typing
```

---

## Quick Reference

| Feature | Syntax | Note |
|---|---|---|
| Create app | new Hono() | Import from 'hono' |
| Route | app.get(path, handler) | All HTTP methods |
| Middleware | app.use(middleware) | Global or route-specific |
| Route group | new Hono().route(prefix) | Modular routes |
| Validation | zValidator('json', schema) | Use with Zod |
| Context get | c.get(key) | Access stored values |
| Context set | c.set(key, value) | Store values |
| Stream | c.stream() | For large responses |
| Cloudflare | c.env.KV, c.env.DB | Access Workers bindings |

---

## Decision Tree

```
Route organization?
├── ≤ 5 routes, prototype             → single file app.ts
├── Growing API                       → split: routes/users.ts, aggregate in index.ts
└── Shared auth/validation logic      → middleware/ directory

Input validation?
├── Always                            → zValidator('json', schema) as middleware
├── Path params                       → zValidator('param', schema)
└── Query params                      → zValidator('query', schema) with z.coerce.number()

Deployment target?
├── Cloudflare Workers                → c.env.DB (D1), c.env.KV, c.env.R2
├── Bun runtime                       → Bun.serve, bun:sqlite
├── Node.js                           → hono/node-server adapter
└── Deno Deploy                       → default export app

Error strategy?
├── Expected errors (validation)      → return c.json(err, 400) in handler
├── Unexpected errors (all routes)    → app.onError((err, c) => ...)
└── 404                               → app.notFound((c) => ...)
```

---

## Key Rules

1. Use `new Hono<{ Bindings: Env }>()` to type Cloudflare environment bindings
2. `zValidator` as route middleware — never manual `req.json()` + manual check
3. `app.onError` for centralized error handling — avoids try/catch in every route
4. Route modules with `new Hono()` + `app.route(prefix, module)` — never one mega file
5. `c.set(key, value)` in middleware, `c.get(key)` in handler — typed via `Variables` generic
6. `createApp()` factory instead of global `app` — easier to test and reuse
7. Streaming via `c.stream()` for LLM responses and large payloads

---

## Implementation

```typescript
// Full typed Hono app with auth middleware + Zod validation
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

type Env = { Bindings: { DB: D1Database; JWT_SECRET: string } }
type Vars = { userId: string }

const app = new Hono<Env & { Variables: Vars }>()

// Auth middleware — sets userId in context
app.use('/api/*', async (c, next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  if (!token) return c.json({ error: 'Unauthorized' }, 401)
  const userId = await verifyJwt(token, c.env.JWT_SECRET)
  if (!userId) return c.json({ error: 'Invalid token' }, 401)
  c.set('userId', userId)
  await next()
})

// Route with Zod validation + typed context
const CreatePostSchema = z.object({
  title:   z.string().min(1).max(200),
  content: z.string().min(1),
})

app.post('/api/posts',
  zValidator('json', CreatePostSchema),
  async (c) => {
    const body   = c.req.valid('json')   // fully typed
    const userId = c.get('userId')
    const post   = await c.env.DB
      .prepare('INSERT INTO posts (title, content, user_id) VALUES (?,?,?) RETURNING *')
      .bind(body.title, body.content, userId)
      .first()
    return c.json(post, 201)
  }
)

// Centralized error handler
app.onError((err, c) => {
  console.error(err)
  return c.json({ error: 'Internal error', message: err.message }, 500)
})

app.notFound((c) => c.json({ error: 'Not found' }, 404))

export default app
```
