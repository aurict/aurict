import { readFileSync, writeFileSync, mkdirSync, unlinkSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { homedir } from "node:os"

const DIR        = join(homedir(), ".aurict")
const CRASH_DIR  = join(DIR, "crash")
const CRASH_NOTICE_FILE = join(DIR, "crash-notice-seen")

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
  try { unlinkSync(CRASH_NOTICE_FILE) } catch { /* ignore */ }
}

export function hasPendingCrashReport(): boolean {
  try {
    return readdirSync(CRASH_DIR).some(f => f.endsWith(".json"))
  } catch {
    return false
  }
}

function latestCrashTimestamp(): number | undefined {
  try {
    const timestamps = readdirSync(CRASH_DIR)
      .map((file) => file.match(/^crash-(\d+)\.json$/)?.[1])
      .filter((value): value is string => Boolean(value))
      .map(Number)
      .filter(Number.isFinite)
    return timestamps.length > 0 ? Math.max(...timestamps) : undefined
  } catch {
    return undefined
  }
}

export function isCrashReportUnseen(latest: number | undefined, seen: number | undefined): boolean {
  return latest !== undefined && (seen === undefined || latest > seen)
}

export function hasUnseenCrashReport(): boolean {
  const latest = latestCrashTimestamp()
  try {
    const seen = Number(readFileSync(CRASH_NOTICE_FILE, "utf8"))
    return isCrashReportUnseen(latest, Number.isFinite(seen) ? seen : undefined)
  } catch {
    return isCrashReportUnseen(latest, undefined)
  }
}

export function markCrashReportsSeen(): void {
  const latest = latestCrashTimestamp()
  if (latest === undefined) return
  try {
    mkdirSync(DIR, { recursive: true })
    writeFileSync(CRASH_NOTICE_FILE, String(latest), "utf8")
  } catch { /* non-fatal */ }
}
