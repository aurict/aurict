import { EventEmitter } from "node:events"
// Ink her useInput çağrısı için kendi EventEmitter'ına listener ekler.
// Bileşen sayısı arttıkça varsayılan 10 limit aşılır — 50'ye çıkar.
EventEmitter.defaultMaxListeners = 50

import React from "react"
import { render } from "ink"
import { bootstrap } from "./bootstrap.js"
import { runAgent, ProviderRegistry, mcpManager, loadPlugins, runRecipe, parseRecipeFile } from "@aurict/core"
import { loadConfig as loadOmniConfig } from "@aurict/core"
import { loadConfig, parseFlags, applyFlags } from "./config/loader.js"
import { App } from "./tui/App.js"
import { SetupWizard } from "./tui/SetupWizard.js"
import { checkForUpdate } from "./util/update-check.js"

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

// Load API keys from ~/.aurict/config.json into process.env (only if not already set by shell)
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
  console.log("Aurict v1.0.5")
  process.exit(0)
}

// --help
if (flags.help) {
  console.log(`
Aurict v1.0.5 — Terminal AI assistant

Usage:
  aurict [options]
  aurict run <recipe.yaml>   Run a recipe (automated multi-step task)

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
  AURICT_PROVIDER            Default provider override
`)
  process.exit(0)
}

// ─── aurict run <recipe.yaml> ────────────────────────────────────────────────
const [subCmd, recipeFile] = process.argv.slice(2)
if (subCmd === "run") {
  if (!recipeFile) {
    console.error("Usage: aurict run <recipe.yaml|recipe.json>")
    process.exit(1)
  }
  await loadPlugins()
  let recipe
  try {
    recipe = await parseRecipeFile(recipeFile)
  } catch (err) {
    console.error(`[aurict run] Failed to load recipe: ${err instanceof Error ? err.message : err}`)
    process.exit(1)
  }
  console.log(`\n▶  ${recipe.name}${recipe.description ? `\n   ${recipe.description}` : ""}\n`)
  const result = await runRecipe({
    recipe,
    workdir,
    onStepStart: (i, step) => {
      const label = step.name ?? (step.bash ? `bash: ${step.bash.slice(0, 50)}` : `prompt ${i + 1}`)
      process.stdout.write(`\n[${ i + 1}] ${label}\n`)
    },
    onText: (text) => process.stdout.write(text),
    onStepFinish: (_i, _step, _out) => { process.stdout.write("\n") },
  })
  const failed = result.steps.filter(s => s.error)
  if (failed.length > 0) {
    console.error(`\n✗ ${failed.length} step(s) failed:`)
    for (const s of failed) console.error(`  [${s.index + 1}] ${s.name}: ${s.error}`)
    process.exit(1)
  }
  console.log(`\n✓ Recipe complete — ${result.steps.length} step(s)`)
  process.exit(0)
}
// ─────────────────────────────────────────────────────────────────────────────

// Plugin'leri yükle (tool + provider eklentileri ~/.aurict/plugins/)
await loadPlugins()

// Config yükle: global < proje < CLI flags
const cfg      = applyFlags(loadConfig(workdir), flags)
const { defaultProvider } = await bootstrap(cfg)

const provider   = cfg.provider ?? loadOmniConfig(workdir).defaults?.provider ?? defaultProvider
const plugin     = ProviderRegistry.get(provider)
const savedModel = loadOmniConfig(workdir).defaults?.model
const model      = cfg.model ?? savedModel ?? plugin.defaultModel()

if (process.stdin.isTTY) {
  // İnteraktif mod — Ink TUI
  const updatePromise = checkForUpdate()  // fire-and-forget, non-blocking

  // Hiçbir provider'ın key'i yoksa onboarding wizard göster
  const noKeyConfigured = ProviderRegistry.available().every(p => !p.hasKey)
  const needsSetup      = noKeyConfigured && !cfg.provider

  if (needsSetup) {
    // Wizard tamamlanınca App'i render et
    await new Promise<void>((resolve) => {
      const { unmount } = render(
        React.createElement(SetupWizard, {
          onComplete: (chosenProvider: string, chosenModel: string) => {
            unmount()
            const appProps = {
              initialProvider: chosenProvider,
              initialModel:    chosenModel,
              workdir,
              updatePromise,
              ...(cfg.system !== undefined ? { system: cfg.system } : {}),
              ...(cfg.undercover !== undefined ? { undercover: cfg.undercover } : {}),
            }
            const { waitUntilExit: wait } = render(
              React.createElement(App, appProps),
              { exitOnCtrlC: false },
            )
            wait().then(resolve)
          },
        }),
        { exitOnCtrlC: false },
      )
    })
  } else {
    const { waitUntilExit } = render(
      React.createElement(App, {
        initialProvider: provider,
        initialModel:    model,
        workdir,
        updatePromise,
        ...(cfg.system !== undefined ? { system: cfg.system } : {}),
        ...(cfg.undercover !== undefined ? { undercover: cfg.undercover } : {}),
      }),
      { exitOnCtrlC: false },  // Ctrl+C'yi App.tsx'te useInput ile yönetiyoruz
    )
    await waitUntilExit()
  }
} else {
  // Pipe modu — tek seferlik
  const input = (await Bun.stdin.text()).trim()
  if (!input) { console.error("[aurict] No input received"); process.exit(1) }

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
