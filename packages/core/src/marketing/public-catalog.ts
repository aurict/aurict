/**
 * Stable product facts that may be shown outside the runtime.
 *
 * Keep this module dependency-free: the website consumes it at build time and
 * core tests keep the provider IDs aligned with ProviderRegistry.
 */
export const PUBLIC_PRODUCT_CATALOG = {
  providers: [
    { id: "anthropic", name: "Anthropic" },
    { id: "openai", name: "OpenAI" },
    { id: "openrouter", name: "OpenRouter" },
    { id: "google", name: "Google" },
    { id: "opencode", name: "OpenCode (Zen)" },
    { id: "ollama", name: "Ollama" },
    { id: "xai", name: "xAI" },
    { id: "azure", name: "Azure OpenAI" },
    { id: "bedrock", name: "AWS Bedrock" },
    { id: "nvidia", name: "NVIDIA NIM" },
    { id: "zai", name: "Z.AI (GLM)" },
    { id: "alibaba", name: "Alibaba (Qwen)" },
  ],
  capabilities: {
    verifiedCompletion: "Durable proof records capture changed files, verification evidence, open work, and explicit waivers.",
    workspaceIntelligence: "Local semantic search, installed dependency docs, workspace image reading, and browser or eval verification.",
  },
} as const

export type PublicProvider = (typeof PUBLIC_PRODUCT_CATALOG.providers)[number]
