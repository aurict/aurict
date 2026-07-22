import { resolve } from "node:path"
import { SessionManager } from "./manager.js"
import type { Session, Part, SessionConfig } from "./types.js"
import type { SessionSearchResult } from "../storage/queries.js"

export interface SessionRecallResult extends SessionSearchResult {
  stale: boolean
}

export function searchProjectSessions(workdir: string, query: string, limit = 10): SessionRecallResult[] {
  const normalized = resolve(workdir)
  return SessionManager.search(query, Math.max(limit * 5, 30))
    .filter(result => {
      const session = SessionManager.get(result.sessionId)
      return session ? isSessionInProject(session, normalized) : false
    })
    .slice(0, limit)
    .map(result => ({ ...result, stale: Date.now() - result.updatedAt > 30 * 24 * 60 * 60_000 }))
}

export function readProjectSessionExcerpt(
  workdir: string,
  sessionId: string,
  query = "",
  maxParts = 12,
): { sessionId: string; title: string | null; updatedAt: number; stale: boolean; parts: Array<Pick<Part, "role" | "content" | "createdAt">> } {
  const session = SessionManager.get(sessionId)
  if (!session || !isSessionInProject(session, resolve(workdir))) throw new Error("Session was not found in the current project")
  const all = SessionManager.getParts(sessionId)
  const words = query.toLocaleLowerCase().split(/\s+/).filter(Boolean)
  const ranked = words.length
    ? all.map((part, index) => ({
        part, index,
        score: words.reduce((sum, word) => sum + (part.content.toLocaleLowerCase().includes(word) ? 1 : 0), 0),
      })).filter(item => item.score > 0).sort((a, b) => b.score - a.score || b.index - a.index).slice(0, maxParts).sort((a, b) => a.index - b.index).map(item => item.part)
    : all.slice(-maxParts)
  return {
    sessionId,
    title: session.title,
    updatedAt: session.updatedAt,
    stale: Date.now() - session.updatedAt > 30 * 24 * 60 * 60_000,
    parts: ranked.map(part => ({ role: part.role, content: part.content.slice(0, 4_000), createdAt: part.createdAt })),
  }
}

export function isSessionInProject(session: Pick<Session, "config">, workdir: string): boolean {
  if (!session.config) return false
  try {
    const config = JSON.parse(session.config) as SessionConfig
    return typeof config.workdir === "string" && resolve(config.workdir) === resolve(workdir)
  } catch { return false }
}
