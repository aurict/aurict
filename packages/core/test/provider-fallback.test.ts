import { describe, it, expect, beforeEach } from "bun:test"
import { ProviderFallback, DEFAULT_FALLBACK_CONFIG } from "../src/provider/fallback.js"
import type { ProviderPlugin } from "../src/provider/plugin.js"

describe("ProviderFallback", () => {
  describe("constructor", () => {
    it("creates with default config", () => {
      const fallback = new ProviderFallback()
      expect(fallback).toBeDefined()
    })

    it("creates with custom config", () => {
      const fallback = new ProviderFallback({
        enabled: true,
        providers: ["openai", "google"],
        maxRetries: 3,
      })
      expect(fallback).toBeDefined()
    })
  })

  describe("execute without fallback", () => {
    it("executes with primary provider when fallback disabled", async () => {
      const fallback = new ProviderFallback({ enabled: false })
      
      const result = await fallback.execute("anthropic", async (plugin) => {
        return `success with ${plugin.id}`
      })

      expect(result.provider).toBe("anthropic")
      expect(result.result).toBe("success with anthropic")
    })

    it("throws error when primary fails and fallback disabled", async () => {
      const fallback = new ProviderFallback({ 
        enabled: false,
        retryDelayMs: 10, // Hızlı test için
      })
      
      await expect(
        fallback.execute("anthropic", async () => {
          throw new Error("429 rate limit")
        })
      ).rejects.toThrow("429 rate limit")
    })
  })

  describe("execute with fallback", () => {
    it("switches to fallback provider on 429", async () => {
      const fallback = new ProviderFallback({
        enabled: true,
        providers: ["openai"],
        triggerOn: ["429"],
        maxRetries: 0, // Retry yapma, hemen fallback'e geç
        retryDelayMs: 10, // Hızlı test için
      })

      let callCount = 0
      const result = await fallback.execute("anthropic", async (plugin) => {
        callCount++
        if (plugin.id === "anthropic") {
          throw new Error("429 rate limit exceeded")
        }
        return `success with ${plugin.id}`
      })

      expect(result.provider).toBe("openai")
      expect(result.switchedFrom).toBe("anthropic")
      // maxRetries=0: anthropic 1 kez, openai 1 kez = 2 çağrı
      expect(callCount).toBe(2)
    })

    it("switches to fallback provider on 503", async () => {
      const fallback = new ProviderFallback({
        enabled: true,
        providers: ["google"],
        triggerOn: ["503"],
        maxRetries: 1,
        retryDelayMs: 10,
      })

      const result = await fallback.execute("anthropic", async (plugin) => {
        if (plugin.id === "anthropic") {
          throw new Error("503 service unavailable")
        }
        return `success with ${plugin.id}`
      })

      expect(result.provider).toBe("google")
      expect(result.switchedFrom).toBe("anthropic")
    })

    it("switches to fallback provider on timeout", async () => {
      const fallback = new ProviderFallback({
        enabled: true,
        providers: ["openai"],
        triggerOn: ["timeout"],
        maxRetries: 1,
        retryDelayMs: 10,
      })

      const result = await fallback.execute("anthropic", async (plugin) => {
        if (plugin.id === "anthropic") {
          throw new Error("ETIMEDOUT connection timeout")
        }
        return `success with ${plugin.id}`
      })

      expect(result.provider).toBe("openai")
    })

    it("throws non-trigger errors immediately", async () => {
      const fallback = new ProviderFallback({
        enabled: true,
        providers: ["openai"],
        triggerOn: ["429"],
        maxRetries: 1,
      })

      await expect(
        fallback.execute("anthropic", async () => {
          throw new Error("401 unauthorized")
        })
      ).rejects.toThrow("401 unauthorized")
    })

    it("tries multiple fallback providers in order", async () => {
      const fallback = new ProviderFallback({
        enabled: true,
        providers: ["openai", "google"],
        triggerOn: ["429"],
        maxRetries: 1,
        retryDelayMs: 10,
      })

      const result = await fallback.execute("anthropic", async (plugin) => {
        if (plugin.id === "anthropic" || plugin.id === "openai") {
          throw new Error("429 rate limit")
        }
        return `success with ${plugin.id}`
      })

      expect(result.provider).toBe("google")
    })

    it("throws when all providers fail", async () => {
      const fallback = new ProviderFallback({
        enabled: true,
        providers: ["openai"],
        triggerOn: ["429"],
        maxRetries: 1,
        retryDelayMs: 10,
      })

      await expect(
        fallback.execute("anthropic", async () => {
          throw new Error("429 rate limit")
        })
      ).rejects.toThrow("429 rate limit")
    })
  })

  describe("circuit breaker", () => {
    it("opens circuit after threshold failures", async () => {
      const fallback = new ProviderFallback({
        enabled: true,
        providers: ["openai"],
        triggerOn: ["429"],
        maxRetries: 0,
        circuitBreakerThreshold: 2,
        circuitBreakerResetMs: 60000,
      })

      // 2 başarısız çağrı — her iki provider da başarısız olsun
      for (let i = 0; i < 2; i++) {
        try {
          await fallback.execute("anthropic", async () => {
            throw new Error("429 rate limit")
          })
        } catch {
          // Beklenen — tüm provider'lar başarısız
        }
      }

      // 2 başarısızlıktan sonra circuit breaker açılmalı
      const state = fallback.getCircuitBreakerState("anthropic")
      expect(state).not.toBeNull()
      expect(state!.failures).toBe(2)
      expect(state!.open).toBe(true)
    })

    it("resets circuit on success", async () => {
      const fallback = new ProviderFallback({
        enabled: true,
        providers: [],
        triggerOn: ["429"],
        maxRetries: 0,
        circuitBreakerThreshold: 2,
      })

      // 1 başarısızlık
      try {
        await fallback.execute("anthropic", async () => {
          throw new Error("429 rate limit")
        })
      } catch {
        // Beklenen
      }

      // Başarı
      await fallback.execute("anthropic", async () => "success")

      const state = fallback.getCircuitBreakerState("anthropic")
      expect(state).toBeNull() // Başarıda sıfırlandı
    })

    it("resetCircuitBreakers clears all states", async () => {
      const fallback = new ProviderFallback({
        enabled: true,
        providers: [],
        triggerOn: ["429"],
        maxRetries: 0,
        circuitBreakerThreshold: 1,
      })

      try {
        await fallback.execute("anthropic", async () => {
          throw new Error("429 rate limit")
        })
      } catch {
        // Beklenen
      }

      fallback.resetCircuitBreakers()
      const state = fallback.getCircuitBreakerState("anthropic")
      expect(state).toBeNull()
    })
  })

  describe("retry delay", () => {
    it("respects Retry-After header", async () => {
      const fallback = new ProviderFallback({
        enabled: true,
        providers: [],
        triggerOn: ["429"],
        maxRetries: 1,
        retryDelayMs: 10,
      })

      const start = Date.now()
      try {
        await fallback.execute("anthropic", async () => {
          throw new Error("429 rate limit, retry after 1 seconds")
        })
      } catch {
        // Beklenen — tüm provider'lar başarısız
      }
      const elapsed = Date.now() - start

      // Retry-After 1s = 1000ms beklemeli (en az 900ms)
      // Ama timeout 5s, bu yüzden dikkatli ol
      expect(elapsed).toBeGreaterThanOrEqual(800)
    }, 10000) // 10s timeout
  })
})

describe("DEFAULT_FALLBACK_CONFIG", () => {
  it("has sensible defaults", () => {
    expect(DEFAULT_FALLBACK_CONFIG.enabled).toBe(false)
    expect(DEFAULT_FALLBACK_CONFIG.providers).toEqual([])
    expect(DEFAULT_FALLBACK_CONFIG.maxRetries).toBe(2)
    expect(DEFAULT_FALLBACK_CONFIG.retryDelayMs).toBe(15000)
    expect(DEFAULT_FALLBACK_CONFIG.circuitBreakerThreshold).toBe(3)
    expect(DEFAULT_FALLBACK_CONFIG.circuitBreakerResetMs).toBe(60000)
  })
})
