import { streamText, generateText, tool } from "ai"
import type { CoreMessage, ToolSet } from "ai"
import { resolve } from "path"
import { ProviderRegistry } from "../provider/registry.js"
import { ToolRegistry } from "../tool/registry.js"
import { executeTool } from "../tool/executor.js"
import { SessionManager } from "../session/manager.js"
import { isOverflow, isOverflowByMessages, compact, DEFAULT_TAIL_TURNS } from "../session/compaction.js"
import { buildSystemPrompt } from "../skill/injector.js"
import { attachmentToAIContent } from "../util/attachments.js"
import { createThinkTagFilter } from "../util/think-tag-filter.js"
import { getUndercoverInstructions } from "./undercover.js"
import { loadConfig } from "../config/config.js"
import { setTruncationConfig } from "../tool/truncation.js"
import { calculateCostUsd } from "../provider/costs.js"
import { extractAndStoreMemories, extractPerTurnMemories } from "../memory/extractor.js"
import { buildGitSection, buildProactiveFileSection, buildIntentSkillSection, getSkillsForProject } from "../skill/injector.js"
import { skillScoreStore } from "../skill/score-store.js"
import { ProviderFallback, loadFallbackFromConfig } from "../provider/fallback.js"
import { ModelRouter, loadRouterFromConfig } from "../provider/router.js"
import { metrics } from "../util/metrics.js"
import { extractText } from "../session/context-compactor.js"
import type { AgentRunOptions, AgentFinishResult, TokenBreakdown } from "./types.js"

const DEFAULT_MAX_STEPS = 40

// ─── Faz 3: Adaptive Step Limit ───────────────────────────────────────────────
/**
 * Task complexity'ye göre max steps hesaplar.
 * Basit sorular için az step, karmaşık görevler için çok step.
 */
function computeAdaptiveMaxSteps(
  messages: CoreMessage[],
  hasAttachments: boolean,
): number {
  const lastUserMsg = [...messages].reverse().find(m => m.role === "user")
  const text = lastUserMsg ? extractText(lastUserMsg) : ""

  // Çok kısa mesaj + tool yok + ek yok → trivial (10 step)
  if (text.length < 100 && !hasAttachments) {
    return 10
  }

  // Kısa mesaj + az tool → simple (20 step)
  if (text.length < 500) {
    return 20
  }

  // Orta uzunluk → moderate (35 step)
  if (text.length < 2000) {
    return 35
  }

  // Uzun mesaj → complex (50 step)
  return 50
}

// AI SDK tool() fonksiyonunun dönüş tipiyle exactOptionalPropertyTypes çakışıyor
// — ToolSet cast'i kullanıyoruz
function buildAITools(
  workdir: string,
  sessionId: string,
  provider: string,
  model: string,
  signal?: AbortSignal,
  onChunk?: (chunk: string) => void,
  failureTracker?: Map<string, number>,
  recentReads?: Map<string, number>,
  toolCallIndexRef?: { current: number },
): ToolSet {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: Record<string, any> = {}
  for (const def of ToolRegistry.list()) {
    const captured = def
    result[def.id] = tool({
      description: def.description,
      parameters:  def.parameters as never,
      execute: async (args: Record<string, unknown>) => {
        if (toolCallIndexRef) toolCallIndexRef.current++
        const currentIdx = toolCallIndexRef?.current ?? 0

        // B: Re-read gating — if file not read in last 10 calls, inject current content
        if (recentReads && captured.id === "edit") {
          const rawPath = String(args["path"] ?? "")
          if (rawPath) {
            const absPath   = resolve(workdir, rawPath)
            const lastRead  = recentReads.get(absPath)
            const isFresh   = lastRead !== undefined && (currentIdx - lastRead) <= 10
            if (!isFresh) {
              try {
                // 2s timeout — yavaş FS'de re-read gate'in tool çağrısını bloklamasını önler
                const readP = Bun.file(absPath).text()
                const timeoutP = new Promise<string>((_, rej) =>
                  setTimeout(() => rej(new Error("timeout")), 2_000))
                const content = await Promise.race([readP, timeoutP])
                const excerpt = content.slice(0, 6_000)
                const trunc   = content.length > 6_000 ? "\n... [truncated]" : ""
                const staleness = lastRead !== undefined
                  ? `${currentIdx - lastRead} tool calls ago`
                  : "never in this turn"
                return `[Re-read gate] '${rawPath}' was last read ${staleness}. Current content:\n\`\`\`\n${excerpt}${trunc}\n\`\`\`\n\nReview the actual content above, then re-issue your edit with an exact verbatim match from what you see.`
              } catch {
                // Can't read file — let edit run and fail with its own error
              }
            }
          }
        }

        // ctx.signal, loop'un signal'ine bağlı: Ctrl+C veya dışarıdan iptal
        // tool'a kadar ulaşır; executor da timeout'ta bu signal'i abort eder.
        const ctx = {
          sessionId, workdir,
          signal: signal ?? new AbortController().signal,
          provider, model,
          ...(onChunk !== undefined ? { onChunk } : {}),
        }
        const res = await executeTool(captured, args, ctx)

        // Track file reads and writes so re-read gate stays accurate
        if (recentReads && !res.error && (captured.id === "read" || captured.id === "write")) {
          const rawPath = String(args["path"] ?? "")
          if (rawPath) recentReads.set(resolve(workdir, rawPath), currentIdx)
        }

        let out = res.error ? `ERROR: ${res.error}\n${res.output}` : res.output

        if (res.error && failureTracker) {
          const fingerprint = `${captured.id}:${String(res.error).slice(0, 80)}`
          const count = (failureTracker.get(fingerprint) ?? 0) + 1
          failureTracker.set(fingerprint, count)
          if (count >= 2) {
            out += `\n\n[SYSTEM: You have hit this exact error ${count} times in a row. DO NOT retry the same approach. Stop, identify the root cause, and try a fundamentally different solution.]`
          }
        }

        return out
      },
    })
  }
  return result as ToolSet
}

export async function runAgent(opts: AgentRunOptions): Promise<AgentFinishResult> {
  const providerName = opts.provider ?? "anthropic"
  const plugin       = ProviderRegistry.get(providerName)
  const modelId      = opts.model ?? plugin.defaultModel()
  const model        = plugin.getModel(modelId)
  const workdir      = opts.workdir ?? process.cwd()
  const sessionId    = opts.sessionId

  let messages: CoreMessage[] = [...opts.messages]

  // --- Multimodal attachment injection ---
  // Attachments varsa son user mesajını array formatına çevir
  if (opts.attachments && opts.attachments.length > 0) {
    const lastIdx = messages.length - 1
    const last = messages[lastIdx]
    if (last && last.role === "user" && typeof last.content === "string") {
      const textBlock = { type: "text" as const, text: last.content }
      const imageBlocks = opts.attachments.map((a) => attachmentToAIContent(a))
      messages = [
        ...messages.slice(0, lastIdx),
        { role: "user", content: [textBlock, ...imageBlocks] } as CoreMessage,
      ]
    }
  }

  // --- Config yükle + truncation init ---
  const cfg              = loadConfig(workdir)
  setTruncationConfig(cfg.truncation ?? {})

  // --- Provider fallback init ---
  if (cfg.fallback) {
    loadFallbackFromConfig({
      enabled: cfg.fallback.enabled ?? false,
      providers: cfg.fallback.providers ?? [],
      triggerOn: cfg.fallback.triggerOn ?? ["429", "503", "timeout"],
      maxRetries: cfg.fallback.maxRetries ?? 2,
      retryDelayMs: cfg.fallback.retryDelayMs ?? 15_000,
      circuitBreakerThreshold: cfg.fallback.circuitBreakerThreshold ?? 3,
      circuitBreakerResetMs: cfg.fallback.circuitBreakerResetMs ?? 60_000,
    })
  }

  // --- Model router init ---
  if (cfg.routing) {
    loadRouterFromConfig({
      enabled: cfg.routing.enabled ?? false,
      budgetThresholdUsd: cfg.routing.budgetThresholdUsd ?? 1.0,
      maxSessionCostUsd: cfg.routing.maxSessionCostUsd ?? 10.0,
    })
  }

  // --- Compaction kontrolü ---
  const compCfg          = cfg.compaction
  const tailTurns        = compCfg?.tailTurns            ?? DEFAULT_TAIL_TURNS
  const strategy         = compCfg?.strategy             ?? "balanced"
  const msgThreshold     = compCfg?.messageCountThreshold
  const modelInfo = plugin.listModels().find((m) => m.id === modelId)
  const compCfgFull = {
    contextLimit:          modelInfo?.contextWindow ?? 200_000,
    maxOutput:             modelInfo?.maxOutput     ?? 8_000,
    tailTurns,
    strategy,
    provider:              providerName,
    model:                 modelId,
    workdir,
    ...(sessionId !== undefined ? { sessionId } : {}),
    ...(msgThreshold !== undefined ? { messageCountThreshold: msgThreshold } : {}),
  }
  if (modelInfo && (isOverflow(messages, compCfgFull) || isOverflowByMessages(messages, compCfgFull))) {
    // Extract memories from messages about to be lost to compaction (fire-and-forget)
    extractAndStoreMemories(providerName, modelId, messages, workdir).catch(() => {})
    const compacted = await compact(messages, compCfgFull)
    if (!compacted) return { text: "", tokens: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0 }, newMessages: [], ...(sessionId !== undefined ? { sessionId } : {}) }
    messages  = compacted
    opts.onCompaction?.()
  }

  // supportsTools: false olan modeller tool API'si desteklemez — boş geç
  const hasToolSupport   = modelInfo?.supportsTools !== false
  const failureTracker   = new Map<string, number>()
  const recentReads      = new Map<string, number>()
  const toolCallIndexRef = { current: 0 }
  const rawTools = hasToolSupport
    ? buildAITools(workdir, sessionId ?? "", providerName, modelId, opts.signal, opts.onChunk, failureTracker, recentReads, toolCallIndexRef)
    : ({} as ToolSet)

  // toolsOverride: session agent kısıtlaması — sadece izin verilen tool'lar
  const aiTools: ToolSet = opts.toolsOverride
    ? Object.fromEntries(
        Object.entries(rawTools).filter(([id]) => opts.toolsOverride!.includes(id))
      ) as ToolSet
    : rawTools

  // --- Proactive file injection: dosya adları user mesajında geçiyorsa önceden inject et ---
  const lastUserMsg = [...messages].reverse().find(m => m.role === "user")
  const lastUserText = lastUserMsg
    ? (typeof lastUserMsg.content === "string" ? lastUserMsg.content : "")
    : ""

  // --- Skill injection (otomatik proje tespiti) ---
  // Git context buildSystemPrompt dışında tutulur — Anthropic'te ayrı uncached blok olarak inject edilir
  const baseSystem      = await buildSystemPrompt(workdir, opts.system, false)
  const projectSkills   = await getSkillsForProject(workdir).catch(() => [])
  const projectSkillIds = new Set(projectSkills.map((s) => s.id))

  const [proactiveSection, intentSection] = await Promise.all([
    buildProactiveFileSection(lastUserText, workdir).catch(() => ""),
    buildIntentSkillSection(lastUserText, workdir, projectSkillIds).catch(() => ""),
  ])

  const extraSystem = [proactiveSection, intentSection].filter(Boolean).join("\n\n")
  let system = extraSystem ? `${baseSystem}\n\n${extraSystem}` : baseSystem

  if (opts.undercover) {
    system = [system, getUndercoverInstructions()].filter(Boolean).join("\n\n---\n\n")
  }

  // Git context her turn'de fresh — Anthropic cache'e girmemeli
  const gitSection = buildGitSection(workdir)

  // Anthropic prompt caching: statik kısım cache'lenir, git context cache'lenmez
  let systemParam: string | undefined = system || undefined
  if (plugin.sdkType === "anthropic") {
    const contentBlocks: Array<{ type: "text"; text: string; experimental_providerMetadata?: unknown }> = []
    if (system) {
      contentBlocks.push({
        type: "text",
        text: system,
        experimental_providerMetadata: { anthropic: { cacheControl: { type: "ephemeral" } } },
      })
    }
    if (gitSection) {
      contentBlocks.push({ type: "text", text: gitSection })
    }
    if (contentBlocks.length > 0) {
      const sysMsg: CoreMessage = { role: "system", content: contentBlocks as never }
      messages = [sysMsg, ...messages]
      systemParam = undefined
    }
  } else if (system || gitSection) {
    // Non-Anthropic: git context dahil tek string
    const fullSystem = [system, gitSection].filter(Boolean).join("\n\n")
    systemParam = fullSystem || undefined
  }

  // ─── Faz 3: Adaptive step limit ─────────────────────────────────────────────
  const maxSteps = computeAdaptiveMaxSteps(messages, !!opts.attachments)

  const shared = {
    model,
    messages,
    tools:    aiTools,
    maxSteps,
    experimental_continueSteps: true,
    ...(systemParam ? { system: systemParam } : {}),
    ...(opts.signal !== undefined ? { abortSignal: opts.signal } : {}),
    ...(opts.effort ? (() => {
      const thinkOpts = plugin.buildThinkingOptions(modelId, opts.effort!)
      return thinkOpts ? { providerOptions: thinkOpts } : {}
    })() : {})
  }

  let fullText = ""
  let breakdown: TokenBreakdown = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0 }

  // opts.stream=false → pipe/non-interactive mod, kesinlikle generate
  // opts.stream=true veya undefined → provider'ın streaming desteğine bak
  const useStream = opts.stream !== false && plugin.supportsStreaming
  let newMessages: CoreMessage[] = []

  if (useStream) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await withRetry(() => Promise.resolve(streamText(shared as any))) as any
    const seenToolResults  = new Set<string>()
    const toolCallTimes    = new Map<string, number>()
    // Embedded <think>...</think> tag'lerini text stream'den ayıran filter
    // (DeepSeek-R1, Qwen, Ollama modeller)
    const thinkFilter = createThinkTagFilter()

    for await (const part of result.fullStream) {
      if (part.type === "text-delta") {
        const raw = (part.textDelta as string) || ""
        if (!raw) continue
        const { text, thinking } = thinkFilter.feed(raw)
        if (thinking) opts.onText?.(thinking, true)
        if (text) {
          fullText += text
          opts.onText?.(text, false)
        }
      } else if (
        part.type === "reasoning"       ||
        part.type === "reasoning-delta" ||
        part.type === "thinking"
      ) {
        // Native reasoning events (Anthropic extended thinking, AI SDK)
        const delta: string =
          (part as any).text      ??
          (part as any).textDelta ??
          (part as any).reasoning ??
          (part as any).delta     ?? ""
        if (delta) opts.onText?.(delta, true)
      } else if (part.type === "reasoning-start" || part.type === "reasoning-end") {
        // lifecycle sinyalleri — delta taşımaz, ignore
      } else if (part.type === "error") {
        throw new Error(parseProviderError((part as any).error))
      } else if (part.type === "tool-call") {
        toolCallTimes.set(part.toolCallId, Date.now())
        opts.onToolCall?.({ id: part.toolCallId, tool: part.toolName, args: part.args })
      } else if (part.type === "tool-result") {
        // tool-result tek kaynak — step-finish'te tekrar emit edilmez
        if (!seenToolResults.has(part.toolCallId)) {
          seenToolResults.add(part.toolCallId)
          const durationMs = Date.now() - (toolCallTimes.get(part.toolCallId) ?? Date.now())
          toolCallTimes.delete(part.toolCallId)
          // @ts-ignore: part.result
          opts.onToolResult?.({ id: part.toolCallId, result: String(part.result), durationMs })
        }
      } else if (part.type === "step-finish") {
        // Yalnızca step tamamlama sinyali — tool result emission yok (race condition önleme)
        opts.onStepFinish?.()
      }
    }

    // Stream bitti — buffer'da kalan fragmentleri boşalt
    const tail = thinkFilter.flush()
    if (tail.thinking) opts.onText?.(tail.thinking, true)
    if (tail.text) { fullText += tail.text; opts.onText?.(tail.text, false) }

    const u    = await result.usage as Record<string, unknown>
    const meta = await (result as any).experimental_providerMetadata as Record<string, unknown> | undefined
    breakdown  = extractTokenBreakdown(u, meta)

    const finalResponse = await result.response
    newMessages = finalResponse.messages
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await withRetry(() => generateText(shared as any))
    fullText      = result.text
    opts.onText?.(fullText)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const step of (result as any).steps ?? []) {
      for (const tc of step.toolCalls ?? []) {
        opts.onToolCall?.({ id: tc.toolCallId, tool: tc.toolName, args: tc.args })
      }
      for (const tr of step.toolResults ?? []) {
        opts.onToolResult?.({ id: tr.toolCallId, result: String(tr.result), durationMs: 0 })
      }
    }

    const u    = result.usage as Record<string, unknown>
    const meta = (result as any).experimental_providerMetadata as Record<string, unknown> | undefined
    breakdown  = extractTokenBreakdown(u, meta)
    newMessages = result.response.messages
  }

  if (sessionId !== undefined && fullText) {
    SessionManager.ensureExists(sessionId, { provider: providerName, model: modelId })
    SessionManager.addPart({ sessionId, role: "assistant", type: "text", content: fullText, tokens: breakdown.output })
    SessionManager.recordTurn(sessionId, {
      inputTokens:  breakdown.input,
      outputTokens: breakdown.output,
      cacheTokens:  (breakdown.cacheRead ?? 0) + (breakdown.cacheWrite ?? 0),
      costUsd:      calculateCostUsd(modelId, breakdown),
      model:        modelId,
    })
  }

  const finish: AgentFinishResult = {
    text:      fullText,
    tokens:    breakdown,
    newMessages,
    ...(sessionId !== undefined ? { sessionId } : {}),
  }

  opts.onFinish?.(finish)

  // Agent başarıyla tamamlandı — aktif skill'lerin success skorunu artır (fire-and-forget)
  if (fullText && projectSkills.length > 0) {
    try { skillScoreStore.recordSuccess(workdir, projectSkills.map((s) => s.id)) } catch { /* optional */ }
  }

  // ─── Faz 3: Per-turn memory extraction ──────────────────────────────────────
  // Her turn sonunda memory extraction yap (fire-and-forget)
  // Compaction'dan daha sık çalışır, sadece son birkaç mesaja bakar
  if (fullText && messages.length >= 2) {
    extractPerTurnMemories(providerName, modelId, messages, workdir).catch(() => {})
  }

  return finish
}

function extractTokenBreakdown(
  u:    Record<string, unknown>,
  meta: Record<string, unknown> | undefined,
): TokenBreakdown {
  const am = (meta?.["anthropic"] ?? {}) as Record<string, unknown>

  const input  = Number(u["promptTokens"]     ?? u["inputTokens"]     ?? u["prompt_tokens"]      ?? 0)
  const output = Number(u["completionTokens"] ?? u["outputTokens"]    ?? u["completion_tokens"]   ?? 0)

  // Cache tokens — Anthropic native fields (via AI SDK providerMetadata)
  const cacheRead  = Number(am["cacheReadInputTokens"]      ?? u["cacheReadInputTokens"]       ?? 0)
  const cacheWrite = Number(am["cacheCreationInputTokens"]  ?? u["cacheCreationInputTokens"]   ?? 0)

  // Reasoning tokens — extended thinking (Anthropic, may come via usage or providerMetadata)
  const reasoning  = Number(am["reasoningOutputTokens"] ?? u["reasoningTokens"] ?? 0)

  return { input, output, cacheRead, cacheWrite, reasoning }
}

// 429 için basit retry — Retry-After header'ı yoksa 15s bekle, max 2 deneme
// Provider fallback aktifse, fallback zincirini dener
export async function withRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  let attempt = 0
  while (true) {
    try {
      return await fn()
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      const isRateLimit = /429|rate.?limit|too.many/i.test(msg)
      if (!isRateLimit || attempt >= maxRetries) throw err
      attempt++
      const waitMs = parseRetryAfter(msg) ?? 15_000
      await new Promise(r => setTimeout(r, waitMs))
    }
  }
}

// Provider fallback ile retry — fallback aktifse provider değiştirir
export async function withFallback<T>(
  primaryProvider: string,
  fn: (provider: string) => Promise<T>,
  maxRetries = 2,
): Promise<{ result: T; provider: string }> {
  // Fallback devre dışıysa mevcut withRetry mantığını kullan
  const { providerFallback } = await import("../provider/fallback.js")
  
  try {
    const { result, provider } = await providerFallback.execute(
      primaryProvider,
      async (plugin) => fn(plugin.id),
    )
    return { result, provider }
  } catch (err) {
    // Fallback başarısız — orijinal hatayı fırlat
    throw err
  }
}

function parseRetryAfter(msg: string): number | undefined {
  const m = msg.match(/retry.{0,10}after[:\s]+(\d+)/i)
  return m ? Number(m[1]) * 1000 : undefined
}

export function parseProviderError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err)
  if (/401|unauthorized|invalid.{0,20}key/i.test(raw))
    return `Invalid API key — update with /config set <provider> <key>`
  if (/429|rate.?limit|too.many/i.test(raw))
    return `Rate limited — wait a moment or switch provider (/providers)`
  if (/503|502|overload|unavailable/i.test(raw))
    return `Provider unavailable — try again or switch with /providers`
  if (/ECONNREFUSED|ENOTFOUND|network|timeout/i.test(raw))
    return `Network error — check your internet connection`
  return raw
}
