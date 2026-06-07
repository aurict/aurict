import { streamText, generateText, tool } from "ai"
import type { CoreMessage, ToolSet } from "ai"
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
import type { AgentRunOptions, AgentFinishResult } from "./types.js"

const MAX_STEPS = 20

// AI SDK tool() fonksiyonunun dönüş tipiyle exactOptionalPropertyTypes çakışıyor
// — ToolSet cast'i kullanıyoruz
function buildAITools(
  workdir: string,
  sessionId: string,
  provider: string,
  model: string,
  onChunk?: (chunk: string) => void,
): ToolSet {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: Record<string, any> = {}
  for (const def of ToolRegistry.list()) {
    const captured = def
    result[def.id] = tool({
      description: def.description,
      parameters:  def.parameters as never,
      execute: async (args: Record<string, unknown>) => {
        const ctx = {
          sessionId, workdir, signal: new AbortController().signal, provider, model,
          ...(onChunk !== undefined ? { onChunk } : {}),
        }
        const res = await executeTool(captured, args, ctx)
        return res.error ? `ERROR: ${res.error}\n${res.output}` : res.output
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

  // --- Compaction kontrolü ---
  const compCfg          = loadConfig(workdir).compaction
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
    ...(msgThreshold !== undefined ? { messageCountThreshold: msgThreshold } : {}),
  }
  if (modelInfo && (isOverflow(messages, compCfgFull) || isOverflowByMessages(messages, compCfgFull))) {
    const compacted = await compact(messages, compCfgFull)
    if (!compacted) return { text: "", tokens: { input: 0, output: 0 }, newMessages: [], ...(sessionId !== undefined ? { sessionId } : {}) }
    messages  = compacted
    opts.onCompaction?.()
  }

  // supportsTools: false olan modeller tool API'si desteklemez — boş geç
  const hasToolSupport = modelInfo?.supportsTools !== false
  const rawTools = hasToolSupport
    ? buildAITools(workdir, sessionId ?? "", providerName, modelId, opts.onChunk)
    : ({} as ToolSet)

  // toolsOverride: session agent kısıtlaması — sadece izin verilen tool'lar
  const aiTools: ToolSet = opts.toolsOverride
    ? Object.fromEntries(
        Object.entries(rawTools).filter(([id]) => opts.toolsOverride!.includes(id))
      ) as ToolSet
    : rawTools

  // --- Skill injection (otomatik proje tespiti) ---
  let system = await buildSystemPrompt(workdir, opts.system)
  if (opts.undercover) {
    system = [system, getUndercoverInstructions()].filter(Boolean).join("\n\n---\n\n")
  }

  // Anthropic prompt caching: system prompt'u mesaj dizisine cache_control ile inject et
  let systemParam: string | undefined = system || undefined
  if (system && plugin.sdkType === "anthropic") {
    const sysMsg: CoreMessage = {
      role: "system",
      content: system,
      providerOptions: { anthropic: { cacheControl: { type: "ephemeral" } } },
    }
    messages = [sysMsg, ...messages]
    systemParam = undefined
  }

  const shared = {
    model,
    messages,
    tools:    aiTools,
    maxSteps: MAX_STEPS,
    ...(systemParam ? { system: systemParam } : {}),
    ...(opts.signal !== undefined ? { abortSignal: opts.signal } : {}),
    ...(opts.effort ? (() => {
      const thinkOpts = plugin.buildThinkingOptions(modelId, opts.effort!)
      return thinkOpts ? { providerOptions: thinkOpts } : {}
    })() : {})
  }

  let fullText     = ""
  let inputTokens  = 0
  let outputTokens = 0

  // opts.stream=false → pipe/non-interactive mod, kesinlikle generate
  // opts.stream=true veya undefined → provider'ın streaming desteğine bak
  const useStream = opts.stream !== false && plugin.supportsStreaming
  let newMessages: CoreMessage[] = []

  if (useStream) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = streamText(shared as any) as any
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
        const errMsg = `API Error: ${(part as any).error?.message || String((part as any).error)}`
        throw new Error(errMsg)
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

    const u      = await result.usage as Record<string, unknown>
    inputTokens  = normalizeTokens(u, "input")
    outputTokens = normalizeTokens(u, "output")

    const finalResponse = await result.response
    newMessages = finalResponse.messages
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await generateText(shared as any)
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

    const u      = result.usage as Record<string, unknown>
    inputTokens  = normalizeTokens(u, "input")
    outputTokens = normalizeTokens(u, "output")
    newMessages  = result.response.messages
  }

  if (sessionId !== undefined && fullText) {
    SessionManager.ensureExists(sessionId, { provider: providerName, model: modelId })
    SessionManager.addPart({ sessionId, role: "assistant", type: "text", content: fullText, tokens: outputTokens })
  }

  const finish: AgentFinishResult = {
    text:      fullText,
    tokens:    { input: inputTokens, output: outputTokens },
    newMessages,
    ...(sessionId !== undefined ? { sessionId } : {}),
  }

  opts.onFinish?.(finish)
  return finish
}

// Eski buildThinkingOptions kaldırıldı — her plugin kendi buildThinkingOptions()'ını implemente eder

function normalizeTokens(u: Record<string, unknown>, side: "input" | "output"): number {
  if (side === "input") return Number(u["promptTokens"]     ?? u["inputTokens"]  ?? u["prompt_tokens"]     ?? 0)
  return                       Number(u["completionTokens"] ?? u["outputTokens"] ?? u["completion_tokens"] ?? 0)
}
