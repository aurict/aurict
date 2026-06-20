import { join } from "node:path"
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs"

export interface DiagnosticsEntry {
  id:          string
  ts:          number
  type:        "tool_error" | "agent_error" | "provider_error"
  tool?:       string
  error:       string
  resolved:    boolean
  resolution?: string
}

const MAX_DIAGNOSTICS_CHARS  = 1_000
const MAX_UNRESOLVED_DISPLAY = 5
const MAX_ENTRIES            = 200

function diagDir(workdir: string): string {
  return join(workdir, ".aurict", "diagnostics")
}

function jsonPath(workdir: string): string {
  return join(diagDir(workdir), "errors.json")
}

function summaryPath(workdir: string): string {
  return join(diagDir(workdir), "summary.md")
}

function load(workdir: string): DiagnosticsEntry[] {
  const p = jsonPath(workdir)
  if (!existsSync(p)) return []
  try { return JSON.parse(readFileSync(p, "utf8")) as DiagnosticsEntry[] }
  catch { return [] }
}

function save(workdir: string, entries: DiagnosticsEntry[]): void {
  const dir = diagDir(workdir)
  mkdirSync(dir, { recursive: true })
  writeFileSync(jsonPath(workdir), JSON.stringify(entries, null, 2), "utf8")
  regenerateSummary(workdir, entries)
}

function regenerateSummary(workdir: string, entries: DiagnosticsEntry[]): void {
  const unresolved = entries.filter(e => !e.resolved)
  const resolved   = entries.filter(e =>  e.resolved)

  const fmt = (e: DiagnosticsEntry) => {
    const date = new Date(e.ts).toISOString().slice(0, 10)
    const tool = e.tool ? `${e.tool}: ` : ""
    return `- [${e.id.slice(0, 8)}] ${date} ${tool}${e.error.slice(0, 120)}`
  }

  const lines = [
    "# Aurict Diagnostics",
    "",
    `## Unresolved (${unresolved.length})`,
    ...(unresolved.length > 0 ? unresolved.map(fmt) : ["_(none)_"]),
    "",
    `## Resolved (${resolved.length})`,
    ...(resolved.length > 0 ? resolved.slice(-20).map(fmt) : ["_(none)_"]),
  ]

  writeFileSync(summaryPath(workdir), lines.join("\n"), "utf8")
}

class DiagnosticsStore {
  record(workdir: string, entry: Omit<DiagnosticsEntry, "id" | "ts" | "resolved">): DiagnosticsEntry {
    const entries = load(workdir)
    const newEntry: DiagnosticsEntry = {
      id:       crypto.randomUUID(),
      ts:       Date.now(),
      resolved: false,
      ...entry,
    }
    // Cap total entries, keep most recent
    const trimmed = [...entries, newEntry].slice(-MAX_ENTRIES)
    save(workdir, trimmed)
    return newEntry
  }

  resolve(workdir: string, id: string, resolution?: string): boolean {
    const entries = load(workdir)
    const idx = entries.findIndex(e => e.id.startsWith(id))
    if (idx === -1) return false
    entries[idx]!.resolved = true
    if (resolution) entries[idx]!.resolution = resolution
    save(workdir, entries)
    return true
  }

  getUnresolved(workdir: string, limit = MAX_UNRESOLVED_DISPLAY): DiagnosticsEntry[] {
    return load(workdir).filter(e => !e.resolved).slice(-limit)
  }

  list(workdir: string): DiagnosticsEntry[] {
    return load(workdir)
  }

  toPromptSection(workdir: string): string {
    const unresolved = this.getUnresolved(workdir)
    if (unresolved.length === 0) return ""

    const lines = unresolved.map((e) => {
      const date = new Date(e.ts).toISOString().slice(0, 10)
      const tool = e.tool ? `[${e.tool}] ` : ""
      return `- ${date} ${tool}${e.error.slice(0, 120)}`
    })

    let result = `## Recent Unresolved Errors\n\nThese errors occurred in this project and have not been marked resolved:\n\n${lines.join("\n")}`
    if (result.length > MAX_DIAGNOSTICS_CHARS) {
      result = result.slice(0, MAX_DIAGNOSTICS_CHARS) + "\n[... truncated]"
    }
    return result
  }
}

export const diagnosticsStore = new DiagnosticsStore()
