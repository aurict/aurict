import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { join } from "node:path"
import { homedir } from "node:os"

const DIR  = join(homedir(), ".aurict", "stash")
const FILE = join(DIR, "stashes.json")

export interface StashEntry {
  id:        string
  name:      string
  content:   string
  createdAt: number
}

function load(): StashEntry[] {
  try { return JSON.parse(readFileSync(FILE, "utf8")) as StashEntry[] }
  catch { return [] }
}

function save(entries: StashEntry[]): void {
  mkdirSync(DIR, { recursive: true })
  writeFileSync(FILE, JSON.stringify(entries, null, 2), "utf8")
}

function slug(content: string): string {
  return content.trim().slice(0, 30).replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-]/g, "") || "stash"
}

export function stashPush(content: string, name?: string): StashEntry {
  const entries = load()
  const entry: StashEntry = {
    id:        crypto.randomUUID(),
    name:      name ?? slug(content),
    content,
    createdAt: Date.now(),
  }
  entries.unshift(entry)
  save(entries.slice(0, 50))  // keep last 50
  return entry
}

export function stashList(): StashEntry[] {
  return load()
}

export function stashPop(idOrIndex?: string): StashEntry | null {
  const entries = load()
  if (entries.length === 0) return null
  let idx = 0
  if (idOrIndex) {
    const n = parseInt(idOrIndex, 10)
    if (!isNaN(n)) { idx = n }
    else { idx = entries.findIndex(e => e.id === idOrIndex || e.name === idOrIndex) }
    if (idx < 0 || idx >= entries.length) return null
  }
  const [entry] = entries.splice(idx, 1)
  save(entries)
  return entry ?? null
}

export function stashDrop(idOrIndex: string): boolean {
  const entries = load()
  const n = parseInt(idOrIndex, 10)
  const idx = !isNaN(n) ? n : entries.findIndex(e => e.id === idOrIndex || e.name === idOrIndex)
  if (idx < 0 || idx >= entries.length) return false
  entries.splice(idx, 1)
  save(entries)
  return true
}
