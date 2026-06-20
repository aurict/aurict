import { generateText } from "ai"
import { readFile }     from "fs/promises"
import { resolve }      from "path"
import type { CoreMessage } from "ai"
import { ProviderRegistry }   from "../provider/registry.js"
import { countTokens }        from "../provider/tokenizer.js"
import { hooks }              from "../hook/emitter.js"
import {
  smartCompact,
  measureContextHealth,
  importanceScore,
  extractText,
  extractFilePaths,
} from "./context-compactor.js"

// ─── Faz 3: Error Chain Detection ─────────────────────────────────────────────
export interface ErrorChain {
  error: string      // orijinal hata mesajı (verbatim)
  fix: string        // nasıl çözüldüğü
  files: string[]    // ilgili dosyalar
  lesson: string     // LLM'e özet
}

/**
 * Messages içindeki error→fix çiftlerini tespit eder.
 * Compaction sırasında bu zincirler korunur.
 */
export function extractErrorChains(messages: CoreMessage[]): ErrorChain[] {
  const chains: ErrorChain[] = []
  let currentError: string | null = null
  let errorFiles: string[] = []
  let errorMsgStart = -1

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i]!
    const text = extractText(msg)

    // Error detection (sadece tool result'ta, assistant'ın "I see the error" gibi mesajlarında değil)
    if (/error|failed|exception|cannot find|unable to/i.test(text)) {
      if (msg.role === "tool") {
        currentError = text.slice(0, 500)
        errorFiles = extractFilePaths(text)
        errorMsgStart = i
      }
    }

    // Fix detection (assistant mesajında, error'dan sonra)
    // "fixed" kelimesi tek başına yeterli değil, "fixed the" veya "fixed by" gibi kalıplar ara
    if (currentError && msg.role === "assistant" && i > errorMsgStart) {
      if (/fixed the|fixed by|resolved the|solved the|now works|corrected the/i.test(text)) {
        chains.push({
          error: currentError,
          fix: text.slice(0, 500),
          files: errorFiles,
          lesson: `Error "${currentError.slice(0, 100)}..." was fixed by: ${text.slice(0, 200)}`,
        })
        currentError = null
        errorFiles = []
        errorMsgStart = -1
      }
    }
  }

  return chains
}

/**
 * Error chain'leri summary'ye ekler.
 * Compaction sonrası agent bu hataları tekrarlamaz.
 */
export function addProtectedErrors(summary: string, chains: ErrorChain[]): string {
  if (chains.length === 0) return summary

  const section = [
    "\n\n[PROTECTED ERROR CHAINS — DO NOT FORGET]",
    ...chains.slice(0, 5).map((c, i) => `${i + 1}. ${c.lesson}`),
  ].join("\n")

  return summary + section
}

// ─── Constants ────────────────────────────────────────────────────────────────
export const COMPACTION_BUFFER     = 20_000
export const TOOL_OUTPUT_MAX_CHARS =  2_000
export const DEFAULT_TAIL_TURNS    =      2
export const PRUNE_MINIMUM         = 20_000
export const PRUNE_PROTECT         = 40_000
export const DEFAULT_MSG_THRESHOLD =    100

export type CompactionStrategy = "aggressive" | "balanced" | "conservative"

export interface CompactionConfig {
  contextLimit:           number
  maxOutput:              number
  tailTurns:              number
  provider:               string
  model:                  string
  workdir?:               string
  sessionId?:             string
  strategy?:              CompactionStrategy
  messageCountThreshold?: number
}

// ─── Circuit Breaker ──────────────────────────────────────────────────────────
const CB_MAX_FAILURES = 3
const CB_RESET_MS     = 60_000

export type CBStatus = "closed" | "open" | "half-open"
export interface CBState { status: CBStatus; failures: number; lastFailAt: number }

const cb: CBState = { status: "closed", failures: 0, lastFailAt: 0 }

export function getCircuitState(): Readonly<CBState> { return { ...cb } }

function cbRecordSuccess(): void { cb.failures = 0; cb.status = "closed" }

function cbRecordFailure(): void {
  cb.failures++
  cb.lastFailAt = Date.now()
  if (cb.failures >= CB_MAX_FAILURES) cb.status = "open"
}

function cbIsOpen(): boolean {
  if (cb.status === "closed") return false
  if (cb.status === "open" && Date.now() - cb.lastFailAt >= CB_RESET_MS) {
    cb.status = "half-open"
    return false
  }
  return cb.status === "open"
}

// ─── Utilities ────────────────────────────────────────────────────────────────
export function estimateTokens(messages: CoreMessage[]): number {
  return messages.reduce((sum, m) => {
    const text = typeof m.content === "string" ? m.content : JSON.stringify(m.content)
    return sum + countTokens(text) + 4
  }, 0)
}

export function isOverflow(messages: CoreMessage[], cfg: CompactionConfig): boolean {
  const usable = cfg.contextLimit - cfg.maxOutput - COMPACTION_BUFFER
  return estimateTokens(messages) >= usable
}

export function isOverflowByMessages(messages: CoreMessage[], cfg: CompactionConfig): boolean {
  return messages.length >= (cfg.messageCountThreshold ?? DEFAULT_MSG_THRESHOLD)
}

export interface ContextBreakdown {
  total:       number
  byRole:      Record<string, number>
  topMessages: Array<{ preview: string; tokens: number }>
  percentUsed: number
}

export function getContextBreakdown(messages: CoreMessage[], contextWindow: number): ContextBreakdown {
  const byRole: Record<string, number> = {}
  const withTokens: Array<{ preview: string; tokens: number; role: string }> = []

  for (const msg of messages) {
    const text   = typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content)
    const tokens = countTokens(text) + 4
    byRole[msg.role] = (byRole[msg.role] ?? 0) + tokens
    withTokens.push({ preview: text.slice(0, 60).replace(/\n/g, " "), tokens, role: msg.role })
  }

  const total = Object.values(byRole).reduce((s, n) => s + n, 0)
  const topMessages = withTokens
    .sort((a, b) => b.tokens - a.tokens)
    .slice(0, 5)
    .map(({ preview, tokens }) => ({ preview, tokens }))

  return { total, byRole, topMessages, percentUsed: contextWindow > 0 ? total / contextWindow : 0 }
}

// ─── Strategy 1: microCompact ─────────────────────────────────────────────────
// Hiç LLM çağrısı yok. Küçük taşmalar için hızlı heuristik kırpma.
function microCompact(messages: CoreMessage[], targetBudget: number): CoreMessage[] {
  const annotated = messages.map((msg, idx) => ({
    msg,
    score:  importanceScore(msg, messages, idx),
    tokens: countTokens(extractText(msg)) + 4,
  }))

  // Önce: skor < 20 olan mesajları sil (çok düşük önem)
  const filtered = annotated.filter((a) => a.score >= 20)

  // Ardından: kalan bütçe için smartCompact ile kırp
  const budget = Math.max(PRUNE_MINIMUM, targetBudget)
  return smartCompact(filtered.map((a) => a.msg), budget)
}

// ─── Strategy 2: snipCompact ─────────────────────────────────────────────────
// Tool output ağırlıklı konuşmalar için. Bir LLM çağrısıyla araç bölümlerini özetler.
async function snipCompact(
  messages: CoreMessage[],
  cfg:      CompactionConfig,
): Promise<CoreMessage[] | null> {
  const tailBonus  = (cfg.strategy === "conservative" ? 2 : cfg.strategy === "aggressive" ? -1 : 0)
  const tailTurns  = Math.max(1, (cfg.tailTurns ?? DEFAULT_TAIL_TURNS) + tailBonus)
  const tail       = messages.slice(-tailTurns * 2)
  const head       = messages.slice(0, -tailTurns * 2)

  // Araç mesajlarını toplu özetle
  const toolMessages = head.filter((m) => m.role === "tool" || (m.role === "assistant" && (
    Array.isArray(m.content) && m.content.some((p: unknown) => {
      const part = p as Record<string, unknown>
      return part?.type === "tool-call"
    })
  )))

  const toolContext = toolMessages.slice(0, 30).map((m) => {
    const text = extractText(m).slice(0, 800)
    return `[${m.role}]: ${text}`
  }).join("\n\n")

  const plugin = ProviderRegistry.get(cfg.provider)
  const model  = plugin.getModel(cfg.model)

  let snipSummary: string
  try {
    const { text } = await generateText({
      model,
      messages: [
        { role: "user", content: `These are tool operations from a coding session. Extract the following — copy file paths and error messages VERBATIM, do not paraphrase:\n\nMODIFIED_FILES: list every file path that was read, written, or edited\nCOMMANDS_RUN: list bash commands and their outcomes (success/fail/error)\nERRORS_FIXED: bugs found and how they were resolved (include exact error messages)\nCURRENT_STATE: one sentence on where the task stands now\n\nTool operations:\n\n${toolContext}` },
      ],
    })
    snipSummary = text
  } catch {
    cbRecordFailure()
    return null
  }

  // Araç mesajlarını özetle değiştir, konuşma mesajlarını koru
  const conversation = head.filter((m) => m.role !== "tool" && !(
    m.role === "assistant" && Array.isArray(m.content) && m.content.some((p: unknown) => {
      const part = p as Record<string, unknown>
      return part?.type === "tool-call"
    })
  ))

  const compacted: CoreMessage[] = [
    ...conversation,
    { role: "user",      content: "[Tool operations summary]" },
    { role: "assistant", content: snipSummary },
    ...tail,
  ]

  cbRecordSuccess()
  return compacted
}

// ─── Strategy 3: sessionCompact ──────────────────────────────────────────────
// Tam özet. Yapısal prompt + post-compact dosya re-injection + boundary marker.
async function sessionCompact(
  messages: CoreMessage[],
  cfg:      CompactionConfig,
): Promise<CoreMessage[] | null> {
  const tailBonus = (cfg.strategy === "conservative" ? 2 : cfg.strategy === "aggressive" ? -1 : 0)
  const tailTurns = Math.max(1, (cfg.tailTurns ?? DEFAULT_TAIL_TURNS) + tailBonus)

  const tail  = messages.slice(-tailTurns * 2)
  const head  = messages.slice(0, -tailTurns * 2)
  const budget = Math.max(0, estimateTokens(head) - PRUNE_MINIMUM)
  const pruned = smartCompact(head, budget)

  const summaryPrompt = cfg.strategy === "aggressive"
    ? [
        "Summarize this coding session in 4-6 bullet points. For each bullet include exact file paths and specific values — do NOT paraphrase them.",
        "Focus on: what changed, what broke, what was fixed, what is next.",
      ].join("\n")
    : cfg.strategy === "conservative"
    ? [
        "Provide a structured summary of the work done so far.",
        "You MUST copy file paths, error messages, variable names, and config keys VERBATIM — never paraphrase specific values.",
        "",
        "**MODIFIED_FILES:** List every file path that was touched (exact paths)",
        "**DECISIONS:** Architectural or design choices made and why",
        "**ERRORS:** Bugs encountered and how they were resolved (include exact error messages)",
        "**CURRENT_STATE:** What is working, what is broken, what is in progress",
        "**NEXT_STEPS:** What remains to be done",
      ].join("\n")
    : [
        "Summarize this coding session. You MUST include:",
        "1. MODIFIED_FILES: exact file paths (copy verbatim — never paraphrase)",
        "2. DECISIONS: architectural/design choices and their reasons",
        "3. ERRORS: bugs found and fixes applied (include exact error text)",
        "4. CURRENT_STATE: what works, what is broken, what is in progress",
        "5. NEXT_STEPS: what still needs to be done",
        "",
        "Preserve all specific values: line numbers, error codes, variable names, config keys.",
      ].join("\n")

  const plugin = ProviderRegistry.get(cfg.provider)
  const model  = plugin.getModel(cfg.model)

  let summary: string
  try {
    const { text } = await generateText({
      model,
      messages: [
        ...pruned,
        { role: "user", content: summaryPrompt },
      ],
    })
    summary = text
  } catch {
    cbRecordFailure()
    return null
  }

  // Post-compact file re-injection: summary'de geçen kaynak dosyaları ekle
  const filePaths  = extractFilePaths(summary)
  const fileBlocks: string[] = []

  for (const filePath of filePaths.slice(0, 3)) {
    try {
      const base    = cfg.workdir ?? process.cwd()
      const abs     = filePath.startsWith("/") ? filePath : resolve(base, filePath)
      const content = await readFile(abs, "utf8")
      fileBlocks.push(`\n[Re-injected: ${filePath}]\n\`\`\`\n${content.slice(0, 4_000)}\n\`\`\``)
    } catch {
      // Dosya okunamazsa atla
    }
  }

  // Scratchpad re-injection: reasoning state'i compaction'a karşı koru
  let scratchpadSection = ""
  if (cfg.sessionId && cfg.workdir) {
    try {
      const { scratchpadStore } = await import("../scratchpad/store.js")
      const state = scratchpadStore.read(cfg.sessionId, cfg.workdir)
      if (state) scratchpadSection = scratchpadStore.toPromptSection(state)
    } catch { /* scratchpad hatası compaction'ı durdurmasın */ }
  }

  // ─── Faz 3: Error chain preservation ────────────────────────────────────────
  const errorChains = extractErrorChains(messages)
  const errorSection = addProtectedErrors("", errorChains)

  // Boundary marker: compaction noktasını izlenebilir kıl
  const boundaryId = crypto.randomUUID().slice(0, 8)
  const fullSummary = (scratchpadSection ? scratchpadSection + "\n\n" : "")
    + summary + fileBlocks.join("") + errorSection + `\n\n[COMPACT:${boundaryId}]`

  const compacted: CoreMessage[] = [
    { role: "user",      content: "[Summary of previous conversation]" },
    { role: "assistant", content: fullSummary },
    ...tail,
  ]

  cbRecordSuccess()
  return compacted
}

// ─── Router ───────────────────────────────────────────────────────────────────
// Taşma miktarına ve context sağlığına göre en uygun stratejiyi seç.
export async function compact(
  messages: CoreMessage[],
  cfg:      CompactionConfig,
): Promise<CoreMessage[] | null> {
  if (cbIsOpen()) return null

  const usable   = cfg.contextLimit - cfg.maxOutput - COMPACTION_BUFFER
  const current  = estimateTokens(messages)
  const overflow = current - usable
  const health   = measureContextHealth(messages)

  const tokensBefore = current

  let result: CoreMessage[] | null = null
  let strategy: "micro" | "snip" | "session" = "session"

  // Küçük taşma (<8% of context): microCompact dene, yetersizse session'a geç
  if (overflow < cfg.contextLimit * 0.08) {
    strategy = "micro"
    const micro = microCompact(messages, usable)
    if (estimateTokens(micro) <= usable) {
      result = micro
    } else {
      strategy = "session"
    }
  }

  // Tool output ağırlıklı (>55%): snipCompact
  if (!result && health.toolOutputPct > 0.55) {
    strategy = "snip"
    result   = await snipCompact(messages, cfg)
  }

  // Varsayılan: tam session compaction
  if (!result) {
    strategy = "session"
    result   = await sessionCompact(messages, cfg)
  }

  if (!result) return null

  const tokensAfter = estimateTokens(result)

  const sid = cfg.sessionId ?? "unknown"
  await hooks.emit("v1.compact.before",  { sessionId: sid, tokenCount: tokensBefore })
  await hooks.emit("v1.session.compact", { sessionId: sid, tokensBefore, tokensAfter })
  await hooks.emit("v1.compact.after",   { sessionId: sid, tokensBefore, tokensAfter })

  return result
}
