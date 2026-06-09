import React, { useState, useCallback, useEffect, useRef, useMemo } from "react"
import crypto from "node:crypto"
import { Box, Text, useInput, useApp, Static } from "ink"
import {
  runAgent,
  ProviderRegistry,
  SessionManager,
  ExecutorEvents,
  PermissionGate,
  getSkillsForProject,
  agentPool,
  questionService,
  readAttachmentFromPath,
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
} from "@omnicod/core"
import type { PermissionRequest, QuestionRequest, QuestionAnswer, Attachment, Task, CoreMessage, DependencyChange, PlanRequest } from "@omnicod/core"

import { parseSlashCommand, getCommand, allCommands } from "../commands/registry.js"
import { Buddy, awardMessageXP } from "./Buddy.js"
import type { CommandResult, PickerItem } from "../commands/types.js"
import { ThemeContext, THEMES, DEFAULT_THEME } from "../utils/theme.js"
import { KeybindingsProvider } from "../keybindings/index.js"

import { Message, type DisplayMessage } from "./Message.js"
import { StreamingView }    from "./StreamingView.js"
import { TaskFloatingPanel } from "./TaskFloatingPanel.js"
import { ChatInput }         from "./ChatInput.js"
import { PermissionPrompt }  from "./PermissionPrompt.js"
import { QuestionPrompt }    from "./QuestionPrompt.js"
import { Picker }            from "./Picker.js"
import { PromptInput }       from "./PromptInput.js"
import { StatusBar }         from "./StatusBar.js"
import { CommandSuggest }    from "./CommandSuggest.js"
import { StartupBanner }     from "./StartupBanner.js"
import { Spinner }           from "./Spinner.js"
import { AgentStatus }       from "./AgentStatus.js"
import { SubagentView }      from "./SubagentView.js"
import { ExpandableOutput }  from "./ExpandableOutput.js"
import { BtwPanel }          from "./BtwPanel.js"
import { QuickSearch }       from "./QuickSearch.js"
import { CommandPalette }    from "./CommandPalette.js"
import { MessageEditPanel }  from "./MessageEditPanel.js"
import { PlanApprovalModal } from "./PlanApprovalModal.js"
import { SettingsPanel }     from "./SettingsPanel.js"
import { DesignWizard }      from "./DesignWizard.js"
import type { DesignWizardResult } from "./DesignWizard.js"
import { readClipboard }     from "../util/clipboard.js"
import { useMouseEvents }    from "./mouse.js"
import { buildDesignPrompt, recordSystemUsed, recordSkillUsed, slugify } from "@omnicod/core"
import { saveDraft, loadDraft, clearDraft, hasPendingCrashReport, writeCrashReport } from "../util/draft.js"

interface Props {
  initialProvider: string
  initialModel:    string
  workdir:         string
  system?:         string
  undercover?:     boolean
}

export function App({ initialProvider, initialModel, workdir, system, undercover }: Props) {
  const { exit } = useApp()

  const [provider,   setProviderState] = useState(initialProvider)
  const [model,      setModelState]    = useState(initialModel)
  const [effort,     setEffort]        = useState<number | undefined>(undefined)
  const [termCols,   setTermCols]      = useState(() => process.stdout.columns ?? 80)
  const [messages,   setMessages]      = useState<DisplayMessage[]>([])
  const [input,      setInput]         = useState("")
  const [loading,    setLoading]       = useState(false)
  const [permission, setPermission]    = useState<PermissionRequest | null>(null)
  const [question,   setQuestion]      = useState<QuestionRequest | null>(null)
  const [attachments, setAttachments]  = useState<Attachment[]>([])
  const [attachInput, setAttachInput]  = useState(false)
  const [attachPath,  setAttachPath]   = useState("")
  const [picker,     setPicker]        = useState<{ title: string; items: PickerItem[]; onSelect: (i: PickerItem) => void } | null>(null)
  const [prompt,     setPrompt]        = useState<{ title: string; placeholder: string | undefined; secret: boolean | undefined; onSubmit: (v: string) => void } | null>(null)
  const [tokens,     setTokens]        = useState({ input: 0, output: 0 })
  const [history,    setHistory]       = useState<CoreMessage[]>([])
  const [skillNames, setSkillNames]    = useState<string[]>([])
  const [tasks,      setTasks]         = useState<Task[]>([])
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [isStreaming,    setIsStreaming]     = useState(false)

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
  const [expandedContent,  setExpandedContent]  = useState<{ content: string; toolName: string } | null>(null)
  const [btwState,         setBtwState]         = useState<{ question: string; answer: string; loading: boolean; frame: number } | null>(null)
  const [branch,           setBranch]           = useState<string | undefined>(undefined)
  const [wasCompacted,     setWasCompacted]     = useState(false)
  const [contextTokens,    setContextTokens]    = useState(0)
  const [memoryCount,      setMemoryCount]      = useState(0)
  const [viewingSubagentId, setViewingSubagentId] = useState<string | null>(null)
  const [bgTasks,           setBgTasks]          = useState<Array<{ id: string; prompt: string; startedAt: number; status: "running"|"done"|"error"; output?: string }>>([])
  const bgControllersRef = useRef<Map<string, AbortController>>(new Map())

  // Floating Task Panel
  const [taskPanelOpen, setTaskPanelOpen] = useState(false)

  // Autopilot mode — tüm permission'ları otomatik onayla
  const [autopilotMode, setAutopilotMode] = useState(false)
  const autopilotRef = useRef(false)
  useEffect(() => { autopilotRef.current = autopilotMode }, [autopilotMode])

  // Mouse tracking is only active when an overlay (Picker/PermissionPrompt/QuestionPrompt)
  // is open. This lets the terminal emulator handle native scroll (Picker navigation
  // works via arrow-key injection below) while keeping scrollback free during streaming.
  const mouseTrackingActive = picker !== null || permission !== null || question !== null

  useMouseEvents((e) => {
    if (e.type !== "scroll") return
    // Inject synthetic arrow keys so Picker responds to mouse wheel
    if (e.button === "scroll-up")   process.stdin.emit("data", "\x1b[A")
    if (e.button === "scroll-down") process.stdin.emit("data", "\x1b[B")
  }, mouseTrackingActive)

  // Quick Search (Ctrl+F)
  const [quickSearchOpen, setQuickSearchOpen] = useState(false)

  // Command Palette (Ctrl+P)
  const [cmdPaletteOpen,  setCmdPaletteOpen]  = useState(false)
  const [recentCmds,      setRecentCmds]      = useState<string[]>([])

  // Message Edit (Ctrl+E)
  const [editingMsg, setEditingMsg] = useState<{ id: string; content: string; msgIndex: number } | null>(null)

  // Plan Approval
  const [planRequest, setPlanRequest] = useState<PlanRequest | null>(null)

  // Settings Panel
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Design Wizard
  const [designWizardOpen, setDesignWizardOpen] = useState(false)

  // Draft recovery
  const [draftRecovered, setDraftRecovered] = useState(false)
  const draftTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Watch Mode
  const [watchedPaths, setWatchedPaths] = useState<Array<{ path: string; prompt?: string }>>([])
  const watchCleanupRef = useRef<Map<string, () => void>>(new Map())

  // Checkpoints
  interface Checkpoint { mark: number; messages: DisplayMessage[]; history: CoreMessage[]; label: string }
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([])
  const MAX_CHECKPOINTS = 20

  // Conversation Branches
  interface ConvBranch { id: string; name: string; messages: DisplayMessage[]; history: CoreMessage[]; tokens: { input: number; output: number }; createdAt: number }
  const [branches,        setBranches]        = useState<ConvBranch[]>([{ id: "main", name: "main", messages: [], history: [], tokens: { input: 0, output: 0 }, createdAt: Date.now() }])
  const [activeBranchIdx, setActiveBranchIdx] = useState(0)

  const mainSessionId   = useRef<string>(crypto.randomUUID())
  const extractedRef    = useRef(false)
  const isFirstMessage  = useRef(true)
  const latestToolCallRef = useRef<{ id: string; tool: string; content: string } | null>(null)
  const btwFrameRef       = useRef<ReturnType<typeof setInterval> | null>(null)
  const skipSubmitRef     = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const loadingRef         = useRef(false)

  // Adaptive throttle refs
  const streamTextRef    = useRef("")
  const streamReasonRef  = useRef("")
  const streamTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tokenRateRef     = useRef(80)   // başlangıçta hızlı varsay (80 tok/s → 30ms flush)
  const lastTokenTimeRef = useRef(0)

  // "/" öneri filtresi
  const cmdFilter = !picker && !permission && input.startsWith("/")
    ? input.slice(1)
    : null

  // ── Static için finalize mesajlar ─────────────────────────────────────────
  const finalizedMsgs = useMemo(
    () => messages
      .filter(m => !m.pending)
      .map((m, i) => m.id ? m : { ...m, id: `fallback-${i}` }),
    [messages]
  )
  const activeMsgs = useMemo(() => messages.filter(m => m.pending), [messages])

  // ── Subscriptions ─────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = () => setTermCols(process.stdout.columns ?? 80)
    process.stdout.on("resize", handler)
    return () => { process.stdout.off("resize", handler) }
  }, [])

  useEffect(() => questionService.onQuestion((req) => setQuestion(req)), [])
  useEffect(() => ExecutorEvents.on((e) => {
    if (e.type === "permission_ask") {
      // Autopilot modda izin isteklerini otomatik onayla
      if (autopilotRef.current) {
        PermissionGate.respond(e.request.id, "allow")
        return
      }
      setPermission(e.request)
    }
  }), [])
  useEffect(() => {
    getSkillsForProject(workdir)
      .then((s) => setSkillNames(s.map((sk) => sk.id)))
      .catch(() => {})
  }, [workdir])
  useEffect(() => taskManager.onUpdate(() => setTasks([...taskManager.getTasks()])), [])
  useEffect(() => PlanGate.onRequest((req) => setPlanRequest(req)), [])

  // Draft auto-save every 5s — interval reads latest input via closure ref
  const inputRef = useRef(input)
  useEffect(() => { inputRef.current = input }, [input])

  useEffect(() => {
    draftTimerRef.current = setInterval(() => {
      if (inputRef.current.trim() && !loadingRef.current) saveDraft(inputRef.current)
    }, 5_000)
    return () => { if (draftTimerRef.current) clearInterval(draftTimerRef.current) }
  }, [])

  // Draft recovery on mount
  useEffect(() => {
    const draft = loadDraft()
    if (draft && !draftRecovered) {
      setDraftRecovered(true)
      setInput(draft)
      addSystemMsg(`Draft recovered from last session. Press Enter to send or Esc to discard.`)
    }
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

  // Bracketed paste
  useEffect(() => {
    process.stdout.write("\x1b[?2004h")
    return () => { process.stdout.write("\x1b[?2004l") }
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

  useInput((input, key) => {
    // ── Ctrl+C: abort / exit ──────────────────────────────────────────────
    if (key.ctrl && input === "c") {
      if (loadingRef.current && abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
        PermissionGate.cancelPending()
        PlanGate.cancelPending()
        setPlanRequest(null)
        setPermission(null)
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

    // ── Ctrl+T: task panel ────────────────────────────────────────────────
    if (key.ctrl && input === "t") {
      if (tasks.length > 0) setTaskPanelOpen(v => !v)
      return
    }

    // ── Ctrl+F: quick search ──────────────────────────────────────────────
    if (key.ctrl && input === "f") {
      if (!loading) { setQuickSearchOpen(v => !v); setTaskPanelOpen(false); setCmdPaletteOpen(false) }
      return
    }

    // ── Ctrl+P: command palette ───────────────────────────────────────────
    if (key.ctrl && input === "p") {
      if (!loading) { setCmdPaletteOpen(v => !v); setQuickSearchOpen(false); setTaskPanelOpen(false) }
      return
    }

    // ── Ctrl+V: paste image from clipboard ───────────────────────────────
    if (key.ctrl && input === "v") {
      if (loading) return
      const clip = readClipboard()
      if (clip.type === "image") {
        const att: import("@omnicod/core").Attachment = {
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
      if (!loading) { setSettingsOpen(v => !v); setQuickSearchOpen(false); setCmdPaletteOpen(false) }
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
      setEditingMsg({ id: last.m.id ?? "", content: last.m.content, msgIndex: last.i })
      return
    }

    // ── Ctrl+A: attachment ────────────────────────────────────────────────
    if (key.ctrl && input === "a") {
      if (!loading && !permission && !question && !picker) setAttachInput(true)
      return
    }

    // ── Ctrl+O: son tool çıktısını genişlet ──────────────────────────────
    if (key.ctrl && input === "o") {
      if (!expandedContent && !btwState) {
        const latest = latestToolCallRef.current
        if (latest) setExpandedContent({ content: latest.content, toolName: latest.tool })
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
      if (!viewingSubagentId) {
        setViewingSubagentId(subSessions[0]!.id)
      } else {
        const idx  = subSessions.findIndex((s) => s.id === viewingSubagentId)
        const next = subSessions[(idx + 1) % subSessions.length]!
        setViewingSubagentId(next.id)
      }
      return
    }

    // ── Subagent ←/→ navigation ───────────────────────────────────────────
    if (viewingSubagentId && (key.leftArrow || key.rightArrow)) {
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

    // ── ESC: katmanlı kapat ───────────────────────────────────────────────
    if (key.escape) {
      if (viewingSubagentId)  { setViewingSubagentId(null); return }
      if (quickSearchOpen)    { setQuickSearchOpen(false); return }
      if (cmdPaletteOpen)     { setCmdPaletteOpen(false); return }
      if (settingsOpen)       { setSettingsOpen(false); return }
      if (designWizardOpen)   { setDesignWizardOpen(false); return }
      if (editingMsg)         { setEditingMsg(null); return }
      if (planRequest)        { PlanGate.respond(planRequest.id, { type: "rejected" }); setPlanRequest(null); return }
      if (expandedContent)    { setExpandedContent(null); return }
      if (btwState)           { setBtwState(null); if (btwFrameRef.current) { clearInterval(btwFrameRef.current); btwFrameRef.current = null }; return }
      if (taskPanelOpen)      { setTaskPanelOpen(false); return }
      if (permission || picker || question) return
      if (attachInput)        { setAttachInput(false); setAttachPath(""); return }
      if (input?.startsWith("/")) { setInput(""); return }
      if (!loading) exit()
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
  const handlePermission = useCallback((decision: "allow" | "allow_once" | "deny" | "deny_abort") => {
    if (!permission) return
    if (decision === "deny_abort") {
      PermissionGate.respond(permission.id, "deny")
      setPermission(null)
      if (abortControllerRef.current) { abortControllerRef.current.abort(); abortControllerRef.current = null }
      addSystemMsg("Agent stopped by user")
      return
    }
    PermissionGate.respond(permission.id, decision === "allow_once" ? "allow_once" : decision)
    setPermission(null)
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
        tokens: { input: tokens.input, output: tokens.output }, createdAt: Date.now(),
      }
      setBranches((prev) => {
        const updated = [...prev]
        updated[activeBranchIdx] = { ...updated[activeBranchIdx]!, messages: messages.slice(), history: history.slice(), tokens: { input: tokens.input, output: tokens.output } }
        return [...updated, newBranch]
      })
      setActiveBranchIdx(branches.length)
      addSystemMsg(`⎇ Switched to branch "${newName}"`)
    },
    switchBranch: (idx: number) => {
      if (idx < 0 || idx >= branches.length || idx === activeBranchIdx) return
      setBranches((prev) => {
        const updated = [...prev]
        updated[activeBranchIdx] = { ...updated[activeBranchIdx]!, messages: messages.slice(), history: history.slice(), tokens: { input: tokens.input, output: tokens.output } }
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
    replayTo: async (idx: number) => {
      const cp = checkpoints[idx]
      if (!cp) return
      await snapshotManager.restoreToMark(cp.mark)
      setMessages(cp.messages)
      setHistory(cp.history)
      setCheckpoints((prev) => prev.slice(0, idx + 1))
    },
    openDesign: () => setDesignWizardOpen(true),
  }), [provider, model, workdir, skillNames, setProvider, setModel, messages, history, tokens, checkpoints, branches, activeBranchIdx, watchedPaths])

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
        setTokens({ input: 0, output: 0 })
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

    // @path.ext syntax — inline file attachments
    const atRe = /@([\w./~-]+\.[a-zA-Z]{2,6})/g
    const atMatches = [...text.matchAll(atRe)]
    if (atMatches.length > 0) {
      for (const m of atMatches) {
        const rawPath = m[1]!
        const fullPath = rawPath.startsWith("~")
          ? rawPath.replace("~", process.env["HOME"] ?? "~")
          : rawPath.startsWith("/") ? rawPath : `${workdirState}/${rawPath}`
        try {
          const att = await readAttachmentFromPath(fullPath)
          setAttachments((prev) => [...prev, att])
        } catch { /* ignore — leave @path in message */ }
      }
      // Remove @path references from message text
      text = text.replace(atRe, "").replace(/\s{2,}/g, " ").trim()
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

    const startTime = Date.now()
    const now       = Date.now()
    const controller = new AbortController()
    abortControllerRef.current = controller
    setLoading(true)
    setIsStreaming(true)
    awardMessageXP()

    const userMsg: CoreMessage = { role: "user", content: text }
    setMessages((prev) => [...prev, { role: "user", content: text, timestamp: now, id: crypto.randomUUID() }])
    const newHistory = [...history, userMsg]
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
        if (streamTextRef.current)   setStreamingText(streamTextRef.current)
        if (streamReasonRef.current) setStreamingReason(streamReasonRef.current)
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
          // Timer varsa iptal et — yeni (doğru) gecikmeyle yeniden kur.
          const rate = tokenRateRef.current
          const ms   = rate > 40 ? 16 : rate > 15 ? 32 : rate > 5 ? 80 : 200
          if (streamTimerRef.current) clearTimeout(streamTimerRef.current)
          streamTimerRef.current = setTimeout(flushStream, ms)
        },
        onChunk: (chunk: string) => {
          setMessages((prev) => {
            // Son pending tool_call'u bul — bash streaming çıktısını buraya ekle
            const lastPendingIdx = prev.reduceRight<number>(
              (found, m, i) => found !== -1 ? found : (m.role === "tool_call" && m.pending) ? i : -1,
              -1,
            )
            if (lastPendingIdx === -1) return prev
            const next = [...prev]
            const msg  = next[lastPendingIdx]!
            next[lastPendingIdx] = { ...msg, resultContent: (msg.resultContent ?? "") + chunk }
            return next
          })
        },
        onToolCall: (tc) => {
          if (streamTimerRef.current) { clearTimeout(streamTimerRef.current); streamTimerRef.current = null }
          const textBefore   = streamTextRef.current
          const reasonBefore = streamReasonRef.current
          streamTextRef.current   = ""
          streamReasonRef.current = ""
          setStreamingText(null)
          setStreamingReason(null)
          setActiveTool(tc.tool)
          latestToolCallRef.current = { id: tc.id, tool: tc.tool, content: JSON.stringify(tc.args, null, 2) }
          setMessages((prev) => {
            const next = [...prev]
            const last = next[next.length - 1]
            if (last?.role === "assistant" && last.pending) {
              next[next.length - 1] = {
                ...last, pending: false,
                ...(textBefore   ? { content:          textBefore   } : {}),
                ...(reasonBefore ? { reasoningContent: reasonBefore } : {}),
              }
            }
            next.push({ id: tc.id ?? crypto.randomUUID(), role: "tool_call" as const, content: JSON.stringify(tc.args, null, 2), tool: tc.tool, pending: true })
            return next
          })
        },
        onStepFinish: () => {
          setMessages((prev) => prev.map((m) =>
            m.role === "tool_call" && m.pending ? { ...m, pending: false } : m
          ))
          setActiveTool(undefined)
          const mark  = snapshotManager.mark()
          const label = `step ${checkpoints.length + 1}`
          setCheckpoints((prev) => [
            ...prev.slice(-(MAX_CHECKPOINTS - 1)),
            { mark, messages: messages.slice(), history: history.slice(), label },
          ])
        },
        onToolResult: (tr) => {
          setMessages((prev) => {
            const next = [...prev]
            const callIndex = next.findIndex((m) => m.role === "tool_call" && m.id === tr.id)
            let parsedResult = tr.result
            if (typeof parsedResult === "object") parsedResult = JSON.stringify(parsedResult, null, 2)
            if (callIndex !== -1) {
              const old = next[callIndex]
              if (old) {
                const updated = { ...old, pending: false, resultContent: parsedResult, durationMs: tr.durationMs }
                next[callIndex] = updated
                if (old.tool && parsedResult) latestToolCallRef.current = { id: tr.id, tool: old.tool ?? "tool", content: parsedResult }
              }
            } else {
              next.push({ id: crypto.randomUUID(), role: "tool_result" as const, content: parsedResult, pending: false })
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
        onFinish: ({ tokens: t, text: finalText, newMessages }) => {
          if (streamTimerRef.current) { clearTimeout(streamTimerRef.current); streamTimerRef.current = null }
          const finalReason = streamReasonRef.current
          streamTextRef.current   = ""
          streamReasonRef.current = ""
          setStreamingText(null)
          setStreamingReason(null)
          setTokens((prev) => ({ input: prev.input + t.input, output: prev.output + t.output }))
          setContextTokens(t.input)
          const duration = Date.now() - startTime
          if (duration > 15_000) notifyTaskDone(text, duration)
          if (!extractedRef.current) {
            extractedRef.current = true
            extractAndStoreMemories(provider, model, [...newHistory, ...newMessages], workdirState)
              .then(() => { try { setMemoryCount(memoryStore.list(workdirState).length) } catch { /* ignore */ } })
              .catch(() => {})
          }
          setHistory([...newHistory, ...newMessages] as CoreMessage[])
          setMessages((prev) => {
            const next = prev.map(m => m.pending ? { ...m, pending: false } : m)
            const last = next[next.length - 1]
            const reasonSpread = finalReason ? { reasoningContent: finalReason } : {}
            if (finalText && last?.role !== "assistant") {
              next.push({ id: crypto.randomUUID(), role: "assistant", content: finalText, pending: false, ...reasonSpread })
            } else if (last?.role === "assistant") {
              next[next.length - 1] = { ...last, content: finalText, pending: false, ...reasonSpread }
            }
            return next
          })
        },
      })
    } catch (err) {
      if (streamTimerRef.current) { clearTimeout(streamTimerRef.current); streamTimerRef.current = null }
      streamTextRef.current   = ""
      streamReasonRef.current = ""
      setStreamingText(null)
      setStreamingReason(null)
      setMessages((prev) => {
        const next = prev.map(m => m.pending ? { ...m, pending: false } : m)
        next.push({ id: crypto.randomUUID(), role: "error", content: err instanceof Error ? err.message : String(err) })
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
      abortControllerRef.current = null
      setAttachments([])
      setQueuedInput((q) => { if (q) setTimeout(() => handleSubmit(q), 50); return undefined })
    }
  }, [loading, history, provider, model, workdir, system, executeCommand])

  // ── Render ────────────────────────────────────────────────────────────────
  const activeTheme = THEMES[themeName] ?? THEMES[DEFAULT_THEME]!

  const subSessions = viewingSubagentId
    ? SessionManager.list().filter((s) => s.parentId === mainSessionId.current).sort((a, b) => a.createdAt - b.createdAt)
    : []
  const subIdx = subSessions.findIndex((s) => s.id === viewingSubagentId)

  return (
    <ThemeContext.Provider value={activeTheme}>
    <KeybindingsProvider initialContext={loading ? "streaming" : "ready"}>
    <Box flexDirection="row" width="100%">

      {/* ── Sol: ana içerik ─────────────────────────────────────────────── */}
      <Box flexGrow={1} flexDirection="column">

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
        {!viewingSubagentId && messages.length === 0 && (
          <StartupBanner version="v0.0.1" provider={provider} model={model} workdir={workdir} />
        )}

        {/* Session title */}
        {!viewingSubagentId && sessionTitle && history.length > 0 && (
          <Box paddingX={2} marginBottom={1}>
            <Text color={activeTheme.textDim}>◈ </Text>
            <Text color={activeTheme.textSecondary} italic>{sessionTitle}</Text>
          </Box>
        )}

        {/* Statik geçmiş — bir kez render edilir */}
        {!viewingSubagentId && (
          <Static items={finalizedMsgs}>
            {(m) => (
              <Message
                key={m.id}
                message={m}
                onExpand={
                  m.role === "tool_call" && m.resultContent && m.resultContent.split("\n").length > 6
                    ? () => setExpandedContent({ content: m.resultContent!, toolName: m.tool ?? "tool" })
                    : undefined
                }
                onExpandThinking={
                  m.role === "assistant" && m.reasoningContent
                    ? () => setExpandedContent({ content: m.reasoningContent!, toolName: "∴ thinking" })
                    : undefined
                }
              />
            )}
          </Static>
        )}

        {/* Pending (çalışan) mesajlar */}
        {!viewingSubagentId && activeMsgs.map((m, i) => (
          <Message
            key={m.id ?? `active-${i}`}
            message={m}
            onExpand={
              m.role === "tool_call" && m.resultContent && m.resultContent.split("\n").length > 6
                ? () => setExpandedContent({ content: m.resultContent!, toolName: m.tool ?? "tool" })
                : undefined
            }
            onExpandThinking={
              m.role === "assistant" && m.reasoningContent
                ? () => setExpandedContent({ content: m.reasoningContent!, toolName: "∴ thinking" })
                : undefined
            }
          />
        ))}

        {/* Canlı streaming + skeleton (metin gelmeden önce shimmer) */}
        {!viewingSubagentId && (loading || streamingText || streamingReason) && !activeTool && (
          <StreamingView
            text={streamingText}
            reasoning={streamingReason}
            skeleton={loading && !streamingText && !streamingReason}
          />
        )}

        {/* Spinner — sadece tool çalışırken (text/reasoning yok) */}
        {!viewingSubagentId && loading && activeTool && !streamingText && !streamingReason && (
          <Spinner activeTool={activeTool} />
        )}

        {/* Subagent listesi */}
        <AgentStatus />

        {/* Overlay'ler */}
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
            onSelect={(cmd, args) => {
              setCmdPaletteOpen(false)
              setRecentCmds(prev => [cmd.name, ...prev.filter(n => n !== cmd.name)].slice(0, 10))
              setInput(`/${cmd.name}${args ? ` ${args}` : ""}`)
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
            onClose={() => setDesignWizardOpen(false)}
            onLaunch={(result: DesignWizardResult) => {
              setDesignWizardOpen(false)
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

        {/* Input alanı */}
        <Box flexDirection="row" alignItems="flex-end">
          <Buddy
            state={loading ? (activeTool ? "working" : "thinking") : "idle"}
            workdir={workdirState}
            {...(activeTool !== undefined ? { activeTool } : {})}
          />
          {permission
            ? <PermissionPrompt request={permission} onDecide={handlePermission} />
            : !picker && !question && !attachInput && !expandedContent && (
              <ChatInput
                value={input}
                onChange={setInput}
                onSubmit={handleSubmit}
                disabled={loading}
                history={commandHistory}
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
          isUndercover={isUndercover}
          coordinatorMode={coordinatorMode}
          wasCompacted={wasCompacted}
          activeAgent={activeAgent}
          agentColor={getSessionAgent(activeAgent, workdirState).color}
          bgTaskCount={bgTasks.filter(t => t.status === "running").length || undefined}
          taskCount={tasks.length || undefined}
          taskPanelOpen={taskPanelOpen}
          effort={effort}
          autopilotMode={autopilotMode}
          cols={termCols}
          {...(branch !== undefined ? { branch } : {})}
          {...(() => {
            try {
              const cw = ProviderRegistry.get(provider).listModels().find((m) => m.id === model)?.contextWindow
              return cw !== undefined ? { contextWindow: cw } : {}
            } catch { return {} }
          })()}
        />
      </Box>

      {/* ── Sağ: Floating Task Panel (Ctrl+T ile açılır) ────────────────── */}
      {taskPanelOpen && tasks.length > 0 && !viewingSubagentId && (
        <TaskFloatingPanel tasks={tasks} onClose={() => setTaskPanelOpen(false)} />
      )}

    </Box>
    </KeybindingsProvider>
    </ThemeContext.Provider>
  )
}
