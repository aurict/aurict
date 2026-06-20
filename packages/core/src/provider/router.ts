import { ProviderRegistry } from "./registry.js"
import type { ModelInfo } from "./plugin.js"

/**
 * Cost-Aware Model Router
 * 
 * Task complexity ve bütçe durumuna göre otomatik model seçimi yapar.
 * Basit görevlerde ucuz modeller, karmaşık görevlerde güçlü modeller kullanır.
 */

// Model tier'ları — maliyet bazlı gruplandırma
export type ModelTier = "economy" | "standard" | "premium"

interface ModelTierConfig {
  tier: ModelTier
  providers: string[]
  models: string[]
  description: string
}

// Tier bazlı model havuzları
const TIER_MODELS: Record<ModelTier, ModelTierConfig> = {
  economy: {
    tier: "economy",
    providers: ["anthropic", "openai", "google"],
    models: [
      "claude-haiku-4-5-20251001",  // Anthropic ucuz
      "gpt-4o-mini",                 // OpenAI ucuz
      "gemini-2.0-flash",            // Google ucuz
    ],
    description: "Basit görevler için hızlı ve ucuz modeller",
  },
  standard: {
    tier: "standard",
    providers: ["anthropic", "openai", "google"],
    models: [
      "claude-sonnet-4-6",           // Anthropic orta
      "gpt-4o",                      // OpenAI orta
      "gemini-2.5-flash",            // Google orta
    ],
    description: "Dengeli performans/fiyat oranı",
  },
  premium: {
    tier: "premium",
    providers: ["anthropic", "openai", "google"],
    models: [
      "claude-opus-4-8",             // Anthropic güçlü
      "o3",                          // OpenAI güçlü
      "gemini-2.5-pro",              // Google güçlü
    ],
    description: "Karmaşık görevler için en güçlü modeller",
  },
}

// Task complexity seviyeleri
export type TaskComplexity = "trivial" | "simple" | "moderate" | "complex"

export interface RoutingDecision {
  provider: string
  model: string
  tier: ModelTier
  reason: string
}

export interface RouterConfig {
  enabled: boolean
  // Bütçe limiti (USD) — altında economy kullan
  budgetThresholdUsd: number
  // Session başına max maliyet
  maxSessionCostUsd: number
}

export const DEFAULT_ROUTER_CONFIG: RouterConfig = {
  enabled: false,
  budgetThresholdUsd: 1.0,
  maxSessionCostUsd: 10.0,
}

export class ModelRouter {
  private config: RouterConfig

  constructor(config: Partial<RouterConfig> = {}) {
    this.config = { ...DEFAULT_ROUTER_CONFIG, ...config }
  }

  /**
   * Task complexity'yi tespit et.
   * 
   * @param messageCount Mesaj sayısı
   * @param toolCallCount Tool çağrı sayısı
   * @param hasAttachments Dosya eki var mı
   * @param lastMessageLength Son mesaj uzunluğu
   */
  detectComplexity(
    messageCount: number,
    toolCallCount: number,
    hasAttachments: boolean,
    lastMessageLength: number,
  ): TaskComplexity {
    // Çok kısa mesaj + tool yok + ek yok → trivial
    if (lastMessageLength < 100 && toolCallCount === 0 && !hasAttachments) {
      return "trivial"
    }

    // Attachments varsa en az moderate
    if (hasAttachments && toolCallCount < 10) {
      return "moderate"
    }

    // Kısa mesaj + az tool → simple
    if (lastMessageLength < 500 && toolCallCount < 3) {
      return "simple"
    }

    // Orta uzunluk + orta tool → moderate
    if (lastMessageLength < 2000 && toolCallCount < 10) {
      return "moderate"
    }

    // Uzun mesaj + çok tool → complex
    return "complex"
  }

  /**
   * Complexity → Tier mapping.
   */
  complexityToTier(complexity: TaskComplexity): ModelTier {
    switch (complexity) {
      case "trivial":
        return "economy"
      case "simple":
        return "economy"
      case "moderate":
        return "standard"
      case "complex":
        return "premium"
    }
  }

  /**
   * Verilen tier için mevcut provider/model seç.
   * API key'i olan provider'lar arasından ilk uygununu döner.
   */
  selectModel(tier: ModelTier): RoutingDecision | null {
    const tierConfig = TIER_MODELS[tier]
    if (!tierConfig) return null

    const available = ProviderRegistry.available()
    const availableIds = new Set(
      available.filter(p => p.hasKey).map(p => p.id)
    )

    // Tier'daki modelleri kontrol et
    for (const model of tierConfig.models) {
      // Hangi provider bu modeli sağlıyor?
      for (const providerId of tierConfig.providers) {
        if (!availableIds.has(providerId)) continue

        const plugin = ProviderRegistry.get(providerId)
        const models = plugin.listModels()
        const modelInfo = models.find(m => m.id === model)

        if (modelInfo) {
          return {
            provider: providerId,
            model: model,
            tier,
            reason: `${tier} tier — ${tierConfig.description}`,
          }
        }
      }
    }

    return null
  }

  /**
   * Task'a göre otomatik model seç.
   * 
   * @param complexity Task complexity
   * @param currentSessionCostUsd Session'da harcanan toplam (USD)
   * @returns Routing decision veya null (routing devre dışı)
   */
  route(
    complexity: TaskComplexity,
    currentSessionCostUsd: number = 0,
  ): RoutingDecision | null {
    if (!this.config.enabled) return null

    // Bütçe aşımı kontrolü — economy'ye zorla
    if (currentSessionCostUsd >= this.config.budgetThresholdUsd) {
      const economy = this.selectModel("economy")
      if (economy) {
        return {
          ...economy,
          reason: `Budget threshold reached ($${currentSessionCostUsd.toFixed(2)}) — using economy tier`,
        }
      }
    }

    // Normal routing
    const tier = this.complexityToTier(complexity)
    return this.selectModel(tier)
  }

  /**
   * Mevcut model'in tier'ını belirle.
   */
  getModelTier(modelId: string): ModelTier {
    for (const tier of ["economy", "standard", "premium"] as ModelTier[]) {
      const tierConfig = TIER_MODELS[tier]
      if (tierConfig.models.includes(modelId)) {
        return tier
      }
    }
    return "standard"  // Bilinmeyen modeller standard sayılır
  }

  /**
   * Tüm tier'ları ve modelleri döndür.
   */
  getTierInfo(): Record<ModelTier, ModelTierConfig> {
    return { ...TIER_MODELS }
  }

  /**
   * Config'i güncelle.
   */
  updateConfig(config: Partial<RouterConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Mevcut config'i döndür.
   */
  getConfig(): RouterConfig {
    return { ...this.config }
  }
}

/**
 * Singleton router instance.
 */
export let modelRouter = new ModelRouter()

/**
 * Config'den router ayarlarını yükle.
 */
export function loadRouterFromConfig(config: Partial<RouterConfig>): void {
  modelRouter = new ModelRouter(config)
}
