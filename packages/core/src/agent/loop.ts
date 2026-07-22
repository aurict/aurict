import { streamText, generateText } from "ai"
import type { CoreMessage, ToolSet } from "ai"
import { ProviderRegistry } from "../provider/registry.js"
import { resolveModelInfo } from "../provider/models-fetch.js"
import { SessionManager } from "../session/manager.js"
import { isOverflow, isOverflowByMessages, compact, DEFAULT_TAIL_TURNS, estimateEffectiveContextTokens, microCompactOldToolResults } from "../session/compaction.js"
import { buildSystemPromptSections } from "../skill/injector.js"
import { attachmentToAIContent } from "../util/attachments.js"
import { createThinkTagFilter } from "../util/think-tag-filter.js"
import { getUndercoverInstructions } from "./undercover.js"
import { loadConfig, resolveLongTaskRuntimeConfig } from "../config/config.js"
import { calculateCostUsd } from "../provider/costs.js"
import { extractAndStoreMemories, extractPerTurnMemories } from "../memory/extractor.js"
import { buildGitSection, buildProactiveFileSection, buildIntentSkillSection, getSkillsForProject, matchIntentSkills } from "../skill/injector.js"
import { joinPromptSections, type ResolvedPromptSection } from "./prompt-sections.js"
import { skillScoreStore } from "../skill/score-store.js"
import { ProviderFallback, NonRetryableStreamError } from "../provider/fallback.js"
import { ModelRouter } from "../provider/router.js"
import { metrics } from "../util/metrics.js"
import { extractText } from "../session/context-compactor.js"
import type { AgentRunOptions, AgentFinishResult, TokenBreakdown } from "./types.js"
import { measureContextUsage } from "./context-usage.js"
import { analyzePromptSections } from "./prompt-diagnostics.js"
import { recordPromptCacheHealth } from "./prompt-cache-health.js"
import { getPromptCacheControl, isPromptCachingEnabled } from "./prompt-cache-control.js"
import { clearActiveSkillPolicy, getSkillLifecycleSnapshot, restoreSkillLifecycle } from "../skill/runtime-policy.js"
import { evaluateContinuation } from "./continuation.js"
import { extractVerificationSnapshot, extractWorkingSetVerificationSnapshot, readSessionResumeState, writeSessionResumeState } from "../session/resume-state.js"
import { restoreWorkingSet, getWorkingSetSnapshot } from "./working-set.js"
import { restoreFailureCooldown, getFailureCooldownSnapshot } from "./failure-cooldown.js"
import { failedStrategiesStore } from "./failed-strategies-store.js"
import { summarizeFragileAreas } from "./fragile-areas.js"
import { evaluateCompletionGate } from "./completion-gate.js"
import { recordRunTrace } from "./run-trace.js"
import { filterToolIdsForSecurityCapability } from "../security/capability.js"
import type { OmniConfig } from "../config/config.js"
import { evaluateLongTaskContinuation } from "./continuation-controller.js"
import { buildTaskLedger } from "./task-ledger.js"
import { applyCompletionProofGate, buildCompletionProof, writeCompletionProof } from "./completion-proof.js"
import { isTaskContinuationTurn } from "./turn-intent.js"
import { assessComplexity, stepsForComplexity, deriveReasoningEffort } from "./complexity.js"
import { getCoordinatorSystemPrompt, getCoordinatorContext, shouldInjectCoordinatorPrompt } from "./coordinator.js"
import { agentPool } from "./pool.js"
import { classifyToolResult } from "./tool-result-artifact.js"
import { providerEnvironmentFromConfig, withProviderEnvironment } from "../provider/credentials.js"
import { AgentRuntime } from "../runtime/agent-runtime.js"
import type { ToolOutcome } from "../runtime/contracts.js"
import { taskManager } from "../task/manager.js"
import { selectTools } from "../tool/capability-router.js"
import { adaptedToolResultArtifact, adaptedToolResultPresentation, buildAITools as buildRoutedAITools, formatAdaptedToolResult, listEligibleAIToolIds } from "./tool-adapter.js"
import { withRetry as runWithRetry } from "./provider-errors.js"
import { buildTaskContext } from "../context/builder.js"
import { createFirstResponseDeadline } from "./first-response-deadline.js"
import { appendAnthropicDynamicContext, buildPromptCacheLayout, withAnthropicHistoryBreakpoint } from "./prompt-cache-layout.js"
import { mergeStickyToolSelection } from "./sticky-tool-selection.js"
import { countAttachmentsInMessages, tokenCacheStats } from "../provider/tokenizer.js"
import { countToolSchemaTokens } from "../tool/schema-cache.js"
import { getTokenCalibration, recordTokenCalibration } from "../provider/token-calibration.js"
import { resolveUtilityModel } from "../provider/utility-model.js"
import { formatCanonicalAgentState } from "../context/canonical-agent-state.js"
import { createTurnStatusFilter, extractTurnStatus, stripTurnStatusFromMessages, type TurnStatus } from "./turn-status.js"
import { applyPromptTier, formatAvailableToolPolicy } from "./prompt-tier.js"
import { selectEquivalentFallbackModel } from "../provider/equivalent-model.js"
import { getPostEditVerificationJobs } from "../verification/post-edit-scheduler.js"
import { isAgentFeatureEnabled } from "./runtime-features.js"

export { withRetry, parseProviderError } from "./provider-errors.js"

const PROVIDER_FIRST_RESPONSE_TIMEOUT_MS = 45_000

async function runAgentEngine(opts: AgentRunOptions): Promise<AgentFinishResult> {
  const workdir = opts.workdir ?? process.cwd()
  const cfg = loadConfig(workdir)
  return withProviderEnvironment(providerEnvironmentFromConfig(cfg), () => runAgentScoped(opts, cfg))
}

const defaultAgentRuntime = new AgentRuntime(runAgentEngine)

export async function runAgent(opts: AgentRunOptions): Promise<AgentFinishResult> {
  const workdir = opts.workdir ?? process.cwd()
  const longTask = resolveLongTaskRuntimeConfig(loadConfig(workdir))
  return defaultAgentRuntime.run({
    ...opts,
    runtime: {
      ...opts.runtime,
      budget: {
        verificationRuns: longTask.maxVerificationRuns,
        ...opts.runtime?.budget,
      },
    },
  })
}

async function runAgentScoped(opts: AgentRunOptions, cfg: OmniConfig): Promise<AgentFinishResult> {
  const tokenCacheBefore = tokenCacheStats()
  const pinnedSelection = opts.modelSelection?.mode === "pinned" ? opts.modelSelection : undefined
  let providerName = pinnedSelection?.provider ?? opts.provider ?? "anthropic"
  let plugin       = ProviderRegistry.get(providerName)
  let modelId      = pinnedSelection?.model ?? opts.model ?? plugin.defaultModel()
  const workdir      = opts.workdir ?? process.cwd()
  const sessionId    = opts.sessionId
  const stateSessionId = sessionId ?? `anonymous:${crypto.randomUUID()}`
  const featureEnabled = (feature: Parameters<typeof isAgentFeatureEnabled>[0]) =>
    isAgentFeatureEnabled(feature, cfg, stateSessionId)
  const taskScope = sessionId ? taskManager.configureScope(workdir, sessionId) : null
  opts.onPhase?.("preparing_context")
  const resumedState = sessionId ? await readSessionResumeState(workdir, sessionId) : null
  if (sessionId && resumedState) {
    restoreSkillLifecycle(sessionId, resumedState.activeSkills ?? [])
    restoreWorkingSet(sessionId, resumedState.workingSet)
    restoreFailureCooldown(sessionId, resumedState.failureCooldown)
  } else {
    clearActiveSkillPolicy(stateSessionId)
    restoreWorkingSet(stateSessionId, null)
    restoreFailureCooldown(stateSessionId, null)
  }

  let messages: CoreMessage[] = [...opts.messages]

  // --- Multimodal attachment injection ---
  // Attachments varsa son user mesajını array formatına çevir
  if (opts.attachments && opts.attachments.length > 0) {
    const lastIdx = messages.length - 1
    const last = messages[lastIdx]
    if (last && last.role === "user" && typeof last.content === "string") {
      const textBlock = { type: "text" as const, text: last.content }
      const imageBlocks = opts.attachments.map((a) => attachmentToAIContent(a))
      messages = [
        ...messages.slice(0, lastIdx),
        { role: "user", content: [textBlock, ...imageBlocks] } as CoreMessage,
      ]
    }
  }

  // --- Config yükle + truncation init ---
  const longTaskConfig   = resolveLongTaskRuntimeConfig(cfg)

  // Explicit provider/model choices always win. Automatic routing only applies
  // when the caller delegated both decisions to core.
  const automaticModelSelection = opts.modelSelection?.mode === "auto"
    || (opts.modelSelection === undefined && opts.provider === undefined && opts.model === undefined)
  if (cfg.routing?.enabled && automaticModelSelection) {
    const routingMessage = [...messages].reverse().find((message) => message.role === "user")
    const routingObjective = opts.taskContext?.objective || resumedState?.taskContext?.objective
    const routingComplexity = assessComplexity({
      text: routingMessage ? extractText(routingMessage) : "",
      ...(routingObjective ? { objective: routingObjective } : {}),
      hasAttachments: !!opts.attachments?.length,
    })
    const router = new ModelRouter({
      enabled: true,
      budgetThresholdUsd: cfg.routing.budgetThresholdUsd ?? 1.0,
      maxSessionCostUsd: cfg.routing.maxSessionCostUsd ?? 10.0,
    })
    const sessionCost = sessionId ? SessionManager.getStats(sessionId)?.accumulatedCostUsd ?? 0 : 0
    const decision = router.route(routingComplexity.level, sessionCost)
    if (decision) {
      providerName = decision.provider
      plugin = ProviderRegistry.get(providerName)
      modelId = decision.model
    }
  }
  opts.onModelSelected?.({
    provider: providerName,
    model: modelId,
    mode: automaticModelSelection ? "auto" : "pinned",
  })

  const fallbackRuntime = new ProviderFallback({
    enabled: cfg.fallback?.enabled ?? false,
    providers: cfg.fallback?.providers ?? [],
    triggerOn: cfg.fallback?.triggerOn ?? ["429", "503", "timeout"],
    maxRetries: cfg.fallback?.maxRetries ?? 2,
    retryDelayMs: cfg.fallback?.retryDelayMs ?? 15_000,
    circuitBreakerThreshold: cfg.fallback?.circuitBreakerThreshold ?? 3,
    circuitBreakerResetMs: cfg.fallback?.circuitBreakerResetMs ?? 60_000,
  })

  // --- Compaction kontrolü ---
  const compCfg          = cfg.compaction
  const tailTurns        = compCfg?.tailTurns            ?? DEFAULT_TAIL_TURNS
  const strategy         = compCfg?.strategy             ?? "balanced"
  const msgThreshold     = compCfg?.messageCountThreshold
  // 3 katmanlı çözüm: statik liste → uzak /models cache'i → models.dev/heuristik.
  // Her zaman dolu döner — bilinmeyen (BYOK) modelde artık sessiz 200k/8k
  // varsayımı yerine gerçek ya da bilgiye dayalı bir context/output tahmini var.
  opts.onPhase?.("resolving_model")
  const modelInfo = await resolveModelInfo(plugin, providerName, modelId)
  const utilityModel = featureEnabled("utility_model")
    ? resolveUtilityModel(cfg, providerName, modelId)
    : {
        provider: providerName, model: modelId, maxInputTokens: 24_000,
        maxOutputTokens: 1_200, source: "primary-visible-fallback" as const,
      }
  const tokenizerEncoding = plugin.tokenizerEncoding(modelId)
  const compCfgFull = {
    contextLimit:          modelInfo.contextWindow,
    maxOutput:             modelInfo.maxOutput,
    tailTurns,
    strategy,
    provider:              providerName,
    model:                 modelId,
    utilityProvider:       utilityModel.provider,
    utilityModel:          utilityModel.model,
    utilityMaxInputTokens: utilityModel.maxInputTokens,
    utilityMaxOutputTokens: utilityModel.maxOutputTokens,
    tokenizerEncoding,
    workdir,
    ...(sessionId !== undefined ? { sessionId } : {}),
    ...(msgThreshold !== undefined ? { messageCountThreshold: msgThreshold } : {}),
  }
  const baseContextUsageInput = {
    providerId: providerName,
    modelId,
    ...(tokenizerEncoding !== undefined ? { tokenizerEncoding } : {}),
    contextWindow: modelInfo.contextWindow,
    maxOutputTokens: modelInfo.maxOutput,
  }
  const reportCompaction = (
    reason: "history_limit" | "message_limit" | "effective_context_limit",
    before: ReturnType<typeof measureContextUsage>,
    after: ReturnType<typeof measureContextUsage>,
  ) => {
    const event = { reason, before, after }
    opts.onCompaction?.(event)
    if (sessionId) {
      recordRunTrace(workdir, sessionId, "context_compaction", {
        reason,
        beforeTokens: before.effectiveTokens,
        afterTokens: after.effectiveTokens,
        threshold: before.compactionThreshold,
      }).catch(() => metrics.recordError("context_compaction_trace"))
    }
  }
  messages = microCompactOldToolResults(messages, compCfgFull)

  const exceedsHistoryLimit = isOverflow(messages, compCfgFull)
  const exceedsMessageLimit = isOverflowByMessages(messages, compCfgFull)
  if (exceedsHistoryLimit || exceedsMessageLimit) {
    // Extract memories from messages about to be lost to compaction (fire-and-forget)
    extractAndStoreMemories(providerName, modelId, messages, workdir, utilityModel)
      .catch(() => metrics.recordError("memory_extract"))
    const before = measureContextUsage(messages, baseContextUsageInput)
    const compacted = await compact(messages, compCfgFull)
    messages  = compacted
    reportCompaction(exceedsHistoryLimit ? "history_limit" : "message_limit", before, measureContextUsage(messages, baseContextUsageInput))
  }

  // supportsTools: false olan modeller tool API'si desteklemez — boş geç
  const hasToolSupport   = modelInfo.supportsTools !== false
  const failureTracker   = new Map<string, number>()
  const recentReads      = new Map<string, number>()
  const toolCallIndexRef = { current: 0 }
  const resumedTaskContext = opts.taskContext ?? resumedState?.taskContext
  const availableToolIds = hasToolSupport
    ? listEligibleAIToolIds({
        config: cfg,
        sessionId: stateSessionId,
        supportsVision: modelInfo.supportsVision,
      })
    : []

  // toolsOverride: session agent kısıtlaması — sadece izin verilen tool'lar
  const toolsOverride = opts.toolsOverride
    ? filterToolIdsForSecurityCapability(opts.toolsOverride, cfg).map(id => id.replace(/:/g, "_"))
    : undefined
  const lastUserMsg = [...messages].reverse().find(m => m.role === "user")
  const lastUserText = lastUserMsg
    ? (typeof lastUserMsg.content === "string" ? lastUserMsg.content : "")
    : ""
  const toolSelection = selectTools({
    text: lastUserText,
    ...(featureEnabled("persistent_tool_routing") && resumedTaskContext?.objective
      ? { objective: resumedTaskContext.objective }
      : {}),
    ...(featureEnabled("persistent_tool_routing") && resumedTaskContext?.requestedCapabilities
      ? { requestedCapabilities: resumedTaskContext.requestedCapabilities }
      : {}),
    availableToolIds,
    ...(toolsOverride ? { allowedToolIds: toolsOverride } : {}),
    maxVisible: cfg.toolRouting?.maxVisible ?? 32,
    ...(opts.runtime?.profile ? { profile: opts.runtime.profile } : {}),
  })
  const dynamicToolRouting = cfg.toolRouting?.enabled ?? true
  const routedToolIds = dynamicToolRouting
    ? toolSelection.selectedToolIds
    : toolsOverride ?? availableToolIds
  const selectedToolIds = mergeStickyToolSelection({
    current: routedToolIds,
    ...(resumedState?.activeToolIds ? { previous: resumedState.activeToolIds } : {}),
    available: availableToolIds,
    ...(toolsOverride ? { allowed: toolsOverride } : {}),
    maxVisible: cfg.toolRouting?.maxVisible ?? 32,
  })
  opts.onToolSelection?.({
    toolIds: selectedToolIds,
    capabilities: dynamicToolRouting ? toolSelection.capabilities : ["all"],
    omittedCount: availableToolIds.length - selectedToolIds.length,
    reason: dynamicToolRouting ? toolSelection.reason : "dynamic tool routing disabled",
  })

  // --- Proactive file injection: dosya adları user mesajında geçiyorsa önceden inject et ---
  const taskContinuationTurn = isTaskContinuationTurn(lastUserText)

  // --- Skill injection (otomatik proje tespiti) ---
  // Git context buildSystemPrompt dışında tutulur — Anthropic'te ayrı uncached blok olarak inject edilir
  const baseSystemSections = await buildSystemPromptSections(workdir, opts.system, false, opts.runtime?.agentType, lastUserText)
  const projectSkills   = await getSkillsForProject(workdir).catch(() => [])
  const projectSkillIds = new Set(projectSkills.map((s) => s.id))
  const activatedSkills = matchIntentSkills(lastUserText, workdir, projectSkillIds)
  if (activatedSkills.length > 0) opts.onSkillsActivated?.(activatedSkills)

  const [proactiveSection, intentSection] = await Promise.all([
    buildProactiveFileSection(lastUserText, workdir).catch(() => ""),
    buildIntentSkillSection(lastUserText, workdir, projectSkillIds).catch(() => ""),
  ])

  const runtimeSystemSections: ResolvedPromptSection[] = [...baseSystemSections]
  const extraSystem = [proactiveSection, intentSection].filter(Boolean).join("\n\n")
  if (extraSystem) {
    runtimeSystemSections.push({ name: "runtime_extra", cache: "dynamic", content: extraSystem })
  }

  if (opts.undercover) {
    runtimeSystemSections.push({ name: "undercover", cache: "dynamic", content: `---\n\n${getUndercoverInstructions()}` })
  }

  runtimeSystemSections.push({
    name: "available_tools_policy",
    cache: "dynamic",
    content: formatAvailableToolPolicy(
      selectedToolIds,
      availableToolIds.length - selectedToolIds.length,
    ),
  })

  const workingSet = getWorkingSetSnapshot(stateSessionId)
  const failureCooldown = getFailureCooldownSnapshot(stateSessionId)
  const previousTaskContext = opts.taskContext ?? resumedState?.taskContext
  const initialTaskContext = buildTaskContext({
    objective: opts.taskContext?.objective || resumedState?.taskContext?.objective || lastUserText,
    tasks: taskManager.getTasks(taskScope),
    workingSet,
    ...(resumedState?.lastVerification ? { verification: resumedState.lastVerification } : {}),
    ...(previousTaskContext ? { previous: previousTaskContext } : {}),
  })
  // ─── Faz 2: Karmaşıklık değerlendirmesi — adaptif step limit + reasoning effort
  // aynı skordan türetilir (tek kaynak: agent/complexity.ts). Coordinator injection
  // kararı (Faz 3A) da bu skordan yararlanır, bu yüzden runtimeSystemSections
  // henüz join edilmeden önce, erken hesaplanıyor. ────────────────────────────
  const changedFilesCount = workingSet.items.filter(
    item => item.kind === "file" && item.reason === "changed file"
  ).length
  const complexity = assessComplexity({
    text: lastUserMsg ? extractText(lastUserMsg) : "",
    objective: initialTaskContext.objective,
    hasAttachments: !!opts.attachments,
    priorToolCalls: workingSet.items.length,
    changedFiles: changedFilesCount,
    priorFailures: failureCooldown.active.length,
  })
  const maxSteps = opts.runtime?.maxSteps ?? stepsForComplexity(complexity.level)

  const initialLedger = buildTaskLedger({
    objective: initialTaskContext.objective,
    workingSet,
    ...(resumedState?.lastVerification ? { verification: resumedState.lastVerification } : {}),
    tasks: initialTaskContext.tasks,
    ...(resumedState?.taskLedger ? { previous: resumedState.taskLedger } : {}),
  })
  if (featureEnabled("canonical_state") && (initialTaskContext.objective || initialTaskContext.tasks.length > 0)) {
    runtimeSystemSections.push({
      name: "canonical_agent_state",
      cache: "dynamic",
      content: formatCanonicalAgentState({
        context: initialTaskContext,
        ledger: initialLedger,
        activeSkill: getSkillLifecycleSnapshot(stateSessionId).active,
        cooldown: failureCooldown,
        knownDeadEnds: failedStrategiesStore.recent(workdir),
        fragileAreas: await summarizeFragileAreas(workdir).catch(() => []),
        backgroundVerification: featureEnabled("background_verification")
          ? getPostEditVerificationJobs(stateSessionId)
          : [],
        includeStatusProtocol: featureEnabled("structured_status"),
      }),
    })
  }

  // ─── Faz 3A: Coordinator prompt — karmaşıklık-kapılı ────────────────────────
  // Önceden CLI'de (App.tsx) coordinatorMode=true iken HER turn'e opts.system
  // üzerinden giriyordu; bu hem gereksiz maliyet hem de opts.system her zaman
  // dolu olduğu için TÜM core system bloğunun cache dışı kalmasına yol açıyordu
  // (buildSystemPromptSections: base truthy → dynamicPromptSection). Artık
  // sadece "complex" seviye veya çok-boyutlu/broad-scan istekte enjekte edilir;
  // orchestration.mode: "off" hiç, "always" eski davranış (geriye dönük uyum).
  const orchestrationMode = cfg.orchestration?.mode ?? "auto"
  const coordinatorActive = opts.coordinatorMode === false
    ? false  // kullanıcı /coordinator ile tamamen kapattı — config'e bakılmaksızın hiç enjekte etme
    : orchestrationMode === "off"
      ? false
      : orchestrationMode === "always"
        ? true
        : shouldInjectCoordinatorPrompt(lastUserText, complexity.level)
  if (coordinatorActive) {
    runtimeSystemSections.push({ name: "coordinator", cache: "dynamic", content: getCoordinatorSystemPrompt() })
    // agentPool.active best-effort — asla turu çökertmemeli (ör. testlerde/edge-case'lerde mock/eksik olabilir)
    const activeWorkers = typeof agentPool.activeFor === "function"
      ? agentPool.activeFor(stateSessionId)
      : (agentPool.active ?? []).filter((agent) => agent.parentSessionId === stateSessionId)
    if (activeWorkers.length > 0) {
      const coordinatorContext = getCoordinatorContext(activeWorkers)
      if (coordinatorContext) {
        runtimeSystemSections.push({ name: "coordinator_context", cache: "dynamic", content: coordinatorContext })
      }
    }
  }

  const promptTier = featureEnabled("prompt_tiering")
    ? applyPromptTier(runtimeSystemSections, modelInfo.contextWindow)
    : { tier: "full" as const, sections: runtimeSystemSections }
  const tieredSystemSections = promptTier.sections
  const system = joinPromptSections(tieredSystemSections)
  opts.onPromptDiagnostics?.(analyzePromptSections(tieredSystemSections, modelId, tokenizerEncoding))
  const cacheHealth = recordPromptCacheHealth({
    key: `${workdir}:${providerName}`,
    model: modelId,
    sections: tieredSystemSections,
    toolIds: selectedToolIds,
  })
  opts.onPromptCacheHealth?.(cacheHealth)
  if (sessionId) {
    recordRunTrace(workdir, sessionId, "prompt_sections", {
      tier: promptTier.tier,
      sections: tieredSystemSections.map(section => ({ name: section.name, cache: section.cache, chars: section.content.length })),
      cacheHealth,
    }).catch(() => {})
    const canonicalState = tieredSystemSections.find(section => section.name === "canonical_agent_state")
    if (canonicalState) {
      recordRunTrace(workdir, sessionId, "canonical_agent_state", {
        chars: canonicalState.content.length,
        workingSetItems: workingSet.items.length,
        activeSkill: getSkillLifecycleSnapshot(sessionId).active?.skillId ?? null,
      }).catch(() => {})
    }
  }

  // Git context her turn'de fresh — Anthropic cache'e girmemeli
  const gitSection = buildGitSection(workdir)

  // History tek başına yeterli bir bütçe değildir: system/git blokları, tool
  // şemaları ve ekler de sağlayıcıya gider. Bu rezervi düşerek gerekirse ikinci
  // bir compaction yap; aksi hâlde ikinci turda görünmeyen context overflow olur.
  const toolSchemaReserveTokens = await countToolSchemaTokens(selectedToolIds, modelId, tokenizerEncoding)
  const attachmentReserveTokens = Math.max(
    0,
    (opts.attachments?.length ?? 0) - countAttachmentsInMessages(messages),
  ) * 1_200
  const contextUsageInput = {
    ...baseContextUsageInput,
    systemPrompt: [system, gitSection].filter(Boolean).join("\n\n"),
    toolSchemaReserveTokens,
    attachmentReserveTokens,
  }
  const effectiveContextUsage = measureContextUsage(messages, contextUsageInput)
  if (effectiveContextUsage.effectiveTokens >= effectiveContextUsage.compactionThreshold) {
    const contextReserve = Math.max(0, effectiveContextUsage.effectiveTokens - effectiveContextUsage.historyTokens)
    if (contextReserve >= effectiveContextUsage.compactionThreshold) {
      throw new Error("The system prompt and enabled tools exceed this model's available context window. Choose a model with a larger context window or reduce active tools.")
    }
    const effectiveCompactionConfig = {
      ...compCfgFull,
      contextLimit: compCfgFull.contextLimit - contextReserve,
    }
    const compacted = await compact(messages, effectiveCompactionConfig)
    messages = compacted
    reportCompaction("effective_context_limit", effectiveContextUsage, measureContextUsage(messages, contextUsageInput))
  }

  interface AttemptResult {
    fullText:     string
    breakdown:    TokenBreakdown
    finishReason: string | undefined
    newMessages:  CoreMessage[]
    providerId:   string
    modelId:      string
    turnStatus?:  TurnStatus
  }

  // attemptIndex>0 olan her çağrı bir retry veya fallback denemesidir — önceki
  // denemeden UI'ye akmış olabilecek kısmi metni sıfırlamak için onStreamRestart
  // tetiklenir (aksi halde başarısız denemenin parçası + yeni denemenin metni
  // yan yana görünüp transcript'i bozar).
  let attemptIndex = 0

  // Faz 1: Tek bir provider denemesini uçtan uca çalıştırır — model/tool/thinking/
  // prompt-cache çözümü dahil. withRetry (aynı provider) veya withFallback (farklı
  // provider) bu fonksiyonu sarar; ikisi de retry kapsamına artık gerçek stream
  // tüketimini de alır (öncesinde withRetry sadece senkron streamText çağrısını
  // sarıyordu, asıl hata fullStream tüketimi sırasında kapsam dışında fırlıyordu).
  async function runOneAttempt(attemptProviderId: string): Promise<AttemptResult> {
    const isRetryOrFallbackAttempt = attemptIndex > 0
    attemptIndex++
    if (isRetryOrFallbackAttempt) opts.onStreamRestart?.()

    const attemptPlugin = attemptProviderId === providerName ? plugin : ProviderRegistry.get(attemptProviderId)
    // Fallback farklı bir provider'a geçtiyse orijinal model id o provider'da
    // muhtemelen geçersizdir (provider-specific id) — o provider'ın varsayılan
    // modelini kullan.
    const attemptModelId = attemptProviderId === providerName
      ? modelId
      : selectEquivalentFallbackModel(modelInfo, attemptPlugin).model
    const attemptModel   = attemptPlugin.getModel(attemptModelId)

    const attemptModelInfo = attemptProviderId === providerName
      ? modelInfo
      : await resolveModelInfo(attemptPlugin, attemptProviderId, attemptModelId)
    const attemptHasToolSupport = attemptModelInfo?.supportsTools !== false
    let attemptToolCallHappened = false
    const attemptOutcomes = new Map<string, ToolOutcome[]>()
    const completedAttemptOutcomes: ToolOutcome[] = []
    const attemptAiTools = attemptHasToolSupport
      ? buildRoutedAITools({
          workdir, sessionId: stateSessionId, provider: attemptProviderId, model: attemptModelId, contextWindow: attemptModelInfo.contextWindow, config: cfg,
          ...(opts.signal ? { signal: opts.signal } : {}),
          ...(opts.onChunk ? { onChunk: opts.onChunk } : {}),
          failureTracker, recentReads, toolCallIndexRef,
          ...(opts.backendAccessToken ? { backendAccessToken: opts.backendAccessToken } : {}),
          ...(opts.backendAccessTokenResolver ? { backendAccessTokenResolver: opts.backendAccessTokenResolver } : {}),
          onToolExecution: () => { attemptToolCallHappened = true },
          outcomeQueue: attemptOutcomes,
          ...(opts.runtime ? { runtime: opts.runtime } : {}),
          taskContext: initialTaskContext,
          supportsVision: attemptModelInfo.supportsVision,
          selectedToolIds,
        })
      : ({} as ToolSet)
    const attemptToolIds = Object.keys(attemptAiTools)
    const attemptSystemSections = attemptToolIds.length === selectedToolIds.length
      && selectedToolIds.every(id => attemptToolIds.includes(id))
      ? tieredSystemSections
      : tieredSystemSections.map(section => section.name === "available_tools_policy"
          ? {
              ...section,
              content: formatAvailableToolPolicy(
                attemptToolIds,
                Math.max(0, availableToolIds.length - attemptToolIds.length),
              ),
            }
          : section)
    const attemptSystem = joinPromptSections(attemptSystemSections)

    // Anthropic prompt caching: static/session sections cache'lenir, dynamic/git
    // cache dışı kalır. Dış kapsamdaki `messages` hiç mutasyona uğramaz — her
    // attempt kendi system-wrap'li mesaj kopyasını kurar.
    let attemptConversationMessages: CoreMessage[] = messages
    if (attemptProviderId !== providerName) {
      const fallbackUsageInput = {
        providerId: attemptProviderId,
        modelId: attemptModelId,
        ...(attemptPlugin.tokenizerEncoding(attemptModelId) !== undefined
          ? { tokenizerEncoding: attemptPlugin.tokenizerEncoding(attemptModelId) }
          : {}),
        contextWindow: attemptModelInfo.contextWindow,
        maxOutputTokens: attemptModelInfo.maxOutput,
        systemPrompt: [attemptSystem, gitSection].filter(Boolean).join("\n\n"),
        toolSchemaReserveTokens: await countToolSchemaTokens(
          Object.keys(attemptAiTools),
          attemptModelId,
          attemptPlugin.tokenizerEncoding(attemptModelId),
        ),
        attachmentReserveTokens: Math.max(
          0,
          (opts.attachments?.length ?? 0) - countAttachmentsInMessages(attemptConversationMessages),
        ) * 1_200,
      }
      const fallbackUsage = measureContextUsage(attemptConversationMessages, fallbackUsageInput)
      if (fallbackUsage.effectiveTokens >= fallbackUsage.compactionThreshold) {
        const reserve = Math.max(0, fallbackUsage.effectiveTokens - fallbackUsage.historyTokens)
        if (reserve >= fallbackUsage.compactionThreshold) {
          throw new Error(`Fallback model '${attemptModelId}' cannot fit the active system prompt and tool schemas.`)
        }
        attemptConversationMessages = await compact(attemptConversationMessages, {
          contextLimit: attemptModelInfo.contextWindow - reserve,
          maxOutput: attemptModelInfo.maxOutput,
          tailTurns,
          strategy,
          provider: attemptProviderId,
          model: attemptModelId,
          workdir,
          ...(sessionId !== undefined ? { sessionId } : {}),
        })
      }
    }
    let attemptMessages: CoreMessage[] = attemptConversationMessages
    let attemptSystemParam: string | undefined = attemptSystem || undefined
    if (attemptPlugin.sdkType === "anthropic") {
      // @ai-sdk/anthropic's convertToAnthropicMessagesPrompt groups CONSECUTIVE
      // system-role CoreMessages back into Anthropic's array-of-cached-blocks
      // system format itself (see its "system" block-grouping switch case) — it
      // does NOT accept one CoreMessage whose `content` is already an array;
      // ai@4.x's CoreSystemMessage.content is typed (and Zod-validated) as
      // `string` only. So here we emit one plain-string system message per
      // section, each carrying its own experimental_providerMetadata — the
      // provider's own grouping reassembles them into the cached blocks.
      const systemMessages: CoreMessage[] = []
      const layout = buildPromptCacheLayout(attemptSystemSections)
      const promptCachingEnabled = isPromptCachingEnabled(attemptProviderId, attemptModelId)
      const pushSystemBlock = (content: string, cache: boolean) => {
        if (!content) return
        systemMessages.push({
          role: "system",
          content,
          ...(cache && promptCachingEnabled
            ? { experimental_providerMetadata: { anthropic: { cacheControl: getPromptCacheControl() } } as never }
            : {}),
        })
      }
      // Anthropic allows four explicit breakpoints. Reserve the fourth for the
      // moving conversation boundary below.
      pushSystemBlock(layout.static, true)
      pushSystemBlock(layout.session, true)
      pushSystemBlock(layout.skills, true)
      if (systemMessages.length > 0) {
        const cachedHistory = withAnthropicHistoryBreakpoint(
          attemptConversationMessages,
          promptCachingEnabled,
          true,
        )
        const dynamicContext = [layout.dynamic, gitSection].filter(Boolean).join("\n\n")
        attemptMessages = [
          ...systemMessages,
          ...appendAnthropicDynamicContext(cachedHistory, dynamicContext),
        ]
        attemptSystemParam = undefined
      }
    } else if (attemptSystem || gitSection) {
      // Non-Anthropic: git context dahil tek string
      const fullSystem = [attemptSystem, gitSection].filter(Boolean).join("\n\n")
      attemptSystemParam = fullSystem || undefined
    }

    // Faz 2.2: opts.effort verilmemişse ve model thinking destekliyorsa,
    // escalation.enabled iken karmaşıklık skorundan bir effort türet
    // (escalation.maxReasoningEffort ile sınırlı). escalation kapalıyken
    // davranış aynen korunur: sadece dışarıdan gelen opts.effort kullanılır.
    const effectiveEffort = opts.effort ?? (
      cfg.escalation?.enabled === true && attemptModelInfo?.supportsThinking
        ? deriveReasoningEffort(complexity.score, cfg.escalation?.maxReasoningEffort)
        : undefined
    )

    // Non-streaming providers expose no first-event signal: their promise only
    // resolves when the full generation is complete. Applying a TTFT timeout to
    // that promise incorrectly aborts valid long-thinking responses.
    const useStreamAttempt = opts.stream !== false && attemptPlugin.supportsStreaming
    const responseDeadline = createFirstResponseDeadline({
      enabled: useStreamAttempt,
      timeoutMs: PROVIDER_FIRST_RESPONSE_TIMEOUT_MS,
      ...(opts.signal ? { parentSignal: opts.signal } : {}),
    })
    opts.onPhase?.("waiting_for_provider")
    const attemptShared = {
      model:    attemptModel,
      messages: attemptMessages,
      tools:    attemptAiTools,
      maxSteps,
      experimental_continueSteps: true,
      ...(attemptSystemParam ? { system: attemptSystemParam } : {}),
      abortSignal: responseDeadline.signal,
      ...(effectiveEffort ? (() => {
        const thinkOpts = attemptPlugin.buildThinkingOptions(attemptModelId, effectiveEffort)
        return thinkOpts ? { providerOptions: thinkOpts } : {}
      })() : {})
    }

    // Calibrate only against single-step/no-tool requests below. Tool-driven
    // multi-step usage is cumulative and is not comparable to this first prompt.
    const estimatedAttemptInput = estimateEffectiveContextTokens(attemptMessages, {
      modelId: attemptModelId,
      ...(attemptPlugin.tokenizerEncoding(attemptModelId) !== undefined
        ? { tokenizerEncoding: attemptPlugin.tokenizerEncoding(attemptModelId) }
        : {}),
      ...(attemptSystemParam ? { systemPrompt: attemptSystemParam } : {}),
      toolSchemaReserveTokens: await countToolSchemaTokens(
        Object.keys(attemptAiTools),
        attemptModelId,
        attemptPlugin.tokenizerEncoding(attemptModelId),
      ),
      attachmentReserveTokens: Math.max(
        0,
        (opts.attachments?.length ?? 0) - countAttachmentsInMessages(attemptMessages),
      ) * 1_200,
      safetyMargin: 1,
    })

    let fullText = ""
    let breakdown: TokenBreakdown = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0 }
    let finishReason: string | undefined
    let newMessages: CoreMessage[] = []
    let turnStatus: TurnStatus | undefined

    if (useStreamAttempt) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = streamText(attemptShared as any) as any
      const seenToolResults  = new Set<string>()
      const toolCallTimes    = new Map<string, number>()
      const toolCallNames    = new Map<string, string>()
      // Embedded <think>...</think> tag'lerini text stream'den ayıran filter
      // (DeepSeek-R1, Qwen, Ollama modeller)
      const thinkFilter = createThinkTagFilter()
      const statusFilter = createTurnStatusFilter()
      // En az bir tool call bu attempt'te çalıştı mı? Çalıştıysa gerçek yan
      // etkiler oluşmuştur (dosya yazıldı, komut çalıştı) — sonraki bir hata
      // bu attempt'i retry/fallback ile baştan tekrarlatmamalı.
      let toolCallHappened = false

      try {
        for await (const part of result.fullStream) {
          responseDeadline.markResponse()
        if (part.type === "text-delta") {
          const raw = (part.textDelta as string) || ""
          if (!raw) continue
          const visibleRaw = statusFilter.feed(raw)
          const { text, thinking } = thinkFilter.feed(visibleRaw)
          if (thinking) opts.onText?.(thinking, true)
          if (text) {
            fullText += text
            opts.onText?.(text, false)
          }
        } else if (
          part.type === "reasoning"       ||
          part.type === "reasoning-delta" ||
          part.type === "thinking"
        ) {
          // Native reasoning events (Anthropic extended thinking, AI SDK)
          const delta: string =
            (part as any).text      ??
            (part as any).textDelta ??
            (part as any).reasoning ??
            (part as any).delta     ?? ""
          if (delta) opts.onText?.(delta, true)
        } else if (part.type === "reasoning-start" || part.type === "reasoning-end") {
          // lifecycle sinyalleri — delta taşımaz, ignore
        } else if (part.type === "error") {
          const rawErr = (part as any).error
          const original = rawErr instanceof Error
            ? rawErr
            : new Error(typeof rawErr === "string" ? rawErr : JSON.stringify(rawErr))
          if (toolCallHappened && !isRetrySafeAfterTools(completedAttemptOutcomes, toolCallNames.size)) {
            const nonRetryable = new NonRetryableStreamError(original.message)
            Object.assign(nonRetryable, original)
            nonRetryable.message = `${original.message}\n\n[Tool calls already ran this turn — not auto-retried to avoid duplicate side effects. Review the results above.]`
            throw nonRetryable
          }
          throw original
        } else if (part.type === "tool-call") {
          toolCallHappened = true
          toolCallTimes.set(part.toolCallId, Date.now())
          toolCallNames.set(part.toolCallId, part.toolName)
          opts.onToolCall?.({ id: part.toolCallId, tool: part.toolName, args: part.args })
        } else if (part.type === "tool-result") {
          // tool-result tek kaynak — step-finish'te tekrar emit edilmez
          if (!seenToolResults.has(part.toolCallId)) {
            seenToolResults.add(part.toolCallId)
            const durationMs = Date.now() - (toolCallTimes.get(part.toolCallId) ?? Date.now())
            toolCallTimes.delete(part.toolCallId)
            const toolName = toolCallNames.get(part.toolCallId) ?? "tool"
            toolCallNames.delete(part.toolCallId)
            // @ts-ignore: part.result
            const output = formatAdaptedToolResult(part.result)
            const outcome = attemptOutcomes.get(toolName)?.shift()
            if (outcome) completedAttemptOutcomes.push(outcome)
            opts.onToolResult?.({
              id: part.toolCallId,
              tool: toolName,
              result: output,
              durationMs,
              artifact: adaptedToolResultArtifact(part.result)
                ?? classifyToolResult(toolName, output, adaptedToolResultPresentation(part.result)),
              ...(outcome ? { outcome } : {}),
            })
          }
        } else if (part.type === "step-finish") {
          // Yalnızca step tamamlama sinyali — tool result emission yok (race condition önleme)
          opts.onStepFinish?.()
        }
        }

        // Stream bitti — buffer'da kalan fragmentleri boşalt
        const statusTail = statusFilter.flush()
        const beforeTail = thinkFilter.feed(statusTail)
        if (beforeTail.thinking) opts.onText?.(beforeTail.thinking, true)
        if (beforeTail.text) { fullText += beforeTail.text; opts.onText?.(beforeTail.text, false) }
        const tail = thinkFilter.flush()
        if (tail.thinking) opts.onText?.(tail.thinking, true)
        if (tail.text) { fullText += tail.text; opts.onText?.(tail.text, false) }

        const u    = await result.usage as Record<string, unknown>
        const meta = await (result as any).experimental_providerMetadata as Record<string, unknown> | undefined
        breakdown  = extractTokenBreakdown(u, meta)
        finishReason = String(await (result as any).finishReason ?? "")

        const finalResponse = await result.response
        newMessages = stripTurnStatusFromMessages(finalResponse.messages)
        turnStatus = statusFilter.status()
      } catch (error) {
        if ((toolCallHappened || attemptToolCallHappened)
          && !isRetrySafeAfterTools(completedAttemptOutcomes, toolCallNames.size)
          && !(error instanceof NonRetryableStreamError)) {
          throw new NonRetryableStreamError(`${error instanceof Error ? error.message : String(error)}\n\n[Tool calls already ran this turn — not auto-retried to avoid duplicate side effects.]`)
        }
        throw error
      } finally {
        responseDeadline.dispose()
      }
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      try {
        const result = await generateText(attemptShared as any)
        const parsedStatus = extractTurnStatus(result.text)
        fullText      = parsedStatus.text
        turnStatus    = parsedStatus.status
        opts.onText?.(fullText)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const step of (result as any).steps ?? []) {
          const toolNames = new Map<string, string>()
          for (const tc of step.toolCalls ?? []) {
            toolNames.set(tc.toolCallId, tc.toolName)
            opts.onToolCall?.({ id: tc.toolCallId, tool: tc.toolName, args: tc.args })
          }
          for (const tr of step.toolResults ?? []) {
            const toolName = toolNames.get(tr.toolCallId) ?? tr.toolName ?? "tool"
            const output = formatAdaptedToolResult(tr.result)
            const outcome = attemptOutcomes.get(toolName)?.shift()
            if (outcome) completedAttemptOutcomes.push(outcome)
            opts.onToolResult?.({
              id: tr.toolCallId,
              tool: toolName,
              result: output,
              durationMs: 0,
              artifact: adaptedToolResultArtifact(tr.result)
                ?? classifyToolResult(toolName, output, adaptedToolResultPresentation(tr.result)),
              ...(outcome ? { outcome } : {}),
            })
          }
        }

        const u    = result.usage as Record<string, unknown>
        const meta = (result as any).experimental_providerMetadata as Record<string, unknown> | undefined
        breakdown  = extractTokenBreakdown(u, meta)
        finishReason = String((result as any).finishReason ?? "")
        newMessages = stripTurnStatusFromMessages(result.response.messages)
      } catch (error) {
        const queuedOutcomes = [...attemptOutcomes.values()].flat()
        if (attemptToolCallHappened
          && !isRetrySafeAfterTools([...completedAttemptOutcomes, ...queuedOutcomes], 0)
          && !(error instanceof NonRetryableStreamError)) {
          throw new NonRetryableStreamError(`${error instanceof Error ? error.message : String(error)}\n\n[Tool calls already ran this turn — not auto-retried to avoid duplicate side effects.]`)
        }
        throw error
      } finally {
        responseDeadline.dispose()
      }
    }

    if (!attemptToolCallHappened) {
      recordTokenCalibration({
        provider: attemptProviderId,
        model: attemptModelId,
        estimatedInput: estimatedAttemptInput,
        actualInput: breakdown.input + breakdown.cacheRead + breakdown.cacheWrite,
      })
    }
    return {
      fullText, breakdown, finishReason, newMessages,
      providerId: attemptProviderId, modelId: attemptModelId,
      ...(turnStatus ? { turnStatus } : {}),
    }
  }

  // --- Fallback zinciri sadece cfg.fallback.enabled + provider listesi varsa devrede ---
  // Kapalıyken davranış değişmez: tek provider, withRetry ile 429 retry'i.
  const fallbackEnabled = !!(cfg.fallback?.enabled && (cfg.fallback.providers?.length ?? 0) > 0)

  let attemptResult: AttemptResult
  if (fallbackEnabled) {
    const { result, provider: resolvedProvider, switchedFrom } =
      await fallbackRuntime.execute(providerName, (attemptPlugin) => runOneAttempt(attemptPlugin.id))
    attemptResult = result
    if (switchedFrom) {
      opts.onProviderFallback?.(switchedFrom, resolvedProvider, {
        fromModel: modelId,
        toModel: attemptResult.modelId,
      })
    }
  } else {
    attemptResult = await runWithRetry(() => runOneAttempt(providerName))
  }

  const { fullText, breakdown, finishReason, newMessages, turnStatus, providerId: usedProviderName, modelId: usedModelId } = attemptResult

  if (sessionId !== undefined && fullText) {
    // usedProviderName/usedModelId: fallback devredeyse gerçekten çalışan provider/model
    // — birincisi değil (billing ve session geçmişi doğru kaynağı yansıtmalı).
    SessionManager.ensureExists(sessionId, { provider: usedProviderName, model: usedModelId, workdir })
    SessionManager.addPart({ sessionId, role: "assistant", type: "text", content: fullText, tokens: breakdown.output })
    SessionManager.recordTurn(sessionId, {
      inputTokens:  breakdown.input,
      outputTokens: breakdown.output,
      cacheTokens:  (breakdown.cacheRead ?? 0) + (breakdown.cacheWrite ?? 0),
      costUsd:      calculateCostUsd(usedModelId, breakdown),
      model:        usedModelId,
    })
    const tokenCacheAfter = tokenCacheStats()
    recordRunTrace(workdir, sessionId, "token_accounting", {
      estimatedContextTokens: effectiveContextUsage.effectiveTokens,
      toolSchemaTokens: toolSchemaReserveTokens,
      actualInputTokens: breakdown.input,
      cacheReadTokens: breakdown.cacheRead,
      cacheWriteTokens: breakdown.cacheWrite,
      tokenizerCacheHits: tokenCacheAfter.hits - tokenCacheBefore.hits,
      tokenizerCacheMisses: tokenCacheAfter.misses - tokenCacheBefore.misses,
      calibration: getTokenCalibration(usedProviderName, usedModelId),
    }).catch(() => metrics.recordError("token_accounting_trace"))
  }

  const continuationTasks = taskScope
    ? taskManager.getTasks(taskScope)
    : opts.continuation?.getTasks?.() ?? []
  const continuation = evaluateContinuation({
    text: fullText,
    finishReason,
    newMessageCount: newMessages.length,
    tasks: continuationTasks,
    ...(turnStatus ? { structuredStatus: turnStatus.state } : {}),
  }, {
    previousContinuations: opts.continuation?.previousContinuations ?? resumedState?.continuation?.nextContinuationCount,
    maxContinuations: opts.continuation?.maxContinuations,
    maxTaskContinuations: opts.continuation?.maxTaskContinuations,
  })
  const finalWorkingSet = getWorkingSetSnapshot(stateSessionId)
  const lastVerification = extractWorkingSetVerificationSnapshot(finalWorkingSet)
    ?? extractVerificationSnapshot(fullText)
    ?? resumedState?.lastVerification
  let completionGate = evaluateCompletionGate({
    text: fullText,
    continuation,
    workingSet: finalWorkingSet,
    verification: lastVerification,
    allowTaskAutoContinue: taskContinuationTurn || continuationTasks.some(task => ["pending", "ready", "in_progress", "verifying"].includes(task.status)),
  })
  const taskLedger = buildTaskLedger({
    objective: taskContinuationTurn && resumedState?.taskLedger
      ? resumedState.taskLedger.objective
      : lastUserText,
    workingSet: finalWorkingSet,
    verification: lastVerification,
    continuation,
    tasks: continuationTasks,
    previous: resumedState?.taskLedger,
  })
  let completionProof = buildCompletionProof({
    sessionId: stateSessionId,
    ledger: taskLedger,
    completionGate,
    previous: resumedState?.completionProof,
  })
  completionGate = applyCompletionProofGate(completionGate, completionProof)
  try {
    await writeCompletionProof(workdir, completionProof)
  } catch (error) {
    completionProof = {
      ...completionProof,
      status: "failed",
      criteria: [...completionProof.criteria, {
        id: "proof-persistence",
        label: "Completion evidence is durably stored",
        required: true,
        status: "failed",
        evidence: [{
          id: `proof-persistence:${Date.now()}`,
          kind: "task_state",
          status: "failed",
          summary: error instanceof Error ? error.message : String(error),
          source: "proof_store",
          recordedAt: Date.now(),
        }],
      }],
      evidenceCount: completionProof.evidenceCount + 1,
      updatedAt: Date.now(),
    }
    completionGate = applyCompletionProofGate(
      { status: "complete", shouldAutoContinue: false, reason: "proof persistence failed", shadowOnly: false },
      completionProof,
    )
  }
  // Faz 2.4: bu turdaki tool çalışmaları failure-cooldown'u güncellemiş olabilir —
  // turn başında alınan `failureCooldown` snapshot'ı bayattır, taze bir tane çek.
  const finalFailureCooldown = getFailureCooldownSnapshot(stateSessionId)
  const shouldEscalateNudge = cfg.escalation?.enabled === true
    && cfg.escalation?.escalateOnRepeatedFailure === true
    && finalFailureCooldown.active.length > 0

  const longTask = evaluateLongTaskContinuation({
    text: fullText,
    ledger: taskLedger,
    completionGate,
    continuation,
    config: longTaskConfig,
    budget: {
      previousContinuations: continuation.previousContinuations,
    },
    taskIntent: taskContinuationTurn,
    escalateReasoning: shouldEscalateNudge,
  })
  if (longTask.shouldContinue && !completionGate.shouldAutoContinue && !completionGate.shadowOnly) {
    completionGate.status = longTask.reason === "budget_exhausted" ? "budget_exhausted" : "continue_required"
    completionGate.shouldAutoContinue = true
    completionGate.reason = `long_task:${longTask.reason}`
    completionGate.shadowOnly = longTask.shadowOnly
  }

  const contextUsage = measureContextUsage([...messages, ...newMessages], contextUsageInput)
  const taskContext = buildTaskContext({
    objective: taskLedger.objective,
    tasks: taskScope ? taskManager.getTasks(taskScope) : [],
    workingSet: finalWorkingSet,
    ...(lastVerification ? { verification: lastVerification } : {}),
    previous: initialTaskContext,
  })
  const finish: AgentFinishResult = {
    text:      fullText,
    tokens:    breakdown,
    newMessages,
    contextUsage,
    continuation,
    completionGate,
    longTask,
    taskLedger,
    completionProof,
    taskContext,
    ...(turnStatus ? { turnStatus } : {}),
    ...(finishReason ? { finishReason } : {}),
    ...(sessionId !== undefined ? { sessionId } : {}),
  }

  if (sessionId !== undefined) {
    try {
      await writeSessionResumeState({
        sessionId,
        workdir,
        provider: usedProviderName,
        model: usedModelId,
        updatedAt: Date.now(),
        activeSkills: getSkillLifecycleSnapshot(sessionId).stack,
        workingSet: finalWorkingSet,
        failureCooldown: getFailureCooldownSnapshot(sessionId),
        completionGate,
        continuation,
        longTask,
        taskLedger,
        taskContext,
        activeToolIds: selectedToolIds,
        completionProof,
        ...(finishReason ? { finishReason } : {}),
        tokens: breakdown,
        ...(lastVerification ? { lastVerification } : {}),
        ...(fullText ? { lastTextPreview: fullText.slice(-1_500) } : {}),
      })
    } catch (error) {
      metrics.recordError("resume_state_write")
      throw new Error(`Failed to persist session resume state '${sessionId}'.`, { cause: error })
    }
    recordRunTrace(workdir, sessionId, "completion_gate", completionGate as unknown as Record<string, unknown>).catch(() => {})
    recordRunTrace(workdir, sessionId, "long_task", {
      decision: longTask,
      ledger: taskLedger,
    }).catch(() => {})
    recordRunTrace(workdir, sessionId, "working_set", {
      items: finalWorkingSet.items.slice(0, 12),
      updatedAt: finalWorkingSet.updatedAt,
    }).catch(() => {})
    recordRunTrace(workdir, sessionId, "completion_proof", {
      status: completionProof.status,
      evidenceCount: completionProof.evidenceCount,
      criteria: completionProof.criteria.map((criterion) => ({ id: criterion.id, status: criterion.status })),
    }).catch(() => {})
  }

  opts.onFinish?.(finish)

  // Agent başarıyla tamamlandı — aktif skill'lerin success skorunu artır (fire-and-forget)
  if (fullText && projectSkills.length > 0) {
    try { skillScoreStore.recordSuccess(workdir, projectSkills.map((s) => s.id)) } catch { /* optional */ }
  }

  // ─── Faz 3: Per-turn memory extraction ──────────────────────────────────────
  // Her turn sonunda memory extraction yap (fire-and-forget)
  // Compaction'dan daha sık çalışır, sadece son birkaç mesaja bakar
  if (fullText && messages.length >= 2) {
    extractPerTurnMemories(
      usedProviderName,
      usedModelId,
      [...messages, ...newMessages],
      workdir,
      utilityModel,
    ).catch(() => metrics.recordError("memory_extract"))
  }

  return finish
}

function extractTokenBreakdown(
  u:    Record<string, unknown>,
  meta: Record<string, unknown> | undefined,
): TokenBreakdown {
  const am = (meta?.["anthropic"] ?? {}) as Record<string, unknown>

  const input  = Number(u["promptTokens"]     ?? u["inputTokens"]     ?? u["prompt_tokens"]      ?? 0)
  const output = Number(u["completionTokens"] ?? u["outputTokens"]    ?? u["completion_tokens"]   ?? 0)

  // Cache tokens — Anthropic native fields (via AI SDK providerMetadata)
  const cacheRead  = Number(am["cacheReadInputTokens"]      ?? u["cacheReadInputTokens"]       ?? 0)
  const cacheWrite = Number(am["cacheCreationInputTokens"]  ?? u["cacheCreationInputTokens"]   ?? 0)

  // Reasoning tokens — extended thinking (Anthropic, may come via usage or providerMetadata)
  const reasoning  = Number(am["reasoningOutputTokens"] ?? u["reasoningTokens"] ?? 0)

  return { input, output, cacheRead, cacheWrite, reasoning }
}

function isRetrySafeAfterTools(outcomes: ToolOutcome[], pendingToolCalls: number): boolean {
  if (pendingToolCalls > 0 || outcomes.length === 0) return false
  return outcomes.every(outcome =>
    outcome.retry.safety === "pure"
    || (outcome.retry.safety === "idempotent" && !outcome.retry.effectCommitted)
  )
}
