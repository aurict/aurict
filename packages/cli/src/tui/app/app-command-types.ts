import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type {
  ContextUsage,
  CompletionProof,
  CoreMessage,
  PromptCacheHealthResult,
  PromptDiagnostics,
  TokenBreakdown,
} from "@aurict/core";
import type { BackgroundTask } from "../../commands/types.js";
import type { DisplayMessage } from "../conversation/types.js";
import type { useOverlayState } from "../hooks/useOverlayState.js";
import type {
  Checkpoint,
  ConversationBranch,
  PickerRequest,
  PromptRequest,
  WatchedPath,
} from "./app-state-types.js";

export interface AppCommandParams {
  provider: string;
  model: string;
  workdir: string;
  effort: number | undefined;
  skillNames: string[];
  themeName: string;
  isUndercover: boolean;
  coordinatorMode: boolean;
  activeAgent: string;
  autopilotMode: boolean;
  messages: DisplayMessage[];
  history: CoreMessage[];
  tokens: TokenBreakdown;
  contextUsage: ContextUsage | undefined;
  promptDiagnostics: PromptDiagnostics | undefined;
  promptCacheHealth: PromptCacheHealthResult | undefined;
  checkpoints: Checkpoint[];
  branches: ConversationBranch[];
  activeBranchIdx: number;
  watchedPaths: WatchedPath[];
  remoteConnected: boolean;
  bgTasks: BackgroundTask[];
  overlay: ReturnType<typeof useOverlayState>;
  mainSessionId: MutableRefObject<string>;
  btwFrameRef: MutableRefObject<ReturnType<typeof setInterval> | null>;
  watchCleanupRef: MutableRefObject<Map<string, () => void>>;
  remoteBridgeRef: MutableRefObject<{ start: () => void; stop: () => void }>;
  skipSubmitRef: MutableRefObject<boolean>;
  submitRef: MutableRefObject<(value: string) => void>;
  isFirstMessage: MutableRefObject<boolean>;
  extractedRef: MutableRefObject<boolean>;
  setProvider: (provider: string, model: string) => void;
  setModel: (model: string) => void;
  setEffort: Dispatch<SetStateAction<number | undefined>>;
  setActiveAgent: Dispatch<SetStateAction<string>>;
  setThemeName: Dispatch<SetStateAction<string>>;
  setWorkdir: Dispatch<SetStateAction<string>>;
  setIsUndercover: Dispatch<SetStateAction<boolean>>;
  setCoordinatorMode: Dispatch<SetStateAction<boolean>>;
  setAutopilotMode: Dispatch<SetStateAction<boolean>>;
  startBackgroundTask: (prompt: string) => string;
  cancelBackgroundTask: (id: string) => boolean;
  setPicker: Dispatch<SetStateAction<PickerRequest | null>>;
  setPrompt: Dispatch<SetStateAction<PromptRequest | null>>;
  setHistory: Dispatch<SetStateAction<CoreMessage[]>>;
  setMessages: Dispatch<SetStateAction<DisplayMessage[]>>;
  setCheckpoints: Dispatch<SetStateAction<Checkpoint[]>>;
  setBranches: Dispatch<SetStateAction<ConversationBranch[]>>;
  setActiveBranchIdx: Dispatch<SetStateAction<number>>;
  setTokens: Dispatch<SetStateAction<TokenBreakdown>>;
  setWatchedPaths: Dispatch<SetStateAction<WatchedPath[]>>;
  setContextUsage: Dispatch<SetStateAction<ContextUsage | undefined>>;
  setCompletionProof: Dispatch<SetStateAction<CompletionProof | undefined>>;
  setSessionTitle: Dispatch<SetStateAction<string | undefined>>;
  setDesignInitialBrief: Dispatch<SetStateAction<string | undefined>>;
  setInput: Dispatch<SetStateAction<string>>;
  addSystemMsg: (content: string) => void;
  exit: () => void;
}
