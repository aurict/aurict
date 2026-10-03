import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type {
  Attachment,
  CompletionProof,
  ContextUsage,
  CoreMessage,
  PromptCacheHealthResult,
  PromptDiagnostics,
  TokenBreakdown,
} from "@aurict/core";
import type { CliRemoteRuntime } from "../../remote/runtime.js";
import type { ComposerQueueItem } from "../composer-queue.js";
import type { DisplayMessage } from "../conversation/types.js";
import type { RunActivity } from "../run-status.js";
import type { Checkpoint } from "./app-state-types.js";

export interface AutoContinueState {
  needed: boolean;
  count: number;
  prompt?: string;
}

export interface LatestToolCall {
  id: string;
  tool: string;
  content: string;
}

export interface AgentSubmitParams {
  /** Background MCP/custom-tool startup; a turn waits for it before running. */
  servicesReady?: Promise<void> | undefined;
  provider: string;
  model: string;
  workdir: string;
  system: string | undefined;
  undercover: boolean;
  effort: number | undefined;
  activeAgent: string;
  coordinatorMode: boolean;
  loading: boolean;
  history: CoreMessage[];
  messages: DisplayMessage[];
  attachments: Attachment[];
  checkpoints: Checkpoint[];
  executeCommand: (input: string) => boolean;
  addSystemMsg: (content: string) => void;
  mainSessionId: MutableRefObject<string>;
  historyRef: MutableRefObject<CoreMessage[]>;
  extractedRef: MutableRefObject<boolean>;
  isFirstMessage: MutableRefObject<boolean>;
  skipSubmitRef: MutableRefObject<boolean>;
  submitRef: MutableRefObject<(value: string) => void>;
  abortControllerRef: MutableRefObject<AbortController | null>;
  remoteRuntimeRef: MutableRefObject<CliRemoteRuntime | null>;
  autoContinueRef: MutableRefObject<AutoContinueState>;
  autoContinueSubmittingRef: MutableRefObject<boolean>;
  scrollLockedRef: MutableRefObject<boolean>;
  streamTextRef: MutableRefObject<string>;
  streamReasonRef: MutableRefObject<string>;
  streamTimerRef: MutableRefObject<ReturnType<typeof setTimeout> | null>;
  tokenRateRef: MutableRefObject<number>;
  lastTokenTimeRef: MutableRefObject<number>;
  turnHadToolRef: MutableRefObject<boolean>;
  turnAssistantIdRef: MutableRefObject<string | null>;
  latestToolCallRef: MutableRefObject<LatestToolCall | null>;
  setInput: Dispatch<SetStateAction<string>>;
  setStartupBannerVisible: Dispatch<SetStateAction<boolean>>;
  setScrollLocked: Dispatch<SetStateAction<boolean>>;
  setConversationOffsetRows: Dispatch<SetStateAction<number>>;
  setAttachments: Dispatch<SetStateAction<Attachment[]>>;
  setComposerQueue: Dispatch<SetStateAction<ComposerQueueItem[]>>;
  setCommandHistory: Dispatch<SetStateAction<string[]>>;
  setSessionTitle: Dispatch<SetStateAction<string | undefined>>;
  setStreamingError: Dispatch<SetStateAction<string | null>>;
  setTurnSkillNames: Dispatch<SetStateAction<string[]>>;
  setRunActivity: Dispatch<SetStateAction<RunActivity | undefined>>;
  setLoading: Dispatch<SetStateAction<boolean>>;
  setMessages: Dispatch<SetStateAction<DisplayMessage[]>>;
  setStreamingText: Dispatch<SetStateAction<string | null>>;
  setStreamingReason: Dispatch<SetStateAction<string | null>>;
  setActiveTool: Dispatch<SetStateAction<string | undefined>>;
  setCheckpoints: Dispatch<SetStateAction<Checkpoint[]>>;
  setWasCompacted: Dispatch<SetStateAction<boolean>>;
  setContextUsage: Dispatch<SetStateAction<ContextUsage | undefined>>;
  setCompletionProof: Dispatch<SetStateAction<CompletionProof | undefined>>;
  setPromptDiagnostics: Dispatch<SetStateAction<PromptDiagnostics | undefined>>;
  setPromptCacheHealth: Dispatch<SetStateAction<PromptCacheHealthResult | undefined>>;
  setTokens: Dispatch<SetStateAction<TokenBreakdown>>;
  setHistory: Dispatch<SetStateAction<CoreMessage[]>>;
}

export interface AgentTurnContext {
  params: AgentSubmitParams;
  text: string;
  startTime: number;
  newHistory: CoreMessage[];
  internalContinuation: boolean;
}
