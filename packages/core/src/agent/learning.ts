import type { AgentType } from "./protocol.js"

/**
 * Agent Specialization Learning
 * 
 * Her agent tipinin performansını takip eder:
 * - Görev tamamlama oranı
 * - Ortalama tool call sayısı
 * - Hata oranı
 * 
 * Düşük performanslı agent'lara skill önerisi yapar.
 */

export interface AgentPerformance {
  agentType: AgentType
  totalTasks: number
  successfulTasks: number
  failedTasks: number
  avgToolCalls: number
  avgDuration: number
  effectivenessScore: number  // 0-100
  lastUsed: number
}

export interface AgentLearningConfig {
  enabled: boolean
  minTasksForAnalysis: number  // Kaç görevden sonra analiz yap
  lowPerformanceThreshold: number  // Altında skill önerisi yap
}

const DEFAULT_CONFIG: AgentLearningConfig = {
  enabled: true,
  minTasksForAnalysis: 5,
  lowPerformanceThreshold: 60,
}

// Agent tipine göre önerilecek skill'ler
const SKILL_SUGGESTIONS: Record<AgentType, string[]> = {
  coordinator: ["blueprint", "clean-architecture"],
  explore: ["code-review-patterns", "documentation-patterns"],
  code: ["testing-patterns", "debugging-strategies"],
  review: ["code-review-patterns", "security-review"],
  test: ["testing-patterns", "debugging-strategies"],
  docs: ["documentation-patterns", "api-design"],
  performance: ["web-performance", "bundle-optimization"],
  analytics: ["data-pipeline-patterns"],
  security: ["security-review", "authentication-patterns"],
  debug: ["debugging-strategies", "testing-patterns"],
  refactor: ["clean-architecture", "technical-debt"],
  devops: ["docker-patterns", "ci-cd-patterns"],
  design: ["css-architecture", "responsive-design"],
  data: ["data-pipeline-patterns", "etl-patterns"],
  critic: ["code-review-patterns"],
}

class AgentLearnerImpl {
  private performances = new Map<AgentType, AgentPerformance>()
  private config: AgentLearningConfig

  constructor(config: Partial<AgentLearningConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Agent görev sonucunu kaydeder.
   */
  recordTask(
    agentType: AgentType,
    success: boolean,
    toolCalls: number,
    durationMs: number,
  ): void {
    let perf = this.performances.get(agentType)
    
    if (!perf) {
      perf = {
        agentType,
        totalTasks: 0,
        successfulTasks: 0,
        failedTasks: 0,
        avgToolCalls: 0,
        avgDuration: 0,
        effectivenessScore: 50,
        lastUsed: 0,
      }
    }

    perf.totalTasks++
    if (success) {
      perf.successfulTasks++
    } else {
      perf.failedTasks++
    }

    // Moving average
    perf.avgToolCalls = (perf.avgToolCalls * (perf.totalTasks - 1) + toolCalls) / perf.totalTasks
    perf.avgDuration = (perf.avgDuration * (perf.totalTasks - 1) + durationMs) / perf.totalTasks
    perf.lastUsed = Date.now()

    // Effectiveness score hesapla
    const successRate = perf.successfulTasks / perf.totalTasks
    perf.effectivenessScore = Math.round(successRate * 100)

    this.performances.set(agentType, perf)
  }

  /**
   * Agent performansını döner.
   */
  getPerformance(agentType: AgentType): AgentPerformance | null {
    return this.performances.get(agentType) ?? null
  }

  /**
   * Tüm agent performanslarını döner.
   */
  getAllPerformances(): AgentPerformance[] {
    return [...this.performances.values()]
  }

  /**
   * Düşük performanslı agent'ları tespit eder.
   */
  getLowPerformers(): AgentPerformance[] {
    if (!this.config.enabled) return []

    return this.getAllPerformances().filter(perf => {
      // Yeterli görev tamamlamış mı?
      if (perf.totalTasks < this.config.minTasksForAnalysis) return false
      // Performans eşiğinin altında mı?
      return perf.effectivenessScore < this.config.lowPerformanceThreshold
    })
  }

  /**
   * Agent için skill önerisi döner.
   */
  getSuggestions(agentType: AgentType): string[] {
    const perf = this.performances.get(agentType)
    if (!perf) return []

    // Yeterli görev tamamlamış mı?
    if (perf.totalTasks < this.config.minTasksForAnalysis) return []

    // Performans düşük mü?
    if (perf.effectivenessScore >= this.config.lowPerformanceThreshold) return []

    return SKILL_SUGGESTIONS[agentType] ?? []
  }

  /**
   * Performans raporunu döner.
   */
  getReport(): string {
    const perfs = this.getAllPerformances()
    if (perfs.length === 0) return "No agent performance data yet."

    const lines = [
      "## Agent Performance Report",
      "",
      "| Agent Type | Tasks | Success Rate | Avg Tools | Score |",
      "|------------|-------|--------------|-----------|-------|",
    ]

    for (const perf of perfs.sort((a, b) => b.effectivenessScore - a.effectivenessScore)) {
      const successRate = perf.totalTasks > 0
        ? `${Math.round((perf.successfulTasks / perf.totalTasks) * 100)}%`
        : "N/A"
      
      lines.push(
        `| ${perf.agentType} | ${perf.totalTasks} | ${successRate} | ${perf.avgToolCalls.toFixed(1)} | ${perf.effectivenessScore} |`
      )
    }

    // Düşük performanslılar için öneriler
    const lowPerformers = this.getLowPerformers()
    if (lowPerformers.length > 0) {
      lines.push("")
      lines.push("### Improvement Suggestions")
      lines.push("")
      
      for (const perf of lowPerformers) {
        const suggestions = this.getSuggestions(perf.agentType)
        if (suggestions.length > 0) {
          lines.push(`- **${perf.agentType}** (score: ${perf.effectivenessScore}): Consider loading ${suggestions.join(", ")}`)
        }
      }
    }

    return lines.join("\n")
  }

  /**
   * Config'i günceller.
   */
  updateConfig(config: Partial<AgentLearningConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Performans verilerini sıfırlar.
   */
  reset(): void {
    this.performances.clear()
  }
}

export const agentLearner = new AgentLearnerImpl()

export function createAgentLearner(config?: Partial<AgentLearningConfig>): AgentLearnerImpl {
  return new AgentLearnerImpl(config)
}
