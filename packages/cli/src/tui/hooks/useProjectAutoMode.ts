import { useCallback, useEffect, useRef } from "react";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type { ApprovalMode } from "../approval-mode.js";

interface Params {
  workdir: string;
  autopilotRef: MutableRefObject<boolean>;
  setAutopilotMode: Dispatch<SetStateAction<boolean>>;
  fullAccessRef: MutableRefObject<boolean>;
  setFullAccess: Dispatch<SetStateAction<boolean>>;
  setPromptOpen: Dispatch<SetStateAction<boolean>>;
  addSystemMsg: (content: string) => void;
}

const MODE_NOTICES: Record<ApprovalMode, (workdir: string) => string> = {
  ask: (workdir) => `Approvals: ask for ${workdir} · every change and command requires approval`,
  auto: (workdir) => `Approvals: Project Auto for ${workdir} · typed file changes run, commands still ask`,
  full: (workdir) => `Approvals: full access for ${workdir} · tools run without asking, dangerous operations still ask`,
};

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

  const resolvePrompt = useCallback((enabled: boolean) => {
    applyMode(enabled ? "auto" : "ask");
    params.addSystemMsg(
      enabled
        ? `Project Auto enabled for ${params.workdir} · typed file changes will not ask again`
        : `Project Auto disabled for ${params.workdir} · changes require approval`,
    );
  }, [applyMode, params.addSystemMsg, params.workdir]);

  const setApprovalMode = useCallback((mode: ApprovalMode) => {
    applyMode(mode);
    params.addSystemMsg(MODE_NOTICES[mode](params.workdir));
  }, [applyMode, params.addSystemMsg, params.workdir]);

  useEffect(() => {
    if (previousWorkdirRef.current === params.workdir) return;
    previousWorkdirRef.current = params.workdir;
    params.autopilotRef.current = false;
    params.fullAccessRef.current = false;
    params.setAutopilotMode(false);
    params.setFullAccess(false);
    params.setPromptOpen(true);
  }, [params.autopilotRef, params.fullAccessRef, params.setAutopilotMode, params.setFullAccess, params.setPromptOpen, params.workdir]);

  return { resolvePrompt, setApprovalMode };
}
