import { createWriteStream } from "node:fs"
import { readFile, writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import {
  buildHeadlessRunResult,
  createOpenAICompatiblePlugin,
  ExecutorEvents,
  loadConfig,
  PermissionGate,
  ProviderRegistry,
  runAgent,
  type AgentEvent,
  type HeadlessRunResult,
} from "@aurict/core"

export interface RunAgentCLIOptions {
  instruction?: string
  instructionFile?: string
  workdir: string
  provider?: string
  model?: string
  autoModel: boolean
  allowPermissions: boolean
  maxSteps?: number
  maxCostUsd?: number
  timeoutMs?: number
  taskId: string
  resultPath: string
  eventsPath?: string
}

export function parseRunAgentArgs(argv: string[], cwd = process.cwd()): RunAgentCLIOptions {
  const options: RunAgentCLIOptions = {
    workdir: cwd,
    autoModel: false,
    allowPermissions: false,
    taskId: crypto.randomUUID(),
    resultPath: "-",
  }
  const positional: string[] = []
  const value = (index: number, flag: string): string => {
    const found = argv[index + 1]
    if (!found || found.startsWith("--")) throw new Error(`${flag} requires a value`)
    return found
  }
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index]!
    if (arg === "--yes" || arg === "-y") options.allowPermissions = true
    else if (arg === "--auto-model") options.autoModel = true
    else if (arg === "--json") options.resultPath = "-"
    else if (arg === "--instruction") options.instruction = value(index++, arg)
    else if (arg === "--instruction-file") options.instructionFile = value(index++, arg)
    else if (arg === "--workdir") options.workdir = resolve(cwd, value(index++, arg))
    else if (arg === "--provider" || arg === "-p") options.provider = value(index++, arg)
    else if (arg === "--model" || arg === "-m") options.model = value(index++, arg)
    else if (arg === "--max-steps") options.maxSteps = positiveNumber(value(index++, arg), arg)
    else if (arg === "--max-cost-usd") options.maxCostUsd = positiveNumber(value(index++, arg), arg)
    else if (arg === "--timeout") options.timeoutMs = parseDuration(value(index++, arg))
    else if (arg === "--task-id") options.taskId = value(index++, arg)
    else if (arg === "--result") options.resultPath = value(index++, arg)
    else if (arg === "--events") options.eventsPath = value(index++, arg)
    else if (arg === "--help" || arg === "-h") throw new RunAgentHelpError()
    else if (arg.startsWith("-")) throw new Error(`Unknown run-agent option: ${arg}`)
    else positional.push(arg)
  }
  if (!options.instruction && positional.length > 0) options.instruction = positional.join(" ")
  if (options.autoModel && (options.provider || options.model)) {
    throw new Error("--auto-model cannot be combined with --provider or --model")
  }
  if (options.eventsPath === "-" && options.resultPath === "-") {
    throw new Error("--events - requires --result <file> so JSONL events and the final result do not share stdout")
  }
  return options
}

export class RunAgentHelpError extends Error {}

export async function runHeadlessAgentCommand(argv: string[]): Promise<number> {
  let options: RunAgentCLIOptions
  try {
    options = parseRunAgentArgs(argv)
  } catch (error) {
    if (error instanceof RunAgentHelpError) {
      process.stdout.write(runAgentHelp())
      return 0
    }
    process.stderr.write(`[aurict run-agent] ${error instanceof Error ? error.message : String(error)}\n`)
    return 1
  }

  const runId = crypto.randomUUID()
  const startedAt = Date.now()
  const events: AgentEvent[] = []
  const eventWriter = options.eventsPath ? createEventWriter(options.eventsPath) : undefined
  let selectedProvider = options.provider
  let selectedModel = options.model
  const unsubscribe = ExecutorEvents.on(event => {
    PermissionGate.respond(event.request.id, options.allowPermissions ? "allow_once" : "deny")
  })

  try {
    const instruction = await resolveInstruction(options)
    const config = loadConfig(options.workdir)
    registerCustomProviders(config.customProviders ?? {})
    selectedProvider ??= config.defaults?.provider ?? "anthropic"
    const plugin = ProviderRegistry.get(selectedProvider)
    selectedModel ??= config.defaults?.model ?? plugin.defaultModel()
    const result = await runAgent({
      runId,
      sessionId: options.taskId,
      workdir: options.workdir,
      ...(options.autoModel
        ? { modelSelection: { mode: "auto" as const } }
        : { modelSelection: { mode: "pinned" as const, provider: selectedProvider, model: selectedModel } }),
      messages: [{ role: "user", content: instruction }],
      stream: false,
      runtime: {
        profile: "headless",
        ...(options.maxSteps !== undefined ? { maxSteps: options.maxSteps } : {}),
        budget: {
          ...(options.timeoutMs !== undefined ? { wallTimeMs: options.timeoutMs } : {}),
          ...(options.maxCostUsd !== undefined ? { costUsd: options.maxCostUsd } : {}),
        },
      },
      onModelSelected: selection => {
        selectedProvider = selection.provider
        selectedModel = selection.model
      },
      onEvent: event => {
        events.push(event)
        eventWriter?.write(event)
      },
    })
    const headless = buildHeadlessRunResult({
      taskId: options.taskId,
      provider: selectedProvider,
      model: selectedModel,
      result,
      events,
    })
    await writeResult(options.resultPath, headless)
    return headless.status === "completed" ? 0 : headless.status === "blocked" ? 2 : 130
  } catch (error) {
    const failed: HeadlessRunResult = {
      schema_version: 1,
      task_id: options.taskId,
      run_id: runId,
      status: "infrastructure_error",
      duration_ms: Date.now() - startedAt,
      provider: selectedProvider ?? "unknown",
      model: selectedModel ?? "unknown",
      steps: events.filter(event => event.type === "run.provider_phase" && event.phase === "waiting_for_provider").length,
      tool_calls: events.filter(event => event.type === "tool.requested").length,
      input_tokens: 0,
      output_tokens: 0,
      estimated_cost_usd: 0,
      completion_proof: "missing",
      notes: [error instanceof Error ? error.message : String(error)],
    }
    await writeResult(options.resultPath, failed)
    return 1
  } finally {
    unsubscribe()
    PermissionGate.cancelPending()
    await eventWriter?.close()
  }
}

function registerCustomProviders(definitions: Record<string, { name: string; baseUrl: string; apiKey: string; defaultModel: string }>): void {
  for (const [id, definition] of Object.entries(definitions)) {
    ProviderRegistry.register(createOpenAICompatiblePlugin({
      id,
      name: definition.name,
      baseURL: definition.baseUrl,
      getApiKey: () => definition.apiKey,
      defaultModel: definition.defaultModel,
      models: [{ id: definition.defaultModel, name: definition.defaultModel, contextWindow: 128_000, maxOutput: 8_000, supportsTools: true, supportsVision: false }],
    }))
  }
}

async function resolveInstruction(options: RunAgentCLIOptions): Promise<string> {
  if (options.instruction && options.instructionFile) throw new Error("Use either --instruction or --instruction-file, not both")
  const instruction = options.instructionFile
    ? await readFile(resolve(options.workdir, options.instructionFile), "utf8")
    : options.instruction
  if (!instruction?.trim()) throw new Error("Instruction is required (positional text, --instruction, or --instruction-file)")
  return instruction.trim()
}

function createEventWriter(path: string): { write(event: AgentEvent): void; close(): Promise<void> } {
  const stream = path === "-" ? process.stdout : createWriteStream(path, { flags: "w" })
  return {
    write: event => { stream.write(`${JSON.stringify(event)}\n`) },
    close: async () => {
      if (path === "-") return
      await new Promise<void>((resolveClose, reject) => {
        stream.once("error", reject)
        stream.end(resolveClose)
      })
    },
  }
}

async function writeResult(path: string, result: HeadlessRunResult): Promise<void> {
  const text = `${JSON.stringify(result, null, 2)}\n`
  if (path === "-") process.stdout.write(text)
  else await writeFile(path, text, "utf8")
}

function positiveNumber(raw: string, flag: string): number {
  const value = Number(raw)
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${flag} requires a positive number`)
  return value
}

function parseDuration(raw: string): number {
  const match = raw.match(/^(\d+(?:\.\d+)?)(ms|s|m)?$/)
  if (!match) throw new Error("--timeout accepts values such as 500ms, 30s, or 5m")
  const value = Number(match[1])
  const multiplier = match[2] === "m" ? 60_000 : match[2] === "s" ? 1_000 : 1
  return value * multiplier
}

export function runAgentHelp(): string {
  return `Aurict headless agent\n\nUsage:\n  aurict run-agent [instruction] [options]\n\nOptions:\n  --instruction-file <path>  Read the instruction from a file\n  --workdir <path>           Workspace (default: current directory)\n  -p, --provider <id>        Pin provider\n  -m, --model <id>           Pin model\n  --auto-model               Delegate provider/model routing to core\n  --max-steps <n>            Provider step limit\n  --max-cost-usd <n>         Hard estimated-cost limit\n  --timeout <30s|5m>         Hard wall-time limit\n  -y, --yes                  Allow permission prompts once (default: deny)\n  --events <path|->          Write versioned runtime events as JSONL\n  --result <path|->          Write final JSON result (default: stdout)\n  --task-id <id>             Stable task/session identifier\n`
}
