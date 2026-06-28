import type { ToolDef } from "./types.js"

export interface CachedToolSchema {
  id: string
  sanitizedId: string
  description: string
  parameters: ToolDef["parameters"]
}

const schemaCache = new Map<string, CachedToolSchema>()

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
}

export function toolSchemaCacheStats(): { entries: number } {
  return { entries: schemaCache.size }
}

