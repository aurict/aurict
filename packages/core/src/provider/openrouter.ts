import { createOpenAI } from "@ai-sdk/openai"
import type { LanguageModel } from "ai"
import { ProviderPlugin, thinkingOptionsForSDK, type ModelInfo, type SDKType } from "./plugin.js"
import { enrichWithReasoning } from "./models-dev.js"

// OpenRouter model ID prefix → underlying SDK type
const PREFIX_SDK: Record<string, SDKType> = {
  "anthropic":   "anthropic",
  "openai":      "openai",
  "google":      "google",
  // diğerleri: openai-compatible (thinking yok veya built-in)
}

export class OpenRouterPlugin extends ProviderPlugin {
  readonly id      = "openrouter"
  readonly name    = "OpenRouter"
  readonly sdkType = "openai-compatible" as const

  private get client() {
    const key = process.env["OPENROUTER_API_KEY"]
    return createOpenAI({
      ...(key !== undefined ? { apiKey: key } : {}),
      baseURL: "https://openrouter.ai/api/v1",
      headers: {
        "HTTP-Referer": "https://github.com/omnicod",
        "X-Title": "OmniCod",
      },
    })
  }

  getModel(modelId: string): LanguageModel {
    return this.client(modelId) as LanguageModel
  }

  defaultModel(): string {
    return "anthropic/claude-sonnet-4-5"
  }

  listModels(): ModelInfo[] {
    // supportsThinking burada yok — listModelsRemote() models.dev'den çeker
    return [
      { id: "anthropic/claude-sonnet-4-5",      name: "Claude Sonnet 4.5",  contextWindow: 200_000,   maxOutput: 64_000, supportsTools: true,  supportsVision: true  },
      { id: "anthropic/claude-opus-4",           name: "Claude Opus 4",      contextWindow: 200_000,   maxOutput: 32_000, supportsTools: true,  supportsVision: true  },
      { id: "openai/gpt-4o",                     name: "GPT-4o",             contextWindow: 128_000,   maxOutput: 16_384, supportsTools: true,  supportsVision: true  },
      { id: "openai/o3-mini",                    name: "o3 Mini",            contextWindow: 200_000,   maxOutput: 65_536, supportsTools: true,  supportsVision: false },
      { id: "google/gemini-2.0-flash",           name: "Gemini 2.0 Flash",   contextWindow: 1_048_576, maxOutput: 8_192,  supportsTools: true,  supportsVision: true  },
      { id: "meta-llama/llama-3.3-70b-instruct", name: "Llama 3.3 70B",      contextWindow: 131_072,   maxOutput: 8_192,  supportsTools: true,  supportsVision: false },
      { id: "deepseek/deepseek-r1",              name: "DeepSeek R1",        contextWindow: 64_000,    maxOutput: 16_000, supportsTools: false, supportsVision: false, supportsThinking: true },
      { id: "mistralai/mistral-large-2411",      name: "Mistral Large",      contextWindow: 128_000,   maxOutput: 4_096,  supportsTools: true,  supportsVision: false },
      { id: "qwen/qwen-2.5-72b-instruct",        name: "Qwen 2.5 72B",       contextWindow: 131_072,   maxOutput: 8_192,  supportsTools: true,  supportsVision: false },
    ]
  }

  // models.dev'den reasoning flag'lerini çek — supportsThinking güncel kalır
  override async listModelsRemote(): Promise<ModelInfo[]> {
    const base = this.listModels()
    return enrichWithReasoning(base)
  }

  // OpenRouter: model prefix'inden underlying SDK tipini belirle
  override buildThinkingOptions(modelId: string, budget: number): Record<string, unknown> | null {
    const prefix = modelId.split("/")[0] ?? ""
    const sdk    = PREFIX_SDK[prefix] ?? "openai-compatible"
    return thinkingOptionsForSDK(sdk, budget, modelId)
  }
}
