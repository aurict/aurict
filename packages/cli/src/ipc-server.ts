/**
 * IPC server mode — the Bun sidecar entry point used by apps/desktop.
 *
 * Runs the exact same @aurict/core agent engine the TUI uses, but instead of
 * rendering Ink, exposes it over a JSON-lines protocol on stdio: one JSON
 * object per line in both directions. This lets the Electron app's main
 * process (which runs on Electron's own bundled Node, not Bun) reuse the
 * agent loop/tool executor/permission system without @aurict/core ever being
 * imported outside a real Bun process.
 *
 * Wire types mirror apps/desktop/src/shared/ipc-types.ts's SidecarCommand/
 * SidecarMessage — kept as plain, hand-written literals here rather than a
 * shared import, since packages/cli and apps/desktop are independent
 * packages and this protocol is intentionally small.
 */

import {
  runAgent,
  ProviderRegistry,
  listAvailableModels,
  PermissionGate,
  ExecutorEvents,
  SessionManager,
  loadConfig,
  setApiKey,
  setDefault,
  setCustomProvider,
  createOpenAICompatiblePlugin,
  getSessionAgent,
  getAllSessionAgents,
  SkillRegistry,
  detectSkills,
  installRemoteSkill,
  uninstallSkill,
  listInstalledSkills,
  DesignLoader,
  matchDesign,
  buildDesignPrompt,
  buildDesignOutputDir,
  slugify,
  designArtifactStore,
  artifactRegistry,
  recordSystemUsed,
  recordSkillUsed,
  readAttachmentFromPath,
  memoryStore,
  runFinanceCalculation,
  type CoreMessage,
  type FinanceCalculationRequest,
  type PermissionRequest,
  type PermissionDecision,
  type ModelInfo,
  type Memory,
  type Category,
  type Scope,
} from "@aurict/core"
import { parseFinanceResearchAudit } from './finance-research-audit.js'
import { desktopSessionMetadata } from './session-metadata.js'
import { CliRemoteRuntime } from './remote/runtime.js'
import { WebRtcCliTransport } from './remote/webrtc-transport.js'
import { ensureAccessToken, getAuthStatus, loginWithBrowser, logout as remoteLogout } from './remote/auth.js'
import { RemoteApiError } from './remote/backend-client.js'
import { existsSync } from 'node:fs'
import { extname, resolve } from 'node:path'

/** Backend tokenı yalnızca ilgili araç çalışırken çözülür; normal chat başlangıcı
 *  oturum yenilemesi yüzünden beklemez. */
async function resolveBackendAccessToken(signal: AbortSignal): Promise<string | undefined> {
  try {
    return await ensureAccessToken(signal)
  } catch (error) {
    if (error instanceof RemoteApiError && error.code === "not_signed_in") return undefined
    throw error
  }
}

interface ChatAttachment { path: string; content?: string }
interface ChatSubmitPayload { turnId: string; text: string; attachments?: ChatAttachment[]; agentId?: string; artifactId?: string; artifactIntent?: "create" | "iterate" | "promote"; displayText?: string; financeResearchId?: string }
interface CustomProviderDef { name: string; baseUrl: string; apiKey: string; defaultModel: string }

type SidecarCommand =
  | { type: "chat:submit"; payload: ChatSubmitPayload }
  | { type: "chat:cancel"; turnId: string }
  | { type: "permission:respond"; id: string; decision: PermissionDecision }
  | { type: "provider:list" }
  | { type: "provider:set-key"; providerId: string; apiKey: string }
  | { type: "provider:set-custom"; id: string; def: CustomProviderDef }
  | { type: "session:list" }
  | { type: "session:select"; id: string }
  | { type: "session:new" }
  | { type: "session:rename"; id: string; title: string }
  | { type: "session:archive"; id: string; archived: boolean }
  | { type: "session:branch"; id: string }
  | { type: "session:search"; query: string }
  | { type: "session:delete"; id: string }
  | { type: "skills:list" }
  | { type: "skills:install"; url: string }
  | { type: "skills:uninstall"; id: string }
  | { type: "model:list"; providerId: string }
  | { type: "model:get-current" }
  | { type: "model:select"; providerId: string; modelId: string }
  | { type: "agents:list" }
  | { type: "design:list-systems" }
  | { type: "design:list-skills" }
  | { type: "design:match"; brief: string }
  | { type: "design:build-prompt"; brief: string; systemId: string; skillId: string }
  | { type: "design:artifact:list" }
  | { type: "design:artifact:create"; brief: string; systemId: string; skillId: string; title?: string }
  | { type: "design:artifact:retry"; id: string }
  | { type: "memory:list" }
  | { type: "memory:add"; content: string; category: Category; scope: Scope }
  | { type: "memory:remove"; id: string }
  | { type: "memory:clear"; scope?: Scope }
  | { type: "finance:calculate"; request: FinanceCalculationRequest }
  | { type: "remote:action"; action: "login" | "start" | "stop" | "logout" | "status" }

type SidecarMessage =
  | { type: "chat:event"; event: unknown }
  | { type: "permission:request"; request: PermissionRequest }
  | { type: "provider:list-result"; providers: Array<{ id: string; name: string; hasKey: boolean }> }
  | { type: "session:list-result"; sessions: Array<{ id: string; title: string | null; createdAt: number; updatedAt: number; status: string; parentId: string | null; turnCount: number; totalInputTokens: number; totalOutputTokens: number; totalCacheTokens: number; accumulatedCostUsd: number; provider: string | null; lastModel: string | null }> }
  | { type: "session:select-result"; messages: Array<{ role: "user" | "assistant"; content: string }> }
  | { type: "session:new-result"; id: string }
  | { type: "session:rename-result"; id: string; title: string }
  | { type: "session:archive-result"; id: string; archived: boolean }
  | { type: "session:branch-result"; id: string; messages: Array<{ role: "user" | "assistant"; content: string }> }
  | { type: "session:search-result"; results: Array<{ sessionId: string; title: string | null; updatedAt: number; matchCount: number; excerpt: string }> }
  | { type: "session:delete-result"; id: string; wasActive: boolean }
  | { type: "skills:list-result"; skills: Array<{ id: string; name: string; description: string; active: boolean; installed: boolean }> }
  | { type: "skills:install-result"; result: { id: string; name: string } | { error: string } }
  | { type: "skills:uninstall-result"; ok: boolean }
  | { type: "model:list-result"; models: ModelInfo[] }
  | { type: "model:list-error"; message: string }
  | { type: "model:current-result"; providerId: string; modelId: string }
  | { type: "agents:list-result"; agents: Array<{ id: string; name: string; description: string; color: string }> }
  | { type: "design:list-systems-result"; systems: Array<{ id: string; name: string; category: string; tagline: string }> }
  | { type: "design:list-skills-result"; skills: Array<{ id: string; name: string; description: string; mode: string }> }
  | { type: "design:match-result"; match: { systemId: string; skillId: string; systemScore: number; skillScore: number; alternativeIds: string[] } }
  | { type: "design:build-prompt-result"; prompt: string; outputDir: string }
  | { type: "design:artifact:list-result"; artifacts: ReturnType<typeof designArtifactStore.list> }
  | { type: "design:artifact:create-result"; result: { artifact: ReturnType<typeof designArtifactStore.get>; prompt: string } }
  | { type: "design:artifact:retry-result"; result: { artifact: ReturnType<typeof designArtifactStore.get>; prompt: string } }
  | { type: "memory:list-result"; memories: Memory[] }
  | { type: "memory:add-result"; memory: Memory }
  | { type: "memory:remove-result"; ok: boolean }
  | { type: "memory:clear-result"; removed: number }
  | { type: "finance:calculate-result"; result?: ReturnType<typeof runFinanceCalculation>; error?: string }
  | { type: "remote:status"; status: string; message: string; email?: string; sessionId?: string }

function send(msg: SidecarMessage): void {
  process.stdout.write(JSON.stringify(msg) + "\n")
}

export async function runIpcServer(workdir: string): Promise<void> {
  const history: CoreMessage[] = []
  let sessionId: string = crypto.randomUUID()
  let activeController: AbortController | null = null
  let activeTurnId: string | null = null
  let remoteRuntime: CliRemoteRuntime | null = null
  let currentProvider = ProviderRegistry.detectDefault()
  let currentModel = ProviderRegistry.get(currentProvider).defaultModel()
  // Electron's pending-request queue resolves model responses in send order.
  // Keep live requests serialized so slow providers cannot reorder responses.
  let modelListQueue = Promise.resolve()
  const toolCalls = new Map<string, { tool: string; args: unknown }>()

  const artifactKindFor = (filePath: string) => {
    const extension = extname(filePath).toLowerCase()
    if (extension === '.pdf') return { kind: 'pdf' as const, mimeType: 'application/pdf' }
    if (extension === '.html' || extension === '.htm') return { kind: 'html' as const, mimeType: 'text/html' }
    if (/^\.(png|jpe?g|gif|webp|svg)$/.test(extension)) return { kind: 'image' as const }
    if (extension === '.md') return { kind: 'markdown' as const, mimeType: 'text/markdown' }
    if (/^\.(csv|json)$/.test(extension)) return { kind: 'table' as const }
    if (/^\.(docx|xlsx|pptx)$/.test(extension)) return { kind: 'document' as const }
    return { kind: 'unknown' as const }
  }
  const publishToolArtifact = (callId: string, prompt?: string) => {
    const call = toolCalls.get(callId); toolCalls.delete(callId)
    if (!call || typeof call.args !== 'object' || call.args === null) return
    const candidate = (call.args as Record<string, unknown>).path
    if (typeof candidate !== 'string' || !candidate.trim()) return
    const outputPath = resolve(workdir, candidate)
    if (!existsSync(outputPath)) return
    const type = artifactKindFor(outputPath)
    if (type.kind === 'unknown') return
    const record = artifactRegistry.register({ id: `tool-${sessionId}-${callId}`, title: outputPath.split('/').pop() ?? 'Generated artifact', ...type, lifecycle: 'ready', source: 'workspace', path: outputPath, workspace: workdir, tool: call.tool, ...(prompt ? { prompt } : {}) })
    send({ type: 'chat:event', event: { type: 'artifact:updated', artifact: record } })
  }

  const publishDesignArtifact = (artifact: ReturnType<typeof designArtifactStore.get>) => {
    const record = artifactRegistry.register({
      id: `design-${artifact.id}`, title: artifact.title, kind: 'html', lifecycle: artifact.status === 'ready' ? 'ready' : artifact.status === 'failed' ? 'failed' : 'generating',
      source: 'aurict-managed', path: designArtifactStore.outputPath(artifact.id), workspace: artifact.workspace,
      mimeType: 'text/html', sessionId, prompt: artifact.brief, ...(artifact.error ? { error: artifact.error } : {}),
    })
    send({ type: 'chat:event', event: { type: 'artifact:updated', artifact: record } })
  }

  const publishRemoteStatus = async (message?: string) => {
    const auth = await getAuthStatus()
    const runtime = remoteRuntime
    send({ type: 'remote:status', status: runtime?.getStatus() ?? (auth.signedIn ? 'signedIn' : 'signedOut'), message: message ?? (auth.signedIn ? `Signed in as ${auth.email}.` : 'Sign in to connect a trusted phone.'), ...(auth.email ? { email: auth.email } : {}), ...(runtime?.getSession()?.id ? { sessionId: runtime.getSession()!.id } : {}) })
  }

  // Restore user-configured custom providers before the first chat turn,
  // same as apps/cli/src/index.ts does for its own process.
  const omniCfg = loadConfig(workdir)
  for (const [id, def] of Object.entries(omniCfg.customProviders ?? {})) {
    ProviderRegistry.register(createOpenAICompatiblePlugin({
      id,
      name: def.name,
      baseURL: def.baseUrl,
      getApiKey: () => def.apiKey,
      defaultModel: def.defaultModel,
      models: [{ id: def.defaultModel, name: def.defaultModel, contextWindow: 128_000, maxOutput: 8_000, supportsTools: true, supportsVision: false }],
      modelsEndpoint: `${def.baseUrl.replace(/\/+$/, "")}/models`,
    }))
  }
  if (omniCfg.defaults?.provider && ProviderRegistry.has(omniCfg.defaults.provider)) currentProvider = omniCfg.defaults.provider
  if (omniCfg.defaults?.model) currentModel = omniCfg.defaults.model

  // Single, process-lifetime subscription — permission_ask events forward to
  // the Electron main process; PermissionGate.respond() is invoked below when
  // the corresponding permission:respond command comes back.
  ExecutorEvents.on((event) => {
    if (event.type === "permission_ask") {
      send({ type: "permission:request", request: event.request })
    }
  })

  async function handleChatSubmit(payload: ChatSubmitPayload): Promise<void> {
    const artifactContext = payload.artifactId
      ? payload.artifactIntent === "promote"
        ? `\n\n## Design Handoff\nThe approved prototype is at: ${designArtifactStore.outputPath(payload.artifactId)}\nRead it before planning implementation. Treat it as visual intent, adapt it to the existing workspace architecture, and do not overwrite the artifact.`
        : payload.artifactIntent === "create"
          ? `\n\n## New Design Artifact\nWrite the complete generated artifact to: ${designArtifactStore.outputPath(payload.artifactId)}`
        : `\n\n## Existing Design Artifact\nUpdate this existing artifact in place: ${designArtifactStore.outputPath(payload.artifactId)}\nRead the current HTML before editing. Preserve working interactions unless the request explicitly changes them, then write the complete revised HTML back to the same path.`
      : ""
    const userMessage: CoreMessage = { role: "user", content: payload.text + artifactContext }
    const historyMessage: CoreMessage = { role: "user", content: payload.displayText?.trim() || payload.text }
    const nextHistory = [...history, userMessage]

    // Matches App.tsx's handleSubmit: the session agent (omni by default, or
    // whichever mode the composer's agent selector picked) supplies the base
    // system prompt. Omitting `system` entirely hits an edge case in core's
    // system-prompt-block construction that the CLI never exercises (it
    // always has a non-empty agentDef.system) — this isn't a core bug fix,
    // just calling runAgent the same way the CLI does.
    const agentDef = getSessionAgent(payload.agentId ?? "omni", workdir)

    if (activeController) {
      send({ type: "chat:event", event: { type: "error", turnId: payload.turnId, message: "A chat turn is already running." } })
      return
    }
    const controller = new AbortController()
    activeController = controller
    activeTurnId = payload.turnId
    try {
      send({ type: "chat:event", event: { type: "phase", turnId: payload.turnId, phase: "accepted" } })
      send({ type: "chat:event", event: { type: "phase", turnId: payload.turnId, phase: "preparing_attachments" } })
      const attachments = payload.attachments?.length
        ? await Promise.all(payload.attachments.map((attachment) => readAttachmentFromPath(attachment.path)))
        : undefined
      send({ type: "chat:event", event: { type: "phase", turnId: payload.turnId, phase: "preparing_context" } })
      await runAgent({
        provider: currentProvider,
        model: currentModel,
        workdir,
        sessionId,
        backendAccessTokenResolver: resolveBackendAccessToken,
        ...(agentDef.system ? { system: agentDef.system } : {}),
        messages: nextHistory,
        runtime: { profile: "desktop-sidecar" },
        ...(attachments ? { attachments } : {}),
        signal: controller.signal,
        onText: (delta, isReasoning) => send({ type: "chat:event", event: { type: "text-delta", turnId: payload.turnId, delta, isReasoning } }),
        onToolCall: (call) => { toolCalls.set(call.id, { tool: call.tool, args: call.args }); send({ type: "chat:event", event: { type: "tool-call", turnId: payload.turnId, id: call.id, tool: call.tool, args: call.args } }) },
        onToolResult: (res) => { publishToolArtifact(res.id, payload.displayText?.trim() || payload.text); send({ type: "chat:event", event: { type: "tool-result", turnId: payload.turnId, id: res.id, result: res.result, durationMs: res.durationMs } }) },
        onChunk: (text) => send({ type: "chat:event", event: { type: "chunk", turnId: payload.turnId, text } }),
        onStepFinish: () => send({ type: "chat:event", event: { type: "step-finish", turnId: payload.turnId } }),
        onCompaction: (event) => send({
          type: "chat:event",
          event: {
            type: "compaction",
            turnId: payload.turnId,
            beforeTokens: event.before.effectiveTokens,
            afterTokens: event.after.effectiveTokens,
            threshold: event.before.compactionThreshold,
            reason: event.reason,
          },
        }),
        onProviderFallback: (from, to) => send({ type: "chat:event", event: { type: "provider-fallback", turnId: payload.turnId, from, to } }),
        onStreamRestart: () => send({ type: "chat:event", event: { type: "stream-restart", turnId: payload.turnId } }),
        onPhase: (phase) => send({ type: "chat:event", event: { type: "phase", turnId: payload.turnId, phase } }),
        onEvent: (runtimeEvent) => send({ type: "chat:event", event: { type: "runtime:event", turnId: payload.turnId, runtimeEvent } }),
        onFinish: (result) => {
          history.push(historyMessage, ...result.newMessages)
          if (payload.artifactId && payload.artifactIntent !== "promote") {
            try {
              designArtifactStore.captureRevision(payload.artifactId, result.text)
              publishDesignArtifact(designArtifactStore.get(payload.artifactId))
            } catch (error) {
              designArtifactStore.fail(payload.artifactId, error instanceof Error ? error.message : String(error))
              throw error
            }
          }
          if (payload.financeResearchId) {
            send({ type: "chat:event", event: { type: "finance-research-audit", turnId: payload.turnId, researchId: payload.financeResearchId, audit: parseFinanceResearchAudit(result.text) } })
          }
          if (activeController === controller) {
            activeController = null
            activeTurnId = null
          }
          send({ type: "chat:event", event: { type: "finish", turnId: payload.turnId, text: result.text, sessionId: result.sessionId, finishReason: result.finishReason } })
        },
      })
    } catch (err) {
      if (payload.artifactId && payload.artifactIntent !== "promote") {
        try {
          designArtifactStore.fail(payload.artifactId, err instanceof Error ? err.message : String(err))
          publishDesignArtifact(designArtifactStore.get(payload.artifactId))
        } catch (artifactError) {
          console.error("[aurict] failed to record design artifact failure", artifactError)
        }
      }
      if (activeController === controller) {
        activeController = null
        activeTurnId = null
      }
      send({ type: "chat:event", event: { type: "error", turnId: payload.turnId, message: err instanceof Error ? err.message : String(err) } })
    } finally {
      if (activeController === controller) {
        activeController = null
        activeTurnId = null
      }
    }
  }

  function handleCommand(cmd: SidecarCommand): void {
    switch (cmd.type) {
      case "chat:submit":
        void handleChatSubmit(cmd.payload)
        return
      case "chat:cancel":
        if (activeTurnId === cmd.turnId) activeController?.abort()
        return
      case "remote:action": {
        void (async () => {
          try {
            if (cmd.action === 'login') {
              await loginWithBrowser((event) => send({ type: 'remote:status', status: event.phase, message: event.message }))
              await publishRemoteStatus()
              return
            }
            if (cmd.action === 'logout') { await remoteRuntime?.close(); remoteRuntime = null; await remoteLogout(); await publishRemoteStatus('Signed out of remote control.'); return }
            if (cmd.action === 'stop') { await remoteRuntime?.close(); remoteRuntime = null; await publishRemoteStatus('Remote session closed.'); return }
            if (cmd.action === 'start') {
              const auth = await getAuthStatus(); if (!auth.signedIn) throw new Error('Sign in before starting remote control.')
              if (!remoteRuntime) {
                remoteRuntime = new CliRemoteRuntime({ transport: new WebRtcCliTransport() })
                remoteRuntime.onStatusChange((status) => { void publishRemoteStatus(status === 'connected' ? 'Phone connected. Remote control is active.' : `Remote status: ${status}`) })
                remoteRuntime.onEvent((event) => {
                  if (event.type === 'prompt.submit' && typeof event.payload.prompt === 'string') { void handleChatSubmit({ turnId: crypto.randomUUID(), text: event.payload.prompt, displayText: 'Remote prompt' }); return }
                  if (event.type === 'interrupt') { activeController?.abort(); return }
                  if (event.type === 'permission.response' && typeof event.payload.id === 'string' && (event.payload.decision === 'allow' || event.payload.decision === 'allow_once' || event.payload.decision === 'deny')) {
                    PermissionGate.respond(event.payload.id, event.payload.decision)
                  }
                })
              }
              await remoteRuntime.start(); return
            }
            await publishRemoteStatus()
          } catch (error) { send({ type: 'remote:status', status: 'error', message: error instanceof Error ? error.message : String(error) }) }
        })()
        return
      }
      case "permission:respond":
        PermissionGate.respond(cmd.id, cmd.decision)
        return
      case "provider:list":
        send({ type: "provider:list-result", providers: ProviderRegistry.available() })
        return
      case "provider:set-key":
        setApiKey(cmd.providerId, cmd.apiKey)
        currentProvider = cmd.providerId
        currentModel = ProviderRegistry.get(cmd.providerId).defaultModel()
        return
      case "provider:set-custom": {
        setCustomProvider(cmd.id, cmd.def)
        ProviderRegistry.register(createOpenAICompatiblePlugin({
          id: cmd.id,
          name: cmd.def.name,
          baseURL: cmd.def.baseUrl,
          getApiKey: () => cmd.def.apiKey,
          defaultModel: cmd.def.defaultModel,
          models: [{ id: cmd.def.defaultModel, name: cmd.def.defaultModel, contextWindow: 128_000, maxOutput: 8_000, supportsTools: true, supportsVision: false }],
          modelsEndpoint: `${cmd.def.baseUrl.replace(/\/+$/, "")}/models`,
        }))
        return
      }
      case "session:list": {
        const sessions = SessionManager.listWithStats().map(desktopSessionMetadata)
        send({ type: "session:list-result", sessions })
        return
      }
      case "session:select": {
        // True resume (per plan — deliberately NOT the CLI's restore-without-
        // repointing quirk): sessionId actually repoints, and prior turns are
        // reloaded as real history so the next chat:submit has full context.
        // The same restored turns are sent back so the renderer can show them,
        // not just use them invisibly as context.
        sessionId = cmd.id
        const parts = SessionManager.getParts(cmd.id)
        history.length = 0
        const messages: Array<{ role: "user" | "assistant"; content: string }> = []
        for (const part of parts) {
          if (part.role === "user" || part.role === "assistant") {
            history.push({ role: part.role, content: part.content } as CoreMessage)
            messages.push({ role: part.role, content: part.content })
          }
        }
        send({ type: "session:select-result", messages })
        return
      }
      case "session:new": {
        sessionId = crypto.randomUUID()
        history.length = 0
        send({ type: "session:new-result", id: sessionId })
        return
      }
      case "session:rename": {
        SessionManager.rename(cmd.id, cmd.title)
        send({ type: "session:rename-result", id: cmd.id, title: cmd.title.trim() })
        return
      }
      case "session:archive": {
        SessionManager.archive(cmd.id, cmd.archived)
        send({ type: "session:archive-result", id: cmd.id, archived: cmd.archived })
        return
      }
      case "session:branch": {
        sessionId = SessionManager.branch(cmd.id)
        history.length = 0
        const messages: Array<{ role: "user" | "assistant"; content: string }> = []
        for (const part of SessionManager.getParts(sessionId)) if (part.role === "user" || part.role === "assistant") { history.push({ role: part.role, content: part.content } as CoreMessage); messages.push({ role: part.role, content: part.content }) }
        send({ type: "session:branch-result", id: sessionId, messages })
        return
      }
      case "session:search": {
        send({ type: "session:search-result", results: SessionManager.search(cmd.query) })
        return
      }
      case "session:delete": {
        const wasActive = cmd.id === sessionId
        SessionManager.deleteSession(cmd.id)
        if (wasActive) {
          sessionId = crypto.randomUUID()
          history.length = 0
        }
        send({ type: "session:delete-result", id: cmd.id, wasActive })
        return
      }
      case "skills:list": {
        void (async () => {
          const active = await detectSkills(workdir)
          const activeIds = new Set(active.map((s) => s.id))
          const installedIds = new Set(listInstalledSkills().map((s) => s.id))
          const skills = SkillRegistry.all().map((s) => ({
            id: s.id, name: s.name, description: s.description,
            active: activeIds.has(s.id), installed: installedIds.has(s.id),
          }))
          send({ type: "skills:list-result", skills })
        })()
        return
      }
      case "skills:install": {
        void (async () => {
          try {
            const meta = await installRemoteSkill(cmd.url)
            send({ type: "skills:install-result", result: { id: meta.id, name: meta.name } })
          } catch (err) {
            send({ type: "skills:install-result", result: { error: err instanceof Error ? err.message : String(err) } })
          }
        })()
        return
      }
      case "skills:uninstall": {
        send({ type: "skills:uninstall-result", ok: uninstallSkill(cmd.id) })
        return
      }
      case "model:list": {
        modelListQueue = modelListQueue.then(async () => {
          const provider = ProviderRegistry.get(cmd.providerId)
          try {
            const models = await listAvailableModels(provider)
            send({ type: "model:list-result", models })
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error)
            const fallbackModels = provider.listModels()
            if (fallbackModels.length > 0) {
              console.warn(`[aurict] live model refresh failed for ${cmd.providerId}; using bundled models: ${message}`)
              send({ type: "model:list-result", models: fallbackModels })
              return
            }
            send({ type: "model:list-error", message })
          }
        })
        return
      }
      case "model:get-current": {
        send({ type: "model:current-result", providerId: currentProvider, modelId: currentModel })
        return
      }
      case "model:select": {
        currentProvider = cmd.providerId
        currentModel = cmd.modelId
        setDefault('provider', currentProvider)
        setDefault('model', currentModel)
        return
      }
      case "agents:list": {
        const agents = getAllSessionAgents(workdir).map((a) => ({
          id: a.id, name: a.name, description: a.description, color: a.color,
        }))
        send({ type: "agents:list-result", agents })
        return
      }
      case "design:list-systems": {
        const systems = DesignLoader.listSystems().map((s) => ({
          id: s.id, name: s.name, category: s.category, tagline: s.tagline,
        }))
        send({ type: "design:list-systems-result", systems })
        return
      }
      case "design:list-skills": {
        const skills = DesignLoader.listSkills().map((s) => ({
          id: s.id, name: s.name, description: s.description, mode: s.mode,
        }))
        send({ type: "design:list-skills-result", skills })
        return
      }
      case "design:match": {
        const m = matchDesign(cmd.brief)
        send({
          type: "design:match-result",
          match: {
            systemId: m.system.id, skillId: m.skill.id,
            systemScore: m.systemScore, skillScore: m.skillScore,
            alternativeIds: m.alternatives.map((a) => a.id),
          },
        })
        return
      }
      case "design:build-prompt": {
        const outputSlug = slugify(cmd.brief)
        const prompt = buildDesignPrompt({
          brief: cmd.brief, systemId: cmd.systemId, skillId: cmd.skillId,
          workdir, outputSlug,
        })
        const outputDir = buildDesignOutputDir(outputSlug)
        send({ type: "design:build-prompt-result", prompt, outputDir })
        return
      }
      case "design:artifact:list": {
        send({ type: "design:artifact:list-result", artifacts: designArtifactStore.list(workdir) })
        return
      }
      case "design:artifact:create": {
        const id = slugify(cmd.brief)
        const artifact = designArtifactStore.create({
          id,
          title: cmd.title?.trim() || cmd.brief.trim().slice(0, 80),
          brief: cmd.brief,
          workspace: workdir,
          systemId: cmd.systemId,
          skillId: cmd.skillId,
        })
        publishDesignArtifact(artifact)
        recordSystemUsed(cmd.systemId)
        recordSkillUsed(cmd.skillId)
        const prompt = buildDesignPrompt({
          brief: cmd.brief,
          systemId: cmd.systemId,
          skillId: cmd.skillId,
          workdir,
          outputSlug: artifact.id,
        })
        send({ type: "design:artifact:create-result", result: { artifact, prompt } })
        return
      }
      case "design:artifact:retry": {
        const artifact = designArtifactStore.retry(cmd.id)
        publishDesignArtifact(artifact)
        const prompt = buildDesignPrompt({
          brief: artifact.brief,
          systemId: artifact.systemId,
          skillId: artifact.skillId,
          workdir,
          outputSlug: artifact.id,
        })
        send({ type: "design:artifact:retry-result", result: { artifact, prompt } })
        return
      }
      case "memory:list": {
        send({ type: "memory:list-result", memories: memoryStore.list(workdir) })
        return
      }
      case "memory:add": {
        const memory = memoryStore.add({
          content: cmd.content, category: cmd.category, scope: cmd.scope,
          source: "manual", ...(cmd.scope === "project" ? { project: workdir } : {}),
        })
        send({ type: "memory:add-result", memory })
        return
      }
      case "memory:remove": {
        send({ type: "memory:remove-result", ok: memoryStore.remove(cmd.id) })
        return
      }
      case "memory:clear": {
        send({ type: "memory:clear-result", removed: memoryStore.clear(cmd.scope, workdir) })
        return
      }
      case "finance:calculate": {
        try {
          send({ type: "finance:calculate-result", result: runFinanceCalculation(cmd.request) })
        } catch (error) {
          send({ type: "finance:calculate-result", error: error instanceof Error ? error.message : String(error) })
        }
        return
      }
      }
  }

  let buffer = ""
  process.stdin.setEncoding("utf8")
  process.stdin.on("data", (chunk: string) => {
    buffer += chunk
    let idx: number
    while ((idx = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, idx).trim()
      buffer = buffer.slice(idx + 1)
      if (!line) continue
      try {
        handleCommand(JSON.parse(line) as SidecarCommand)
      } catch (err) {
        send({ type: "chat:event", event: { type: "error", message: `Malformed command: ${err instanceof Error ? err.message : String(err)}` } })
      }
    }
  })

  process.stdin.on("end", () => process.exit(0))

  // Keep the returned promise pending forever — the process's actual lifetime
  // is governed by the stdin "end" handler above (or the parent process
  // killing this child directly), not by this function returning.
  await new Promise<void>(() => {})
}
