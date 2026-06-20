import { sseManager }     from "../server/sse.js"
import { hooks }          from "../hook/emitter.js"
import { SessionManager } from "../session/manager.js"
import { ensureWorkspace } from "./workspace.js"
import { loadConfig }     from "../config/config.js"
import type { WorkerRequest, WorkerMessage, WorkerControl, AgentType } from "./protocol.js"
import { AGENT_TYPE_TOOLS } from "./protocol.js"

const DEFAULT_WORKER_TIMEOUT  = 300_000   // 5 dakika — heartbeat'le reset edilir
const HEARTBEAT_GRACE         = 45_000    // heartbeat gelmezse bu kadar sonra timeout
const DEFAULT_MAX_WORKERS     = 4

const ENV_VAR_KEYS = [
  "ANTHROPIC_API_KEY", "OPENAI_API_KEY", "OPENROUTER_API_KEY",
  "GOOGLE_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY",
  "OPENCODE_API_KEY", "XAI_API_KEY",
  "AZURE_OPENAI_API_KEY", "AZURE_OPENAI_ENDPOINT", "AZURE_OPENAI_DEPLOYMENT",
  "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_SESSION_TOKEN", "AWS_REGION",
  "OLLAMA_HOST", "OLLAMA_BASE_URL", "OLLAMA_DEFAULT_MODEL",
  "AURICT_PROVIDER",
] as const

function collectEnvVars(): Record<string, string> {
  const vars: Record<string, string> = {}
  for (const k of ENV_VAR_KEYS) {
    const v = process.env[k]
    if (v) vars[k] = v
  }
  return vars
}

export interface AgentInfo {
  id:              string
  name:            string   // human-readable role name (routing için)
  type:            AgentType
  desc:            string
  status:          "running" | "done" | "error"
  result?:         string
  error?:          string
  startedAt:       number
  sessionId:       string
  parentSessionId: string
  currentTool?:    string
  toolCount:       number
  lastLine?:       string
}

interface PoolEntry {
  worker:      Worker
  info:        AgentInfo
  timer:       ReturnType<typeof setTimeout>
  resolve:     (result: string) => void
  reject:      (err: Error) => void
  onText?:     (delta: string) => void
  textBuffer:  string
}

class AgentPool {
  private entries    = new Map<string, PoolEntry>()
  private byName     = new Map<string, string>()   // name.toLowerCase() → id
  private listeners: Array<(agents: AgentInfo[]) => void> = []

  constructor() {
    // Startup scan: process restart'ta "running" kalan session'ları "crashed" yap
    this.recoverOrphanedSessions()
  }

  private recoverOrphanedSessions() {
    const running = SessionManager.list().filter(
      (s) => (s as any).status === "running" && s.parentId !== null,
    )
    for (const s of running) {
      SessionManager.end(s.id, "crashed")
    }
  }

  get active(): AgentInfo[] {
    return [...this.entries.values()].map((e) => e.info)
  }

  listSessions(parentSessionId?: string) {
    return SessionManager.list().filter((s) =>
      parentSessionId ? s.parentId === parentSessionId : s.parentId !== null,
    )
  }

  onChange(cb: (agents: AgentInfo[]) => void): () => void {
    this.listeners.push(cb)
    return () => { this.listeners = this.listeners.filter((l) => l !== cb) }
  }

  private notify() {
    const list = this.active
    for (const l of this.listeners) l(list)
  }

  private flushText(entry: PoolEntry) {
    if (!entry.textBuffer) return
    SessionManager.addPart({
      sessionId: entry.info.sessionId,
      role:      "assistant",
      type:      "text",
      content:   entry.textBuffer,
    })
    entry.textBuffer = ""
  }

  private makeTimer(id: string, ms: number): ReturnType<typeof setTimeout> {
    return setTimeout(() => {
      const entry = this.entries.get(id)
      if (!entry) return
      this.terminate(id, "timeout")
      entry.reject(new Error(`Agent ${id} timed out`))
    }, ms)
  }

  // ── send_message routing ─────────────────────────────────────────────────────
  private routeMessage(from: string, fromName: string, to: string, message: string) {
    // SQLite'a kaydet — kalıcı history + crash recovery
    const fromEntry = this.entries.get(from)
    if (fromEntry) {
      SessionManager.addPart({
        sessionId: fromEntry.info.sessionId,
        role:      "system",
        type:      "agent_message",
        content:   JSON.stringify({ direction: "out", to, message }),
      })
    }

    if (to === "*") {
      for (const [id, entry] of this.entries) {
        if (id === from) continue
        this.deliverMessage(entry, from, fromName, message)
      }
    } else {
      const targetId = this.byName.get(to.toLowerCase()) ?? (this.entries.has(to) ? to : null)
      if (!targetId) return
      const target = this.entries.get(targetId)
      if (!target) return
      this.deliverMessage(target, from, fromName, message)
    }
  }

  private deliverMessage(entry: PoolEntry, from: string, fromName: string, message: string) {
    SessionManager.addPart({
      sessionId: entry.info.sessionId,
      role:      "system",
      type:      "agent_message",
      content:   JSON.stringify({ direction: "in", from: fromName, message }),
    })
    const ctrl: WorkerControl = { type: "inbox_message", from, fromName, message }
    entry.worker.postMessage(ctrl)
  }

  spawn(opts: {
    id:              string
    agentType:       AgentType
    desc:            string
    prompt:          string
    provider:        string
    model:           string
    workdir:         string
    sessionId:       string
    workerSessionId: string
    allowedTools?:   string[]
    onText?:         (delta: string) => void
  }): Promise<string> {
    const agentsCfg  = loadConfig(opts.workdir).agents ?? {}
    const maxWorkers = agentsCfg.maxWorkers ?? DEFAULT_MAX_WORKERS
    if (this.entries.size >= maxWorkers) {
      return Promise.reject(new Error(`Worker pool full (max ${maxWorkers})`))
    }

    const subSessionId = SessionManager.create(
      { provider: opts.provider, model: opts.model },
      { title: `[${opts.agentType}] ${opts.desc}`, parentId: opts.sessionId },
    )

    SessionManager.addPart({
      sessionId: subSessionId,
      role:      "user",
      type:      "text",
      content:   opts.prompt,
    })

    return new Promise<string>((resolve, reject) => {
      const worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" })

      const info: AgentInfo = {
        id:              opts.id,
        name:            opts.desc,
        type:            opts.agentType,
        desc:            opts.desc,
        status:          "running",
        startedAt:       Date.now(),
        sessionId:       subSessionId,
        parentSessionId: opts.sessionId,
        toolCount:       0,
      }

      const workerTimeout = (loadConfig(opts.workdir).agents?.timeout) ?? DEFAULT_WORKER_TIMEOUT
      const entry: PoolEntry = {
        worker,
        info,
        timer:      this.makeTimer(opts.id, workerTimeout),
        resolve,
        reject,
        textBuffer: "",
        ...(opts.onText !== undefined ? { onText: opts.onText } : {}),
      }

      this.entries.set(opts.id, entry)
      this.byName.set(opts.desc.toLowerCase(), opts.id)
      this.notify()

      hooks.emit("v1.agent.spawn", { childSessionId: subSessionId, type: opts.agentType, prompt: opts.prompt })
      sseManager.emit(opts.sessionId, {
        type: "agent_spawn",
        data: { id: opts.id, agentType: opts.agentType, sessionId: subSessionId },
      })

      worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
        this.handleMessage(opts.id, opts.sessionId, event.data)
      }
      worker.onerror = (err) => {
        this.flushText(entry)
        SessionManager.end(subSessionId, "error")
        this.terminate(opts.id, "error")
        reject(new Error(String(err.message)))
      }

      const workspacePath = ensureWorkspace(opts.workdir, opts.sessionId)

      const req: WorkerRequest = {
        id:            opts.id,
        agentName:     opts.desc,
        agentType:     opts.agentType,
        prompt:        opts.prompt,
        provider:      opts.provider,
        model:         opts.model,
        workdir:       opts.workdir,
        allowedTools:  opts.allowedTools ?? AGENT_TYPE_TOOLS[opts.agentType],
        sessionId:     subSessionId,
        workspacePath,
        envVars:       collectEnvVars(),
      }
      worker.postMessage(req)
    })
  }

  private handleMessage(id: string, parentSessionId: string, msg: WorkerMessage) {
    const entry = this.entries.get(id)
    if (!entry) return
    const { sessionId } = entry.info

    switch (msg.type) {
      case "heartbeat": {
        // Timer'ı resetle — worker hala canlı
        clearTimeout(entry.timer)
        entry.timer = this.makeTimer(id, HEARTBEAT_GRACE)
        break
      }

      case "send_message": {
        this.routeMessage(msg.from, msg.fromName, msg.to, msg.message)
        break
      }

      case "text": {
        entry.onText?.(msg.delta)
        entry.textBuffer += msg.delta
        if (msg.delta.trim()) {
          const last = msg.delta.split("\n").filter((l) => l.trim()).pop()
          if (last) { entry.info.lastLine = last.slice(0, 80); this.notify() }
        }
        break
      }

      case "tool_call": {
        this.flushText(entry)
        SessionManager.addPart({
          sessionId,
          role:    "assistant",
          type:    "tool_call",
          content: JSON.stringify({ tool: msg.tool, args: msg.args }),
        })
        entry.info.currentTool = msg.tool
        entry.info.toolCount   = (entry.info.toolCount ?? 0) + 1
        this.notify()
        sseManager.emit(parentSessionId, {
          type: "tool_call",
          data: { id: msg.id, tool: msg.tool, args: msg.args },
        })
        break
      }

      case "tool_result": {
        SessionManager.addPart({
          sessionId,
          role:    "tool",
          type:    "tool_result",
          content: typeof msg.result === "string" ? msg.result : JSON.stringify(msg.result),
        })
        delete entry.info.currentTool
        this.notify()
        sseManager.emit(parentSessionId, {
          type: "tool_result",
          data: { id: msg.id, result: msg.result, status: "success" },
        })
        break
      }

      case "done": {
        clearTimeout(entry.timer)
        this.flushText(entry)
        entry.info.status = "done"
        entry.info.result = msg.result
        if (msg.result) {
          SessionManager.addPart({
            sessionId,
            role:    "assistant",
            type:    "text",
            content: msg.result,
            tokens:  msg.tokens.output,
          })
        }
        SessionManager.end(sessionId, "complete")
        hooks.emit("v1.agent.complete", { childSessionId: sessionId, result: msg.result })
        sseManager.emit(parentSessionId, { type: "agent_done", data: { id, result: msg.result } })
        this.entries.delete(id)
        this.byName.delete(entry.info.name.toLowerCase())
        this.notify()
        entry.worker.terminate()
        entry.resolve(msg.result)
        break
      }

      case "error": {
        clearTimeout(entry.timer)
        this.flushText(entry)
        entry.info.status = "error"
        entry.info.error  = msg.message
        SessionManager.end(sessionId, "error")
        hooks.emit("v1.agent.error", { childSessionId: sessionId, error: msg.message })
        sseManager.emit(parentSessionId, { type: "agent_error", data: { id, error: msg.message } })
        this.entries.delete(id)
        this.byName.delete(entry.info.name.toLowerCase())
        this.notify()
        entry.worker.terminate()
        entry.reject(new Error(msg.message))
        break
      }
    }
  }

  private terminate(id: string, reason: string) {
    const entry = this.entries.get(id)
    if (!entry) return
    clearTimeout(entry.timer)
    this.flushText(entry)
    SessionManager.end(entry.info.sessionId, reason)
    entry.info.status = "error"
    entry.info.error  = reason
    try { entry.worker.postMessage({ type: "abort" } as WorkerControl) } catch { /* zaten kapanmış */ }
    entry.worker.terminate()
    this.entries.delete(id)
    this.byName.delete(entry.info.name.toLowerCase())
    this.notify()
  }

  cancel(id: string): void {
    this.terminate(id, "cancelled")
  }
}

export const agentPool = new AgentPool()
