import type { z } from "zod"
import type { DistilledToolResult } from "./result-distiller.js"
import type { FailureCooldownEntry } from "../agent/failure-cooldown.js"

export type ToolCategory = "read" | "write" | "execute" | "network" | "system"
export type RiskLevel    = "low" | "medium" | "high" | "critical"

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
}

export interface ExecuteResult {
  output: string
  error?: string
  metadata?: {
    changedFiles?: string[]
    distilled?: DistilledToolResult
    failureCooldown?: FailureCooldownEntry
    verification?: {
      tsc?: {
        status: "passed" | "failed" | "skipped" | "timeout"
        reason?: string
        output?: string
      }
    }
    patch?: {
      files: Array<{
        path: string
        action: "add" | "delete" | "update" | "move"
        targetPath?: string
      }>
      added: number
      removed: number
    }
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
