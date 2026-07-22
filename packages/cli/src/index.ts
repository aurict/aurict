import { EventEmitter } from "node:events"
// Ink adds a listener to its own EventEmitter for every useInput call.
// The default limit of 10 gets exceeded as the component count grows — raised to 50.
EventEmitter.defaultMaxListeners = 50

import { profileCheckpoint, flushProfileReportOnExit } from "./util/startupProfiler.js"
flushProfileReportOnExit()
profileCheckpoint("entry_module_loaded")

import { loadConfig, parseFlags, applyFlags } from "./config/loader.js"
import { migrateLegacyCoreState } from "./util/state-migration.js"
import { registerCustomThemes } from "./tui/theme/custom-themes.js"
import { resolveThemePreference } from "./config/theme-preference.js"

let mcpManagerRef: { disconnectAll(): Promise<void> } | null = null

// ─── Terminal Safety Layer ────────────────────────────────────────────────
function restoreTerminal() {
  try {
    if (!process.stdout.isTTY) return
    process.stdout.write("\x1b[?1049l")  // exit alternate screen
    process.stdout.write("\x1b[?25h")    // show cursor
    process.stdout.write("\x1b[?2004l")  // disable bracketed paste
    process.stdout.write("\x1b[0m")      // reset colors
    process.stdout.write("\r")
  } catch { /* ignore if stdout is already closed */ }
}

process.on("exit", restoreTerminal)
process.on("SIGTERM", () => { restoreTerminal(); process.exit(0) })
process.on("SIGINT",  () => {
  if (!mcpManagerRef) {
    restoreTerminal()
    process.exit(0)
  }
  // Shut down MCP servers — with a timeout; force exit if it doesn't finish within 1 second
  const disconnectTimeout = setTimeout(() => {
    restoreTerminal()
    process.exit(0)
  }, 1000)

  mcpManagerRef.disconnectAll()
    .then(()  => { clearTimeout(disconnectTimeout); restoreTerminal(); process.exit(0) })
    .catch(() => { clearTimeout(disconnectTimeout); restoreTerminal(); process.exit(1) })
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
const [subCmd, recipeFile] = process.argv.slice(2)
profileCheckpoint("flags_parsed")

/** Resolves the signed backend token only for runs that may call Aurict modules. */
async function resolveBackendAccessToken(signal?: AbortSignal): Promise<string | undefined> {
  const [{ ensureAccessToken }, { RemoteApiError }] = await Promise.all([
    import("./remote/auth.js"),
    import("./remote/backend-client.js"),
  ])
  try {
    return await ensureAccessToken(signal)
  } catch (error) {
    if (error instanceof RemoteApiError && error.code === "not_signed_in") return undefined
    throw error
  }
}

// --version
if (flags.version) {
  console.log("Aurict v1.2.13")
  process.exit(0)
}

// --help
if (flags.help && subCmd !== "run-agent") {
  console.log(`
Aurict v1.2.13 — Terminal AI assistant

Usage:
  aurict [options]
  aurict doctor              Run local install diagnostics
  aurict doctor --json       Machine-readable JSON report (aurict.doctor/v1 schema)
  aurict run <recipe.yaml>   Run a recipe (automated multi-step task)
  aurict run-agent <task>    Run the agent headlessly with a JSON result

Options:
  -p, --provider <id>   Select provider (anthropic, openai, openrouter, google, opencode, ollama, xai, azure, bedrock, nvidia, zai, alibaba)
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
  NVIDIA_API_KEY              NVIDIA NIM
  ZAI_API_KEY                 Z.AI (GLM)
  DASHSCOPE_API_KEY           Alibaba (Qwen)
  AURICT_PROVIDER            Default provider override
`)
  process.exit(0)
}

if (subCmd === "doctor") {
  const jsonFlag = process.argv.slice(2).includes("--json") || process.argv.slice(2).includes("-j")
  const { runDoctor } = await import("./util/doctor.js")
  const exitCode = await runDoctor(workdir, { json: jsonFlag })
  process.exit(exitCode)
}

if (subCmd === "run-agent") {
  const { runHeadlessAgentCommand } = await import("./headless/run-agent.js")
  process.exit(await runHeadlessAgentCommand(process.argv.slice(3)))
}

migrateLegacyCoreState()

profileCheckpoint("prefetch_started")
const [reactMod, inkMod] = await Promise.all([
  import("react"),
  import("ink"),
])
profileCheckpoint("react_ink_loaded")

const [
  bootstrapMod,     appMod,
  setupWizardMod,   errorBoundaryMod,
  updateCheckMod,   coreMod,
] = await Promise.all([
  import("./bootstrap.js"),
  import("./tui/App.js"),
  import("./tui/SetupWizard.js"),
  import("./tui/ErrorBoundary.js"),
  import("./util/update-check.js"),
  import("@aurict/core"),
])
profileCheckpoint("prefetch_resolved")

const React   = reactMod.default
const { render } = inkMod
const { bootstrap } = bootstrapMod
const { App } = appMod
const { SetupWizard } = setupWizardMod
const { ErrorBoundary, writeTUIcrashReport } = errorBoundaryMod
const { checkForUpdate } = updateCheckMod
const core = coreMod
const {
  runAgent,
  ProviderRegistry,
  createOpenAICompatiblePlugin,
  mcpManager,
  loadPlugins,
  runRecipe,
  parseRecipeFile,
  loadConfig: loadOmniConfig,
  loadApiKeyFromKeystore,
} = core
mcpManagerRef = mcpManager
profileCheckpoint("core_symbols_destructured")

const omniCfg = loadOmniConfig(workdir)
profileCheckpoint("omni_config_loaded")
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
  nvidia:     ["NVIDIA_API_KEY"],
  zai:        ["ZAI_API_KEY"],
  alibaba:    ["DASHSCOPE_API_KEY"],
}
for (const [provider, val] of Object.entries(omniCfg.providers ?? {})) {
  if (!val.apiKey) continue
  const envVars = PROVIDER_ENV_MAP[provider] ?? [`${provider.toUpperCase()}_API_KEY`]
  for (const envVar of envVars) {
    if (!process.env[envVar]) process.env[envVar] = val.apiKey
  }
  if (provider === "azure" && val.baseUrl && !process.env["AZURE_OPENAI_ENDPOINT"]) {
    process.env["AZURE_OPENAI_ENDPOINT"] = val.baseUrl
  }
}

for (const [provider, envVars] of Object.entries(PROVIDER_ENV_MAP)) {
  if (envVars.length === 0) continue
  const anyEnvSet = envVars.some((v) => Boolean(process.env[v]))
  if (anyEnvSet) continue
  const keystoreKey = await loadApiKeyFromKeystore(provider)
  if (!keystoreKey) continue
  for (const v of envVars) if (!process.env[v]) process.env[v] = keystoreKey
}
profileCheckpoint("keystore_resolved")

// User-added custom providers (no-code path via /providers) — register them
// before the TUI renders so they show up in /providers immediately.
for (const [id, def] of Object.entries(omniCfg.customProviders ?? {})) {
  ProviderRegistry.register(createOpenAICompatiblePlugin({
    id,
    name:         def.name,
    baseURL:      def.baseUrl,
    getApiKey:    () => def.apiKey,
    defaultModel: def.defaultModel,
    models:       [{ id: def.defaultModel, name: def.defaultModel, contextWindow: 128_000, maxOutput: 8_000, supportsTools: true, supportsVision: false }],
    modelsEndpoint: `${def.baseUrl.replace(/\/+$/, "")}/models`,
  }))
}

// ─── --ipc-server: Bun sidecar mode for apps/desktop ────────────────────────
// No TUI/Ink — a JSON-lines protocol over stdio instead. See ipc-server.ts.
// Placed after config/keystore/custom-provider resolution above, so the
// sidecar sees the exact same resolved API keys the TUI path would.
if (flags.ipcServer) {
  const { runIpcServer } = await import("./ipc-server.js")
  await runIpcServer(workdir)
}

// ─── aurict run <recipe.yaml> ────────────────────────────────────────────────
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
  const backendAccessToken = await resolveBackendAccessToken()
  const result = await runRecipe({
    recipe,
    workdir,
    ...(backendAccessToken !== undefined ? { backendAccessToken } : {}),
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

// Load plugins (tool + provider plugins from ~/.aurict/plugins/)
await loadPlugins()
profileCheckpoint("plugins_loaded")

// Load config: global < project < CLI flags
const cfg      = applyFlags(loadConfig(workdir), flags)
registerCustomThemes(workdir)
const initialTheme = resolveThemePreference(cfg.defaults?.theme)
const { defaultProvider, localServer } = await bootstrap(cfg)
profileCheckpoint("bootstrap_done")

const provider   = cfg.provider ?? defaultProvider
const plugin     = ProviderRegistry.get(provider)
const model      = cfg.model ?? plugin.defaultModel()

if (process.stdin.isTTY) {
  // Interactive mode — Ink TUI
  const updatePromise = checkForUpdate()  // fire-and-forget, non-blocking
  profileCheckpoint("app_render_start")

  // Show the onboarding wizard if no provider has a key configured
  const availableProviders = ProviderRegistry.available()
  const noKeyConfigured = availableProviders.every(p => !p.hasKey)
  const selectedProviderInfo = availableProviders.find(p => p.id === provider)
  const selectedNeedsKey = provider !== "ollama" && selectedProviderInfo?.hasKey !== true
  const needsSetup      = noKeyConfigured && selectedNeedsKey && flags.provider === undefined

  if (needsSetup) {
    // Render the App once the wizard completes
    await new Promise<void>((resolve) => {
      const { unmount } = render(
        React.createElement(SetupWizard, {
          onComplete: (chosenProvider: string, chosenModel: string) => {
            unmount()
            const appProps = {
              initialProvider: chosenProvider,
              initialModel:    chosenModel,
              initialTheme,
              workdir,
              updatePromise,
              localServer,
              ...(cfg.system !== undefined ? { system: cfg.system } : {}),
              ...(cfg.undercover !== undefined ? { undercover: cfg.undercover } : {}),
            }
            const { waitUntilExit: wait } = render(
              React.createElement(ErrorBoundary, {
                onError: writeTUIcrashReport,
                children: React.createElement(App, appProps),
              }),
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
      React.createElement(ErrorBoundary, {
        onError: writeTUIcrashReport,
        children: React.createElement(App, {
          initialProvider: provider,
          initialModel:    model,
          initialTheme,
          workdir,
          updatePromise,
          localServer,
          ...(cfg.system !== undefined ? { system: cfg.system } : {}),
          ...(cfg.undercover !== undefined ? { undercover: cfg.undercover } : {}),
        }),
      }),
      { exitOnCtrlC: false },  // We handle Ctrl+C ourselves via useInput in App.tsx
    )
    await waitUntilExit()
  }

  // After Ink unmounts, the process stays alive because of Bun.serve (local server)
  // and MCP child processes — the user is left staring at a frozen screen while
  // keystrokes leak through as raw text. Shut down cleanly:
  if (mcpManagerRef) {
    await Promise.race([
      mcpManagerRef.disconnectAll().catch(() => {}),
      new Promise((res) => setTimeout(res, 1000)),
    ])
  }
  restoreTerminal()
  process.exit(0)
} else {
  // Pipe modu — tek seferlik
  const input = (await Bun.stdin.text()).trim()
  if (!input) { console.error("[aurict] No input received"); process.exit(1) }

  process.stdout.write("\n")
  try {
    await runAgent({
      provider, model, workdir,
      backendAccessTokenResolver: resolveBackendAccessToken,
      ...(cfg.system !== undefined ? { system: cfg.system } : {}),
      messages: [{ role: "user", content: input }],
      runtime: { profile: "headless" },
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
