/**
 * Plugin/skill marketplace registry.
 * Fetches the community registry index and provides search.
 * Registry format is a JSON file hosted on GitHub.
 */

import { join } from "path"
import { homedir } from "os"
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs"

const CACHE_DIR  = join(homedir(), ".aurict")
const CACHE_FILE = join(CACHE_DIR, "registry-cache.json")
const CACHE_TTL  = 1000 * 60 * 60  // 1 hour

// Official Aurict registry URL — update when published
export const REGISTRY_URL = "https://raw.githubusercontent.com/aurict/registry/main/registry.json"

export interface RegistryEntry {
  id:          string
  name:        string
  description: string
  type:        "skill" | "plugin"
  url:         string
  author:      string
  tags:        string[]
  version?:    string
}

export interface Registry {
  updatedAt: string
  entries:   RegistryEntry[]
}

function loadCache(): Registry | null {
  if (!existsSync(CACHE_FILE)) return null
  try {
    const raw  = readFileSync(CACHE_FILE, "utf8")
    const data = JSON.parse(raw) as Registry & { _fetchedAt?: number }
    if (data._fetchedAt && Date.now() - data._fetchedAt < CACHE_TTL) return data
  } catch { /* corrupt cache */ }
  return null
}

function saveCache(registry: Registry): void {
  try {
    mkdirSync(CACHE_DIR, { recursive: true })
    writeFileSync(CACHE_FILE, JSON.stringify({ ...registry, _fetchedAt: Date.now() }, null, 2), "utf8")
  } catch { /* ignore */ }
}

export async function fetchRegistry(forceRefresh = false): Promise<Registry> {
  if (!forceRefresh) {
    const cached = loadCache()
    if (cached) return cached
  }

  const resp = await fetch(REGISTRY_URL)
  if (!resp.ok) throw new Error(`Registry fetch failed: HTTP ${resp.status}`)

  const data = await resp.json() as Registry
  if (!Array.isArray(data.entries)) throw new Error("Invalid registry format")

  saveCache(data)
  return data
}

export function searchRegistry(registry: Registry, query: string): RegistryEntry[] {
  if (!query.trim()) return registry.entries
  const q = query.toLowerCase()
  return registry.entries.filter((e) =>
    e.id.includes(q) ||
    e.name.toLowerCase().includes(q) ||
    e.description.toLowerCase().includes(q) ||
    e.tags.some((t) => t.includes(q))
  )
}

export function findInRegistry(registry: Registry, id: string): RegistryEntry | undefined {
  return registry.entries.find((e) => e.id === id || e.name.toLowerCase() === id.toLowerCase())
}
