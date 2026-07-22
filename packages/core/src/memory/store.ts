import { join } from "path"
import { mkdirSync, writeFileSync } from "fs"
import {
  insertMemory, deleteMemory, listMemories, clearMemories,
} from "../storage/queries.js"
import { countTokens } from "../provider/tokenizer.js"
import type { Memory, Category, Scope, Source } from "./types.js"

// DB'nin schema migration'ı ilk kullanımda çalışmıyor olabilir — güvenli init
function ensureTable() {
  try {
    const { db } = require("../storage/db.js")
    db.run(`CREATE TABLE IF NOT EXISTS memories (
      id TEXT PRIMARY KEY,
      content TEXT NOT NULL,
      category TEXT NOT NULL,
      scope TEXT NOT NULL,
      project TEXT,
      timestamp INTEGER NOT NULL,
      source TEXT NOT NULL,
      tags TEXT
    )`)
  } catch (error) {
    console.warn("[aurict] memory table initialization could not be confirmed", error)
  }
}

class MemoryStore {
  constructor() {
    // Tablo yoksa oluştur (Drizzle migration'ı beklemeye gerek yok)
    ensureTable()
  }

  /** Workdir için alakalı memoryleri döner: project önce, global sonra; token limiti dahilinde */
  getRelevant(workdir: string, maxEntries = 15, maxTokens = 600, query = ""): Memory[] {
    const words = keywords(query)
    const all = this.list(workdir)
      .map((memory, index) => ({
        memory,
        index,
        relevance: relevanceScore(memory, words),
      }))
      .sort((a, b) => b.relevance - a.relevance || a.index - b.index)
      .map(({ memory }) => memory)
    const selected: Memory[] = []
    let   total = 0

    for (const m of all) {
      if (selected.length >= maxEntries) break
      const tok = countTokens(m.content) + 10  // tag + category overhead
      if (total + tok > maxTokens) continue
      selected.push(m)
      total += tok
    }
    return selected
  }

  /** Yeni memory ekle */
  add(data: {
    content:  string
    category: Category
    scope:    Scope
    project?: string
    source:   Source
    tags?:    string[]
  }): Memory {
    const content = data.content.trim()
    if (!content) throw new Error("Memory content cannot be empty")
    const duplicate = this.list(data.project).find((memory) => (
      memory.scope === data.scope
      && (data.scope === "global" || memory.project === data.project)
      && normalizeContent(memory.content) === normalizeContent(content)
    ))
    if (duplicate) return duplicate

    const entry: Memory = {
      id:        crypto.randomUUID(),
      content,
      category:  data.category,
      scope:     data.scope,
      timestamp: Date.now(),
      source:    data.source,
      ...(data.project !== undefined ? { project: data.project } : {}),
      ...(data.tags    !== undefined ? { tags:    data.tags }    : {}),
    }
    insertMemory({
      id:        entry.id,
      content:   entry.content,
      category:  entry.category,
      scope:     entry.scope,
      timestamp: entry.timestamp,
      source:    entry.source,
      ...(entry.project !== undefined ? { project: entry.project } : {}),
      ...(entry.tags    !== undefined ? { tags: JSON.stringify(entry.tags) } : {}),
    })
    return entry
  }

  /** ID ile sil */
  remove(id: string): boolean {
    try { deleteMemory(id); return true }
    catch { return false }
  }

  /** Kelime bazlı text search */
  search(query: string, workdir?: string): Memory[] {
    const all   = this.list(workdir)
    const words = query.toLowerCase().split(/\s+/).filter(Boolean)
    if (!words.length) return all

    const scored = all.map((m) => {
      const text  = (m.content + " " + (m.tags?.join(" ") ?? "")).toLowerCase()
      const score = words.filter((w) => text.includes(w)).length
      return { m, score }
    })
    return scored
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.m)
  }

  /** Workdir'e göre listele (project + global, yeniden eskiye) */
  list(workdir?: string): Memory[] {
    const rows = listMemories(undefined, workdir)
    return rows.map((r) => {
      const m: Memory = {
        id:        r.id,
        content:   r.content,
        category:  r.category as Category,
        scope:     r.scope as Scope,
        timestamp: r.timestamp,
        source:    r.source as Source,
      }
      if (r.project !== null && r.project !== undefined) m.project = r.project
      if (r.tags)  m.tags = JSON.parse(r.tags) as string[]
      return m
    })
  }

  /** Sil */
  clear(scope?: Scope, workdir?: string): number {
    const before = this.list(workdir).length
    clearMemories(scope ?? "all", workdir)
    return before - this.list(workdir).length
  }

  /** Human-readable markdown export */
  toMarkdown(workdir: string): string {
    const entries = this.list(workdir)
    if (!entries.length) return "# Aurict Memory\n\n_(empty)_\n"

    const sections: Record<string, Memory[]> = {}
    for (const m of entries) {
      const key = m.scope === "project" ? "Project" : "Global"
      sections[key] = sections[key] ?? []
      sections[key]!.push(m)
    }

    const lines = ["# Aurict Memory\n"]
    for (const [sec, mems] of Object.entries(sections)) {
      lines.push(`## ${sec}\n`)
      for (const m of mems) {
        const date = new Date(m.timestamp).toISOString().slice(0, 10)
        lines.push(`- [${m.category}] ${m.content}  _(${date}, ${m.source})_`)
      }
      lines.push("")
    }
    return lines.join("\n")
  }

  /** .aurict/memory.md dosyasına yaz */
  exportToFile(workdir: string): void {
    try {
      const dir  = join(workdir, ".aurict")
      mkdirSync(dir, { recursive: true })
      writeFileSync(join(dir, "memory.md"), this.toMarkdown(workdir), "utf8")
    } catch (error) {
      console.warn(`[aurict] memory export failed for ${workdir}`, error)
    }
  }
}

function normalizeContent(content: string): string {
  return content.toLocaleLowerCase().replace(/\s+/g, " ").replace(/[.!?]+$/g, "").trim()
}

function keywords(query: string): string[] {
  return Array.from(new Set(
    query.toLocaleLowerCase().match(/[\p{L}\p{N}_-]{3,}/gu) ?? [],
  ))
}

function relevanceScore(memory: Memory, words: string[]): number {
  if (words.length === 0) return 0
  const text = `${memory.content} ${(memory.tags ?? []).join(" ")}`.toLocaleLowerCase()
  const overlap = words.reduce((score, word) => score + (text.includes(word) ? 1 : 0), 0)
  const projectBoost = memory.scope === "project" ? 0.25 : 0
  return overlap / words.length + projectBoost
}

export const memoryStore = new MemoryStore()
