export interface PromptCacheControl {
  type: "ephemeral"
  scope?: "global" | "org"
  ttl?: "1h"
}

export function isPromptCachingEnabled(provider: string, model: string): boolean {
  if (truthy(process.env.AURICT_DISABLE_PROMPT_CACHING)) return false
  if (provider !== "anthropic") return false
  if (truthy(process.env.AURICT_DISABLE_PROMPT_CACHING_HAIKU) && /haiku/i.test(model)) return false
  return true
}

export function getPromptCacheControl(): PromptCacheControl {
  const scope = process.env.AURICT_PROMPT_CACHE_SCOPE === "global"
    ? "global"
    : process.env.AURICT_PROMPT_CACHE_SCOPE === "org"
      ? "org"
      : undefined
  const ttl = process.env.AURICT_PROMPT_CACHE_TTL === "1h" ? "1h" : undefined
  return {
    type: "ephemeral",
    ...(scope ? { scope } : {}),
    ...(ttl ? { ttl } : {}),
  }
}

function truthy(value: string | undefined): boolean {
  return ["1", "true", "yes", "on"].includes(value?.trim().toLowerCase() ?? "")
}

