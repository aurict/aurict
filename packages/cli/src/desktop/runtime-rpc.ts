import { readFileSync } from "node:fs"
import {
  defaultExportFilename,
  exportToHtml,
  exportToMarkdown,
  globalMCPConfigPath,
  loadMCPConfig,
  mcpManager,
  ptyManager,
  removeMCPServer,
  saveMCPServer,
  sessionSnapshotScope,
  setMCPServerEnabled,
  snapshotManager,
  type CoreMessage,
  type MCPServerConfig,
} from "@aurict/core"
import { commit, createBranch, fileDiff, openPullRequest, revertFile, workspaceStatus } from "./workspace-git.js"

export interface CheckpointInfo { id: string; prompt: string; createdAt: number; files: string[] }
export type RuntimeEvent =
  | { type: "shell:output"; id: string; text: string }
  | { type: "shell:exit"; id: string; code: number | null }
  | { type: "checkpoint:created"; checkpoint: CheckpointInfo }

interface RuntimeContext {
  workdir: string
  sessionId: () => string
  history: () => CoreMessage[]
  emit: (event: RuntimeEvent) => void
}

const MAX_CHECKPOINTS_PER_SESSION = 50
const SHELL_POLL_MS = 150

/** Per-turn file checkpoints, keyed by session; the snapshot scope matches the file tools'. */
export class TurnCheckpoints {
  private bySession = new Map<string, Array<CheckpointInfo & { mark: number }>>()

  constructor(private workdir: string) {}

  begin(sessionId: string, prompt: string) {
    const scope = sessionSnapshotScope(this.workdir, sessionId)
    return { sessionId, prompt, scope, mark: snapshotManager.mark(scope) }
  }

  finish(turn: ReturnType<TurnCheckpoints["begin"]>): CheckpointInfo | null {
    const files = snapshotManager.changedFilesSince(turn.mark, turn.scope)
    if (files.length === 0) return null
    const checkpoint = { id: crypto.randomUUID(), prompt: turn.prompt.slice(0, 200), createdAt: Date.now(), files, mark: turn.mark }
    const list = this.bySession.get(turn.sessionId) ?? []
    list.push(checkpoint)
    this.bySession.set(turn.sessionId, list.slice(-MAX_CHECKPOINTS_PER_SESSION))
    return publicCheckpoint(checkpoint)
  }

  list(sessionId: string): CheckpointInfo[] {
    return (this.bySession.get(sessionId) ?? []).map(publicCheckpoint).reverse()
  }

  /** Restores files to the state before the chosen turn; later checkpoints are dropped. */
  async restore(sessionId: string, id: string): Promise<string[]> {
    const list = this.bySession.get(sessionId) ?? []
    const index = list.findIndex((checkpoint) => checkpoint.id === id)
    const target = list[index]
    if (!target) throw new Error("That checkpoint is no longer available.")
    const restored = await snapshotManager.restoreToMark(target.mark, sessionSnapshotScope(this.workdir, sessionId))
    this.bySession.set(sessionId, list.slice(0, index))
    return restored
  }
}

function publicCheckpoint({ id, prompt, createdAt, files }: CheckpointInfo): CheckpointInfo {
  return { id, prompt, createdAt, files }
}

function messageText(message: CoreMessage): string {
  const content = (message as { content: unknown }).content
  if (typeof content === "string") return content
  if (Array.isArray(content)) return content.map((part) => (typeof part === "object" && part && "text" in part ? String((part as { text: unknown }).text) : "")).filter(Boolean).join("\n")
  return ""
}

function globalServerNames(): Set<string> {
  try {
    const parsed = JSON.parse(readFileSync(globalMCPConfigPath(), "utf8")) as { mcpServers?: Record<string, unknown> }
    return new Set(Object.keys(parsed.mcpServers ?? {}))
  } catch {
    return new Set()
  }
}

function listMcpServers(workdir: string) {
  const configured = loadMCPConfig(workdir).mcpServers
  const live = new Map(mcpManager.list().map((entry) => [entry.name, entry]))
  const global = globalServerNames()
  return Object.entries(configured).map(([name, server]) => {
    const state = live.get(name)
    const enabled = server.enabled !== false
    const status = !enabled ? "disabled" : (state?.status as "connected" | "connecting" | "error" | undefined) ?? "disconnected"
    return {
      name,
      scope: global.has(name) ? "global" as const : "project" as const,
      enabled,
      status,
      toolCount: state?.toolCount ?? 0,
      ...(state?.error ? { error: state.error } : {}),
      target: server.url ?? [server.command, ...(server.args ?? [])].filter(Boolean).join(" "),
    }
  })
}

async function connectQuietly(name: string, server: MCPServerConfig): Promise<void> {
  // Connection failures are reported through mcpServer/list status, not as RPC errors.
  await mcpManager.connect(name, server).catch((error: unknown) => console.error(`[aurict] MCP server ${name} failed to connect`, error))
}

function shellCommand(command: string): [string, string[]] {
  if (process.platform === "win32") return ["cmd.exe", ["/d", "/s", "/c", command]]
  return [process.env.SHELL || "/bin/sh", ["-lc", command]]
}

export function createRuntimeRpc(context: RuntimeContext, checkpoints: TurnCheckpoints) {
  const { workdir } = context

  const streamShell = (id: string) => {
    let sent = 0
    const timer = setInterval(() => {
      const session = ptyManager.get(id)
      if (!session) { clearInterval(timer); context.emit({ type: "shell:exit", id, code: null }); return }
      const fresh = session.outputChars - sent
      if (fresh > 0) {
        context.emit({ type: "shell:output", id, text: session.outputBuffer.slice(Math.max(0, session.outputBuffer.length - fresh)) })
        sent = session.outputChars
      }
      if (session.status === "exited") { clearInterval(timer); context.emit({ type: "shell:exit", id, code: session.exitCode ?? null }) }
    }, SHELL_POLL_MS)
  }

  const handlers: Record<string, (params: Record<string, unknown>) => Promise<unknown> | unknown> = {
    "checkpoint/list": () => checkpoints.list(context.sessionId()),
    "checkpoint/restore": async ({ id }) => ({ restored: await checkpoints.restore(context.sessionId(), String(id)) }),
    "git/status": () => workspaceStatus(workdir),
    "git/fileDiff": async ({ path }) => ({ patch: await fileDiff(workdir, String(path)) }),
    "git/revertFile": async ({ path }) => { await revertFile(workdir, String(path)); return {} },
    "git/commit": async ({ message, paths }) => ({ commit: await commit(workdir, String(message), Array.isArray(paths) ? paths.map(String) : []) }),
    "git/createBranch": async ({ name }) => { await createBranch(workdir, String(name)); return {} },
    "git/pullRequest": async ({ title, body }) => ({ url: await openPullRequest(workdir, String(title), String(body ?? "")) }),
    "mcpServer/list": () => listMcpServers(workdir),
    "mcpServer/save": async ({ name, server }) => {
      const config = server as MCPServerConfig
      saveMCPServer(String(name), config)
      if (config.enabled !== false) await connectQuietly(String(name), config)
      return {}
    },
    "mcpServer/remove": async ({ name }) => {
      await mcpManager.disconnect(String(name)).catch(() => undefined)
      return { removed: removeMCPServer(String(name)) }
    },
    "mcpServer/setEnabled": async ({ name, enabled }) => {
      setMCPServerEnabled(String(name), Boolean(enabled))
      const server = loadMCPConfig(workdir).mcpServers[String(name)]
      if (enabled && server) await connectQuietly(String(name), server)
      else await mcpManager.disconnect(String(name)).catch(() => undefined)
      return {}
    },
    "session/export": ({ format }) => {
      const messages = context.history().map((message) => ({ role: message.role, content: messageText(message) })).filter((message) => message.content.trim())
      const html = format === "html"
      return { content: html ? exportToHtml(messages) : exportToMarkdown(messages), filename: defaultExportFilename(html ? "html" : "md") }
    },
    "shell/run": async ({ command }) => {
      const text = String(command ?? "").trim()
      if (!text) throw new Error("Type a command to run.")
      const [shell, args] = shellCommand(text)
      const session = await ptyManager.create(shell, args, workdir, undefined, { ownerSessionId: "desktop-terminal" })
      streamShell(session.id)
      return { id: session.id }
    },
    "shell/kill": ({ id }) => { ptyManager.kill(String(id)); return {} },
  }

  return async (method: string, params: unknown): Promise<unknown> => {
    const handler = handlers[method]
    if (!handler) throw new Error(`Unknown runtime method: ${method}`)
    return handler((params ?? {}) as Record<string, unknown>)
  }
}
