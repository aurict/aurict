import React, { useState, useMemo } from "react"
import { Box, Text, useInput } from "ink"
import { useTheme } from "../utils/theme.js"
import { Typo } from "./design-system/index.js"
import { SessionManager } from "@aurict/core"
import type { Session } from "@aurict/core"

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = "all" | "today" | "week"

interface SearchHit {
  session:  Session
  snippet:  string
  score:    number
}

interface Props {
  onSelect: (sessionId: string, msgs: Array<{ role: "user" | "assistant"; content: string }>) => void
  onClose:  () => void
}

// ── Fuzzy match ───────────────────────────────────────────────────────────────

function fuzzyScore(text: string, query: string): number {
  if (!query) return 1
  const t = text.toLowerCase()
  const q = query.toLowerCase()
  if (t.includes(q)) return 2
  let ti = 0; let qi = 0; let matched = 0
  while (ti < t.length && qi < q.length) {
    if (t[ti] === q[qi]) { matched++; qi++ }
    ti++
  }
  return qi === q.length ? matched / q.length : 0
}

function highlight(text: string, query: string): Array<{ s: string; bold: boolean }> {
  if (!query) return [{ s: text, bold: false }]
  const q = query.toLowerCase()
  const result: Array<{ s: string; bold: boolean }> = []
  let i = 0
  while (i < text.length) {
    const sub = text.slice(i).toLowerCase()
    if (sub.startsWith(q)) {
      result.push({ s: text.slice(i, i + q.length), bold: true })
      i += q.length
    } else {
      const last = result[result.length - 1]
      if (last && !last.bold) { last.s += text[i] }
      else { result.push({ s: text[i]!, bold: false }) }
      i++
    }
  }
  return result
}

// ── Time helpers ──────────────────────────────────────────────────────────────

function isToday(ts: number): boolean {
  const d = new Date(ts); const n = new Date()
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate()
}

function isThisWeek(ts: number): boolean {
  return Date.now() - ts < 7 * 24 * 60 * 60 * 1000
}

function fmtDate(ts: number): string {
  const d = new Date(ts)
  const now = new Date()
  if (isToday(ts)) {
    return `${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}`
  }
  if (isThisWeek(ts)) {
    return ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getDay()]!
  }
  return `${d.getMonth()+1}/${d.getDate()}`
}

// ── Component ─────────────────────────────────────────────────────────────────

export function QuickSearch({ onSelect, onClose }: Props) {
  const theme = useTheme()
  const [query,  setQuery]  = useState("")
  const [tab,    setTab]    = useState<Tab>("all")
  const [cursor, setCursor] = useState(0)

  // Load all sessions with their parts (for snippet extraction)
  const allSessions = useMemo(() => SessionManager.list().sort((a, b) => b.updatedAt - a.updatedAt), [])

  // Filter by tab
  const tabFiltered = useMemo(() => {
    switch (tab) {
      case "today": return allSessions.filter(s => isToday(s.updatedAt))
      case "week":  return allSessions.filter(s => isThisWeek(s.updatedAt))
      default:      return allSessions
    }
  }, [allSessions, tab])

  // Search
  const hits = useMemo((): SearchHit[] => {
    return tabFiltered
      .map((session): SearchHit => {
        const titleText = session.title ?? "(untitled)"
        const parts     = SessionManager.getParts(session.id)
        // Build a combined text from first user/assistant messages for snippet
        const textParts = parts
          .filter(p => p.role === "user" || p.role === "assistant")
          .slice(0, 10)
          .map(p => p.content)
          .join(" ")

        const combined = `${titleText} ${textParts}`
        const score    = fuzzyScore(combined, query)

        // Build snippet: first match context (50 chars each side)
        let snippet = titleText
        if (query && textParts) {
          const idx = textParts.toLowerCase().indexOf(query.toLowerCase())
          if (idx !== -1) {
            const start = Math.max(0, idx - 25)
            const end   = Math.min(textParts.length, idx + query.length + 25)
            snippet = (start > 0 ? "…" : "") + textParts.slice(start, end).replace(/\n/g, " ") + (end < textParts.length ? "…" : "")
          } else {
            snippet = textParts.slice(0, 50).replace(/\n/g, " ")
          }
        }

        return { session, snippet, score }
      })
      .filter(h => h.score > 0 || !query)
      .sort((a, b) => b.score - a.score || b.session.updatedAt - a.session.updatedAt)
      .slice(0, 12)
  }, [tabFiltered, query])

  // Clamp cursor
  const clampedCursor = Math.min(cursor, Math.max(0, hits.length - 1))

  useInput((input, key) => {
    if (key.escape) { onClose(); return }

    if (key.upArrow)   { setCursor(c => Math.max(0, c - 1)); return }
    if (key.downArrow) { setCursor(c => Math.min(hits.length - 1, c + 1)); return }

    if (key.return) {
      const hit = hits[clampedCursor]
      if (!hit) { onClose(); return }
      const parts = SessionManager.getParts(hit.session.id)
      const msgs  = parts
        .filter(p => p.role === "user" || p.role === "assistant")
        .map(p => ({ role: p.role as "user" | "assistant", content: p.content }))
      onSelect(hit.session.id, msgs)
      return
    }

    // Tab switching: Ctrl+1/2/3
    if (key.ctrl && input === "1") { setTab("all"); setCursor(0); return }
    if (key.ctrl && input === "2") { setTab("today"); setCursor(0); return }
    if (key.ctrl && input === "3") { setTab("week"); setCursor(0); return }

    // Text input
    if (key.backspace || key.delete) {
      setQuery(q => q.slice(0, -1)); setCursor(0); return
    }
    if (!key.ctrl && !key.meta && !key.escape && !key.return && input && input.length === 1) {
      setQuery(q => q + input); setCursor(0)
    }
  })

  const TABS: Array<{ id: Tab; label: string }> = [
    { id: "all",   label: "All" },
    { id: "today", label: "Today" },
    { id: "week",  label: "This Week" },
  ]

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={theme.accent}
      paddingX={1}
      width={70}
    >
      {/* Header */}
      <Box justifyContent="space-between" marginBottom={0}>
        <Typo variant="bodyEmphasis" tone="primary">Quick Search</Typo>
        <Typo variant="caption" tone="muted">Esc close  ↑↓ navigate  Enter open</Typo>
      </Box>

      {/* Search input */}
      <Box marginBottom={0}>
        <Text color={theme.accent}>❯ </Text>
        <Text color={theme.textPrimary}>{query || " "}</Text>
        <Text color={theme.accent}>▋</Text>
      </Box>

      {/* Tabs */}
      <Box gap={2} marginBottom={0}>
        {TABS.map((t, i) => (
          <Text
            key={t.id}
            color={tab === t.id ? theme.accent : theme.textDim}
            bold={tab === t.id}
          >
            {`^${i+1} ${t.label}`}
          </Text>
        ))}
      </Box>

      {/* Divider */}
      <Text color={theme.borderDim}>{"─".repeat(66)}</Text>

      {/* Results */}
      {hits.length === 0 && (
        <Typo variant="body" tone="muted">No sessions found.</Typo>
      )}
      {hits.map((hit, i) => {
        const selected = i === clampedCursor
        const titleParts = highlight(hit.session.title ?? "(untitled)", query)
        return (
          <Box key={hit.session.id} flexDirection="column" marginBottom={0}>
            <Box gap={1}>
              <Text color={selected ? theme.accent : theme.borderDim}>
                {selected ? "▶" : " "}
              </Text>
              <Box flexGrow={1}>
                {titleParts.map((p, j) => (
                  <Text
                    key={j}
                    color={selected ? theme.textPrimary : theme.textSecondary}
                    bold={p.bold}
                  >{p.s}</Text>
                ))}
              </Box>
              <Text color={theme.textDim} dimColor>{fmtDate(hit.session.updatedAt)}</Text>
            </Box>
            {selected && hit.snippet && hit.snippet !== (hit.session.title ?? "(untitled)") && (
              <Box marginLeft={3}>
                <Text color={theme.textDim} dimColor wrap="truncate-end">{hit.snippet}</Text>
              </Box>
            )}
          </Box>
        )
      })}
    </Box>
  )
}
