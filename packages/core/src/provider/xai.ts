import { createXai } from "@ai-sdk/xai"
import type { LanguageModel } from "ai"
import { ProviderPlugin, type ModelInfo } from "./plugin.js"

export class XAIPlugin extends ProviderPlugin {
  readonly id      = "xai"
  readonly name    = "xAI (Grok)"
  readonly sdkType = "openai-compatible" as const

  private get client() {
    const key = process.env["XAI_API_KEY"]
    return createXai({ ...(key !== undefined ? { apiKey: key } : {}) })
  }

  getModel(modelId: string): LanguageModel {
    return this.client(modelId) as unknown as LanguageModel
  }

  defaultModel(): string {
    return "grok-3-mini"
  }

  listModels(): ModelInfo[] {
    return [
      { id: "grok-3",             name: "Grok 3",             contextWindow: 131_072, maxOutput: 8_192,  supportsTools: true,  supportsVision: false, supportsThinking: false },
      { id: "grok-3-fast",        name: "Grok 3 Fast",        contextWindow: 131_072, maxOutput: 8_192,  supportsTools: true,  supportsVision: false, supportsThinking: false },
      { id: "grok-3-mini",        name: "Grok 3 Mini",        contextWindow: 131_072, maxOutput: 8_192,  supportsTools: true,  supportsVision: false, supportsThinking: true  },
      { id: "grok-3-mini-fast",   name: "Grok 3 Mini Fast",   contextWindow: 131_072, maxOutput: 8_192,  supportsTools: true,  supportsVision: false, supportsThinking: true  },
      { id: "grok-2-vision-1212", name: "Grok 2 Vision",      contextWindow: 32_768,  maxOutput: 8_192,  supportsTools: true,  supportsVision: true,  supportsThinking: false },
    ]
  }

  // xAI'nın reasoning API'si OpenAI o-series ile aynı format değil
  // SDK openai-compatible → thinking null döndürür, built-in think akışında gelir
  buildThinkingOptions(_modelId: string, _budget: number): Record<string, unknown> | null {
    return null
  }
}
