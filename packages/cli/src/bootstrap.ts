import { createApp, ProviderRegistry, mcpManager, loadCustomTools } from "@omnicod/core"
import { getOrCreateToken, setActiveToken } from "@omnicod/core"
import type { OmniCodConfig } from "./config/types.js"

const DEFAULT_PORT = 7777

export async function bootstrap(cfg: OmniCodConfig = {}): Promise<{ defaultProvider: string; serverToken: string }> {
  const available      = ProviderRegistry.available()
  const defaultProvider = cfg.provider ?? ProviderRegistry.detectDefault()

  const ready   = available.filter((p) => p.hasKey).map((p) => p.name)
  const missing = available.filter((p) => !p.hasKey && p.id !== "ollama").map((p) => envVar(p.id))

  if (ready.length > 0) {
    console.error(`[omnicod] Providers: ${ready.join(", ")} ✓`)
    console.error(`[omnicod] Active: ${defaultProvider}  |  /provider ile değiştir`)
  } else {
    console.error("[omnicod] Uyarı: API key bulunamadı")
    console.error(`[omnicod] Gerekli: ${missing.join(", ")}`)
  }

  const serverToken = getOrCreateToken()
  setActiveToken(serverToken)

  if (cfg.server?.disabled !== true) {
    const port = cfg.server?.port ?? DEFAULT_PORT
    const app  = createApp()
    Bun.serve({ port, hostname: "127.0.0.1", fetch: app.fetch })
    console.error(`[omnicod] Server: http://127.0.0.1:${port}`)
  }

  // MCP server'larını başlat
  mcpManager.init(process.cwd()).catch(() => {})

  // Custom tool'ları yükle: ~/.omnicod/tools/ + .omnicod/tools/
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
