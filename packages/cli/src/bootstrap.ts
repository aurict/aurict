import { createApp, ProviderRegistry, mcpManager, loadCustomTools, loadUserHooks } from "@aurict/core"
import { getOrCreateToken, setActiveToken } from "@aurict/core"
import type { AurictConfig } from "./config/types.js"

const DEFAULT_PORT = 7777

export async function bootstrap(cfg: AurictConfig = {}): Promise<{ defaultProvider: string; serverToken: string }> {
  const available      = ProviderRegistry.available()
  const defaultProvider = cfg.provider ?? ProviderRegistry.detectDefault()

  const ready   = available.filter((p) => p.hasKey).map((p) => p.name)
  const missing = available.filter((p) => !p.hasKey && p.id !== "ollama").map((p) => envVar(p.id))

  if (ready.length > 0) {
    console.error(`[aurict] Providers: ${ready.join(", ")} ✓`)
    console.error(`[aurict] Active: ${defaultProvider}  |  use /providers to switch`)
  } else {
    console.error("[aurict] Warning: no API key found")
    console.error(`[aurict] Set one of: ${missing.join(", ")}`)
  }

  const serverToken = getOrCreateToken()
  setActiveToken(serverToken)

  if (cfg.server?.disabled !== true) {
    const port = cfg.server?.port ?? DEFAULT_PORT
    const app  = createApp()
    Bun.serve({ port, hostname: "127.0.0.1", fetch: app.fetch })
    console.error(`[aurict] Server: http://127.0.0.1:${port}`)
  }

  // Load user-defined hooks from ~/.aurict/hooks.json + .aurict/hooks.json
  loadUserHooks(process.cwd())

  // MCP server'larını başlat
  mcpManager.init(process.cwd()).catch(() => {})

  // Custom tool'ları yükle: ~/.aurict/tools/ + .aurict/tools/
  loadCustomTools(process.cwd()).catch(() => {})

  return { defaultProvider, serverToken }
}

function envVar(id: string): string {
  const m: Record<string, string> = {
    anthropic:  "ANTHROPIC_API_KEY",
    openai:     "OPENAI_API_KEY",
    openrouter: "OPENROUTER_API_KEY",
    google:     "GOOGLE_GENERATIVE_AI_API_KEY",
    opencode:   "OPENCODE_API_KEY",
  }
  return m[id] ?? `${id.toUpperCase()}_API_KEY`
}
