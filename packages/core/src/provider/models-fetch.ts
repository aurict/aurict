import { join } from "path"
import { homedir } from "os"
import { statSync } from "fs"
import type { ModelInfo } from "./plugin.js"

const CACHE_TTL_MS = 5 * 60 * 1000 // 5 dakika

interface OpenAIModelEntry {
  id:       string
  object:   string
  owned_by: string
}
interface OpenAIModelsResponse {
  object: string
  data:   OpenAIModelEntry[]
}

function cachePath(providerId: string): string {
  return join(homedir(), ".aurict", "cache", `models-${providerId}.json`)
}

function isFresh(path: string): boolean {
  try {
    const stat = statSync(path)
    return Date.now() - stat.mtimeMs < CACHE_TTL_MS
  } catch { return false }
}

// Model ID'den capability tahmini — remote list için
function guessCapabilities(id: string): Pick<ModelInfo, "supportsTools" | "supportsVision"> {
  const lower = id.toLowerCase()
  // Tool desteği olmayan modeller
  const noTools = lower.includes("deepseek-r1") || lower.includes("deepseek/r1")
               || lower.includes("llava") || lower.includes("vision-only")
               || lower.includes(":1b") || lower.includes("whisper")
               || lower.includes("dall-e") || lower.includes("tts")
               || lower.includes("embedding") || lower.includes("embed")
  // Vision destekleyen modeller
  const hasVision = lower.includes("vision") || lower.includes("llava")
                 || lower.includes("gpt-4o") || lower.includes("gemini")
                 || lower.includes("claude") || lower.includes("minicpm-v")
  return { supportsTools: !noTools, supportsVision: hasVision }
}

async function fetchFromEndpoint(url: string, apiKey: string): Promise<ModelInfo[]> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 10_000)
  try {
    const res = await fetch(url, {
      headers: { "Authorization": `Bearer ${apiKey}`, "User-Agent": "Aurict/0.0.1" },
      signal: controller.signal,
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json() as OpenAIModelsResponse
    return json.data.map((m) => ({
      id:            m.id,
      name:          m.id,
      contextWindow: 200_000,
      maxOutput:     32_000,
      ...guessCapabilities(m.id),
    }))
  } finally {
    clearTimeout(timer)
  }
}

export async function getCachedModels(providerId: string, url: string, apiKey: string): Promise<ModelInfo[]> {
  const path = cachePath(providerId)

  if (isFresh(path)) {
    try {
      const raw = await Bun.file(path).text()
      return JSON.parse(raw) as ModelInfo[]
    } catch { /* cache bozuksa yeniden fetch */ }
  }

  // Fetch + retry
  let lastError: unknown
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const models = await fetchFromEndpoint(url, apiKey)
      // Cache'e yaz (dizin yoksa atla)
      try {
        await Bun.write(path, JSON.stringify(models))
      } catch { /* yazılamazsa önemli değil */ }
      return models
    } catch (err) {
      lastError = err
      if (attempt === 0) await new Promise((r) => setTimeout(r, 500)) // 0.5s backoff
    }
  }
  throw lastError
}
