import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type { PermissionRequest, Task } from "@aurict/core";
import type { DisplayMessage } from "../conversation/types.js";
import type { TranscriptDetail } from "../conversation/transcript-details.js";
import type { FocusLayer } from "./app-types.js";
import type { TuiMode } from "../render-mode.js";
import type { Checkpoint, PickerRequest } from "./app-state-types.js";
import type { ComposerQueueItem } from "../composer-queue.js";
import type { useOverlayState } from "../hooks/useOverlayState.js";

export interface AppKeyboardParams {
  exit: () => void;
  tuiMode: TuiMode;
  focusLayer: FocusLayer;
  loading: boolean;
  overlayOpen: boolean;
  updateAvailable: boolean;
  inlineSuggestionActive: boolean;
  workdir: string;
  activeAgent: string;
  commandHistory: string[];
  tasks: Task[];
  messages: DisplayMessage[];
  transcriptDetails: TranscriptDetail[];
  selectedTranscriptDetailId: string | null;
  permission: PermissionRequest | null;
  projectAutoPromptOpen: boolean;
  resolveProjectAutoPrompt: (enabled: boolean) => void;
  pickerOpen: boolean;
  questionOpen: boolean;
  overlay: ReturnType<typeof useOverlayState>;
  mainSessionId: MutableRefObject<string>;
  loadingRef: MutableRefObject<boolean>;
  inputRef: MutableRefObject<string>;
  abortControllerRef: MutableRefObject<AbortController | null>;
  streamTextRef: MutableRefObject<string>;
  streamReasonRef: MutableRefObject<string>;
  latestToolCallRef: MutableRefObject<{
    id: string;
    tool: string;
    content: string;
  } | null>;
  btwFrameRef: MutableRefObject<ReturnType<typeof setInterval> | null>;
  setPermissionQueue: Dispatch<SetStateAction<PermissionRequest[]>>;
  setMessages: Dispatch<SetStateAction<DisplayMessage[]>>;
  setStreamingText: Dispatch<SetStateAction<string | null>>;
  setStreamingReason: Dispatch<SetStateAction<string | null>>;
  setScrollLocked: Dispatch<SetStateAction<boolean>>;
  setConversationOffsetRows: Dispatch<SetStateAction<number>>;
  setInput: Dispatch<SetStateAction<string>>;
  setAttachments: ReturnType<typeof useOverlayState>["setAttachments"];
  setActiveAgent: Dispatch<SetStateAction<string>>;
  setPicker: Dispatch<SetStateAction<PickerRequest | null>>;
  checkpoints: Checkpoint[];
  requestRewind: (index: number) => void;
  composerQueue: ComposerQueueItem[];
  setComposerQueue: Dispatch<SetStateAction<ComposerQueueItem[]>>;
  addSystemMsg: (content: string) => void;
  handleAttachSubmit: (path: string) => Promise<void>;
  openExternalEditor: () => void;
  scrollConversation: (deltaRows: number) => void;
  pageConversation: (direction: -1 | 1) => void;
  openTranscriptDetail: (detail: TranscriptDetail) => void;
}

export type PrimaryOverlayTarget =
  | "transcriptSearch"
  | "transcript"
  | "quickSearch"
  | "commandPalette"
  | "historySearch"
  | "settings"
  | "taskPanel"
  | "attach";
