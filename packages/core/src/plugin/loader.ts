/**
 * Plugin yükleyici.
 *
 * ~/.aurict/plugins/ klasöründeki .js / .mjs dosyalarını yükler.
 * Her dosya şunu export edebilir:
 *   export const plugin: OmniPlugin = { name, tools?, providers? }
 *
 * Örnek plugin:
 *   import { z } from "zod"
 *   export const plugin = {
 *     name: "my-tools",
 *     tools: [{
 *       id: "hello",
 *       description: "Say hello",
 *       parameters: z.object({ name: z.string() }),
 *       execute: async (args) => ({ output: `Hello, ${args.name}!` }),
 *     }],
 *   }
 */

import { readdirSync, existsSync, mkdirSync } from "fs"
import { join } from "path"
import { homedir } from "os"
import { ToolRegistry }     from "../tool/registry.js"
import { ProviderRegistry } from "../provider/registry.js"
import type { ToolDef }     from "../tool/types.js"
import type { ProviderPlugin } from "../provider/plugin.js"

export const PLUGIN_DIR = join(homedir(), ".aurict", "plugins")

export interface OmniPlugin {
  name:       string
  tools?:     ToolDef[]
  providers?: Record<string, ProviderPlugin>
}

interface LoadResult {
  file:   string
  name:   string
  tools:  number
  provs:  number
  error?: string
}

let loaded = false
const results: LoadResult[] = []

export async function loadPlugins(): Promise<LoadResult[]> {
  if (loaded) return results
  loaded = true

  if (!existsSync(PLUGIN_DIR)) {
    try { mkdirSync(PLUGIN_DIR, { recursive: true }) } catch { /* ok */ }
    return results
  }

  let files: string[]
  try { files = readdirSync(PLUGIN_DIR) } catch { return results }

  const pluginFiles = files.filter((f) => f.endsWith(".js") || f.endsWith(".mjs"))

  for (const file of pluginFiles) {
    const filePath = join(PLUGIN_DIR, file)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mod = await import(filePath) as any
      const plugin: OmniPlugin | undefined = mod.plugin ?? mod.default?.plugin ?? mod.default

      if (!plugin || typeof plugin !== "object" || !plugin.name) {
        results.push({ file, name: "?", tools: 0, provs: 0, error: "No valid 'plugin' export found" })
        continue
      }

      let toolCount = 0
      let provCount = 0

      if (plugin.tools) {
        for (const t of plugin.tools) {
          ToolRegistry.register(t)
          toolCount++
        }
      }

      if (plugin.providers) {
        for (const prov of Object.values(plugin.providers)) {
          ProviderRegistry.register(prov)
          provCount++
        }
      }

      results.push({ file, name: plugin.name, tools: toolCount, provs: provCount })
      console.error(`[plugin] ${plugin.name}: ${toolCount} tool(s), ${provCount} provider(s) loaded`)
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e)
      results.push({ file, name: "?", tools: 0, provs: 0, error })
      console.error(`[plugin] ${file}: load error — ${error}`)
    }
  }

  return results
}

export function getLoadedPlugins(): LoadResult[] {
  return results
}
