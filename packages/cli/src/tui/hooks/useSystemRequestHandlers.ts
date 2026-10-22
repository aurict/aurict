import { useCallback } from "react";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import {
  PermissionGate,
  PermissionStore,
  questionService,
  readAttachmentFromPath,
  setDefault,
} from "@aurict/core";
import type {
  Attachment,
  PermissionRequest,
  PermissionResponse,
  QuestionAnswer,
  QuestionRequest,
} from "@aurict/core";
import type { PermissionPromptDecision } from "../PermissionPrompt.js";
import { approvalNotice } from "../permission-feedback.js";
import type { TranscriptNotice } from "../conversation/types.js";
import { PERMISSION_STORE_FILE } from "../app/app-environment.js";

interface Params {
  permission: PermissionRequest | null;
  question: QuestionRequest | null;
  abortControllerRef: MutableRefObject<AbortController | null>;
  setProviderState: Dispatch<SetStateAction<string>>;
  setModelState: Dispatch<SetStateAction<string>>;
  setInput: Dispatch<SetStateAction<string>>;
  setPermissionQueue: Dispatch<SetStateAction<PermissionRequest[]>>;
  setQuestion: Dispatch<SetStateAction<QuestionRequest | null>>;
  setAttachInput: Dispatch<SetStateAction<boolean>>;
  setAttachPath: Dispatch<SetStateAction<string>>;
  setAttachments: Dispatch<SetStateAction<Attachment[]>>;
  addSystemMsg: (content: string, notice?: TranscriptNotice) => void;
  /** Interrupts the running turn exactly like Ctrl+C. */
  interruptTurn: () => void;
}

export function useSystemRequestHandlers(params: Params) {
  const setProvider = useCallback((provider: string, model: string) => {
    params.setProviderState(provider);
    params.setModelState(model);
    setDefault("provider", provider);
    setDefault("model", model);
    params.addSystemMsg(`Provider changed: ${provider} / ${model}`);
  }, [params.addSystemMsg]);

  const setModel = useCallback((model: string) => {
    params.setModelState(model);
    setDefault("model", model);
    params.addSystemMsg(`Model changed: ${model}`);
  }, [params.addSystemMsg]);

  // Codex decisions: y once, a for the session, p for a command prefix
  // (the only rule that persists), esc cancels the request and interrupts the turn.
  const handlePermission = useCallback(
    (decision: PermissionPromptDecision) => {
      const permission = params.permission;
      if (!permission) return;
      const response: PermissionResponse | null =
        typeof decision === "string" ? null : decision;
      const action = typeof decision === "string" ? decision : decision.decision;
      const notice = approvalNotice(action, permission);
      if (notice) params.addSystemMsg(notice.parts.map((part) => part.text).join(""), notice);

      if (action === "deny_abort") {
        PermissionGate.respond(permission.id, "deny");
        params.setPermissionQueue([]);
        params.interruptTurn();
        return;
      }
      PermissionGate.respond(permission.id, response ?? action);
      if (action === "allow_prefix" && permission.prefixRule) {
        PermissionStore.approvePrefix(permission.tool, permission.prefixRule);
        PermissionStore.savePersisted(PERMISSION_STORE_FILE);
      }
      params.setPermissionQueue((queue) =>
        queue.filter((item) => item.id !== permission.id),
      );
    },
    [params.permission, params.addSystemMsg, params.interruptTurn],
  );

  const handleQuestionAnswer = useCallback((answers: QuestionAnswer[]) => {
    if (!params.question) return;
    questionService.answer(params.question.id, answers);
    params.setQuestion(null);
  }, [params.question]);

  const handleQuestionReject = useCallback(() => {
    if (!params.question) return;
    questionService.reject(params.question.id);
    params.setQuestion(null);
  }, [params.question]);

  const handleAttachSubmit = useCallback(async (filePath: string) => {
    const trimmed = filePath.trim();
    if (trimmed) {
      try {
        const attachment = await readAttachmentFromPath(trimmed);
        params.setAttachments((attachments) => [...attachments, attachment]);
        params.addSystemMsg(
          `📎 Attached: ${attachment.name} (${attachment.mimeType})`,
        );
      } catch (error) {
        params.addSystemMsg(
          `⚠ Attachment failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
    params.setAttachInput(false);
    params.setAttachPath("");
  }, [params.addSystemMsg]);

  return {
    setProvider,
    setModel,
    handlePermission,
    handleQuestionAnswer,
    handleQuestionReject,
    handleAttachSubmit,
  };
}
