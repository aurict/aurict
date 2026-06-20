import type { Session, CreateSessionOptions, SendMessageOptions, AurictClientOptions } from "./types.js"

export class AurictClient {
  private baseUrl: string
  private token: string | undefined

  constructor(opts: AurictClientOptions = {}) {
    this.baseUrl = opts.baseUrl ?? "http://127.0.0.1:7777"
    this.token = opts.token
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = { "Content-Type": "application/json" }
    if (this.token) h["Authorization"] = `Bearer ${this.token}`
    return h
  }

  async health(): Promise<{ status: string; version: string }> {
    const res = await fetch(`${this.baseUrl}/v1/health`)
    return res.json() as Promise<{ status: string; version: string }>
  }

  async listSessions(): Promise<Session[]> {
    const res = await fetch(`${this.baseUrl}/v1/session`, { headers: this.headers() })
    return res.json() as Promise<Session[]>
  }

  async createSession(opts: CreateSessionOptions = {}): Promise<string> {
    const res = await fetch(`${this.baseUrl}/v1/session`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(opts),
    })
    const data = await res.json() as { id: string }
    return data.id
  }

  async sendMessage(sessionId: string, opts: SendMessageOptions): Promise<void> {
    const res = await fetch(`${this.baseUrl}/v1/session/${sessionId}/message`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ content: opts.content }),
    })

    if (!res.body) throw new Error("No response body")

    const reader = res.body.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      for (const line of chunk.split("\n")) {
        if (!line.startsWith("data: ")) continue
        const raw = line.slice(6)
        if (!raw || raw === "[DONE]") continue
        try {
          const event = JSON.parse(raw) as { type: string; delta?: string; tokens?: { input: number; output: number } }
          if (event.type === "text" && event.delta) opts.onText?.(event.delta)
          if (event.type === "done" && event.tokens) opts.onDone?.(event.tokens)
        } catch {
          // malformed chunk, skip
        }
      }
    }
  }
}
