import { join } from "node:path"
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs"

interface SkillScore {
  injectCount:   number
  successCount:  number  // verification geçen session sayısı
  lastUsed:      number  // timestamp
}

type ScoreMap = Record<string, SkillScore>

class SkillScoreStore {
  private cache = new Map<string, ScoreMap>()

  private filePath(workdir: string): string {
    return join(workdir, ".aurict", "skill-scores.json")
  }

  private load(workdir: string): ScoreMap {
    const hit = this.cache.get(workdir)
    if (hit) return hit
    try {
      const data = JSON.parse(readFileSync(this.filePath(workdir), "utf8")) as ScoreMap
      this.cache.set(workdir, data)
      return data
    } catch { return {} }
  }

  private save(workdir: string, scores: ScoreMap): void {
    try {
      mkdirSync(join(workdir, ".aurict"), { recursive: true })
      writeFileSync(this.filePath(workdir), JSON.stringify(scores, null, 2))
      this.cache.set(workdir, scores)
    } catch { /* persistence optional */ }
  }

  /** Skill kullanıldığında çağrılır */
  recordInject(workdir: string, skillIds: string[]): void {
    if (skillIds.length === 0) return
    const scores = this.load(workdir)
    for (const id of skillIds) {
      const s = scores[id] ?? { injectCount: 0, successCount: 0, lastUsed: 0 }
      scores[id] = { ...s, injectCount: s.injectCount + 1, lastUsed: Date.now() }
    }
    this.save(workdir, scores)
  }

  /** Session başarıyla tamamlandığında çağrılır */
  recordSuccess(workdir: string, skillIds: string[]): void {
    if (skillIds.length === 0) return
    const scores = this.load(workdir)
    for (const id of skillIds) {
      const s = scores[id] ?? { injectCount: 0, successCount: 0, lastUsed: 0 }
      scores[id] = { ...s, successCount: s.successCount + 1 }
    }
    this.save(workdir, scores)
  }

  /**
   * Priority boost: -1 to +4
   * - 5 inject'ten az: 0 (yeterli veri yok)
   * - Success rate >= 0.8: +4
   * - Usage frequency (en sık kullanılan): +2
   * - Az kullanılan: 0
   * - Success rate < 0.2: -1
   */
  getBoost(workdir: string, skillId: string): number {
    const scores = this.load(workdir)
    const s = scores[skillId]
    if (!s || s.injectCount < 5) return 0

    const successRate = s.successCount / s.injectCount
    let boost = 0

    if (successRate >= 0.8)       boost += 3
    else if (successRate >= 0.6)  boost += 2
    else if (successRate >= 0.4)  boost += 1
    else if (successRate < 0.15)  boost -= 1

    // Sık kullanım bonusu (bu projede gerçekten çok lazım olan skill)
    if (s.injectCount >= 20)      boost += 1

    return boost
  }

  /** Tüm proje skorlarını döndür — /skill-scores debug komutu için */
  getAll(workdir: string): Record<string, SkillScore & { successRate: number; boost: number }> {
    const scores = this.load(workdir)
    const result: ReturnType<SkillScoreStore["getAll"]> = {}
    for (const [id, s] of Object.entries(scores)) {
      result[id] = {
        ...s,
        successRate: s.injectCount > 0 ? +(s.successCount / s.injectCount).toFixed(2) : 0,
        boost: this.getBoost(workdir, id),
      }
    }
    return result
  }
}

export const skillScoreStore = new SkillScoreStore()
