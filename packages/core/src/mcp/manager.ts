import { MCPClient } from "./client.js"
import { registerMCPTools } from "./bridge.js"
import { loadMCPConfig, enabledServers } from "./config.js"
import { hooks } from "../hook/emitter.js"
import type { MCPServerConfig, MCPResourceInfo, MCPResourceContent } from "./types.js"

interface ServerEntry {
  client:     MCPClient
  toolIds:    string[]
  status:     "connecting" | "connected" | "error"
  error?:     string
}

// MCP log queue — TUI hazır olana kadar logları tutar
let logQueue: Array<{ message: string; isError: boolean }> = []
let logHandler: ((message: string, isError: boolean) => void) | null = null

/**
 * MCP loglarını yakalamak için handler register et
 * Handler set edilene kadar loglar queue'da tutulur
 */
export function setMCPLogHandler(handler: (message: string, isError: boolean) => void): void {
  logHandler = handler
  // Queue'daki logları flush et
  for (const log of logQueue) {
    handler(log.message, log.isError)
  }
  logQueue = []
}

function emitMCPLog(message: string, isError = false): void {
  if (logHandler) {
    logHandler(message, isError)
  } else {
    logQueue.push({ message, isError })
  }
}

class MCPManager {
  private servers = new Map<string, ServerEntry>()

  async init(workdir: string): Promise<void> {
    const cfg     = loadMCPConfig(workdir)
    const enabled = enabledServers(cfg)

    await Promise.allSettled(
      Object.entries(enabled).map(([name, config]) => this.connect(name, config))
    )
  }

  async connect(name: string, config: MCPServerConfig): Promise<void> {
    const client = new MCPClient(name, config)
    this.servers.set(name, { client, toolIds: [], status: "connecting" })

    try {
      await client.connect()
      const toolIds = await registerMCPTools(client)
      this.servers.set(name, { client, toolIds, status: "connected" })

      await hooks.emit("v1.mcp.connected", { serverName: name, tools: toolIds })
      emitMCPLog(`[mcp] ${name}: ${toolIds.length} tool(s) connected`)
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err)
      this.servers.set(name, { client, toolIds: [], status: "error", error })
      emitMCPLog(`[mcp] ${name}: connection error — ${error}`, true)
    }
  }

  async disconnect(name: string): Promise<void> {
    const entry = this.servers.get(name)
    if (!entry) return

    // Timeout ile disconnect — 1 saniye içinde bitmezse force close
    const disconnectPromise = entry.client.disconnect()
    const timeoutPromise = new Promise<void>((resolve) => {
      setTimeout(() => resolve(), 1000)
    })

    await Promise.race([disconnectPromise, timeoutPromise])
    this.servers.delete(name)
    await hooks.emit("v1.mcp.disconnected", { serverName: name })
  }

  async disconnectAll(): Promise<void> {
    await Promise.allSettled([...this.servers.keys()].map((n) => this.disconnect(n)))
  }

  list(): Array<{ name: string; status: string; toolCount: number; error?: string }> {
    return [...this.servers.entries()].map(([name, e]) => ({
      name,
      status:    e.status,
      toolCount: e.toolIds.length,
      ...(e.error !== undefined ? { error: e.error } : {}),
    }))
  }

  async listResources(serverName?: string): Promise<MCPResourceInfo[]> {
    const targets = serverName
      ? [this.servers.get(serverName)].filter(Boolean) as ServerEntry[]
      : [...this.servers.values()]
    const results = await Promise.allSettled(
      targets.map((e) => e.client.listResources())
    )
    return results.flatMap((r) => r.status === "fulfilled" ? r.value : [])
  }

  async readResource(uri: string, serverName?: string): Promise<MCPResourceContent[]> {
    if (serverName) {
      const entry = this.servers.get(serverName)
      if (!entry) throw new Error(`MCP server '${serverName}' not found`)
      return entry.client.readResource(uri)
    }
    // URI'ye göre ilk bağlı sunucuda dene
    for (const entry of this.servers.values()) {
      if (entry.status !== "connected") continue
      try { return await entry.client.readResource(uri) } catch { continue }
    }
    throw new Error(`No MCP server could read resource: ${uri}`)
  }

  isConnected(name: string): boolean {
    return this.servers.get(name)?.status === "connected"
  }
}

export const mcpManager = new MCPManager()
