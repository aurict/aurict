import crypto from "node:crypto"
import type { Context, Next } from "hono"
import type { AppBindings } from "../types"
import { ApiError } from "./errors"

type Bucket = { count: number; resetAt: number }

export type RateLimitDecision = {
  allowed: boolean
  remaining: number
  resetAt: number
}

export type RateLimiter = {
  check(key: string, limit: number, windowMs: number): Promise<RateLimitDecision>
}

export function createMemoryRateLimiter(): RateLimiter {
  const buckets = new Map<string, Bucket>()
  let checks = 0
  return {
    async check(key, limit, windowMs) {
      const timestamp = Date.now()
      checks += 1
      if (checks % 1000 === 0) {
        for (const [bucketKey, bucket] of buckets.entries()) {
          if (bucket.resetAt <= timestamp) buckets.delete(bucketKey)
        }
      }
      const bucket = buckets.get(key)
      if (!bucket || bucket.resetAt <= timestamp) {
        const resetAt = timestamp + windowMs
        buckets.set(key, { count: 1, resetAt })
        return { allowed: true, remaining: Math.max(0, limit - 1), resetAt }
      }
      bucket.count += 1
      return {
        allowed: bucket.count <= limit,
        remaining: Math.max(0, limit - bucket.count),
        resetAt: bucket.resetAt,
      }
    },
  }
}

type RateLimitKey = "ip" | "user"

/**
 * Fixed-window limit per client IP (default) or per authenticated user (`by: "user"`, which
 * must run after requireAuth). Per-user limits cap what one account can write even when it
 * rotates IP addresses.
 */
export function rateLimit(limit: number, windowMs: number, keyPrefix: string, opts: { by?: RateLimitKey } = {}) {
  return async (c: Context<AppBindings>, next: Next) => {
    const subject = opts.by === "user" ? `u:${c.get("user")?.id ?? "anonymous"}` : `ip:${clientIp(c)}`
    await enforceRateLimit(c, `${keyPrefix}:${subject}`, limit, windowMs)
    await next()
  }
}

/** Applies a limit to an arbitrary key, e.g. a normalised email address for login attempts. */
export async function enforceRateLimit(c: Context<AppBindings>, key: string, limit: number, windowMs: number) {
  const decision = await c.get("rateLimiter").check(key, limit, windowMs)
  c.header("x-ratelimit-limit", String(limit))
  c.header("x-ratelimit-remaining", String(decision.remaining))
  c.header("x-ratelimit-reset", String(Math.ceil(decision.resetAt / 1000)))
  if (!decision.allowed) throw new ApiError(429, "Rate limit exceeded.", "rate_limited")
}

/**
 * The client address used for rate limiting, in order of trust:
 * 1. `x-aurict-client-ip` from our own web app, accepted only together with the shared
 *    `x-aurict-proxy-secret` (the web server proxies auth calls, so without this every web
 *    user would share the web server's address).
 * 2. `cf-connecting-ip` when TRUST_PROXY_HEADERS is on: Cloudflare overwrites it on every
 *    request. X-Forwarded-For and X-Real-IP pass through Cloudflare unchanged, so they are
 *    never trusted.
 * 3. The TCP peer address.
 * IPv6 addresses are grouped by /64, since one host usually controls a whole /64.
 */
export function clientIp(c: Context<AppBindings>): string {
  const env = c.get("env")
  const forwarded = c.req.header("x-aurict-client-ip")
  const secret = c.req.header("x-aurict-proxy-secret")
  if (forwarded && secret && env.TRUSTED_PROXY_SECRET && safeEqual(secret, env.TRUSTED_PROXY_SECRET) && isIp(forwarded)) {
    return normalizeIp(forwarded)
  }
  if (env.TRUST_PROXY_HEADERS) {
    const cf = c.req.header("cf-connecting-ip")
    if (cf && isIp(cf)) return normalizeIp(cf)
  }
  const peer = socketAddress(c)
  return peer ? normalizeIp(peer) : "local"
}

function socketAddress(c: Context<AppBindings>): string | undefined {
  // Under Bun.serve, Hono passes the server as c.env; app.request() in tests has none.
  const server = (c.env as { requestIP?: (req: Request) => { address: string } | null } | undefined)
  try {
    return server?.requestIP?.(c.req.raw)?.address ?? undefined
  } catch {
    return undefined
  }
}

/** IPv4 /24 or IPv6 /64 of the client: enough to recognise a network, not a household. */
export function clientNetwork(c: Context<AppBindings>): string | undefined {
  const ip = clientIp(c)
  if (ip === "local") return undefined
  if (ip.includes("/64")) return ip
  const octets = ip.split(".")
  return octets.length === 4 ? `${octets.slice(0, 3).join(".")}.0/24` : undefined
}

/** ISO country from Cloudflare, only when Cloudflare headers are trusted. */
export function clientCountry(c: Context<AppBindings>): string | undefined {
  if (!c.get("env").TRUST_PROXY_HEADERS) return undefined
  const country = c.req.header("cf-ipcountry")
  return country && /^[A-Z]{2}$/.test(country) ? country : undefined
}

export function normalizeIp(ip: string): string {
  const value = ip.trim().toLowerCase()
  const mapped = value.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)
  if (mapped) return mapped[1]!
  if (!value.includes(":")) return value
  return `${expandIpv6(value).slice(0, 4).join(":")}::/64`
}

function expandIpv6(ip: string): string[] {
  const [head = "", tail = ""] = ip.split("::")
  const left = head ? head.split(":") : []
  const right = ip.includes("::") ? (tail ? tail.split(":") : []) : []
  const missing = 8 - left.length - right.length
  return [...left, ...Array(Math.max(0, missing)).fill("0"), ...right].map((part) => part.padStart(4, "0"))
}

function isIp(value: string): boolean {
  return /^[0-9.]{7,15}$/.test(value) || /^[0-9a-fA-F:.]{2,45}$/.test(value)
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && crypto.timingSafeEqual(left, right)
}
