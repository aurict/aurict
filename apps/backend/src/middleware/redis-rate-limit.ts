import net from "node:net"
import type { BackendEnv } from "../env"
import { countEvent } from "../observability/metrics"
import { createMemoryRateLimiter, type RateLimitDecision, type RateLimiter } from "./rate-limit"

type RedisValue = string | number | null | RedisValue[]
type PendingCommand = {
  resolve: (value: RedisValue) => void
  reject: (error: Error) => void
}

// Redis yavaş/ulaşılamaz olursa rate limiter tüm isteği sonsuza kadar bekletmemeli.
// Rate limit ihlali bir güvenlik açığı değil, kullanılabilirlik önceliklidir —
// zaman aşımında "izin ver" (fail-open) tercih edilir.
const CHECK_TIMEOUT_MS = 500

export function createRedisRateLimiter(env: BackendEnv): RateLimiter | undefined {
  if (!env.REDIS_URL) return undefined
  const client = new MinimalRedisClient(env.REDIS_URL, env.REDIS_CONNECT_TIMEOUT_SECONDS * 1000)
  // When Redis is unreachable the limits still apply, per process, instead of being dropped.
  const fallback = createMemoryRateLimiter()
  return {
    async check(key, limit, windowMs): Promise<RateLimitDecision> {
      const timeout = new Promise<"timeout">((resolve) => setTimeout(() => resolve("timeout"), CHECK_TIMEOUT_MS))
      const result = await Promise.race([performCheck(client, key, limit, windowMs), timeout])
      if (result === "timeout" || result === "error") {
        // Keys contain client addresses; log only which limit was affected.
        console.error(`[redis-rate-limit] Redis ${result === "timeout" ? `timed out after ${CHECK_TIMEOUT_MS}ms` : "failed"} for ${key.split(":")[0]}; using the in-process limiter.`)
        countEvent("rate_limit_store_unavailable")
        return await fallback.check(key, limit, windowMs)
      }
      return result
    },
  }
}

async function performCheck(client: MinimalRedisClient, key: string, limit: number, windowMs: number): Promise<RateLimitDecision | "error"> {
  try {
    const redisKey = `aurict:rl:${key}`
    const count = await client.integer(["INCR", redisKey])
    if (count === 1) {
      await client.command(["PEXPIRE", redisKey, String(windowMs)])
    }
    const ttl = await client.integer(["PTTL", redisKey])
    const resetAt = Date.now() + Math.max(ttl, 0)
    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
      resetAt,
    }
  } catch {
    return "error"
  }
}

class MinimalRedisClient {
  constructor(url: string, connectTimeoutMs: number) {
    this.url = new URL(url)
    this.connectTimeoutMs = connectTimeoutMs
  }

  private readonly url: URL
  private readonly connectTimeoutMs: number
  private socket: net.Socket | undefined
  private buffer = Buffer.alloc(0)
  private readonly pending: PendingCommand[] = []
  private connecting: Promise<void> | undefined
  private authenticated = false
  private selectedDb = false

  async integer(parts: string[]): Promise<number> {
    const value = await this.command(parts)
    if (typeof value !== "number") throw new Error("Redis returned a non-integer response.")
    return value
  }

  async command(parts: string[]): Promise<RedisValue> {
    await this.connect()
    const socket = this.socket
    if (!socket || socket.destroyed) throw new Error("Redis socket is not connected.")
    return await new Promise<RedisValue>((resolve, reject) => {
      this.pending.push({ resolve, reject })
      socket.write(encodeCommand(parts), (error) => {
        if (!error) return
        const pending = this.pending.pop()
        pending?.reject(error)
      })
    })
  }

  private async connect(): Promise<void> {
    if (this.socket && !this.socket.destroyed) return
    if (this.connecting) return this.connecting
    this.connecting = new Promise<void>((resolve, reject) => {
      const socket = net.createConnection({
        host: this.url.hostname,
        port: Number(this.url.port || 6379),
      })
      const timeout = setTimeout(() => {
        socket.destroy(new Error("Redis connection timed out."))
      }, this.connectTimeoutMs)

      socket.on("connect", () => {
        clearTimeout(timeout)
        this.socket = socket
        this.buffer = Buffer.alloc(0)
        this.authenticated = false
        this.selectedDb = false
        resolve()
      })
      socket.on("data", (chunk) => this.onData(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)))
      socket.on("error", (error) => {
        this.failPending(error)
        reject(error)
      })
      socket.on("close", () => {
        this.socket = undefined
        this.authenticated = false
        this.selectedDb = false
        this.failPending(new Error("Redis connection closed."))
      })
    }).finally(() => {
      this.connecting = undefined
    })
    await this.connecting
    await this.bootstrapConnection()
  }

  private async bootstrapConnection() {
    if (!this.authenticated && (this.url.username || this.url.password)) {
      const auth = this.url.username
        ? ["AUTH", decodeURIComponent(this.url.username), decodeURIComponent(this.url.password)]
        : ["AUTH", decodeURIComponent(this.url.password)]
      await this.command(auth)
      this.authenticated = true
    }
    const db = this.url.pathname.replace("/", "")
    if (!this.selectedDb && db) {
      await this.command(["SELECT", db])
      this.selectedDb = true
    }
  }

  private onData(chunk: Buffer) {
    this.buffer = Buffer.concat([this.buffer, chunk])
    while (this.pending.length > 0) {
      const parsed = parseResp(this.buffer)
      if (!parsed) return
      this.buffer = this.buffer.subarray(parsed.offset)
      const pending = this.pending.shift()!
      if (parsed.value instanceof Error) pending.reject(parsed.value)
      else pending.resolve(parsed.value)
    }
  }

  private failPending(error: Error) {
    while (this.pending.length > 0) {
      this.pending.shift()!.reject(error)
    }
  }
}

function encodeCommand(parts: string[]) {
  return Buffer.from(
    `*${parts.length}\r\n${parts
      .map((part) => {
        const value = Buffer.from(part)
        return `$${value.length}\r\n${part}\r\n`
      })
      .join("")}`,
  )
}

function parseResp(buffer: Buffer, offset = 0): { value: RedisValue | Error; offset: number } | null {
  if (offset >= buffer.length) return null
  const type = String.fromCharCode(buffer[offset]!)
  const lineEnd = buffer.indexOf("\r\n", offset)
  if (lineEnd === -1) return null
  const line = buffer.subarray(offset + 1, lineEnd).toString()
  const next = lineEnd + 2

  if (type === "+") return { value: line, offset: next }
  if (type === "-") return { value: new Error(`Redis error: ${line}`), offset: next }
  if (type === ":") return { value: Number(line), offset: next }
  if (type === "$") {
    const length = Number(line)
    if (length < 0) return { value: null, offset: next }
    const end = next + length
    if (buffer.length < end + 2) return null
    return { value: buffer.subarray(next, end).toString(), offset: end + 2 }
  }
  if (type === "*") {
    const length = Number(line)
    if (length < 0) return { value: null, offset: next }
    const values: RedisValue[] = []
    let cursor = next
    for (let i = 0; i < length; i += 1) {
      const parsed = parseResp(buffer, cursor)
      if (!parsed) return null
      values.push(parsed.value instanceof Error ? parsed.value.message : parsed.value)
      cursor = parsed.offset
    }
    return { value: values, offset: cursor }
  }
  return { value: new Error(`Unsupported Redis response type: ${type}`), offset: next }
}
