export { db } from "./storage/db.js"
export * from "./storage/schema.js"
export * from "./storage/queries.js"

export { taskCreateTool, taskUpdateTool, taskCompleteTool } from "./tool/built-in/dag-tasks.js"
export { planEnterTool, planVerifyTool } from "./tool/built-in/plan.js"
export { subagentTool } from "./tool/built-in/subagent.js"
export { ProviderPlugin, type ModelInfo } from "./provider/plugin.js"
export { ProviderRegistry } from "./provider/registry.js"
export { AnthropicPlugin }  from "./provider/anthropic.js"
export { OpenAIPlugin }     from "./provider/openai.js"
export { OpenRouterPlugin } from "./provider/openrouter.js"
export { GooglePlugin }     from "./provider/google.js"
export { OpenCodePlugin }   from "./provider/opencode.js"
export { OllamaPlugin }     from "./provider/ollama.js"
export { countTokens, estimateMessages } from "./provider/tokenizer.js"

export { hooks }                             from "./hook/emitter.js"
export { loadUserHooks }                     from "./hook/user-hooks.js"
export type { HookPayloads, HookName }       from "./hook/types.js"
export type { HookOutcome }                  from "./hook/emitter.js"

export { ToolRegistry }                                  from "./tool/registry.js"
export { executeTool, ExecutorEvents }                   from "./tool/executor.js"
export type { ToolDef, ToolContext, ExecuteResult }      from "./tool/types.js"

export { PermissionEvaluator }                           from "./permission/evaluator.js"
export { PermissionStore, PermissionGate }               from "./permission/store.js"
export type { PermissionRule, PermissionRequest, PermissionDecision } from "./permission/types.js"
export { gateGuard }                                     from "./permission/gateguard.js"
export type { GateRule, AuditEntry }                     from "./permission/gateguard.js"

export { SessionManager }                                from "./session/manager.js"
export type { SessionStats, SessionSearchResult }        from "./storage/queries.js"
export type { Session, Part, SessionConfig }             from "./session/types.js"
export { isOverflow, isOverflowByMessages, compact, estimateTokens, getCircuitState, getContextBreakdown } from "./session/compaction.js"
export type { CBState, CBStatus, ContextBreakdown }      from "./session/compaction.js"
export { measureContextHealth, classifyMessage, smartCompact } from "./session/context-compactor.js"
export type { ContextType, ContextHealth }               from "./session/context-compactor.js"

export { SkillRegistry }                                 from "./skill/registry.js"
export { detectSkills }                                  from "./skill/detector.js"
export { loadSkill, loadSkills, loadSkillAdaptive, detectTaskType } from "./skill/loader.js"
export type { TaskType }                                 from "./skill/loader.js"
export { buildSystemPrompt, getSkillsForProject, clearSkillCache, getContextualSkills, buildGitSection, buildProactiveFileSection, buildIntentSkillSection } from "./skill/injector.js"
export type { SkillDef, LoadedSkill, SkillMatch }        from "./skill/types.js"
export { autoInvoker }                                   from "./skill/auto-invoke.js"
export type { AutoInvokeRule, AutoTrigger }              from "./skill/auto-invoke.js"
export { skillScoreStore }                               from "./skill/score-store.js"
export { loadSkillOverride, applyOverride }              from "./skill/override.js"
export type { SkillOverride }                            from "./skill/override.js"
export { installRemoteSkill, listInstalledSkills, uninstallSkill } from "./skill/remote.js"
export type { RemoteSkillMeta }                          from "./skill/remote.js"
export { loadPlugins, getLoadedPlugins, PLUGIN_DIR }     from "./plugin/loader.js"
export type { OmniPlugin }                               from "./plugin/loader.js"

export { runAgent }                                      from "./agent/loop.js"
export type { AgentRunOptions, AgentFinishResult, AgentStatus, TokenBreakdown } from "./agent/types.js"
export { agentPool }                                     from "./agent/pool.js"
export { loadCustomAgents, getCustomAgent }              from "./agent/custom.js"
export type { CustomAgentDef }                           from "./agent/custom.js"
export { mcpManager, setMCPLogHandler }                     from "./mcp/manager.js"
export { ensureDefaultMCPServers }                       from "./mcp/config.js"
export { DEFAULT_MCP_SERVERS, MCP_SERVER_DESCRIPTIONS, getMcpActivationMessage } from "./mcp/defaults.js"
export type { MCPServerConfig, MCPConfig, MCPToolInfo, MCPResourceInfo, MCPResourceContent }  from "./mcp/types.js"
export type { AgentInfo }                                from "./agent/pool.js"
export type { AgentType }                                from "./agent/protocol.js"
export { AGENT_TYPE_TOOLS }                              from "./agent/protocol.js"

export { sseManager }                                    from "./server/sse.js"
export type { SSEEvent }                                 from "./server/types.js"
export { createApp }                                     from "./server/hono.js"
export { getOrCreateToken, setActiveToken }              from "./server/auth.js"

// ─── Yeni özellikler ───────────────────────────────────────────────────────
export { questionService, type QuestionRequest, type QuestionAnswer, type QuestionInfo, type QuestionOption } from "./question/service.js"
export { generateAwaySummary } from "./agent/memory.js"
export type { CoreMessage }                              from "ai"

export { readAttachmentFromPath, attachmentFromUrl, attachmentToAIContent, SUPPORTED_ATTACHMENT_EXTENSIONS } from "./util/attachments.js"
export type { Attachment }                               from "./util/attachments.js"

export { ptyManager }                                    from "./pty/manager.js"
export type { PtySession }                               from "./pty/manager.js"

export { formatFile, getFormatCommand }                  from "./format/formatter.js"
export { snapshotManager }                               from "./snapshot/snapshot.js"
export type { Snapshot }                                 from "./snapshot/snapshot.js"

export { taskManager }                                   from "./task/manager.js"
export type { Task, TaskStatus }                         from "./task/types.js"

// Hook function API
export { onToolBefore, onToolAfter, onCompact, onSessionStart, onAgentComplete } from "./hook/session.js"

// Undercover & coordinator
export { detectUndercoverRepo, getUndercoverInstructions } from "./agent/undercover.js"
export { getCoordinatorSystemPrompt, getCoordinatorContext, COORDINATOR_TOOLS, WORKER_TOOLS } from "./agent/coordinator.js"
export { getWorkspaceDir, ensureWorkspace } from "./agent/workspace.js"
export { notify, notifyTaskDone, notifyError } from "./util/notify.js"
export { computeDiff } from "./util/diff.js"
export type { DiffLine, DiffHunk } from "./util/diff.js"
export { fileWatcher } from "./util/watcher.js"
export { depSentinel } from "./util/dependency-sentinel.js"
export type { DependencyChange, DependencySnapshot } from "./util/dependency-sentinel.js"
export { exportToMarkdown, exportToHtml, defaultExportFilename } from "./util/exporter.js"
export type { ExportMessage } from "./util/exporter.js"
export { setCompaction } from "./config/config.js"
export type { CompactionStrategy } from "./config/config.js"
export { pinStore } from "./pin/store.js"
export type { Pin } from "./pin/store.js"
export { loadConfig, setApiKey, setDefault, getConfigPath } from "./config/config.js"
export type { OmniConfig } from "./config/config.js"

// Session agents
export { BUILT_IN_SESSION_AGENTS, getAllSessionAgents, getSessionAgent } from "./agent/session-agents.js"
export type { SessionAgentDef } from "./agent/session-agents.js"

// Memory system
export { memoryStore }             from "./memory/store.js"
export { extractAndStoreMemories } from "./memory/extractor.js"
export type { Memory, Category, Scope, Source } from "./memory/types.js"
export { PlanGate }        from "./plan/gate.js"
export type { PlanRequest, PlanStep, PlanDecision } from "./plan/gate.js"

// Design agent
export { DesignLoader, matchDesign, extractProjectBrand, brandToContext, loadDesignPrefs, saveDesignPrefs, recordSystemUsed, recordSkillUsed, buildDesignPrompt, buildDesignOutputDir, slugify } from "./design/index.js"
export type { DesignSystem, Skill, MatchResult, ProjectBrand, DesignPrefs, DesignJobSpec } from "./design/index.js"
export { loadCustomTools } from "./tool/custom-loader.js"

// Project context & diagnostics
export { readArchitecture }   from "./project-context/architecture.js"
export { readDecisions }      from "./project-context/decisions.js"
export { diagnosticsStore }   from "./diagnostics/store.js"
export type { DiagnosticsEntry } from "./diagnostics/store.js"

// ── Recipe system ──────────────────────────────────────────────────────────────
export { runRecipe, parseRecipeFile }    from "./recipe/runner.js"
export type { RecipeDef, RecipeStep, RecipeRunOptions, RecipeRunResult } from "./recipe/types.js"

// ── Multi-agent workspace (readWorkspaceFindings) ─────────────────────────────
export { readWorkspaceFindings } from "./agent/workspace.js"

// ── Code analysis (tree-sitter-free symbol extraction) ────────────────────────
export { extractSymbols, extractSymbolBody, detectLanguage, formatSymbolsSummary } from "./analysis/symbols.js"
export type { CodeSymbol, FileSymbols, Language, SymbolKind } from "./analysis/symbols.js"

// ── Verification Oracle ────────────────────────────────────────────────────────
export { findRelatedTests }                 from "./verification/detector.js"
export { runRelatedTests, detectFramework } from "./verification/runner.js"
export type { TestRunResult }               from "./verification/runner.js"

// ── Scratchpad ─────────────────────────────────────────────────────────────────
export { scratchpadStore }                  from "./scratchpad/store.js"
export { EMPTY_SCRATCHPAD }                 from "./scratchpad/types.js"
export type { ScratchpadState, ScratchpadHistoryEntry } from "./scratchpad/types.js"

// ── Foundation Utilities (Faz 0) ───────────────────────────────────────────────
export { hashArgs, hashString, hashFileQuick, hashFileContent } from "./util/hash.js"
export { Timer, measure, measureSync, globalTimer }             from "./util/timing.js"
export { LRUCache }                                              from "./util/lru-cache.js"
export { metrics, createMetricsCollector }                       from "./util/metrics.js"
export type { MetricsSnapshot, ToolMetric, ProviderSwitchEntry, CompactionEntry } from "./util/metrics.js"

// ── Tool Result Cache (Faz 1) ─────────────────────────────────────────────────
export { toolResultCache, createToolResultCache } from "./tool/cache.js"

// ── Provider Intelligence (Faz 2) ─────────────────────────────────────────────
export { ProviderFallback, providerFallback, loadFallbackFromConfig } from "./provider/fallback.js"
export type { FallbackConfig, FallbackTrigger } from "./provider/fallback.js"
export { ModelRouter, modelRouter, loadRouterFromConfig } from "./provider/router.js"
export type { RouterConfig, RoutingDecision, ModelTier, TaskComplexity } from "./provider/router.js"

// ── Context Intelligence (Faz 3) ──────────────────────────────────────────────
export { extractErrorChains, addProtectedErrors } from "./session/compaction.js"
export type { ErrorChain } from "./session/compaction.js"
export { extractPerTurnMemories } from "./memory/extractor.js"
export { recordErrorPattern, getRelevantErrorPatterns, formatErrorPatterns, clearPatternCache } from "./memory/error-pattern.js"
export type { ErrorPattern } from "./memory/error-pattern.js"

// ── Tool Intelligence (Faz 4) ─────────────────────────────────────────────────
export { shouldRunTsc, runIncrementalTsc, filterTscForFile, clearTscCache } from "./verification/tsc.js"
export { detectHallucinations, formatHallucinationWarnings } from "./verification/hallucination.js"
export type { HallucinationWarning } from "./verification/hallucination.js"

// ── Agent Evolution (Faz 5) ───────────────────────────────────────────────────
export { decomposeTask, flattenTaskTree, getTaskProgress } from "./agent/decomposition.js"
export type { TaskNode, DecompositionLevel, DecompositionRequest } from "./agent/decomposition.js"
export { agentLearner, createAgentLearner } from "./agent/learning.js"
export type { AgentPerformance, AgentLearningConfig } from "./agent/learning.js"
export { contextBus, createContextBus } from "./agent/context-bus.js"
export type { FileLock, ContextBusConfig } from "./agent/context-bus.js"
export { computeOptimalWorkers, adjustForComplexity, getPoolSizingReport } from "./agent/pool-sizing.js"
export type { PoolSizingConfig } from "./agent/pool-sizing.js"

// ── Developer Experience (Faz 6) ──────────────────────────────────────────────
export { progressTracker, ToolProgressTracker, getToolProgressMessage } from "./util/progress.js"
export type { ToolProgressEvent, ToolProgressStatus, ToolProgressCallback } from "./util/progress.js"
export { prefetchManager, PrefetchManager, extractPrefetchHints } from "./util/prefetch.js"
export type { PrefetchRequest, PrefetchResult, PrefetchHint } from "./util/prefetch.js"
export { extractInstantContext, formatInstantContext } from "./util/instant-context.js"
export type { InstantContextResult, InstantContextConfig } from "./util/instant-context.js"

// ── Security & Robustness (Faz 7) ─────────────────────────────────────────────
export {
  escapeHtml,
  escapeSql,
  sanitizePath,
  sanitizeInput,
  validateLength,
  validateEmail,
  validateUrl,
  validateFilePath,
  validateJsonInput,
  escapeShellArg,
  validateRegex,
  comprehensiveSanitize,
} from "./security/validation.js"
export type { ValidationResult } from "./security/validation.js"

export {
  TokenBucketLimiter,
  SlidingWindowLimiter,
  throttle,
  debounce,
  ConcurrencyLimiter,
  apiRateLimiter,
  agentConcurrencyLimiter,
} from "./security/rate-limiter.js"
export type { RateLimitConfig, RateLimitResult } from "./security/rate-limiter.js"

export {
  AuditLogger,
  auditLogger,
  readAuditLogs,
  filterAuditLogs,
} from "./security/audit.js"
export type { AuditEvent, AuditEventType, AuditLogConfig } from "./security/audit.js"

export {
  scanDependencies,
  formatVulnerabilityReport,
  hasCriticalVulnerabilities,
  groupBySeverity,
} from "./security/vulnerability-scanner.js"
export type { VulnerabilityInfo, DependencyScanResult } from "./security/vulnerability-scanner.js"

export {
  classifyError,
  withRetry,
  CircuitBreaker,
  withFallback,
  errorBoundary,
  ErrorHandlerRegistry,
  errorHandlerRegistry,
} from "./security/error-boundary.js"
export type {
  ErrorSeverity,
  ErrorCategory,
  ClassifiedError,
  RecoveryStrategy,
} from "./security/error-boundary.js"
