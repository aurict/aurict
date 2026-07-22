/**
 * useOverlayState — TUI overlay/modal state management
 *
 * Centrally manages App.tsx's overlay states.
 * Tracks which overlays are open and computes the `overlayOpen` flag.
 *
 * Overlays:
 * - TranscriptSearch (Ctrl+F)
 * - QuickSearch (Ctrl+Shift+F)
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

// ── Types ────────────────────────────────────────────────────────────────────

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
  kind?: "tool" | "reasoning" | "diff" | "write"
  rawDiff?: string
  filePath?: string
  totalLines?: number
}

export type PrimaryOverlay =
  | "transcriptSearch"
  | "quickSearch"
  | "commandPalette"
  | "settings"
  | "designWizard"
  | "historySearch"
  | "keyboardShortcuts"
  | "attach"
  | null

export interface OverlayState {
  /** At most one composer-level modal can own input at a time. */
  primaryOverlay: PrimaryOverlay
  // Overlay open flags
  quickSearchOpen: boolean
  transcriptSearchOpen: boolean
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
  setTranscriptSearchOpen: Dispatch<SetStateAction<boolean>>
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
  // Composer-level overlays are mutually exclusive by construction. The
  // boolean setters remain as a compatibility boundary for command handlers.
  const [primaryOverlay, setPrimaryOverlay] = useState<PrimaryOverlay>(null)
  const setPrimaryOpen = useCallback((
    name: Exclude<PrimaryOverlay, null>,
    action: SetStateAction<boolean>,
  ) => {
    setPrimaryOverlay((current) => {
      const isOpen = current === name
      const nextOpen = typeof action === "function" ? action(isOpen) : action
      if (nextOpen) return name
      return isOpen ? null : current
    })
  }, [])
  const setQuickSearchOpen = useCallback((action: SetStateAction<boolean>) => {
    setPrimaryOpen("quickSearch", action)
  }, [setPrimaryOpen])
  const setTranscriptSearchOpen = useCallback((action: SetStateAction<boolean>) => {
    setPrimaryOpen("transcriptSearch", action)
  }, [setPrimaryOpen])
  const setCmdPaletteOpen = useCallback((action: SetStateAction<boolean>) => {
    setPrimaryOpen("commandPalette", action)
  }, [setPrimaryOpen])
  const setSettingsOpen = useCallback((action: SetStateAction<boolean>) => {
    setPrimaryOpen("settings", action)
  }, [setPrimaryOpen])
  const setDesignWizardOpen = useCallback((action: SetStateAction<boolean>) => {
    setPrimaryOpen("designWizard", action)
  }, [setPrimaryOpen])
  const setHistorySearchOpen = useCallback((action: SetStateAction<boolean>) => {
    setPrimaryOpen("historySearch", action)
  }, [setPrimaryOpen])
  const setKeyboardShortcutsOpen = useCallback((action: SetStateAction<boolean>) => {
    setPrimaryOpen("keyboardShortcuts", action)
  }, [setPrimaryOpen])
  const setAttachInput = useCallback((action: SetStateAction<boolean>) => {
    setPrimaryOpen("attach", action)
  }, [setPrimaryOpen])
  const quickSearchOpen = primaryOverlay === "quickSearch"
  const transcriptSearchOpen = primaryOverlay === "transcriptSearch"
  const cmdPaletteOpen = primaryOverlay === "commandPalette"
  const settingsOpen = primaryOverlay === "settings"
  const designWizardOpen = primaryOverlay === "designWizard"
  const historySearchOpen = primaryOverlay === "historySearch"
  const keyboardShortcutsOpen = primaryOverlay === "keyboardShortcuts"
  const attachInput = primaryOverlay === "attach"
  const [taskPanelOpen, setTaskPanelOpen] = useState(false)
  const [updateDismissed, setUpdateDismissed] = useState(false)

  // Overlay data
  const [editingMsg, setEditingMsg] = useState<EditingMessage | null>(null)
  const [planRequest, setPlanRequest] = useState<PlanRequest | null>(null)
  const [expandedContent, setExpandedContent] = useState<ExpandedContent | null>(null)
  const [btwState, setBtwState] = useState<BtwState | null>(null)
  const [viewingSubagentId, setViewingSubagentId] = useState<string | null>(null)
  const [attachPath, setAttachPath] = useState("")
  const [attachments, setAttachments] = useState<Attachment[]>([])

  // Computed interaction flag — true when any focus-owning surface is open.
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
      transcriptSearchOpen ||
      historySearchOpen ||
      keyboardShortcutsOpen ||
      !!planRequest ||
      !!editingMsg ||
      !!expandedContent ||
      !!btwState ||
      !!viewingSubagentId ||
      taskPanelOpen ||
      attachInput ||
      // Extras (from App.tsx)
      !!extras?.permission ||
      !!extras?.picker ||
      !!extras?.question ||
      !!extras?.prompt
    )
  }, [
    designWizardOpen, settingsOpen, cmdPaletteOpen, quickSearchOpen, transcriptSearchOpen,
    historySearchOpen, keyboardShortcutsOpen,
    planRequest, editingMsg, expandedContent, btwState, viewingSubagentId,
    taskPanelOpen, attachInput,
  ])

  const closePrimaryOverlays = useCallback(() => {
    setPrimaryOverlay(null)
    setTaskPanelOpen(false)
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

  // Computed overlay flag (without extras — App.tsx computes it together with extras)
  const overlayOpen = computeOverlayOpen()

  return {
    // State
    primaryOverlay,
    quickSearchOpen,
    transcriptSearchOpen,
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
    setTranscriptSearchOpen,
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
