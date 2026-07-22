import { dirname, join } from "path"
import { readFileSync, writeFileSync, mkdirSync, existsSync, chmodSync } from "fs"
import type { FallbackTrigger } from "../provider/fallback.js"
import { coreStatePath } from "../storage/paths.js"

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

/** Multi-agent orkestrasyon — Faz 3 tüketir. Kapalı/off iken davranış değişmez. */
export interface OrchestrationConfig {
  enabled?: boolean
  mode?: "off" | "auto" | "always"
  maxDepth?: number
}

/** Zorlaşan görevlerde reasoning effort/step limitini yükseltme — Faz 2 tüketir. */
export interface EscalationConfig {
  enabled?: boolean
  maxReasoningEffort?: number
  escalateOnRepeatedFailure?: boolean
}

/** Dile-agnostik post-edit doğrulama (tsc dışı diller) — Faz 4 tüketir. */
export interface VerificationRuntimeConfig {
  languages?: Record<string, boolean>
  autoLint?: boolean
}

/** Zorunlu/otomatik critique tetikleme — Faz 4 tüketir. */
export interface CritiqueConfig {
  enabled?: boolean
  adversarial?: boolean
  minLinesForAuto?: number
  provider?: string
  model?: string
  maxEstimatedCostUsd?: number
  fallbackToPrimary?: boolean
  showReviewerIdentity?: boolean
}

/** Low-cost model route for summaries, memory extraction, and other housekeeping. */
export interface UtilityModelConfig {
  provider?: string
  model?: string
  maxInputTokens?: number
  maxOutputTokens?: number
}

export type AgentRuntimeFeature =
  | "canonical_state" | "structured_status" | "utility_model"
  | "persistent_tool_routing" | "prompt_tiering"
  | "background_verification" | "mtime_tool_cache"
  | "multimodal_tools" | "code_navigation" | "browser_drive" | "semantic_search"

export interface OmniConfig {
  providers?:  Record<string, { apiKey?: string; baseUrl?: string }>
  /** User-added OpenAI-compatible providers (no-code path, via `/providers`). */
  customProviders?: Record<string, { name: string; baseUrl: string; apiKey: string; defaultModel: string }>
  defaults?:   {
    provider?: string
    model?: string
    effort?: number
    theme?: string
    /** Continuation bütçesi — Faz 6 CLI'ye taşır (şu an CLI'de hardcoded). */
    maxContinuations?: number
    maxTaskContinuations?: number
  }
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
  /** Explicit/economy model used for non-user-facing housekeeping calls. */
  utilityModel?: UtilityModelConfig
  /** Staged rollout and emergency kill-switches for agent harness layers. */
  agentFeatures?: {
    rolloutPercent?: number
    disabled?: AgentRuntimeFeature[]
  }
  /** Limits the model-visible tool surface to capability packs inferred from the current intent. */
  toolRouting?: {
    enabled?: boolean
    maxVisible?: number
  }
  /** MCP (Model Context Protocol) server yapılandırmaları */
  mcpServers?: Record<string, McpServerConfig>
  /** Optional security capability pack. Disabled by default; hidden from model/tool/skill surfaces when off. */
  securitySandbox?: SecuritySandboxConfig
  /** Core long-task guardrails. Soft mode reports/continues through existing completion gate; strict can block finalization. */
  longTaskRuntime?: LongTaskRuntimeConfig
  /** Multi-agent orchestration and coordinator prompt policy. */
  orchestration?: OrchestrationConfig
  /** Adaptive reasoning effort derived from live task complexity. */
  escalation?: EscalationConfig
  /** Language-agnostic post-edit verification policy. */
  verification?: VerificationRuntimeConfig
  /** Adversarial critique policy for changed code. */
  critique?: CritiqueConfig
}

let globalConfigPathOverride: string | undefined

function globalConfigPath(): string {
  return globalConfigPathOverride ?? coreStatePath('config.json')
}

/** Test-only path override. Production code always resolves from core state. */
export function setGlobalConfigPathForTests(path?: string): void {
  globalConfigPathOverride = path
}

const PROVIDER_ENV_VARS: Record<string, string> = {
  anthropic:  "ANTHROPIC_API_KEY",
  openai:     "OPENAI_API_KEY",
  openrouter: "OPENROUTER_API_KEY",
  google:     "GOOGLE_GENERATIVE_AI_API_KEY",
  opencode:   "OPENCODE_API_KEY",
  xai:        "XAI_API_KEY",
  azure:      "AZURE_OPENAI_API_KEY",
  bedrock:    "AWS_ACCESS_KEY_ID",
  nvidia:     "NVIDIA_API_KEY",
  zai:        "ZAI_API_KEY",
  alibaba:    "DASHSCOPE_API_KEY",
}

function load(path: string): OmniConfig {
  if (!existsSync(path)) return {}
  try {
    return JSON.parse(readFileSync(path, "utf8")) as OmniConfig
  } catch (error) {
    throw new Error(`Failed to read configuration at ${path}: ${error instanceof Error ? error.message : String(error)}`)
  }
}

function save(path: string, cfg: OmniConfig): void {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, JSON.stringify(cfg, null, 2), "utf8")
  if (process.platform !== 'win32') chmodSync(path, 0o600)
}

function merge(a: OmniConfig, b: OmniConfig): OmniConfig {
  return {
    providers:  { ...(a.providers  ?? {}), ...(b.providers  ?? {}) },
    customProviders: { ...(a.customProviders ?? {}), ...(b.customProviders ?? {}) },
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
    utilityModel: { ...(a.utilityModel ?? {}), ...(b.utilityModel ?? {}) },
    agentFeatures: { ...(a.agentFeatures ?? {}), ...(b.agentFeatures ?? {}) },
    toolRouting: { ...(a.toolRouting ?? {}), ...(b.toolRouting ?? {}) },
    mcpServers: { ...(a.mcpServers ?? {}), ...(b.mcpServers ?? {}) },
    securitySandbox: { ...(a.securitySandbox ?? {}), ...(b.securitySandbox ?? {}) },
    longTaskRuntime: { ...(a.longTaskRuntime ?? {}), ...(b.longTaskRuntime ?? {}) },
    orchestration: { ...(a.orchestration ?? {}), ...(b.orchestration ?? {}) },
    escalation: { ...(a.escalation ?? {}), ...(b.escalation ?? {}) },
    verification: { ...(a.verification ?? {}), ...(b.verification ?? {}) },
    critique: { ...(a.critique ?? {}), ...(b.critique ?? {}) },
  }
}

/** Configured core-state config.json reads and is overridden by environment variables. */
export function loadConfig(projectDir?: string): OmniConfig {
  const global  = load(globalConfigPath())
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
  const path = globalConfigPath()
  const cfg = load(path)
  cfg.providers         = cfg.providers ?? {}
  cfg.providers[provider] = { ...(cfg.providers[provider] ?? {}), apiKey }
  save(path, cfg)

  // Aynı zamanda env var olarak set et (mevcut process için)
  const envMap: Record<string, string> = {
    ...PROVIDER_ENV_VARS,
  }
  const envVar = envMap[provider]
  if (envVar) process.env[envVar] = apiKey
}

export interface CustomProviderDef {
  name:         string
  baseUrl:      string
  apiKey:       string
  defaultModel: string
}

export function setCustomProvider(id: string, def: CustomProviderDef): void {
  const path = globalConfigPath()
  const cfg = load(path)
  cfg.customProviders = cfg.customProviders ?? {}
  cfg.customProviders[id] = def
  save(path, cfg)
}

export function removeCustomProvider(id: string): void {
  const path = globalConfigPath()
  const cfg = load(path)
  if (!cfg.customProviders) return
  delete cfg.customProviders[id]
  save(path, cfg)
}

export function setDefault(key: "provider" | "model" | "effort" | "theme", value: string | number): void {
  const path = globalConfigPath()
  const cfg = load(path)
  cfg.defaults = cfg.defaults ?? {}
  if (key === "effort") {
    cfg.defaults.effort = Number(value)
  } else {
    cfg.defaults[key] = String(value)
  }
  save(path, cfg)
}

export function setCompaction(opts: { tailTurns?: number; strategy?: CompactionStrategy }): void {
  const path = globalConfigPath()
  const cfg = load(path)
  cfg.compaction = { ...(cfg.compaction ?? {}), ...opts }
  save(path, cfg)
}

export function setSecuritySandbox(opts: SecuritySandboxConfig): void {
  const path = globalConfigPath()
  const cfg = load(path)
  cfg.securitySandbox = { ...(cfg.securitySandbox ?? {}), ...opts }
  save(path, cfg)
}

export function setLongTaskRuntime(opts: LongTaskRuntimeConfig): void {
  const path = globalConfigPath()
  const cfg = load(path)
  cfg.longTaskRuntime = { ...(cfg.longTaskRuntime ?? {}), ...opts }
  save(path, cfg)
}

export function getConfigPath(): string { return globalConfigPath() }
