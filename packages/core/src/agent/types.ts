import type { CoreMessage } from "ai"
import type { Attachment } from "../util/attachments.js"

export interface AgentRunOptions {
  sessionId?:   string
  provider?:    string
  model?:       string
  system?:      string
  undercover?:  boolean
  effort?:      number
  workdir?:     string
  messages:     CoreMessage[]
  signal?:      AbortSignal
  stream?:      boolean
  attachments?:    Attachment[]   // multimodal dosya ekleri
  toolsOverride?:  string[]       // set ise sadece bu tool'lar etkin (session agent kısıtlaması)
  onText?:        (delta: string, isReasoning?: boolean) => void
  onToolCall?:    (call: { id: string; tool: string; args: unknown }) => void
  onToolResult?:  (res:  { id: string; result: string; durationMs: number }) => void
  /** Bash tool çalışırken gelen canlı stdout/stderr chunk'ları */
  onChunk?:       (chunk: string) => void
  onStepFinish?:  () => void
  onCompaction?:  () => void
  onFinish?:      (result: AgentFinishResult) => void
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
}

export type AgentStatus = "idle" | "running" | "done" | "error" | "aborted"
