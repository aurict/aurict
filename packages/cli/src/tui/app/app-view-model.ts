import type { Context as KeybindingContext } from "../../keybindings/index.js";
import type { FocusLayer, FocusState } from "./app-types.js";

const FOCUS_PRIORITY: ReadonlyArray<readonly [FocusLayer, keyof FocusState]> = [
  ["permission", "permission"],
  ["projectAuto", "projectAuto"],
  ["question", "question"],
  ["picker", "picker"],
  ["prompt", "prompt"],
  ["keyboardShortcuts", "keyboardShortcuts"],
  ["subagent", "subagent"],
  ["transcriptSearch", "transcriptSearch"],
  ["historySearch", "historySearch"],
  ["quickSearch", "quickSearch"],
  ["commandPalette", "commandPalette"],
  ["settings", "settings"],
  ["designWizard", "designWizard"],
  ["editing", "editing"],
  ["plan", "plan"],
  ["expanded", "expanded"],
  ["btw", "btw"],
  ["taskPanel", "taskPanel"],
  ["attach", "attach"],
  ["streaming", "streaming"],
];

/** Preserves the App's existing input-precedence order in one testable selector. */
export function resolveFocusLayer(state: FocusState): FocusLayer {
  for (const [layer, key] of FOCUS_PRIORITY) {
    if (state[key]) return layer;
  }
  return "ready";
}

export function keybindingContextForFocusLayer(
  focusLayer: FocusLayer,
): KeybindingContext {
  if (focusLayer === "permission") return "permission";
  if (focusLayer === "question") return "question";
  if (focusLayer === "picker" || focusLayer === "prompt") return "picker";
  if (focusLayer === "taskPanel") return "task-panel";
  if (focusLayer === "streaming") return "streaming";
  if (focusLayer === "ready") return "ready";
  return "modal";
}

export function isBlockingOverlayLayer(focusLayer: FocusLayer): boolean {
  return ![
    "ready",
    "streaming",
    "permission",
    "projectAuto",
    "subagent",
    "taskPanel",
  ].includes(focusLayer);
}
