// Bun Worker thread — import.meta.url worker.ts'i gösterir
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const self: { onmessage: any; postMessage(msg: unknown): void }

import { streamText, tool } from "ai"
import type { CoreMessage } from "ai"
import { ProviderRegistry }  from "../provider/registry.js"
import { ToolRegistry }      from "../tool/registry.js"
import { executeTool }       from "../tool/executor.js"
import { buildSystemPrompt } from "../skill/injector.js"
import { getAgentPrompt }    from "./agent-prompts.js"
import type { WorkerRequest, WorkerControl, WorkerMessage } from "./protocol.js"
import { AGENT_MAX_STEPS }   from "./protocol.js"
import { loadConfig }        from "../config/config.js"
import { filterToolIdsForSecurityCapability, prepareToolForSecurityCapability } from "../security/capability.js"

// Pool'un graceful abort sinyal edebilmesi için tek AbortController
const abort = new AbortController()

// Inbox: pool'dan gelen mesajlar — streamText turu arasında enjekte edilir
const inbox: Array<{ from: string; fromName: string; message: string }> = []

// Heartbeat: pool timeout'u resetlemek için periyodik sinyal (15s)
let heartbeatTimer: ReturnType<typeof setInterval> | null = null

const MAX_INBOX_TURNS = 8   // infinite loop koruması

// LLM stream stall: if no token arrives within this window, abort.
// Prevents the worker hanging when the API stops mid-stream silently.
const STREAM_STALL_MS = 90_000  // 90 seconds without a token = stalled

self.onmessage = async (event: MessageEvent<WorkerRequest | WorkerControl>) => {
  const ctrl = event.data as WorkerControl

  if (ctrl.type === "abort") {
    abort.abort()
    return
  }

  if (ctrl.type === "inbox_message") {
    inbox.push({ from: ctrl.from, fromName: ctrl.fromName, message: ctrl.message })
    return
  }

  const req = event.data as WorkerRequest

  // Parent'tan gelen API key'leri env'e uygula — lazy provider getter'lar
  // bu değerleri getModel() çağrısında okuyacak
  if (req.envVars) {
    for (const [k, v] of Object.entries(req.envVars)) {
      if (v) process.env[k] = v
    }
  }

  // Heartbeat başlat — pool 5dk timeout'u heartbeat'e göre uzatıyor
  heartbeatTimer = setInterval(() => {
    send({ type: "heartbeat" })
  }, 15_000)

  try {
    const plugin      = ProviderRegistry.get(req.provider)
    const model       = plugin.getModel(req.model)
    const cfg         = loadConfig(req.workdir)
    const INBOX_CHECK_INTERVAL = 8
    const totalMaxSteps = AGENT_MAX_STEPS[req.agentType] ?? 30
    let stepsUsed = 0

    const visibleAllowedTools = filterToolIdsForSecurityCapability(req.allowedTools, cfg)
    const baseSystem  = await buildSystemPrompt(req.workdir, undefined, false, req.agentType)
    const typePrompt  = getAgentPrompt(req.agentType, totalMaxSteps)
    const toolsPrompt = `## Available Tools\nYou have access to ONLY these tools: ${visibleAllowedTools.join(", ")}\nCalling any other tool will cause an error.`
    const msgPrompt   = `## Agent Communication\nUse send_message to contact sibling agents by role name.\nIncoming messages from other agents appear as <agent-message> in the conversation.`
    const system      = [typePrompt, baseSystem, toolsPrompt, msgPrompt].filter(Boolean).join("\n\n---\n\n")

    const allowedSet = new Set(visibleAllowedTools)

    // send_message için pool callback'i ctx üzerinden ilet
    const ctxSendMessage = (to: string, message: string) => {
      send({ type: "send_message", to, message, from: req.id, fromName: req.agentName })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tools: Record<string, any> = {}
    for (const def of ToolRegistry.list()) {
      const filteredDef = prepareToolForSecurityCapability(def, cfg)
      if (!filteredDef || !allowedSet.has(filteredDef.id)) continue
      const captured = filteredDef
      tools[filteredDef.id] = tool({
        description: filteredDef.description,
        parameters:  filteredDef.parameters as never,
        execute: async (args: Record<string, unknown>) => {
          const ctx = {
            sessionId:   req.sessionId,
            workdir:     req.workdir,
            signal:      abort.signal,
            sendMessage: ctxSendMessage,
            isSubagent:  true,
            provider:    req.provider,
            model:       req.model,
          }
          const res = await executeTool(captured, args, ctx)
          return res.error ? `ERROR: ${res.error}\n${res.output}` : res.output
        },
      })
    }

    // parentContext varsa task prompt'a önce bağlamı ekle, sonra görevi belirt
    const taskPrompt = req.parentContext
      ? `## Parent Conversation Context\n\n${req.parentContext}\n\n---\n\n## Your Task\n\n${req.prompt}`
      : req.prompt

    // Anthropic prompt caching: system'ı cache_control ile messages'a inject et
    let workerSystem: string | undefined = system
    let messages: CoreMessage[] = [{ role: "user", content: taskPrompt }]
    if (plugin.sdkType === "anthropic") {
      const sysMsg: CoreMessage = {
        role: "system",
        content: system,
        providerOptions: { anthropic: { cacheControl: { type: "ephemeral" } } },
      }
      messages = [sysMsg, ...messages]
      workerSystem = undefined
    }
    let finalText  = ""
    let totalInput = 0
    let totalOutput = 0
    let inboxTurn  = 0

    // ── Outer loop: inbox mesajlarını yeni turn olarak enjekte et ────────────
    // Her outer turn: en fazla INBOX_CHECK_INTERVAL adım — inbox'ı daha sık kontrol eder
    outer: while (stepsUsed < totalMaxSteps) {
      if (abort.signal.aborted) break

      let turnText = ""
      let toolCallsThisBatch = 0
      const stepsThisBatch = Math.min(totalMaxSteps - stepsUsed, INBOX_CHECK_INTERVAL)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = streamText({
        model,
        ...(workerSystem ? { system: workerSystem } : {}),
        messages,
        tools,
        maxSteps: stepsThisBatch,
        abortSignal: abort.signal,
      } as any) as any

      // Stall watchdog: reset on every event from the stream.
      // If nothing arrives for STREAM_STALL_MS, abort the whole worker.
      let stallTimer = setTimeout(() => {
        if (!abort.signal.aborted) {
          abort.abort()
          send({ type: "error", message: `LLM stream stalled for ${STREAM_STALL_MS / 1000}s — agent aborted to prevent freeze` })
        }
      }, STREAM_STALL_MS)

      for await (const part of result.fullStream) {
        // Reset stall watchdog on any activity
        clearTimeout(stallTimer)
        stallTimer = setTimeout(() => {
          if (!abort.signal.aborted) {
            abort.abort()
            send({ type: "error", message: `LLM stream stalled for ${STREAM_STALL_MS / 1000}s — agent aborted to prevent freeze` })
          }
        }, STREAM_STALL_MS)

        if (abort.signal.aborted) { clearTimeout(stallTimer); break outer }

        if (part.type === "text-delta") {
          const delta = (part.textDelta as string) || ""
          if (delta) { turnText += delta; send({ type: "text", delta }) }
        } else if (part.type === "tool-call") {
          toolCallsThisBatch++
          send({ type: "tool_call", id: part.toolCallId, tool: part.toolName, args: part.args })
        } else if (part.type === "tool-result") {
          send({ type: "tool_result", id: part.toolCallId, result: String(part.result) })
        } else if (part.type === "error") {
          clearTimeout(stallTimer)
          throw new Error((part as any).error?.message || String((part as any).error))
        }
      }
      clearTimeout(stallTimer)

      // Son turn metni accumulate et — override değil append.
      // Agent son turda sadece tool call yaptıysa önceki turların metni korunur.
      if (turnText) finalText = finalText ? `${finalText}\n\n${turnText}` : turnText

      const usage = await result.usage as Record<string, number>
      totalInput  += usage["promptTokens"]     ?? 0
      totalOutput += usage["completionTokens"] ?? 0

      // Conversation history'yi güncelle — bir sonraki turn için context
      const response = await result.response
      messages = [...messages, ...(response.messages as CoreMessage[])]

      // Gerçek araç çağrısı sayısını topla — kalan adım bütçesini güncelle
      stepsUsed += toolCallsThisBatch

      // ── Inbox kontrolü: yeni mesaj var mı? ─────────────────────────────────
      const hitBatchLimit = toolCallsThisBatch >= stepsThisBatch

      if (inbox.length > 0 && inboxTurn < MAX_INBOX_TURNS) {
        // Inbox'taki tüm mesajları tek bir user mesajı olarak enjekte et
        const inboxContent = inbox
          .map((m) => `<agent-message from="${m.fromName}">\n${m.message}\n</agent-message>`)
          .join("\n\n")
        inbox.length = 0  // flush
        inboxTurn++
        messages.push({ role: "user", content: inboxContent })
      } else if (!hitBatchLimit) {
        // Agent doğal olarak bitti (adım limitine çarpmadı) ve inbox boş — tamam
        break
      }
      // hitBatchLimit && inbox boş: kalan adım bütçesi ile çalışmaya devam et
      // Döngü koşulu (stepsUsed < totalMaxSteps) zaten sınırı zorlar
    }

    if (abort.signal.aborted) {
      send({ type: "error", message: "Subagent cancelled" })
      return
    }

    // Tüm turnlar tool-only geçti → metin boş.
    // Tek bir özet turu zorla: araç çağrısı yok, sadece düz metin özeti.
    if (!finalText) {
      try {
        let summaryText = ""
        const sumResult = streamText({
          model,
          ...(workerSystem ? { system: workerSystem } : {}),
          messages: [...messages, {
            role:    "user" as const,
            content: "Provide a plain-text summary of everything you completed and your key findings. No tool calls.",
          }],
          maxSteps:    1,
          abortSignal: abort.signal,
        } as any)
        for await (const part of (sumResult as any).fullStream) {
          if (abort.signal.aborted) break
          if (part.type === "text-delta") {
            const delta = (part.textDelta as string) || ""
            if (delta) { summaryText += delta; send({ type: "text", delta }) }
          }
        }
        const sumUsage = await (sumResult as any).usage as Record<string, number>
        totalOutput += Number(sumUsage?.["completionTokens"] ?? 0)
        if (summaryText) finalText = summaryText
      } catch { /* özet başarısız — boş devam et */ }
    }

    send({
      type:   "done",
      result: finalText,
      tokens: { input: totalInput, output: totalOutput },
    })

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    send({ type: "error", message: abort.signal.aborted ? "Subagent cancelled" : msg })
  } finally {
    if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null }
  }
}

function send(msg: WorkerMessage) {
  self.postMessage(msg)
}
