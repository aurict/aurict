import { createAzure } from "@ai-sdk/azure"
import type { LanguageModel } from "ai"
import { ProviderPlugin, type ModelInfo } from "./plugin.js"

export class AzurePlugin extends ProviderPlugin {
  readonly id      = "azure"
  readonly name    = "Azure OpenAI"
  readonly sdkType = "openai" as const

  private get client() {
    return createAzure({
      apiKey:   process.env["AZURE_OPENAI_API_KEY"]  ?? "",
      baseURL:  process.env["AZURE_OPENAI_ENDPOINT"] ?? "",
    })
  }

  // Azure'da model ID = deployment name (kullanıcının Azure'da oluşturduğu isim)
  getModel(modelId: string): LanguageModel {
    return this.client(modelId) as unknown as LanguageModel
  }

  defaultModel(): string {
    return process.env["AZURE_OPENAI_DEPLOYMENT"] ?? "gpt-4o"
  }

  listModels(): ModelInfo[] {
    // Azure'da deployment adları kullanıcıya özeldir; yaygın isimler:
    return [
      { id: "gpt-4o",       name: "GPT-4o (deployment)",       contextWindow: 128_000, maxOutput: 16_384, supportsTools: true,  supportsVision: true,  supportsThinking: false },
      { id: "gpt-4o-mini",  name: "GPT-4o Mini (deployment)",  contextWindow: 128_000, maxOutput: 16_384, supportsTools: true,  supportsVision: true,  supportsThinking: false },
      { id: "o3-mini",      name: "o3-mini (deployment)",       contextWindow: 200_000, maxOutput: 100_000, supportsTools: true, supportsVision: false, supportsThinking: true  },
      { id: "o1",           name: "o1 (deployment)",            contextWindow: 200_000, maxOutput: 100_000, supportsTools: true, supportsVision: true,  supportsThinking: true  },
      { id: "gpt-4",        name: "GPT-4 (deployment)",         contextWindow: 8_192,   maxOutput: 4_096,  supportsTools: true,  supportsVision: false, supportsThinking: false },
    ]
  }
}
