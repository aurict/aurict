/**
 * Remote plugin installer.
 * Fetches .js/.mjs plugin files from a URL and saves them to ~/.aurict/plugins/.
 * Mirrors the skill remote system but for executable JS plugins.
 */

import { join } from "path"
import { homedir } from "os"
import { mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync, existsSync } from "fs"
import { PLUGIN_DIR } from "./loader.js"

const META_SUFFIX = ".meta.json"

export interface RemotePluginMeta {
  id:          string
  name:        string
  description: string
  source:      string
  filePath:    string
  installedAt: string
}

function ensureDir(): void {
  mkdirSync(PLUGIN_DIR, { recursive: true })
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

function idFromUrl(url: string): string {
  const filename = url.split("/").pop() ?? "plugin"
  return slugify(filename.replace(/\.(m?js)$/, ""))
}

export async function installRemotePlugin(url: string, nameHint?: string): Promise<RemotePluginMeta> {
  const rawUrl = url
    .replace("github.com", "raw.githubusercontent.com")
    .replace("/blob/", "/")

  const resp = await fetch(rawUrl)
  if (!resp.ok) throw new Error(`Failed to download plugin from ${rawUrl}: HTTP ${resp.status}`)

  const content = await resp.text()
  if (!content.trim()) throw new Error("Downloaded content is empty")

  const id       = nameHint ? slugify(nameHint) : idFromUrl(url)
  const ext      = url.endsWith(".mjs") ? ".mjs" : ".js"
  const filePath = join(PLUGIN_DIR, `${id}${ext}`)

  ensureDir()
  writeFileSync(filePath, content, "utf8")

  const meta: RemotePluginMeta = {
    id,
    name:        nameHint || id,
    description: "",
    source:      url,
    filePath,
    installedAt: new Date().toISOString(),
  }
  writeFileSync(join(PLUGIN_DIR, `${id}${META_SUFFIX}`), JSON.stringify(meta, null, 2), "utf8")

  return meta
}

export function listInstalledPlugins(): RemotePluginMeta[] {
  ensureDir()
  let files: string[]
  try { files = readdirSync(PLUGIN_DIR) } catch { return [] }

  const results: RemotePluginMeta[] = []
  for (const f of files) {
    if (!f.endsWith(META_SUFFIX)) continue
    const id = f.replace(META_SUFFIX, "")
    try {
      const raw  = readFileSync(join(PLUGIN_DIR, f), "utf8")
      const meta = JSON.parse(raw) as RemotePluginMeta
      results.push({ ...meta, id })
    } catch { /* skip corrupt meta */ }
  }
  return results
}

export function uninstallPlugin(id: string): boolean {
  ensureDir()
  const metaPath = join(PLUGIN_DIR, `${id}${META_SUFFIX}`)
  if (!existsSync(metaPath)) return false

  let filePath = join(PLUGIN_DIR, `${id}.js`)
  if (!existsSync(filePath)) filePath = join(PLUGIN_DIR, `${id}.mjs`)

  try {
    if (existsSync(filePath)) unlinkSync(filePath)
    unlinkSync(metaPath)
    return true
  } catch { return false }
}
