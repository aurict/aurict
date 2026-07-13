import { describe, expect, test } from "bun:test"
import { createRedisRateLimiter } from "../src/middleware/redis-rate-limit"
import { loadEnv } from "../src/env"

// Bu test gerçek Redis gerektirir (aynı DATABASE_URL-gated desen,
// test/integration.test.ts'teki gibi). Gerçek register/login akışı
// üzerinden uçtan uca doğrulama bu oturumda elle yapıldı: Redis açıkken
// 201 + rate limit eşiğinde 429, Redis kapalıyken fail-open ile yine 201
// (93ms, hiç hang yok). Bu suite check() sözleşmesinin kendisini doğrular.
const redisUrl = process.env.REDIS_URL

if (!redisUrl) {
  test.skip("redis rate limiter requires REDIS_URL", () => {})
} else {
  const env = loadEnv({ NODE_ENV: "test", REDIS_URL: redisUrl })

  describe("redis rate limiter", () => {
    test("allows requests under the limit, blocks over it", async () => {
      const limiter = createRedisRateLimiter(env)!
      const key = `test-${Date.now()}`
      for (let i = 0; i < 3; i++) {
        const decision = await limiter.check(key, 3, 60_000)
        expect(decision.allowed).toBe(true)
      }
      const blocked = await limiter.check(key, 3, 60_000)
      expect(blocked.allowed).toBe(false)
      expect(blocked.remaining).toBe(0)
    })

    test("resetAt reflects the window", async () => {
      const limiter = createRedisRateLimiter(env)!
      const key = `test-window-${Date.now()}`
      const before = Date.now()
      const decision = await limiter.check(key, 5, 10_000)
      expect(decision.resetAt).toBeGreaterThan(before)
      expect(decision.resetAt).toBeLessThanOrEqual(before + 10_000 + 1000)
    })

    test("fails open when Redis is unreachable", async () => {
      const badEnv = loadEnv({ NODE_ENV: "test", REDIS_URL: "redis://127.0.0.1:1/0" })
      const limiter = createRedisRateLimiter(badEnv)!
      const start = Date.now()
      const decision = await limiter.check("unreachable-key", 5, 60_000)
      expect(decision.allowed).toBe(true)
      expect(Date.now() - start).toBeLessThan(2000)
    })
  })
}
