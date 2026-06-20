/**
 * Rate Limiting & Throttling
 * 
 * API çağrılarını rate limit eder.
 * - Token bucket algoritması
 * - Sliding window
 * - Per-user ve per-IP limitleri
 */

export interface RateLimitConfig {
  maxRequests: number      // Maksimum istek sayısı
  windowMs: number         // Zaman penceresi (ms)
  blockDurationMs?: number // Bloke süresi (opsiyonel)
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
  retryAfterMs?: number
}

interface TokenBucket {
  tokens: number
  lastRefill: number
}

/**
 * Token bucket rate limiter.
 */
export class TokenBucketLimiter {
  private buckets = new Map<string, TokenBucket>()
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = config
  }

  /**
   * İstek kontrolü — izin veriliyorsa true döner.
   */
  check(key: string): RateLimitResult {
    const now = Date.now()
    let bucket = this.buckets.get(key)

    if (!bucket) {
      bucket = {
        tokens: this.config.maxRequests,
        lastRefill: now,
      }
      this.buckets.set(key, bucket)
    }

    // Token refill
    const elapsed = now - bucket.lastRefill
    const tokensToAdd = (elapsed / this.config.windowMs) * this.config.maxRequests
    bucket.tokens = Math.min(this.config.maxRequests, bucket.tokens + tokensToAdd)
    bucket.lastRefill = now

    // Check
    if (bucket.tokens >= 1) {
      bucket.tokens -= 1
      return {
        allowed: true,
        remaining: Math.floor(bucket.tokens),
        resetAt: now + this.config.windowMs,
      }
    }

    // Rate limited
    const retryAfterMs = (1 - bucket.tokens) * (this.config.windowMs / this.config.maxRequests)
    return {
      allowed: false,
      remaining: 0,
      resetAt: now + this.config.windowMs,
      retryAfterMs: Math.ceil(retryAfterMs),
    }
  }

  /**
   * Bucket'ı sıfırla.
   */
  reset(key: string): void {
    this.buckets.delete(key)
  }

  /**
   * Tüm bucket'ları sıfırla.
   */
  resetAll(): void {
    this.buckets.clear()
  }

  /**
   * Bucket durumunu getir.
   */
  getBucket(key: string): TokenBucket | null {
    return this.buckets.get(key) ?? null
  }
}

/**
 * Sliding window rate limiter.
 */
export class SlidingWindowLimiter {
  private windows = new Map<string, number[]>()
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = config
  }

  /**
   * İstek kontrolü.
   */
  check(key: string): RateLimitResult {
    const now = Date.now()
    const windowStart = now - this.config.windowMs

    let timestamps = this.windows.get(key) ?? []

    // Eski timestamp'leri temizle
    timestamps = timestamps.filter(ts => ts > windowStart)

    // Check
    if (timestamps.length < this.config.maxRequests) {
      timestamps.push(now)
      this.windows.set(key, timestamps)

      return {
        allowed: true,
        remaining: this.config.maxRequests - timestamps.length,
        resetAt: (timestamps[0] ?? now) + this.config.windowMs,
      }
    }

    // Rate limited
    const oldestTimestamp = timestamps[0] ?? now
    const retryAfterMs = oldestTimestamp + this.config.windowMs - now

    return {
      allowed: false,
      remaining: 0,
      resetAt: oldestTimestamp + this.config.windowMs,
      retryAfterMs: Math.ceil(retryAfterMs),
    }
  }

  /**
   * Window'u sıfırla.
   */
  reset(key: string): void {
    this.windows.delete(key)
  }

  /**
   * Tüm window'ları sıfırla.
   */
  resetAll(): void {
    this.windows.clear()
  }
}

/**
 * Throttle decorator — fonksiyon çağrılarını throttle eder.
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delayMs: number,
): (...args: Parameters<T>) => ReturnType<T> | undefined {
  let lastCall = 0

  return function (this: any, ...args: Parameters<T>): ReturnType<T> | undefined {
    const now = Date.now()
    if (now - lastCall >= delayMs) {
      lastCall = now
      return fn.apply(this, args)
    }
    return undefined
  }
}

/**
 * Debounce decorator — fonksiyon çağrılarını debounce eder.
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delayMs: number,
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return function (this: any, ...args: Parameters<T>): void {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(() => {
      fn.apply(this, args)
      timeoutId = null
    }, delayMs)
  }
}

/**
 * Concurrent execution limiter — aynı anda çalışan task sayısını sınırlar.
 */
export class ConcurrencyLimiter {
  private running = 0
  private queue: Array<() => void> = []
  private maxConcurrent: number

  constructor(maxConcurrent: number) {
    this.maxConcurrent = maxConcurrent
  }

  /**
   * Task'ı çalıştır — slot varsa hemen, yoksa queue'ya ekle.
   */
  async run<T>(fn: () => Promise<T>): Promise<T> {
    if (this.running >= this.maxConcurrent) {
      await new Promise<void>(resolve => this.queue.push(resolve))
    }

    this.running++
    try {
      return await fn()
    } finally {
      this.running--
      const next = this.queue.shift()
      if (next) next()
    }
  }

  /**
   * Aktif task sayısını getir.
   */
  getRunning(): number {
    return this.running
  }

  /**
   * Queue'daki task sayısını getir.
   */
  getQueued(): number {
    return this.queue.length
  }
}

/**
 * Global rate limiter instance — API çağrıları için.
 */
export const apiRateLimiter = new TokenBucketLimiter({
  maxRequests: 100,
  windowMs: 60_000, // 100 request per minute
})

/**
 * Global concurrency limiter — agent task'ları için.
 */
export const agentConcurrencyLimiter = new ConcurrencyLimiter(4)
