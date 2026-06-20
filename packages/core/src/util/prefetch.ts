/**
 * Predictive Prefetching
 * 
 * Agent'ın bir sonraki hamlesini tahmin eder ve hazırlık yapar.
 * - Dosya okunduktan sonra → muhtemelen edit yapılacak → dosya içeriğini cache'le
 * - Grep yapıldıktan sonra → muhtemelen sonuç dosyaları okunacak → prefetch et
 * - Glob yapıldıktan sonra → muhtemelen dosyalar okunacak → prefetch et
 */

import { readFile } from "fs/promises"
import { resolve } from "path"
import { LRUCache } from "./lru-cache.js"

export type PrefetchHint = "file-read" | "grep-result" | "glob-result" | "edit-target"

export interface PrefetchRequest {
  hint: PrefetchHint
  data: Record<string, unknown>
  workdir: string
}

export interface PrefetchResult {
  path: string
  content: string
  prefetchedAt: number
}

/**
 * Predictive prefetch manager.
 */
export class PrefetchManager {
  private cache = new LRUCache<string, PrefetchResult>(50, 30_000) // 50 dosya, 30s TTL
  private prefetchCount = 0
  private hitCount = 0

  /**
   * Tool sonucuna göre prefetch yap.
   */
  async prefetch(request: PrefetchRequest): Promise<void> {
    const { hint, data, workdir } = request

    switch (hint) {
      case "file-read":
        // Dosya okundu → muhtemelen edit yapılacak → içeriği cache'le
        await this.prefetchFile(String(data["path"] ?? ""), workdir)
        break

      case "grep-result":
        // Grep yapıldı → sonuç dosyalarını prefetch et
        const grepFiles = (data["files"] as string[]) ?? []
        for (const file of grepFiles.slice(0, 5)) {
          await this.prefetchFile(file, workdir)
        }
        break

      case "glob-result":
        // Glob yapıldı → sonuç dosyalarını prefetch et
        const globFiles = (data["files"] as string[]) ?? []
        for (const file of globFiles.slice(0, 5)) {
          await this.prefetchFile(file, workdir)
        }
        break

      case "edit-target":
        // Edit yapılacak → hedef dosyayı prefetch et
        await this.prefetchFile(String(data["path"] ?? ""), workdir)
        break
    }
  }

  /**
   * Prefetch edilmiş dosyayı al.
   */
  getPrefetched(path: string): PrefetchResult | null {
    const result = this.cache.get(path)
    if (result) {
      this.hitCount++
    }
    return result
  }

  /**
   * Prefetch istatistikleri.
   */
  getStats(): { prefetchCount: number; hitCount: number; hitRate: number } {
    return {
      prefetchCount: this.prefetchCount,
      hitCount: this.hitCount,
      hitRate: this.prefetchCount > 0 ? this.hitCount / this.prefetchCount : 0,
    }
  }

  /**
   * Cache'i temizle.
   */
  clear(): void {
    this.cache.clear()
    this.prefetchCount = 0
    this.hitCount = 0
  }

  private async prefetchFile(filePath: string, workdir: string): Promise<void> {
    if (!filePath) return

    const absPath = resolve(workdir, filePath)

    // Zaten cache'de varsa skip
    if (this.cache.has(absPath)) return

    try {
      const content = await readFile(absPath, "utf-8")
      
      // Çok büyük dosyaları prefetch etme
      if (content.length > 100_000) return

      this.cache.set(absPath, {
        path: absPath,
        content,
        prefetchedAt: Date.now(),
      })

      this.prefetchCount++
    } catch {
      // Dosya okunamadıysa sessizce geç
    }
  }
}

/**
 * Tool sonucundan prefetch hint'lerini çıkarır.
 */
export function extractPrefetchHints(
  toolId: string,
  args: Record<string, unknown>,
  result: string,
): PrefetchHint[] {
  const hints: PrefetchHint[] = []

  switch (toolId) {
    case "read":
      // Dosya okundu → edit için hazırlık
      hints.push("file-read")
      break

    case "grep":
      // Grep sonucu → dosya listesi çıkar
      const grepFiles = extractFilesFromGrepResult(result)
      if (grepFiles.length > 0) {
        hints.push("grep-result")
      }
      break

    case "glob":
      // Glob sonucu → dosya listesi
      const globFiles = result.split("\n").filter(l => l.trim() && !l.startsWith("..."))
      if (globFiles.length > 0) {
        hints.push("glob-result")
      }
      break

    case "edit":
      // Edit yapıldı → hedef dosyayı tekrar prefetch et (güncel içerik)
      hints.push("edit-target")
      break
  }

  return hints
}

/**
 * Grep sonucundan dosya yollarını çıkarır.
 */
function extractFilesFromGrepResult(result: string): string[] {
  const files = new Set<string>()
  const lines = result.split("\n")

  for (const line of lines) {
    // Grep format: "path/to/file.ts:42: matching line"
    const match = line.match(/^([^:]+):\d+:/)
    if (match?.[1]) {
      files.add(match[1])
    }
  }

  return [...files]
}

/**
 * Global singleton prefetch manager.
 */
export const prefetchManager = new PrefetchManager()
