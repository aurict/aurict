import { join } from "node:path"
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs"
import type { ScratchpadState, ScratchpadHistoryEntry } from "./types.js"
import { EMPTY_SCRATCHPAD } from "./types.js"

const MAX_HISTORY = 20

function sessionDir(workdir: string, sessionId: string): string {
  return join(workdir, ".aurict", "sessions", sessionId.slice(0, 8))
}

function scratchpadPath(workdir: string, sessionId: string): string {
  return join(sessionDir(workdir, sessionId), "scratchpad.json")
}

class ScratchpadStore {
  read(sessionId: string, workdir: string): ScratchpadState | null {
    try {
      const p = scratchpadPath(workdir, sessionId)
      if (!existsSync(p)) return null
      return JSON.parse(readFileSync(p, "utf8")) as ScratchpadState
    } catch { return null }
  }

  update(
    sessionId: string,
    workdir:   string,
    patch:     Partial<Omit<ScratchpadState, "sessionId" | "updatedAt" | "history">>,
  ): ScratchpadState {
    const current = this.read(sessionId, workdir) ?? { ...EMPTY_SCRATCHPAD, sessionId }
    const historyEntries: ScratchpadHistoryEntry[] = []

    for (const [field, next] of Object.entries(patch)) {
      const prev = (current as unknown as Record<string, unknown>)[field]
      historyEntries.push({ ts: Date.now(), field, prev, next })
    }

    const merged: ScratchpadState = {
      ...current,
      ...patch,
      sessionId,
      updatedAt: Date.now(),
      history: [
        ...current.history,
        ...historyEntries,
      ].slice(-MAX_HISTORY),
    }

    this.persist(sessionId, workdir, merged)
    return merged
  }

  clear(sessionId: string, workdir: string): void {
    const fresh: ScratchpadState = { ...EMPTY_SCRATCHPAD, sessionId, updatedAt: Date.now() }
    this.persist(sessionId, workdir, fresh)
  }

  /** Compaction sonrası sisteme inject edilecek prompt bölümü */
  toPromptSection(state: ScratchpadState): string {
    if (!state.hypothesis && !state.nextStep) return ""

    const lines: string[] = ["## Reasoning State (preserved through compaction)"]
    if (state.hypothesis)          lines.push(`Hypothesis: ${state.hypothesis}`)
    if (state.confidence)          lines.push(`Confidence: ${state.confidence}`)
    if (state.evidence.for.length) lines.push(`Evidence for: ${state.evidence.for.join(" | ")}`)
    if (state.evidence.against.length) lines.push(`Evidence against: ${state.evidence.against.join(" | ")}`)
    if (state.assumptions.length)  lines.push(`Assumptions: ${state.assumptions.join(" | ")}`)
    if (state.blockers.length)     lines.push(`Blockers: ${state.blockers.join(" | ")}`)
    if (state.nextStep)            lines.push(`Next step: ${state.nextStep}`)

    return lines.join("\n")
  }

  private persist(sessionId: string, workdir: string, state: ScratchpadState): void {
    try {
      const dir = sessionDir(workdir, sessionId)
      mkdirSync(dir, { recursive: true })
      writeFileSync(scratchpadPath(workdir, sessionId), JSON.stringify(state, null, 2), "utf8")
    } catch { /* disk yazma hatası asla main flow'u durdurmaz */ }
  }
}

export const scratchpadStore = new ScratchpadStore()
