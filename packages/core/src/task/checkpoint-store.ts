/**
 * CheckpointStore — Çok adımlı görev ilerleme takibi.
 *
 * Veriler bellek içinde tutulur ve ~/.aurict/checkpoints.json dosyasına
 * persist edilir. Context compaction olsa bile checkpoint'ler kaybolmaz.
 * SessionId bazlı izolasyon — farklı session'lar birbirini etkilemez.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { join, dirname }                                       from "node:path"
import { homedir }                                             from "node:os"

// ── Tipler ────────────────────────────────────────────────────────────────────

export type StepStatus = "pending" | "done" | "skipped" | "failed"

export interface CheckpointStep {
  id:      string
  label:   string
  status:  StepStatus
  note?:   string
  doneAt?: number
}

export interface CheckpointEntry {
  id:        string
  title:     string
  steps:     CheckpointStep[]
  sessionId: string
  createdAt: number
  updatedAt: number
}

// ── Dosya yolu ────────────────────────────────────────────────────────────────

const STORE_PATH = join(homedir(), ".aurict", "checkpoints.json")

// ── Store sınıfı ──────────────────────────────────────────────────────────────

class CheckpointStore {
  private data = new Map<string, CheckpointEntry>()   // key: `${sessionId}:${id}`
  private loaded = false

  // ── I/O ─────────────────────────────────────────────────────────────────────

  private load() {
    if (this.loaded) return
    this.loaded = true
    if (!existsSync(STORE_PATH)) return
    try {
      const raw     = readFileSync(STORE_PATH, "utf8")
      const entries = JSON.parse(raw) as CheckpointEntry[]
      for (const e of entries) {
        this.data.set(`${e.sessionId}:${e.id}`, e)
      }
    } catch { /* bozuk dosya — boş başla */ }
  }

  private persist() {
    try {
      mkdirSync(dirname(STORE_PATH), { recursive: true })
      writeFileSync(STORE_PATH, JSON.stringify([...this.data.values()], null, 2), "utf8")
    } catch { /* yazma hatası — sessizce geç */ }
  }

  // ── API ──────────────────────────────────────────────────────────────────────

  create(id: string, title: string, stepLabels: string[], sessionId: string): CheckpointEntry {
    this.load()
    const key = `${sessionId}:${id}`
    if (this.data.has(key)) {
      throw new Error(`Checkpoint '${id}' already exists for this session. Use 'read' to check progress or 'clear' to reset.`)
    }

    const steps: CheckpointStep[] = stepLabels.map((label, i) => ({
      id:     `step-${i + 1}`,
      label:  label.trim(),
      status: "pending",
    }))

    const entry: CheckpointEntry = {
      id,
      title,
      steps,
      sessionId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    this.data.set(key, entry)
    this.persist()
    return entry
  }

  private getOrThrow(id: string, sessionId: string): CheckpointEntry {
    this.load()
    const entry = this.data.get(`${sessionId}:${id}`)
    if (!entry) throw new Error(`Checkpoint '${id}' not found. Create it first with action='create'.`)
    return entry
  }

  tick(id: string, stepId: string, note: string | undefined, sessionId: string): CheckpointEntry {
    const entry = this.getOrThrow(id, sessionId)
    const step  = entry.steps.find((s) => s.id === stepId || s.label.toLowerCase().startsWith(stepId.toLowerCase()))
    if (!step) throw new Error(`Step '${stepId}' not found in checkpoint '${id}'.`)
    step.status = "done"
    step.doneAt = Date.now()
    if (note) step.note = note
    entry.updatedAt = Date.now()
    this.persist()
    return entry
  }

  markStep(id: string, stepId: string, status: StepStatus, reason: string | undefined, sessionId: string): CheckpointEntry {
    const entry = this.getOrThrow(id, sessionId)
    const step  = entry.steps.find((s) => s.id === stepId || s.label.toLowerCase().startsWith(stepId.toLowerCase()))
    if (!step) throw new Error(`Step '${stepId}' not found in checkpoint '${id}'.`)
    step.status = status
    step.doneAt = Date.now()
    if (reason) step.note = reason
    entry.updatedAt = Date.now()
    this.persist()
    return entry
  }

  read(id: string, sessionId: string): CheckpointEntry | null {
    this.load()
    return this.data.get(`${sessionId}:${id}`) ?? null
  }

  readAll(sessionId: string): CheckpointEntry[] {
    this.load()
    return [...this.data.values()].filter((e) => e.sessionId === sessionId)
  }

  clear(id: string, sessionId: string): boolean {
    this.load()
    const deleted = this.data.delete(`${sessionId}:${id}`)
    if (deleted) this.persist()
    return deleted
  }

  clearAll(sessionId: string): number {
    this.load()
    const keys = [...this.data.keys()].filter((k) => k.startsWith(`${sessionId}:`))
    for (const k of keys) this.data.delete(k)
    if (keys.length > 0) this.persist()
    return keys.length
  }

  // ── Formatla ─────────────────────────────────────────────────────────────────

  format(entry: CheckpointEntry): string {
    const done    = entry.steps.filter((s) => s.status === "done").length
    const skipped = entry.steps.filter((s) => s.status === "skipped").length
    const failed  = entry.steps.filter((s) => s.status === "failed").length
    const total   = entry.steps.length

    const pct = total > 0 ? Math.round((done / total) * 100) : 0

    const lines: string[] = [
      `Checkpoint: ${entry.id}`,
      `Title:      ${entry.title}`,
      `Progress:   ${done}/${total} done (${pct}%)${skipped > 0 ? `  ${skipped} skipped` : ""}${failed > 0 ? `  ${failed} failed` : ""}`,
      "",
    ]

    // Mevcut adım — ilk pending
    const currentIdx = entry.steps.findIndex((s) => s.status === "pending")

    for (let i = 0; i < entry.steps.length; i++) {
      const s       = entry.steps[i]!
      const isCur   = i === currentIdx
      const icon    = s.status === "done"    ? "✓"
                    : s.status === "skipped" ? "○"
                    : s.status === "failed"  ? "✗"
                    : isCur                  ? "▶"
                    :                         "○"
      const noteStr = s.note ? `  → ${s.note}` : ""
      const cur     = isCur ? " ← CURRENT" : ""
      lines.push(`  ${icon} ${s.id.padEnd(8)} ${s.label}${noteStr}${cur}`)
    }

    return lines.join("\n")
  }
}

export const checkpointStore = new CheckpointStore()
