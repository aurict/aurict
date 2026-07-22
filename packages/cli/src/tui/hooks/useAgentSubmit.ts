import { useCallback, useEffect } from "react";
import {
  extractAndStoreMemories,
  getSessionAgent,
  loadConfig,
  metrics,
  notifyError,
  parseProviderError,
  runAgent,
  taskManager,
} from "@aurict/core";
import type { CoreMessage } from "@aurict/core";
import { RemoteEventTypes } from "../../remote/event-codec.js";
import { clearDraft } from "../../util/draft.js";
import { AUTO_CONTINUE_PROMPT } from "../auto-continue.js";
import { addComposerItem, takeComposerItem } from "../composer-queue.js";
import { presentTranscriptError } from "../conversation/error-presentation.js";
import { buildAgentCompletionHandlers } from "../app/agent-completion-handlers.js";
import { buildAgentStreamHandlers } from "../app/agent-stream-handlers.js";
import type { AgentSubmitParams, AgentTurnContext } from "../app/app-agent-submit-types.js";
import { resolveBackendAccessToken } from "../app/app-environment.js";
import { prepareUserInput } from "../app/prepare-user-input.js";

export function useAgentSubmit(params: AgentSubmitParams) {
  const publishAgentStatus = useCallback((state: "working" | "idle") => {
    const runtime = params.remoteRuntimeRef.current;
    if (!runtime) return;
    void runtime.publish(RemoteEventTypes.agentStatus, { state }).catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      params.addSystemMsg(`Remote durum güncellemesi gönderilemedi: ${message}`);
    });
  }, [params]);

  const handleSubmit = useCallback(async (userInput: string) => {
    if (params.skipSubmitRef.current) {
      params.skipSubmitRef.current = false;
      return;
    }
    const rawText = userInput.trim();
    if (!rawText) return;
    params.setStartupBannerVisible(false);
    params.setScrollLocked(false);
    params.setConversationOffsetRows(0);
    const autoContinueSubmit = params.autoContinueSubmittingRef.current;
    params.autoContinueSubmittingRef.current = false;
    if (!autoContinueSubmit) params.autoContinueRef.current.count = 0;

    params.setInput("");
    clearDraft();
    if (params.loading) {
      params.setComposerQueue((items) => addComposerItem(items, {
        id: crypto.randomUUID(),
        kind: "steer",
        text: rawText,
      }));
      return;
    }
    const prepared = await prepareUserInput(rawText, params.workdir);
    for (const warning of prepared.warnings) params.addSystemMsg(`⚠ ${warning}`);
    const text = prepared.text;
    const turnAttachments = [...params.attachments, ...prepared.attachments];
    if (params.executeCommand(text)) return;
    if (!text && turnAttachments.length === 0) return;
    const continuationDefaults = readContinuationDefaults(params);

    params.setCommandHistory((previous) => [...previous, text]);
    updateFirstMessageTitle(params, text);
    params.setStreamingError(null);
    params.setTurnSkillNames([]);
    params.setRunActivity("preparing_context");
    const startTime = Date.now();
    const controller = new AbortController();
    params.abortControllerRef.current = controller;
    params.setLoading(true);
    publishAgentStatus("working");
    params.turnHadToolRef.current = false;
    params.turnAssistantIdRef.current = null;

    const userMessage: CoreMessage = { role: "user", content: text };
    params.setMessages((previous) => [
      ...previous,
      { role: "user", content: text, timestamp: Date.now(), id: crypto.randomUUID() },
      { role: "assistant", content: "", pending: true, timestamp: Date.now(), id: crypto.randomUUID() },
    ]);
    const newHistory = [...params.historyRef.current, userMessage];
    const context: AgentTurnContext = { params, text, startTime, newHistory };

    try {
      const agent = getSessionAgent(params.activeAgent, params.workdir);
      const taskScope = taskManager.configureScope(params.workdir, params.mainSessionId.current);
      const effectiveSystem = [agent.system || null, params.system]
        .filter(Boolean)
        .join("\n\n---\n\n");
      await runAgent({
        provider: params.provider,
        model: params.model,
        workdir: params.workdir,
        sessionId: params.mainSessionId.current,
        backendAccessTokenResolver: resolveBackendAccessToken,
        ...(effectiveSystem ? { system: effectiveSystem } : {}),
        coordinatorMode: params.coordinatorMode,
        undercover: params.undercover,
        ...(params.effort !== undefined ? { effort: params.effort } : {}),
        ...(agent.allowedTools ? { toolsOverride: agent.allowedTools } : {}),
        messages: newHistory,
        signal: controller.signal,
        ...(turnAttachments.length > 0 ? { attachments: turnAttachments } : {}),
        continuation: {
          getTasks: () => taskManager.getTasks(taskScope),
          previousContinuations: params.autoContinueRef.current.count,
          maxContinuations: continuationDefaults.maxContinuations ?? 5,
          maxTaskContinuations: continuationDefaults.maxTaskContinuations ?? 15,
        },
        ...buildAgentStreamHandlers(context),
        ...buildAgentCompletionHandlers(context),
      });
    } catch (error) {
      handleTurnError(context, error);
    } finally {
      finalizeTurn(params, publishAgentStatus);
    }
  }, [params, publishAgentStatus]);

  useEffect(() => {
    params.submitRef.current = (value) => { void handleSubmit(value); };
  }, [handleSubmit, params.submitRef]);

  const handleQueue = useCallback((value: string) => {
    const text = value.trim();
    if (!text || !params.loading) return;
    params.setInput("");
    clearDraft();
    params.setComposerQueue((items) => addComposerItem(items, {
      id: crypto.randomUUID(),
      kind: "queued",
      text,
    }));
  }, [params]);

  return { handleSubmit, handleQueue };
}

function readContinuationDefaults(params: AgentSubmitParams) {
  try {
    return loadConfig(params.workdir).defaults ?? {};
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    params.addSystemMsg(`⚠ Continuation ayarları okunamadı; varsayılanlar kullanılıyor: ${message}`);
    return {};
  }
}

function updateFirstMessageTitle(params: AgentSubmitParams, text: string): void {
  if (!params.isFirstMessage.current) return;
  params.isFirstMessage.current = false;
  const words = text
    .replace(/[^\w\s]/g, " ")
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 2);
  params.setSessionTitle(words.slice(0, 5).join(" ").slice(0, 45) || "New Session");
}

function handleTurnError(context: AgentTurnContext, error: unknown): void {
  const { params, text, startTime, newHistory } = context;
  if (params.streamTimerRef.current) clearTimeout(params.streamTimerRef.current);
  params.streamTimerRef.current = null;
  const partialText = params.streamTextRef.current;
  const partialReason = params.streamReasonRef.current;
  params.streamTextRef.current = "";
  params.streamReasonRef.current = "";
  const errorMessage = parseProviderError(error);
  params.setStreamingError(null);
  params.setStreamingText(null);
  params.setStreamingReason(null);
  params.setMessages((previous) => {
    const next = previous.map((message) =>
      message.pending ? { ...message, pending: false } : message,
    );
    if (partialText || partialReason) {
      const last = next[next.length - 1];
      const segment = {
        content: partialText,
        pending: false,
        ...(partialReason ? { reasoningContent: partialReason } : {}),
      };
      if (last?.role === "assistant" && !last.content && !last.reasoningContent) {
        next[next.length - 1] = { ...last, ...segment };
      } else {
        next.push({
          id: crypto.randomUUID(),
          role: "assistant",
          timestamp: Date.now(),
          ...segment,
        });
      }
    }
    next.push({
      id: crypto.randomUUID(),
      role: "error",
      content: errorMessage,
      errorPresentation: presentTranscriptError(errorMessage),
    });
    return next;
  });
  if (Date.now() - startTime > 15_000) notifyError(text);
  if (!params.extractedRef.current && newHistory.length >= 4) {
    params.extractedRef.current = true;
    void extractAndStoreMemories(
      params.provider,
      params.model,
      newHistory,
      params.workdir,
    ).catch(() => metrics.recordError("memory_extract"));
  }
}

function finalizeTurn(
  params: AgentSubmitParams,
  publishAgentStatus: (state: "working" | "idle") => void,
): void {
  params.setLoading(false);
  params.setRunActivity(undefined);
  publishAgentStatus("idle");
  params.setActiveTool(undefined);
  params.turnHadToolRef.current = false;
  params.setTurnSkillNames([]);
  params.abortControllerRef.current = null;
  params.setAttachments([]);
  params.setComposerQueue((items) => {
    const { item, remaining } = takeComposerItem(items);
    const autoMessage = item === undefined && params.autoContinueRef.current.needed
      ? (params.autoContinueRef.current.prompt ?? AUTO_CONTINUE_PROMPT)
      : undefined;
    params.autoContinueRef.current.needed = false;
    delete params.autoContinueRef.current.prompt;
    const nextInput = item?.text ?? autoMessage;
    if (nextInput) {
      if (autoMessage) params.autoContinueSubmittingRef.current = true;
      setTimeout(() => params.submitRef.current(nextInput), 80);
    }
    return remaining;
  });
}
