/**
 * Error Boundary & Recovery System
 * 
 * Hataları yakalar, sınıflandırır ve kurtarma stratejileri uygular.
 * - Circuit breaker pattern
 * - Retry with exponential backoff
 * - Graceful degradation
 * - Error classification
 */

export type ErrorSeverity = "info" | "warning" | "error" | "critical"

export type ErrorCategory =
  | "network"
  | "timeout"
  | "validation"
  | "permission"
  | "resource"
  | "logic"
  | "unknown"

export interface ClassifiedError {
  original: Error
  category: ErrorCategory
  severity: ErrorSeverity
  retryable: boolean
  message: string
  stack?: string | undefined
}

export interface RecoveryStrategy {
  maxRetries: number
  backoffMs: number
  backoffMultiplier: number
  maxBackoffMs: number
}

const DEFAULT_RECOVERY: RecoveryStrategy = {
  maxRetries: 3,
  backoffMs: 1000,
  backoffMultiplier: 2,
  maxBackoffMs: 30000,
}

/**
 * Hata kategorizasyonu — hata tipine göre sınıflandırır.
 */
export function classifyError(error: Error | string): ClassifiedError {
  const err = typeof error === "string" ? new Error(error) : error
  const message = err.message.toLowerCase()
  const stack = err.stack

  // Network errors
  if (message.includes("econnrefused") ||
      message.includes("enotfound") ||
      message.includes("network") ||
      message.includes("fetch failed")) {
    return {
      original: err,
      category: "network",
      severity: "error",
      retryable: true,
      message: err.message,
      stack,
    }
  }

  // Timeout errors
  if (message.includes("timeout") ||
      message.includes("etimedout") ||
      message.includes("aborted")) {
    return {
      original: err,
      category: "timeout",
      severity: "warning",
      retryable: true,
      message: err.message,
      stack,
    }
  }

  // Validation errors
  if (message.includes("validation") ||
      message.includes("invalid") ||
      message.includes("schema")) {
    return {
      original: err,
      category: "validation",
      severity: "warning",
      retryable: false,
      message: err.message,
      stack,
    }
  }

  // Permission errors
  if (message.includes("permission") ||
      message.includes("eacces") ||
      message.includes("eperm") ||
      message.includes("unauthorized") ||
      message.includes("forbidden")) {
    return {
      original: err,
      category: "permission",
      severity: "error",
      retryable: false,
      message: err.message,
      stack,
    }
  }

  // Resource errors
  if (message.includes("enoent") ||
      message.includes("not found") ||
      message.includes("missing") ||
      message.includes("out of memory")) {
    return {
      original: err,
      category: "resource",
      severity: "error",
      retryable: false,
      message: err.message,
      stack,
    }
  }

  // Logic errors
  if (message.includes("typeerror") ||
      message.includes("referenceerror") ||
      message.includes("syntaxerror") ||
      message.includes("cannot read property") ||
      message.includes("is not a function") ||
      message.includes("is not defined")) {
    return {
      original: err,
      category: "logic",
      severity: "critical",
      retryable: false,
      message: err.message,
      stack,
    }
  }

  // Unknown
  return {
    original: err,
    category: "unknown",
    severity: "error",
    retryable: true,
    message: err.message,
    stack,
  }
}

/**
 * Retry with exponential backoff.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  strategy: Partial<RecoveryStrategy> = {},
): Promise<T> {
  const config = { ...DEFAULT_RECOVERY, ...strategy }
  let lastError: Error | null = null
  let backoff = config.backoffMs

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      const classified = classifyError(lastError)

      // Retryable değilse hemen fırlat
      if (!classified.retryable) {
        throw lastError
      }

      // Son deneme değilse bekle
      if (attempt < config.maxRetries) {
        await new Promise(resolve => setTimeout(resolve, backoff))
        backoff = Math.min(backoff * config.backoffMultiplier, config.maxBackoffMs)
      }
    }
  }

  throw lastError ?? new Error("Retry failed")
}

/**
 * Circuit breaker — sürekli başarısız olan işlemleri geçici olarak devre dışı bırakır.
 */
export class CircuitBreaker {
  private failures = 0
  private lastFailure = 0
  private state: "closed" | "open" | "half-open" = "closed"

  private readonly threshold: number
  private readonly resetTimeoutMs: number

  constructor(threshold: number = 5, resetTimeoutMs: number = 60000) {
    this.threshold = threshold
    this.resetTimeoutMs = resetTimeoutMs
  }

  /**
   * İşlemi çalıştır — circuit açıksa hemen hata fırlat.
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "open") {
      // Reset timeout geçti mi?
      if (Date.now() - this.lastFailure > this.resetTimeoutMs) {
        this.state = "half-open"
      } else {
        throw new Error("Circuit breaker is open")
      }
    }

    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (err) {
      this.onFailure()
      throw err
    }
  }

  private onSuccess(): void {
    this.failures = 0
    this.state = "closed"
  }

  private onFailure(): void {
    this.failures++
    this.lastFailure = Date.now()

    if (this.failures >= this.threshold) {
      this.state = "open"
    }
  }

  /**
   * Circuit durumunu getir.
   */
  getState(): "closed" | "open" | "half-open" {
    return this.state
  }

  /**
   * Failure sayısını getir.
   */
  getFailureCount(): number {
    return this.failures
  }

  /**
   * Circuit breaker'ı sıfırla.
   */
  reset(): void {
    this.failures = 0
    this.state = "closed"
    this.lastFailure = 0
  }
}

/**
 * Graceful degradation — hata durumunda fallback değer döner.
 */
export async function withFallback<T>(
  fn: () => Promise<T>,
  fallback: T,
  onError?: (error: Error) => void,
): Promise<T> {
  try {
    return await fn()
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err))
    onError?.(error)
    return fallback
  }
}

/**
 * Error boundary — async fonksiyonları try-catch ile sarar.
 */
export async function errorBoundary<T>(
  fn: () => Promise<T>,
  handler: (error: ClassifiedError) => void,
): Promise<T | null> {
  try {
    return await fn()
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err))
    const classified = classifyError(error)
    handler(classified)
    return null
  }
}

/**
 * Global error handler registry.
 */
export class ErrorHandlerRegistry {
  private handlers = new Map<string, (error: ClassifiedError) => void>()

  /**
   * Error handler kaydet.
   */
  register(name: string, handler: (error: ClassifiedError) => void): void {
    this.handlers.set(name, handler)
  }

  /**
   * Error handler kaldır.
   */
  unregister(name: string): void {
    this.handlers.delete(name)
  }

  /**
   * Tüm handler'ları çağır.
   */
  notify(error: ClassifiedError): void {
    for (const handler of this.handlers.values()) {
      try {
        handler(error)
      } catch {
        // Handler hatası uygulamayı durdurmamalı
      }
    }
  }

  /**
   * Handler sayısını getir.
   */
  getHandlerCount(): number {
    return this.handlers.size
  }
}

/**
 * Global error handler registry instance.
 */
export const errorHandlerRegistry = new ErrorHandlerRegistry()
