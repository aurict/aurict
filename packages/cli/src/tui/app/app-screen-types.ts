import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type {
  ContextUsage,
  CompletionProof,
  CoreMessage,
  PermissionRequest,
  QuestionAnswer,
  QuestionRequest,
  Task,
  TokenBreakdown,
} from "@aurict/core";
import type { LocalServerStatus } from "../../bootstrap.js";
import type { CommandDef } from "../../commands/types.js";
import type { Context as KeybindingContext } from "../../keybindings/index.js";
import type { UpdateInfo } from "../../util/update-check.js";
import type { ComposerQueueItem } from "../composer-queue.js";
import type { DisplayMessage } from "../conversation/types.js";
import type { TranscriptDetail } from "../conversation/transcript-details.js";
import type { useOverlayState } from "../hooks/useOverlayState.js";
import type { PermissionPromptDecision } from "../PermissionPrompt.js";
import type { RunActivity } from "../run-status.js";
import type { FocusLayer } from "./app-types.js";
import type { PickerRequest, PromptRequest } from "./app-state-types.js";

export interface TaskSummary {
  pending: number;
  inProgress: number;
  done: number;
  error: number;
}

export interface AppScreenProps {
  termRows: number;
  termCols: number;
  terminalMeasured: boolean;
  themeName: string;
  keybindingContext: KeybindingContext;
  blockingOverlayOpen: boolean;
  focusLayer: FocusLayer;
  composerInputActive: boolean;
  overlay: ReturnType<typeof useOverlayState>;
  provider: string;
  model: string;
  workdir: string;
  initialWorkdir: string;
  tokens: TokenBreakdown;
  contextUsage: ContextUsage | undefined;
  completionProof: CompletionProof | undefined;
  loading: boolean;
  coordinatorMode: boolean;
  autopilotMode: boolean;
  activeTool: string | undefined;
  runActivity: RunActivity | undefined;
  tasks: Task[];
  taskSummary: TaskSummary;
  runningBackgroundTaskCount: number;
  localServer: LocalServerStatus | undefined;
  sandboxBackend: "none" | "policy" | "docker";
  activeAgentCount: number;
  branch: string | undefined;
  activeAgent: string;
  skillNames: string[];
  turnSkillNames: string[];
  isUndercover: boolean;
  wasCompacted: boolean;
  remoteConnected: boolean;
  effort: number | undefined;
  showStartupBanner: boolean;
  updateInfo: UpdateInfo | null;
  sessionTitle: string | undefined;
  history: CoreMessage[];
  messages: DisplayMessage[];
  streamingText: string | null;
  streamingReason: string | null;
  streamingError: string | null;
  scrollLocked: boolean;
  conversationOffsetRows: number;
  unseenCount: number;
  unseenLabel: string;
  selectionHintVisible: boolean;
  measuredViewportRows: number;
  commandHistory: string[];
  commandDefs: CommandDef[];
  recentCmds: string[];
  designInitialBrief: string | undefined;
  picker: PickerRequest | null;
  prompt: PromptRequest | null;
  question: QuestionRequest | null;
  permission: PermissionRequest | null;
  projectAutoPromptOpen: boolean;
  resolveProjectAutoPrompt: (enabled: boolean) => void;
  permissionQueueLength: number;
  transcriptDetails: TranscriptDetail[];
  input: string;
  composerQueue: ComposerQueueItem[];
  inlineSuggestionActive: boolean;
  cmdFilter: string | null;
  mentionFilter: string | null;
  mainSessionId: MutableRefObject<string>;
  btwFrameRef: MutableRefObject<ReturnType<typeof setInterval> | null>;
  setMeasuredViewportRows: Dispatch<SetStateAction<number>>;
  setConversationOffsetRows: Dispatch<SetStateAction<number>>;
  setHistory: Dispatch<SetStateAction<CoreMessage[]>>;
  setMessages: Dispatch<SetStateAction<DisplayMessage[]>>;
  setRecentCmds: Dispatch<SetStateAction<string[]>>;
  setInput: Dispatch<SetStateAction<string>>;
  setThemeName: Dispatch<SetStateAction<string>>;
  setDesignInitialBrief: Dispatch<SetStateAction<string | undefined>>;
  setPicker: Dispatch<SetStateAction<PickerRequest | null>>;
  setPrompt: Dispatch<SetStateAction<PromptRequest | null>>;
  addSystemMsg: (content: string) => void;
  executeCommand: (input: string) => boolean;
  handleSubmit: (input: string) => Promise<void>;
  handleQueue: (input: string) => void;
  handleCmdExecute: (name: string) => void;
  handleCmdFill: (name: string) => void;
  handleEditRerun: (index: number, content: string) => void;
  handleQuestionAnswer: (answers: QuestionAnswer[]) => void;
  handleQuestionReject: () => void;
  handlePermission: (decision: PermissionPromptDecision) => void;
  handleScrollRange: (maxOffset: number) => void;
  scrollConversation: (deltaRows: number) => void;
  moveTranscriptDetail: (direction: -1 | 1) => void;
}
