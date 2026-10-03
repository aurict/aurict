import type { CliCommandSpec } from "./types.js"

const formatOption = {
  name: "format",
  kind: "string",
  valueName: "text|json",
  choices: ["text", "json"],
  description: "Select human-readable or machine-readable output",
} as const

const outputOptions = [
  formatOption,
  {
    name: "audience",
    kind: "string",
    valueName: "human|agent",
    choices: ["human", "agent"],
    description: "Show human progress or only the agent-facing result",
  },
  {
    name: "quiet",
    short: "q",
    kind: "boolean",
    description: "Suppress non-essential diagnostics",
  },
] as const

export const CHAT_COMMAND: CliCommandSpec = {
  name: "chat",
  description: "Start the interactive terminal assistant, or answer piped input",
  usage: "aurict [options]",
  maxPositionals: 0,
  options: [
    { name: "provider", short: "p", kind: "string", valueName: "id", description: "Select provider" },
    { name: "model", short: "m", kind: "string", valueName: "id", description: "Select model" },
    { name: "system", short: "s", kind: "string", valueName: "text", description: "Override system prompt" },
    { name: "undercover", kind: "boolean", description: "Hide AI traces in commits" },
    { name: "stream", kind: "boolean", description: "Enable streaming", conflicts: ["no-stream"] },
    { name: "no-stream", kind: "boolean", description: "Disable streaming", conflicts: ["stream"] },
    { name: "inline", kind: "boolean", description: "Keep history in terminal scrollback (default)", conflicts: ["fullscreen"] },
    { name: "fullscreen", kind: "boolean", description: "Use the alternate-screen cockpit", conflicts: ["inline"] },
    { name: "resume", short: "r", kind: "string", valueName: "session", description: "Continue a saved session by id", conflicts: ["continue"] },
    { name: "continue", short: "c", kind: "boolean", description: "Continue the most recent session", conflicts: ["resume"] },
    { name: "ipc-server", kind: "boolean", description: "Run the desktop sidecar IPC server", hidden: true },
    ...outputOptions,
  ],
}

export const CLI_COMMANDS: readonly CliCommandSpec[] = [
  CHAT_COMMAND,
  {
    name: "doctor",
    description: "Run local install diagnostics",
    usage: "aurict doctor [--json]",
    maxPositionals: 0,
    options: [
      { name: "json", short: "j", kind: "boolean", description: "Emit aurict.doctor/v1 JSON" },
      formatOption,
    ],
  },
  {
    name: "run",
    description: "Run an automated recipe",
    usage: "aurict run <recipe.yaml|recipe.json>",
    minPositionals: 1,
    maxPositionals: 1,
    positionalLabel: "recipe",
    options: outputOptions,
  },
  {
    name: "run-agent",
    description: "Run the agent headlessly with a versioned JSON result",
    usage: "aurict run-agent [instruction] [options]",
    positionalLabel: "instruction",
    options: [
      { name: "instruction", kind: "string", valueName: "text", description: "Agent instruction" },
      { name: "instruction-file", kind: "string", valueName: "path", description: "Read instruction from a file" },
      { name: "workdir", kind: "string", valueName: "path", description: "Workspace directory" },
      { name: "provider", short: "p", kind: "string", valueName: "id", description: "Pin provider", conflicts: ["auto-model"] },
      { name: "model", short: "m", kind: "string", valueName: "id", description: "Pin model", conflicts: ["auto-model"] },
      { name: "auto-model", kind: "boolean", description: "Delegate provider/model routing", conflicts: ["provider", "model"] },
      { name: "max-steps", kind: "string", valueName: "n", description: "Provider step limit" },
      { name: "max-cost-usd", kind: "string", valueName: "n", description: "Estimated-cost limit" },
      { name: "timeout", kind: "string", valueName: "30s|5m", description: "Wall-time limit" },
      { name: "yes", short: "y", kind: "boolean", description: "Allow permission prompts once" },
      { name: "json", kind: "boolean", description: "Write the final JSON result to stdout" },
      { name: "events", kind: "string", valueName: "path|-", description: "Write versioned runtime events as JSONL" },
      { name: "result", kind: "string", valueName: "path|-", description: "Write the final JSON result" },
      { name: "task-id", kind: "string", valueName: "id", description: "Stable task/session identifier" },
    ],
  },
  {
    name: "version",
    aliases: ["v"],
    description: "Show version and build information",
    usage: "aurict version [--json]",
    maxPositionals: 0,
    options: [{ name: "json", kind: "boolean", description: "Emit machine-readable build information" }],
  },
  {
    name: "completion",
    description: "Generate shell completion",
    usage: "aurict completion <bash|zsh|fish|powershell>",
    minPositionals: 1,
    maxPositionals: 1,
    positionalLabel: "shell",
    positionalChoices: ["bash", "zsh", "fish", "powershell"],
  },
]

export function findCliCommand(name: string): CliCommandSpec | undefined {
  return CLI_COMMANDS.find(command => command.name === name || command.aliases?.includes(name))
}
