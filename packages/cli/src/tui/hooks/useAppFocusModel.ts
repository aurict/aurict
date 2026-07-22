import type { PermissionRequest, QuestionRequest } from "@aurict/core";
import {
  isBlockingOverlayLayer,
  keybindingContextForFocusLayer,
  resolveFocusLayer,
} from "../app/app-view-model.js";
import type { PickerRequest, PromptRequest } from "../app/app-state-types.js";
import type { useOverlayState } from "./useOverlayState.js";

interface FocusModelParams {
  overlay: ReturnType<typeof useOverlayState>;
  permission: PermissionRequest | null;
  projectAutoPromptOpen: boolean;
  question: QuestionRequest | null;
  picker: PickerRequest | null;
  prompt: PromptRequest | null;
  loading: boolean;
}

export function useAppFocusModel(params: FocusModelParams) {
  const { overlay } = params;
  const overlayOpen = overlay.computeOverlayOpen({
    permission: params.permission,
    picker: params.picker,
    question: params.question,
    prompt: params.prompt,
  });
  const focusLayer = resolveFocusLayer({
    permission: params.permission !== null,
    projectAuto: params.projectAutoPromptOpen,
    question: params.question !== null,
    picker: params.picker !== null,
    prompt: params.prompt !== null,
    keyboardShortcuts: overlay.keyboardShortcutsOpen,
    subagent: overlay.viewingSubagentId !== null,
    transcriptSearch: overlay.transcriptSearchOpen,
    historySearch: overlay.historySearchOpen,
    quickSearch: overlay.quickSearchOpen,
    commandPalette: overlay.cmdPaletteOpen,
    settings: overlay.settingsOpen,
    designWizard: overlay.designWizardOpen,
    editing: overlay.editingMsg !== null,
    plan: overlay.planRequest !== null,
    expanded: overlay.expandedContent !== null,
    btw: overlay.btwState !== null,
    taskPanel: overlay.taskPanelOpen,
    attach: overlay.attachInput,
    streaming: params.loading,
  });
  return {
    overlayOpen,
    focusLayer,
    keybindingContext: keybindingContextForFocusLayer(focusLayer),
    blockingOverlayOpen: isBlockingOverlayLayer(focusLayer),
    composerInputActive: focusLayer === "ready" || focusLayer === "streaming",
  };
}
