import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js"
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js"
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js"
import type { MCPServerConfig, MCPToolInfo, MCPResourceInfo, MCPResourceContent } from "./types.js"

export class MCPClient {
  private client:    Client
  private connected: boolean = false

  constructor(
    readonly serverName: string,
    private config: MCPServerConfig,
  ) {
    this.client = new Client({ name: "aurict", version: "0.0.1" })
  }

  async connect(): Promise<void> {
    let transport: StdioClientTransport | StreamableHTTPClientTransport | SSEClientTransport

    if (this.config.url) {
      const url = new URL(this.config.url)
      const requestInit: RequestInit = this.config.headers
        ? { headers: this.config.headers }
        : {}
      // Try StreamableHTTP first, fall back to legacy SSE
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        transport = new StreamableHTTPClientTransport(url, { requestInit }) as any
        await this.client.connect(transport as any)
        this.connected = true
        return
      } catch {
        // Reset client and try SSE
        this.client = new Client({ name: "aurict", version: "0.0.1" })
        transport = new SSEClientTransport(url, { requestInit })
      }
    } else {
      if (!this.config.command) throw new Error(`MCP server '${this.serverName}': command or url is required`)
      transport = new StdioClientTransport({
        command: this.config.command,
        args:    this.config.args ?? [],
        env:     { ...process.env, ...(this.config.env ?? {}) } as Record<string, string>,
      })
    }

    await this.client.connect(transport)
    this.connected = true
  }

  async listTools(): Promise<MCPToolInfo[]> {
    if (!this.connected) return []
    try {
      const { tools } = await this.client.listTools()
      return tools.map((t) => ({
        server:      this.serverName,
        name:        t.name,
        description: t.description ?? "",
        inputSchema: t.inputSchema as Record<string, unknown>,
      }))
    } catch { return [] }
  }

  async listResources(): Promise<MCPResourceInfo[]> {
    if (!this.connected) return []
    try {
      const { resources } = await this.client.listResources()
      return resources.map((r) => ({
        server:      this.serverName,
        uri:         r.uri,
        name:        r.name,
        ...(r.description !== undefined ? { description: r.description } : {}),
        ...(r.mimeType    !== undefined ? { mimeType:    r.mimeType    } : {}),
      }))
    } catch { return [] }
  }

  async readResource(uri: string): Promise<MCPResourceContent[]> {
    const result = await this.client.readResource({ uri })
    return result.contents.map((c) => ({
      uri: c.uri,
      ...(c.mimeType !== undefined ? { mimeType: c.mimeType } : {}),
      ...("text" in c ? { text: c.text } : { blob: (c as { blob: string }).blob }),
    }))
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<string> {
    const result = await this.client.callTool({ name, arguments: args })
    const content = result.content
    if (Array.isArray(content)) {
      return content
        .map((c) => {
          const part = c as { type: string; text?: string }
          return part.type === "text" ? (part.text ?? "") : JSON.stringify(c)
        })
        .join("\n")
    }
    return JSON.stringify(content)
  }

  async disconnect(): Promise<void> {
    if (this.connected) {
      await this.client.close()
      this.connected = false
    }
  }

  get isConnected() { return this.connected }
}
