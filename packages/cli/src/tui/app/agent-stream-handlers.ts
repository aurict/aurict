import { snapshotManager } from "@aurict/core";
import type { AgentRunOptions } from "@aurict/core";
import { RemoteEventTypes } from "../../remote/event-codec.js";
import { visibleLiveStream } from "../conversation/live-stream.js";
import type { AssistantContentBlock, DisplayMessage } from "../conversation/types.js";
import { MAX_CHECKPOINTS } from "./app-state-types.js";
import type { AgentTurnContext } from "./app-agent-submit-types.js";

type StreamHandlers = Pick<
  AgentRunOptions,
  | "onText"
  | "onChunk"
  | "onToolCall"
  | "onStepFinish"
  | "onToolResult"
  | "onStreamRestart"
  | "onSkillsActivated"
  | "onPromptDiagnostics"
  | "onPromptCacheHealth"
  | "onPhase"
>;

export function buildAgentStreamHandlers(context: AgentTurnContext): StreamHandlers {
  const { params } = context;
  const publishRemote = (type: string, payload: Record<string, unknown>) => {
    const runtime = params.remoteRuntimeRef.current;
    if (!runtime) return;
    void runtime.publish(type, payload).catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      params.addSystemMsg(`Remote event gönderilemedi: ${message}`);
    });
  };
  const flushStream = () => {
    params.streamTimerRef.current = null;
    if (params.streamTextRef.current || params.streamReasonRef.current) {
      publishRemote(RemoteEventTypes.terminalOutput, {
        text: params.streamTextRef.current,
        reasoning: params.streamReasonRef.current,
      });
    }
    if (params.scrollLockedRef.current) return;
    const visible = visibleLiveStream({
      text: params.streamTextRef.current,
      reasoning: params.streamReasonRef.current,
    });
    params.setStreamingText(visible.text);
    params.setStreamingReason(visible.reasoning);
  };

  return {
    onText: (delta, isReasoning) => {
      params.setRunActivity(isReasoning ? "thinking" : "responding");
      const now = Date.now();
      const deltaMs = now - params.lastTokenTimeRef.current;
      if (deltaMs > 0 && deltaMs < 3_000) {
        params.tokenRateRef.current =
          0.8 * params.tokenRateRef.current + 0.2 * (1_000 / deltaMs);
      }
      params.lastTokenTimeRef.current = now;
      if (isReasoning) params.streamReasonRef.current += delta;
      else params.streamTextRef.current += delta;

      const rate = params.tokenRateRef.current;
      const delay = params.scrollLockedRef.current
        ? 2_000
        : rate > 40
          ? 80
          : rate > 15
            ? 100
            : rate > 5
              ? 120
              : 200;
      if (params.streamTimerRef.current) clearTimeout(params.streamTimerRef.current);
      params.streamTimerRef.current = setTimeout(flushStream, delay);
    },
    onChunk: (chunk) => {
      params.setMessages((previous) => {
        const stableId = params.turnAssistantIdRef.current;
        if (stableId) {
          const messageIndex = previous.findIndex((message) => message.id === stableId);
          const message = previous[messageIndex];
          if (message?.blocks) {
            for (let index = message.blocks.length - 1; index >= 0; index--) {
              const block = message.blocks[index]!;
              if (block.type !== "tool" || !block.pending) continue;
              const combined = (block.resultContent ?? "") + chunk;
              const next = [...previous];
              const blocks = [...message.blocks];
              blocks[index] = {
                ...block,
                resultContent: combined.length > 50_000 ? combined.slice(-50_000) : combined,
              };
              next[messageIndex] = { ...message, blocks };
              return next;
            }
          }
        }
        const pendingIndex = previous.reduceRight<number>(
          (found, message, index) =>
            found !== -1 || message.role !== "tool_call" || !message.pending
              ? found
              : index,
          -1,
        );
        if (pendingIndex === -1) return previous;
        const next = [...previous];
        const message = next[pendingIndex]!;
        const combined = (message.resultContent ?? "") + chunk;
        next[pendingIndex] = {
          ...message,
          resultContent: combined.length > 50_000 ? combined.slice(-50_000) : combined,
        };
        return next;
      });
    },
    onToolCall: (toolCall) => {
      params.setRunActivity("using_tool");
      publishRemote(RemoteEventTypes.toolCall, {
        id: toolCall.id,
        tool: toolCall.tool,
        args: toolCall.args,
      });
      if (params.streamTimerRef.current) {
        clearTimeout(params.streamTimerRef.current);
        params.streamTimerRef.current = null;
      }
      params.turnHadToolRef.current = true;
      const textBefore = params.streamTextRef.current;
      const reasonBefore = params.streamReasonRef.current;
      params.streamTextRef.current = "";
      params.streamReasonRef.current = "";
      params.setStreamingText(null);
      params.setStreamingReason(null);
      params.setActiveTool(toolCall.tool);
      params.latestToolCallRef.current = {
        id: toolCall.id,
        tool: toolCall.tool,
        content: JSON.stringify(toolCall.args, null, 2),
      };
      const toolBlock: AssistantContentBlock = {
        type: "tool",
        id: toolCall.id || crypto.randomUUID(),
        tool: toolCall.tool,
        args: JSON.stringify(toolCall.args, null, 2),
        pending: true,
      };
      const stableAssistantId = params.turnAssistantIdRef.current;
      const newAssistantId = stableAssistantId ?? crypto.randomUUID();
      if (!stableAssistantId) params.turnAssistantIdRef.current = newAssistantId;
      params.setMessages((previous) => {
        if (stableAssistantId) {
          const index = previous.findIndex((message) => message.id === stableAssistantId);
          if (index === -1) return previous;
          const existing = previous[index]!;
          const blocks: AssistantContentBlock[] = [...(existing.blocks ?? [])];
          if (textBefore || reasonBefore) {
            blocks.push({
              type: "text",
              content: textBefore,
              ...(reasonBefore ? { reasoningContent: reasonBefore } : {}),
            });
          }
          blocks.push(toolBlock);
          const next = [...previous];
          next[index] = { ...existing, blocks };
          return next;
        }

        const next = [...previous];
        const last = next[next.length - 1];
        if (last?.role === "assistant" && last.pending && !last.content &&
            !last.reasoningContent && !last.blocks) next.pop();
        const blocks: AssistantContentBlock[] = [];
        if (textBefore || reasonBefore) {
          blocks.push({
            type: "text",
            content: textBefore,
            ...(reasonBefore ? { reasoningContent: reasonBefore } : {}),
          });
        }
        blocks.push(toolBlock);
        next.push({
          id: newAssistantId,
          role: "assistant",
          content: "",
          blocks,
          pending: true,
          timestamp: Date.now(),
        });
        return next;
      });
    },
    onStepFinish: () => {
      params.setRunActivity("waiting_for_provider");
      const stableId = params.turnAssistantIdRef.current;
      params.setMessages((previous) => {
        if (stableId) {
          const index = previous.findIndex((message) => message.id === stableId);
          const message = previous[index];
          if (message?.blocks) {
            const next = [...previous];
            next[index] = {
              ...message,
              blocks: message.blocks.map((block) =>
                block.type === "tool" && block.pending
                  ? { ...block, pending: false }
                  : block,
              ),
            };
            return next;
          }
        }
        return previous.map((message) =>
          message.role === "tool_call" && message.pending
            ? { ...message, pending: false }
            : message,
        );
      });
      params.setActiveTool(undefined);
      const maxResult = 10_000;
      const checkpointMessages = params.messages.map((message) => ({
        ...message,
        ...(message.blocks ? {
          blocks: message.blocks.map((block) =>
            block.type === "tool" && block.resultContent && block.resultContent.length > maxResult
              ? { ...block, resultContent: `${block.resultContent.slice(0, maxResult)}\n[truncated in checkpoint]` }
              : block,
          ),
        } : {}),
        ...(!message.blocks && message.resultContent && message.resultContent.length > maxResult
          ? { resultContent: `${message.resultContent.slice(0, maxResult)}\n[truncated in checkpoint]` }
          : {}),
      }));
      params.setCheckpoints((previous) => [
        ...previous.slice(-(MAX_CHECKPOINTS - 1)),
        {
          mark: snapshotManager.mark(),
          messages: checkpointMessages,
          history: params.history.slice(),
          label: `step ${params.checkpoints.length + 1}`,
        },
      ]);
    },
    onToolResult: (toolResult) => {
      const rawResult = typeof toolResult.result === "object"
        ? JSON.stringify(toolResult.result)
        : String(toolResult.result);
      publishRemote(RemoteEventTypes.toolResultSummary, {
        id: toolResult.id,
        durationMs: toolResult.durationMs,
        summary: rawResult.length > 2_000 ? `${rawResult.slice(0, 2_000)}…` : rawResult,
      });
      const displayResult = rawResult.length > 50_000
        ? `${rawResult.slice(0, 50_000)}\n\n[... ${(rawResult.length - 50_000).toLocaleString()} chars truncated]`
        : rawResult;
      params.setMessages((previous) => updateToolResult(previous, toolResult, displayResult, rawResult, params));
    },
    onStreamRestart: () => {
      if (params.streamTimerRef.current) clearTimeout(params.streamTimerRef.current);
      params.streamTimerRef.current = null;
      params.streamTextRef.current = "";
      params.streamReasonRef.current = "";
      params.setStreamingText(null);
      params.setStreamingReason(null);
    },
    onSkillsActivated: (skills) => params.setTurnSkillNames(skills.map((skill) => skill.id)),
    onPromptDiagnostics: params.setPromptDiagnostics,
    onPromptCacheHealth: params.setPromptCacheHealth,
    onPhase: params.setRunActivity,
  };
}

function updateToolResult(
  messages: DisplayMessage[],
  toolResult: Parameters<NonNullable<AgentRunOptions["onToolResult"]>>[0],
  displayResult: string,
  rawResult: string,
  params: AgentTurnContext["params"],
) {
  const next = [...messages];
  const stableId = params.turnAssistantIdRef.current;
  const messageIndex = stableId ? next.findIndex((message) => message.id === stableId) : -1;
  const message = next[messageIndex];
  const blockIndex = message?.blocks?.findIndex(
    (block) => block.type === "tool" && block.id === toolResult.id,
  ) ?? -1;
  if (message?.blocks && blockIndex !== -1) {
    const block = message.blocks[blockIndex]!;
    if (block.type === "tool") {
      const blocks = [...message.blocks];
      blocks[blockIndex] = {
        ...block,
        pending: false,
        resultContent: displayResult,
        durationMs: toolResult.durationMs,
        artifact: toolResult.artifact,
      };
      next[messageIndex] = { ...message, blocks };
      params.latestToolCallRef.current = { id: toolResult.id, tool: block.tool, content: rawResult };
      return next;
    }
  }
  const callIndex = next.findIndex(
    (candidate) => candidate.role === "tool_call" && candidate.id === toolResult.id,
  );
  const call = next[callIndex];
  if (call) {
    next[callIndex] = {
      ...call,
      pending: false,
      resultContent: displayResult,
      durationMs: toolResult.durationMs,
      artifact: toolResult.artifact,
    };
    params.latestToolCallRef.current = {
      id: toolResult.id,
      tool: call.tool ?? "tool",
      content: rawResult,
    };
  } else {
    next.push({
      id: crypto.randomUUID(),
      role: "tool_result",
      content: displayResult,
      pending: false,
    });
  }
  return next;
}
