---
name: nodejs-expert
description: "Node.js 22 LTS (2025): Native fetch, WebStreams, worker threads, ESM, package exports. Expert patterns for server-side JS." 
triggers:
  extensions: [".js", ".ts", ".mjs"]
  directories: ["server/", "src/"]
  keywords: ["Node.js", "Express", "Fastify", "streams", "events", "worker thread", "cluster"]
auto_load_when: "Building Node.js server-side code"
agent: architect
tools: ["Read", "Write", "Bash"]
---

# Node.js Expert Patterns

**Version:** Node.js 22 LTS (2025) | **Focus:** Performance, ESM, APIs

## When to Activate
- Server-side development
- API creation
- Performance optimization
- Package development

---

## 1. ESM (ECMAScript Modules)

```json
// package.json
{
  "type": "module",
  "exports": {
    ".": "./dist/index.js",
    "./client": "./dist/client.js"
  }
}
```

```typescript
// src/index.ts
import { readFile } from 'node:fs/promises'
import path from 'node:path'

// Dynamic import for CJS
const cjsModule = await import('cjs-package')

// URL imports
const data = await fetch('https://api.example.com/data')
```

---

## 2. Native Fetch & Web APIs

```typescript
// Built-in fetch (Node 18+)
const response = await fetch('https://api.example.com', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ data: 'test' }),
})

const json = await response.json()

// Web Streams (Node 16+)
const stream = new ReadableStream({
  start(controller) {
    controller.enqueue('Hello')
    controller.close()
  },
})

const text = await new Response(stream).text()
```

---

## 3. Error Handling

```typescript
// Class-based errors
class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

// Async error wrapper
async function tryCatch<T>(
  fn: () => Promise<T>
): Promise<[T, null] | [null, Error]> {
  try {
    return [await fn(), null]
  } catch (e) {
    return [null, e as Error]
  }
}

// Usage
const [data, error] = await tryCatch(fetchData())
if (error) handleError(error)
```

---

## 4. Performance

```typescript
// Worker threads
import { Worker } from 'node:worker'

const worker = new Worker('./heavy-task.js', {
  workerData: { value: 100 },
})

worker.on('message', (result) => console.log(result))

// Streaming (memory efficient)
import { createReadStream } from 'node:fs'

const stream = createReadStream('large-file.txt')
for await (const chunk of stream) {
  processChunk(chunk)
}

// Connection pooling
import pg from 'pg'
const pool = new pg.Pool({ max: 20 })
```

---

## 5. File Operations

```typescript
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'

// Read JSON
const config = JSON.parse(
  await readFile('./config.json', 'utf-8')
)

// Atomic write
await writeFile('./data.json', JSON.stringify(data), {
  flag: 'w',
})

// Ensure directory exists
await mkdir('./logs', { recursive: true })

// Check existence
if (!existsSync('./data')) {
  // handle
}
```

---

## 6. Process & Env

```typescript
// Environment variables
const port = parseInt(process.env.PORT || '3000')
const isDev = process.env.NODE_ENV !== 'production'

// Signals
process.on('SIGTERM', async () => {
  await gracefulShutdown()
  process.exit(0)
})

// Memory info
console.log(process.memoryUsage()) // heapUsed, heapTotal, external, rss
```

---

## 7. Package Exports

```json
{
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./utils": {
      "import": "./dist/utils.js",
      "require": "./dist/utils.cjs"
    }
  }
}
```

---

## Key Takeaways

1. **ESM default** - Use "type": "module"
2. **Native fetch** - No axios needed
3. **Worker threads** - CPU-intensive tasks
4. **Streaming** - Large files, memory
5. **Error classes** - Structured error handling
6. **Process signals** - Graceful shutdown

---

## Anti-Patterns

```
❌ Blocking the event loop with CPU-intensive code
✅ Offload CPU work to Worker Threads or child_process

❌ Unhandled promise rejections crashing the process
✅ process.on('unhandledRejection', ...) + proper async error handling

❌ require() in hot paths (module cache miss on first load)
✅ Require at top of file; lazy require only for rarely-used modules

❌ Large synchronous JSON.parse() in request handler
✅ Stream parsing with streaming-json or offload to worker

❌ No graceful shutdown — dropping in-flight requests
✅ Handle SIGTERM: drain connections, wait for pending, then exit
```

---

## Quick Reference

| Scenario | Solution | Note |
|---|---|---|
| HTTP server | Fastify / Express | Fastify 2x faster |
| Async queue | BullMQ | Redis-backed |
| CPU work | Worker Threads | Shared ArrayBuffer |
| Child process | child_process.fork | Separate process |
| Streams | Transform stream | Backpressure built-in |
| Shutdown | http.closeAllConnections | Node 18.2+ |
