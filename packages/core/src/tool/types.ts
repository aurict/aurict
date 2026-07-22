import type { z } from "zod"
import type { DistilledToolResult } from "./result-distiller.js"
import type { FailureCooldownEntry } from "../agent/failure-cooldown.js"
import type { SecurityDistillation } from "../security/distiller.js"
import type { VerificationCheck, VerificationCheckResult } from "../verification/pipeline.js"
import type { GlobalTruncationConfig } from "./truncation.js"
import type { ToolOutcome } from "../runtime/contracts.js"
import type { TaskContext } from "../context/types.js"
import type { WorkspaceTransactionRecord } from "../transaction/workspace-transaction.js"

export type ToolCategory = "read" | "write" | "execute" | "network" | "system"
export type RiskLevel    = "low" | "medium" | "high" | "critical"

export type ToolResultContentPart =
  | { type: "text"; text: string }
  | { type: "image"; data: string; mimeType?: string }

export interface ToolSpec {
  category:              ToolCategory
  riskLevel:             RiskLevel
  securityCapability?:   "none" | "passive" | "active"
  requiresConfirmation?: boolean | ((args: Record<string, unknown>) => boolean)
  permissionSummary?:    string
}

export interface ToolContext {
  sessionId:    string
  workdir:      string
  signal:       AbortSignal
  provider?:    string
  model?:       string
  contextWindow?: number
  supportsVision?: boolean
  truncation?:  GlobalTruncationConfig
  /** Aurict backend access token (varsa) — bkz. AgentRunOptions.backendAccessToken.
   *  Aynı süreçte çalışan subagent worker'larına yalnızca ToolContext üzerinden aktarılır. */
  backendAccessToken?: string
  /** Backend erişimi gereken araçlar için gecikmeli token çözümü. */
  backendAccessTokenResolver?: (signal: AbortSignal) => Promise<string | undefined>
  /** Araç çalışırken canlı çıktı chunk'larını iletir (bash streaming için) */
  onChunk?:     (chunk: string) => void
  // Agent worker'ları için — pool üzerinden başka worker'a mesaj yollar
  sendMessage?: (to: string, message: string) => void
  /**
   * true = Bun Worker thread içinde çalışıyoruz.
   * PermissionGate her worker'da izole instance'dır, TUI'ya ulaşamaz.
   * Bu flag set ise "ask" kararları workdir kapsamında otomatik onaylanır;
   * "deny" (örn. .aurict/*, .git/*) her zaman bloke eder.
   */
  isSubagent?: boolean
  taskContext?: TaskContext
}

export interface ExecuteResult {
  output: string
  /** Optional model-facing multipart result. `output` remains the human-readable transcript. */
  content?: ToolResultContentPart[]
  error?: string
  outcome?: ToolOutcome
  metadata?: {
    changedFiles?: string[]
    distilled?: DistilledToolResult
    security?: SecurityDistillation
    failureCooldown?: FailureCooldownEntry
    // Faz 4.1: tsc dışında dile-agnostik doğrulama check'leri de burada (ruff/mypy/govet/cargo/ruby/rubocop)
    verification?: Partial<Record<VerificationCheck, VerificationCheckResult>>
    patch?: {
      files: Array<{
        path: string
        action: "add" | "delete" | "update" | "move"
        targetPath?: string
      }>
      added: number
      removed: number
    }
    /** Complete user-facing artifact, kept separate from model-output truncation. */
    uiArtifact?: {
      rawDiff: string
    }
    transaction?: WorkspaceTransactionRecord
  }
}

export interface ToolDef {
  id:          string
  description: string
  parameters:  z.AnyZodObject
  spec?:       ToolSpec
  /** Per-tool execution timeout in ms. Falls back to TOOL_EXEC_TIMEOUT_MS (2 min) when unset. */
  timeoutMs?:  number
  execute(args: Record<string, unknown>, ctx: ToolContext): Promise<ExecuteResult>
}
