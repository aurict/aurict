import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock"
import type { LanguageModel } from "ai"
import { ProviderPlugin, type ModelInfo } from "./plugin.js"

export class BedrockPlugin extends ProviderPlugin {
  readonly id      = "bedrock"
  readonly name    = "AWS Bedrock"
  // Bedrock Anthropic modelleri Anthropic format kullanır
  readonly sdkType = "anthropic" as const

  private get client() {
    return createAmazonBedrock({
      region:          process.env["AWS_REGION"]             ?? "us-east-1",
      accessKeyId:     process.env["AWS_ACCESS_KEY_ID"]      ?? "",
      secretAccessKey: process.env["AWS_SECRET_ACCESS_KEY"]  ?? "",
      ...(process.env["AWS_SESSION_TOKEN"] ? { sessionToken: process.env["AWS_SESSION_TOKEN"] } : {}),
    })
  }

  getModel(modelId: string): LanguageModel {
    return this.client(modelId) as unknown as LanguageModel
  }

  defaultModel(): string {
    return "anthropic.claude-3-5-sonnet-20241022-v2:0"
  }

  listModels(): ModelInfo[] {
    return [
      // Anthropic on Bedrock
      { id: "anthropic.claude-opus-4-20250514",            name: "Claude Opus 4 (Bedrock)",         contextWindow: 200_000, maxOutput: 32_000,  supportsTools: true, supportsVision: true,  supportsThinking: true  },
      { id: "anthropic.claude-3-7-sonnet-20250219-v1:0",   name: "Claude 3.7 Sonnet (Bedrock)",     contextWindow: 200_000, maxOutput: 64_000,  supportsTools: true, supportsVision: true,  supportsThinking: true  },
      { id: "anthropic.claude-3-5-sonnet-20241022-v2:0",   name: "Claude 3.5 Sonnet v2 (Bedrock)",  contextWindow: 200_000, maxOutput: 8_192,   supportsTools: true, supportsVision: true,  supportsThinking: false },
      { id: "anthropic.claude-3-5-haiku-20241022-v1:0",    name: "Claude 3.5 Haiku (Bedrock)",      contextWindow: 200_000, maxOutput: 8_192,   supportsTools: true, supportsVision: true,  supportsThinking: false },
      // Amazon Titan
      { id: "amazon.titan-text-premier-v1:0",              name: "Amazon Titan Premier",            contextWindow: 32_000,  maxOutput: 4_096,   supportsTools: false, supportsVision: false, supportsThinking: false },
      // Meta Llama
      { id: "meta.llama3-3-70b-instruct-v1:0",             name: "Llama 3.3 70B (Bedrock)",         contextWindow: 128_000, maxOutput: 8_192,   supportsTools: true,  supportsVision: false, supportsThinking: false },
      // Mistral via Bedrock
      { id: "mistral.mistral-large-2402-v1:0",             name: "Mistral Large (Bedrock)",         contextWindow: 32_000,  maxOutput: 8_192,   supportsTools: true,  supportsVision: false, supportsThinking: false },
      // Cross-region inference prefix (us. / eu.)
      { id: "us.anthropic.claude-opus-4-20250514",         name: "Claude Opus 4 (US cross-region)", contextWindow: 200_000, maxOutput: 32_000,  supportsTools: true, supportsVision: true,  supportsThinking: true  },
    ]
  }

  // Bedrock Anthropic thinking, Anthropic SDK formatıyla aynı
  buildThinkingOptions(modelId: string, budget: number): Record<string, unknown> | null {
    const base = modelId.split(":")[0] ?? modelId
    const supportsThink = base.includes("claude-3-7") || base.includes("claude-opus-4") || base.includes("claude-sonnet-4")
    if (!supportsThink) return null
    return { anthropic: { thinking: { type: "enabled", budgetTokens: budget } } }
  }
}
