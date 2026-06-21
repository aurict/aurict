/**
 * useOverlayState — TUI overlay/modal state yönetimi
 *
 * App.tsx'teki overlay state'lerini merkezi olarak yönetir.
 * Hangi overlay'lerin açık olduğunu takip eder ve `overlayOpen` flag'ini hesaplar.
 *
 * Overlay'ler:
 * - QuickSearch (Ctrl+F)
 * - CommandPalette (Ctrl+P)
 * - SettingsPanel (Ctrl+S)
 * - DesignWizard
 * - MessageEditPanel (Ctrl+E)
 * - PlanApprovalModal
 * - ExpandableOutput (Ctrl+O)
 * - BtwPanel
 * - TaskFloatingPanel (Ctrl+T)
 * - SubagentView (Ctrl+X)
 * - PermissionPrompt
 * - Picker
 * - QuestionPrompt
 * - AttachInput (Ctrl+A)
 * - PromptInput
 * - UpdateNotification
 */

import { useState, useCallback } from "react"
import type { Dispatch, SetStateAction } from "react"
import type { DisplayMessage } from "../Message.js"
import type { PlanRequest, Attachment, CoreMessage, TokenBreakdown } from "@aurict/core"

// ── Tipler ────────────────────────────────────────────────────────────────────

export interface EditingMessage {
  id: string
  content: string
  msgIndex: number
}

export interface BtwState {
  question: string
  answer: string
  loading: boolean
  frame: number
}

export interface ExpandedContent {
  content: string
  toolName: string
}

export interface OverlayState {
  // Overlay open flags
  quickSearchOpen: boolean
  cmdPaletteOpen: boolean
  settingsOpen: boolean
  designWizardOpen: boolean
  historySearchOpen: boolean
  keyboardShortcutsOpen: boolean
  taskPanelOpen: boolean
  updateDismissed: boolean
  attachInput: boolean

  // Overlay data
  editingMsg: EditingMessage | null
  planRequest: PlanRequest | null
  expandedContent: ExpandedContent | null
  btwState: BtwState | null
  viewingSubagentId: string | null
  attachPath: string
  attachments: Attachment[]

  // Computed
  overlayOpen: boolean
}

export interface OverlayActions {
  // Open/close toggles
  setQuickSearchOpen: Dispatch<SetStateAction<boolean>>
  setCmdPaletteOpen: Dispatch<SetStateAction<boolean>>
  setSettingsOpen: Dispatch<SetStateAction<boolean>>
  setDesignWizardOpen: Dispatch<SetStateAction<boolean>>
  setHistorySearchOpen: Dispatch<SetStateAction<boolean>>
  setKeyboardShortcutsOpen: Dispatch<SetStateAction<boolean>>
  setTaskPanelOpen: Dispatch<SetStateAction<boolean>>
  setUpdateDismissed: Dispatch<SetStateAction<boolean>>
  setAttachInput: Dispatch<SetStateAction<boolean>>
  setAttachPath: Dispatch<SetStateAction<string>>
  setAttachments: Dispatch<SetStateAction<Attachment[]>>

  // Data setters
  setEditingMsg: Dispatch<SetStateAction<EditingMessage | null>>
  setPlanRequest: Dispatch<SetStateAction<PlanRequest | null>>
  setExpandedContent: Dispatch<SetStateAction<ExpandedContent | null>>
  setBtwState: Dispatch<SetStateAction<BtwState | null>>
  setViewingSubagentId: Dispatch<SetStateAction<string | null>>

  // Computed overlay flag
  computeOverlayOpen: (extras?: {
    permission?: unknown
    picker?: unknown
    question?: unknown
    prompt?: unknown
  }) => boolean

  // Focus helpers
  closePrimaryOverlays: () => void
  closeAllOverlays: () => void
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useOverlayState(): OverlayState & OverlayActions {
  // Overlay open flags
  const [quickSearchOpen, setQuickSearchOpen] = useState(false)
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [designWizardOpen, setDesignWizardOpen] = useState(false)
  const [historySearchOpen, setHistorySearchOpen] = useState(false)
  const [keyboardShortcutsOpen, setKeyboardShortcutsOpen] = useState(false)
  const [taskPanelOpen, setTaskPanelOpen] = useState(false)
  const [updateDismissed, setUpdateDismissed] = useState(false)
  const [attachInput, setAttachInput] = useState(false)

  // Overlay data
  const [editingMsg, setEditingMsg] = useState<EditingMessage | null>(null)
  const [planRequest, setPlanRequest] = useState<PlanRequest | null>(null)
  const [expandedContent, setExpandedContent] = useState<ExpandedContent | null>(null)
  const [btwState, setBtwState] = useState<BtwState | null>(null)
  const [viewingSubagentId, setViewingSubagentId] = useState<string | null>(null)
  const [attachPath, setAttachPath] = useState("")
  const [attachments, setAttachments] = useState<Attachment[]>([])

  // Computed overlay flag — herhangi bir tam-ekran overlay/modal açıkken true
  const computeOverlayOpen = useCallback((extras?: {
    permission?: unknown
    picker?: unknown
    question?: unknown
    prompt?: unknown
  }): boolean => {
    return (
      designWizardOpen ||
      settingsOpen ||
      cmdPaletteOpen ||
      quickSearchOpen ||
      historySearchOpen ||
      keyboardShortcutsOpen ||
      !!planRequest ||
      !!editingMsg ||
      !!expandedContent ||
      !!btwState ||
      !!viewingSubagentId ||
      taskPanelOpen ||
      attachInput ||
      // Extras (App.tsx'ten gelen)
      !!extras?.permission ||
      !!extras?.picker ||
      !!extras?.question ||
      !!extras?.prompt
    )
  }, [
    designWizardOpen, settingsOpen, cmdPaletteOpen, quickSearchOpen,
    historySearchOpen, keyboardShortcutsOpen,
    planRequest, editingMsg, expandedContent, btwState, viewingSubagentId,
    taskPanelOpen, attachInput,
  ])

  const closePrimaryOverlays = useCallback(() => {
    setQuickSearchOpen(false)
    setCmdPaletteOpen(false)
    setSettingsOpen(false)
    setDesignWizardOpen(false)
    setHistorySearchOpen(false)
    setKeyboardShortcutsOpen(false)
    setTaskPanelOpen(false)
    setAttachInput(false)
    setAttachPath("")
  }, [])

  // Close all overlays
  const closeAllOverlays = useCallback(() => {
    closePrimaryOverlays()
    setEditingMsg(null)
    setExpandedContent(null)
    setBtwState(null)
    setViewingSubagentId(null)
  }, [closePrimaryOverlays])

  // Computed overlay flag (without extras — App.tsx'te extras ile birlikte hesaplanır)
  const overlayOpen = computeOverlayOpen()

  return {
    // State
    quickSearchOpen,
    cmdPaletteOpen,
    settingsOpen,
    designWizardOpen,
    historySearchOpen,
    keyboardShortcutsOpen,
    taskPanelOpen,
    updateDismissed,
    attachInput,
    editingMsg,
    planRequest,
    expandedContent,
    btwState,
    viewingSubagentId,
    attachPath,
    attachments,
    overlayOpen,

    // Actions
    setQuickSearchOpen,
    setCmdPaletteOpen,
    setSettingsOpen,
    setDesignWizardOpen,
    setHistorySearchOpen,
    setKeyboardShortcutsOpen,
    setTaskPanelOpen,
    setUpdateDismissed,
    setAttachInput,
    setAttachPath,
    setAttachments,
    setEditingMsg,
    setPlanRequest,
    setExpandedContent,
    setBtwState,
    setViewingSubagentId,
    computeOverlayOpen,
    closePrimaryOverlays,
    closeAllOverlays,
  }
}
