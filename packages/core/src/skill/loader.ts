import { join } from "path"
import { homedir } from "os"
import { mkdirSync, readFileSync, writeFileSync, statSync } from "fs"
import { parseFrontmatter } from "./frontmatter.js"
import { countTokens } from "../provider/tokenizer.js"
import type { SkillDef, LoadedSkill } from "./types.js"

const MAX_TOKENS_PER_SKILL = 600     // tiktoken sayımı
const DISK_CACHE_DIR       = join(homedir(), ".omnicod", "skill-cache")

// ─── Bellek içi cache ─────────────────────────────────────────────────────────
const memCache = new Map<string, LoadedSkill>()

export async function loadSkill(def: SkillDef): Promise<LoadedSkill> {
  if (memCache.has(def.id)) return memCache.get(def.id)!

  // Disk cache'e bak
  const cached = readDiskCache(def)
  if (cached) { memCache.set(def.id, cached); return cached }

  let raw = ""
  try { raw = await Bun.file(def.contentPath).text() } catch {
    const empty: LoadedSkill = { ...def, description: def.name, systemPrompt: "", tokenCount: 0 }
    memCache.set(def.id, empty)
    return empty
  }

  const { meta, body } = parseFrontmatter(raw)
  const description    = meta.description || def.name
  const systemPrompt   = extractSystemPrompt(body, def.id)
  const tokenCount     = countTokens(systemPrompt)

  const loaded: LoadedSkill = { ...def, description, systemPrompt, tokenCount }
  memCache.set(def.id, loaded)
  writeDiskCache(def, loaded)
  return loaded
}

export async function loadSkills(defs: SkillDef[]): Promise<LoadedSkill[]> {
  return Promise.all(defs.map(loadSkill))
}

export function clearLoaderCache(): void { memCache.clear() }

// ─── Sistem prompt çıkarımı ───────────────────────────────────────────────────

const SECTION_PRIORITIES = [
  ["Quick Reference",   "Quick Ref"],
  ["Anti-Patterns",     "❌",              "Avoid"],
  ["Decision Tree",     "When to use"],
  ["Key Rules",         "Core Rules",      "Rules"],
  ["Implementation",    "Examples",        "Patterns"],
]

function extractSystemPrompt(body: string, skillId: string): string {
  const chunks: string[] = []
  let tokens = 0

  for (const headings of SECTION_PRIORITIES) {
    const content = extractSection(body, headings)
    if (!content) continue

    const chunk     = content
    const chunkTok  = countTokens(chunk)

    if (tokens + chunkTok > MAX_TOKENS_PER_SKILL) {
      // Sığabildiği kadar al
      const available = MAX_TOKENS_PER_SKILL - tokens
      if (available > 50) chunks.push(trimToTokens(chunk, available))
      break
    }

    chunks.push(chunk)
    tokens += chunkTok
    if (tokens >= MAX_TOKENS_PER_SKILL) break
  }

  return chunks.join("\n\n").trim()
}

function extractSection(body: string, headings: string[]): string {
  for (const h of headings) {
    // ## veya ### ile başlayan başlıkları ara
    const patterns = [
      new RegExp(`^#{1,3}\\s+.*${escapeRegex(h)}.*$`, "im"),
      new RegExp(`^\\*\\*${escapeRegex(h)}`, "im"),
    ]

    for (const re of patterns) {
      const match = body.match(re)
      if (!match || match.index === undefined) continue

      const start   = body.indexOf("\n", match.index) + 1
      // Bir sonraki ## başlığına kadar al
      const nextH   = body.slice(start).search(/^#{1,3}\s/m)
      const end     = nextH >= 0 ? start + nextH : body.length

      const section = body.slice(start, end).trim()
      if (section.length > 30) return section
    }
  }
  return ""
}

function trimToTokens(text: string, maxTokens: number): string {
  // Yaklaşım: karakter = token * 4 (tiktoken yaklaşımı)
  const approxChars = maxTokens * 4
  return text.slice(0, approxChars)
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

// ─── Disk cache ───────────────────────────────────────────────────────────────

interface DiskCacheEntry {
  mtime:        number
  description:  string
  systemPrompt: string
  tokenCount:   number
}

function diskCachePath(def: SkillDef): string {
  return join(DISK_CACHE_DIR, `${def.id}.json`)
}

function readDiskCache(def: SkillDef): LoadedSkill | null {
  try {
    const mtime = statSync(def.contentPath).mtimeMs
    const entry = JSON.parse(readFileSync(diskCachePath(def), "utf8")) as DiskCacheEntry
    if (entry.mtime !== mtime) return null
    return { ...def, description: entry.description, systemPrompt: entry.systemPrompt, tokenCount: entry.tokenCount }
  } catch { return null }
}

function writeDiskCache(def: SkillDef, loaded: LoadedSkill): void {
  try {
    mkdirSync(DISK_CACHE_DIR, { recursive: true })
    const mtime = statSync(def.contentPath).mtimeMs
    const entry: DiskCacheEntry = { mtime, description: loaded.description, systemPrompt: loaded.systemPrompt, tokenCount: loaded.tokenCount }
    writeFileSync(diskCachePath(def), JSON.stringify(entry))
  } catch { /* disk cache optional */ }
}
