/**
 * Shared Context Bus + File Lock
 * 
 * Multi-agent ortamında:
 * 1. Dosya kilidi — aynı dosyayı iki agent aynı anda edit etmesin
 * 2. Context paylaşımı — agent'lar arası key-value veri paylaşımı
 */

export interface FileLock {
  filePath: string
  agentId: string
  acquiredAt: number
  expiresAt: number
}

export interface ContextBusConfig {
  lockTimeoutMs: number  // Lock süresi (ms)
  maxLocks: number       // Max eş zamanlı lock
}

const DEFAULT_CONFIG: ContextBusConfig = {
  lockTimeoutMs: 30_000,  // 30 saniye
  maxLocks: 20,
}

class ContextBusImpl {
  private data = new Map<string, unknown>()
  private locks = new Map<string, FileLock>()
  private config: ContextBusConfig

  constructor(config: Partial<ContextBusConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  // ─── Context Sharing ─────────────────────────────────────────────────────────

  /**
   * Key-value veri paylaşımı.
   */
  set(key: string, value: unknown): void {
    this.data.set(key, value)
  }

  /**
   * Paylaşılan veriyi oku.
   */
  get<T>(key: string): T | null {
    return (this.data.get(key) as T) ?? null
  }

  /**
   * Key var mı kontrol et.
   */
  has(key: string): boolean {
    return this.data.has(key)
  }

  /**
   * Key'i sil.
   */
  delete(key: string): boolean {
    return this.data.delete(key)
  }

  /**
   * Tüm key'leri listele.
   */
  keys(): string[] {
    return [...this.data.keys()]
  }

  /**
   * Context'i temizle.
   */
  clearContext(): void {
    this.data.clear()
  }

  // ─── File Locking ────────────────────────────────────────────────────────────

  /**
   * Dosya kilidi al.
   * 
   * @returns true = lock alındı, false = lock alınamadı (başka agent kullanıyor)
   */
  acquireLock(filePath: string, agentId: string): boolean {
    const now = Date.now()

    // Süresi dolmuş lock'ları temizle
    this.cleanupExpiredLocks()

    // Zaten kilitli mi?
    const existing = this.locks.get(filePath)
    if (existing) {
      // Aynı agent tekrar deniyorsa OK
      if (existing.agentId === agentId) {
        return true
      }
      // Başka agent kullanıyor
      return false
    }

    // Max lock limiti kontrolü
    if (this.locks.size >= this.config.maxLocks) {
      return false
    }

    // Lock al
    this.locks.set(filePath, {
      filePath,
      agentId,
      acquiredAt: now,
      expiresAt: now + this.config.lockTimeoutMs,
    })

    return true
  }

  /**
   * Dosya kilidini serbest bırak.
   */
  releaseLock(filePath: string, agentId: string): boolean {
    const lock = this.locks.get(filePath)
    if (!lock) return false

    // Sadece sahibi serbest bırakabilir
    if (lock.agentId !== agentId) return false

    this.locks.delete(filePath)
    return true
  }

  /**
   * Dosya kilitli mi kontrol et.
   */
  isLocked(filePath: string): boolean {
    this.cleanupExpiredLocks()
    return this.locks.has(filePath)
  }

  /**
   * Lock bilgisini döner.
   */
  getLockInfo(filePath: string): FileLock | null {
    this.cleanupExpiredLocks()
    return this.locks.get(filePath) ?? null
  }

  /**
   * Bir agent'ın tüm lock'larını döner.
   */
  getAgentLocks(agentId: string): FileLock[] {
    this.cleanupExpiredLocks()
    return [...this.locks.values()].filter(lock => lock.agentId === agentId)
  }

  /**
   * Bir agent'ın tüm lock'larını serbest bırak.
   */
  releaseAgentLocks(agentId: string): number {
    let count = 0
    for (const [filePath, lock] of this.locks.entries()) {
      if (lock.agentId === agentId) {
        this.locks.delete(filePath)
        count++
      }
    }
    return count
  }

  /**
   * Süresi dolmuş lock'ları temizle.
   */
  private cleanupExpiredLocks(): void {
    const now = Date.now()
    for (const [filePath, lock] of this.locks.entries()) {
      if (now > lock.expiresAt) {
        this.locks.delete(filePath)
      }
    }
  }

  /**
   * Tüm lock'ları temizle (test için).
   */
  clearLocks(): void {
    this.locks.clear()
  }

  /**
   * Aktif lock sayısını döner.
   */
  getLockCount(): number {
    this.cleanupExpiredLocks()
    return this.locks.size
  }

  /**
   * Config'i günceller.
   */
  updateConfig(config: Partial<ContextBusConfig>): void {
    this.config = { ...this.config, ...config }
  }
}

export const contextBus = new ContextBusImpl()

export function createContextBus(config?: Partial<ContextBusConfig>): ContextBusImpl {
  return new ContextBusImpl(config)
}
