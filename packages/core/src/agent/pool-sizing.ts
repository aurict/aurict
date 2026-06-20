/**
 * Dynamic Worker Pool Sizing
 * 
 * Proje boyutuna ve görev karmaşıklığına göre optimal worker sayısını hesaplar.
 * 
 * Küçük projeler (< 20 dosya) → 2 worker
 * Orta projeler (20-100 dosya) → 4 worker
 * Büyük projeler (100-500 dosya) → 6 worker
 * Çok büyük projeler (> 500 dosya) → 8 worker
 */

export interface PoolSizingConfig {
  smallThreshold: number   // Dosya sayısı
  mediumThreshold: number
  largeThreshold: number
  smallWorkers: number
  mediumWorkers: number
  largeWorkers: number
  hugeWorkers: number
  maxWorkers: number       // Absolute max
}

const DEFAULT_POOL_CONFIG: PoolSizingConfig = {
  smallThreshold: 20,
  mediumThreshold: 100,
  largeThreshold: 500,
  smallWorkers: 2,
  mediumWorkers: 4,
  largeWorkers: 6,
  hugeWorkers: 8,
  maxWorkers: 12,
}

/**
 * Proje boyutuna göre optimal worker sayısını hesaplar.
 */
export function computeOptimalWorkers(
  fileCount: number,
  config: Partial<PoolSizingConfig> = {},
): number {
  const cfg = { ...DEFAULT_POOL_CONFIG, ...config }

  let workers: number

  if (fileCount < cfg.smallThreshold) {
    workers = cfg.smallWorkers
  } else if (fileCount < cfg.mediumThreshold) {
    workers = cfg.mediumWorkers
  } else if (fileCount < cfg.largeThreshold) {
    workers = cfg.largeWorkers
  } else {
    workers = cfg.hugeWorkers
  }

  // Max ile sınırla
  return Math.min(workers, cfg.maxWorkers)
}

/**
 * Görev karmaşıklığına göre worker sayısını ayarla.
 */
export function adjustForComplexity(
  baseWorkers: number,
  complexity: "simple" | "moderate" | "complex",
): number {
  switch (complexity) {
    case "simple":
      return Math.max(1, Math.floor(baseWorkers * 0.5))
    case "moderate":
      return baseWorkers
    case "complex":
      return Math.min(baseWorkers * 2, 12)
  }
}

/**
 * Pool sizing raporunu döner.
 */
export function getPoolSizingReport(fileCount: number): {
  fileCount: number
  recommendedWorkers: number
  category: "small" | "medium" | "large" | "huge"
} {
  const cfg = DEFAULT_POOL_CONFIG
  let category: "small" | "medium" | "large" | "huge"

  if (fileCount < cfg.smallThreshold) {
    category = "small"
  } else if (fileCount < cfg.mediumThreshold) {
    category = "medium"
  } else if (fileCount < cfg.largeThreshold) {
    category = "large"
  } else {
    category = "huge"
  }

  return {
    fileCount,
    recommendedWorkers: computeOptimalWorkers(fileCount),
    category,
  }
}
