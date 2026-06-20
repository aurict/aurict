import { join } from "path"
import { homedir } from "os"
import { readFileSync } from "fs"
import type { AurictConfig } from "./types.js"

function readJSON(path: string): Partial<AurictConfig> {
  try {
    return JSON.parse(readFileSync(path, "utf8")) as Partial<AurictConfig>
  } catch { return {} }
}

// Yükleme önceliği: global < proje < CLI flags (son kazanır)
export function loadConfig(workdir: string): AurictConfig {
  const global  = readJSON(join(homedir(), ".aurict", "config.json"))
  const project = readJSON(join(workdir, ".aurict", "config.json"))

  return deepMerge(
    deepMerge({}, global as Record<string, unknown>) as Record<string, unknown>,
    project as Record<string, unknown>,
  )
}

function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): AurictConfig { // eslint-disable-line @typescript-eslint/no-explicit-any
  const result = { ...target }
  for (const [k, v] of Object.entries(source)) {
    if (v !== null && typeof v === "object" && !Array.isArray(v) && typeof target[k] === "object") {
      result[k] = deepMerge(target[k] as Record<string, unknown>, v as Record<string, unknown>)
    } else if (v !== undefined) {
      result[k] = v
    }
  }
  return result as AurictConfig
}

// ─── CLI flag parser ──────────────────────────────────────────────────────────

export interface CLIFlags {
  provider?: string
  model?:    string
  system?:   string
  stream?:   boolean
  version?:  boolean
  help?:     boolean
  undercover?: boolean
}

export function parseFlags(argv = process.argv.slice(2)): CLIFlags {
  const flags: CLIFlags = {}
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!
    switch (arg) {
      case "--provider": case "-p": { const v = argv[++i]; if (v !== undefined) flags.provider = v; break }
      case "--model":    case "-m": { const v = argv[++i]; if (v !== undefined) flags.model    = v; break }
      case "--system":   case "-s": { const v = argv[++i]; if (v !== undefined) flags.system   = v; break }
      case "--undercover": flags.undercover = true; break
      case "--stream":              flags.stream   = true;       break
      case "--no-stream":           flags.stream   = false;      break
      case "--version":  case "-v": flags.version  = true;       break
      case "--help":     case "-h": flags.help     = true;       break
    }
  }
  return flags
}

export function applyFlags(cfg: AurictConfig, flags: CLIFlags): AurictConfig {
  const result = { ...cfg }
  if (flags.provider !== undefined) (result as Record<string, unknown>)["provider"] = flags.provider
  if (flags.model    !== undefined) (result as Record<string, unknown>)["model"]    = flags.model
  if (flags.system   !== undefined) (result as Record<string, unknown>)["system"]   = flags.system
  if (flags.undercover !== undefined) (result as Record<string, unknown>)["undercover"] = flags.undercover
  if (flags.stream   !== undefined) (result as Record<string, unknown>)["stream"]   = flags.stream
  return result
}
