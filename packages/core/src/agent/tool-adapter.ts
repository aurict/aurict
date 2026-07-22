import { tool, type ToolSet } from "ai"
import { resolve } from "node:path"
import { ToolRegistry } from "../tool/registry.js"
import { executeTool } from "../tool/executor.js"
import { getCachedToolSchema } from "../tool/schema-cache.js"
import { prepareToolForSecurityCapability } from "../security/capability.js"
import type { OmniConfig } from "../config/config.js"
import type { AgentRunOptions } from "./types.js"
import type { ToolOutcome } from "../runtime/contracts.js"
import type { TaskContext } from "../context/types.js"
import type { ExecuteResult, ToolDef, ToolResultContentPart } from "../tool/types.js"
import { isAgentFeatureEnabled } from "./runtime-features.js"
import { classifyToolResult, type ToolResultArtifact, type ToolResultPresentation } from "./tool-result-artifact.js"

export interface MultipartToolResult {
  text: string
  content: ToolResultContentPart[]
  presentation?: ToolResultPresentation
  artifact?: ToolResultArtifact
}

export type AdaptedToolResult = string | MultipartToolResult

export interface AIToolAdapterOptions {
  workdir: string
  sessionId: string
  provider: string
  model: string
  contextWindow?: number
  supportsVision?: boolean
  config: OmniConfig
  signal?: AbortSignal
  onChunk?: (chunk: string) => void
  failureTracker?: Map<string, number>
  recentReads?: Map<string, number>
  toolCallIndexRef?: { current: number }
  backendAccessToken?: string
  backendAccessTokenResolver?: (signal: AbortSignal) => Promise<string | undefined>
  onToolExecution?: () => void
  outcomeQueue?: Map<string, ToolOutcome[]>
  runtime?: AgentRunOptions["runtime"]
  taskContext?: TaskContext
  /** Only these sanitized tool IDs receive executable AI SDK wrappers. */
  selectedToolIds?: readonly string[]
}

export interface AIToolCatalogOptions {
  config: OmniConfig
  sessionId: string
  supportsVision?: boolean
}

interface EligibleToolDefinition {
  definition: ToolDef
  sanitizedId: string
}

/** Lightweight routing catalog: no AI SDK tool wrappers or execute closures. */
export function listEligibleAIToolIds(options: AIToolCatalogOptions): string[] {
  return eligibleToolDefinitions(options).map(entry => entry.sanitizedId)
}

export function buildAITools(options: AIToolAdapterOptions): ToolSet {
  // AI SDK's overloaded tool() return type is narrower than ToolSet under exact optional properties.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: Record<string, any> = {}
  const selected = options.selectedToolIds ? new Set(options.selectedToolIds) : undefined
  for (const { definition, sanitizedId } of eligibleToolDefinitions(options)) {
    if (selected && !selected.has(sanitizedId)) continue
    const schema = getCachedToolSchema(definition)
    result[schema.sanitizedId] = tool({
      description: schema.description,
      parameters: schema.parameters as never,
      execute: async (args: Record<string, unknown>) => executeAdaptedTool(definition, schema.sanitizedId, args, options),
      experimental_toToolResultContent: (adapted: AdaptedToolResult) => (
        typeof adapted === "string" ? [{ type: "text", text: adapted }] : adapted.content
      ),
    })
  }
  return result as ToolSet
}

function eligibleToolDefinitions(options: AIToolCatalogOptions): EligibleToolDefinition[] {
  const result: EligibleToolDefinition[] = []
  for (const definition of ToolRegistry.list()) {
    if (definition.id === "orchestrate" && options.config.orchestration?.enabled !== true) continue
    if (definition.id === "lsp" && !isAgentFeatureEnabled("code_navigation", options.config, options.sessionId)) continue
    if (definition.id === "read_image") {
      if (!isAgentFeatureEnabled("multimodal_tools", options.config, options.sessionId)) continue
      if (options.supportsVision === false) continue
    }
    if (definition.id === "browser" && !isAgentFeatureEnabled("browser_drive", options.config, options.sessionId)) continue
    if (definition.id === "semantic_search" && !isAgentFeatureEnabled("semantic_search", options.config, options.sessionId)) continue
    const filtered = prepareToolForSecurityCapability(definition, options.config)
    if (!filtered) continue
    result.push({ definition: filtered, sanitizedId: filtered.id.replace(/:/g, "_") })
  }
  return result
}

async function executeAdaptedTool(
  definition: ReturnType<typeof ToolRegistry.list>[number],
  sanitizedId: string,
  args: Record<string, unknown>,
  options: AIToolAdapterOptions,
): Promise<AdaptedToolResult> {
  options.onToolExecution?.()
  if (options.toolCallIndexRef) options.toolCallIndexRef.current++
  const currentIndex = options.toolCallIndexRef?.current ?? 0
  const reread = await staleEditMessage(definition.id, args, currentIndex, options)
  if (reread) return reread

  const result = await executeTool(definition, args, {
    sessionId: options.sessionId,
    workdir: options.workdir,
    signal: options.signal ?? new AbortController().signal,
    provider: options.provider,
    model: options.model,
    ...(options.contextWindow ? { contextWindow: options.contextWindow } : {}),
    ...(options.supportsVision !== undefined ? { supportsVision: options.supportsVision } : {}),
    truncation: options.config.truncation ?? {},
    ...(options.onChunk ? { onChunk: options.onChunk } : {}),
    ...(options.backendAccessToken ? { backendAccessToken: options.backendAccessToken } : {}),
    ...(options.backendAccessTokenResolver ? { backendAccessTokenResolver: options.backendAccessTokenResolver } : {}),
    ...(options.runtime?.sendMessage ? { sendMessage: options.runtime.sendMessage } : {}),
    ...(options.runtime?.isSubagent !== undefined ? { isSubagent: options.runtime.isSubagent } : {}),
    ...(options.taskContext ? { taskContext: options.taskContext } : {}),
  })

  if (options.recentReads && !result.error && (definition.id === "read" || definition.id === "write")) {
    const path = String(args["path"] ?? "")
    if (path) options.recentReads.set(resolve(options.workdir, path), currentIndex)
  }
  if (result.outcome && options.outcomeQueue) {
    const queued = options.outcomeQueue.get(sanitizedId) ?? []
    queued.push(result.outcome)
    options.outcomeQueue.set(sanitizedId, queued)
  }

  let output = result.error ? `ERROR: ${result.error}\n${result.output}` : result.output
  if (result.error && options.failureTracker) {
    const fingerprint = `${definition.id}:${result.error.slice(0, 80)}`
    const count = (options.failureTracker.get(fingerprint) ?? 0) + 1
    options.failureTracker.set(fingerprint, count)
    if (count >= 2) output += `\n\n[SYSTEM: This exact error occurred ${count} times. Diagnose the root cause and use a different strategy.]`
  }
  const content = result.content?.length
    ? result.content.some(part => part.type === "text")
      ? result.content
      : [{ type: "text" as const, text: output }, ...result.content]
    : [{ type: "text" as const, text: output }]
  const presentation = toolResultPresentation(result)
  const artifact = result.metadata?.uiArtifact?.rawDiff
    ? classifyToolResult(definition.id, `__UNIFIED_DIFF__\n${result.metadata.uiArtifact.rawDiff}`, presentation)
    : undefined
  return {
    text: output,
    content,
    ...(presentation ? { presentation } : {}),
    ...(artifact ? { artifact } : {}),
  }
}

/** Keeps UI/event consumers text-only while the provider receives multipart content. */
export function formatAdaptedToolResult(value: unknown): string {
  if (typeof value === "string") return value
  if (value && typeof value === "object" && "text" in value) {
    const text = (value as { text?: unknown }).text
    if (typeof text === "string") return text
  }
  return String(value)
}

export function adaptedToolResultPresentation(value: unknown): ToolResultPresentation | undefined {
  if (!value || typeof value !== "object" || !("presentation" in value)) return undefined
  const presentation = (value as { presentation?: unknown }).presentation
  return presentation && typeof presentation === "object"
    ? presentation as ToolResultPresentation
    : undefined
}

export function adaptedToolResultArtifact(value: unknown): ToolResultArtifact | undefined {
  if (!value || typeof value !== "object" || !("artifact" in value)) return undefined
  const artifact = (value as { artifact?: unknown }).artifact
  return artifact && typeof artifact === "object" ? artifact as ToolResultArtifact : undefined
}

export function toolResultPresentation(result: ExecuteResult): ToolResultPresentation | undefined {
  const distilled = result.metadata?.distilled
  const verification = Object.entries(result.metadata?.verification ?? {})
    .flatMap(([check, value]) => value ? [{ check, status: value.status }] : [])
  if (!distilled && verification.length === 0 && !(result.metadata?.changedFiles?.length)) return undefined
  return {
    status: result.error || distilled?.status === "error" ? "error" : "success",
    changedFiles: [...new Set(result.metadata?.changedFiles ?? [])],
    filePaths: [...new Set(distilled?.filePaths ?? [])],
    errors: [...new Set([...(result.error ? [result.error] : []), ...(distilled?.errors ?? [])])],
    importantLines: distilled?.importantLines ?? [],
    verification,
  }
}

async function staleEditMessage(
  toolId: string,
  args: Record<string, unknown>,
  currentIndex: number,
  options: AIToolAdapterOptions,
): Promise<string | undefined> {
  if (!options.recentReads || toolId !== "edit") return undefined
  const path = String(args["path"] ?? "")
  if (!path) return undefined
  const absolute = resolve(options.workdir, path)
  const lastRead = options.recentReads.get(absolute)
  if (lastRead !== undefined && currentIndex - lastRead <= 10) return undefined
  try {
    const content = await Promise.race([
      Bun.file(absolute).text(),
      new Promise<string>((_, reject) => setTimeout(() => reject(new Error("timeout")), 2_000)),
    ])
    const excerpt = content.slice(0, 6_000)
    const truncation = content.length > 6_000 ? "\n... [truncated]" : ""
    const staleness = lastRead === undefined ? "never in this turn" : `${currentIndex - lastRead} tool calls ago`
    return `[Re-read gate] '${path}' was last read ${staleness}. Current content:\n\`\`\`\n${excerpt}${truncation}\n\`\`\`\n\nReview it, then re-issue the edit with an exact verbatim match.`
  } catch {
    return undefined
  }
}
