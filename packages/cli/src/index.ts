import { EventEmitter } from "node:events"
// Ink her useInput çağrısı için kendi EventEmitter'ına listener ekler.
// Bileşen sayısı arttıkça varsayılan 10 limit aşılır — 50'ye çıkar.
EventEmitter.defaultMaxListeners = 50

import React from "react"
import { render } from "ink"
import { bootstrap } from "./bootstrap.js"
import { runAgent, ProviderRegistry, mcpManager, loadPlugins } from "@omnicod/core"
import { loadConfig as loadOmniConfig } from "@omnicod/core"
import { loadConfig, parseFlags, applyFlags } from "./config/loader.js"
import { App } from "./tui/App.js"

// ─── Terminal Güvenlik Katmanı ────────────────────────────────────────────────
function restoreTerminal() {
  try {
    process.stdout.write("\x1b[?25h")    // cursor göster
    process.stdout.write("\x1b[?2004l")  // bracketed paste kapat
    process.stdout.write("\x1b[0m")      // renkleri sıfırla
    process.stdout.write("\r")
  } catch { /* stdout kapandıysa yoksay */ }
}

process.on("exit", restoreTerminal)
process.on("SIGTERM", () => { restoreTerminal(); process.exit(0) })
process.on("SIGINT",  () => {
  mcpManager.disconnectAll()
    .then(()  => { restoreTerminal(); process.exit(0) })
    .catch(() => { restoreTerminal(); process.exit(1) })
})
process.on("uncaughtException",  (err) => {
  restoreTerminal()
  try { const { writeCrashReport } = require("./util/draft.js"); writeCrashReport(err, "uncaughtException") } catch { /* ignore */ }
  console.error(err)
  process.exit(1)
})
process.on("unhandledRejection", (r) => {
  restoreTerminal()
  try { const { writeCrashReport } = require("./util/draft.js"); writeCrashReport(r, "unhandledRejection") } catch { /* ignore */ }
  console.error(r)
  process.exit(1)
})
// ─────────────────────────────────────────────────────────────────────────────

const flags   = parseFlags()
const workdir = process.cwd()

// Load API keys from ~/.omnicod/config.json into process.env (only if not already set by shell)
const omniCfg = loadOmniConfig(workdir)
const PROVIDER_ENV_MAP: Record<string, string[]> = {
  anthropic:  ["ANTHROPIC_API_KEY"],
  openai:     ["OPENAI_API_KEY"],
  openrouter: ["OPENROUTER_API_KEY"],
  google:     ["GOOGLE_GENERATIVE_AI_API_KEY"],
  opencode:   ["OPENCODE_API_KEY"],
  xai:        ["XAI_API_KEY"],
  azure:      ["AZURE_OPENAI_API_KEY"],
  bedrock:    ["AWS_ACCESS_KEY_ID"],
  ollama:     [],
}
for (const [provider, val] of Object.entries(omniCfg.providers ?? {})) {
  if (!val.apiKey) continue
  const envVars = PROVIDER_ENV_MAP[provider] ?? [`${provider.toUpperCase()}_API_KEY`]
  for (const envVar of envVars) {
    if (!process.env[envVar]) process.env[envVar] = val.apiKey
  }
  // Azure also needs baseUrl for the endpoint
  if (provider === "azure" && val.baseUrl && !process.env["AZURE_OPENAI_ENDPOINT"]) {
    process.env["AZURE_OPENAI_ENDPOINT"] = val.baseUrl
  }
}

// --version
if (flags.version) {
  console.log("OmniCod v1.0.4")
  process.exit(0)
}

// --help
if (flags.help) {
  console.log(`
OmniCod v1.0.4 — Terminal AI assistant

Usage:
  omnicod [options]

Options:
  -p, --provider <id>   Select provider (anthropic, openai, openrouter, google, opencode, ollama, xai, azure, bedrock)
  -m, --model <id>      Select model
  -s, --system <text>   Override system prompt
      --undercover      Undercover mode (hides AI traces in commits)
      --stream          Enable streaming
      --no-stream       Disable streaming
  -v, --version         Show version
  -h, --help            Show this help

Slash commands (inside TUI):
  /help      List all commands
  /models    Select model (picker)
  /providers Select provider (picker)
  /clear     Clear chat history
  /session   Show session info
  /exit      Exit

Environment variables:
  ANTHROPIC_API_KEY           Anthropic
  OPENAI_API_KEY              OpenAI
  OPENROUTER_API_KEY          OpenRouter
  GOOGLE_API_KEY              Google
  OPENCODE_API_KEY            OpenCode / Zenmux
  XAI_API_KEY                 xAI (Grok)
  AZURE_OPENAI_API_KEY        Azure OpenAI
  AWS_ACCESS_KEY_ID           AWS Bedrock
  OMNICOD_PROVIDER            Default provider override
`)
  process.exit(0)
}

// Plugin'leri yükle (tool + provider eklentileri ~/.omnicod/plugins/)
await loadPlugins()

// Config yükle: global < proje < CLI flags
const cfg      = applyFlags(loadConfig(workdir), flags)
const { defaultProvider } = await bootstrap(cfg)

const provider = cfg.provider ?? defaultProvider
const plugin   = ProviderRegistry.get(provider)
const model    = cfg.model ?? plugin.defaultModel()

if (process.stdin.isTTY) {
  // İnteraktif mod — Ink TUI
  const { waitUntilExit } = render(
    React.createElement(App, {
      initialProvider: provider,
      initialModel:    model,
      workdir,
      ...(cfg.system !== undefined ? { system: cfg.system } : {}),
      ...(cfg.undercover !== undefined ? { undercover: cfg.undercover } : {}),
    }),
    { exitOnCtrlC: false },  // Ctrl+C'yi App.tsx'te useInput ile yönetiyoruz
  )
  await waitUntilExit()
} else {
  // Pipe modu — tek seferlik
  const input = (await Bun.stdin.text()).trim()
  if (!input) { console.error("[omnicod] No input received"); process.exit(1) }

  process.stdout.write("\n")
  try {
    await runAgent({
      provider, model, workdir,
      ...(cfg.system !== undefined ? { system: cfg.system } : {}),
      messages: [{ role: "user", content: input }],
      onText:   (d) => process.stdout.write(d),
      onFinish: ({ tokens }) => {
        process.stdout.write("\n")
        console.error(`[tokens: ${tokens.input} in / ${tokens.output} out]`)
      },
    })
  } catch (err) {
    console.error(`[error] ${err instanceof Error ? err.message : err}`)
  }
  process.exit(0)
}
