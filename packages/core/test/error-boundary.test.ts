import { describe, it, expect } from "bun:test"
import {
  classifyError,
  withRetry,
  CircuitBreaker,
  withFallback,
  errorBoundary,
  ErrorHandlerRegistry,
} from "../src/security/error-boundary.js"

describe("Error Boundary & Recovery", () => {
  describe("classifyError", () => {
    it("classifies network errors", () => {
      const error = new Error("ECONNREFUSED: Connection refused")
      const classified = classifyError(error)
      
      expect(classified.category).toBe("network")
      expect(classified.retryable).toBe(true)
    })

    it("classifies timeout errors", () => {
      const error = new Error("Request timeout after 5000ms")
      const classified = classifyError(error)
      
      expect(classified.category).toBe("timeout")
      expect(classified.retryable).toBe(true)
    })

    it("classifies validation errors", () => {
      const error = new Error("Validation failed: invalid email")
      const classified = classifyError(error)
      
      expect(classified.category).toBe("validation")
      expect(classified.retryable).toBe(false)
    })

    it("classifies permission errors", () => {
      const error = new Error("EACCES: permission denied")
      const classified = classifyError(error)
      
      expect(classified.category).toBe("permission")
      expect(classified.retryable).toBe(false)
    })

    it("classifies resource errors", () => {
      const error = new Error("ENOENT: no such file or directory")
      const classified = classifyError(error)
      
      expect(classified.category).toBe("resource")
      expect(classified.retryable).toBe(false)
    })

    it("classifies logic errors as critical", () => {
      const error = new TypeError("Cannot read property 'foo' of undefined")
      const classified = classifyError(error)
      
      expect(classified.category).toBe("logic")
      expect(classified.severity).toBe("critical")
      expect(classified.retryable).toBe(false)
    })

    it("classifies unknown errors as retryable", () => {
      const error = new Error("Something went wrong")
      const classified = classifyError(error)
      
      expect(classified.category).toBe("unknown")
      expect(classified.retryable).toBe(true)
    })

    it("accepts string input", () => {
      const classified = classifyError("Network error")
      expect(classified.category).toBe("network")
    })
  })

  describe("withRetry", () => {
    it("retries on retryable errors", async () => {
      let attempts = 0
      const fn = async () => {
        attempts++
        if (attempts < 3) {
          throw new Error("ECONNREFUSED")
        }
        return "success"
      }

      const result = await withRetry(fn, { maxRetries: 3, backoffMs: 10 })
      expect(result).toBe("success")
      expect(attempts).toBe(3)
    })

    it("does not retry non-retryable errors", async () => {
      let attempts = 0
      const fn = async () => {
        attempts++
        throw new Error("Validation failed")
      }

      await expect(withRetry(fn, { maxRetries: 3, backoffMs: 10 })).rejects.toThrow("Validation failed")
      expect(attempts).toBe(1)
    })

    it("uses exponential backoff", async () => {
      let attempts = 0
      const fn = async () => {
        attempts++
        if (attempts < 3) {
          throw new Error("ECONNREFUSED")
        }
        return "success"
      }

      const start = Date.now()
      await withRetry(fn, { maxRetries: 3, backoffMs: 50, backoffMultiplier: 2 })
      const elapsed = Date.now() - start

      // Should wait at least 50ms + 100ms = 150ms
      expect(elapsed).toBeGreaterThanOrEqual(100)
    })

    it("throws after max retries", async () => {
      const fn = async () => {
        throw new Error("ECONNREFUSED")
      }

      await expect(withRetry(fn, { maxRetries: 2, backoffMs: 10 })).rejects.toThrow("ECONNREFUSED")
    })
  })

  describe("CircuitBreaker", () => {
    it("allows successful operations", async () => {
      const breaker = new CircuitBreaker(3, 1000)
      const fn = async () => "success"

      const result = await breaker.execute(fn)
      expect(result).toBe("success")
      expect(breaker.getState()).toBe("closed")
    })

    it("opens after threshold failures", async () => {
      const breaker = new CircuitBreaker(3, 1000)
      const fn = async () => { throw new Error("fail") }

      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(fn)
        } catch {}
      }

      expect(breaker.getState()).toBe("open")
    })

    it("rejects immediately when open", async () => {
      const breaker = new CircuitBreaker(2, 5000)
      const fn = async () => { throw new Error("fail") }

      for (let i = 0; i < 2; i++) {
        try {
          await breaker.execute(fn)
        } catch {}
      }

      await expect(breaker.execute(async () => "success")).rejects.toThrow("Circuit breaker is open")
    })

    it("transitions to half-open after timeout", async () => {
      const breaker = new CircuitBreaker(2, 100)
      const fn = async () => { throw new Error("fail") }

      for (let i = 0; i < 2; i++) {
        try {
          await breaker.execute(fn)
        } catch {}
      }

      expect(breaker.getState()).toBe("open")

      await new Promise(resolve => setTimeout(resolve, 150))

      // Should transition to half-open and allow one attempt
      const result = await breaker.execute(async () => "success")
      expect(result).toBe("success")
      expect(breaker.getState()).toBe("closed")
    })

    it("resets on success", async () => {
      const breaker = new CircuitBreaker(3, 1000)
      
      try {
        await breaker.execute(async () => { throw new Error("fail") })
      } catch {}

      expect(breaker.getFailureCount()).toBe(1)

      await breaker.execute(async () => "success")
      expect(breaker.getFailureCount()).toBe(0)
    })

    it("manual reset", async () => {
      const breaker = new CircuitBreaker(2, 1000)
      const fn = async () => { throw new Error("fail") }

      for (let i = 0; i < 2; i++) {
        try {
          await breaker.execute(fn)
        } catch {}
      }

      expect(breaker.getState()).toBe("open")
      breaker.reset()
      expect(breaker.getState()).toBe("closed")
    })
  })

  describe("withFallback", () => {
    it("returns result on success", async () => {
      const result = await withFallback(
        async () => "success",
        "fallback"
      )
      expect(result).toBe("success")
    })

    it("returns fallback on error", async () => {
      const result = await withFallback(
        async () => { throw new Error("fail") },
        "fallback"
      )
      expect(result).toBe("fallback")
    })

    it("calls onError handler", async () => {
      let errorCaught: Error | null = null
      
      await withFallback(
        async () => { throw new Error("fail") },
        "fallback",
        (err) => { errorCaught = err }
      )

      expect(errorCaught).not.toBeNull()
      expect(errorCaught!.message).toBe("fail")
    })
  })

  describe("errorBoundary", () => {
    it("returns result on success", async () => {
      const result = await errorBoundary(
        async () => "success",
        () => {}
      )
      expect(result).toBe("success")
    })

    it("returns null on error", async () => {
      const result = await errorBoundary(
        async () => { throw new Error("fail") },
        () => {}
      )
      expect(result).toBeNull()
    })

    it("calls handler with classified error", async () => {
      let classified: any = null
      
      await errorBoundary(
        async () => { throw new Error("ECONNREFUSED") },
        (err) => { classified = err }
      )

      expect(classified).not.toBeNull()
      expect(classified.category).toBe("network")
    })
  })

  describe("ErrorHandlerRegistry", () => {
    it("registers and calls handlers", () => {
      const registry = new ErrorHandlerRegistry()
      let called = false

      registry.register("test", () => { called = true })

      const error = classifyError(new Error("test"))
      registry.notify(error)

      expect(called).toBe(true)
    })

    it("supports multiple handlers", () => {
      const registry = new ErrorHandlerRegistry()
      let count = 0

      registry.register("handler1", () => { count++ })
      registry.register("handler2", () => { count++ })

      const error = classifyError(new Error("test"))
      registry.notify(error)

      expect(count).toBe(2)
    })

    it("unregisters handlers", () => {
      const registry = new ErrorHandlerRegistry()
      let called = false

      registry.register("test", () => { called = true })
      registry.unregister("test")

      const error = classifyError(new Error("test"))
      registry.notify(error)

      expect(called).toBe(false)
    })

    it("handles handler errors gracefully", () => {
      const registry = new ErrorHandlerRegistry()
      
      registry.register("bad", () => { throw new Error("handler error") })
      registry.register("good", () => {})

      const error = classifyError(new Error("test"))
      
      // Should not throw
      expect(() => registry.notify(error)).not.toThrow()
    })

    it("tracks handler count", () => {
      const registry = new ErrorHandlerRegistry()
      
      registry.register("handler1", () => {})
      registry.register("handler2", () => {})

      expect(registry.getHandlerCount()).toBe(2)
    })
  })
})
