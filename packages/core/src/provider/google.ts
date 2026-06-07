import { createGoogleGenerativeAI } from "@ai-sdk/google"
import type { LanguageModel } from "ai"
import { ProviderPlugin, type ModelInfo } from "./plugin.js"

export class GooglePlugin extends ProviderPlugin {
  readonly id      = "google"
  readonly name    = "Google"
  readonly sdkType = "google" as const

  private get client() {
    const key = process.env["GOOGLE_GENERATIVE_AI_API_KEY"] ?? process.env["GOOGLE_API_KEY"]
    return createGoogleGenerativeAI({ ...(key !== undefined ? { apiKey: key } : {}) })
  }

  getModel(modelId: string): LanguageModel {
    return this.client(modelId) as LanguageModel
  }

  defaultModel(): string {
    return "gemini-2.0-flash"
  }

  listModels(): ModelInfo[] {
    return [
      { id: "gemini-2.0-flash",          name: "Gemini 2.0 Flash",         contextWindow: 1_048_576, maxOutput: 8_192, supportsTools: true, supportsVision: true, supportsThinking: false },
      { id: "gemini-2.0-flash-thinking", name: "Gemini 2.0 Flash Thinking", contextWindow: 1_048_576, maxOutput: 8_192, supportsTools: true, supportsVision: true, supportsThinking: true  },
      { id: "gemini-2.5-pro",            name: "Gemini 2.5 Pro",            contextWindow: 1_048_576, maxOutput: 65_536,supportsTools: true, supportsVision: true, supportsThinking: true  },
      { id: "gemini-2.5-flash",          name: "Gemini 2.5 Flash",          contextWindow: 1_048_576, maxOutput: 65_536,supportsTools: true, supportsVision: true, supportsThinking: true  },
      { id: "gemini-1.5-pro",            name: "Gemini 1.5 Pro",            contextWindow: 2_097_152, maxOutput: 8_192, supportsTools: true, supportsVision: true, supportsThinking: false },
      { id: "gemini-1.5-flash",          name: "Gemini 1.5 Flash",          contextWindow: 1_048_576, maxOutput: 8_192, supportsTools: true, supportsVision: true, supportsThinking: false },
    ]
  }

  // sdkType = "google" → plugin.ts default, thinkingConfig gönderilir
  // Hangi model thinking destekler? supportsThinking flag'i veya models.dev reasoning alanı
}
