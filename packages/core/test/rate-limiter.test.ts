import { describe, it, expect, beforeEach } from "bun:test"
import {
  TokenBucketLimiter,
  SlidingWindowLimiter,
  throttle,
  debounce,
  ConcurrencyLimiter,
} from "../src/security/rate-limiter.js"

describe("Rate Limiting & Throttling", () => {
  describe("TokenBucketLimiter", () => {
    let limiter: TokenBucketLimiter

    beforeEach(() => {
      limiter = new TokenBucketLimiter({
        maxRequests: 5,
        windowMs: 1000,
      })
    })

    it("allows requests within limit", () => {
      for (let i = 0; i < 5; i++) {
        const result = limiter.check("user1")
        expect(result.allowed).toBe(true)
      }
    })

    it("blocks requests over limit", () => {
      for (let i = 0; i < 5; i++) {
        limiter.check("user1")
      }
      const result = limiter.check("user1")
      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
      expect(result.retryAfterMs).toBeGreaterThan(0)
    })

    it("tracks remaining tokens", () => {
      limiter.check("user1")
      const result = limiter.check("user1")
      expect(result.remaining).toBeLessThan(5)
    })

    it("isolates different keys", () => {
      for (let i = 0; i < 5; i++) {
        limiter.check("user1")
      }
      // user2 should still have tokens
      const result = limiter.check("user2")
      expect(result.allowed).toBe(true)
    })

    it("refills tokens over time", async () => {
      for (let i = 0; i < 5; i++) {
        limiter.check("user1")
      }
      // Wait for refill
      await new Promise(resolve => setTimeout(resolve, 1100))
      const result = limiter.check("user1")
      expect(result.allowed).toBe(true)
    })

    it("resets bucket", () => {
      for (let i = 0; i < 5; i++) {
        limiter.check("user1")
      }
      limiter.reset("user1")
      const result = limiter.check("user1")
      expect(result.allowed).toBe(true)
    })

    it("resets all buckets", () => {
      limiter.check("user1")
      limiter.check("user2")
      limiter.resetAll()
      expect(limiter.getBucket("user1")).toBeNull()
    })
  })

  describe("SlidingWindowLimiter", () => {
    let limiter: SlidingWindowLimiter

    beforeEach(() => {
      limiter = new SlidingWindowLimiter({
        maxRequests: 3,
        windowMs: 1000,
      })
    })

    it("allows requests within limit", () => {
      for (let i = 0; i < 3; i++) {
        const result = limiter.check("user1")
        expect(result.allowed).toBe(true)
      }
    })

    it("blocks requests over limit", () => {
      for (let i = 0; i < 3; i++) {
        limiter.check("user1")
      }
      const result = limiter.check("user1")
      expect(result.allowed).toBe(false)
    })

    it("tracks reset time", () => {
      const result = limiter.check("user1")
      expect(result.resetAt).toBeGreaterThan(Date.now())
    })

    it("resets window", () => {
      limiter.check("user1")
      limiter.reset("user1")
      const result = limiter.check("user1")
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(2)
    })
  })

  describe("throttle", () => {
    it("limits function call frequency", async () => {
      let callCount = 0
      const fn = throttle(() => {
        callCount++
        return callCount
      }, 100)

      fn()
      fn()
      fn()

      expect(callCount).toBe(1)

      await new Promise(resolve => setTimeout(resolve, 150))
      fn()
      expect(callCount).toBe(2)
    })

    it("returns undefined when throttled", () => {
      const fn = throttle(() => 42, 100)
      expect(fn()).toBe(42)
      expect(fn()).toBeUndefined()
    })
  })

  describe("debounce", () => {
    it("delays function execution", async () => {
      let callCount = 0
      const fn = debounce(() => {
        callCount++
      }, 50)

      fn()
      fn()
      fn()

      expect(callCount).toBe(0)

      await new Promise(resolve => setTimeout(resolve, 100))
      expect(callCount).toBe(1)
    })

    it("resets delay on subsequent calls", async () => {
      let callCount = 0
      const fn = debounce(() => {
        callCount++
      }, 50)

      fn()
      await new Promise(resolve => setTimeout(resolve, 30))
      fn()
      await new Promise(resolve => setTimeout(resolve, 30))
      fn()

      expect(callCount).toBe(0)

      await new Promise(resolve => setTimeout(resolve, 100))
      expect(callCount).toBe(1)
    })
  })

  describe("ConcurrencyLimiter", () => {
    it("limits concurrent executions", async () => {
      const limiter = new ConcurrencyLimiter(2)
      let running = 0
      let maxRunning = 0

      const task = async () => {
        running++
        maxRunning = Math.max(maxRunning, running)
        await new Promise(resolve => setTimeout(resolve, 50))
        running--
      }

      await Promise.all([
        limiter.run(task),
        limiter.run(task),
        limiter.run(task),
      ])

      expect(maxRunning).toBe(2)
    })

    it("tracks running count", async () => {
      const limiter = new ConcurrencyLimiter(2)

      const task = async () => {
        expect(limiter.getRunning()).toBeGreaterThan(0)
        await new Promise(resolve => setTimeout(resolve, 50))
      }

      await limiter.run(task)
      expect(limiter.getRunning()).toBe(0)
    })

    it("queues excess tasks", async () => {
      const limiter = new ConcurrencyLimiter(1)

      const task = async () => {
        await new Promise(resolve => setTimeout(resolve, 50))
      }

      // Start 3 tasks, only 1 can run at a time
      const p1 = limiter.run(task)
      const p2 = limiter.run(task)
      const p3 = limiter.run(task)

      expect(limiter.getQueued()).toBeGreaterThan(0)

      await Promise.all([p1, p2, p3])
      expect(limiter.getQueued()).toBe(0)
    })
  })
})
