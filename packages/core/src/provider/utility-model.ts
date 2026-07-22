import type { OmniConfig } from "../config/config.js"
import { ProviderRegistry } from "./registry.js"

export interface UtilityModelSelection {
  provider: string
  model: string
  maxInputTokens: number
  maxOutputTokens: number
  source: "configured" | "economy" | "primary-visible-fallback"
}

const ECONOMY_MODEL = /(?:haiku|mini|flash|small|lite|nano)/i
const warnedFallbacks = new Set<string>()

export function resolveUtilityModel(
  config: OmniConfig,
  primaryProvider: string,
  primaryModel: string,
): UtilityModelSelection {
  const utility = config.utilityModel
  if ((utility?.provider && !utility.model) || (!utility?.provider && utility?.model)) {
    throw new Error("utilityModel.provider and utilityModel.model must be configured together")
  }

  if (utility?.provider && utility.model) {
    ProviderRegistry.get(utility.provider).getModel(utility.model)
    return selection(utility.provider, utility.model, "configured", utility)
  }

  const plugin = ProviderRegistry.get(primaryProvider)
  const economy = plugin.listModels().find((candidate) => ECONOMY_MODEL.test(`${candidate.id} ${candidate.name}`))
  if (economy) return selection(primaryProvider, economy.id, "economy", utility)

  const key = `${primaryProvider}/${primaryModel}`
  if (!warnedFallbacks.has(key)) {
    warnedFallbacks.add(key)
    console.warn(
      `[aurict] no economy utility model is known for ${key}; housekeeping calls will use the primary model. `
      + "Configure utilityModel.provider and utilityModel.model to avoid this fallback.",
    )
  }
  return selection(primaryProvider, primaryModel, "primary-visible-fallback", utility)
}

function selection(
  provider: string,
  model: string,
  source: UtilityModelSelection["source"],
  limits: OmniConfig["utilityModel"],
): UtilityModelSelection {
  return {
    provider,
    model,
    source,
    maxInputTokens: positiveInt(limits?.maxInputTokens, 24_000),
    maxOutputTokens: positiveInt(limits?.maxOutputTokens, 1_200),
  }
}

function positiveInt(value: number | undefined, fallback: number): number {
  if (value === undefined) return fallback
  if (!Number.isFinite(value) || value <= 0) throw new Error(`Utility model token limit must be positive, received ${value}`)
  return Math.floor(value)
}
