---
name: bun-patterns
description: "Bun runtime: HTTP server, file I/O, SQLite, test runner, package manager, bundler — all-in-one JS toolchain."
triggers:
  extensions: [".ts", ".tsx"]
  filenames: ["bun.lockb", "bunfig.toml"]
  keywords: ["bun", "Bun.serve", "Bun.file", "bun:sqlite", "bun test", "bun build"]
auto_load_when: "Using Bun as runtime, package manager, or test runner"
agent: architect
tools: ["Read", "Write", "Bash"]
---

# Bun Patterns

**Version:** Bun v1.2+ | **Focus:** HTTP server, SQLite, test runner, bundler, APIs

---

## 1. HTTP Server

```ts
// server.ts
const server = Bun.serve({
  port: 3000,
  fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === '/') return new Response('Hello Bun!');
    if (url.pathname === '/health') return Response.json({ ok: true });

    return new Response('Not found', { status: 404 });
  },
  error(err) {
    return new Response(`Error: ${err.message}`, { status: 500 });
  },
});

console.log(`Listening on http://localhost:${server.port}`);
```

---

## 2. File I/O (Faster Than Node.js)

```ts
// Read file
const file = Bun.file('./data.json');
const data = await file.json<MyType>();
const text = await file.text();
const buffer = await file.arrayBuffer();

// Write file
await Bun.write('./output.txt', 'Hello World');
await Bun.write('./output.json', JSON.stringify(data));

// Stream large file
const input = Bun.file('./large.csv');
const output = Bun.file('./output.csv');
await Bun.write(output, input); // efficient piping

// Check exists
const exists = await Bun.file('./data.json').exists();
```

---

## 3. SQLite (Built-in, No Dependencies)

```ts
import { Database } from 'bun:sqlite';

const db = new Database('./mydb.sqlite');

// Create table
db.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT
)`);

// Prepared statements (fast, safe from injection)
const insert = db.prepare('INSERT INTO users (email, name) VALUES ($email, $name)');
insert.run({ $email: 'user@example.com', $name: 'Alice' });

// Query
const getUser = db.prepare('SELECT * FROM users WHERE email = $email');
const user = getUser.get({ $email: 'user@example.com' });

// Transaction
const insertMany = db.transaction((users) => {
  for (const user of users) insert.run(user);
});
insertMany([{ $email: 'a@b.com', $name: 'A' }, { $email: 'c@d.com', $name: 'C' }]);
```

---

## 4. Test Runner

```ts
// mytest.test.ts
import { describe, test, expect, beforeAll, mock } from 'bun:test';

describe('User service', () => {
  beforeAll(() => { /* setup */ });

  test('creates a user', () => {
    const user = createUser('test@example.com');
    expect(user.email).toBe('test@example.com');
  });

  test('throws on duplicate email', () => {
    expect(() => createUser('duplicate@example.com')).toThrow();
  });

  test('mocks fetch', async () => {
    const mockFetch = mock(() => Promise.resolve(new Response('{"ok":true}')));
    globalThis.fetch = mockFetch;
    const result = await fetchUser('123');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
```

```bash
bun test                    # run all tests
bun test --watch            # watch mode
bun test --coverage         # with coverage
bun test src/user.test.ts   # specific file
```

---

## 5. Bundler

```ts
// bundle.ts
const result = await Bun.build({
  entrypoints: ['./src/index.ts'],
  outdir: './dist',
  target: 'browser',        // 'node' | 'bun' | 'browser'
  format: 'esm',
  minify: true,
  splitting: true,           // code splitting
  sourcemap: 'external',
});

if (!result.success) {
  console.error(result.logs);
}
```

---

## 6. Environment & Package Manager

```bash
# Install dependencies (much faster than npm/pnpm)
bun install
bun add express
bun add -d @types/express

# Run scripts
bun run dev
bun run build

# Execute TypeScript directly (no tsc needed)
bun run src/server.ts

# Workspace support
bun install --filter './apps/*'
```

---

## Quick Reference

| Feature | Bun API |
|---------|---------|
| HTTP server | `Bun.serve({ fetch(req) {} })` |
| Read file | `await Bun.file(path).text()` |
| Write file | `await Bun.write(path, data)` |
| SQLite | `import { Database } from 'bun:sqlite'` |
| Test | `import { test, expect } from 'bun:test'` |
| Hash | `Bun.password.hash(pwd)` / `verify()` |
| Env vars | `Bun.env.MY_VAR` (auto-loads .env) |

## Anti-Patterns

```
❌ Using Node.js fs module in Bun
✅ Use Bun.file() / Bun.write() — much faster

❌ Installing sqlite3 npm package
✅ Use built-in bun:sqlite — no native compilation needed

❌ ts-node or tsx for TypeScript
✅ Bun natively runs TypeScript — just bun run file.ts

❌ Separate jest/vitest setup
✅ bun test is built-in — no config needed for basic use

---

## Decision Tree

```
File I/O in Bun?
├── Read file content                  → Bun.file(path).text() / .json<T>()
├── Write file content                 → await Bun.write(path, data)
├── Stream large file                  → Bun.write(output, Bun.file(input))
└── Node.js fs.readFile                → replace with Bun.file() — faster

HTTP server?
├── Simple routes, embedded            → Bun.serve({ fetch(req) {} })
├── Production API with middleware     → Hono on Bun (Bun.serve + Hono app)
└── Node.js Express                    → works unchanged on Bun runtime

Database in Bun?
├── SQLite, local / embedded data      → bun:sqlite (zero deps, native)
├── PostgreSQL / MySQL                 → Drizzle ORM or Prisma — both work on Bun
└── Redis                              → ioredis or @upstash/redis — compatible

Tests?
├── Unit / integration in Bun project  → bun test (Jest-compatible, no config)
├── Coverage                           → bun test --coverage
└── Existing Jest suite                → mostly compatible — check mocking patterns
```

---

## Key Rules

1. Use `Bun.file()` / `Bun.write()` — 3–10× faster than Node.js `fs` module
2. `bun:sqlite` is built-in and dependency-free — no native compilation, no `better-sqlite3`
3. Bun runs TypeScript natively — no `ts-node`, `tsx`, or `tsc` compile step needed
4. `bun install` respects `package.json` — drops `node_modules` faster than npm/pnpm
5. `Bun.env.VAR_NAME` auto-loads `.env` — no `dotenv` package required
6. `Bun.password.hash()` uses Argon2id by default — prefer over bcrypt
7. `bun build` for browser bundles; `bun run` for server-side (no bundle needed for server)

---

## Implementation

```typescript
// HTTP server with routing + error handling
const server = Bun.serve({
  port: 3000,

  async fetch(req) {
    const url = new URL(req.url)

    if (req.method === 'GET' && url.pathname === '/health')
      return Response.json({ ok: true })

    if (req.method === 'POST' && url.pathname === '/users') {
      const body = await req.json()
      const user = await createUser(body)
      return Response.json(user, { status: 201 })
    }

    return new Response('Not Found', { status: 404 })
  },

  error(err) {
    console.error(err)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  },
})

// SQLite with prepared statements
import { Database } from 'bun:sqlite'

const db = new Database('./app.sqlite')
db.run(`CREATE TABLE IF NOT EXISTS users (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name  TEXT NOT NULL
)`)

const insertUser = db.prepare('INSERT INTO users (email, name) VALUES ($email, $name)')
const findUser   = db.prepare('SELECT * FROM users WHERE email = $email')

export function createUser(data: { email: string; name: string }) {
  insertUser.run({ $email: data.email, $name: data.name })
  return findUser.get({ $email: data.email })
}

// Tests: bun test (Jest-compatible API)
import { describe, test, expect, beforeAll } from 'bun:test'

describe('createUser', () => {
  beforeAll(() => db.run('DELETE FROM users'))

  test('creates and retrieves user', () => {
    const user = createUser({ email: 'test@example.com', name: 'Test' })
    expect(user).toMatchObject({ email: 'test@example.com', name: 'Test' })
  })
})
```
```
