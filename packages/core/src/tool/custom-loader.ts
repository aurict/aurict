/**
 * Custom Tool Loader — .omnicod/tools/*.js
 *
 * Kullanıcılar proje veya global .omnicod/tools/ dizinine JS tool dosyaları
 * koyarak OmniCod'a yeni araçlar ekleyebilir.
 *
 * Format (ESM, .js dosyası):
 *
 *   export default {
 *     id: "my-tool",
 *     description: "Does something useful",
 *     parameters: {               // JSON Schema object (properties + required)
 *       type: "object",
 *       properties: {
 *         query: { type: "string", description: "Input query" }
 *       },
 *       required: ["query"]
 *     },
 *     execute: async ({ query }, ctx) => {
 *       return { output: `Result for ${query}` }
 *     }
 *   }
 *
 * Tool dosyaları şu konumlardan yüklenir (önce global, proje override eder):
 *   ~/.omnicod/tools/*.js
 *   <workdir>/.omnicod/tools/*.js
 */

import { join }        from "node:path"
import { homedir }     from "node:os"
import { readdirSync, existsSync } from "node:fs"
import { z }           from "zod"
import { ToolRegistry } from "./registry.js"
import type { ToolDef, ToolContext, ExecuteResult } from "./types.js"

interface RawCustomTool {
  id:          string
  description: string
  parameters:  {
    type:        "object"
    properties:  Record<string, { type: string; description?: string; enum?: string[] }>
    required?:   string[]
  }
  execute: (args: Record<string, unknown>, ctx: ToolContext) => Promise<ExecuteResult> | ExecuteResult
}

function jsonSchemaToZod(schema: RawCustomTool["parameters"]): z.AnyZodObject {
  const shape: Record<string, z.ZodTypeAny> = {}
  for (const [key, prop] of Object.entries(schema.properties ?? {})) {
    let field: z.ZodTypeAny
    if (prop.enum) {
      field = z.enum(prop.enum as [string, ...string[]])
    } else {
      switch (prop.type) {
        case "number":  field = z.number();  break
        case "boolean": field = z.boolean(); break
        case "array":   field = z.array(z.unknown()); break
        default:        field = z.string();  break
      }
    }
    if (prop.description) field = field.describe(prop.description)
    const required = schema.required ?? []
    shape[key] = required.includes(key) ? field : field.optional()
  }
  return z.object(shape)
}

function isValidTool(obj: unknown): obj is RawCustomTool {
  if (!obj || typeof obj !== "object") return false
  const t = obj as Record<string, unknown>
  return (
    typeof t["id"]          === "string" &&
    typeof t["description"] === "string" &&
    typeof t["parameters"]  === "object" &&
    typeof t["execute"]     === "function"
  )
}

async function loadFromDir(dir: string, loaded: Set<string>): Promise<void> {
  if (!existsSync(dir)) return

  let files: string[]
  try { files = readdirSync(dir).filter(f => f.endsWith(".js")) }
  catch { return }

  for (const file of files) {
    const fullPath = join(dir, file)
    try {
      const mod  = await import(fullPath) as { default?: unknown }
      const raw  = mod.default ?? mod

      if (!isValidTool(raw)) {
        console.error(`[omnicod] custom tool ${file}: invalid format, skipping`)
        continue
      }

      if (loaded.has(raw.id)) {
        // Project-level overrides global-level
        ToolRegistry.register({
          id:          raw.id,
          description: raw.description,
          parameters:  jsonSchemaToZod(raw.parameters),
          spec: { category: "execute", riskLevel: "medium" },
          execute:     raw.execute,
        } as ToolDef)
        continue
      }

      ToolRegistry.register({
        id:          raw.id,
        description: raw.description,
        parameters:  jsonSchemaToZod(raw.parameters),
        spec: { category: "execute", riskLevel: "medium" },
        execute:     raw.execute,
      } as ToolDef)

      loaded.add(raw.id)
      console.error(`[omnicod] custom tool loaded: ${raw.id} (${file})`)
    } catch (err) {
      console.error(`[omnicod] custom tool ${file}: failed to load —`, (err as Error).message)
    }
  }
}

export async function loadCustomTools(workdir: string): Promise<void> {
  const loaded = new Set<string>()

  // 1. Global: ~/.omnicod/tools/
  await loadFromDir(join(homedir(), ".omnicod", "tools"), loaded)

  // 2. Project: <workdir>/.omnicod/tools/ (override)
  await loadFromDir(join(workdir, ".omnicod", "tools"), loaded)
}
