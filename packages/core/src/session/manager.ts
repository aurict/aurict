import { createSession, getSession, listSessions, updateSession, addPart, getSessionParts, getSessionPartsCount, getSessionPartsTail, recordTurn as dbRecordTurn, listSessionsWithStats, getSessionStats, searchSessions as dbSearchSessions } from "../storage/queries.js"
import type { Session, Part, SessionConfig } from "./types.js"
import type { SessionStats, SessionSearchResult } from "../storage/queries.js"
import { hooks } from "../hook/emitter.js"

function newId(): string {
  return crypto.randomUUID()
}

export const SessionManager = {
  create(cfg: SessionConfig, opts: { title?: string; parentId?: string } = {}): string {
    const id = newId()
    createSession({
      id,
      config: JSON.stringify(cfg),
      ...(opts.title !== undefined ? { title: opts.title } : {}),
      ...(opts.parentId !== undefined ? { parentId: opts.parentId } : {}),
    })
    hooks.emit("v1.session.start", { sessionId: id })
    return id
  },

  get(id: string): Session | undefined {
    return getSession(id) ?? undefined
  },

  list(): Session[] {
    return listSessions()
  },

  async end(id: string, reason = "user"): Promise<void> {
    updateSession(id, { status: "complete" })
    await hooks.emit("v1.session.end", { sessionId: id, reason })
  },

  ensureExists(id: string, cfg: SessionConfig): void {
    if (!getSession(id)) {
      createSession({ id, config: JSON.stringify(cfg) })
    }
  },

  addPart(data: {
    sessionId: string
    role: string
    type: string
    content: string
    tokens?: number
  }): string {
    // COUNT(*) instead of fetching all rows just to get the length
    const sequence = getSessionPartsCount(data.sessionId)
    const id = newId()
    addPart({ id, sequence, ...data })
    return id
  },

  getParts(sessionId: string): Part[] {
    return getSessionParts(sessionId)
  },

  getPartsTail(sessionId: string, limit: number): Part[] {
    return getSessionPartsTail(sessionId, limit)
  },

  getPartsCount(sessionId: string): number {
    return getSessionPartsCount(sessionId)
  },

  /** LLM turn'ü bitti — token ve maliyet birikimini güncelle */
  recordTurn(sessionId: string, data: {
    inputTokens:  number
    outputTokens: number
    cacheTokens:  number
    costUsd:      number
    model:        string
  }): void {
    try { dbRecordTurn(sessionId, data) } catch { /* istatistik hatası agent'ı durdurmamalı */ }
  },

  /** Maliyet istatistikleriyle tüm session listesi */
  listWithStats(limit?: number): SessionStats[] {
    return listSessionsWithStats(limit)
  },

  /** Tek session'ın maliyet özeti */
  getStats(sessionId: string): SessionStats | undefined {
    return getSessionStats(sessionId)
  },

  /** Part içeriklerinde tam metin arama */
  search(query: string, limit?: number): SessionSearchResult[] {
    return dbSearchSessions(query, limit)
  },
}
