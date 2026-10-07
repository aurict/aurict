import {
  calculateCostUsd,
  extractAndStoreMemories,
  metrics,
  notifyTaskDone,
} from "@aurict/core";
import type { AgentRunOptions, CoreMessage } from "@aurict/core";
import type { DisplayMessage, TurnStats } from "../conversation/types.js";
import { contextLimitNotice, formatCompactionEvent } from "../context-usage-format.js";
import type { AgentTurnContext } from "./app-agent-submit-types.js";
import { resolvePersistentTurnHistory } from "./agent-history.js";

type CompletionHandlers = Pick<
  AgentRunOptions,
  "onCompaction" | "onProviderFallback" | "onFinish"
>;

export function buildAgentCompletionHandlers(
  context: AgentTurnContext,
): CompletionHandlers {
  const { params } = context;
  return {
    onCompaction: (event) => {
      params.setWasCompacted(true);
      setTimeout(() => params.setWasCompacted(false), 8_000);
      params.setContextUsage(event.after);
      params.addSystemMsg(formatCompactionEvent(event));
      params.extractedRef.current = false;
    },
    onProviderFallback: (fromProvider, toProvider) => {
      params.addSystemMsg(`⚠ ${fromProvider} unavailable — switched to ${toProvider}`);
    },
    onFinish: (result) => finishTurn(context, result),
  };
}

function finishTurn(
  context: AgentTurnContext,
  result: Parameters<NonNullable<AgentRunOptions["onFinish"]>>[0],
): void {
  const { params, text, startTime, newHistory } = context;
  if (params.streamTimerRef.current) clearTimeout(params.streamTimerRef.current);
  params.streamTimerRef.current = null;
  const finalSegmentText = params.turnHadToolRef.current
    ? params.streamTextRef.current
    : result.text;
  const finalReason = params.streamReasonRef.current;
  const stableAssistantId = params.turnAssistantIdRef.current;
  params.streamTextRef.current = "";
  params.streamReasonRef.current = "";
  params.setStreamingText(null);
  params.setStreamingReason(null);
  params.setTokens((previous) => ({
    input: previous.input + result.tokens.input,
    output: previous.output + result.tokens.output,
    cacheRead: previous.cacheRead + result.tokens.cacheRead,
    cacheWrite: previous.cacheWrite + result.tokens.cacheWrite,
    reasoning: previous.reasoning + result.tokens.reasoning,
  }));
  params.setContextUsage(result.contextUsage);
  if (result.contextUsage.effectiveTokens >= result.contextUsage.compactionThreshold) {
    params.addSystemMsg(contextLimitNotice(result.contextUsage));
  }
  const updatedHistory = resolvePersistentTurnHistory({
    currentHistory: params.historyRef.current,
    submittedHistory: newHistory,
    ...(result.compactedMessages ? { compactedMessages: result.compactedMessages } : {}),
    newMessages: result.newMessages,
    internalContinuation: context.internalContinuation,
    submittedPrompt: text,
  }) as CoreMessage[];
  const duration = Date.now() - startTime;
  if (duration > 15_000 && !context.internalContinuation) notifyTaskDone(text, duration);
  if (!params.extractedRef.current) {
    params.extractedRef.current = true;
    void extractAndStoreMemories(
      params.provider,
      params.model,
      updatedHistory,
      params.workdir,
    ).catch(() => metrics.recordError("memory_extract"));
  }
  params.historyRef.current = updatedHistory;
  params.setHistory(updatedHistory);
  const turnStats: TurnStats = {
    durationMs: Date.now() - startTime,
    tokens: result.tokens.input + result.tokens.output + result.tokens.cacheRead + result.tokens.cacheWrite,
    costUsd: calculateCostUsd(params.model, result.tokens),
  };
  params.setMessages((previous) => withTurnStats(mergeFinishedAssistantMessage(
    previous,
    stableAssistantId,
    finalSegmentText,
    finalReason,
  ), turnStats));
  const proof = result.completionProof;
  params.setCompletionProof(proof);
  if (proof && proof.status !== "not_applicable" && !result.completionGate?.shouldAutoContinue) {
    const completed = proof.criteria.filter((criterion) => criterion.status === "passed" || criterion.status === "waived").length;
    params.addSystemMsg(
      `Proof ${proof.status}: ${completed}/${proof.criteria.length} criteria, ${proof.evidenceCount} evidence record${proof.evidenceCount === 1 ? "" : "s"}. Use /proof for details.`,
    );
  }
  params.autoContinueRef.current = resolveAutoContinue(context, result);
}

/** Stats ride on the same update that settles the turn, so inline scrollback never sees them change. */
function withTurnStats(messages: DisplayMessage[], stats: TurnStats): DisplayMessage[] {
  for (let index = messages.length - 1; index >= 0; index--) {
    const message = messages[index]!;
    if (message.role === "user") break;
    if (message.role !== "assistant") continue;
    const next = [...messages];
    next[index] = { ...message, turnStats: stats };
    return next;
  }
  return messages;
}

function mergeFinishedAssistantMessage(
  messages: DisplayMessage[],
  stableAssistantId: string | null,
  finalText: string,
  finalReason: string,
): DisplayMessage[] {
  const next = messages.map((message) =>
    message.pending ? { ...message, pending: false } : message,
  );
  const reasoning = finalReason ? { reasoningContent: finalReason } : {};
  if (stableAssistantId) {
    const index = next.findIndex((message) => message.id === stableAssistantId);
    const existing = next[index];
    if (existing?.blocks) {
      next[index] = {
        ...existing,
        pending: false,
        blocks: finalText
          ? [...existing.blocks, { type: "text", content: finalText, ...reasoning }]
          : existing.blocks,
      };
      return next;
    }
    if (existing) {
      next[index] = { ...existing, role: "assistant", pending: false, ...reasoning };
      if (finalText) {
        next.push({
          id: crypto.randomUUID(),
          role: "assistant",
          content: finalText,
          pending: false,
          timestamp: Date.now(),
          ...reasoning,
        });
      }
      return next;
    }
  }

  const last = next[next.length - 1];
  if ((finalText || finalReason) && last?.role !== "assistant") {
    next.push({
      id: crypto.randomUUID(),
      role: "assistant",
      content: finalText,
      pending: false,
      ...reasoning,
    });
  } else if (last?.role === "assistant") {
    next[next.length - 1] = {
      ...last,
      content: finalText,
      pending: false,
      ...reasoning,
    };
  }
  return next;
}

function resolveAutoContinue(
  context: AgentTurnContext,
  result: Parameters<NonNullable<AgentRunOptions["onFinish"]>>[0],
) {
  if (result.continuation?.shouldContinue) {
    return {
      needed: true,
      count: result.continuation.nextContinuationCount,
      ...(result.longTask?.nudge ? { prompt: result.longTask.nudge } : {}),
    };
  }
  if (result.completionGate?.shouldAutoContinue && !result.completionGate.shadowOnly) {
    return {
      needed: true,
      count: context.params.autoContinueRef.current.count + 1,
      ...(result.longTask?.nudge ? { prompt: result.longTask.nudge } : {}),
    };
  }
  return { needed: false, count: context.params.autoContinueRef.current.count };
}
