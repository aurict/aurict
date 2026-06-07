import { createAnthropic } from "@ai-sdk/anthropic"
import type { LanguageModel } from "ai"
import { ProviderPlugin, type ModelInfo } from "./plugin.js"

export class AnthropicPlugin extends ProviderPlugin {
  readonly id      = "anthropic"
  readonly name    = "Anthropic"
  readonly sdkType = "anthropic" as const

  private get client() {
    const key = process.env["ANTHROPIC_API_KEY"]
    return createAnthropic({ ...(key !== undefined ? { apiKey: key } : {}) })
  }

  getModel(modelId: string): LanguageModel {
    return this.client(modelId) as LanguageModel
  }

  defaultModel(): string {
    return "claude-sonnet-4-6"
  }

  listModels(): ModelInfo[] {
    return [
      { id: "claude-opus-4-8",          name: "Claude Opus 4.8",    contextWindow: 200_000, maxOutput: 32_000,  supportsTools: true, supportsVision: true, supportsThinking: true },
      { id: "claude-sonnet-4-6",        name: "Claude Sonnet 4.6",  contextWindow: 200_000, maxOutput: 64_000,  supportsTools: true, supportsVision: true, supportsThinking: true },
      { id: "claude-haiku-4-5-20251001",name: "Claude Haiku 4.5",  contextWindow: 200_000, maxOutput: 16_000, supportsTools: true, supportsVision: true, supportsThinking: false },
    ]
  }

  // sdkType = "anthropic" → plugin.ts default yeterli, override gerekmez
}
