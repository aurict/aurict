import { ProviderRegistry } from "./registry.js"
import type { ProviderPlugin } from "./plugin.js"

/**
 * Provider Fallback Chain
 * 
 * Rate limit, timeout, auth error durumunda otomatik olarak bir sonraki provider'a geçer.
 * Circuit breaker pattern ile sürekli başarısız provider'ları geçici olarak devre dışı bırakır.
 */

export type FallbackTrigger = "429" | "503" | "timeout" | "auth_error"

export interface FallbackConfig {
  enabled: boolean
  providers: string[]           // Fallback sırası (primary hariç)
  triggerOn: FallbackTrigger[]  // Hangi hatalarda fallback yap
  maxRetries: number            // Provider başına max retry
  retryDelayMs: number          // Retry'ler arası bekleme
  circuitBreakerThreshold: number  // Kaç başarısızlıktan sonra devre dışı bırak
  circuitBreakerResetMs: number    // Ne kadar sonra tekrar dene
}

export const DEFAULT_FALLBACK_CONFIG: FallbackConfig = {
  enabled: false,
  providers: [],
  triggerOn: ["429", "503", "timeout"],
  maxRetries: 2,
  retryDelayMs: 15_000,
  circuitBreakerThreshold: 3,
  circuitBreakerResetMs: 60_000,
}

interface CircuitBreakerState {
  failures: number
  lastFailureAt: number
  open: boolean
}

export class ProviderFallback {
  private circuitBreakers = new Map<string, CircuitBreakerState>()
  private config: FallbackConfig

  constructor(config: Partial<FallbackConfig> = {}) {
    this.config = { ...DEFAULT_FALLBACK_CONFIG, ...config }
  }

  /**
   * Primary provider ile başla, başarısız olursa fallback zincirini dene.
   * 
   * @param primaryProvider Başlangıç provider'ı
   * @param fn Provider'ı alıp işleyen async fonksiyon
   * @returns Sonuç + hangi provider'ın başarılı olduğu
   */
  async execute<T>(
    primaryProvider: string,
    fn: (provider: ProviderPlugin) => Promise<T>,
  ): Promise<{ result: T; provider: string; switchedFrom?: string }> {
    if (!this.config.enabled || this.config.providers.length === 0) {
      // Fallback devre dışı — sadece primary dene, mevcut retry mantığı
      const plugin = ProviderRegistry.get(primaryProvider)
      const result = await this.executeWithRetry(plugin, fn)
      return { result, provider: primaryProvider }
    }

    // Provider listesi: primary + fallback'ler
    const providerChain = [primaryProvider, ...this.config.providers]
    let lastError: Error | null = null

    for (let i = 0; i < providerChain.length; i++) {
      const providerId = providerChain[i]!
      
      // Circuit breaker kontrolü
      if (this.isCircuitOpen(providerId)) {
        continue
      }

      const plugin = ProviderRegistry.get(providerId)
      
      try {
        const result = await this.executeWithRetry(plugin, fn)
        return {
          result,
          provider: providerId,
          ...(i > 0 ? { switchedFrom: primaryProvider } : {}),
        }
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err))
        
        // Fallback trigger mı kontrol et
        if (!this.isFallbackTrigger(lastError)) {
          throw lastError  // Fallback gerektirmeyen hata — hemen fırlat
        }

        // Circuit breaker güncelle
        this.recordFailure(providerId)
        
        // Sonraki provider'a geç
        continue
      }
    }

    // Tüm provider'lar başarısız
    throw lastError ?? new Error("All providers failed")
  }

  /**
   * Tek bir provider'ı retry mantığıyla çalıştır.
   */
  private async executeWithRetry<T>(
    plugin: ProviderPlugin,
    fn: (provider: ProviderPlugin) => Promise<T>,
  ): Promise<T> {
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        const result = await fn(plugin)
        // Başarılı — circuit breaker'ı sıfırla
        this.recordSuccess(plugin.id)
        return result
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err))
        
        // Retry gerektiren hata mı?
        if (!this.isRetryableError(lastError) || attempt >= this.config.maxRetries) {
          throw lastError
        }

        // Retry delay
        const delay = this.parseRetryAfter(lastError) ?? this.config.retryDelayMs
        await this.sleep(delay)
      }
    }

    throw lastError ?? new Error("Max retries exceeded")
  }

  /**
   * Hata fallback trigger'larından biri mi?
   */
  private isFallbackTrigger(err: Error): boolean {
    const msg = err.message.toLowerCase()
    
    for (const trigger of this.config.triggerOn) {
      switch (trigger) {
        case "429":
          if (/429|rate.?limit|too.many|quota/i.test(msg)) return true
          break
        case "503":
          if (/503|502|overload|unavailable|service.?down/i.test(msg)) return true
          break
        case "timeout":
          if (/timeout|etimedout|econnaborted/i.test(msg)) return true
          break
        case "auth_error":
          if (/401|unauthorized|invalid.?api.?key|authentication/i.test(msg)) return true
          break
      }
    }
    
    return false
  }

  /**
   * Hata retry edilebilir mi?
   */
  private isRetryableError(err: Error): boolean {
    return this.isFallbackTrigger(err)
  }

  /**
   * Retry-After header'ını parse et.
   */
  private parseRetryAfter(err: Error): number | undefined {
    const match = err.message.match(/retry.?after[:\s]*(\d+)/i)
    if (match?.[1]) {
      return parseInt(match[1], 10) * 1000
    }
    return undefined
  }

  // ─── Circuit Breaker ─────────────────────────────────────────────────────

  private isCircuitOpen(providerId: string): boolean {
    const state = this.circuitBreakers.get(providerId)
    if (!state || !state.open) return false

    // Reset süresi doldu mu?
    if (Date.now() - state.lastFailureAt >= this.config.circuitBreakerResetMs) {
      state.open = false
      state.failures = 0
      return false
    }

    return true
  }

  private recordFailure(providerId: string): void {
    const state = this.circuitBreakers.get(providerId) ?? {
      failures: 0,
      lastFailureAt: 0,
      open: false,
    }

    state.failures++
    state.lastFailureAt = Date.now()

    if (state.failures >= this.config.circuitBreakerThreshold) {
      state.open = true
    }

    this.circuitBreakers.set(providerId, state)
  }

  private recordSuccess(providerId: string): void {
    this.circuitBreakers.delete(providerId)
  }

  /**
   * Circuit breaker durumunu döndür (debug/test için).
   */
  getCircuitBreakerState(providerId: string): { failures: number; open: boolean } | null {
    const state = this.circuitBreakers.get(providerId)
    if (!state) return null
    return { failures: state.failures, open: state.open }
  }

  /**
   * Tüm circuit breaker'ları sıfırla.
   */
  resetCircuitBreakers(): void {
    this.circuitBreakers.clear()
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

/**
 * Singleton fallback instance.
 * Config'den yükleme: loadFallbackFromConfig()
 */
export let providerFallback = new ProviderFallback()

/**
 * Config'den fallback ayarlarını yükle.
 */
export function loadFallbackFromConfig(config: Partial<FallbackConfig>): void {
  providerFallback = new ProviderFallback(config)
}
