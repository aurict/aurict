import type { CommandDef } from "./types.js"
import { suggestSlashCommands, tokenizeSlashCommand } from "./command-input.js"
import { agentSecurityCommands } from "./agent-security-commands.js"
import { configAgentCommands } from "./config-agent-commands.js"
import { contextSystemCommands } from "./context-system-commands.js"
import { extensionCommands } from "./extension-commands.js"
import { flightCommands } from "./flight-commands.js"
import { modelCommands } from "./model-commands.js"
import { projectHistoryCommands } from "./project-history-commands.js"
import { proofCommands } from "./proof-commands.js"
import { reviewCommands } from "./review-commands.js"
import { sessionCommands } from "./session-commands.js"
import { utilityCommands } from "./utility-commands.js"
import { visualCommands } from "./visual-commands.js"

const commandGroups: ReadonlyArray<ReadonlyArray<CommandDef>> = [
  proofCommands,
  reviewCommands,
  flightCommands,
  visualCommands,
  modelCommands,
  sessionCommands,
  agentSecurityCommands,
  configAgentCommands,
  extensionCommands,
  projectHistoryCommands,
  contextSystemCommands,
  utilityCommands,
]

const commands: CommandDef[] = commandGroups.flat()

const helpCommand: CommandDef = {
  name: "help",
  aliases: ["h", "?"],
  description: "List all available commands",
  handler: () => {
    const categories: Record<string, string[]> = {
      "Setup & Config": ["init", "doctor", "providers", "models", "config", "theme", "palette", "keys", "settings", "version"],
      "Session & History": ["new", "status", "history", "diff", "diffs", "session", "sessions", "clear", "fork", "branch", "undo", "rewind", "replay", "checkpoints", "proof", "flight"],
      "Agents & AI": ["agent", "agents", "coordinator", "approvals", "autopilot", "undercover", "background", "btw"],
      "Context & Memory": ["pin", "memory", "ctx", "trace", "compact", "worktree"],
      "Tools & Integration": ["review", "commit", "watch", "unwatch", "mcp", "security", "skill", "plugin", "editor", "template", "protect", "unprotect", "design", "adr", "diag", "skill-scores", "visual"],
      "Info & Misc": ["help", "cost", "export", "share", "stash", "crashes", "exit", "pet", "name", "companion"],
    }
    const commandMap = new Map(allCommands().map((command) => [command.name, command]))
    const output: string[] = ["Aurict Commands:\n"]
    for (const [category, names] of Object.entries(categories)) {
      output.push(`  ── ${category} ${"─".repeat(Math.max(0, 40 - category.length))}`)
      for (const name of names) {
        const command = commandMap.get(name)
        if (command) output.push(`    /${command.name.padEnd(14)} ${command.description}`)
      }
      output.push("")
    }
    return { type: "text", content: output.join("\n") }
  },
}

commands.unshift(helpCommand)

function buildLookup(definitions: ReadonlyArray<CommandDef>): Map<string, CommandDef> {
  const lookup = new Map<string, CommandDef>()
  for (const command of definitions) {
    for (const name of [command.name, ...(command.aliases ?? [])]) {
      const normalized = name.toLowerCase()
      const existing = lookup.get(normalized)
      if (existing && existing !== command) {
        throw new Error(`Duplicate slash command or alias: /${normalized}`)
      }
      lookup.set(normalized, command)
    }
  }
  return lookup
}

const byName = buildLookup(commands)

export function parseSlashCommand(input: string): { cmd: string; args: string[] } | null {
  if (!input.startsWith("/")) return null
  const body = input.slice(1).trim()
  if (!body) return null
  const parts = tokenizeSlashCommand(body)
  return { cmd: parts[0]!.toLowerCase(), args: parts.slice(1) }
}

export function suggestCommands(name: string, limit = 3): string[] {
  return suggestSlashCommands(name, commands, limit)
}

export function getCommand(name: string): CommandDef | undefined {
  return byName.get(name.toLowerCase())
}

export function allCommands(): CommandDef[] {
  return commands.slice()
}

export { mergeModelLists } from "./command-helpers.js"
