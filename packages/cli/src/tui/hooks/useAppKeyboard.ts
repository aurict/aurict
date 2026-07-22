import { useRef } from "react";
import crypto from "node:crypto";
import {
  PermissionGate,
  PlanGate,
  SessionManager,
  agentPool,
  getAllSessionAgents,
} from "@aurict/core";
import { useInput } from "../design-system/renderer.js";
import { readClipboard } from "../../util/clipboard.js";
import { writeClipboard } from "../../util/clipboard.js";
import { lastAssistantCodeBlock, lastAssistantText } from "../conversation/transcript-export.js";
import type { AppKeyboardParams } from "../app/app-keyboard-types.js";
import { TURN_CANCELLED_NOTICE } from "../app/cancellation-feedback.js";
import {
  closeFocusedLayer,
  togglePrimaryOverlay,
} from "../app/app-keyboard-actions.js";

export function useAppKeyboard(params: AppKeyboardParams): void {
  const ctrlCCountRef = useRef(0);
  const ctrlCTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const overlay = params.overlay;

  useInput((input, key) => {
    if (key.ctrl && input === "c") {
      if (
        params.focusLayer !== "ready" &&
        params.focusLayer !== "streaming" &&
        !params.loadingRef.current
      ) {
        closeFocusedLayer(params);
        ctrlCCountRef.current = 0;
        if (ctrlCTimerRef.current) clearTimeout(ctrlCTimerRef.current);
        return;
      }
      if (params.loadingRef.current && params.abortControllerRef.current) {
        params.abortControllerRef.current.abort();
        params.abortControllerRef.current = null;
        PermissionGate.cancelPending();
        PlanGate.cancelPending();
        overlay.setPlanRequest(null);
        params.setPermissionQueue([]);
        params.setMessages((messages) =>
          messages.map((message) =>
            message.pending ? { ...message, pending: false } : message,
          ),
        );
        params.setStreamingText(null);
        params.setStreamingReason(null);
        params.setScrollLocked(false);
        params.setConversationOffsetRows(0);
        params.addSystemMsg(TURN_CANCELLED_NOTICE);
        return;
      }
      ctrlCCountRef.current += 1;
      if (ctrlCTimerRef.current) clearTimeout(ctrlCTimerRef.current);
      if (ctrlCCountRef.current >= 2) {
        agentPool.active.forEach((agent) => agentPool.cancel(agent.id));
        params.exit();
        return;
      }
      params.setConversationOffsetRows(0);
      params.addSystemMsg("Press Ctrl+C again to exit.");
      ctrlCTimerRef.current = setTimeout(() => {
        ctrlCCountRef.current = 0;
      }, 3000);
      return;
    }

    if (key.escape) {
      if (closeFocusedLayer(params)) return;
      if (params.updateAvailable && overlay.updateDismissed === false) {
        overlay.setUpdateDismissed(true);
        return;
      }
      if (params.inputRef.current.length > 0) {
        params.setInput("");
        return;
      }
      if (!params.loading) params.exit();
      return;
    }

    if (params.focusLayer === "attach") {
      if (key.return) {
        void params.handleAttachSubmit(overlay.attachPath);
        return;
      }
      if (key.backspace || key.delete) {
        overlay.setAttachPath((path) => path.slice(0, -1));
        return;
      }
      if (input && !key.ctrl && !key.meta) {
        overlay.setAttachPath((path) => path + input);
      }
      return;
    }

    if (params.focusLayer === "subagent" && (key.leftArrow || key.rightArrow)) {
      const sessions = SessionManager.list()
        .filter((session) => session.parentId === params.mainSessionId.current)
        .sort((left, right) => left.createdAt - right.createdAt);
      if (!sessions.length) return;
      const index = sessions.findIndex(
        (session) => session.id === overlay.viewingSubagentId,
      );
      const next = key.leftArrow
        ? sessions[(index - 1 + sessions.length) % sessions.length]!
        : sessions[(index + 1) % sessions.length]!;
      overlay.setViewingSubagentId(next.id);
      return;
    }

    if (key.ctrl && input === "l") {
      params.setScrollLocked((locked) => {
        const next = !locked;
        if (!next) {
          params.setStreamingText(params.streamTextRef.current || null);
          params.setStreamingReason(params.streamReasonRef.current || null);
        }
        return next;
      });
      return;
    }

    if (key.ctrl && input === "k") {
      const active = agentPool.active;
      if (active.length > 0) {
        active.forEach((agent) => agentPool.cancel(agent.id));
        params.addSystemMsg(
          `Killed ${active.length} subagent${active.length === 1 ? "" : "s"}`,
        );
      }
      return;
    }

    if (params.focusLayer !== "ready" && params.focusLayer !== "streaming") {
      return;
    }
    if (key.ctrl && input === "g") {
      params.openExternalEditor();
      return;
    }
    if (key.shift && key.upArrow) {
      params.scrollConversation(3);
      return;
    }
    if (key.shift && key.downArrow) {
      params.scrollConversation(-3);
      return;
    }
    if ((key as typeof key & { pageUp?: boolean }).pageUp) {
      params.pageConversation(1);
      return;
    }
    if ((key as typeof key & { pageDown?: boolean }).pageDown) {
      params.pageConversation(-1);
      return;
    }
    if (key.ctrl && input === "b") {
      params.setConversationOffsetRows(1_000_000);
      return;
    }
    if (key.ctrl && input === "n") {
      params.setConversationOffsetRows(0);
      return;
    }

    if ((key.ctrl || key.meta) && input === "y") {
      const content = key.meta
        ? lastAssistantCodeBlock(params.messages)
        : lastAssistantText(params.messages);
      if (!content) {
        params.addSystemMsg(key.meta ? "No code block to copy." : "No assistant response to copy.");
        return;
      }
      writeClipboard(content);
      params.addSystemMsg(`Copied ${key.meta ? "last code block" : "last response"} (${content.length.toLocaleString()} chars).`);
      return;
    }

    if (key.ctrl && input === "t") {
      if (params.tasks.length > 0) togglePrimaryOverlay("taskPanel", params);
      return;
    }
    if (key.ctrl && input.toLowerCase() === "f") {
      togglePrimaryOverlay(key.shift ? "quickSearch" : "transcriptSearch", params);
      return;
    }
    if (key.ctrl && input === "r") {
      if (params.commandHistory.length > 0) {
        togglePrimaryOverlay("historySearch", params);
      }
      return;
    }
    if (key.ctrl && input === "p") {
      togglePrimaryOverlay("commandPalette", params);
      return;
    }
    if (key.ctrl && input === "v") {
      if (params.loading) return;
      const clipboard = readClipboard();
      if (clipboard.type === "image") {
        params.setAttachments((attachments) => [
          ...attachments,
          {
            type: "image",
            name: clipboard.name,
            base64: clipboard.base64,
            mimeType: clipboard.mimeType,
          },
        ]);
        params.addSystemMsg(`📎 Image pasted from clipboard: ${clipboard.name}`);
      } else if (clipboard.type === "text" && clipboard.text) {
        params.setInput((value) => value + clipboard.text);
      } else if (clipboard.type === "error") {
        params.addSystemMsg(`⚠ Clipboard: ${clipboard.message}`);
      } else {
        params.addSystemMsg("Clipboard is empty.");
      }
      return;
    }
    if (key.ctrl && input === "s") {
      togglePrimaryOverlay("settings", params);
      return;
    }
    if (key.ctrl && input === "e") {
      if (params.loading || overlay.editingMsg) return;
      const userMessages = params.messages
        .map((message, index) => ({ message, index }))
        .filter(({ message }) => message.role === "user" && !message.pending);
      const last = userMessages.at(-1);
      if (!last) return;
      overlay.closePrimaryOverlays();
      overlay.setEditingMsg({
        id: last.message.id ?? "",
        content: last.message.content,
        msgIndex: last.index,
      });
      return;
    }
    if (key.ctrl && input === "a") {
      togglePrimaryOverlay("attach", params);
      return;
    }
    if (key.ctrl && input === "o") {
      if (!overlay.expandedContent && !overlay.btwState) {
        const selected = params.transcriptDetails.find(
          (detail) => detail.id === params.selectedTranscriptDetailId,
        );
        const detail = selected ?? params.transcriptDetails.at(-1);
        if (detail) {
          params.openTranscriptDetail(detail);
        } else if (params.latestToolCallRef.current) {
          const latest = params.latestToolCallRef.current;
          overlay.closePrimaryOverlays();
          overlay.setExpandedContent({
            content: latest.content,
            toolName: latest.tool,
          });
        }
      }
      return;
    }
    if (key.ctrl && input === "x") {
      if (
        params.pickerOpen ||
        params.permission ||
        params.questionOpen ||
        overlay.expandedContent
      ) return;
      const sessions = SessionManager.list()
        .filter((session) => session.parentId === params.mainSessionId.current)
        .sort((left, right) => left.createdAt - right.createdAt);
      if (!sessions.length) return;
      overlay.closePrimaryOverlays();
      if (!overlay.viewingSubagentId) {
        overlay.setViewingSubagentId(sessions[0]!.id);
      } else {
        const index = sessions.findIndex(
          (session) => session.id === overlay.viewingSubagentId,
        );
        overlay.setViewingSubagentId(sessions[(index + 1) % sessions.length]!.id);
      }
      return;
    }
    if (key.tab) {
      if (params.inlineSuggestionActive || params.loading) return;
      if (params.pickerOpen || params.permission || params.questionOpen) return;
      if (overlay.expandedContent) return;
      const agents = getAllSessionAgents(params.workdir);
      if (agents.length < 2) return;
      const index = agents.findIndex((agent) => agent.id === params.activeAgent);
      const nextIndex = key.shift
        ? (index - 1 + agents.length) % agents.length
        : (index + 1) % agents.length;
      const next = agents[nextIndex]!;
      params.setActiveAgent(next.id);
      params.addSystemMsg(`Agent: ${next.name}`);
      return;
    }
    if (input === "?" && !params.loading && !params.overlayOpen) {
      overlay.setKeyboardShortcutsOpen(true);
    }
  });
}
