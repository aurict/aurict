import type { CoreMessage } from "ai"
import type { Attachment } from "../util/attachments.js"
import type { ActivatedSkillInfo } from "../skill/injector.js"
import type { PromptDiagnostics } from "./prompt-diagnostics.js"
import type { PromptCacheHealthResult } from "./prompt-cache-health.js"
import type { ContinuationDecision, ContinuationTaskState } from "./continuation.js"
import type { CompletionGateDecision } from "./completion-gate.js"
import type { LongTaskContinuationDecision } from "./continuation-controller.js"
import type { TaskLedger } from "./task-ledger.js"
import type { CompletionProof } from "./completion-proof.js"
import type { ToolResultArtifact } from "./tool-result-artifact.js"
import type { AgentEvent, RuntimeExecutionOptions, RuntimeRunSummary, ToolOutcome } from "../runtime/contracts.js"
import type { TaskContext } from "../context/types.js"
import type { TurnStatus } from "./turn-status.js"

export interface AgentContinuationOptions {
  getTasks?: (() => ContinuationTaskState[]) | undefined
  previousContinuations?: number | undefined
  maxContinuations?: number | undefined
  maxTaskContinuations?: number | undefined
}

export type AgentRunPhase = "preparing_context" | "resolving_model" | "waiting_for_provider"

/** A conservative snapshot of the prompt that will be sent to the model. */
export interface ContextUsage {
  /** Tokens in persisted conversation messages only. */
  historyTokens: number
  /** History plus system prompt, tools, attachments, and safety margin. */
  effectiveTokens: number
  contextWindow: number
  maxOutputTokens: number
  /** Context pressure at which Aurict must compact before a request. */
  compactionThreshold: number
}

export interface CompactionEvent {
  reason: "history_limit" | "message_limit" | "effective_context_limit"
  before: ContextUsage
  after: ContextUsage
}

export interface AgentRunOptions {
  runId?:       string
  sessionId?:   string
  provider?:    string
  model?:       string
  modelSelection?: { mode: "auto" } | { mode: "pinned"; provider: string; model: string }
  /** Aurict backend access token (varsa) — bonds/rates/legal gibi backend'e konuşan
   *  tool'lara ToolContext üzerinden aktarılır. Yoksa bu tool'lar "giriş yapmamışsın"
   *  mesajı döner, agent turn'u hiç engellenmez. */
  backendAccessToken?: string
  /** Backend erişimi gerektiren bir araç çağrıldığında tokenı çözer. Normal sohbet
   *  başlangıcında çağrılmaz; böylece oturum yenilemesi stream'i bloke edemez. */
  backendAccessTokenResolver?: (signal: AbortSignal) => Promise<string | undefined>
  system?:      string
  undercover?:  boolean
  /** false ise coordinator promptu bu turn'e hiç enjekte edilmez (kullanıcı /coordinator ile
   *  kapattı). true/undefined ise loop.ts kendi karmaşıklık-kapılı kararını verir
   *  (cfg.orchestration.mode — bkz. Faz 3A). */
  coordinatorMode?: boolean
  effort?:      number
  workdir?:     string
  messages:     CoreMessage[]
  signal?:      AbortSignal
  stream?:      boolean
  attachments?:    Attachment[]   // multimodal dosya ekleri
  toolsOverride?:  string[]       // set ise sadece bu tool'lar etkin (session agent kısıtlaması)
  continuation?:   AgentContinuationOptions
  runtime?:        RuntimeExecutionOptions
  taskContext?:    TaskContext
  onEvent?:        (event: AgentEvent) => void
  onModelSelected?: (selection: { provider: string; model: string; mode: "auto" | "pinned" }) => void
  onToolSelection?: (selection: { toolIds: string[]; capabilities: string[]; omittedCount: number; reason: string }) => void
  onText?:        (delta: string, isReasoning?: boolean) => void
  onToolCall?:    (call: { id: string; tool: string; args: unknown }) => void
  onToolResult?:  (res: AgentToolResultEvent) => void
  /** Bash tool çalışırken gelen canlı stdout/stderr chunk'ları */
  onChunk?:       (chunk: string) => void
  onStepFinish?:  () => void
  onCompaction?:  (event: CompactionEvent) => void
  /** Provider fallback zinciri farklı bir provider'a geçtiğinde bir kez tetiklenir. */
  onProviderFallback?: (
    fromProvider: string,
    toProvider: string,
    models?: { fromModel: string; toModel: string },
  ) => void
  /** Bir retry/fallback denemesi başlıyor — UI önceki (başarısız) denemeden akmış
   *  kısmi stream metnini/reasoning buffer'ını sıfırlamalı. */
  onStreamRestart?: () => void
  onSkillsActivated?: (skills: ActivatedSkillInfo[]) => void
  onPromptDiagnostics?: (diagnostics: PromptDiagnostics) => void
  onPromptCacheHealth?: (result: PromptCacheHealthResult) => void
  /** Stream başlamadan önceki aşamaları görünür kılar. */
  onPhase?:       (phase: AgentRunPhase) => void
  onFinish?:      (result: AgentFinishResult) => void
}

export interface AgentToolResultEvent {
  id: string
  tool: string
  result: string
  durationMs: number
  artifact: ToolResultArtifact
  outcome?: ToolOutcome
}

export interface TokenBreakdown {
  input:      number  // fresh input (non-cached)
  output:     number  // completion tokens
  cacheRead:  number  // cached prompt reads  (cheap)
  cacheWrite: number  // cache creation tokens
  reasoning:  number  // extended thinking tokens
}

export interface AgentFinishResult {
  text:         string
  tokens:       TokenBreakdown
  sessionId?:   string
  newMessages:  CoreMessage[]
  /** Context estimate for the next request, not billable request usage. */
  contextUsage: ContextUsage
  finishReason?: string
  continuation?: ContinuationDecision
  completionGate?: CompletionGateDecision
  longTask?: LongTaskContinuationDecision
  taskLedger?: TaskLedger
  completionProof?: CompletionProof
  taskContext?: TaskContext
  turnStatus?: TurnStatus
  runtime?: RuntimeRunSummary
}

export type AgentStatus = "idle" | "running" | "done" | "error" | "aborted"
