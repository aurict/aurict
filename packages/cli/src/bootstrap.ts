import { createApp, ProviderRegistry, mcpManager, loadCustomTools, loadUserHooks } from "@aurict/core"
import { getOrCreateToken, setActiveToken } from "@aurict/core"
import { ensureDefaultMCPServers } from "@aurict/core"
import { getMcpActivationMessage, DEFAULT_MCP_SERVERS } from "@aurict/core"
import { checkStaticDeps, installUv, installCodegraph, initCodegraph, patchAgentsMd } from "@aurict/core"
import type { MCPSetupResult } from "@aurict/core"
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

// ── ANSI helpers ──────────────────────────────────────────────────────────────
const C = {
  reset:  "\x1b[0m",
  bold:   "\x1b[1m",
  dim:    "\x1b[2m",
  cyan:   "\x1b[36m",
  green:  "\x1b[32m",
  yellow: "\x1b[33m",
  red:    "\x1b[31m",
  blue:   "\x1b[34m",
}

const SPIN_FRAMES = ["⠋","⠙","⠹","⠸","⠼","⠴","⠦","⠧","⠇","⠏"]

function statusIcon(status: MCPSetupResult["status"]): string {
  switch (status) {
    case "installed": return `${C.green}✓${C.reset}`
    case "ready":     return `${C.green}✓${C.reset}`
    case "skipped":   return `${C.yellow}–${C.reset}`
    case "failed":    return `${C.yellow}⚠${C.reset}`
  }
}

function statusText(r: MCPSetupResult): string {
  switch (r.status) {
    case "installed": return `${C.green}installed${C.reset}`
    case "ready":     return `${C.dim}ready${C.reset}`
    case "skipped":   return `${C.yellow}skipped${C.reset}`
    case "failed":    return `${C.yellow}install manually${C.reset}`
  }
}

async function runAnimatedMCPSetup(): Promise<void> {
  const BOX_W = 52

  const line  = (s = "") => `│  ${s.padEnd(BOX_W - 4)}│`
  const hr    = "─".repeat(BOX_W - 2)
  const top   = `╭${hr}╮`
  const mid   = `├${hr}┤`
  const bot   = `╰${hr}╯`

  const write  = (s: string) => process.stderr.write(s)
  const writeln = (s: string) => process.stderr.write(s + "\n")

  writeln("")
  writeln(top)
  writeln(line(`${C.bold}${C.cyan} Aurict — first time setup${C.reset}`))
  writeln(line())
  writeln(line(` Setting up MCP servers & tools...`))
  writeln(line())
  writeln(mid)

  // Show static entries with real availability check
  const staticDeps = checkStaticDeps()
  for (const s of staticDeps) {
    const icon = s.ok ? `${C.green}✓${C.reset}` : `${C.yellow}–${C.reset}`
    const note = s.ok ? `${C.dim}${s.note}${C.reset}` : `${C.yellow}${s.note}${C.reset}`
    writeln(line(` ${icon}  ${s.name.padEnd(14)} ${note}`))
  }

  // Animated install rows: uv + codegraph
  const installSteps = [
    { key: "uv",        label: "uv",        desc: "Python runtime (git/fetch)" },
    { key: "codegraph", label: "codegraph", desc: "semantic code intelligence"  },
  ]

  let frame = 0
  let spinInterval: ReturnType<typeof setInterval> | null = null

  const startSpinner = (label: string, desc: string) => {
    frame = 0
    spinInterval = setInterval(() => {
      const f = SPIN_FRAMES[frame++ % SPIN_FRAMES.length]!
      write(`\r│  ${C.cyan}${f}${C.reset}  ${label.padEnd(14)} ${C.dim}${desc}...${C.reset}${" ".repeat(4)}│`)
    }, 80)
  }

  const stopSpinner = (result: MCPSetupResult) => {
    if (spinInterval) { clearInterval(spinInterval); spinInterval = null }
    write(`\r${line(` ${statusIcon(result.status)}  ${result.name.padEnd(14)} ${statusText(result)}`)}\n`)
  }

  const installers: Array<() => Promise<MCPSetupResult>> = [installUv, installCodegraph]
  const results: MCPSetupResult[] = []

  for (let i = 0; i < installSteps.length; i++) {
    const step = installSteps[i]!
    startSpinner(step.label, step.desc)
    const r = await installers[i]!()
    stopSpinner(r)
    results.push(r)
  }

  writeln(bot)
  writeln("")

  const cgResult  = results.find(r => r.name === "codegraph")
  const uvResult  = results.find(r => r.name === "uv")

  if (uvResult && (uvResult.status === "failed" || uvResult.status === "skipped")) {
    writeln(` ${C.yellow}→${C.reset}  uv (git/fetch servers) — install manually:`)
    writeln(`     ${C.dim}pip install uv${C.reset}   ${C.dim}or${C.reset}   ${C.dim}curl -LsSf https://astral.sh/uv/install.sh | sh${C.reset}`)
    writeln("")
  }
  if (cgResult && (cgResult.status === "failed" || cgResult.status === "skipped")) {
    writeln(` ${C.yellow}→${C.reset}  codegraph — install manually:`)
    writeln(`     ${C.dim}npx @colbymchenry/codegraph${C.reset}`)
    writeln(`     ${C.dim}then: codegraph init  (once per project)${C.reset}`)
    writeln("")
  } else if (cgResult?.status === "installed" || cgResult?.status === "ready") {
    // Auto-init project index + patch AGENTS.md — no interaction needed
    const cwd      = process.cwd()
    const indexed  = initCodegraph(cwd)
    patchAgentsMd(cwd)
    if (indexed) {
      writeln(` ${C.green}✓${C.reset}  codegraph index built for this project.`)
    } else {
      writeln(` ${C.cyan}→${C.reset}  Run ${C.bold}codegraph init${C.reset} in this project to build the code index.`)
    }
    writeln("")
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

  // İlk çalıştırmada default MCP server'ları aktifleştir + kurulum animasyonu
  const mcpActivated = ensureDefaultMCPServers(process.cwd())
  if (mcpActivated) {
    await runAnimatedMCPSetup()
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
