import { useEffect, useLayoutEffect, useRef } from "react";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import {
  ExecutorEvents,
  PermissionGate,
  PermissionStore,
  PlanGate,
  ProviderRegistry,
  agentPool,
  depSentinel,
  detectUndercoverRepo,
  evaluateProjectAutoRequest,
  getSkillsForProject,
  questionService,
  setMCPLogHandler,
  taskManager,
} from "@aurict/core";
import type {
  DependencyChange,
  PlanRequest,
  QuestionRequest,
  Task,
} from "@aurict/core";
import type { DisplayMessage } from "../conversation/types.js";
import type { CliRemoteRuntime } from "../../remote/runtime.js";
import { RemoteEventTypes } from "../../remote/event-codec.js";
import { getTerminalCaps } from "../../util/terminal-caps.js";
import { registerTerminalMode } from "../event-system/terminal-modes.js";
import { installStdinResumeGuard } from "../event-system/stdin-resume.js";
import { PERMISSION_STORE_FILE } from "../app/app-environment.js";

interface Params {
  initialProvider: string;
  workdir: string;
  input: string;
  loading: boolean;
  autopilotRef: MutableRefObject<boolean>;
  inputRef: MutableRefObject<string>;
  loadingRef: MutableRefObject<boolean>;
  mainSessionId: MutableRefObject<string>;
  remoteRuntimeRef: MutableRefObject<CliRemoteRuntime | null>;
  setTermCols: Dispatch<SetStateAction<number>>;
  setTermRows: Dispatch<SetStateAction<number>>;
  setTerminalMeasured: Dispatch<SetStateAction<boolean>>;
  setMeasuredViewportRows: Dispatch<SetStateAction<number>>;
  setConversationOffsetRows: Dispatch<SetStateAction<number>>;
  setQuestion: Dispatch<SetStateAction<QuestionRequest | null>>;
  setActiveAgentCount: Dispatch<SetStateAction<number>>;
  setPermissionQueue: Dispatch<SetStateAction<import("@aurict/core").PermissionRequest[]>>;
  setSkillNames: Dispatch<SetStateAction<string[]>>;
  setTasks: Dispatch<SetStateAction<Task[]>>;
  setPlanRequest: Dispatch<SetStateAction<PlanRequest | null>>;
  setMessages: Dispatch<SetStateAction<DisplayMessage[]>>;
  setIsUndercover: Dispatch<SetStateAction<boolean>>;
  setBranch: Dispatch<SetStateAction<string | undefined>>;
  addSystemMsg: (content: string) => void;
}

export function useAppLifecycle(params: Params): void {
  const mcpFailuresRef = useRef(new Set<string>());
  const currentWorkdirRef = useRef(params.workdir);

  useEffect(() => {
    currentWorkdirRef.current = params.workdir;
  }, [params.workdir]);

  useLayoutEffect(() => {
    const handler = () => {
      const nextCols = process.stdout.columns ?? 80;
      const nextRows = process.stdout.rows ?? 24;
      params.setTermCols(nextCols);
      params.setTermRows(nextRows);
      params.setTerminalMeasured(true);
      params.setMeasuredViewportRows(Math.max(3, nextRows - 8));
      params.setConversationOffsetRows((previous) => Math.max(0, previous));
    };
    handler();
    const timer = setTimeout(handler, 0);
    process.stdout.on("resize", handler);
    process.on("SIGWINCH", handler);
    return () => {
      clearTimeout(timer);
      process.stdout.off("resize", handler);
      process.off("SIGWINCH", handler);
    };
  }, []);

  useEffect(() => PermissionStore.loadPersisted(PERMISSION_STORE_FILE), []);
  useEffect(() => questionService.onQuestion(params.setQuestion), []);
  useEffect(
    () => agentPool.onChange((agents) => params.setActiveAgentCount(agents.length)),
    [],
  );
  useEffect(
    () => ExecutorEvents.on((event) => {
      if (event.type !== "permission_ask") return;
      const showPermission = () => {
        params.setPermissionQueue((queue) =>
          queue.some((request) => request.id === event.request.id)
            ? queue
            : [...queue, event.request],
        );
        params.remoteRuntimeRef.current
          ?.publish(RemoteEventTypes.permissionRequest, {
            id: event.request.id,
            tool: event.request.tool,
            pattern: event.request.pattern,
            ...(event.request.level ? { level: event.request.level } : {}),
            ...(event.request.reason ? { reason: event.request.reason } : {}),
            ...(event.request.summary ? { summary: event.request.summary } : {}),
          })
          .catch((error) => {
            params.addSystemMsg(
              `⚠ Remote permission sync failed: ${error instanceof Error ? error.message : String(error)}`,
            );
          });
      };

      if (!params.autopilotRef.current) {
        showPermission();
        return;
      }

      void evaluateProjectAutoRequest(event.request, currentWorkdirRef.current)
        .then((verdict) => {
          if (params.autopilotRef.current && verdict.allow) {
            PermissionGate.respond(event.request.id, "allow_once");
            return;
          }
          showPermission();
        })
        .catch((error) => {
          params.addSystemMsg(
            `⚠ Project Auto check failed: ${error instanceof Error ? error.message : String(error)}`,
          );
          showPermission();
        });
    }),
    [],
  );
  useEffect(() => {
    getSkillsForProject(params.workdir)
      .then((skills) => params.setSkillNames(skills.map((skill) => skill.id)))
      .catch((error) => {
        params.addSystemMsg(
          `⚠ Skill discovery failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      });
  }, [params.workdir]);
  useEffect(() => {
    taskManager.configureScope(params.workdir, params.mainSessionId.current);
    params.setTasks(taskManager.getTasks());
    return taskManager.onUpdate(() => params.setTasks(taskManager.getTasks()));
  }, [params.workdir, params.mainSessionId, params.setTasks]);
  useEffect(() => PlanGate.onRequest(params.setPlanRequest), []);
  useEffect(() => {
    params.inputRef.current = params.input;
  }, [params.input]);

  useEffect(() => {
    setMCPLogHandler((message: string, isError: boolean) => {
      if (!message.startsWith("[mcp]")) {
        params.addSystemMsg(isError ? `⚠ ${message}` : message);
        return;
      }
      if (!isError) return;
      const server = message.match(/^\[mcp\]\s+([^:]+):/)?.[1] ?? "server";
      mcpFailuresRef.current.add(server);
      const failed = [...mcpFailuresRef.current].sort();
      params.setMessages((messages) => [
        ...messages.filter((entry) => entry.id !== "startup:mcp-errors"),
        {
          id: "startup:mcp-errors",
          role: "system",
          content: `⚠ MCP unavailable: ${failed.join(", ")} · /mcp for details`,
        },
      ]);
    });
  }, []);

  useEffect(() => {
    const info = ProviderRegistry.available().find(
      (provider) => provider.id === params.initialProvider,
    );
    if (info && !info.hasKey) {
      params.addSystemMsg(
        `⚠ Missing API key for ${info.name} — set the environment variable`,
      );
    }
    detectUndercoverRepo(params.workdir)
      .then((isPublic) => {
        if (!isPublic) return;
        params.setIsUndercover(true);
      })
      .catch((error) => {
        params.addSystemMsg(
          `⚠ Repository visibility check failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      });
    import("bun")
      .then(({ spawn }) => {
        const process = spawn(["git", "branch", "--show-current"], {
          cwd: params.workdir,
          stdout: "pipe",
          stderr: "pipe",
        });
        return new Response(process.stdout).text();
      })
      .then((output) => {
        const branch = output.trim();
        if (branch) params.setBranch(branch);
      })
      .catch((error) => {
        params.addSystemMsg(
          `⚠ Git branch detection failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      });
  }, [params.initialProvider, params.workdir]);

  useEffect(() => {
    if (!getTerminalCaps().bracketedPaste) return;
    return registerTerminalMode(
      "bracketed-paste",
      "\x1b[?2004h",
      "\x1b[?2004l",
    );
  }, []);
  useEffect(() => installStdinResumeGuard(), []);
  useEffect(() => {
    let cleanup: (() => void) | null = null;
    depSentinel
      .snapshot(params.workdir)
      .then(() => {
        cleanup = depSentinel.watch(
          params.workdir,
          (change: DependencyChange) => {
            const parts: string[] = [];
            if (change.added.length) parts.push(`+${change.added.length} added`);
            if (change.removed.length) parts.push(`-${change.removed.length} removed`);
            if (change.changed.length) parts.push(`~${change.changed.length} changed`);
            if (parts.length) {
              params.addSystemMsg(`📦 Dependency change: ${parts.join(", ")}`);
            }
          },
        );
      })
      .catch((error) => {
        params.addSystemMsg(
          `⚠ Dependency watcher failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      });
    return () => cleanup?.();
  }, [params.workdir]);
  useEffect(() => {
    params.loadingRef.current = params.loading;
  }, [params.loading]);
}
