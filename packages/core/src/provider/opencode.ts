import { createOpenAI } from "@ai-sdk/openai"
import type { LanguageModel } from "ai"
import { ProviderPlugin, thinkingOptionsForSDK, type ModelInfo } from "./plugin.js"
import { getCachedModels } from "./models-fetch.js"

// opencode.ai Zen/Go — OpenAI-uyumlu endpoint, Anthropic modelleri proxy'ler
export class OpenCodePlugin extends ProviderPlugin {
  readonly id      = "opencode"
  readonly name    = "OpenCode (Zen)"
  readonly sdkType = "openai-compatible" as const

  private get client() {
    const key = process.env["OPENCODE_API_KEY"]
    return createOpenAI({
      ...(key !== undefined ? { apiKey: key } : {}),
      baseURL: "https://opencode.ai/zen/v1",
    })
  }

  getModel(modelId: string): LanguageModel {
    return this.client(modelId) as LanguageModel
  }

  defaultModel(): string {
    return "claude-sonnet-4-5"
  }

  listModels(): ModelInfo[] {
    return [
      { id: "claude-opus-4-8",   name: "Claude Opus 4.8",    contextWindow: 200_000,   maxOutput: 32_000,  supportsTools: true, supportsVision: true, supportsThinking: true  },
      { id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6",  contextWindow: 200_000,   maxOutput: 64_000,  supportsTools: true, supportsVision: true, supportsThinking: true  },
      { id: "claude-haiku-4-5",  name: "Claude Haiku 4.5",   contextWindow: 200_000,   maxOutput: 16_000,  supportsTools: true, supportsVision: true, supportsThinking: false },
      { id: "gpt-5.4",           name: "GPT-5.4",            contextWindow: 128_000,   maxOutput: 16_384,  supportsTools: true, supportsVision: true, supportsThinking: false },
      { id: "gpt-5.4-mini",      name: "GPT-5.4 Mini",       contextWindow: 128_000,   maxOutput: 16_384,  supportsTools: true, supportsVision: true, supportsThinking: false },
      { id: "gemini-3-flash",    name: "Gemini 3 Flash",     contextWindow: 1_048_576, maxOutput: 8_192,   supportsTools: true, supportsVision: true, supportsThinking: false },
    ]
  }

  async listModelsRemote(): Promise<ModelInfo[]> {
    const apiKey = process.env["OPENCODE_API_KEY"] ?? ""
    return getCachedModels("opencode", "https://opencode.ai/zen/v1/models", apiKey)
  }

  // OpenCode proxy'si Anthropic modelleri yönlendiriyor — anthropic format kullan
  override buildThinkingOptions(modelId: string, budget: number): Record<string, unknown> | null {
    const isAnthropic = modelId.startsWith("claude") || modelId.includes("anthropic")
    const isOpenAI    = modelId.startsWith("gpt") || modelId.startsWith("o") || modelId.includes("openai")
    if (isAnthropic) return thinkingOptionsForSDK("anthropic", budget, modelId)
    if (isOpenAI)    return thinkingOptionsForSDK("openai",    budget, modelId)
    return null
  }
}
