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

export function rateLimit(limit: number, windowMs: number, keyPrefix: string) {
  return async (c: Context<AppBindings>, next: Next) => {
    const ip = clientIp(c)
    const key = `${keyPrefix}:${ip}`
    const decision = await c.get("rateLimiter").check(key, limit, windowMs)
    c.header("x-ratelimit-limit", String(limit))
    c.header("x-ratelimit-remaining", String(decision.remaining))
    c.header("x-ratelimit-reset", String(Math.ceil(decision.resetAt / 1000)))
    if (!decision.allowed) throw new ApiError(429, "Rate limit exceeded.", "rate_limited")
    await next()
  }
}

function clientIp(c: Context<AppBindings>): string {
  if (!c.get("env").TRUST_PROXY_HEADERS) return "local"
  return c.req.header("cf-connecting-ip")
    ?? c.req.header("x-real-ip")
    ?? c.req.header("x-forwarded-for")?.split(",")[0]?.trim()
    ?? "local"
}
