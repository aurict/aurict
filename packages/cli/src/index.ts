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

// ~/.omnicod/config.json'dan API key'leri yükle (env var yoksa)
const omniCfg = loadOmniConfig(workdir)
for (const [provider, val] of Object.entries(omniCfg.providers ?? {})) {
  if (val.apiKey) {
    const envMap: Record<string, string> = {
      anthropic:  "ANTHROPIC_API_KEY",
      openai:     "OPENAI_API_KEY",
      openrouter: "OPENROUTER_API_KEY",
      google:     "GOOGLE_GENERATIVE_AI_API_KEY",
      opencode:   "OPENCODE_API_KEY",
    }
    const envVar = envMap[provider]
    if (envVar && !process.env[envVar]) process.env[envVar] = val.apiKey
  }
}

// --version
if (flags.version) {
  console.log("OmniCod v0.0.1")
  process.exit(0)
}

// --help
if (flags.help) {
  console.log(`
OmniCod v0.0.1 — Terminal AI asistanı

Kullanım:
  omnicod [seçenekler]

Seçenekler:
  -p, --provider <id>   Provider seç (anthropic, openai, openrouter, google, opencode, ollama)
  -m, --model <id>      Model seç
  -s, --system <text>   System prompt
      --undercover      Undercover mod (Yapay zeka kimliğini gizle)
      --stream          Streaming etkinleştir
      --no-stream       Streaming devre dışı
  -v, --version         Versiyon göster
  -h, --help            Bu yardım

Slash komutları (TUI içinde):
  /help      Tüm komutları göster
  /models    Model seç (picker)
  /model     Modeli değiştir
  /providers Provider listesi
  /provider  Provider değiştir (picker)
  /clear     Chat temizle
  /session   Session bilgisi
  /exit      Çıkış

Ortam değişkenleri:
  ANTHROPIC_API_KEY     Anthropic key
  OPENAI_API_KEY        OpenAI key
  OPENROUTER_API_KEY    OpenRouter key
  GOOGLE_API_KEY        Google key
  OPENCODE_API_KEY      OpenCode Zen key
  OMNICOD_PROVIDER      Varsayılan provider
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
  if (!input) { console.error("[omnicod] Girdi yok"); process.exit(1) }

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
