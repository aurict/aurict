import { Hono } from "hono"
import type { Context } from "hono"
import { streamSSE } from "hono/streaming"
import { ProviderRegistry } from "../provider/registry.js"
import { SessionManager } from "../session/manager.js"
import { sseManager } from "./sse.js"
import { bearerAuth } from "./auth.js"
import { runAgent } from "../agent/loop.js"
import { mcpManager } from "../mcp/manager.js"
import type { SessionConfig } from "../session/types.js"
import type { MCPServerConfig } from "../mcp/types.js"
import { acquireSessionRun } from "./run-lock.js"
import { createSessionSchema, mcpServerSchema, messageSchema, storedSessionConfigSchema } from "./validation.js"

const CORE_VERSION = "1.2.22"

async function jsonBody(c: Context): Promise<unknown> {
  try {
    return await c.req.json()
  } catch {
    throw new Error("INVALID_JSON")
  }
}

export function createApp() {
  const app = new Hono()
  app.use("*", bearerAuth)
  app.onError((error, c) => {
    if (error.message === "INVALID_JSON") return c.json({ error: "Invalid JSON body" }, 400)
    console.error("[aurict] local API request failed", error)
    return c.json({ error: "Internal server error" }, 500)
  })

  app.get("/v1/health", (c) => {
    return c.json({ status: "ok", version: CORE_VERSION })
  })

  app.get("/v1/provider", (c) => {
    const providers = ProviderRegistry.list().map((p) => ({
      id: p.id,
      name: p.name,
      defaultModel: p.defaultModel(),
      models: p.listModels(),
    }))
    return c.json(providers)
  })

  app.get("/v1/session", (c) => {
    return c.json(SessionManager.list())
  })

  app.post("/v1/session", async (c) => {
    const parsed = createSessionSchema.safeParse(await jsonBody(c))
    if (!parsed.success) return c.json({ error: "Invalid request", issues: parsed.error.issues }, 400)
    const body = parsed.data
    const provider = body.provider ?? "anthropic"
    const cfg: SessionConfig = {
      provider,
      model: body.model ?? ProviderRegistry.get(provider).defaultModel(),
      ...(body.system !== undefined ? { system: body.system } : {}),
    }
    const id = SessionManager.create(cfg, body.title !== undefined ? { title: body.title } : {})
    return c.json({ id }, 201)
  })

  app.get("/v1/session/:id", (c) => {
    const session = SessionManager.get(c.req.param("id"))
    if (!session) return c.json({ error: "Not found" }, 404)
    return c.json(session)
  })

  app.post("/v1/session/:id/message", async (c) => {
    const sessionId = c.req.param("id")
    const session = SessionManager.get(sessionId)
    if (!session) return c.json({ error: "Not found" }, 404)

    const parsedBody = messageSchema.safeParse(await jsonBody(c))
    if (!parsedBody.success) return c.json({ error: "Invalid request", issues: parsedBody.error.issues }, 400)
    let rawConfig: unknown = null
    try {
      rawConfig = session.config ? JSON.parse(session.config) : null
    } catch {
      return c.json({ error: "Session configuration is invalid" }, 500)
    }
    const parsedConfig = storedSessionConfigSchema.safeParse(rawConfig)
    if (!parsedConfig.success) {
      return c.json({ error: "Session configuration is invalid" }, 500)
    }
    const cfg: SessionConfig = {
      provider: parsedConfig.data.provider,
      model: parsedConfig.data.model,
      ...(parsedConfig.data.system !== undefined ? { system: parsedConfig.data.system } : {}),
    }
    const releaseRun = acquireSessionRun(sessionId)
    if (!releaseRun) return c.json({ error: "A run is already active for this session" }, 409)

    let parts
    try {
      SessionManager.addPart({ sessionId, role: "user", type: "text", content: parsedBody.data.content })
      parts = SessionManager.getParts(sessionId)
    } catch (error) {
      releaseRun()
      throw error
    }

    return streamSSE(c, async (stream) => {
      let writes = Promise.resolve()
      try {
        const result = await runAgent({
          sessionId,
          stream: true,
          provider: cfg.provider,
          model: cfg.model,
          ...(cfg.system !== undefined ? { system: cfg.system } : {}),
          messages: parts
            .filter((p) => p.role === "user" || p.role === "assistant")
            .map((p) => ({ role: p.role as "user" | "assistant", content: p.content })),
          onText: (delta) => {
            writes = writes.then(async () => {
              await sseManager.emit(sessionId, { type: "text", data: { delta, sessionId } })
              await stream.writeSSE({ data: JSON.stringify({ type: "text", delta }) })
            })
          },
        })
        await writes
        await stream.writeSSE({
          data: JSON.stringify({ type: "done", tokens: result.tokens }),
          event: "done",
        })
      } finally {
        releaseRun()
      }
    })
  })

  app.get("/v1/session/:id/events", (c) => {
    const sessionId = c.req.param("id")
    return streamSSE(c, async (stream) => {
      const unsub = sseManager.subscribe(sessionId, async (event) => {
        await stream.writeSSE({ data: JSON.stringify(event) })
      })
      await new Promise<void>((resolve) => {
        stream.onAbort(resolve)
      })
      unsub()
    })
  })

  // ── MCP endpoints ───────────────────────────────────────────────────────────

  app.get("/v1/mcp", (c) => {
    return c.json(mcpManager.list())
  })

  app.post("/v1/mcp", async (c) => {
    const parsed = mcpServerSchema.safeParse(await jsonBody(c))
    if (!parsed.success) return c.json({ error: "Invalid request", issues: parsed.error.issues }, 400)
    const { name } = parsed.data
    const config: MCPServerConfig = {
      ...(parsed.data.command !== undefined ? { command: parsed.data.command } : {}),
      ...(parsed.data.args !== undefined ? { args: parsed.data.args } : {}),
      ...(parsed.data.env !== undefined ? { env: parsed.data.env } : {}),
      ...(parsed.data.url !== undefined ? { url: parsed.data.url } : {}),
      ...(parsed.data.headers !== undefined ? { headers: parsed.data.headers } : {}),
      ...(parsed.data.enabled !== undefined ? { enabled: parsed.data.enabled } : {}),
    }
    await mcpManager.connect(name, config)
    return c.json({ ok: true, name })
  })

  app.delete("/v1/mcp/:name", async (c) => {
    await mcpManager.disconnect(c.req.param("name"))
    return c.json({ ok: true })
  })

  return app
}
