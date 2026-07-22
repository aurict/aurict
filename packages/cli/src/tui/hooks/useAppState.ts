import { useCallback, useEffect, useRef, useState } from "react";
import crypto from "node:crypto";
import {
  agentPool,
  type CompletionProof,
  type ContextUsage,
  type CoreMessage,
  type PermissionRequest,
  type PromptCacheHealthResult,
  type PromptDiagnostics,
  type QuestionRequest,
  type Task,
  type TokenBreakdown,
} from "@aurict/core";
import { CliRemoteRuntime, type CliRemoteStatus } from "../../remote/runtime.js";
import type { UpdateInfo } from "../../util/update-check.js";
import { DEFAULT_THEME, THEMES } from "../../utils/theme.js";
import { persistThemePreference } from "../../config/theme-preference.js";
import type { ComposerQueueItem } from "../composer-queue.js";
import type { DisplayMessage } from "../conversation/types.js";
import type { RunActivity } from "../run-status.js";
import type { AutoContinueState, LatestToolCall } from "../app/app-agent-submit-types.js";
import {
  ZERO_TOKENS,
  type Checkpoint,
  type ConversationBranch,
  type PickerRequest,
  type PromptRequest,
  type WatchedPath,
} from "../app/app-state-types.js";

interface AppStateOptions {
  initialProvider: string;
  initialModel: string;
  initialTheme: string;
  workdir: string;
  updatePromise: Promise<UpdateInfo | null> | undefined;
}

export function useAppState(options: AppStateOptions) {
  const [provider, setProviderState] = useState(options.initialProvider);
  const [model, setModelState] = useState(options.initialModel);
  const [effort, setEffort] = useState<number>();
  const [termCols, setTermCols] = useState(() => process.stdout.columns ?? 80);
  const [termRows, setTermRows] = useState(() => process.stdout.rows ?? 24);
  const [terminalMeasured, setTerminalMeasured] = useState(false);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const addSystemMsg = useCallback((content: string) => {
    setMessages((previous) => [
      ...previous,
      { role: "system", content, id: crypto.randomUUID() },
    ]);
  }, []);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [permissionQueue, setPermissionQueue] = useState<PermissionRequest[]>([]);
  const [question, setQuestion] = useState<QuestionRequest | null>(null);
  const [picker, setPicker] = useState<PickerRequest | null>(null);
  const [prompt, setPrompt] = useState<PromptRequest | null>(null);
  const [tokens, setTokens] = useState<TokenBreakdown>({
    input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0,
  });
  const [history, setHistory] = useState<CoreMessage[]>([]);
  const historyRef = useRef<CoreMessage[]>([]);
  const [skillNames, setSkillNames] = useState<string[]>([]);
  const [turnSkillNames, setTurnSkillNames] = useState<string[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [startupBannerVisible, setStartupBannerVisible] = useState(true);
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const [streamingReason, setStreamingReason] = useState<string | null>(null);
  const [streamingError, setStreamingError] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<string>();
  const [runActivity, setRunActivity] = useState<RunActivity>();
  const initialTheme = THEMES[options.initialTheme] ? options.initialTheme : DEFAULT_THEME;
  const [themeName, setThemeNameState] = useState(initialTheme);
  const themeNameRef = useRef(initialTheme);
  const setThemeName = useCallback((value: string | ((previous: string) => string)) => {
    const next = typeof value === "function" ? value(themeNameRef.current) : value;
    persistThemePreference(next);
    themeNameRef.current = next;
    setThemeNameState(next);
  }, []);
  const [sessionTitle, setSessionTitle] = useState<string>();
  const [isUndercover, setIsUndercover] = useState(false);
  const [coordinatorMode, setCoordinatorMode] = useState(true);
  const [activeAgent, setActiveAgent] = useState("omni");
  const [workdirState, setWorkdirState] = useState(options.workdir);
  const [composerQueue, setComposerQueue] = useState<ComposerQueueItem[]>([]);
  const [branch, setBranch] = useState<string>();
  const [wasCompacted, setWasCompacted] = useState(false);
  const [contextUsage, setContextUsage] = useState<ContextUsage>();
  const [completionProof, setCompletionProof] = useState<CompletionProof>();
  const [promptDiagnostics, setPromptDiagnostics] = useState<PromptDiagnostics>();
  const [promptCacheHealth, setPromptCacheHealth] = useState<PromptCacheHealthResult>();
  const [activeAgentCount, setActiveAgentCount] = useState(() => agentPool.active.length);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [autopilotMode, setAutopilotMode] = useState(false);
  const [projectAutoPromptOpen, setProjectAutoPromptOpen] = useState(true);
  const [recentCmds, setRecentCmds] = useState<string[]>([]);
  const [designInitialBrief, setDesignInitialBrief] = useState<string>();
  const [watchedPaths, setWatchedPaths] = useState<WatchedPath[]>([]);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [branches, setBranches] = useState<ConversationBranch[]>([{
    id: "main", name: "main", messages: [], history: [],
    tokens: ZERO_TOKENS, createdAt: Date.now(),
  }]);
  const [activeBranchIdx, setActiveBranchIdx] = useState(0);
  const [remoteStatus, setRemoteStatus] = useState<CliRemoteStatus | "off">("off");

  const submitRef = useRef<(value: string) => void>(() => {
    throw new Error("Submit controller is not initialized");
  });
  const autopilotRef = useRef(false);
  const watchCleanupRef = useRef<Map<string, () => void>>(new Map());
  const mainSessionId = useRef(crypto.randomUUID());
  const extractedRef = useRef(false);
  const isFirstMessage = useRef(true);
  const latestToolCallRef = useRef<LatestToolCall | null>(null);
  const btwFrameRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const skipSubmitRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const loadingRef = useRef(false);
  const autoContinueRef = useRef<AutoContinueState>({ needed: false, count: 0 });
  const autoContinueSubmittingRef = useRef(false);
  const remoteRuntimeRef = useRef<CliRemoteRuntime | null>(null);
  const remoteBridgeRef = useRef({
    start: () => { throw new Error("Remote controller is not initialized"); },
    stop: () => { throw new Error("Remote controller is not initialized"); },
  });
  const streamTextRef = useRef("");
  const streamReasonRef = useRef("");
  const streamTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tokenRateRef = useRef(80);
  const lastTokenTimeRef = useRef(0);
  const turnHadToolRef = useRef(false);
  const turnAssistantIdRef = useRef<string | null>(null);

  useEffect(() => { historyRef.current = history; }, [history]);
  useEffect(() => { autopilotRef.current = autopilotMode; }, [autopilotMode]);
  useEffect(() => {
    if (!options.updatePromise) return;
    void options.updatePromise
      .then((info) => { if (info) setUpdateInfo(info); })
      .catch((error) => {
        const message = error instanceof Error ? error.message : String(error);
        addSystemMsg(`⚠ Update check failed: ${message}`);
      });
  }, [addSystemMsg, options.updatePromise]);

  return {
    provider, setProviderState, model, setModelState, effort, setEffort,
    termCols, setTermCols, termRows, setTermRows, terminalMeasured, setTerminalMeasured,
    messages, setMessages, addSystemMsg, input, setInput, loading, setLoading,
    permissionQueue, setPermissionQueue, permission: permissionQueue[0] ?? null,
    question, setQuestion, picker, setPicker, prompt, setPrompt, tokens, setTokens,
    history, setHistory, historyRef, skillNames, setSkillNames, turnSkillNames,
    setTurnSkillNames, tasks, setTasks, commandHistory, setCommandHistory,
    startupBannerVisible, setStartupBannerVisible, streamingText, setStreamingText,
    streamingReason, setStreamingReason, streamingError, setStreamingError,
    activeTool, setActiveTool, runActivity, setRunActivity, themeName, setThemeName,
    sessionTitle, setSessionTitle, isUndercover, setIsUndercover, coordinatorMode,
    setCoordinatorMode, activeAgent, setActiveAgent, workdirState, setWorkdirState,
    composerQueue, setComposerQueue, branch, setBranch, wasCompacted, setWasCompacted,
    contextUsage, setContextUsage, completionProof, setCompletionProof,
    promptDiagnostics, setPromptDiagnostics,
    promptCacheHealth, setPromptCacheHealth, activeAgentCount, setActiveAgentCount,
    updateInfo, autopilotMode, setAutopilotMode, projectAutoPromptOpen,
    setProjectAutoPromptOpen, recentCmds, setRecentCmds,
    designInitialBrief, setDesignInitialBrief, watchedPaths, setWatchedPaths,
    checkpoints, setCheckpoints, branches, setBranches, activeBranchIdx,
    setActiveBranchIdx, remoteStatus, setRemoteStatus,
    submitRef, autopilotRef, watchCleanupRef, mainSessionId, extractedRef,
    isFirstMessage, latestToolCallRef, btwFrameRef, skipSubmitRef,
    abortControllerRef, loadingRef, autoContinueRef, autoContinueSubmittingRef,
    remoteRuntimeRef, remoteBridgeRef, streamTextRef, streamReasonRef,
    streamTimerRef, tokenRateRef, lastTokenTimeRef, turnHadToolRef,
    turnAssistantIdRef,
  };
}
