import { useCallback, useEffect, useRef } from "react";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";

interface Params {
  workdir: string;
  autopilotRef: MutableRefObject<boolean>;
  setAutopilotMode: Dispatch<SetStateAction<boolean>>;
  setPromptOpen: Dispatch<SetStateAction<boolean>>;
  addSystemMsg: (content: string) => void;
}

export function useProjectAutoMode(params: Params): (enabled: boolean) => void {
  const previousWorkdirRef = useRef(params.workdir);

  const resolvePrompt = useCallback((enabled: boolean) => {
    params.autopilotRef.current = enabled;
    params.setAutopilotMode(enabled);
    params.setPromptOpen(false);
    params.addSystemMsg(
      enabled
        ? `Project Auto enabled for ${params.workdir} · typed file changes will not ask again`
        : `Project Auto disabled for ${params.workdir} · changes require approval`,
    );
  }, [params.addSystemMsg, params.autopilotRef, params.setAutopilotMode, params.setPromptOpen, params.workdir]);

  useEffect(() => {
    if (previousWorkdirRef.current === params.workdir) return;
    previousWorkdirRef.current = params.workdir;
    params.autopilotRef.current = false;
    params.setAutopilotMode(false);
    params.setPromptOpen(true);
  }, [params.autopilotRef, params.setAutopilotMode, params.setPromptOpen, params.workdir]);

  return resolvePrompt;
}
