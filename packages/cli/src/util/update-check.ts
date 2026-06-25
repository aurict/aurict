import { homedir } from "os"
import { join }    from "path"
import { readFileSync, writeFileSync, mkdirSync } from "fs"

export const CURRENT_VERSION = "1.1.3"

const CACHE_FILE = join(homedir(), ".aurict", ".update-check")
const CACHE_TTL  = 24 * 60 * 60 * 1_000  // 24 h

interface CacheEntry {
  checkedAt: number
  latest:    string
}

export interface UpdateInfo {
  current: string
  latest:  string
}

export async function checkForUpdate(): Promise<UpdateInfo | null> {
  try {
    const cached = readCache()
    const latest = cached ? cached.latest : await fetchLatest()
    if (!latest) return null
    if (!cached) writeCache({ checkedAt: Date.now(), latest })
    return isNewer(latest, CURRENT_VERSION) ? { current: CURRENT_VERSION, latest } : null
  } catch {
    return null
  }
}

async function fetchLatest(): Promise<string | null> {
  const ac = new AbortController()
  const t  = setTimeout(() => ac.abort(), 3_000)
  try {
    const res = await fetch("https://registry.npmjs.org/aurict/latest", {
      signal:  ac.signal,
      headers: { Accept: "application/json" },
    })
    if (!res.ok) return null
    const data = await res.json() as { version?: string }
    return data.version ?? null
  } finally {
    clearTimeout(t)
  }
}

function readCache(): CacheEntry | null {
  try {
    const entry = JSON.parse(readFileSync(CACHE_FILE, "utf8")) as CacheEntry
    return Date.now() - entry.checkedAt < CACHE_TTL ? entry : null
  } catch { return null }
}

function writeCache(entry: CacheEntry): void {
  try {
    mkdirSync(join(homedir(), ".aurict"), { recursive: true })
    writeFileSync(CACHE_FILE, JSON.stringify(entry))
  } catch { /* optional */ }
}

function isNewer(a: string, b: string): boolean {
  const pa = a.split(".").map(Number)
  const pb = b.split(".").map(Number)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] ?? 0
    const nb = pb[i] ?? 0
    if (na > nb) return true
    if (na < nb) return false
  }
  return false
}
