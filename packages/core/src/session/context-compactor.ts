import type { CoreMessage } from "ai"
import { countTokens } from "../provider/tokenizer.js"
import { TOOL_OUTPUT_MAX_CHARS } from "./compaction.js"

export type ContextType = "code" | "tool_output" | "conversation" | "system"

export interface ContextHealth {
  total:         number
  byType:        Record<ContextType, number>
  toolOutputPct: number
  codePct:       number
}

export function extractText(msg: CoreMessage): string {
  if (typeof msg.content === "string") return msg.content
  if (Array.isArray(msg.content)) {
    return msg.content
      .map((p) => {
        if (typeof p === "string") return p
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const part = p as any
        if (part.type === "text")        return part.text ?? ""
        if (part.type === "tool-result") return JSON.stringify(part.result ?? "")
        return ""
      })
      .join(" ")
  }
  return JSON.stringify(msg.content)
}

export function classifyMessage(msg: CoreMessage): ContextType {
  if (msg.role === "system") return "system"
  if (msg.role === "tool")   return "tool_output"
  const text = extractText(msg)
  if (/```[\s\S]{20,}```/.test(text)) return "code"
  return "conversation"
}

// Mesajın bağlamsal önem skoru (0–100).
// Yüksek skor = kırpma sırasında daha uzun korunur.
export function importanceScore(msg: CoreMessage, allMessages: CoreMessage[], idx: number): number {
  let score = 50
  const text = extractText(msg)

  // Recency: son %20 → +30, son %40 → +20, son %60 → +10
  const rel = idx / Math.max(1, allMessages.length - 1)
  if (rel > 0.8)      score += 30
  else if (rel > 0.6) score += 20
  else if (rel > 0.4) score += 10

  // Tür ağırlığı
  const type = classifyMessage(msg)
  if (type === "code")        score += 20
  if (type === "system")      score += 15
  if (type === "tool_output") score -= 20
  if (type === "conversation" && msg.role === "user") score += 10

  // Uzunluk cezası: çok kısa (gürültü) veya çok uzun (büyük raw output)
  const tokens = countTokens(text) + 4
  if (tokens < 15)   score -= 20
  if (tokens > 3000) score -= 10

  // ─── Faz 3: Gelişmiş önem skorlaması ──────────────────────────────────────

  // Error chain detection: hata mesajları yüksek öncelik
  if (/error|failed|exception|cannot|unable/i.test(text)) {
    score += 25
  }

  // Fix detection: düzeltme mesajları çok yüksek öncelik
  if (/fixed|resolved|solved|changed|updated|corrected/i.test(text)) {
    // Önceki mesajlarda hata var mı kontrol et
    const hasPriorError = allMessages.slice(0, idx).some(m =>
      /error|failed|exception/i.test(extractText(m))
    )
    if (hasPriorError) score += 35
  }

  // Decision detection: karar mesajları yüksek öncelik
  if (/decided|chose|selected|let'?s use|we'?ll use|going with/i.test(text)) {
    score += 20
  }

  // User correction: kullanıcı agent'ı düzelttiyse çok yüksek öncelik
  if (msg.role === "user" && /\bno\b|\bwrong\b|\bincorrect\b|don'?t\b|\bstop\b|\bactually\b/i.test(text)) {
    score += 40
  }

  // File path density: çok fazla dosya referansı = önemli
  const pathMatches = text.match(/\b[\w-]+\.(ts|tsx|js|jsx|py|go|rs|md|json)\b/g)
  if (pathMatches && pathMatches.length > 3) {
    score += Math.min(15, pathMatches.length * 3)
  }

  return Math.max(0, Math.min(100, score))
}

export function measureContextHealth(messages: CoreMessage[]): ContextHealth {
  const byType: Record<ContextType, number> = { code: 0, tool_output: 0, conversation: 0, system: 0 }
  let total = 0

  for (const msg of messages) {
    const type   = classifyMessage(msg)
    const tokens = countTokens(extractText(msg)) + 4
    byType[type] += tokens
    total        += tokens
  }

  return {
    total,
    byType,
    toolOutputPct: total > 0 ? byType.tool_output / total : 0,
    codePct:       total > 0 ? byType.code / total : 0,
  }
}

// Hedef bütçeye uyana kadar düşük önemli mesajları kırp / kısalt.
export function smartCompact(messages: CoreMessage[], budget: number): CoreMessage[] {
  if (messages.length === 0) return []

  const annotated = messages.map((msg, idx) => ({
    msg,
    type:      classifyMessage(msg),
    tokens:    countTokens(extractText(msg)) + 4,
    score:     importanceScore(msg, messages, idx),
    trimmed:   false,
  }))

  let total = annotated.reduce((s, a) => s + a.tokens, 0)
  if (total <= budget) return messages

  // Aşama 1: tool_output'ları kırp (önem skoruna bakılmaksızın)
  for (const item of annotated) {
    if (total <= budget) break
    if (item.type !== "tool_output") continue

    const msg = item.msg
    if (msg.role === "tool" && Array.isArray(msg.content)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pruned = (msg.content as any[]).map((p) => {
        const str = JSON.stringify(p.result ?? "")
        if (str.length <= TOOL_OUTPUT_MAX_CHARS) return p
        return { ...p, result: str.slice(0, TOOL_OUTPUT_MAX_CHARS) + "… [truncated]" }
      })
      const newMsg    = { ...msg, content: pruned } as CoreMessage
      const newTokens = countTokens(extractText(newMsg)) + 4
      total          -= item.tokens - newTokens
      item.msg        = newMsg
      item.tokens     = newTokens
      item.trimmed    = true
    }
  }

  // Aşama 2: önem skoruna göre konuşma mesajlarını kısalt (en düşük score'dan başla)
  const sortedByScore = annotated
    .map((item, idx) => ({ item, idx }))
    .filter(({ item }) => item.type === "conversation" && !item.trimmed)
    .sort((a, b) => a.item.score - b.item.score)

  for (const { item } of sortedByScore) {
    if (total <= budget) break
    const text = extractText(item.msg)
    if (text.length <= 100) continue
    const maxLen    = Math.max(100, Math.floor(text.length * 0.3))
    const shortened = text.slice(0, maxLen) + "… [truncated]"
    const newMsg    = { ...item.msg, content: shortened } as CoreMessage
    const newTokens = countTokens(shortened) + 4
    total          -= item.tokens - newTokens
    item.msg        = newMsg
    item.tokens     = newTokens
  }

  return annotated.map((a) => a.msg)
}

// Compact summary içindeki kaynak dosya yollarını çıkar (post-compact re-injection için).
const SRC_EXT = "ts|tsx|js|jsx|mts|mjs|py|go|rs|java|rb|php|cs|cpp|c|h|json|yaml|yml"
const PATH_RE = new RegExp(
  `(?:^|\\s)([./][^\\s"'\`<>,;:()]+\\.(?:${SRC_EXT}))` +
  `|(?:^|\\s)((?:src|packages|lib|app|apps)/[^\\s"'\`<>,;:()]+\\.(?:${SRC_EXT}))`,
  "gm"
)

export function extractFilePaths(text: string): string[] {
  const found = new Set<string>()
  let m: RegExpExecArray | null
  while ((m = PATH_RE.exec(text)) !== null) {
    const p = (m[1] ?? m[2] ?? "").trim().replace(/[,;.)]+$/, "")
    if (p && p.length > 3) found.add(p)
  }
  return [...found].slice(0, 8)
}
