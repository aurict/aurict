---
name: bun-fullstack
description: "Bun runtime fullstack: Bun.serve HTTP server, Bun SQLite, file API, WebSocket, shell scripting."
triggers:
  filenames: ["bun.lockb", "bunfig.toml"]
  deps: ["bun-types"]
  directories: [".bun/"]
auto_load_when: "Building with Bun runtime (server, scripts, SQLite)"
tags: ["bun", "runtime", "sqlite", "http-server", "typescript"]
priority: 8
---

# Bun Fullstack Patterns

## Quick Reference

```
HTTP server:   Bun.serve({ port: 3000, fetch(req) { return new Response("ok") } })
SQLite:        const db = new Database("app.db"); db.run("CREATE TABLE ..."); db.query("SELECT ...").all()
File read:     await Bun.file("path").text() | .json() | .arrayBuffer()
File write:    await Bun.write("path", content)
Shell:         import { $ } from "bun"; await $`git status`
Test:          bun test (uses describe/test/expect, Jest-compatible)
```

**Bun.serve with router:**
```typescript
Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url)
    if (url.pathname === "/api/users" && req.method === "GET")
      return Response.json(await getUsers())
    if (url.pathname === "/api/users" && req.method === "POST")
      return Response.json(await createUser(await req.json()))
    return new Response("Not Found", { status: 404 })
  }
})
```

---

## Decision Tree

```
HTTP layer?
├── Simple API → Bun.serve with fetch handler
├── More routing → Hono (runs natively on Bun, excellent DX)
└── Full framework → ElysiaJS (Bun-native, type-safe)

Database?
├── SQLite → Database from "bun:sqlite" (zero config, fast, embedded)
├── Postgres → postgres or @vercel/postgres (Bun compatible)
└── ORM → Drizzle (best Bun support), Prisma (works but slower startup)

File operations?
├── Read → Bun.file(path).text() / .json() — 3x faster than Node fs
├── Write → Bun.write(path, content) — handles strings, buffers, Blobs
└── Glob → new Bun.Glob("**/*.ts").scan({ cwd: "." })

Process execution?
├── Shell → const $ = import { $ } from "bun"; await $`cmd`
├── Spawn → Bun.spawn(["cmd", ...args]) → { stdout, stderr, exitCode }
└── Read output → await new Response(proc.stdout).text()
```

---

## Anti-Patterns

- `require()` or CommonJS in Bun projects — Bun is ESM-first; use `import`/`export`
- `fs.readFile` instead of `Bun.file()` — Bun.file() is faster and returns a typed File object
- `child_process.exec` instead of `$` from bun — Bun shell is safer and returns typed results
- `new Database()` without WAL mode for concurrent reads — enable: `db.run("PRAGMA journal_mode = WAL")`
- Forgetting `await` on `Bun.write()` — it returns a Promise; not awaiting loses writes
- `process.env` in client bundles — use Bun.env; set in `.env` at project root
- Using `jest` in a Bun project — `bun test` is Jest-compatible, no extra dep needed

---

## Key Rules

1. `bun:sqlite` is synchronous — all queries are sync (no async/await needed)
2. Bun auto-loads `.env` — no `dotenv` package needed
3. `Bun.file()` is lazy — file isn't read until `.text()`, `.json()`, etc.
4. TypeScript works natively — no `ts-node` or compilation step needed
5. `bun build` for production — bundles and transpiles; `--compile` creates single binary
6. WebSocket: `Bun.serve({ websocket: { message(ws, data) {}, open(ws) {}, close(ws) {} }, fetch(req, server) { server.upgrade(req) || Response } })`

---

## Implementation

**SQLite with typed queries:**
```typescript
import { Database } from "bun:sqlite"
const db = new Database("app.db", { create: true })
db.run("PRAGMA journal_mode = WAL")
db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT, email TEXT UNIQUE)")

const insert = db.prepare("INSERT INTO users (name, email) VALUES ($name, $email)")
const getAll = db.query<{ id: number; name: string; email: string }, []>("SELECT * FROM users")

insert.run({ $name: "Alice", $email: "alice@example.com" })
const users = getAll.all()
```

**File watcher + HTTP server:**
```typescript
const watcher = fs.watch("./src", { recursive: true }, (event, filename) => {
  console.log(`${event}: ${filename}`)
})
Bun.serve({ port: 3001, fetch: (req) => handler(req) })
process.on("SIGINT", () => { watcher.close(); process.exit(0) })
```
