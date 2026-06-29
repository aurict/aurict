import { join } from "path"
import { homedir } from "os"
import { readFileSync, writeFileSync, mkdirSync, existsSync, chmodSync } from "fs"
import type { FallbackTrigger } from "../provider/fallback.js"

export type CompactionStrategy  = "aggressive" | "balanced" | "conservative"
export type TruncationStrategy = "head" | "tail" | "head_tail" | "smart"
export type SecuritySandboxProfile = "off" | "passive" | "active-lite" | "kali-full"
export type SecurityNetworkMode = "none" | "restricted" | "host"

export const SECURITY_IMAGE_REGISTRY = "ghcr.io/aurict"
export const SECURITY_IMAGE_TAG = "latest"
export const SECURITY_IMAGE_REPOSITORIES = {
  "active-lite": "aurict-security-lite",
  "kali-full": "aurict-kali-full",
} as const

export const SECURITY_SANDBOX_IMAGE_DEFAULTS = {
  "active-lite": `${SECURITY_IMAGE_REGISTRY}/${SECURITY_IMAGE_REPOSITORIES["active-lite"]}:${SECURITY_IMAGE_TAG}`,
  "kali-full": `${SECURITY_IMAGE_REGISTRY}/${SECURITY_IMAGE_REPOSITORIES["kali-full"]}:${SECURITY_IMAGE_TAG}`,
} as const

export interface McpServerConfig {
  command: string
  args?: string[]
  env?: Record<string, string>
}

export interface SecuritySandboxConfig {
  enabled?: boolean
  profile?: SecuritySandboxProfile
  image?: string
  network?: SecurityNetworkMode
  targetAllowlist?: string[]
  requireApprovalFor?: string[]
  maxConcurrent?: number
  requestsPerMinute?: number
}

export interface ResolvedSecuritySandboxConfig {
  enabled: boolean
  profile: SecuritySandboxProfile
  image: string
  network: SecurityNetworkMode
  targetAllowlist: string[]
  requireApprovalFor: string[]
  maxConcurrent: number
  requestsPerMinute: number
}

export interface LongTaskRuntimeConfig {
  enabled?: boolean
  mode?: "off" | "shadow" | "soft" | "strict"
  strictVerification?: boolean
  maxContinuationSteps?: number
  maxRecoveryAttempts?: number
  maxVerificationRuns?: number
  maxNoProgressTurns?: number
}

export interface ResolvedLongTaskRuntimeConfig {
  enabled: boolean
  mode: "off" | "shadow" | "soft" | "strict"
  strictVerification: boolean
  maxContinuationSteps: number
  maxRecoveryAttempts: number
  maxVerificationRuns: number
  maxNoProgressTurns: number
}

export const LONG_TASK_RUNTIME_DEFAULTS: ResolvedLongTaskRuntimeConfig = {
  enabled: true,
  mode: "soft",
  strictVerification: true,
  maxContinuationSteps: 12,
  maxRecoveryAttempts: 3,
  maxVerificationRuns: 4,
  maxNoProgressTurns: 3,
}

export const SECURITY_SANDBOX_PROFILE_DEFAULTS: Record<SecuritySandboxProfile, ResolvedSecuritySandboxConfig> = {
  off: {
    enabled: false,
    profile: "off",
    image: "",
    network: "none",
    targetAllowlist: [],
    requireApprovalFor: [],
    maxConcurrent: 0,
    requestsPerMinute: 0,
  },
  passive: {
    enabled: true,
    profile: "passive",
    image: "",
    network: "none",
    targetAllowlist: [],
    requireApprovalFor: [],
    maxConcurrent: 0,
    requestsPerMinute: 0,
  },
  "active-lite": {
    enabled: true,
    profile: "active-lite",
    image: SECURITY_SANDBOX_IMAGE_DEFAULTS["active-lite"],
    network: "restricted",
    targetAllowlist: [],
    requireApprovalFor: ["network-scan", "external-target"],
    maxConcurrent: 1,
    requestsPerMinute: 60,
  },
  "kali-full": {
    enabled: true,
    profile: "kali-full",
    image: SECURITY_SANDBOX_IMAGE_DEFAULTS["kali-full"],
    network: "restricted",
    targetAllowlist: [],
    requireApprovalFor: ["network-scan", "external-target", "kali-full-profile"],
    maxConcurrent: 1,
    requestsPerMinute: 30,
  },
}

export interface OmniConfig {
  providers?:  Record<string, { apiKey?: string; baseUrl?: string }>
  defaults?:   { provider?: string; model?: string; effort?: number }
  compaction?: { tailTurns?: number; strategy?: CompactionStrategy; messageCountThreshold?: number }
  truncation?: {
    maxChars?: number
    strategy?: TruncationStrategy
    perTool?:  Record<string, { maxChars?: number; strategy?: TruncationStrategy }>
  }
  agents?: {
    /** Aynı anda çalışabilecek maksimum worker sayısı (default: 4) */
    maxWorkers?: number
    /** Worker başına timeout ms (default: 300_000) */
    timeout?: number
  }
  /** Provider fallback zinciri — rate limit/timeout durumunda otomatik provider değişimi */
  fallback?: {
    enabled?: boolean
    providers?: string[]
    triggerOn?: FallbackTrigger[]
    maxRetries?: number
    retryDelayMs?: number
    circuitBreakerThreshold?: number
    circuitBreakerResetMs?: number
  }
  /** Cost-aware model routing — task complexity'ye göre otomatik model seçimi */
  routing?: {
    enabled?: boolean
    budgetThresholdUsd?: number
    maxSessionCostUsd?: number
  }
  /** MCP (Model Context Protocol) server yapılandırmaları */
  mcpServers?: Record<string, McpServerConfig>
  /** Optional security capability pack. Disabled by default; hidden from model/tool/skill surfaces when off. */
  securitySandbox?: SecuritySandboxConfig
  /** Core long-task guardrails. Soft mode reports/continues through existing completion gate; strict can block finalization. */
  longTaskRuntime?: LongTaskRuntimeConfig
}

const GLOBAL_PATH = join(homedir(), ".aurict", "config.json")

function load(path: string): OmniConfig {
  try {
    if (!existsSync(path)) return {}
    return JSON.parse(readFileSync(path, "utf8")) as OmniConfig
  } catch { return {} }
}

function save(path: string, cfg: OmniConfig): void {
  mkdirSync(join(homedir(), ".aurict"), { recursive: true })
  writeFileSync(path, JSON.stringify(cfg, null, 2), "utf8")
  try { chmodSync(path, 0o600) } catch { /* ignore on windows */ }
}

function merge(a: OmniConfig, b: OmniConfig): OmniConfig {
  return {
    providers:  { ...(a.providers  ?? {}), ...(b.providers  ?? {}) },
    defaults:   { ...(a.defaults   ?? {}), ...(b.defaults   ?? {}) },
    compaction: { ...(a.compaction ?? {}), ...(b.compaction ?? {}) },
    truncation: {
      ...(a.truncation ?? {}),
      ...(b.truncation ?? {}),
      perTool: { ...(a.truncation?.perTool ?? {}), ...(b.truncation?.perTool ?? {}) },
    },
    agents: { ...(a.agents ?? {}), ...(b.agents ?? {}) },
    fallback: { ...(a.fallback ?? {}), ...(b.fallback ?? {}) },
    routing: { ...(a.routing ?? {}), ...(b.routing ?? {}) },
    mcpServers: { ...(a.mcpServers ?? {}), ...(b.mcpServers ?? {}) },
    securitySandbox: { ...(a.securitySandbox ?? {}), ...(b.securitySandbox ?? {}) },
    longTaskRuntime: { ...(a.longTaskRuntime ?? {}), ...(b.longTaskRuntime ?? {}) },
  }
}

/** ~/.aurict/config.json okur, env var'ları üstüne yazar */
export function loadConfig(projectDir?: string): OmniConfig {
  const global  = load(GLOBAL_PATH)
  const project = projectDir ? load(join(projectDir, ".aurict", "config.json")) : {}
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

export function resolveSecuritySandboxConfig(config?: OmniConfig | SecuritySandboxConfig): ResolvedSecuritySandboxConfig {
  const security = isOmniConfig(config) ? config.securitySandbox : config
  const inferredProfile = security?.profile ?? (security?.enabled === true ? "active-lite" : "off")
  const profile = inferredProfile in SECURITY_SANDBOX_PROFILE_DEFAULTS ? inferredProfile : "off"
  const base = SECURITY_SANDBOX_PROFILE_DEFAULTS[profile]

  if (security?.enabled === false || profile === "off") {
    return {
      ...SECURITY_SANDBOX_PROFILE_DEFAULTS.off,
      targetAllowlist: dedupeStrings(security?.targetAllowlist),
      requireApprovalFor: dedupeStrings(security?.requireApprovalFor),
    }
  }

  return {
    ...base,
    ...security,
    enabled: true,
    profile,
    image: security?.image ?? base.image,
    network: security?.network ?? base.network,
    targetAllowlist: dedupeStrings(security?.targetAllowlist ?? base.targetAllowlist),
    requireApprovalFor: dedupeStrings(security?.requireApprovalFor ?? base.requireApprovalFor),
    maxConcurrent: positiveInt(security?.maxConcurrent, base.maxConcurrent),
    requestsPerMinute: positiveInt(security?.requestsPerMinute, base.requestsPerMinute),
  }
}

export function resolveLongTaskRuntimeConfig(config?: OmniConfig | LongTaskRuntimeConfig): ResolvedLongTaskRuntimeConfig {
  const raw = isOmniConfig(config) ? config.longTaskRuntime : config
  const mode = raw?.mode ?? LONG_TASK_RUNTIME_DEFAULTS.mode
  const enabled = raw?.enabled ?? mode !== "off"
  const resolvedMode = enabled ? mode : "off"
  return {
    ...LONG_TASK_RUNTIME_DEFAULTS,
    ...raw,
    enabled: resolvedMode !== "off",
    mode: resolvedMode,
    strictVerification: raw?.strictVerification ?? LONG_TASK_RUNTIME_DEFAULTS.strictVerification,
    maxContinuationSteps: positiveInt(raw?.maxContinuationSteps, LONG_TASK_RUNTIME_DEFAULTS.maxContinuationSteps),
    maxRecoveryAttempts: positiveInt(raw?.maxRecoveryAttempts, LONG_TASK_RUNTIME_DEFAULTS.maxRecoveryAttempts),
    maxVerificationRuns: positiveInt(raw?.maxVerificationRuns, LONG_TASK_RUNTIME_DEFAULTS.maxVerificationRuns),
    maxNoProgressTurns: positiveInt(raw?.maxNoProgressTurns, LONG_TASK_RUNTIME_DEFAULTS.maxNoProgressTurns),
  }
}

function isOmniConfig(config: unknown): config is OmniConfig {
  return Boolean(config && typeof config === "object" && ("securitySandbox" in config || "longTaskRuntime" in config || "providers" in config || "defaults" in config))
}

function dedupeStrings(values?: string[]): string[] {
  return Array.from(new Set((values ?? []).map(value => value.trim()).filter(Boolean)))
}

function positiveInt(value: number | undefined, fallback: number): number {
  if (value === undefined || !Number.isFinite(value)) return fallback
  return Math.max(0, Math.floor(value))
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

export function setSecuritySandbox(opts: SecuritySandboxConfig): void {
  const cfg = load(GLOBAL_PATH)
  cfg.securitySandbox = { ...(cfg.securitySandbox ?? {}), ...opts }
  save(GLOBAL_PATH, cfg)
}

export function setLongTaskRuntime(opts: LongTaskRuntimeConfig): void {
  const cfg = load(GLOBAL_PATH)
  cfg.longTaskRuntime = { ...(cfg.longTaskRuntime ?? {}), ...opts }
  save(GLOBAL_PATH, cfg)
}

export function getConfigPath(): string { return GLOBAL_PATH }
