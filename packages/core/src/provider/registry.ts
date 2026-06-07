import type { ProviderPlugin } from "./plugin.js"
import { AnthropicPlugin } from "./anthropic.js"
import { OpenAIPlugin } from "./openai.js"
import { OpenRouterPlugin } from "./openrouter.js"
import { GooglePlugin } from "./google.js"
import { OpenCodePlugin } from "./opencode.js"
import { OllamaPlugin }   from "./ollama.js"
import { XAIPlugin }      from "./xai.js"
import { AzurePlugin }    from "./azure.js"
import { BedrockPlugin }  from "./bedrock.js"

const plugins = new Map<string, ProviderPlugin>()

plugins.set("anthropic",  new AnthropicPlugin())
plugins.set("openai",     new OpenAIPlugin())
plugins.set("openrouter", new OpenRouterPlugin())
plugins.set("google",     new GooglePlugin())
plugins.set("opencode",   new OpenCodePlugin())
plugins.set("ollama",     new OllamaPlugin())
plugins.set("xai",        new XAIPlugin())
plugins.set("azure",      new AzurePlugin())
plugins.set("bedrock",    new BedrockPlugin())

export const ProviderRegistry = {
  get(id: string): ProviderPlugin {
    const plugin = plugins.get(id)
    if (!plugin) throw new Error(`Provider not registered: "${id}"`)
    return plugin
  },

  register(plugin: ProviderPlugin): void {
    plugins.set(plugin.id, plugin)
  },

  list(): ProviderPlugin[] {
    return [...plugins.values()]
  },

  has(id: string): boolean {
    return plugins.has(id)
  },

  // Hangi API key'in set edildiğine göre varsayılan provider
  detectDefault(): string {
    const override = process.env["OMNICOD_PROVIDER"]
    if (override && plugins.has(override)) return override

    if (process.env["ANTHROPIC_API_KEY"])                                                              return "anthropic"
    if (process.env["OPENCODE_API_KEY"])                                                               return "opencode"
    if (process.env["OPENAI_API_KEY"])                                                                 return "openai"
    if (process.env["OPENROUTER_API_KEY"])                                                             return "openrouter"
    if (process.env["GOOGLE_GENERATIVE_AI_API_KEY"] ?? process.env["GOOGLE_API_KEY"])                 return "google"
    if (process.env["XAI_API_KEY"])                                                                    return "xai"
    if (process.env["AZURE_OPENAI_API_KEY"] && process.env["AZURE_OPENAI_ENDPOINT"])                  return "azure"
    if (process.env["AWS_ACCESS_KEY_ID"] && process.env["AWS_SECRET_ACCESS_KEY"])                     return "bedrock"

    return "anthropic"
  },

  // Hangi provider'ların API key'i mevcut
  available(): Array<{ id: string; name: string; hasKey: boolean }> {
    return [
      { id: "anthropic",  name: "Anthropic",        hasKey: !!process.env["ANTHROPIC_API_KEY"] },
      { id: "openai",     name: "OpenAI",            hasKey: !!process.env["OPENAI_API_KEY"] },
      { id: "openrouter", name: "OpenRouter",        hasKey: !!process.env["OPENROUTER_API_KEY"] },
      { id: "google",     name: "Google",            hasKey: !!(process.env["GOOGLE_GENERATIVE_AI_API_KEY"] ?? process.env["GOOGLE_API_KEY"]) },
      { id: "xai",        name: "xAI (Grok)",        hasKey: !!process.env["XAI_API_KEY"] },
      { id: "azure",      name: "Azure OpenAI",      hasKey: !!(process.env["AZURE_OPENAI_API_KEY"] && process.env["AZURE_OPENAI_ENDPOINT"]) },
      { id: "bedrock",    name: "AWS Bedrock",       hasKey: !!(process.env["AWS_ACCESS_KEY_ID"] && process.env["AWS_SECRET_ACCESS_KEY"]) },
      { id: "opencode",   name: "OpenCode (Zen)",    hasKey: !!process.env["OPENCODE_API_KEY"] },
      { id: "ollama",     name: "Ollama (Local)",    hasKey: true },
    ]
  },
}
