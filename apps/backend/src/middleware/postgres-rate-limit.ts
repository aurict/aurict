import type { BackendDb } from "../db/client"
import type { RateLimitDecision, RateLimiter } from "./rate-limit"

export function createPostgresRateLimiter(db: BackendDb): RateLimiter {
  let checks = 0
  return {
    async check(key, limit, windowMs): Promise<RateLimitDecision> {
      const timestamp = Date.now()
      const resetAt = new Date(timestamp + windowMs)
      const now = new Date(timestamp)
      checks += 1
      if (checks % 1000 === 0) {
        await db.client`delete from rate_limits where reset_at <= ${now}`
      }

      const rows = await db.client.begin(async (sql) => {
        const existing = await sql<{ count: number; reset_at: Date }[]>`
          select count, reset_at from rate_limits where key = ${key} for update
        `
        const bucket = existing[0]
        if (!bucket || bucket.reset_at <= now) {
          await sql`
            insert into rate_limits (key, count, reset_at, updated_at)
            values (${key}, ${1}, ${resetAt}, ${now})
            on conflict (key) do update set count = ${1}, reset_at = ${resetAt}, updated_at = ${now}
          `
          return [{ count: 1, reset_at: resetAt }]
        }
        const nextCount = bucket.count + 1
        await sql`
          update rate_limits set count = ${nextCount}, updated_at = ${now} where key = ${key}
        `
        return [{ count: nextCount, reset_at: bucket.reset_at }]
      })

      const bucket = rows[0]!
      return {
        allowed: bucket.count <= limit,
        remaining: Math.max(0, limit - bucket.count),
        resetAt: bucket.reset_at.getTime(),
      }
    },
  }
}
