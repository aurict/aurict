import { createOpenAI } from "@ai-sdk/openai"
import type { LanguageModel } from "ai"
import { ProviderPlugin, type ModelInfo } from "./plugin.js"

export class OpenAIPlugin extends ProviderPlugin {
  readonly id      = "openai"
  readonly name    = "OpenAI"
  readonly sdkType = "openai" as const

  private get client() {
    const key = process.env["OPENAI_API_KEY"]
    return createOpenAI({ ...(key !== undefined ? { apiKey: key } : {}) })
  }

  getModel(modelId: string): LanguageModel {
    return this.client(modelId) as LanguageModel
  }

  defaultModel(): string {
    return "gpt-4o"
  }

  listModels(): ModelInfo[] {
    return [
      { id: "gpt-4o",       name: "GPT-4o",       contextWindow: 128_000, maxOutput: 16_384,  supportsTools: true, supportsVision: true,  supportsThinking: false },
      { id: "gpt-4o-mini",  name: "GPT-4o Mini",  contextWindow: 128_000, maxOutput: 16_384,  supportsTools: true, supportsVision: true,  supportsThinking: false },
      { id: "o3",           name: "o3",            contextWindow: 200_000, maxOutput: 100_000, supportsTools: true, supportsVision: true,  supportsThinking: true  },
      { id: "o3-mini",      name: "o3 Mini",       contextWindow: 200_000, maxOutput: 65_536,  supportsTools: true, supportsVision: false, supportsThinking: true  },
      { id: "o4-mini",      name: "o4 Mini",       contextWindow: 200_000, maxOutput: 100_000, supportsTools: true, supportsVision: true,  supportsThinking: true  },
      { id: "gpt-4-turbo",  name: "GPT-4 Turbo",  contextWindow: 128_000, maxOutput: 4_096,   supportsTools: true, supportsVision: true,  supportsThinking: false },
    ]
  }

  tokenizerEncoding(modelId: string): string {
    if (modelId.startsWith("gpt-4o") || modelId.startsWith("o3") || modelId.startsWith("o4")) {
      return "o200k_base"
    }
    return "cl100k_base"
  }

  // sdkType = "openai" + modelId → plugin.ts default, o-serisi tespiti yapılır
}
