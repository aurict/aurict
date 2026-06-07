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
export type { Session, Part, SessionConfig }             from "./session/types.js"
export { isOverflow, isOverflowByMessages, compact, estimateTokens, getCircuitState, getContextBreakdown } from "./session/compaction.js"
export type { CBState, CBStatus, ContextBreakdown }      from "./session/compaction.js"
export { measureContextHealth, classifyMessage, smartCompact } from "./session/context-compactor.js"
export type { ContextType, ContextHealth }               from "./session/context-compactor.js"

export { SkillRegistry }                                 from "./skill/registry.js"
export { detectSkills }                                  from "./skill/detector.js"
export { loadSkill, loadSkills }                         from "./skill/loader.js"
export { buildSystemPrompt, getSkillsForProject, clearSkillCache, getContextualSkills } from "./skill/injector.js"
export type { SkillDef, LoadedSkill, SkillMatch }        from "./skill/types.js"
export { autoInvoker }                                   from "./skill/auto-invoke.js"
export type { AutoInvokeRule, AutoTrigger }              from "./skill/auto-invoke.js"

export { runAgent }                                      from "./agent/loop.js"
export type { AgentRunOptions, AgentFinishResult, AgentStatus } from "./agent/types.js"
export { agentPool }                                     from "./agent/pool.js"
export { loadCustomAgents, getCustomAgent }              from "./agent/custom.js"
export type { CustomAgentDef }                           from "./agent/custom.js"
export { mcpManager }                                    from "./mcp/manager.js"
export type { MCPServerConfig, MCPConfig, MCPToolInfo }  from "./mcp/types.js"
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
