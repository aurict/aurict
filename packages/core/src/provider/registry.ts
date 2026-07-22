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
import { createNvidiaPlugin }  from "./nvidia.js"
import { createZaiPlugin }     from "./zai.js"
import { createAlibabaPlugin } from "./alibaba.js"
import { providerEnv } from "./credentials.js"

const plugins = new Map<string, ProviderPlugin>()

// Providers whose availability/hasKey is computed here explicitly (built-in,
// known env vars). Anything registered later via ProviderRegistry.register()
// (JS plugin loader, user-added custom providers) is NOT in this set and is
// surfaced dynamically by available() below instead.
export const BUILT_IN_PROVIDER_IDS = [
  "anthropic", "openai", "openrouter", "google", "opencode",
  "ollama", "xai", "azure", "bedrock", "nvidia", "zai", "alibaba",
] as const

const builtInIds = new Set<string>(BUILT_IN_PROVIDER_IDS)

plugins.set("anthropic",  new AnthropicPlugin())
plugins.set("openai",     new OpenAIPlugin())
plugins.set("openrouter", new OpenRouterPlugin())
plugins.set("google",     new GooglePlugin())
plugins.set("opencode",   new OpenCodePlugin())
plugins.set("ollama",     new OllamaPlugin())
plugins.set("xai",        new XAIPlugin())
plugins.set("azure",      new AzurePlugin())
plugins.set("bedrock",    new BedrockPlugin())
plugins.set("nvidia",     createNvidiaPlugin())
plugins.set("zai",        createZaiPlugin())
plugins.set("alibaba",    createAlibabaPlugin())

export const ProviderRegistry = {
  get(id: string): ProviderPlugin {
    const plugin = plugins.get(id)
    if (!plugin) throw new Error(`Provider not registered: "${id}"`)
    return plugin
  },

  register(plugin: ProviderPlugin): void {
    plugins.set(plugin.id, plugin)
  },

  unregister(id: string): void {
    plugins.delete(id)
  },

  list(): ProviderPlugin[] {
    return [...plugins.values()]
  },

  has(id: string): boolean {
    return plugins.has(id)
  },

  // Hangi API key'in set edildiğine göre varsayılan provider
  detectDefault(): string {
    const override = providerEnv("AURICT_PROVIDER")
    if (override && plugins.has(override)) return override

    if (providerEnv("ANTHROPIC_API_KEY"))                                                              return "anthropic"
    if (providerEnv("OPENCODE_API_KEY"))                                                               return "opencode"
    if (providerEnv("OPENAI_API_KEY"))                                                                 return "openai"
    if (providerEnv("OPENROUTER_API_KEY"))                                                             return "openrouter"
    if (providerEnv("GOOGLE_GENERATIVE_AI_API_KEY") ?? providerEnv("GOOGLE_API_KEY"))                 return "google"
    if (providerEnv("XAI_API_KEY"))                                                                    return "xai"
    if (providerEnv("AZURE_OPENAI_API_KEY") && providerEnv("AZURE_OPENAI_ENDPOINT"))                  return "azure"
    if (providerEnv("AWS_ACCESS_KEY_ID") && providerEnv("AWS_SECRET_ACCESS_KEY"))                     return "bedrock"
    if (providerEnv("NVIDIA_API_KEY"))                                                                 return "nvidia"
    if (providerEnv("ZAI_API_KEY"))                                                                    return "zai"
    if (providerEnv("DASHSCOPE_API_KEY"))                                                              return "alibaba"

    return "anthropic"
  },

  // Hangi provider'ların API key'i mevcut
  available(): Array<{ id: string; name: string; hasKey: boolean }> {
    const builtIn: Array<{ id: string; name: string; hasKey: boolean }> = [
      { id: "anthropic",  name: "Anthropic",        hasKey: !!providerEnv("ANTHROPIC_API_KEY") },
      { id: "openai",     name: "OpenAI",            hasKey: !!providerEnv("OPENAI_API_KEY") },
      { id: "openrouter", name: "OpenRouter",        hasKey: !!providerEnv("OPENROUTER_API_KEY") },
      { id: "google",     name: "Google",            hasKey: !!(providerEnv("GOOGLE_GENERATIVE_AI_API_KEY") ?? providerEnv("GOOGLE_API_KEY")) },
      { id: "xai",        name: "xAI (Grok)",        hasKey: !!providerEnv("XAI_API_KEY") },
      { id: "azure",      name: "Azure OpenAI",      hasKey: !!(providerEnv("AZURE_OPENAI_API_KEY") && providerEnv("AZURE_OPENAI_ENDPOINT")) },
      { id: "bedrock",    name: "AWS Bedrock",       hasKey: !!(providerEnv("AWS_ACCESS_KEY_ID") && providerEnv("AWS_SECRET_ACCESS_KEY")) },
      { id: "opencode",   name: "OpenCode (Zen)",    hasKey: !!providerEnv("OPENCODE_API_KEY") },
      { id: "ollama",     name: "Ollama (Local)",    hasKey: true },
      { id: "nvidia",     name: "NVIDIA NIM",        hasKey: !!providerEnv("NVIDIA_API_KEY") },
      { id: "zai",        name: "Z.AI (GLM)",        hasKey: !!providerEnv("ZAI_API_KEY") },
      { id: "alibaba",    name: "Alibaba (Qwen)",    hasKey: !!providerEnv("DASHSCOPE_API_KEY") },
    ]
    // Anything registered at runtime (JS plugin loader, user-added custom
    // providers) but not in the static list above — it was only ever
    // registered once it already had a working key, so hasKey is always true.
    const dynamic = [...plugins.entries()]
      .filter(([id]) => !builtInIds.has(id))
      .map(([id, plugin]) => ({ id, name: plugin.name, hasKey: true }))
    return [...builtIn, ...dynamic]
  },
}
