import { useCallback, useEffect, useRef } from "react";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import { APPROVAL_MODES, type ApprovalMode } from "../approval-mode.js";
import { isTrusted, trustProject } from "../project-trust.js";

interface Params {
  workdir: string;
  autopilotRef: MutableRefObject<boolean>;
  setAutopilotMode: Dispatch<SetStateAction<boolean>>;
  fullAccessRef: MutableRefObject<boolean>;
  setFullAccess: Dispatch<SetStateAction<boolean>>;
  setPromptOpen: Dispatch<SetStateAction<boolean>>;
  addSystemMsg: (content: string) => void;
  /** Codex quits when the folder is not trusted. */
  onQuit: () => void;
}


export function useProjectAutoMode(params: Params) {
  const previousWorkdirRef = useRef(params.workdir);

  const applyMode = useCallback((mode: ApprovalMode) => {
    const projectAuto = mode !== "ask";
    const fullAccess = mode === "full";
    params.autopilotRef.current = projectAuto;
    params.fullAccessRef.current = fullAccess;
    params.setAutopilotMode(projectAuto);
    params.setFullAccess(fullAccess);
    params.setPromptOpen(false);
  }, [params.autopilotRef, params.fullAccessRef, params.setAutopilotMode, params.setFullAccess, params.setPromptOpen]);

  const resolvePrompt = useCallback((trusted: boolean) => {
    if (!trusted) { params.onQuit(); return; }
    trustProject(params.workdir);
    applyMode("auto");
  }, [applyMode, params.onQuit, params.workdir]);

  const setApprovalMode = useCallback((mode: ApprovalMode) => {
    applyMode(mode);
    params.addSystemMsg(`Permissions updated to ${APPROVAL_MODES.find((preset) => preset.id === mode)!.label}`);
  }, [applyMode, params.addSystemMsg]);

  useEffect(() => {
    if (previousWorkdirRef.current === params.workdir) return;
    previousWorkdirRef.current = params.workdir;
    const trusted = isTrusted(params.workdir);
    params.autopilotRef.current = trusted;
    params.fullAccessRef.current = false;
    params.setAutopilotMode(trusted);
    params.setFullAccess(false);
    params.setPromptOpen(!trusted);
  }, [params.autopilotRef, params.fullAccessRef, params.setAutopilotMode, params.setFullAccess, params.setPromptOpen, params.workdir]);

  return { resolvePrompt, setApprovalMode };
}
