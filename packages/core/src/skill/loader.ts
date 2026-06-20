import { join } from "path"
import { homedir } from "os"
import { mkdirSync, readFileSync, writeFileSync, statSync } from "fs"
import { parseFrontmatter } from "./frontmatter.js"
import { countTokens } from "../provider/tokenizer.js"
import type { SkillDef, LoadedSkill } from "./types.js"

const MAX_TOKENS_PER_SKILL = 600     // tiktoken sayımı
const DISK_CACHE_DIR       = join(homedir(), ".aurict", "skill-cache")

// ─── Task tipi ve section öncelikleri ────────────────────────────────────────

export type TaskType = "implement" | "debug" | "review" | "refactor" | "explain"

const TASK_SECTION_PRIORITIES: Record<TaskType, string[][]> = {
  implement: [
    ["Examples",        "Implementation",  "Patterns"],
    ["Key Rules",       "Core Rules",      "Rules"],
    ["Quick Reference", "Quick Ref"],
    ["Anti-Patterns",   "❌",              "Avoid"],
    ["Decision Tree",   "When to use"],
  ],
  debug: [
    ["Anti-Patterns",   "❌",              "Avoid"],
    ["Decision Tree",   "When to use"],
    ["Key Rules",       "Core Rules",      "Rules"],
    ["Quick Reference", "Quick Ref"],
    ["Examples",        "Implementation",  "Patterns"],
  ],
  review: [
    ["Anti-Patterns",   "❌",              "Avoid"],
    ["Key Rules",       "Core Rules",      "Rules"],
    ["Quick Reference", "Quick Ref"],
    ["Decision Tree",   "When to use"],
    ["Examples",        "Implementation",  "Patterns"],
  ],
  refactor: [
    ["Anti-Patterns",   "❌",              "Avoid"],
    ["Key Rules",       "Core Rules",      "Rules"],
    ["Examples",        "Implementation",  "Patterns"],
    ["Decision Tree",   "When to use"],
    ["Quick Reference", "Quick Ref"],
  ],
  explain: [
    ["Quick Reference", "Quick Ref"],
    ["Key Rules",       "Core Rules",      "Rules"],
    ["Decision Tree",   "When to use"],
    ["Examples",        "Implementation",  "Patterns"],
    ["Anti-Patterns",   "❌",              "Avoid"],
  ],
}

export function detectTaskType(userText: string): TaskType {
  const t = userText.toLowerCase()
  if (/\b(fix|error|bug|crash|fail|broken|exception|undefined is not|cannot read|doesn'?t work|not working|why (is|does|isn'?t)|what'?s wrong)\b/.test(t))
    return "debug"
  if (/\b(review|check this|look at this|is this (correct|right|good)|does this (look|seem)|thoughts on|feedback on|evaluate)\b/.test(t))
    return "review"
  if (/\b(refactor|clean up|restructur|reorganiz|simplif|extract this|improve the|technical debt)\b/.test(t))
    return "refactor"
  if (/\b(explain|what is|how does|what'?s the (difference|meaning)|why (does|is|would)|how (do|can) i understand)\b/.test(t))
    return "explain"
  return "implement"
}

// ─── Bellek içi cache ─────────────────────────────────────────────────────────
const memCache = new Map<string, LoadedSkill>()
// Adaptive cache: "${skillId}:${taskType}" → LoadedSkill (session-scoped, no disk cache)
const adaptiveMemCache = new Map<string, LoadedSkill>()

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
  const systemPrompt   = extractSystemPrompt(body)
  const tokenCount     = countTokens(systemPrompt)

  const loaded: LoadedSkill = { ...def, description, systemPrompt, tokenCount }
  memCache.set(def.id, loaded)
  writeDiskCache(def, loaded)
  return loaded
}

export async function loadSkills(defs: SkillDef[]): Promise<LoadedSkill[]> {
  return Promise.all(defs.map(loadSkill))
}

export function clearLoaderCache(): void {
  memCache.clear()
  adaptiveMemCache.clear()
}

/** Task tipine göre section önceliği değiştirilmiş skill yükle (session-scoped cache) */
export async function loadSkillAdaptive(def: SkillDef, taskType: TaskType): Promise<LoadedSkill> {
  const cacheKey = `${def.id}:${taskType}`
  if (adaptiveMemCache.has(cacheKey)) return adaptiveMemCache.get(cacheKey)!

  let raw = ""
  try { raw = await Bun.file(def.contentPath).text() } catch {
    const empty: LoadedSkill = { ...def, description: def.name, systemPrompt: "", tokenCount: 0 }
    adaptiveMemCache.set(cacheKey, empty)
    return empty
  }

  const { meta, body } = parseFrontmatter(raw)
  const description    = meta.description || def.name
  const priorities     = TASK_SECTION_PRIORITIES[taskType]
  const systemPrompt   = extractSystemPromptWithPriorities(body, priorities)
  const tokenCount     = countTokens(systemPrompt)

  const loaded: LoadedSkill = { ...def, description, systemPrompt, tokenCount }
  adaptiveMemCache.set(cacheKey, loaded)
  return loaded
}

// ─── Sistem prompt çıkarımı ───────────────────────────────────────────────────

const DEFAULT_SECTION_PRIORITIES: string[][] = [
  ["Quick Reference",   "Quick Ref"],
  ["Anti-Patterns",     "❌",              "Avoid"],
  ["Decision Tree",     "When to use"],
  ["Key Rules",         "Core Rules",      "Rules"],
  ["Implementation",    "Examples",        "Patterns"],
]

function extractSystemPromptWithPriorities(body: string, priorities: string[][]): string {
  const chunks: string[] = []
  let tokens = 0

  for (const headings of priorities) {
    const content = extractSection(body, headings)
    if (!content) continue

    const chunkTok = countTokens(content)
    if (tokens + chunkTok > MAX_TOKENS_PER_SKILL) {
      const available = MAX_TOKENS_PER_SKILL - tokens
      if (available > 50) chunks.push(trimToTokens(content, available))
      break
    }

    chunks.push(content)
    tokens += chunkTok
    if (tokens >= MAX_TOKENS_PER_SKILL) break
  }

  // Fallback: numbered sections (## 1. Topic) — eski format skill'ler için
  // Priority section bulunamadıysa body'nin ilk MAX_TOKENS_PER_SKILL token'ını al
  if (chunks.length === 0 && body.trim()) {
    return trimToTokens(body.trim(), MAX_TOKENS_PER_SKILL)
  }

  return chunks.join("\n\n").trim()
}

function extractSystemPrompt(body: string): string {
  return extractSystemPromptWithPriorities(body, DEFAULT_SECTION_PRIORITIES)
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
