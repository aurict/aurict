import React, { useState, useCallback, useEffect, useRef, useMemo } from "react"
import crypto from "node:crypto"
import { join } from "node:path"
import { homedir, tmpdir } from "node:os"
import { writeFileSync, readFileSync, unlinkSync } from "node:fs"
import { spawnSync } from "node:child_process"
import { Box, Text, useInput, useApp } from "ink"
import {
  runAgent,
  ProviderRegistry,
  SessionManager,
  ExecutorEvents,
  PermissionGate,
  PermissionStore,
  getSkillsForProject,
  agentPool,
  questionService,
  readAttachmentFromPath,
  extractSymbolBody,
  taskManager,
  detectUndercoverRepo,
  getCoordinatorSystemPrompt,
  getCoordinatorContext,
  getSessionAgent,
  getAllSessionAgents,
  notifyTaskDone,
  notifyError,
  memoryStore,
  extractAndStoreMemories,
  fileWatcher,
  snapshotManager,
  depSentinel,
  PlanGate,
  setDefault,
  setMCPLogHandler,
} from "@aurict/core"
import type { PermissionRequest, PermissionResponse, QuestionRequest, QuestionAnswer, Attachment, Task, CoreMessage, DependencyChange, PlanRequest, TokenBreakdown, PromptDiagnostics, PromptCacheHealthResult } from "@aurict/core"

import { parseSlashCommand, getCommand, allCommands } from "../commands/registry.js"
import type { CommandResult, PickerItem } from "../commands/types.js"
import { ThemeContext, THEMES, DEFAULT_THEME } from "../utils/theme.js"
import { TerminalSizeContext } from "./TerminalSizeContext.js"
import { KeybindingsProvider } from "../keybindings/index.js"
import type { Context as KeybindingContext } from "../keybindings/index.js"

import { Message, type DisplayMessage, type AssistantContentBlock } from "./Message.js"
import { TaskFloatingPanel } from "./TaskFloatingPanel.js"
import { ChatInput }         from "./ChatInput.js"
import { AlternateScreen }   from "./AlternateScreen.js"
import { PermissionPrompt, type PermissionPromptDecision }  from "./PermissionPrompt.js"
import { QuestionPrompt }    from "./QuestionPrompt.js"
import { Picker }            from "./Picker.js"
import { PromptInput }       from "./PromptInput.js"
import { StatusBar }         from "./StatusBar.js"
import { CommandSuggest }    from "./CommandSuggest.js"
import { StartupBanner }     from "./StartupBanner.js"
import { AgentStatus }       from "./AgentStatus.js"
import { ConversationViewport } from "./ConversationViewport.js"
import { FullscreenLayout }     from "./FullscreenLayout.js"
import { SubagentView }      from "./SubagentView.js"
import { FileMention }       from "./FileMention.js"
import { ExpandableOutput }  from "./ExpandableOutput.js"
import { BtwPanel }          from "./BtwPanel.js"
import { QuickSearch }       from "./QuickSearch.js"
import { CommandPalette }    from "./CommandPalette.js"
import { MessageEditPanel }  from "./MessageEditPanel.js"
import { PlanApprovalModal } from "./PlanApprovalModal.js"
import { SettingsPanel }     from "./SettingsPanel.js"
import { DesignWizard }      from "./DesignWizard.js"
import type { DesignWizardResult } from "./DesignWizard.js"
import type { UpdateInfo } from "../util/update-check.js"
import { CURRENT_VERSION }  from "../util/update-check.js"
import { readClipboard }     from "../util/clipboard.js"
import { useMouseEvents }    from "./mouse.js"
import { buildDesignPrompt, recordSystemUsed, recordSkillUsed, slugify } from "@aurict/core"
import { clearDraft, hasPendingCrashReport, writeCrashReport } from "../util/draft.js"
import { getTerminalCaps }   from "../util/terminal-caps.js"
import { useOverlayState }   from "./hooks/useOverlayState.js"
import { HistorySearch }     from "./HistorySearch.js"
import { KeyboardShortcuts } from "./KeyboardShortcuts.js"
import { AUTO_CONTINUE_PROMPT } from "./auto-continue.js"
import type { LocalServerStatus } from "../bootstrap.js"

interface Props {
  initialProvider: string
  initialModel:    string
  workdir:         string
  system?:         string
  undercover?:     boolean
  updatePromise?:  Promise<UpdateInfo | null>
  localServer?:    LocalServerStatus
}

function configuredSandboxBackend(): "none" | "policy" | "docker" {
  const raw = process.env["AURICT_SANDBOX_BACKEND"] ?? process.env["AURICT_SANDBOX"]
  if (raw === "none" || raw === "off" || raw === "false" || raw === "0") return "none"
  if (raw === "docker") return "docker"
  return "policy"
}

const PERM_FILE = join(homedir(), ".aurict", "permissions.json")

export function App({ initialProvider, initialModel, workdir, system, undercover, updatePromise, localServer }: Props) {
  const { exit } = useApp()

  // Overlay state management — merkezi hook
  const overlay = useOverlayState()
  const {
    quickSearchOpen, setQuickSearchOpen,
    cmdPaletteOpen, setCmdPaletteOpen,
    settingsOpen, setSettingsOpen,
    designWizardOpen, setDesignWizardOpen,
    historySearchOpen, setHistorySearchOpen,
    keyboardShortcutsOpen, setKeyboardShortcutsOpen,
    taskPanelOpen, setTaskPanelOpen,
    updateDismissed, setUpdateDismissed,
    attachInput, setAttachInput,
    attachPath, setAttachPath,
    attachments, setAttachments,
    editingMsg, setEditingMsg,
    planRequest, setPlanRequest,
    expandedContent, setExpandedContent,
    btwState, setBtwState,
    viewingSubagentId, setViewingSubagentId,
  } = overlay

  const [provider,   setProviderState] = useState(initialProvider)
  const [model,      setModelState]    = useState(initialModel)
  const [effort,     setEffort]        = useState<number | undefined>(undefined)
  const [termCols,   setTermCols]      = useState(() => process.stdout.columns ?? 80)
  const [termRows,   setTermRows]      = useState(() => process.stdout.rows ?? 24)
  const [messages,   setMessages]      = useState<DisplayMessage[]>([])
  const [input,      setInput]         = useState("")
  const [loading,    setLoading]       = useState(false)
  const [permissionQueue, setPermissionQueue] = useState<PermissionRequest[]>([])
  const permission = permissionQueue[0] ?? null
  const [question,   setQuestion]      = useState<QuestionRequest | null>(null)
  const [picker,     setPicker]        = useState<{ title: string; items: PickerItem[]; onSelect: (i: PickerItem) => void } | null>(null)
  const [prompt,     setPrompt]        = useState<{ title: string; placeholder: string | undefined; secret: boolean | undefined; onSubmit: (v: string) => void } | null>(null)
  const [tokens,     setTokens]        = useState<TokenBreakdown>({ input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0 })
  const [history,    setHistory]       = useState<CoreMessage[]>([])
  const historyRef = useRef<CoreMessage[]>([])
  const [skillNames, setSkillNames]    = useState<string[]>([])
  const [turnSkillNames, setTurnSkillNames] = useState<string[]>([])
  const [tasks,      setTasks]         = useState<Task[]>([])
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [isStreaming,    setIsStreaming]     = useState(false)
  const [startupBannerVisible, setStartupBannerVisible] = useState(true)

  // Streaming display — messages array'den ayrı tutulur (render storm önlenir)
  const [streamingText,   setStreamingText]   = useState<string | null>(null)
  const [streamingReason, setStreamingReason] = useState<string | null>(null)

  const [activeTool,     setActiveTool]     = useState<string | undefined>(undefined)
  const [themeName,      setThemeName]      = useState(DEFAULT_THEME)
  const [sessionTitle,   setSessionTitle]   = useState<string | undefined>(undefined)
  const [isUndercover,   setIsUndercover]   = useState(false)
  const [coordinatorMode,  setCoordinatorMode]  = useState(true)
  const [activeAgent,      setActiveAgent]      = useState("omni")
  const [workdirState,     setWorkdirState]     = useState(workdir)
  const [queuedInput,      setQueuedInput]      = useState<string | undefined>(undefined)
  const [branch,           setBranch]           = useState<string | undefined>(undefined)
  const [wasCompacted,     setWasCompacted]     = useState(false)
  const [contextTokens,    setContextTokens]    = useState(0)
  const [promptDiagnostics, setPromptDiagnostics] = useState<PromptDiagnostics | undefined>(undefined)
  const [promptCacheHealth, setPromptCacheHealth] = useState<PromptCacheHealthResult | undefined>(undefined)
  const [memoryCount,      setMemoryCount]      = useState(0)
  const [bgTasks,           setBgTasks]          = useState<Array<{ id: string; prompt: string; startedAt: number; status: "running"|"done"|"error"; output?: string }>>([])
  const bgControllersRef = useRef<Map<string, AbortController>>(new Map())

  // Aktif subagent sayısı — agentPool.onChange ile reaktif güncellenir
  const [activeAgentCount, setActiveAgentCount] = useState(() => agentPool.active.length)

  // Update notification
  const [updateInfo,        setUpdateInfo]        = useState<UpdateInfo | null>(null)

  // Draft save timestamp — triggers a brief "✓ saved" flash in StatusBar

  // Streaming inline error
  const [streamingError, setStreamingError] = useState<string | null>(null)
  useEffect(() => { historyRef.current = history }, [history])

  useEffect(() => {
    if (!updatePromise) return
    updatePromise.then((info) => { if (info) setUpdateInfo(info) }).catch(() => {})
  }, [])

  // Autopilot mode — tüm permission'ları otomatik onayla
  const [autopilotMode, setAutopilotMode] = useState(false)
  const autopilotRef = useRef(false)
  useEffect(() => { autopilotRef.current = autopilotMode }, [autopilotMode])

  // Alternate screen içinde native terminal scrollback yok; mouse wheel'i
  // overlay navigation veya konuşma viewport scroll'u için kullan.
  const mouseTrackingActive = true

  useMouseEvents((e) => {
    if (e.type !== "scroll") return
    if (picker !== null || permission !== null || question !== null) {
      if (e.button === "scroll-up")   process.stdin.emit("data", "\x1b[A")
      if (e.button === "scroll-down") process.stdin.emit("data", "\x1b[B")
      return
    }
    if (overlayOpen || viewingSubagentId) return
    scrollConversation(e.button === "scroll-up" ? 3 : -3)
  }, mouseTrackingActive)

  const [recentCmds,      setRecentCmds]      = useState<string[]>([])
  const [designInitialBrief, setDesignInitialBrief] = useState<string | undefined>(undefined)

  // Herhangi bir tam-ekran overlay/modal açıkken true — useInput guard'ları bu flag'i kullanır.
  // Merkezi hook'tan hesaplanır (useOverlayState).
  const overlayOpen = overlay.computeOverlayOpen({ permission, picker, question, prompt })

  type FocusLayer =
    | "permission"
    | "question"
    | "picker"
    | "prompt"
    | "keyboardShortcuts"
    | "subagent"
    | "historySearch"
    | "quickSearch"
    | "commandPalette"
    | "settings"
    | "designWizard"
    | "editing"
    | "plan"
    | "expanded"
    | "btw"
    | "taskPanel"
    | "attach"
    | "streaming"
    | "ready"

  const focusLayer: FocusLayer = useMemo(() => {
    if (permission) return "permission"
    if (question) return "question"
    if (picker) return "picker"
    if (prompt) return "prompt"
    if (keyboardShortcutsOpen) return "keyboardShortcuts"
    if (viewingSubagentId) return "subagent"
    if (historySearchOpen) return "historySearch"
    if (quickSearchOpen) return "quickSearch"
    if (cmdPaletteOpen) return "commandPalette"
    if (settingsOpen) return "settings"
    if (designWizardOpen) return "designWizard"
    if (editingMsg) return "editing"
    if (planRequest) return "plan"
    if (expandedContent) return "expanded"
    if (btwState) return "btw"
    if (taskPanelOpen) return "taskPanel"
    if (attachInput) return "attach"
    if (loading) return "streaming"
    return "ready"
  }, [
    permission, question, picker, prompt, keyboardShortcutsOpen, viewingSubagentId,
    historySearchOpen, quickSearchOpen, cmdPaletteOpen, settingsOpen, designWizardOpen,
    editingMsg, planRequest, expandedContent, btwState, taskPanelOpen, attachInput, loading,
  ])

  const keybindingContext: KeybindingContext = useMemo(() => {
    if (focusLayer === "permission") return "permission"
    if (focusLayer === "question") return "question"
    if (focusLayer === "picker" || focusLayer === "prompt") return "picker"
    if (focusLayer === "taskPanel") return "task-panel"
    if (focusLayer === "streaming") return "streaming"
    if (focusLayer === "ready") return "ready"
    return "modal"
  }, [focusLayer])

  const draftTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Watch Mode
  const [watchedPaths, setWatchedPaths] = useState<Array<{ path: string; prompt?: string }>>([])
  const watchCleanupRef = useRef<Map<string, () => void>>(new Map())

  // Checkpoints
  interface Checkpoint { mark: number; messages: DisplayMessage[]; history: CoreMessage[]; label: string }
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([])
  const MAX_CHECKPOINTS = 20

  // Conversation Branches
  interface ConvBranch { id: string; name: string; messages: DisplayMessage[]; history: CoreMessage[]; tokens: TokenBreakdown; createdAt: number }
  const ZERO_TOKENS: TokenBreakdown = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0 }
  const [branches,        setBranches]        = useState<ConvBranch[]>([{ id: "main", name: "main", messages: [], history: [], tokens: ZERO_TOKENS, createdAt: Date.now() }])
  const [activeBranchIdx, setActiveBranchIdx] = useState(0)

  const mainSessionId   = useRef<string>(crypto.randomUUID())
  const extractedRef    = useRef(false)
  const isFirstMessage  = useRef(true)
  const latestToolCallRef = useRef<{ id: string; tool: string; content: string } | null>(null)
  const btwFrameRef       = useRef<ReturnType<typeof setInterval> | null>(null)
  const skipSubmitRef     = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const loadingRef         = useRef(false)

  // Auto-continue: model görev ortasında durduğunda otomatik devam
  const autoContinueRef  = useRef<{ needed: boolean; count: number }>({ needed: false, count: 0 })
  const autoContinueSubmittingRef = useRef(false)

  // Scroll lock: Ctrl+L ile aktif edilir, animation timer'ları ve stream flush'ı dondurur
  const [scrollLocked, setScrollLocked] = useState(false)
  const scrollLockedRef = useRef(false)
  useEffect(() => { scrollLockedRef.current = scrollLocked }, [scrollLocked])
  const [conversationOffsetRows, setConversationOffsetRows] = useState(0)
  // Unseen count: scroll lock olduğunda yeni gelen mesaj sayısı
  const scrollLockMsgCountRef = useRef(0)
  useEffect(() => { if (scrollLocked) scrollLockMsgCountRef.current = messages.length }, [scrollLocked])
  const unseenCount = scrollLocked ? Math.max(0, messages.length - scrollLockMsgCountRef.current) : 0

  // Adaptive throttle refs
  const streamTextRef    = useRef("")
  const streamReasonRef  = useRef("")
  const streamTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tokenRateRef     = useRef(80)   // başlangıçta hızlı varsay (80 tok/s → 30ms flush)
  const lastTokenTimeRef = useRef(0)
  const turnHadToolRef     = useRef(false)
  const turnAssistantIdRef = useRef<string | null>(null)

  // "/" öneri filtresi
  const cmdFilter = !overlayOpen && input.startsWith("/")
    ? input.slice(1)
    : null

  // "@" dosya tamamlama filtresi — "@" sonraki path prefix'i yakala
  const mentionFilter = !overlayOpen && !loading && cmdFilter === null
    ? (input.match(/@([\w./~-]*)$/)?.[1] ?? null)
    : null

  // ── Static için finalize mesajlar ─────────────────────────────────────────
  const showStartupBanner = !viewingSubagentId && startupBannerVisible
  // Viewport yüksekliği artık Yoga'nın ölçtüğü gerçek değerden geliyor (FullscreenLayout callback).
  // İlk render için fallback: termRows - 8 (yaklaşık chrome rezervasyonu).
  const [measuredViewportRows, setMeasuredViewportRows] = useState(() => Math.max(6, termRows - 8))
  const taskSummary = useMemo(() => ({
    pending:    tasks.filter(t => t.status === "pending").length,
    inProgress: tasks.filter(t => t.status === "in_progress").length,
    done:       tasks.filter(t => t.status === "done").length,
    error:      tasks.filter(t => t.status === "error").length,
  }), [tasks])
  const sandboxBackend = useMemo(() => configuredSandboxBackend(), [])

  const scrollConversation = useCallback((deltaRows: number) => {
    if (deltaRows === 0) return
    setConversationOffsetRows((prev) => Math.max(0, prev + deltaRows))
  }, [])

  const pageConversation = useCallback((direction: -1 | 1) => {
    const page = Math.max(3, Math.floor(measuredViewportRows * 0.8))
    scrollConversation(direction * page)
  }, [measuredViewportRows, scrollConversation])

  // Ctrl+G: mevcut input'u $EDITOR'da açar — spawnSync ile event loop'u bloklar,
  // alternate screen'i geçici devre dışı bırakır, editör kapanınca geri döner.
  const openExternalEditor = useCallback(() => {
    if (loadingRef.current) return
    const editor  = process.env["EDITOR"] ?? process.env["VISUAL"] ?? "vi"
    const tmpPath = join(tmpdir(), `aurict-input-${Date.now()}.txt`)
    try {
      writeFileSync(tmpPath, inputRef.current, "utf8")
      process.stdout.write("\x1b[?1049l")                  // alternate screen'den çık
      spawnSync(editor, [tmpPath], { stdio: "inherit" })   // editörü çalıştır
      process.stdout.write("\x1b[?1049h\x1b[2J\x1b[H")   // alternate screen'e geri dön + temizle
      const content = readFileSync(tmpPath, "utf8").replace(/\n$/, "")
      setInput(content)
    } catch {
      process.stdout.write("\x1b[?1049h\x1b[2J\x1b[H")
    } finally {
      try { unlinkSync(tmpPath) } catch { /* ignore */ }
    }
  }, [])  // loadingRef + inputRef stable ref'ler, deps gereksiz

  // ── Subscriptions ─────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = () => {
      setTermCols(process.stdout.columns ?? 80)
      setTermRows(process.stdout.rows ?? 24)
    }
    process.stdout.on("resize", handler)
    return () => { process.stdout.off("resize", handler) }
  }, [])

  // Kalıcı izinleri başlangıçta yükle
  useEffect(() => { PermissionStore.loadPersisted(PERM_FILE) }, [])

  useEffect(() => questionService.onQuestion((req) => setQuestion(req)), [])
  useEffect(() => agentPool.onChange((agents) => setActiveAgentCount(agents.length)), [])
  useEffect(() => ExecutorEvents.on((e) => {
    if (e.type === "permission_ask") {
      // Autopilot modda izin isteklerini otomatik onayla
      if (autopilotRef.current) {
        PermissionGate.respond(e.request.id, "allow")
        return
      }
      setPermissionQueue(q => [...q, e.request])
    }
  }), [])
  useEffect(() => {
    getSkillsForProject(workdir)
      .then((s) => setSkillNames(s.map((sk) => sk.id)))
      .catch(() => {})
  }, [workdir])
  useEffect(() => taskManager.onUpdate(() => setTasks([...taskManager.getTasks()])), [])
  useEffect(() => PlanGate.onRequest((req) => setPlanRequest(req)), [])

  const inputRef = useRef(input)
  useEffect(() => { inputRef.current = input }, [input])

  // MCP log handler — MCP bağlantı mesajlarını TUI'ye system message olarak ekle
  useEffect(() => {
    setMCPLogHandler((message: string, isError: boolean) => {
      addSystemMsg(isError ? `⚠ ${message}` : message)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])


  // Crash recovery notice on mount
  useEffect(() => {
    if (hasPendingCrashReport()) {
      addSystemMsg(`⚠ Crash report detected from a previous session. Use /crashes to view.`)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const info = ProviderRegistry.available().find((p) => p.id === initialProvider)
    if (info && !info.hasKey) {
      addSystemMsg(`⚠ Missing API key for ${info.name} — set the environment variable`)
    }
    try { setMemoryCount(memoryStore.list(workdir).length) } catch { /* ignore */ }
    detectUndercoverRepo(workdir).then((isPublic) => {
      if (isPublic) { setIsUndercover(true); addSystemMsg("🕵 Public repo detected — undercover mode active") }
    }).catch(() => {})
    import("bun").then(({ spawn }) => {
      const proc = spawn(["git","branch","--show-current"], { cwd: workdir, stdout: "pipe", stderr: "pipe" })
      new Response(proc.stdout).text().then((out) => { const b = out.trim(); if (b) setBranch(b) }).catch(() => {})
    }).catch(() => {})
  }, [initialProvider, workdir])

  // Bracketed paste — sadece terminal destekliyorsa etkinleştir
  useEffect(() => {
    const caps = getTerminalCaps()
    if (!caps.bracketedPaste) return
    process.stdout.write("\x1b[?2004h")
    const cleanup = () => { process.stdout.write("\x1b[?2004l") }
    const onExit = () => cleanup()
    process.on("exit", onExit)
    process.on("SIGTERM", onExit)
    return () => {
      cleanup()
      process.off("exit", onExit)
      process.off("SIGTERM", onExit)
    }
  }, [])

  // Dependency Sentinel
  useEffect(() => {
    let cleanup: (() => void) | null = null
    depSentinel.snapshot(workdir).then(() => {
      cleanup = depSentinel.watch(workdir, (change: DependencyChange) => {
        const parts: string[] = []
        if (change.added.length)   parts.push(`+${change.added.length} added`)
        if (change.removed.length) parts.push(`-${change.removed.length} removed`)
        if (change.changed.length) parts.push(`~${change.changed.length} changed`)
        if (parts.length) addSystemMsg(`📦 Dependency change: ${parts.join(", ")}`)
      })
    }).catch(() => {})
    return () => { cleanup?.() }
  }, [workdir])

  useEffect(() => { loadingRef.current = loading }, [loading])

  // ── Global keyboard handler ───────────────────────────────────────────────
  // 8 ayrı useInput → 1 listener: Ink'in EventEmitter MaxListeners sorununu engeller
  const ctrlCCountRef = useRef(0)
  const ctrlCTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const closeFocusedLayer = useCallback((): boolean => {
    switch (focusLayer) {
      case "permission":
      case "question":
      case "picker":
      case "prompt":
      case "streaming":
        return true
      case "keyboardShortcuts":
        setKeyboardShortcutsOpen(false)
        return true
      case "subagent":
        setViewingSubagentId(null)
        return true
      case "historySearch":
        setHistorySearchOpen(false)
        return true
      case "quickSearch":
        setQuickSearchOpen(false)
        return true
      case "commandPalette":
        setCmdPaletteOpen(false)
        return true
      case "settings":
        setSettingsOpen(false)
        return true
      case "designWizard":
        setDesignWizardOpen(false)
        return true
      case "editing":
        setEditingMsg(null)
        return true
      case "plan":
        if (planRequest) PlanGate.respond(planRequest.id, { type: "rejected" })
        setPlanRequest(null)
        return true
      case "expanded":
        setExpandedContent(null)
        return true
      case "btw":
        setBtwState(null)
        if (btwFrameRef.current) {
          clearInterval(btwFrameRef.current)
          btwFrameRef.current = null
        }
        return true
      case "taskPanel":
        setTaskPanelOpen(false)
        return true
      case "attach":
        setAttachInput(false)
        setAttachPath("")
        return true
      case "ready":
        return false
    }
  }, [
    focusLayer, planRequest,
    setKeyboardShortcutsOpen, setViewingSubagentId, setHistorySearchOpen,
    setQuickSearchOpen, setCmdPaletteOpen, setSettingsOpen, setDesignWizardOpen,
    setEditingMsg, setPlanRequest, setExpandedContent, setBtwState,
    setTaskPanelOpen, setAttachInput, setAttachPath,
  ])

  const togglePrimaryOverlay = useCallback((
    target: "quickSearch" | "commandPalette" | "historySearch" | "settings" | "taskPanel" | "attach",
  ) => {
    const wasOpen =
      (target === "quickSearch" && quickSearchOpen) ||
      (target === "commandPalette" && cmdPaletteOpen) ||
      (target === "historySearch" && historySearchOpen) ||
      (target === "settings" && settingsOpen) ||
      (target === "taskPanel" && taskPanelOpen) ||
      (target === "attach" && attachInput)

    overlay.closePrimaryOverlays()
    if (wasOpen) return

    if (target === "quickSearch") setQuickSearchOpen(true)
    if (target === "commandPalette") setCmdPaletteOpen(true)
    if (target === "historySearch") setHistorySearchOpen(true)
    if (target === "settings") setSettingsOpen(true)
    if (target === "taskPanel") setTaskPanelOpen(true)
    if (target === "attach") setAttachInput(true)
  }, [
    quickSearchOpen, cmdPaletteOpen, historySearchOpen, settingsOpen, taskPanelOpen, attachInput,
    overlay.closePrimaryOverlays,
    setQuickSearchOpen, setCmdPaletteOpen, setHistorySearchOpen, setSettingsOpen,
    setTaskPanelOpen, setAttachInput,
  ])

  useInput((input, key) => {
    // ── Ctrl+C: abort / exit ──────────────────────────────────────────────
    if (key.ctrl && input === "c") {
      if (loadingRef.current && abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
        PermissionGate.cancelPending()
        PlanGate.cancelPending()
        setPlanRequest(null)
        setPermissionQueue([])
        setMessages((prev) => prev.map(m => m.pending ? { ...m, pending: false } : m))
        setStreamingText(null)
        setStreamingReason(null)
        addSystemMsg("Aborted.")
        return
      }
      ctrlCCountRef.current += 1
      if (ctrlCTimerRef.current) clearTimeout(ctrlCTimerRef.current)
      if (ctrlCCountRef.current >= 2) { agentPool.active.forEach((a) => agentPool.cancel(a.id)); exit(); return }
      addSystemMsg("Press Ctrl+C again to exit.")
      ctrlCTimerRef.current = setTimeout(() => { ctrlCCountRef.current = 0 }, 3000)
      return
    }

    // ── ESC: aktif focus katmanını kapat ─────────────────────────────────
    if (key.escape) {
      if (closeFocusedLayer()) return
      if (updateInfo && !updateDismissed) { setUpdateDismissed(true); return }
      if (input?.startsWith("/")) { setInput(""); return }
      if (!loading) exit()
      return
    }

    // Attach panel gerçek input focus'u gibi davranır.
    if (focusLayer === "attach") {
      if (key.return) { void handleAttachSubmit(attachPath); return }
      if (key.backspace || key.delete) { setAttachPath(p => p.slice(0, -1)); return }
      if (input && !key.ctrl && !key.meta) { setAttachPath(p => p + input); return }
      return
    }

    // Subagent görünümünde global kısayol yerine sadece sibling navigasyonu.
    if (focusLayer === "subagent" && (key.leftArrow || key.rightArrow)) {
      const subSessions = SessionManager.list()
        .filter((s) => s.parentId === mainSessionId.current)
        .sort((a, b) => a.createdAt - b.createdAt)
      if (!subSessions.length) return
      const idx  = subSessions.findIndex((s) => s.id === viewingSubagentId)
      const next = key.leftArrow
        ? subSessions[(idx - 1 + subSessions.length) % subSessions.length]!
        : subSessions[(idx + 1) % subSessions.length]!
      setViewingSubagentId(next.id)
      return
    }

    // ── Ctrl+L: scroll lock ── (streaming dahil her layerde çalışır)
    if (key.ctrl && input === "l") {
      setScrollLocked((v) => !v)
      return
    }

    // ── Ctrl+K: tüm subagentları durdur ──────────────────────────────────
    if (key.ctrl && input === "k") {
      const active = agentPool.active
      if (active.length > 0) {
        active.forEach((a) => agentPool.cancel(a.id))
        addSystemMsg(`Killed ${active.length} subagent${active.length === 1 ? "" : "s"}`)
      }
      return
    }

    // Aktif modal/overlay varken arkadaki global kısayollar çalışmaz.
    // "streaming" (loading) bunu bloklamaz — Ctrl+O, Ctrl+T gibi kısayollar
    // işlem sırasında da erişilebilir olmalı.
    if (focusLayer !== "ready" && focusLayer !== "streaming") return

    // ── Ctrl+G: harici editörde yaz ───────────────────────────────────────
    if (key.ctrl && input === "g") {
      openExternalEditor()
      return
    }

    if (key.shift && key.upArrow) {
      scrollConversation(3)
      return
    }
    if (key.shift && key.downArrow) {
      scrollConversation(-3)
      return
    }
    if ((key as typeof key & { pageUp?: boolean }).pageUp) {
      pageConversation(1)
      return
    }
    if ((key as typeof key & { pageDown?: boolean }).pageDown) {
      pageConversation(-1)
      return
    }
    if (key.ctrl && input === "b") {
      setConversationOffsetRows(1_000_000)
      return
    }
    if (key.ctrl && input === "n") {
      setConversationOffsetRows(0)
      return
    }

    // ── Ctrl+T: task panel ────────────────────────────────────────────────
    if (key.ctrl && input === "t") {
      if (tasks.length > 0) togglePrimaryOverlay("taskPanel")
      return
    }

    // ── Ctrl+F: quick search ──────────────────────────────────────────────
    if (key.ctrl && input === "f") {
      togglePrimaryOverlay("quickSearch")
      return
    }

    // ── Ctrl+R: history search ──────────────────────────────────────────
    if (key.ctrl && input === "r") {
      if (commandHistory.length > 0) togglePrimaryOverlay("historySearch")
      return
    }

    // ── Ctrl+P: command palette ───────────────────────────────────────────
    if (key.ctrl && input === "p") {
      togglePrimaryOverlay("commandPalette")
      return
    }

    // ── Ctrl+V: paste image from clipboard ───────────────────────────────
    if (key.ctrl && input === "v") {
      if (loading) return
      const clip = readClipboard()
      if (clip.type === "image") {
        const att: import("@aurict/core").Attachment = {
          type:    "image",
          name:    clip.name,
          base64:  clip.base64,
          mimeType: clip.mimeType,
        }
        setAttachments(prev => [...prev, att])
        addSystemMsg(`📎 Image pasted from clipboard: ${clip.name}`)
      } else if (clip.type === "text" && clip.text) {
        setInput(prev => prev + clip.text)
      } else if (clip.type === "error") {
        addSystemMsg(`⚠ Clipboard: ${clip.message}`)
      } else {
        addSystemMsg("Clipboard is empty.")
      }
      return
    }

    // ── Ctrl+S: settings ─────────────────────────────────────────────────
    if (key.ctrl && input === "s") {
      togglePrimaryOverlay("settings")
      return
    }

    // ── Ctrl+E: edit last user message ────────────────────────────────────
    if (key.ctrl && input === "e") {
      if (loading || editingMsg) return
      // Find last user message
      const userMsgs = messages
        .map((m, i) => ({ m, i }))
        .filter(({ m }) => m.role === "user" && !m.pending)
      if (userMsgs.length === 0) return
      const last = userMsgs[userMsgs.length - 1]!
      overlay.closePrimaryOverlays()
      setEditingMsg({ id: last.m.id ?? "", content: last.m.content, msgIndex: last.i })
      return
    }

    // ── Ctrl+A: attachment ────────────────────────────────────────────────
    if (key.ctrl && input === "a") {
      togglePrimaryOverlay("attach")
      return
    }

    // ── Ctrl+O: son tool çıktısını genişlet ──────────────────────────────
    if (key.ctrl && input === "o") {
      if (!expandedContent && !btwState) {
        const latest = latestToolCallRef.current
        if (latest) {
          overlay.closePrimaryOverlays()
          setExpandedContent({ content: latest.content, toolName: latest.tool })
        }
      }
      return
    }

    // ── Ctrl+X: subagent navigation ───────────────────────────────────────
    if (key.ctrl && input === "x") {
      if (picker || permission || question || expandedContent) return
      const subSessions = SessionManager.list()
        .filter((s) => s.parentId === mainSessionId.current)
        .sort((a, b) => a.createdAt - b.createdAt)
      if (!subSessions.length) return
      overlay.closePrimaryOverlays()
      if (!viewingSubagentId) {
        setViewingSubagentId(subSessions[0]!.id)
      } else {
        const idx  = subSessions.findIndex((s) => s.id === viewingSubagentId)
        const next = subSessions[(idx + 1) % subSessions.length]!
        setViewingSubagentId(next.id)
      }
      return
    }

    // ── Tab: agent döngüsü ────────────────────────────────────────────────
    if (key.tab) {
      if (loading || picker || permission || question || expandedContent) return
      const agents = getAllSessionAgents(workdirState)
      if (agents.length < 2) return
      const idx     = agents.findIndex((a) => a.id === activeAgent)
      const nextIdx = key.shift
        ? (idx - 1 + agents.length) % agents.length
        : (idx + 1) % agents.length
      const next = agents[nextIdx]!
      setActiveAgent(next.id)
      addSystemMsg(`Agent: ${next.name}`)
      return
    }

    // ── ?: keyboard shortcuts ─────────────────────────────────────────────
    if (input === "?" && !loading && !overlayOpen) {
      setKeyboardShortcutsOpen(true)
      return
    }
  })

  // ── Setters ───────────────────────────────────────────────────────────────
  const setProvider = useCallback((p: string, m: string) => {
    setProviderState(p); setModelState(m)
    setDefault("provider", p); setDefault("model", m)
    addSystemMsg(`Provider changed: ${p} / ${m}`)
  }, [])

  const setModel = useCallback((m: string) => {
    setModelState(m)
    setDefault("model", m)
    addSystemMsg(`Model changed: ${m}`)
  }, [])

  const addSystemMsg = (content: string) => {
    setMessages((prev) => [...prev, { role: "system" as const, content, id: crypto.randomUUID() }])
  }

  // ── Permission ────────────────────────────────────────────────────────────
  const handlePermission = useCallback((decision: PermissionPromptDecision) => {
    if (!permission) return
    const response: PermissionResponse | null = typeof decision === "string" ? null : decision
    const action = response?.decision ?? decision

    if (action === "edit") {
      PermissionGate.respond(permission.id, "deny")
      setInput(permission.pattern)
      setPermissionQueue(q => q.slice(1))
      addSystemMsg("Command moved to input for editing.")
      return
    }
    if (action === "deny_abort") {
      PermissionGate.respond(permission.id, "deny")
      setPermissionQueue(q => q.slice(1))
      if (abortControllerRef.current) { abortControllerRef.current.abort(); abortControllerRef.current = null }
      addSystemMsg("Agent stopped by user")
      return
    }
    PermissionGate.respond(permission.id, response ?? (action === "allow_once" ? "allow_once" : action))
    // "allow" ve "allow_directory" kararlarını diske kaydet — session sonrası da hatırlansın
    if (action === "allow") {
      PermissionStore.approve(permission.tool, permission.pattern)
      PermissionStore.savePersisted(PERM_FILE)
    } else if (action === "allow_directory") {
      PermissionStore.approveDirectory(permission.tool, permission.pattern)
      PermissionStore.savePersisted(PERM_FILE)
    }
    setPermissionQueue(q => q.slice(1))
  }, [permission])

  // ── Question ──────────────────────────────────────────────────────────────
  const handleQuestionAnswer = useCallback((answers: QuestionAnswer[]) => {
    if (!question) return
    questionService.answer(question.id, answers)
    setQuestion(null)
  }, [question])

  const handleQuestionReject = useCallback(() => {
    if (!question) return
    questionService.reject(question.id)
    setQuestion(null)
  }, [question])

  // ── Attachment ────────────────────────────────────────────────────────────
  const handleAttachSubmit = useCallback(async (filePath: string) => {
    const trimmed = filePath.trim()
    if (!trimmed) { setAttachInput(false); setAttachPath(""); return }
    try {
      const att = await readAttachmentFromPath(trimmed)
      setAttachments((prev) => [...prev, att])
      addSystemMsg(`📎 Attached: ${att.name} (${att.mimeType})`)
    } catch (err) {
      addSystemMsg(`⚠ Attachment failed: ${err instanceof Error ? err.message : String(err)}`)
    }
    setAttachInput(false)
    setAttachPath("")
  }, [])

  // ── Command context ───────────────────────────────────────────────────────
  const buildCtx = useCallback(() => ({
    sessionId:       mainSessionId.current,
    provider, model, workdir: workdirState,
    ...(effort !== undefined ? { effort } : {}),
    skills:          skillNames,
    currentTheme:    themeName,
    isUndercover,
    coordinatorMode,
    activeAgent,
    setAgent: (id: string) => {
      setActiveAgent(id)
      const def = getSessionAgent(id, workdirState)
      addSystemMsg(`Agent: ${def.name}`)
    },
    setProvider, setModel, setEffort,
    setTheme:          (name: string) => { if (THEMES[name]) setThemeName(name) },
    setWorkdir:        (path: string) => setWorkdirState(path),
    toggleUndercover:  () => setIsUndercover((v) => !v),
    toggleCoordinator: () => setCoordinatorMode((v) => !v),
    autopilotMode,
    toggleAutopilot: () => {
      setAutopilotMode((v) => {
        const next = !v
        addSystemMsg(next ? "⚡ Autopilot ON — all permissions auto-approved" : "⚡ Autopilot OFF — manual confirmation restored")
        return next
      })
    },
    sendToBackground: () => {
      if (!loading) return
      setLoading(false); setIsStreaming(false); setActiveTool(undefined)
      addSystemMsg("Task moved to background. Use /bg to check status.")
    },
    bgTasks,
    showBgTask: (id: string) => {
      const t = bgTasks.find((b) => b.id === id)
      if (!t) return
      addSystemMsg(`[bg:${id}] ${t.status}\n${t.output ?? "(no output yet)"}`)
    },
    openBtw: (question: string) => {
      setBtwState({ question, answer: "", loading: true, frame: 0 })
      const interval = setInterval(() => setBtwState((s) => s ? { ...s, frame: s.frame + 1 } : s), 80)
      btwFrameRef.current = interval
      runAgent({
        provider, model, workdir: workdirState,
        messages: [...history.slice(-10), { role: "user", content: `[BTW] ${question}` }],
        system: "Answer this side question briefly and clearly. Be concise. Do NOT add to conversation history.",
      }).then((r) => {
        clearInterval(interval); btwFrameRef.current = null
        setBtwState((s) => s ? { ...s, answer: r.text, loading: false } : s)
      }).catch((err) => {
        clearInterval(interval); btwFrameRef.current = null
        setBtwState((s) => s ? { ...s, answer: `Error: ${err instanceof Error ? err.message : String(err)}`, loading: false } : s)
      })
    },
    showPicker:  (title: string, items: any[], onSelect: any) => setPicker({ title, items, onSelect }),
    showPrompt:  (title: string, placeholder: string, secret: boolean, onSubmit: (v: string) => void) =>
                   setPrompt({ title, placeholder, secret, onSubmit }),
    restoreSession: (msgs: Array<{ role: "user" | "assistant"; content: string }>) => {
      const coreMessages: CoreMessage[] = msgs.map((m) => ({ role: m.role, content: m.content }))
      setHistory(coreMessages)
      setMessages(msgs.map((m) => ({ role: m.role as DisplayMessage["role"], content: m.content, id: crypto.randomUUID() })))
      addSystemMsg(`Session restored — ${msgs.length} messages`)
    },
    messages,
    checkpoints,
    popCheckpoints: async (n: number) => {
      if (checkpoints.length === 0) return
      const idx = Math.max(0, checkpoints.length - n)
      const cp  = checkpoints[idx]
      if (!cp) return
      await snapshotManager.restoreToMark(cp.mark)
      setMessages(cp.messages)
      setHistory(cp.history)
      setCheckpoints((prev) => prev.slice(0, idx))
      addSystemMsg(`↩ Rolled back ${n} step${n > 1 ? "s" : ""}`)
    },
    branches: branches.map((b, i) => ({ id: b.id, name: b.name, createdAt: b.createdAt, messageCount: b.messages.length, active: i === activeBranchIdx })) as any,
    activeBranchIdx,
    createBranch: (name?: string) => {
      const newName = name ?? `branch-${branches.length}`
      const newBranch: ConvBranch = {
        id: crypto.randomUUID(), name: newName,
        messages: messages.slice(), history: history.slice(),
        tokens: { ...tokens }, createdAt: Date.now(),
      }
      setBranches((prev) => {
        const updated = [...prev]
        updated[activeBranchIdx] = { ...updated[activeBranchIdx]!, messages: messages.slice(), history: history.slice(), tokens: { ...tokens } }
        return [...updated, newBranch]
      })
      setActiveBranchIdx(branches.length)
      addSystemMsg(`⎇ Switched to branch "${newName}"`)
    },
    switchBranch: (idx: number) => {
      if (idx < 0 || idx >= branches.length || idx === activeBranchIdx) return
      setBranches((prev) => {
        const updated = [...prev]
        updated[activeBranchIdx] = { ...updated[activeBranchIdx]!, messages: messages.slice(), history: history.slice(), tokens: { ...tokens } }
        return updated
      })
      const target = branches[idx]!
      setMessages(target.messages)
      setHistory(target.history)
      setTokens(target.tokens)
      setActiveBranchIdx(idx)
      addSystemMsg(`⎇ Switched to branch "${target.name}"`)
    },
    deleteBranch: (name: string) => {
      if (name === "main") { addSystemMsg("Cannot delete main branch"); return }
      const idx = branches.findIndex((b) => b.name === name)
      if (idx === -1) { addSystemMsg(`Branch "${name}" not found`); return }
      setBranches((prev) => prev.filter((_, i) => i !== idx))
      if (activeBranchIdx >= idx) setActiveBranchIdx(Math.max(0, activeBranchIdx - 1))
      addSystemMsg(`⎇ Deleted branch "${name}"`)
    },
    watchedPaths,
    addWatch: (watchPath: string, prompt?: string) => {
      const abs = watchPath.startsWith("/") ? watchPath : `${workdirState}/${watchPath}`
      if (watchCleanupRef.current.has(abs)) { addSystemMsg(`Already watching: ${abs}`); return }
      const cleanup = fileWatcher.watch(abs, (changedFile) => {
        addSystemMsg(`👁 ${changedFile.replace(workdirState + "/", "")} changed`)
      })
      watchCleanupRef.current.set(abs, cleanup)
      setWatchedPaths((prev) => [...prev, { path: abs, ...(prompt !== undefined ? { prompt } : {}) }])
      addSystemMsg(`👁 Watching: ${abs}`)
    },
    removeWatch: (watchPath?: string) => {
      if (!watchPath) {
        watchCleanupRef.current.forEach((fn) => fn())
        watchCleanupRef.current.clear()
        setWatchedPaths([])
        addSystemMsg("👁 Stopped all watchers")
        return
      }
      const abs = watchPath.startsWith("/") ? watchPath : `${workdirState}/${watchPath}`
      watchCleanupRef.current.get(abs)?.()
      watchCleanupRef.current.delete(abs)
      setWatchedPaths((prev) => prev.filter((w) => w.path !== abs))
      addSystemMsg(`👁 Stopped watching: ${abs}`)
    },
    contextWindow: ProviderRegistry.get(provider).listModels().find((m) => m.id === model)?.contextWindow ?? 200_000,
    tokens,
    promptDiagnostics,
    promptCacheHealth,
    replayTo: async (idx: number) => {
      const cp = checkpoints[idx]
      if (!cp) return
      await snapshotManager.restoreToMark(cp.mark)
      setMessages(cp.messages)
      setHistory(cp.history)
      setCheckpoints((prev) => prev.slice(0, idx + 1))
    },
    openDesign: (brief?: string) => {
      setDesignInitialBrief(brief?.trim() || undefined)
      setDesignWizardOpen(true)
    },
  }), [provider, model, workdir, skillNames, setProvider, setModel, messages, history, tokens, promptDiagnostics, promptCacheHealth, checkpoints, branches, activeBranchIdx, watchedPaths])

  // ── Command executor ──────────────────────────────────────────────────────
  const executeCommand = useCallback((raw: string): boolean => {
    const parsed = parseSlashCommand(raw)
    if (!parsed) return false
    const cmdDef = getCommand(parsed.cmd)
    if (!cmdDef) { addSystemMsg(`Unknown command: /${parsed.cmd}  —  type /help to see all commands`); return true }
    const result  = cmdDef.handler(parsed.args, buildCtx())
    const resolve = (r: CommandResult) => applyResult(r)
    if (result instanceof Promise) result.then(resolve).catch((e) => addSystemMsg(`[error] ${e}`))
    else resolve(result)
    return true
  }, [buildCtx])

  const applyResult = (r: CommandResult) => {
    switch (r.type) {
      case "text":   addSystemMsg(r.content); break
      case "error":  setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "error" as const, content: r.message }]); break
      case "picker": setPicker({ title: r.title, items: r.items, onSelect: r.onSelect }); break
      case "prompt": setPrompt({ title: r.title, placeholder: r.placeholder, secret: r.secret, onSubmit: r.onSubmit }); break
      case "clear":
        setMessages([])
        setHistory([])
        setTokens({ input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0 })
        setContextTokens(0)
        setSessionTitle(undefined)
        isFirstMessage.current = true
        extractedRef.current   = false
        addSystemMsg("History cleared")
        break
      case "exit":   process.exit(0); break
    }
  }

  const handleCmdExecute = useCallback((cmdName: string) => {
    skipSubmitRef.current = true
    setInput("")
    executeCommand("/" + cmdName)
  }, [executeCommand])

  const handleCmdFill = useCallback((cmdName: string) => setInput("/" + cmdName + " "), [])

  // ── Message edit & rerun ──────────────────────────────────────────────────
  const handleEditRerun = useCallback((msgIndex: number, newContent: string) => {
    setEditingMsg(null)
    // Cut messages array after msgIndex (exclusive) and replace the edited user msg
    setMessages(prev => {
      const next = prev.slice(0, msgIndex)
      next.push({ ...prev[msgIndex]!, content: newContent })
      return next
    })
    // Cut history: find corresponding position — history has paired user+assistant entries
    // Safest: keep only user messages before this edit (by counting user msgs)
    const userMsgsBefore = messages.slice(0, msgIndex).filter(m => m.role === "user").length
    const historySlice = history.filter(h => h.role === "user").slice(0, userMsgsBefore)
    // Interleave: rebuild history from scratch keeping only what's before the edit point
    const newHistory: CoreMessage[] = []
    let uCount = 0
    for (const h of history) {
      if (h.role === "user") {
        if (uCount >= userMsgsBefore) break
        uCount++
      }
      newHistory.push(h)
    }
    setHistory(newHistory)
    // Rerun with the new content
    setTimeout(() => handleSubmit(newContent), 30)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, history])

  // ── Chat submit ───────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async (userInput: string) => {
    if (skipSubmitRef.current) { skipSubmitRef.current = false; return }
    let text = userInput.trim()
    if (!text) return
    setStartupBannerVisible(false)
    setScrollLocked(false)
    setConversationOffsetRows(0)
    // Kullanıcı elle mesaj gönderince auto-continue sayacını sıfırla;
    // otomatik devam mesajları kendi limitini korumalı.
    const isAutoContinueSubmit = autoContinueSubmittingRef.current
    autoContinueSubmittingRef.current = false
    if (!isAutoContinueSubmit) autoContinueRef.current.count = 0

    // @path.ext[:symbol] syntax — file attachment or symbol context injection
    // @auth.ts          → attach whole file (image) or inline code for text files
    // @auth.ts:validate → inject only that function/class body as code block
    const atRe = /@([\w./~-]+\.[a-zA-Z]{2,6})(?::(\w+))?/g
    const atMatches = [...text.matchAll(atRe)]
    const symbolContextBlocks: string[] = []
    if (atMatches.length > 0) {
      for (const m of atMatches) {
        const rawPath    = m[1]!
        const symbolName = m[2]   // may be undefined
        const fullPath   = rawPath.startsWith("~")
          ? rawPath.replace("~", process.env["HOME"] ?? "~")
          : rawPath.startsWith("/") ? rawPath : `${workdirState}/${rawPath}`

        if (symbolName) {
          // Symbol context injection — extract just the function/class body
          try {
            const extracted = await extractSymbolBody(fullPath, symbolName)
            if (extracted) {
              const ext  = rawPath.slice(rawPath.lastIndexOf(".") + 1)
              symbolContextBlocks.push(
                `[Context: @${rawPath}:${symbolName} — lines ${extracted.startLine}-${extracted.endLine}]\n\`\`\`${ext}\n${extracted.code}\n\`\`\``
              )
            }
          } catch { /* ignore */ }
        } else {
          // Whole-file attachment (existing behavior)
          try {
            const att = await readAttachmentFromPath(fullPath)
            setAttachments((prev) => [...prev, att])
          } catch { /* ignore — leave @path in message */ }
        }
      }
      // Remove all @path[:symbol] references from message text
      text = text.replace(atRe, "").replace(/\s{2,}/g, " ").trim()
    }

    // Prepend symbol context blocks to the message
    if (symbolContextBlocks.length > 0) {
      text = symbolContextBlocks.join("\n\n") + (text ? "\n\n" + text : "")
    }

    setInput("")
    clearDraft()
    if (loading) { setQueuedInput(text); return }
    if (executeCommand(text)) return

    setCommandHistory((prev) => [...prev, text])

    if (isFirstMessage.current) {
      isFirstMessage.current = false
      const words = text.replace(/[^\w\s]/g, " ").trim().split(/\s+/).filter(w => w.length > 2)
      const title = words.slice(0, 5).join(" ").slice(0, 45) || "New Session"
      setSessionTitle(title)
    }

    setStreamingError(null)
    setTurnSkillNames([])
    const startTime = Date.now()
    const now       = Date.now()
    const controller = new AbortController()
    abortControllerRef.current = controller
    setLoading(true)
    setIsStreaming(true)
    turnHadToolRef.current     = false
    turnAssistantIdRef.current = null

    const userMsg: CoreMessage = { role: "user", content: text }
    setMessages((prev) => [...prev, { role: "user", content: text, timestamp: now, id: crypto.randomUUID() }])
    const newHistory = [...historyRef.current, userMsg]
    setMessages((prev) => [...prev, { role: "assistant", content: "", pending: true, timestamp: Date.now(), id: crypto.randomUUID() }])

    try {
      const agentDef = getSessionAgent(activeAgent, workdirState)
      const effectiveSystem = [
        agentDef.system || null,
        coordinatorMode ? getCoordinatorSystemPrompt() : null,
        coordinatorMode ? getCoordinatorContext(agentPool.active) : null,
        system,
      ].filter(Boolean).join("\n\n---\n\n")

      // Adaptive throttle flush — text + reasoning birlikte flush edilir
      const flushStream = () => {
        streamTimerRef.current = null
        // Araç çağrısı sonrası streaming: StreamingView'de gösterme — cümle bölünmesini önle.
        // Metin streamTextRef'te birikmeye devam eder; onFinish stableAssistantId ile
        // pre-tool mesajını tam metinle (pre+post araç) güncelleyecek.
        if (turnAssistantIdRef.current) return
        if (streamTextRef.current)   setStreamingText(streamTextRef.current)
        if (streamReasonRef.current) setStreamingReason(streamReasonRef.current)
      }

      const flushAssistantSegment = (textSegment: string, reasonSegment: string) => {
        if (!textSegment && !reasonSegment) return
        setMessages((prev) => {
          const next = [...prev]
          const last = next[next.length - 1]
          const segment = {
            content: textSegment,
            pending: false,
            ...(reasonSegment ? { reasoningContent: reasonSegment } : {}),
          }
          if (last?.role === "assistant" && last.pending) {
            next[next.length - 1] = { ...last, ...segment }
          } else {
            next.push({
              id: crypto.randomUUID(),
              role: "assistant" as const,
              timestamp: Date.now(),
              ...segment,
            })
          }
          return next
        })
      }

      await runAgent({
        provider, model, workdir: workdirState,
        sessionId: mainSessionId.current,
        ...(effectiveSystem ? { system: effectiveSystem } : {}),
        undercover: isUndercover || (undercover ?? false),
        ...(effort !== undefined ? { effort } : {}),
        ...(agentDef.allowedTools ? { toolsOverride: agentDef.allowedTools } : {}),
        messages: newHistory,
        signal: controller.signal,
        ...(attachments.length > 0 ? { attachments } : {}),
        onText: (delta, isReasoning) => {
          const now = Date.now()
          const dt  = now - lastTokenTimeRef.current
          if (dt > 0 && dt < 3_000) tokenRateRef.current = 0.8 * tokenRateRef.current + 0.2 * (1_000 / dt)
          lastTokenTimeRef.current = now

          if (isReasoning) streamReasonRef.current += delta
          else             streamTextRef.current   += delta

          // Her delta'da flush gecikmesini rate'e göre yeniden hesapla.
          // Scroll lock aktifken 2s gecikme — terminal yeniden çizilmez.
          const rate = tokenRateRef.current
          const ms   = scrollLockedRef.current ? 2000 : (rate > 40 ? 16 : rate > 15 ? 32 : rate > 5 ? 80 : 200)
          if (streamTimerRef.current) clearTimeout(streamTimerRef.current)
          streamTimerRef.current = setTimeout(flushStream, ms)
        },
        onChunk: (chunk: string) => {
          setMessages((prev) => {
            const stableId = turnAssistantIdRef.current
            if (stableId) {
              const idx = prev.findIndex(m => m.id === stableId)
              if (idx !== -1) {
                const msg = prev[idx]!
                if (msg.blocks) {
                  for (let i = msg.blocks.length - 1; i >= 0; i--) {
                    const b = msg.blocks[i]!
                    if (b.type === "tool" && b.pending) {
                      const combined = (b.resultContent ?? "") + chunk
                      const capped = combined.length > 50_000 ? combined.slice(-50_000) : combined
                      const next = [...prev]
                      const newBlocks = [...msg.blocks]
                      newBlocks[i] = { ...b, resultContent: capped }
                      next[idx] = { ...msg, blocks: newBlocks }
                      return next
                    }
                  }
                }
              }
            }
            // Fallback: eski tool_call mesaj yaklaşımı
            const lastPendingIdx = prev.reduceRight<number>(
              (found, m, i) => found !== -1 ? found : (m.role === "tool_call" && m.pending) ? i : -1,
              -1,
            )
            if (lastPendingIdx === -1) return prev
            const next = [...prev]
            const msg  = next[lastPendingIdx]!
            const combined = (msg.resultContent ?? "") + chunk
            const capped = combined.length > 50_000 ? combined.slice(-50_000) : combined
            next[lastPendingIdx] = { ...msg, resultContent: capped }
            return next
          })
        },
        onToolCall: (tc) => {
          if (streamTimerRef.current) { clearTimeout(streamTimerRef.current); streamTimerRef.current = null }
          turnHadToolRef.current = true
          const textBefore   = streamTextRef.current
          const reasonBefore = streamReasonRef.current
          streamTextRef.current   = ""
          streamReasonRef.current = ""
          setStreamingText(null)
          setStreamingReason(null)
          setActiveTool(tc.tool)
          latestToolCallRef.current = { id: tc.id, tool: tc.tool, content: JSON.stringify(tc.args, null, 2) }

          const toolBlock: AssistantContentBlock = { type: "tool", id: tc.id ?? crypto.randomUUID(), tool: tc.tool, args: JSON.stringify(tc.args, null, 2), pending: true }

          if (!turnAssistantIdRef.current) {
            // İlk tool: tek bir blocks assistant mesajı oluştur
            const assistantId = crypto.randomUUID()
            turnAssistantIdRef.current = assistantId
            setMessages((prev) => {
              const next = [...prev]
              // Boş pending placeholder'ı kaldır
              const last = next[next.length - 1]
              if (last?.role === "assistant" && last.pending && !last.content && !last.reasoningContent && !last.blocks) {
                next.pop()
              }
              const blocks: AssistantContentBlock[] = []
              if (textBefore || reasonBefore) {
                blocks.push({ type: "text", content: textBefore, ...(reasonBefore ? { reasoningContent: reasonBefore } : {}) })
              }
              blocks.push(toolBlock)
              next.push({ id: assistantId, role: "assistant" as const, content: "", blocks, pending: true, timestamp: Date.now() })
              return next
            })
          } else {
            // Sonraki tool: mevcut blocks mesajına metin + tool bloğu ekle
            const stableId = turnAssistantIdRef.current
            setMessages((prev) => {
              const idx = prev.findIndex(m => m.id === stableId)
              if (idx === -1) return prev
              const existing = prev[idx]!
              const currentBlocks = existing.blocks ?? []
              const newBlocks: AssistantContentBlock[] = [...currentBlocks]
              if (textBefore || reasonBefore) {
                newBlocks.push({ type: "text", content: textBefore, ...(reasonBefore ? { reasoningContent: reasonBefore } : {}) })
              }
              newBlocks.push(toolBlock)
              const next = [...prev]
              next[idx] = { ...existing, blocks: newBlocks }
              return next
            })
          }
        },
        onStepFinish: () => {
          const stableId = turnAssistantIdRef.current
          setMessages((prev) => {
            if (stableId) {
              const idx = prev.findIndex(m => m.id === stableId)
              if (idx !== -1 && prev[idx]?.blocks) {
                const msg = prev[idx]!
                const newBlocks = msg.blocks!.map(b => b.type === "tool" && b.pending ? { ...b, pending: false } : b)
                const next = [...prev]
                next[idx] = { ...msg, blocks: newBlocks }
                return next
              }
            }
            return prev.map((m) => m.role === "tool_call" && m.pending ? { ...m, pending: false } : m)
          })
          setActiveTool(undefined)
          const mark  = snapshotManager.mark()
          const label = `step ${checkpoints.length + 1}`
          // Checkpoint'te büyük tool resultları kırp (RAM koruması).
          const MAX_CP_RESULT = 10_000
          const cpMessages = messages.slice().map(m => {
            if (m.blocks) {
              const trimmedBlocks = m.blocks.map(b => {
                if (b.type === "tool" && b.resultContent && b.resultContent.length > MAX_CP_RESULT)
                  return { ...b, resultContent: b.resultContent.slice(0, MAX_CP_RESULT) + "\n[truncated in checkpoint]" }
                return b
              })
              return { ...m, blocks: trimmedBlocks }
            }
            if (m.resultContent && m.resultContent.length > MAX_CP_RESULT)
              return { ...m, resultContent: m.resultContent.slice(0, MAX_CP_RESULT) + "\n[truncated in checkpoint]" }
            return m
          })
          setCheckpoints((prev) => [
            ...prev.slice(-(MAX_CHECKPOINTS - 1)),
            { mark, messages: cpMessages, history: history.slice(), label },
          ])
        },
        onToolResult: (tr) => {
          setMessages((prev) => {
            let parsedResult = tr.result
            if (typeof parsedResult === "object") parsedResult = JSON.stringify(parsedResult, null, 2)
            const MAX_DISPLAY = 50_000
            const displayResult = parsedResult.length > MAX_DISPLAY
              ? parsedResult.slice(0, MAX_DISPLAY) + `\n\n[... ${(parsedResult.length - MAX_DISPLAY).toLocaleString()} chars truncated]`
              : parsedResult

            // Blocks yaklaşımı: blocks içindeki tool bloğunu güncelle
            const stableId = turnAssistantIdRef.current
            if (stableId) {
              const idx = prev.findIndex(m => m.id === stableId)
              if (idx !== -1) {
                const msg = prev[idx]!
                if (msg.blocks) {
                  const blockIdx = msg.blocks.findIndex(b => b.type === "tool" && b.id === tr.id)
                  if (blockIdx !== -1) {
                    const b = msg.blocks[blockIdx]!
                    if (b.type === "tool") {
                      if (b.tool && parsedResult) latestToolCallRef.current = { id: tr.id, tool: b.tool, content: parsedResult }
                      const next = [...prev]
                      const newBlocks = [...msg.blocks]
                      newBlocks[blockIdx] = { ...b, pending: false, resultContent: displayResult, durationMs: tr.durationMs }
                      next[idx] = { ...msg, blocks: newBlocks }
                      return next
                    }
                  }
                }
              }
            }

            // Fallback: eski tool_call mesaj yaklaşımı
            const next = [...prev]
            const callIndex = next.findIndex((m) => m.role === "tool_call" && m.id === tr.id)
            if (callIndex !== -1) {
              const old = next[callIndex]
              if (old) {
                next[callIndex] = { ...old, pending: false, resultContent: displayResult, durationMs: tr.durationMs }
                if (old.tool && parsedResult) latestToolCallRef.current = { id: tr.id, tool: old.tool ?? "tool", content: parsedResult }
              }
            } else {
              next.push({ id: crypto.randomUUID(), role: "tool_result" as const, content: displayResult, pending: false })
            }
            return next
          })
        },
        onCompaction: () => {
          setWasCompacted(true)
          setTimeout(() => setWasCompacted(false), 8000)
          // Allow end-of-session extraction to run again after compaction
          extractedRef.current = false
        },
        onSkillsActivated: (skills) => {
          if (skills.length === 0) return
          setTurnSkillNames(skills.map((skill) => skill.id))
        },
        onPromptDiagnostics: setPromptDiagnostics,
        continuation: {
          getTasks: () => taskManager.getTasks(),
          previousContinuations: autoContinueRef.current.count,
          maxContinuations: 5,
          maxTaskContinuations: 15,
        },
        onPromptCacheHealth: setPromptCacheHealth,
        onFinish: ({ tokens: t, text: finalText, newMessages, continuation, completionGate }) => {
          if (streamTimerRef.current) { clearTimeout(streamTimerRef.current); streamTimerRef.current = null }
          const finalSegmentText = turnHadToolRef.current ? streamTextRef.current : finalText
          const finalReason = streamReasonRef.current
          const stableAssistantId = turnAssistantIdRef.current
          streamTextRef.current   = ""
          streamReasonRef.current = ""
          setStreamingText(null)
          setStreamingReason(null)
          setTokens((prev) => ({
            input:     prev.input     + t.input,
            output:    prev.output    + t.output,
            cacheRead: prev.cacheRead + t.cacheRead,
            cacheWrite:prev.cacheWrite+ t.cacheWrite,
            reasoning: prev.reasoning + t.reasoning,
          }))
          // context window usage = all input tokens (fresh + cache reads + cache writes)
          setContextTokens(t.input + t.cacheRead + t.cacheWrite)
          const duration = Date.now() - startTime
          if (duration > 15_000) notifyTaskDone(text, duration)
          if (!extractedRef.current) {
            extractedRef.current = true
            extractAndStoreMemories(provider, model, [...newHistory, ...newMessages], workdirState)
              .then(() => { try { setMemoryCount(memoryStore.list(workdirState).length) } catch { /* ignore */ } })
              .catch(() => {})
          }
          const updatedHistory = [...newHistory, ...newMessages] as CoreMessage[]
          historyRef.current = updatedHistory
          setHistory(updatedHistory)
          setMessages((prev) => {
            const next = prev.map(m => m.pending ? { ...m, pending: false } : m)
            const reasonSpread = finalReason ? { reasoningContent: finalReason } : {}

            if (stableAssistantId) {
              const idx = next.findIndex(m => m.id === stableAssistantId)
              if (idx !== -1) {
                const existing = next[idx]!
                if (existing.blocks) {
                  // Blocks yaklaşımı: post-tool metni aynı mesaja yeni text bloğu olarak ekle
                  const newBlocks = [...existing.blocks]
                  if (finalSegmentText) {
                    newBlocks.push({ type: "text", content: finalSegmentText, ...reasonSpread })
                  }
                  next[idx] = { ...existing, pending: false, blocks: newBlocks }
                  return next
                }
                // Fallback: eski yaklaşım (blocks yoksa)
                next[idx] = { ...existing, role: "assistant" as const, pending: false, ...reasonSpread }
                if (finalSegmentText) {
                  next.push({ id: crypto.randomUUID(), role: "assistant" as const, content: finalSegmentText, pending: false, timestamp: Date.now(), ...reasonSpread })
                }
                return next
              }
            }

            // Araç çağrısı olmayan turn: mevcut davranış
            const last = next[next.length - 1]
            if ((finalSegmentText || finalReason) && last?.role !== "assistant") {
              next.push({ id: crypto.randomUUID(), role: "assistant", content: finalSegmentText, pending: false, ...reasonSpread })
            } else if (last?.role === "assistant") {
              next[next.length - 1] = { ...last, content: finalSegmentText, pending: false, ...reasonSpread }
            }
            return next
          })

          // Core continuation decision is the single source of truth.
          if (continuation?.shouldContinue) {
            autoContinueRef.current = { needed: true, count: continuation.nextContinuationCount }
          } else if (completionGate?.shouldAutoContinue && !completionGate.shadowOnly) {
            autoContinueRef.current = { needed: true, count: autoContinueRef.current.count + 1 }
          } else {
            autoContinueRef.current.needed = false
          }
        },
      })
    } catch (err) {
      if (streamTimerRef.current) { clearTimeout(streamTimerRef.current); streamTimerRef.current = null }
      const partialText = streamTextRef.current
      const partialReason = streamReasonRef.current
      streamTextRef.current   = ""
      streamReasonRef.current = ""
      const errMsg = err instanceof Error ? err.message : String(err)
      setStreamingError(errMsg)
      setStreamingText(null)
      setStreamingReason(null)
      setMessages((prev) => {
        const next = prev.map(m => m.pending ? { ...m, pending: false } : m)
        if (partialText || partialReason) {
          const last = next[next.length - 1]
          const segment = {
            content: partialText,
            pending: false,
            ...(partialReason ? { reasoningContent: partialReason } : {}),
          }
          if (last?.role === "assistant" && !last.content && !last.reasoningContent) {
            next[next.length - 1] = { ...last, ...segment }
          } else {
            next.push({ id: crypto.randomUUID(), role: "assistant", timestamp: Date.now(), ...segment })
          }
        }
        next.push({ id: crypto.randomUUID(), role: "error", content: errMsg })
        return next
      })
      if (Date.now() - startTime > 15_000) notifyError(text)
      if (!extractedRef.current && newHistory.length >= 4) {
        extractedRef.current = true
        extractAndStoreMemories(provider, model, newHistory, workdirState).catch(() => {})
      }
    } finally {
      setLoading(false)
      setIsStreaming(false)
          setActiveTool(undefined)
          turnHadToolRef.current = false
          setTurnSkillNames([])
      abortControllerRef.current = null
      setAttachments([])
      setQueuedInput((q) => {
        const autoMsg = q === undefined && autoContinueRef.current.needed ? AUTO_CONTINUE_PROMPT : undefined
        autoContinueRef.current.needed = false
        const toSend = q ?? autoMsg
        if (toSend) {
          if (autoMsg) autoContinueSubmittingRef.current = true
          setTimeout(() => handleSubmit(toSend), 80)
        }
        return undefined
      })
    }
  }, [loading, history, provider, model, workdir, system, executeCommand])

  // ── Render ────────────────────────────────────────────────────────────────
  const activeTheme = THEMES[themeName] ?? THEMES[DEFAULT_THEME]!

  const subSessions = viewingSubagentId
    ? SessionManager.list().filter((s) => s.parentId === mainSessionId.current).sort((a, b) => a.createdAt - b.createdAt)
    : []
  const subIdx = subSessions.findIndex((s) => s.id === viewingSubagentId)

  // Herhangi bir overlay/modal açıkken ChatInput'un useInput'u devre dışı
  // kalmalı; aksi halde tuşlar (özellikle Enter ve yazılan metin) hem modal'a
  return (
    <AlternateScreen>
    <TerminalSizeContext.Provider value={{ columns: termCols, rows: termRows }}>
    <ThemeContext.Provider value={activeTheme}>
    <KeybindingsProvider initialContext={keybindingContext}>
    <Box flexDirection="row" width="100%" height={termRows}>

      {/* ── Sol: ana içerik ─────────────────────────────────────────────── */}
      <FullscreenLayout
        rows={termRows}
        onScrollableHeight={(rows) => setMeasuredViewportRows(Math.max(6, rows))}

        header={<>
          {/* Subagent görünümü */}
          {viewingSubagentId && (
            <SubagentView
              sessionId={viewingSubagentId}
              parentSessionId={mainSessionId.current}
              siblingIndex={subIdx + 1}
              siblingCount={subSessions.length}
              onClose={() => setViewingSubagentId(null)}
              onPrev={() => { const prev = subSessions[(subIdx - 1 + subSessions.length) % subSessions.length]; if (prev) setViewingSubagentId(prev.id) }}
              onNext={() => { const next = subSessions[(subIdx + 1) % subSessions.length]; if (next) setViewingSubagentId(next.id) }}
            />
          )}
          {/* Startup banner */}
          {showStartupBanner && (
            <StartupBanner version={`v${CURRENT_VERSION}`} provider={provider} model={model} workdir={workdir} cols={termCols} rows={termRows} />
          )}
          {/* Update notification */}
          {updateInfo && !updateDismissed && (
            <Box paddingX={2} marginBottom={1}>
              <Text color="#f59e0b">◆ </Text>
              <Text color="#fbbf24">Update available: </Text>
              <Text color="#94a3b8">v{updateInfo.current}</Text>
              <Text color="#64748b"> → </Text>
              <Text color="#34d399" bold>v{updateInfo.latest}  </Text>
              <Text color="#64748b">npm install -g aurict</Text>
              <Text color="#475569">  (esc to dismiss)</Text>
            </Box>
          )}
          {/* Session title */}
          {!viewingSubagentId && sessionTitle && history.length > 0 && (
            <Box paddingX={2} marginBottom={1}>
              <Text color={activeTheme.textDim}>◈ </Text>
              <Text color={activeTheme.textSecondary} italic>{sessionTitle}</Text>
            </Box>
          )}
        </>}

        scrollable={<>
          {/* Konuşma viewport'u */}
          {!viewingSubagentId && (
            <ConversationViewport
              height={measuredViewportRows}
              width={Math.max(20, termCols - 9)}
              messages={messages}
              loading={loading}
              streamingText={streamingText}
              streamingReason={streamingReason}
              streamingError={streamingError}
              scrollLocked={scrollLocked}
              offsetRowsFromBottom={conversationOffsetRows}
              {...(unseenCount > 0 ? { unseenCount } : {})}
              {...(activeTool !== undefined ? { activeTool } : {})}
              onExpandTool={(content, toolName) => setExpandedContent({ content, toolName })}
              onExpandThinking={(content) => setExpandedContent({ content, toolName: "∴ thinking" })}
            />
          )}
        </>}

        overlay={<>
        {keyboardShortcutsOpen && (
          <KeyboardShortcuts onClose={() => setKeyboardShortcutsOpen(false)} />
        )}

        {historySearchOpen && (
          <HistorySearch
            history={commandHistory}
            onClose={() => setHistorySearchOpen(false)}
            onSelect={(text) => {
              setHistorySearchOpen(false)
              setInput(text)
            }}
          />
        )}

        {quickSearchOpen && (
          <QuickSearch
            onClose={() => setQuickSearchOpen(false)}
            onSelect={(_sessionId, msgs) => {
              setQuickSearchOpen(false)
              const coreMessages: CoreMessage[] = msgs.map(m => ({ role: m.role, content: m.content }))
              setHistory(coreMessages)
              setMessages(msgs.map(m => ({ role: m.role as DisplayMessage["role"], content: m.content, id: crypto.randomUUID() })))
              addSystemMsg(`Session loaded — ${msgs.length} messages`)
            }}
          />
        )}

        {cmdPaletteOpen && (
          <CommandPalette
            commands={allCommands()}
            recentCommands={recentCmds}
            onClose={() => setCmdPaletteOpen(false)}
            onSelect={(cmd, args, action) => {
              setCmdPaletteOpen(false)
              setRecentCmds(prev => [cmd.name, ...prev.filter(n => n !== cmd.name)].slice(0, 10))
              const raw = `/${cmd.name}${args ? ` ${args}` : ""}`
              if (action === "run") {
                setInput("")
                executeCommand(raw)
              } else {
                setInput(raw)
              }
            }}
          />
        )}

        {settingsOpen && (
          <SettingsPanel
            provider={provider}
            model={model}
            currentTheme={themeName}
            workdir={workdirState}
            onTheme={(name) => { if (THEMES[name]) setThemeName(name) }}
            onClose={() => setSettingsOpen(false)}
          />
        )}

        {designWizardOpen && (
          <DesignWizard
            workdir={workdirState}
            initialBrief={designInitialBrief}
            onClose={() => {
              setDesignWizardOpen(false)
              setDesignInitialBrief(undefined)
            }}
            onLaunch={(result: DesignWizardResult) => {
              setDesignWizardOpen(false)
              setDesignInitialBrief(undefined)
              recordSystemUsed(result.systemId)
              recordSkillUsed(result.skillId)
              const slug   = slugify(result.brief)
              const prompt = buildDesignPrompt({
                brief:      result.brief,
                systemId:   result.systemId,
                skillId:    result.skillId,
                workdir:    workdirState,
                outputSlug: slug,
              })
              void handleSubmit(prompt)
            }}
          />
        )}

        {planRequest && (
          <PlanApprovalModal
            request={planRequest}
            onDecide={(approvedSteps) => {
              const id = planRequest.id
              setPlanRequest(null)
              if (approvedSteps === null) {
                PlanGate.respond(id, { type: "rejected" })
              } else {
                PlanGate.respond(id, { type: "approved", approvedSteps })
              }
            }}
          />
        )}

        {editingMsg && (
          <MessageEditPanel
            original={editingMsg.content}
            onCancel={() => setEditingMsg(null)}
            onSubmit={(newText) => handleEditRerun(editingMsg.msgIndex, newText)}
          />
        )}

        {picker && (
          <Picker
            title={picker.title}
            items={picker.items}
            onSelect={(item) => { const onSel = picker.onSelect; setPicker(null); setTimeout(() => onSel(item), 10) }}
            onCancel={() => setPicker(null)}
          />
        )}

        {prompt && (
          <PromptInput
            title={prompt.title}
            placeholder={prompt.placeholder}
            secret={prompt.secret}
            onSubmit={(v) => { const fn = prompt.onSubmit; setPrompt(null); fn(v) }}
            onCancel={() => setPrompt(null)}
          />
        )}

        <CommandSuggest
          filter={cmdFilter ?? ""}
          commands={allCommands()}
          isActive={cmdFilter !== null}
          onExecute={handleCmdExecute}
          onFill={handleCmdFill}
        />

        {mentionFilter !== null && (
          <FileMention
            filter={mentionFilter}
            workdir={workdirState}
            isActive={true}
            onSelect={(path) => setInput((prev) => prev.replace(/@([\w./~-]*)$/, `@${path}`))}
          />
        )}

        {question && (
          <QuestionPrompt request={question} onAnswer={handleQuestionAnswer} onReject={handleQuestionReject} />
        )}

        {attachInput && (
          <Box borderStyle="round" borderColor="yellow" paddingX={1}>
            <Text color="yellow">📎 File path: </Text>
            <Text>{attachPath}</Text>
            <Text color="gray"> (Enter: attach  Esc: cancel)</Text>
          </Box>
        )}

        {attachments.length > 0 && !attachInput && (
          <Box>
            <Text color="cyan">📎 {attachments.length} dosya: {attachments.map(a => a.name).join(", ")}</Text>
          </Box>
        )}

        {expandedContent && (
          <ExpandableOutput
            content={expandedContent.content}
            toolName={expandedContent.toolName}
            onClose={() => setExpandedContent(null)}
          />
        )}

        {btwState && (
          <BtwPanel
            question={btwState.question}
            answer={btwState.answer}
            loading={btwState.loading}
            frame={btwState.frame}
            onClose={() => { setBtwState(null); if (btwFrameRef.current) { clearInterval(btwFrameRef.current); btwFrameRef.current = null } }}
          />
        )}

        </>}

        bottom={<>
        {/* Aktif subagent satırları — bottom'da olursa FullscreenLayout scrollable'ı doğru ölçer */}
        <AgentStatus
          viewingSessionId={viewingSubagentId}
          onViewAgent={setViewingSubagentId}
        />
        {/* Input alanı */}
        <Box flexDirection="row" alignItems="flex-end">
          {permission
            ? (
              <Box flexDirection="column" width="100%">
                <PermissionPrompt request={permission} onDecide={handlePermission} />
                {permissionQueue.length > 1 && (
                  <Box paddingX={2}>
                    <Text color={activeTheme.textDim} dimColor>
                      +{permissionQueue.length - 1} more permission{permissionQueue.length - 1 === 1 ? "" : "s"} queued
                    </Text>
                  </Box>
                )}
              </Box>
            )
            : !picker && !question && !attachInput && !expandedContent && !overlayOpen && (
              <ChatInput
                value={input}
                onChange={setInput}
                onSubmit={handleSubmit}
                disabled={loading}
                history={commandHistory}
                onPasteTruncated={(orig, trunc) =>
                  addSystemMsg(`Paste truncated: ${orig.toLocaleString()} → ${trunc.toLocaleString()} chars`)
                }
                {...(queuedInput !== undefined ? { queued: queuedInput } : {})}
              />
            )
          }
        </Box>

        <StatusBar
          provider={provider}
          model={model}
          tokens={tokens}
          contextTokens={contextTokens}
          workdir={workdirState}
          skills={skillNames}
          turnSkills={turnSkillNames}
          isUndercover={isUndercover}
          coordinatorMode={coordinatorMode}
          wasCompacted={wasCompacted}
          activeAgent={activeAgent}
          agentColor={getSessionAgent(activeAgent, workdirState).color}
          bgTaskCount={bgTasks.filter(t => t.status === "running").length || undefined}
          taskCount={tasks.length || undefined}
          taskSummary={tasks.length > 0 ? taskSummary : undefined}
          taskPanelOpen={taskPanelOpen}
          localServer={localServer}
          sandboxBackend={sandboxBackend}
          effort={effort}
          autopilotMode={autopilotMode}
          cols={termCols}
          activeAgentCount={activeAgentCount > 0 ? activeAgentCount : undefined}
          hasBtwNote={btwState !== null}
          scrollLocked={scrollLocked}
          {...(branch !== undefined ? { branch } : {})}
          {...(() => {
            try {
              const cw = ProviderRegistry.get(provider).listModels().find((m) => m.id === model)?.contextWindow
              return cw !== undefined ? { contextWindow: cw } : {}
            } catch { return {} }
          })()}
        />
        </>}
      />

      {/* ── Sağ: Floating Task Panel (Ctrl+T ile açılır) ────────────────── */}
      {taskPanelOpen && tasks.length > 0 && !viewingSubagentId && (
        <TaskFloatingPanel tasks={tasks} onClose={() => setTaskPanelOpen(false)} />
      )}

    </Box>
    </KeybindingsProvider>
    </ThemeContext.Provider>
    </TerminalSizeContext.Provider>
    </AlternateScreen>
  )
}
