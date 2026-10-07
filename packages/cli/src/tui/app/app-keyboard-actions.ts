import { PermissionGate, PlanGate } from "@aurict/core";
import { TURN_CANCELLED_NOTICE } from "./cancellation-feedback.js";
import { checkpointForMessage } from "./turn-checkpoints.js";

/** Alt+↑ on an empty composer: take the newest queued message back for editing. */
export function editLastQueuedMessage(params: AppKeyboardParams): boolean {
  const last = params.composerQueue.at(-1);
  if (!last || params.inputRef.current.length > 0) return false;
  params.setComposerQueue((items) => items.filter((item) => item.id !== last.id));
  params.setInput(last.text);
  return true;
}
import type {
  AppKeyboardParams,
  PrimaryOverlayTarget,
} from "./app-keyboard-types.js";

/** Aborts the running turn and settles every gate it may be waiting on. */
export function cancelActiveTurn(params: AppKeyboardParams): boolean {
  if (!params.loadingRef.current || !params.abortControllerRef.current) return false;
  params.abortControllerRef.current.abort();
  params.abortControllerRef.current = null;
  PermissionGate.cancelPending();
  PlanGate.cancelPending();
  params.overlay.setPlanRequest(null);
  params.setPermissionQueue([]);
  params.setMessages((messages) =>
    messages.map((message) =>
      message.pending ? { ...message, pending: false } : message,
    ),
  );
  params.setStreamingText(null);
  params.setStreamingReason(null);
  params.setScrollLocked(false);
  params.setConversationOffsetRows(0);
  params.addSystemMsg(TURN_CANCELLED_NOTICE);
  return true;
}

/** Esc Esc on an idle, empty composer: pick a previous prompt to edit and re-run. */
export function openBacktrackPicker(params: AppKeyboardParams): boolean {
  const prompts = params.messages
    .map((message, index) => ({ message, index }))
    .filter(({ message }) => message.role === "user" && !message.pending);
  if (prompts.length === 0) return false;
  params.overlay.closePrimaryOverlays();
  params.setPicker({
    title: "Edit a previous message — the conversation rewinds to it",
    items: prompts.reverse().map(({ message, index }) => ({
      id: String(index),
      label: message.content.replace(/\s+/g, " ").trim().slice(0, 72) || "(empty)",
      ...(message.timestamp !== undefined
        ? { hint: new Date(message.timestamp).toTimeString().slice(0, 5) }
        : {}),
    })),
    onSelect: (item) => {
      const index = Number(item.id);
      const message = params.messages[index];
      if (!message) return;
      // A turn checkpoint can also put the files back; prompts restored from a
      // saved session have none and fall back to edit-and-rerun.
      const checkpoint = checkpointForMessage(params.checkpoints, params.messages, index);
      if (checkpoint !== -1) params.requestRewind(checkpoint);
      else params.overlay.setEditingMsg({ id: message.id ?? "", content: message.content, msgIndex: index });
    },
  });
  return true;
}

export function closeFocusedLayer(params: AppKeyboardParams): boolean {
  const overlay = params.overlay;
  switch (params.focusLayer) {
    case "permission": {
      const request = params.permission;
      if (request) {
        PermissionGate.respond(request.id, "deny");
        params.setPermissionQueue((queue) =>
          queue.filter((item) => item.id !== request.id),
        );
        params.addSystemMsg(`Permission denied: ${request.tool}`);
      }
      return true;
    }
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
    case "transcript":
      overlay.setTranscriptPagerOpen(false);
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
    (target === "transcript" && overlay.transcriptPagerOpen) ||
    (target === "quickSearch" && overlay.quickSearchOpen) ||
    (target === "commandPalette" && overlay.cmdPaletteOpen) ||
    (target === "historySearch" && overlay.historySearchOpen) ||
    (target === "settings" && overlay.settingsOpen) ||
    (target === "taskPanel" && overlay.taskPanelOpen) ||
    (target === "attach" && overlay.attachInput);

  overlay.closePrimaryOverlays();
  if (wasOpen) return;
  if (target === "transcriptSearch") overlay.setTranscriptSearchOpen(true);
  if (target === "transcript") {
    overlay.setPagerAnchor(null);
    overlay.setTranscriptPagerOpen(true);
  }
  if (target === "quickSearch") overlay.setQuickSearchOpen(true);
  if (target === "commandPalette") overlay.setCmdPaletteOpen(true);
  if (target === "historySearch") overlay.setHistorySearchOpen(true);
  if (target === "settings") overlay.setSettingsOpen(true);
  if (target === "taskPanel") overlay.setTaskPanelOpen(true);
  if (target === "attach") overlay.setAttachInput(true);
}
