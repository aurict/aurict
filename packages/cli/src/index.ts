import { EventEmitter } from "node:events"
// Ink adds a listener to its own EventEmitter for every useInput call.
// The default limit of 10 gets exceeded as the component count grows — raised to 50.
EventEmitter.defaultMaxListeners = 50

import { profileCheckpoint, flushProfileReportOnExit } from "./util/startupProfiler.js"
flushProfileReportOnExit()
profileCheckpoint("entry_module_loaded")

import { loadConfig, applyFlags } from "./config/loader.js"
import { migrateLegacyCoreState } from "./util/state-migration.js"
import { registerCustomThemes } from "./tui/theme/custom-themes.js"
import { resolveThemePreference } from "./config/theme-preference.js"
import { parseCli } from "./cli/parser.js"
import { CliUsageError } from "./cli/types.js"
import { renderCliHelp } from "./cli/help.js"
import { CliDispatcher } from "./cli/dispatcher.js"
import { renderCompletion } from "./cli/completion.js"
import { chatOptionsFromParsed } from "./cli/chat-options.js"
import { wantsJsonOutput, writeCliInfrastructureError, writeCliUsageError } from "./cli/errors.js"
import { formatVersionText, getBuildInfo } from "./version.js"
import { alternateScreenActive, setAlternateScreenActive } from "./tui/alternate-screen-state.js"
import { resolveTuiMode } from "./tui/render-mode.js"
import { formatExitSummary, type SessionExitSummary } from "./util/exit-summary.js"
import { createSynchronizedOutput, synchronizedOutputEnabled } from "./util/synchronized-output.js"

let mcpManagerRef: { disconnectAll(): Promise<void> } | null = null

// ─── Terminal Safety Layer ────────────────────────────────────────────────
function restoreTerminal() {
  try {
    if (!process.stdout.isTTY) return
    // Leaving the alternate screen restores the saved cursor; only do it when
    // Aurict is actually on it, or inline output would be overwritten.
    if (alternateScreenActive()) process.stdout.write("\x1b[?1049l")
    setAlternateScreenActive(false)
    process.stdout.write("\x1b[?25h")    // show cursor
    process.stdout.write("\x1b[?2004l")  // disable bracketed paste
    process.stdout.write("\x1b[0m")      // reset colors
    process.stdout.write("\r")
  } catch (error) {
    process.exitCode = process.exitCode || 1
    void error
  }
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
    .catch((error) => {
      clearTimeout(disconnectTimeout)
      console.error("[aurict] Failed to disconnect MCP servers", error)
      restoreTerminal()
      process.exit(1)
    })
})
process.on("uncaughtException",  (err) => {
  restoreTerminal()
  try {
    const { writeCrashReport } = require("./util/draft.js")
    writeCrashReport(err, "uncaughtException")
  } catch (reportError) {
    console.error("[aurict] Failed to write crash report", reportError)
  }
  console.error(err)
  process.exit(1)
})
process.on("unhandledRejection", (r) => {
  restoreTerminal()
  try {
    const { writeCrashReport } = require("./util/draft.js")
    writeCrashReport(r, "unhandledRejection")
  } catch (reportError) {
    console.error("[aurict] Failed to write crash report", reportError)
  }
  console.error(r)
  process.exit(1)
})
// ─────────────────────────────────────────────────────────────────────────────

const workdir = process.cwd()
const argv = process.argv.slice(2)
let cli
try {
  cli = parseCli(argv)
} catch (error) {
  if (error instanceof CliUsageError) {
    writeCliUsageError(error, wantsJsonOutput(argv))
    process.exit(error.exitCode)
  }
  throw error
}
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

if (cli.helpRequested) {
  process.stdout.write(renderCliHelp(cli.command))
  process.exit(0)
}

const earlyCommands = new CliDispatcher()
  .register("version", command => {
    process.stdout.write(command.options["json"] === true
      ? `${JSON.stringify(getBuildInfo(), null, 2)}\n`
      : `${formatVersionText()}\n`)
    return 0
  })
  .register("doctor", async command => {
    const { getDoctorReport, getDoctorReportJson } = await import("./util/doctor.js")
    if (command.options["json"] === true || command.options["format"] === "json") {
      const report = await getDoctorReportJson(workdir)
      process.stdout.write(`${report.json}\n`)
      return report.exitCode
    }
    const report = await getDoctorReport(workdir)
    process.stdout.write(`${report.text}\n`)
    return report.exitCode
  })
  .register("run-agent", async command => {
    const { runHeadlessAgentCommand } = await import("./headless/run-agent.js")
    return runHeadlessAgentCommand([...command.rawArgs])
  })
  .register("completion", command => {
    process.stdout.write(renderCompletion(command.positionals[0]!))
    return 0
  })

let earlyExit: number | null
try {
  earlyExit = await earlyCommands.dispatch(cli)
} catch (error) {
  writeCliInfrastructureError(error, wantsJsonOutput(argv))
  process.exit(1)
}
if (earlyExit !== null) process.exit(earlyExit)

const chatOptions = cli.command.name === "chat" ? chatOptionsFromParsed(cli) : undefined
const flags = chatOptions?.flags ?? {}

// Desktop IPC owns stdin. Enter its dedicated bootstrap before importing Ink
// or the terminal UI, whose input layer intentionally patches stdin globally.
if (flags.ipcServer) {
  migrateLegacyCoreState()
  const { runDesktopSidecar } = await import("./desktop-sidecar.js")
  await runDesktopSidecar(workdir)
  process.exit(0)
}

// ─── aurict run <recipe.yaml> ────────────────────────────────────────────────
if (cli.command.name === "run") {
  const recipeFile = cli.positionals[0]!
  const { runRecipeCommand } = await import("./headless/run-recipe.js")
  process.exit(await runRecipeCommand({
    recipePath: recipeFile,
    workdir,
    format: cli.options["format"] === "json" ? "json" : "text",
    audience: cli.options["audience"] === "agent" ? "agent" : "human",
    quiet: cli.options["quiet"] === true,
    backendAccessTokenResolver: resolveBackendAccessToken,
    prepare: async () => {
      migrateLegacyCoreState()
      const { initializeConfiguredProviders } = await import("./provider-setup.js")
      await initializeConfiguredProviders(workdir)
    },
  }))
}
// ─────────────────────────────────────────────────────────────────────────────

if (!process.stdin.isTTY) {
  // Pipe mode uses only core setup. TUI bootstrap would start the local server,
  // initialize MCP processes, and contaminate machine-readable output.
  const input = await Bun.stdin.text()
  const { runPipeCommand } = await import("./headless/pipe.js")
  process.exit(await runPipeCommand({
    workdir,
    input,
    format: chatOptions?.format ?? "text",
    audience: chatOptions?.audience ?? "human",
    quiet: chatOptions?.quiet ?? false,
    backendAccessTokenResolver: resolveBackendAccessToken,
    prepare: async () => {
      migrateLegacyCoreState()
      const [{ ProviderRegistry, loadPlugins }, { initializeConfiguredProviders }] = await Promise.all([
        import("@aurict/core"),
        import("./provider-setup.js"),
      ])
      await initializeConfiguredProviders(workdir)
      const pluginResults = await loadPlugins({
        logger: chatOptions?.format === "text" && !chatOptions.quiet
          ? message => process.stderr.write(`${message}\n`)
          : () => {},
      })
      const pluginFailure = pluginResults.find(result => result.error)
      if (pluginFailure) throw new Error(`Plugin '${pluginFailure.file}' failed to load: ${pluginFailure.error}`)
      const cfg = applyFlags(loadConfig(workdir), flags)
      return {
        provider: cfg.provider ?? ProviderRegistry.detectDefault(),
        ...(cfg.model !== undefined ? { model: cfg.model } : {}),
        ...(cfg.system !== undefined ? { system: cfg.system } : {}),
        ...(cfg.undercover !== undefined ? { undercover: cfg.undercover } : {}),
      }
    },
  }))
}

// Interactive mode — full bootstrap is intentionally isolated to the TTY path.
// Ink colours through chalk, which ignores NO_COLOR; translate it before Ink loads.
if (process.env["NO_COLOR"] !== undefined && process.env["FORCE_COLOR"] === undefined) process.env["FORCE_COLOR"] = "0"
migrateLegacyCoreState()
profileCheckpoint("prefetch_started")
const [reactMod, inkMod] = await Promise.all([
  import("react"),
  import("ink"),
])
const [
  bootstrapMod, appMod, setupWizardMod,
  errorBoundaryMod, updateCheckMod, coreMod, providerSetupMod, mouseMod,
] = await Promise.all([
  import("./bootstrap.js"),
  import("./tui/App.js"),
  import("./tui/SetupWizard.js"),
  import("./tui/ErrorBoundary.js"),
  import("./util/update-check.js"),
  import("@aurict/core"),
  import("./provider-setup.js"),
  import("./tui/mouse.js"),
])
profileCheckpoint("prefetch_resolved")

const React = reactMod.default
const { render } = inkMod
const { bootstrap } = bootstrapMod
const { App } = appMod
const { SetupWizard } = setupWizardMod
const { ErrorBoundary, writeTUIcrashReport } = errorBoundaryMod
const { checkForUpdate } = updateCheckMod
const { ProviderRegistry, mcpManager, loadPlugins } = coreMod
mcpManagerRef = mcpManager

await providerSetupMod.initializeConfiguredProviders(workdir)
await loadPlugins()
profileCheckpoint("plugins_loaded")

const cfg = applyFlags(loadConfig(workdir), flags)
let tuiMode
try {
  tuiMode = resolveTuiMode({
    flag: chatOptions?.tuiMode,
    env: process.env["AURICT_TUI_MODE"],
    config: cfg.defaults?.tuiMode,
  })
} catch (error) {
  const usageError = new CliUsageError(error instanceof Error ? error.message : String(error))
  writeCliUsageError(usageError, false)
  process.exit(usageError.exitCode)
}
// Inline mode leaves the mouse to the terminal: native selection and scrollback.
if (tuiMode === "inline") mouseMod.disableMouseTracking()
// The UI paints first; MCP servers and custom tools connect behind it.
let resolveServices: () => void = () => {}
const servicesReady = new Promise<void>((resolve) => { resolveServices = resolve })
let exitSummary: SessionExitSummary | null = null
const appSessionProps = {
  tuiMode,
  servicesReady,
  onExitSummary: (summary: SessionExitSummary) => { exitSummary = summary },
  ...(chatOptions?.resumeSessionId !== undefined ? { resumeSessionId: chatOptions.resumeSessionId } : {}),
}
const renderOptions = {
  exitOnCtrlC: false,
  ...(synchronizedOutputEnabled()
    ? createSynchronizedOutput(process.stdout, process.stderr)
    : { stdout: process.stdout, stderr: process.stderr }),
}
registerCustomThemes(workdir)
const initialTheme = resolveThemePreference(cfg.defaults?.theme)
const { defaultProvider, localServer, startServices } = await bootstrap(cfg)
const startServicesAfterFirstFrame = () => {
  void startServices().finally(resolveServices)
}
profileCheckpoint("bootstrap_done")

const provider = cfg.provider ?? defaultProvider
const plugin = ProviderRegistry.get(provider)
const model = cfg.model ?? plugin.defaultModel()
const updatePromise = checkForUpdate()
profileCheckpoint("app_render_start")

const availableProviders = ProviderRegistry.available()
const noKeyConfigured = availableProviders.every(p => !p.hasKey)
const selectedProviderInfo = availableProviders.find(p => p.id === provider)
const selectedNeedsKey = provider !== "ollama" && selectedProviderInfo?.hasKey !== true
const needsSetup = noKeyConfigured && selectedNeedsKey && flags.provider === undefined

if (needsSetup) {
  await new Promise<void>((resolve) => {
    const { unmount } = render(
      React.createElement(SetupWizard, {
        onComplete: (chosenProvider: string, chosenModel: string) => {
          unmount()
          const appProps = {
            initialProvider: chosenProvider,
            initialModel: chosenModel,
            initialTheme,
            workdir,
            updatePromise,
            localServer,
            ...appSessionProps,
            ...(cfg.system !== undefined ? { system: cfg.system } : {}),
            ...(cfg.undercover !== undefined ? { undercover: cfg.undercover } : {}),
          }
          const { waitUntilExit: wait } = render(
            React.createElement(ErrorBoundary, {
              onError: writeTUIcrashReport,
              children: React.createElement(App, appProps),
            }),
            renderOptions,
          )
          startServicesAfterFirstFrame()
          wait().then(resolve)
        },
      }),
      renderOptions,
    )
  })
} else {
  const { waitUntilExit } = render(
    React.createElement(ErrorBoundary, {
      onError: writeTUIcrashReport,
      children: React.createElement(App, {
        initialProvider: provider,
        initialModel: model,
        initialTheme,
        workdir,
        updatePromise,
        localServer,
        ...appSessionProps,
        ...(cfg.system !== undefined ? { system: cfg.system } : {}),
        ...(cfg.undercover !== undefined ? { undercover: cfg.undercover } : {}),
      }),
    }),
    renderOptions,
  )
  startServicesAfterFirstFrame()
  await waitUntilExit()
}

if (mcpManagerRef) {
  await Promise.race([
    mcpManagerRef.disconnectAll().catch((error) => {
      console.error("[aurict] Failed to disconnect MCP servers", error)
    }),
    new Promise((resolve) => setTimeout(resolve, 1000)),
  ])
}
restoreTerminal()
for (const line of formatExitSummary(exitSummary)) process.stdout.write(`${line}\n`)
process.exit(0)
