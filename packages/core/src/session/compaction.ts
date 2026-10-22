import { readFile }     from "fs/promises"
import type { CoreMessage } from "ai"
import { ProviderRegistry }   from "../provider/registry.js"
import { countMessageTokens, countTokens, tokenizableMessageText } from "../provider/tokenizer.js"
import { calibratedTokenEstimate } from "../provider/token-calibration.js"
import { hooks }              from "../hook/emitter.js"
import {
  measureContextHealth,
  extractText,
  extractFilePaths,
} from "./context-compactor.js"
import { resolveWithinWorkspace } from "../security/path-boundary.js"
import { clearToolMessageResults } from "./tool-message-compaction.js"
import { addProtectedErrors, extractErrorChains } from "./compaction-errors.js"
import { buildBoundedSummaryTranscript, SUMMARY_SYSTEM_PROMPT } from "./summary-input.js"
import { createContextCheckpoint, formatContextCheckpoint } from "./context-checkpoint.js"
import { createCompactionDeadline, ensureStructuredSummary, isCompactionCircuitOpen, missingSections, recordCompactionFailure, recordCompactionSuccess, runSummaryWithRetry, SESSION_REQUIRED_SECTIONS, SNIP_REQUIRED_SECTIONS } from "./compaction-runtime.js"
import { ContextCompactionError, type CompactionConfig } from "./compaction-contract.js"
import { extractProtectedContextFacts, formatProtectedContextFacts, injectProtectedFacts } from "./protected-context.js"
export {
  extractProtectedContextFacts,
  formatProtectedContextFacts,
  PROTECTED_FACTS_MARKER,
  type ProtectedContextFacts,
} from "./protected-context.js"
export { addProtectedErrors, extractErrorChains, type ErrorChain } from "./compaction-errors.js"
export {
  COMPACTION_TOTAL_TIMEOUT_MS,
  createCompactionDeadline,
  ensureStructuredSummary,
  getCircuitState,
  missingSections,
  runSummaryWithRetry,
  SESSION_REQUIRED_SECTIONS,
  SNIP_REQUIRED_SECTIONS,
  type CBState,
  type CBStatus,
  type CompactionDeadline,
} from "./compaction-runtime.js"
export {
  ContextCompactionError,
  type CompactionConfig,
  type CompactionStrategy,
} from "./compaction-contract.js"

// ─── Constants ────────────────────────────────────────────────────────────────
export const COMPACTION_BUFFER     = 20_000
export const TOOL_OUTPUT_MAX_CHARS =  2_000
export const DEFAULT_TAIL_TURNS    =      2
export const DEFAULT_MSG_THRESHOLD =    100
export const TOOL_RESULT_CLEARED_MESSAGE = "[Old tool result content cleared]"
/** Compaction sırasında bir hook handler'ın asılı kalmasına izin verilen maksimum süre. */
export const COMPACTION_HOOK_TIMEOUT_MS = 5_000

export function splitTailTurns(messages: CoreMessage[], turns: number): { head: CoreMessage[]; tail: CoreMessage[] } {
  if (turns <= 0 || messages.length === 0) return { head: messages, tail: [] }
  let userTurns = 0
  let splitAt = 0
  for (let index = messages.length - 1; index >= 0; index--) {
    if (messages[index]?.role !== "user") continue
    userTurns++
    if (userTurns === turns) {
      splitAt = index
      break
    }
  }
  if (userTurns < turns) splitAt = 0
  return { head: messages.slice(0, splitAt), tail: messages.slice(splitAt) }
}

// ─── Utilities ────────────────────────────────────────────────────────────────
export function estimateTokens(messages: CoreMessage[], modelId?: string, tokenizerEncoding?: string): number {
  return messages.reduce((sum, message) => sum + countMessageTokens(message, modelId, tokenizerEncoding), 0)
}

export interface EffectiveContextOptions {
  modelId: string
  providerId?: string
  tokenizerEncoding?: string
  systemPrompt?: string
  toolSchemaReserveTokens?: number
  attachmentReserveTokens?: number
  safetyMargin?: number
}

/**
 * Provider'a gönderilecek bağlamın korumacı tahmini. History dışında system/gitre
 * blokları ve provider'a özgü tool/ek overhead'i de karar bütçesine girer.
 */
export function estimateEffectiveContextTokens(
  messages: CoreMessage[],
  options: EffectiveContextOptions,
): number {
  const systemTokens = options.systemPrompt
    ? countTokens(options.systemPrompt, options.modelId, options.tokenizerEncoding)
    : 0
  const raw = estimateTokens(messages, options.modelId, options.tokenizerEncoding)
    + systemTokens
    + (options.toolSchemaReserveTokens ?? 0)
    + (options.attachmentReserveTokens ?? 0)
  return Math.ceil(
    calibratedTokenEstimate(options.providerId, options.modelId, raw) * (options.safetyMargin ?? 1.15),
  )
}

export function isOverflow(messages: CoreMessage[], cfg: CompactionConfig): boolean {
  const usable = cfg.contextLimit - cfg.maxOutput - COMPACTION_BUFFER
  return calibratedTokenEstimate(
    cfg.provider,
    cfg.model,
    estimateTokens(messages, cfg.model, cfg.tokenizerEncoding),
  ) >= usable
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

export function getContextBreakdown(messages: CoreMessage[], contextWindow: number, modelId?: string, tokenizerEncoding?: string): ContextBreakdown {
  const byRole: Record<string, number> = {}
  const withTokens: Array<{ preview: string; tokens: number; role: string }> = []

  for (const msg of messages) {
    const text   = tokenizableMessageText(msg)
    const tokens = countMessageTokens(msg, modelId, tokenizerEncoding)
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

export function microCompactOldToolResults(
  messages: CoreMessage[],
  cfg: Pick<CompactionConfig, "contextLimit"> & Partial<Pick<CompactionConfig, "model" | "tokenizerEncoding">>,
  options: { keepRecent?: number; triggerRatio?: number } = {},
): CoreMessage[] {
  const keepRecent = Math.max(1, options.keepRecent ?? 8)
  const triggerRatio = options.triggerRatio ?? 0.65
  if (estimateTokens(messages, cfg.model, cfg.tokenizerEncoding) < cfg.contextLimit * triggerRatio) return messages

  const toolIndexes = messages
    .map((message, index) => ({ message, index }))
    .filter(({ message }) => message.role === "tool" && extractText(message) !== TOOL_RESULT_CLEARED_MESSAGE)
    .map(({ index }) => index)
  if (toolIndexes.length <= keepRecent) return messages

  const keep = new Set(toolIndexes.slice(-keepRecent))
  let changed = false
  const compacted = messages.map((message, index) => {
    if (message.role !== "tool" || keep.has(index)) return message
    changed = true
    return clearToolMessageResults(message, TOOL_RESULT_CLEARED_MESSAGE)
  })

  if (!changed) return messages

  const protectedFacts = formatProtectedContextFacts(extractProtectedContextFacts(messages))
  return protectedFacts ? injectProtectedFacts(compacted, protectedFacts) : compacted
}

// ─── Strategy 1: snipCompact ─────────────────────────────────────────────────
// Tool output ağırlıklı konuşmalar için. Bir LLM çağrısıyla araç bölümlerini özetler.
async function snipCompact(
  messages: CoreMessage[],
  cfg:      CompactionConfig,
): Promise<CoreMessage[]> {
  const tailBonus  = (cfg.strategy === "conservative" ? 2 : cfg.strategy === "aggressive" ? -1 : 0)
  const tailTurns  = Math.max(1, (cfg.tailTurns ?? DEFAULT_TAIL_TURNS) + tailBonus)
  const { head, tail } = splitTailTurns(messages, tailTurns)
  const checkpoint = await createContextCheckpoint(head, cfg)

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

  const snipPrompt =
    `These are tool operations from a coding session. Extract the following — copy file paths and error messages VERBATIM, do not paraphrase:\n\n` +
    `MODIFIED_FILES: list every file path that was read, written, or edited\n` +
    `COMMANDS_RUN: list bash commands and their outcomes (success/fail/error)\n` +
    `ERRORS_FIXED: bugs found and how they were resolved (include exact error messages)\n` +
    `CURRENT_STATE: one sentence on where the task stands now\n\n` +
    `Tool operations:\n\n${toolContext}\n\n${checkpoint.ledger}`
  const snipMaxTokens = Math.min(cfg.utilityMaxOutputTokens ?? 1_200, 800)

  let snipSummary: string
  try {
    snipSummary = await runSummaryWithRetry(model, SUMMARY_SYSTEM_PROMPT, snipPrompt, snipMaxTokens, cfg)
    // Kalite muhafızı: zorunlu bölümler eksikse tek hedefli retry (Claude'dan daha iyi).
    snipSummary = await ensureStructuredSummary(
      snipSummary, SNIP_REQUIRED_SECTIONS,
      model, SUMMARY_SYSTEM_PROMPT, snipPrompt, snipMaxTokens, cfg,
    )
    const missing = missingSections(snipSummary, SNIP_REQUIRED_SECTIONS)
    if (missing.length > 0) {
      throw new Error(`Compaction summary failed quality validation: ${missing.join(", ")}`)
    }
  } catch (error) {
    recordCompactionFailure(cfg)
    throw new ContextCompactionError("Context compaction could not summarize tool activity.", error)
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
    { role: "assistant", content: `${snipSummary}\n\n${formatContextCheckpoint(checkpoint)}` },
    ...tail,
  ]

  return compacted
}

// ─── Strategy 2: sessionCompact ──────────────────────────────────────────────
// Tam özet. Yapısal prompt + post-compact dosya re-injection + boundary marker.
async function sessionCompact(
  messages: CoreMessage[],
  cfg:      CompactionConfig,
): Promise<CoreMessage[]> {
  const tailBonus = (cfg.strategy === "conservative" ? 2 : cfg.strategy === "aggressive" ? -1 : 0)
  const tailTurns = Math.max(1, (cfg.tailTurns ?? DEFAULT_TAIL_TURNS) + tailBonus)

  const { head, tail } = splitTailTurns(messages, tailTurns)
  const checkpoint = await createContextCheckpoint(head, cfg)
  const transcript = buildBoundedSummaryTranscript(
    head,
    cfg.utilityMaxInputTokens ?? 24_000,
    cfg.model,
    cfg.tokenizerEncoding,
  )

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

  const sessionPrompt =
    `${summaryPrompt}\n\nDeterministic ledger:\n${checkpoint.ledger}\n\nBounded session transcript:\n\n${transcript}`
  const sessionMaxTokens = cfg.utilityMaxOutputTokens ?? 1_200

  let summary: string
  try {
    summary = await runSummaryWithRetry(model, SUMMARY_SYSTEM_PROMPT, sessionPrompt, sessionMaxTokens, cfg)
    // Kalite muhafızı: yapısal bölümler eksikse tek hedefli retry (Claude'dan daha iyi).
    summary = await ensureStructuredSummary(
      summary, SESSION_REQUIRED_SECTIONS,
      model, SUMMARY_SYSTEM_PROMPT, sessionPrompt, sessionMaxTokens, cfg,
    )
    const missing = missingSections(summary, SESSION_REQUIRED_SECTIONS)
    if (missing.length > 0) {
      throw new Error(`Compaction summary failed quality validation: ${missing.join(", ")}`)
    }
  } catch (error) {
    recordCompactionFailure(cfg)
    throw new ContextCompactionError("Context compaction could not summarize the earlier conversation.", error)
  }

  // Post-compact file re-injection: summary'de geçen kaynak dosyaları ekle
  const filePaths  = extractFilePaths(summary)
  const fileBlocks: string[] = []

  for (const filePath of filePaths.slice(0, 3)) {
    try {
      const base    = cfg.workdir ?? process.cwd()
      const abs     = await resolveWithinWorkspace(base, filePath)
      const content = await readFile(abs, "utf8")
      fileBlocks.push(`\n[Re-injected: ${filePath}]\n\`\`\`\n${content.slice(0, 4_000)}\n\`\`\``)
    } catch (error) {
      console.warn(`[aurict] compaction skipped unsafe or unreadable path '${filePath}'`, error)
    }
  }

  // Scratchpad re-injection: reasoning state'i compaction'a karşı koru
  let scratchpadSection = ""
  if (cfg.sessionId && cfg.workdir) {
    try {
      const { scratchpadStore } = await import("../scratchpad/store.js")
      const state = scratchpadStore.read(cfg.sessionId, cfg.workdir)
      if (state) scratchpadSection = scratchpadStore.toPromptSection(state)
    } catch (error) {
      console.warn(`[aurict] compaction could not restore scratchpad for ${cfg.sessionId}`, error)
    }
  }

  // ─── Faz 3: Error chain preservation ────────────────────────────────────────
  const errorChains = extractErrorChains(messages)
  const errorSection = addProtectedErrors("", errorChains)
  const protectedFacts = formatProtectedContextFacts(extractProtectedContextFacts(messages))

  // Boundary marker: compaction noktasını izlenebilir kıl
  const boundaryId = crypto.randomUUID().slice(0, 8)
  const fullSummary = (scratchpadSection ? scratchpadSection + "\n\n" : "")
    + summary
    + `\n\n${formatContextCheckpoint(checkpoint)}`
    + (protectedFacts ? `\n\n${protectedFacts}` : "")
    + fileBlocks.join("")
    + errorSection
    + `\n\n[COMPACT:${boundaryId}]`

  const compacted: CoreMessage[] = [
    { role: "user",      content: "[Summary of previous conversation]" },
    { role: "assistant", content: fullSummary },
    ...tail,
  ]

  return compacted
}

// ─── Router ───────────────────────────────────────────────────────────────────
// Taşma miktarına ve context sağlığına göre en uygun stratejiyi seç.
export async function compact(
  messages: CoreMessage[],
  cfg:      CompactionConfig,
): Promise<CoreMessage[]> {
  if (isCompactionCircuitOpen(cfg)) {
    throw new ContextCompactionError(
      "Context compaction is temporarily unavailable after repeated summary failures. " +
      "The active model is likely rate-limited or down. The original context is unchanged; " +
      "wait a moment and retry.",
    )
  }

  const usable   = cfg.contextLimit - cfg.maxOutput - COMPACTION_BUFFER
  const current  = estimateTokens(messages, cfg.model, cfg.tokenizerEncoding)
  const health   = measureContextHealth(messages)

  const tokensBefore = current
  const sid = cfg.sessionId ?? "unknown"
  await hooks.emit("v1.compact.before", { sessionId: sid, tokenCount: tokensBefore }, { timeoutMs: COMPACTION_HOOK_TIMEOUT_MS })

  // Parent signal (ESC) + bounded same-model checkpoint deadline.
  const deadline  = createCompactionDeadline(cfg.signal, cfg.timeoutMs)
  const boundedCfg: CompactionConfig = { ...cfg, signal: deadline.signal }

  let result: CoreMessage[] | undefined
  let usedSessionSummary = false
  try {
    // Tool output ağırlıklı (>55%): snipCompact. Heuristic-only history pruning
    // is intentionally avoided: every lossy boundary first receives a local
    // source archive and a same-model, quality-checked checkpoint.
    if (health.toolOutputPct > 0.55) result = await snipCompact(messages, boundedCfg)

    // Varsayılan: tam session compaction
    if (!result) {
      result = await sessionCompact(messages, boundedCfg)
      usedSessionSummary = true
    }

    let tokensAfter = estimateTokens(result, cfg.model, cfg.tokenizerEncoding)
    if (tokensAfter > usable && !usedSessionSummary) {
      result = await sessionCompact(messages, boundedCfg)
      usedSessionSummary = true
      tokensAfter = estimateTokens(result, cfg.model, cfg.tokenizerEncoding)
    }
    if (tokensAfter > usable || tokensAfter >= tokensBefore) {
      recordCompactionFailure(cfg)
      throw new ContextCompactionError(
        `Compaction did not meet its token budget (${tokensBefore} -> ${tokensAfter}, target ${usable}). ` +
        "The original context is unchanged.",
      )
    }

    await hooks.emit("v1.session.compact", { sessionId: sid, tokensBefore, tokensAfter }, { timeoutMs: COMPACTION_HOOK_TIMEOUT_MS })
    await hooks.emit("v1.compact.after",   { sessionId: sid, tokensBefore, tokensAfter }, { timeoutMs: COMPACTION_HOOK_TIMEOUT_MS })

    recordCompactionSuccess(cfg)
    return result
  } finally {
    deadline.dispose()
  }
}
