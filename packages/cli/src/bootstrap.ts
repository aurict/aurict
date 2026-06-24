import { createApp, ProviderRegistry, mcpManager, loadCustomTools, loadUserHooks } from "@aurict/core"
import { getOrCreateToken, setActiveToken } from "@aurict/core"
import { ensureDefaultMCPServers } from "@aurict/core"
import { getMcpActivationMessage, DEFAULT_MCP_SERVERS } from "@aurict/core"
import type { AurictConfig } from "./config/types.js"

const DEFAULT_PORT = 7777

function isPortInUseError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false
  const code = (err as { code?: unknown }).code
  return code === "EADDRINUSE"
}

export interface LocalServerStatus {
  enabled: boolean
  port?: number
  started: boolean
  reused: boolean
  reason?: string
}

type ServerStarter = (port: number) => void

const defaultServerStarter: ServerStarter = (port) => {
  const app = createApp()
  Bun.serve({ port, hostname: "127.0.0.1", fetch: app.fetch })
}

export function startLocalServer(port: number, starter: ServerStarter = defaultServerStarter): boolean {
  try {
    starter(port)
    return true
  } catch (err) {
    if (isPortInUseError(err)) {
      return false
    }
    throw err
  }
}

function padRow(label: string, value: string, width: number): string {
  const raw = ` ${label.padEnd(9)} ${value}`
  return `│${raw}${" ".repeat(Math.max(0, width - raw.length))}│`
}

function printStartupStatus({
  ready,
  missing,
  defaultProvider,
  localServer,
}: {
  ready: string[]
  missing: string[]
  defaultProvider: string
  localServer: LocalServerStatus
}) {
  const providerText = ready.length > 0 ? ready.join(", ") : "no API key found"
  const serverText = !localServer.enabled
    ? "disabled"
    : localServer.started && localServer.port
      ? `http://127.0.0.1:${localServer.port}`
      : localServer.reused && localServer.port
        ? `port ${localServer.port} already in use`
        : "unavailable"
  const hintText = ready.length > 0
    ? "use /providers to switch"
    : `set ${missing.slice(0, 3).join(", ")}`
  const rows = [
    ["Providers", providerText],
    ["Active", defaultProvider],
    ["Server", serverText],
    ["Hint", hintText],
  ] as const
  const width = Math.max(42, ...rows.map(([label, value]) => ` ${label.padEnd(9)} ${value}`.length))
  console.error("")
  console.error(`╭${"─".repeat(width)}╮`)
  console.error(padRow("Aurict", "ready", width))
  console.error(`├${"─".repeat(width)}┤`)
  for (const [label, value] of rows) console.error(padRow(label, value, width))
  console.error(`╰${"─".repeat(width)}╯`)
}

export async function bootstrap(cfg: AurictConfig = {}): Promise<{ defaultProvider: string; serverToken: string; localServer: LocalServerStatus }> {
  const available      = ProviderRegistry.available()
  const defaultProvider = cfg.provider ?? ProviderRegistry.detectDefault()

  const ready   = available.filter((p) => p.hasKey).map((p) => p.name)
  const missing = available.filter((p) => !p.hasKey && p.id !== "ollama").map((p) => envVar(p.id))

  const serverToken = getOrCreateToken()
  setActiveToken(serverToken)

  const localServer: LocalServerStatus = {
    enabled: cfg.server?.disabled !== true,
    ...(cfg.server?.port !== undefined ? { port: cfg.server.port } : {}),
    started: false,
    reused: false,
  }

  if (cfg.server?.disabled !== true) {
    const port = cfg.server?.port ?? DEFAULT_PORT
    const started = startLocalServer(port)
    localServer.port = port
    localServer.started = started
    localServer.reused = !started
    if (!started) localServer.reason = "port-in-use"
  }

  printStartupStatus({ ready, missing, defaultProvider, localServer })

  // Load user-defined hooks from ~/.aurict/hooks.json + .aurict/hooks.json
  loadUserHooks(process.cwd())

  // İlk çalıştırmada default MCP server'ları aktifleştir
  const mcpActivated = ensureDefaultMCPServers(process.cwd())
  if (mcpActivated) {
    console.error(`\n${getMcpActivationMessage(DEFAULT_MCP_SERVERS)}\n`)
  }

  // MCP server'larını başlat
  mcpManager.init(process.cwd()).catch(() => {})

  // Custom tool'ları yükle: ~/.aurict/tools/ + .aurict/tools/
  loadCustomTools(process.cwd()).catch(() => {})

  return { defaultProvider, serverToken, localServer }
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
