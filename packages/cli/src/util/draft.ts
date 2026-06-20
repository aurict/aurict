import { readFileSync, writeFileSync, mkdirSync, unlinkSync, existsSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { homedir } from "node:os"

const DIR        = join(homedir(), ".aurict")
const DRAFT_FILE = join(DIR, "draft.txt")
const CRASH_DIR  = join(DIR, "crash")

// ── Draft auto-save ───────────────────────────────────────────────────────────

export function saveDraft(text: string): void {
  try {
    mkdirSync(DIR, { recursive: true })
    if (text.trim()) {
      writeFileSync(DRAFT_FILE, text, "utf8")
    } else {
      clearDraft()
    }
  } catch { /* non-fatal */ }
}

export function loadDraft(): string | null {
  try {
    return readFileSync(DRAFT_FILE, "utf8") || null
  } catch {
    return null
  }
}

export function clearDraft(): void {
  try { unlinkSync(DRAFT_FILE) } catch { /* ignore */ }
}

// ── Crash reporting ───────────────────────────────────────────────────────────

export interface CrashReport {
  ts:       number
  message:  string
  stack?:   string
  context?: string
}

export function writeCrashReport(err: unknown, context?: string): string {
  try {
    mkdirSync(CRASH_DIR, { recursive: true })
    const ts   = Date.now()
    const file = join(CRASH_DIR, `crash-${ts}.json`)
    const report: CrashReport = {
      ts,
      message: err instanceof Error ? err.message : String(err),
      ...(err instanceof Error && err.stack ? { stack: err.stack } : {}),
      ...(context !== undefined ? { context } : {}),
    }
    writeFileSync(file, JSON.stringify(report, null, 2), "utf8")
    return file
  } catch {
    return ""
  }
}

export function listCrashReports(): CrashReport[] {
  try {
    return readdirSync(CRASH_DIR)
      .filter(f => f.endsWith(".json"))
      .sort()
      .reverse()
      .slice(0, 10)
      .map(f => {
        try { return JSON.parse(readFileSync(join(CRASH_DIR, f), "utf8")) as CrashReport }
        catch { return null }
      })
      .filter(Boolean) as CrashReport[]
  } catch {
    return []
  }
}

export function clearCrashReports(): void {
  try {
    readdirSync(CRASH_DIR)
      .filter(f => f.endsWith(".json"))
      .forEach(f => { try { unlinkSync(join(CRASH_DIR, f)) } catch { /* ignore */ } })
  } catch { /* ignore */ }
}

export function hasPendingCrashReport(): boolean {
  try {
    return readdirSync(CRASH_DIR).some(f => f.endsWith(".json"))
  } catch {
    return false
  }
}
