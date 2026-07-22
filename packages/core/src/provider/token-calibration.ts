const ALPHA = 0.2
const MIN_FACTOR = 0.5
const MAX_FACTOR = 2
const MAX_ENTRIES = 100

interface CalibrationEntry {
  factor: number
  samples: number
  updatedAt: number
}

const entries = new Map<string, CalibrationEntry>()

export function recordTokenCalibration(input: {
  provider: string
  model: string
  estimatedInput: number
  actualInput: number
}): void {
  if (input.estimatedInput <= 0 || input.actualInput <= 0) return
  const observed = clamp(input.actualInput / input.estimatedInput)
  const key = `${input.provider}\0${input.model}`
  const previous = entries.get(key)
  const factor = previous ? previous.factor * (1 - ALPHA) + observed * ALPHA : observed
  entries.set(key, { factor, samples: (previous?.samples ?? 0) + 1, updatedAt: Date.now() })
  if (entries.size > MAX_ENTRIES) {
    const oldest = [...entries.entries()].sort((left, right) => left[1].updatedAt - right[1].updatedAt)[0]?.[0]
    if (oldest) entries.delete(oldest)
  }
}

export function calibratedTokenEstimate(provider: string | undefined, model: string, estimated: number): number {
  if (!provider) return estimated
  return Math.ceil(estimated * (entries.get(`${provider}\0${model}`)?.factor ?? 1))
}

export function getTokenCalibration(provider: string, model: string): Readonly<CalibrationEntry> | null {
  const entry = entries.get(`${provider}\0${model}`)
  return entry ? { ...entry } : null
}

export function clearTokenCalibration(): void {
  entries.clear()
}

function clamp(value: number): number {
  return Math.min(MAX_FACTOR, Math.max(MIN_FACTOR, value))
}
