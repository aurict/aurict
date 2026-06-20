import { LRUCache } from "../util/lru-cache.js"
import { hashArgs } from "../util/hash.js"

/**
 * Tool Result Cache — tekrarlı tool çağrılarını cache'ler.
 * 
 * Sadece read-only tool'lar cache'lenir (side effectsiz olanlar).
 * write/edit/bash gibi tool'lar cache'lenmez.
 * 
 * write/edit yapıldığında ilgili path cache'leri invalidation edilir.
 */

// Per-tool TTL konfigürasyonu (ms)
const TOOL_TTL: Record<string, number> = {
  read:    30_000,   // 30s — dosya değişmiş olabilir
  glob:    15_000,   // 15s — dosya yapısı nadir değişir
  grep:    15_000,   // 15s
  symbols: 20_000,   // 20s
  lsp:     10_000,   // 10s — LSP state hızlı değişir
  code_map: 20_000,  // 20s
}

// Cache'lenecek tool'lar (read-only, side effectsiz)
const CACHEABLE_TOOLS = new Set(Object.keys(TOOL_TTL))

interface CacheEntry {
  result:    string
  error?:    string
  timestamp: number
}

class ToolResultCacheImpl {
  private cache = new LRUCache<string, CacheEntry>(200)
  private hits   = 0
  private misses = 0

  /**
   * Tool sonucunu cache'den al.
   * Cacheable değilse veya cache miss ise null döner.
   */
  get(toolId: string, args: Record<string, unknown>): { result: string; error?: string } | null {
    if (!CACHEABLE_TOOLS.has(toolId)) return null

    const key = this.makeKey(toolId, args)
    const entry = this.cache.get(key)

    if (entry) {
      this.hits++
      return { result: entry.result, ...(entry.error !== undefined ? { error: entry.error } : {}) }
    }

    this.misses++
    return null
  }

  /**
   * Tool sonucunu cache'e yaz.
   * Cacheable değilse hiçbir şey yapmaz.
   */
  set(toolId: string, args: Record<string, unknown>, result: string, error?: string): void {
    if (!CACHEABLE_TOOLS.has(toolId)) return

    const key = this.makeKey(toolId, args)
    const entry: CacheEntry = {
      result,
      ...(error !== undefined ? { error } : {}),
      timestamp: Date.now(),
    }

    this.cache.set(key, entry, TOOL_TTL[toolId])
  }

  /**
   * Dosya değişikliğinde ilgili path cache'lerini sil.
   * write/edit tool'larından sonra çağrılır.
   */
  invalidateByPath(filePath: string): void {
    // Path içeren tüm cache key'lerini sil
    // Key format: "toolId:hash" — hash args'tan üretiliyor
    // Args'te path varsa, hash değişecek, ama biz pattern matching yapıyoruz
    
    // Basit yaklaşım: tüm cache'i invalidate et (güvenli)
    // Performans etkisi minimal (cache küçük, 200 entry max)
    this.cache.invalidate(key => {
      // Key'den hash'i çözemeyiz, ama args'taki path'i tahmin edebiliriz
      // Güvenli yaklaşım: tüm read/glob/grep cache'lerini sil
      return key.startsWith("read:") || key.startsWith("glob:") || key.startsWith("grep:")
    })
  }

  /**
   * Dosya değişikliğinde daha hassas invalidation.
   * Sadece belirli bir dosyayı içeren cache entry'lerini siler.
   */
  invalidateByExactPath(filePath: string): void {
    // Bu yöntem daha karmaşık — args'taki path'i saklamak gerekir
    // Şimdilik basit yaklaşım: tüm file-related cache'leri sil
    this.invalidateByPath(filePath)
  }

  /** Cache istatistiklerini döner. */
  stats(): { hits: number; misses: number; hitRate: number; size: number } {
    const total = this.hits + this.misses
    return {
      hits:    this.hits,
      misses:  this.misses,
      hitRate: total > 0 ? this.hits / total : 0,
      size:    this.cache.size(),
    }
  }

  /** Cache'i tamamen temizle. */
  clear(): void {
    this.cache.clear()
    this.hits = 0
    this.misses = 0
  }

  /** Tool cache'lenebilir mi kontrol et. */
  isCacheable(toolId: string): boolean {
    return CACHEABLE_TOOLS.has(toolId)
  }

  // ─── Internal ──────────────────────────────────────────────────────────────

  private makeKey(toolId: string, args: Record<string, unknown>): string {
    return `${toolId}:${hashArgs(args)}`
  }
}

/** Global singleton tool cache. */
export const toolResultCache = new ToolResultCacheImpl()

/** Test veya çoklu session için yeni instance oluştur. */
export function createToolResultCache(): ToolResultCacheImpl {
  return new ToolResultCacheImpl()
}
