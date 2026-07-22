import { PlanGate } from "@aurict/core";
import type {
  AppKeyboardParams,
  PrimaryOverlayTarget,
} from "./app-keyboard-types.js";

export function closeFocusedLayer(params: AppKeyboardParams): boolean {
  const overlay = params.overlay;
  switch (params.focusLayer) {
    case "permission":
    case "question":
    case "picker":
    case "prompt":
    case "streaming":
      return true;
    case "projectAuto":
      params.resolveProjectAutoPrompt(false);
      return true;
    case "keyboardShortcuts":
      overlay.setKeyboardShortcutsOpen(false);
      return true;
    case "subagent":
      overlay.setViewingSubagentId(null);
      return true;
    case "transcriptSearch":
      overlay.setTranscriptSearchOpen(false);
      return true;
    case "historySearch":
      overlay.setHistorySearchOpen(false);
      return true;
    case "quickSearch":
      overlay.setQuickSearchOpen(false);
      return true;
    case "commandPalette":
      overlay.setCmdPaletteOpen(false);
      return true;
    case "settings":
      overlay.setSettingsOpen(false);
      return true;
    case "designWizard":
      overlay.setDesignWizardOpen(false);
      return true;
    case "editing":
      overlay.setEditingMsg(null);
      return true;
    case "plan":
      if (overlay.planRequest) {
        PlanGate.respond(overlay.planRequest.id, { type: "rejected" });
      }
      overlay.setPlanRequest(null);
      return true;
    case "expanded":
      overlay.setExpandedContent(null);
      return true;
    case "btw":
      overlay.setBtwState(null);
      if (params.btwFrameRef.current) {
        clearInterval(params.btwFrameRef.current);
        params.btwFrameRef.current = null;
      }
      return true;
    case "taskPanel":
      overlay.setTaskPanelOpen(false);
      return true;
    case "attach":
      overlay.setAttachInput(false);
      overlay.setAttachPath("");
      return true;
    case "ready":
      return false;
  }
}

export function togglePrimaryOverlay(
  target: PrimaryOverlayTarget,
  params: AppKeyboardParams,
): void {
  const overlay = params.overlay;
  const wasOpen =
    (target === "transcriptSearch" && overlay.transcriptSearchOpen) ||
    (target === "quickSearch" && overlay.quickSearchOpen) ||
    (target === "commandPalette" && overlay.cmdPaletteOpen) ||
    (target === "historySearch" && overlay.historySearchOpen) ||
    (target === "settings" && overlay.settingsOpen) ||
    (target === "taskPanel" && overlay.taskPanelOpen) ||
    (target === "attach" && overlay.attachInput);

  overlay.closePrimaryOverlays();
  if (wasOpen) return;
  if (target === "transcriptSearch") overlay.setTranscriptSearchOpen(true);
  if (target === "quickSearch") overlay.setQuickSearchOpen(true);
  if (target === "commandPalette") overlay.setCmdPaletteOpen(true);
  if (target === "historySearch") overlay.setHistorySearchOpen(true);
  if (target === "settings") overlay.setSettingsOpen(true);
  if (target === "taskPanel") overlay.setTaskPanelOpen(true);
  if (target === "attach") overlay.setAttachInput(true);
}
