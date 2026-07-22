import type { ModelInfo, ProviderPlugin } from "./plugin.js"

export interface EquivalentModelSelection {
  model: string
  reason: string
}

export function selectEquivalentFallbackModel(
  primary: ModelInfo,
  fallbackProvider: ProviderPlugin,
): EquivalentModelSelection {
  const models = fallbackProvider.listModels()
  if (models.length === 0) {
    return { model: fallbackProvider.defaultModel(), reason: "provider exposes no model catalog" }
  }

  const ranked = models.map((candidate) => ({
    candidate,
    score: compatibilityScore(primary, candidate),
  })).sort((left, right) => right.score - left.score)
  const selected = ranked[0]!.candidate
  return {
    model: selected.id,
    reason: `capability match score ${ranked[0]!.score.toFixed(2)}`,
  }
}

function compatibilityScore(primary: ModelInfo, candidate: ModelInfo): number {
  let score = Math.min(candidate.contextWindow / Math.max(1, primary.contextWindow), 1) * 5
  score += Math.min(candidate.maxOutput / Math.max(1, primary.maxOutput), 1) * 2
  if (candidate.supportsTools === primary.supportsTools) score += 4
  if (candidate.supportsVision === primary.supportsVision) score += 2
  if (candidate.supportsThinking === primary.supportsThinking) score += 2
  if (primary.supportsTools && !candidate.supportsTools) score -= 20
  if (primary.supportsVision && !candidate.supportsVision) score -= 10
  return score
}
