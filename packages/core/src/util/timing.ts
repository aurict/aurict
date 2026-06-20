/**
 * Lightweight performance measurement utility.
 * 
 * Kullanım:
 *   const timer = new Timer()
 *   timer.start("tool-exec")
 *   // ... iş yap ...
 *   const ms = timer.stop("tool-exec")
 *   console.log(timer.getMeasurements())  // { "tool-exec": 42.5 }
 */

interface TimerEntry {
  startTime: number
  totalMs:   number
  count:     number
}

export class Timer {
  private entries = new Map<string, TimerEntry>()

  /** Label'lı zamanlayıcıyı başlat. Zaten çalışıyorsa sadece startTime'ı güncelle (birikmiş veriler korunur). */
  start(label: string): void {
    const existing = this.entries.get(label)
    if (existing) {
      existing.startTime = performance.now()
    } else {
      this.entries.set(label, {
        startTime: performance.now(),
        totalMs:   0,
        count:     0,
      })
    }
  }

  /** Label'lı zamanlayıcıyı durdur, geçen ms'i döner. */
  stop(label: string): number {
    const entry = this.entries.get(label)
    if (!entry) return 0

    const elapsed = performance.now() - entry.startTime
    entry.totalMs += elapsed
    entry.count++

    return elapsed
  }

  /** Label'ın şu anda çalışıp çalışmadığını kontrol et. */
  isRunning(label: string): boolean {
    const entry = this.entries.get(label)
    return entry !== undefined && entry.startTime > 0
  }

  /** Toplam ölçülen süreyi döner (tüm start/stop döngülerinin toplamı). */
  getTotal(label: string): number {
    return this.entries.get(label)?.totalMs ?? 0
  }

  /** Kaç kez start/stop yapıldığını döner. */
  getCount(label: string): number {
    return this.entries.get(label)?.count ?? 0
  }

  /** Ortalama süreyi döner. */
  getAverage(label: string): number {
    const entry = this.entries.get(label)
    if (!entry || entry.count === 0) return 0
    return entry.totalMs / entry.count
  }

  /** Tüm ölçümleri { label: avgMs } formatında döner. */
  getMeasurements(): Record<string, number> {
    const result: Record<string, number> = {}
    for (const [label, entry] of this.entries) {
      result[label] = entry.count > 0 ? entry.totalMs / entry.count : 0
    }
    return result
  }

  /** Tüm ölçümleri detaylı döner. */
  getDetailed(): Record<string, { totalMs: number; count: number; avgMs: number }> {
    const result: Record<string, { totalMs: number; count: number; avgMs: number }> = {}
    for (const [label, entry] of this.entries) {
      result[label] = {
        totalMs: entry.totalMs,
        count:   entry.count,
        avgMs:   entry.count > 0 ? entry.totalMs / entry.count : 0,
      }
    }
    return result
  }

  /** Tek bir label'ı sıfırla. */
  reset(label: string): void {
    this.entries.delete(label)
  }

  /** Tüm ölçümleri sıfırla. */
  resetAll(): void {
    this.entries.clear()
  }

  /** Tüm label'ları listele. */
  labels(): string[] {
    return [...this.entries.keys()]
  }
}

/**
 * Tek ölçüm için shorthand.
 * 
 *   const ms = await measure("db-query", () => db.query(sql))
 */
export async function measure<T>(label: string, fn: () => Promise<T>): Promise<{ result: T; ms: number }> {
  const start = performance.now()
  const result = await fn()
  const ms = performance.now() - start
  return { result, ms }
}

/**
 * Senkron ölçüm shorthand.
 */
export function measureSync<T>(label: string, fn: () => T): { result: T; ms: number } {
  const start = performance.now()
  const result = fn()
  const ms = performance.now() - start
  return { result, ms }
}

/**
 * Global singleton timer — uygulama genelinde kullanım için.
 */
export const globalTimer = new Timer()
