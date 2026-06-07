import { join } from "path"
import { homedir } from "os"
import { readFileSync, writeFileSync, mkdirSync, existsSync, chmodSync } from "fs"

export type CompactionStrategy = "aggressive" | "balanced" | "conservative"

export interface OmniConfig {
  providers?:  Record<string, { apiKey?: string; baseUrl?: string }>
  defaults?:   { provider?: string; model?: string; effort?: number }
  compaction?: { tailTurns?: number; strategy?: CompactionStrategy; messageCountThreshold?: number }
}

const GLOBAL_PATH = join(homedir(), ".omnicod", "config.json")

function load(path: string): OmniConfig {
  try {
    if (!existsSync(path)) return {}
    return JSON.parse(readFileSync(path, "utf8")) as OmniConfig
  } catch { return {} }
}

function save(path: string, cfg: OmniConfig): void {
  mkdirSync(join(homedir(), ".omnicod"), { recursive: true })
  writeFileSync(path, JSON.stringify(cfg, null, 2), "utf8")
  try { chmodSync(path, 0o600) } catch { /* ignore on windows */ }
}

function merge(a: OmniConfig, b: OmniConfig): OmniConfig {
  return {
    providers: { ...(a.providers ?? {}), ...(b.providers ?? {}) },
    defaults:  { ...(a.defaults  ?? {}), ...(b.defaults  ?? {}) },
  }
}

/** ~/.omnicod/config.json okur, env var'ları üstüne yazar */
export function loadConfig(projectDir?: string): OmniConfig {
  const global  = load(GLOBAL_PATH)
  const project = projectDir ? load(join(projectDir, ".omnicod", "config.json")) : {}
  const merged  = merge(global, project)

  // Env var'lar her zaman override eder
  const providers = merged.providers ?? {}
  const envKeys: Record<string, string> = {
    "anthropic":  process.env["ANTHROPIC_API_KEY"]  ?? "",
    "openai":     process.env["OPENAI_API_KEY"]      ?? "",
    "openrouter": process.env["OPENROUTER_API_KEY"]  ?? "",
    "google":     process.env["GOOGLE_API_KEY"] ?? process.env["GOOGLE_GENERATIVE_AI_API_KEY"] ?? "",
    "opencode":   process.env["OPENCODE_API_KEY"]    ?? "",
    "ollama":     "",
  }
  for (const [provider, envKey] of Object.entries(envKeys)) {
    if (envKey) {
      providers[provider] = { ...(providers[provider] ?? {}), apiKey: envKey }
    }
  }

  return { ...merged, providers }
}

export function setApiKey(provider: string, apiKey: string): void {
  const cfg = load(GLOBAL_PATH)
  cfg.providers         = cfg.providers ?? {}
  cfg.providers[provider] = { ...(cfg.providers[provider] ?? {}), apiKey }
  save(GLOBAL_PATH, cfg)

  // Aynı zamanda env var olarak set et (mevcut process için)
  const envMap: Record<string, string> = {
    anthropic:  "ANTHROPIC_API_KEY",
    openai:     "OPENAI_API_KEY",
    openrouter: "OPENROUTER_API_KEY",
    google:     "GOOGLE_GENERATIVE_AI_API_KEY",
    opencode:   "OPENCODE_API_KEY",
    xai:        "XAI_API_KEY",
    azure:      "AZURE_OPENAI_API_KEY",
    bedrock:    "AWS_ACCESS_KEY_ID",
  }
  const envVar = envMap[provider]
  if (envVar) process.env[envVar] = apiKey
}

export function setDefault(key: "provider" | "model" | "effort", value: string | number): void {
  const cfg = load(GLOBAL_PATH)
  cfg.defaults = cfg.defaults ?? {}
  if (key === "effort") {
    cfg.defaults.effort = Number(value)
  } else {
    cfg.defaults[key] = String(value)
  }
  save(GLOBAL_PATH, cfg)
}

export function setCompaction(opts: { tailTurns?: number; strategy?: CompactionStrategy }): void {
  const cfg = load(GLOBAL_PATH)
  cfg.compaction = { ...(cfg.compaction ?? {}), ...opts }
  save(GLOBAL_PATH, cfg)
}

export function getConfigPath(): string { return GLOBAL_PATH }
