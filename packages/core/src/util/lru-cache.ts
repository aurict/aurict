/**
 * Generic LRU Cache with optional TTL support.
 * 
 * Map insertion order'unu kullanarak LRU eviction yapar.
 * Thread-safe değildir (Bun single-threaded model için tasarlandı).
 * 
 * Kullanım:
 *   const cache = new LRUCache<string, string>(100, 30_000)
 *   cache.set("key", "value")
 *   cache.get("key")  // "value"
 *   cache.invalidate(k => k.startsWith("prefix"))
 */

interface CacheEntry<V> {
  value:     V
  expiresAt: number  // 0 = no expiry
}

export class LRUCache<K, V> {
  private readonly maxSize: number
  private readonly defaultTtlMs: number
  private readonly map: Map<K, CacheEntry<V>>

  /**
   * @param maxSize  Maksimum entry sayısı. Aşıldığında en eski entry silinir.
   * @param ttlMs    Varsayılan TTL (ms). 0 = süresiz. Per-set override edilebilir.
   */
  constructor(maxSize: number, ttlMs: number = 0) {
    if (maxSize < 1) throw new Error("LRUCache maxSize must be >= 1")
    this.maxSize    = maxSize
    this.defaultTtlMs = ttlMs
    this.map        = new Map()
  }

  /** Entry'yi al. Yoksa veya süresi dolmuşsa null döner. */
  get(key: K): V | null {
    const entry = this.map.get(key)
    if (!entry) return null

    // TTL kontrolü
    if (entry.expiresAt > 0 && Date.now() > entry.expiresAt) {
      this.map.delete(key)
      return null
    }

    // LRU: sil ve yeniden ekle (Map sona ekler)
    this.map.delete(key)
    this.map.set(key, entry)

    return entry.value
  }

  /** Entry'yi ekle/güncelle. */
  set(key: K, value: V, ttlMs?: number): void {
    // Zaten varsa sil (sona eklemek için)
    if (this.map.has(key)) {
      this.map.delete(key)
    }

    // Capacity check — doluysa en eski entry'yi sil
    if (this.map.size >= this.maxSize) {
      const oldestKey = this.map.keys().next().value
      if (oldestKey !== undefined) {
        this.map.delete(oldestKey)
      }
    }

    const ttl = ttlMs ?? this.defaultTtlMs
    const expiresAt = ttl > 0 ? Date.now() + ttl : 0

    this.map.set(key, { value, expiresAt })
  }

  /** Key var mı kontrol et (TTL'yi de kontrol eder). */
  has(key: K): boolean {
    const entry = this.map.get(key)
    if (!entry) return false

    if (entry.expiresAt > 0 && Date.now() > entry.expiresAt) {
      this.map.delete(key)
      return false
    }
    return true
  }

  /** Key'i sil. */
  delete(key: K): boolean {
    return this.map.delete(key)
  }

  /** Predicate'e uyan tüm key'leri sil. */
  invalidate(predicate: (key: K) => boolean): void {
    for (const key of this.map.keys()) {
      if (predicate(key)) {
        this.map.delete(key)
      }
    }
  }

  /** Tüm entry'leri sil. */
  clear(): void {
    this.map.clear()
  }

  /** Mevcut entry sayısı (süresi dolmuşlar dahil). */
  size(): number {
    return this.map.size
  }

  /** Süresi dolmuş entry'leri temizle, gerçek boyutu döner. */
  prune(): number {
    const now = Date.now()
    for (const [key, entry] of this.map) {
      if (entry.expiresAt > 0 && now > entry.expiresAt) {
        this.map.delete(key)
      }
    }
    return this.map.size
  }

  /** Tüm key'leri döner (iterasyon için). */
  keys(): IterableIterator<K> {
    return this.map.keys()
  }

  /** Tüm value'ları döner. */
  values(): IterableIterator<V> {
    const result: V[] = []
    for (const entry of this.map.values()) {
      result.push(entry.value)
    }
    return result[Symbol.iterator]()
  }

  /** Tüm [key, value] çiftlerini döner. */
  entries(): Array<[K, V]> {
    const result: Array<[K, V]> = []
    for (const [key, entry] of this.map) {
      result.push([key, entry.value])
    }
    return result
  }

  /** İstatistik bilgisi döner. */
  stats(): { size: number; maxSize: number; ttlMs: number } {
    return {
      size:    this.map.size,
      maxSize: this.maxSize,
      ttlMs:   this.defaultTtlMs,
    }
  }
}
