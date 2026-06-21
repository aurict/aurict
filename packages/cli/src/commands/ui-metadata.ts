import type { CommandDef } from "./types.js"

export type CommandCategory =
  | "session"
  | "model"
  | "agent"
  | "context"
  | "project"
  | "memory"
  | "settings"
  | "export"
  | "system"
  | "companion"

interface CategoryMeta {
  label: string
  icon: string
  order: number
}

const CATEGORY_BY_NAME: Record<string, CommandCategory> = {
  help: "system",
  clear: "session",
  session: "session",
  sessions: "session",
  status: "session",
  history: "session",
  diffs: "session",
  diff: "session",
  branch: "session",
  fork: "session",
  checkpoints: "session",
  jump: "session",
  undo: "session",
  rewind: "session",
  draft: "session",
  editor: "session",
  template: "session",
  model: "model",
  models: "model",
  providers: "model",
  provider: "model",
  agent: "agent",
  agents: "agent",
  coordinator: "agent",
  autopilot: "agent",
  background: "agent",
  bg: "agent",
  context: "context",
  compaction: "context",
  compact: "context",
  memory: "memory",
  mem: "memory",
  pin: "memory",
  skills: "project",
  skill: "project",
  mcp: "project",
  plugins: "project",
  plugin: "project",
  worktree: "project",
  watch: "project",
  unwatch: "project",
  commit: "project",
  gateguard: "project",
  ungateguard: "project",
  decisions: "project",
  diagnostics: "project",
  theme: "settings",
  config: "settings",
  settings: "settings",
  init: "settings",
  setup: "settings",
  prefs: "settings",
  keymap: "settings",
  version: "system",
  doctor: "system",
  health: "system",
  exit: "system",
  quit: "system",
  cost: "system",
  crashes: "system",
  export: "export",
  share: "export",
  design: "project",
  btw: "companion",
  pet: "companion",
  name: "companion",
  companion: "companion",
}

export const COMMAND_CATEGORY_META: Record<CommandCategory, CategoryMeta> = {
  session:   { label: "Session",   icon: "◷", order: 10 },
  model:     { label: "Model",     icon: "◈", order: 20 },
  agent:     { label: "Agents",    icon: "⬡", order: 30 },
  context:   { label: "Context",   icon: "▣", order: 40 },
  project:   { label: "Project",   icon: "⌥", order: 50 },
  memory:    { label: "Memory",    icon: "◆", order: 60 },
  settings:  { label: "Settings",  icon: "⚙", order: 70 },
  export:    { label: "Export",    icon: "⇧", order: 80 },
  system:    { label: "System",    icon: "?", order: 90 },
  companion: { label: "Companion", icon: "♥", order: 100 },
}

export function commandCategory(cmd: CommandDef): CommandCategory {
  const direct = CATEGORY_BY_NAME[cmd.name]
  if (direct) return direct
  for (const alias of cmd.aliases ?? []) {
    const byAlias = CATEGORY_BY_NAME[alias]
    if (byAlias) return byAlias
  }
  return "system"
}

export function commandIcon(cmd: CommandDef): string {
  return COMMAND_CATEGORY_META[commandCategory(cmd)].icon
}

export function commandSearchText(cmd: CommandDef): string {
  return [
    cmd.name,
    ...(cmd.aliases ?? []),
    cmd.description,
    cmd.usage ?? "",
    COMMAND_CATEGORY_META[commandCategory(cmd)].label,
  ].join(" ").toLowerCase()
}

export function commandSortKey(cmd: CommandDef): string {
  const category = commandCategory(cmd)
  return `${String(COMMAND_CATEGORY_META[category].order).padStart(3, "0")}:${cmd.name}`
}
