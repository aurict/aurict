import type { OmniConfig } from "../config/config.js"

export const AGENT_RUNTIME_FEATURES = [
  "canonical_state",
  "structured_status",
  "utility_model",
  "persistent_tool_routing",
  "prompt_tiering",
  "background_verification",
  "mtime_tool_cache",
  "multimodal_tools",
  "code_navigation",
  "browser_drive",
  "semantic_search",
] as const

export type AgentRuntimeFeature = typeof AGENT_RUNTIME_FEATURES[number]

export function isAgentFeatureEnabled(
  feature: AgentRuntimeFeature,
  config: OmniConfig = {},
  cohortKey = "default",
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  const disabled = new Set([
    ...(config.agentFeatures?.disabled ?? []),
    ...csv(env["AURICT_DISABLE_AGENT_FEATURES"]),
  ])
  if (disabled.has(feature)) return false

  const configuredPercent = config.agentFeatures?.rolloutPercent
  const envPercent = numberOrUndefined(env["AURICT_AGENT_ROLLOUT_PERCENT"])
  const percent = clampPercent(envPercent ?? configuredPercent ?? 100)
  return stableBucket(`${cohortKey}:${feature}`) < percent
}

function csv(value: string | undefined): string[] {
  return (value ?? "").split(",").map(item => item.trim()).filter(Boolean)
}

function numberOrUndefined(value: string | undefined): number | undefined {
  if (!value?.trim()) return undefined
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) throw new Error(`AURICT_AGENT_ROLLOUT_PERCENT must be numeric, received '${value}'`)
  return parsed
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new Error(`Agent feature rolloutPercent must be between 0 and 100, received ${value}`)
  }
  return value
}

function stableBucket(value: string): number {
  let hash = 2166136261
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0) % 100
}
