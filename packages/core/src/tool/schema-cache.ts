import type { ToolDef } from "./types.js"
import { zodSchema } from "ai"
import { countTokens } from "../provider/tokenizer.js"
import { ToolRegistry } from "./registry.js"

export interface CachedToolSchema {
  id: string
  sanitizedId: string
  description: string
  parameters: ToolDef["parameters"]
}

const schemaCache = new Map<string, CachedToolSchema>()
const schemaTokenCache = new Map<string, number>()

export function getCachedToolSchema(def: ToolDef): CachedToolSchema {
  const key = `${def.id}\0${def.description}`
  const cached = schemaCache.get(key)
  if (cached) return cached

  const schema: CachedToolSchema = {
    id: def.id,
    sanitizedId: def.id.replace(/:/g, "_"),
    description: def.description,
    parameters: def.parameters,
  }
  schemaCache.set(key, schema)
  return schema
}

export function clearToolSchemaCache(): void {
  schemaCache.clear()
  schemaTokenCache.clear()
}

export function toolSchemaCacheStats(): { entries: number } {
  return { entries: schemaCache.size }
}

export async function countToolSchemaTokens(
  toolIds: string[],
  modelId: string,
  preferredEncoding?: string,
): Promise<number> {
  const selected = new Set(toolIds)
  let total = 0
  for (const definition of ToolRegistry.list()) {
    const schema = getCachedToolSchema(definition)
    if (!selected.has(schema.sanitizedId)) continue
    const key = `${schema.id}\0${schema.description}\0${modelId}\0${preferredEncoding ?? ""}`
    const cached = schemaTokenCache.get(key)
    if (cached !== undefined) {
      total += cached
      continue
    }
    const jsonSchema = await zodSchema(schema.parameters).jsonSchema
    const tokens = countTokens(
      `${schema.sanitizedId}\n${schema.description}\n${JSON.stringify(jsonSchema)}`,
      modelId,
      preferredEncoding,
    )
    schemaTokenCache.set(key, tokens)
    total += tokens
  }
  return total
}
