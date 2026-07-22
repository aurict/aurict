import { useCallback } from "react";
import crypto from "node:crypto";
import {
  ProviderRegistry,
  fileWatcher,
  getSessionAgent,
  runAgent,
  snapshotManager,
} from "@aurict/core";
import type { CoreMessage } from "@aurict/core";
import { THEMES } from "../../utils/theme.js";
import {
  getCommand,
  parseSlashCommand,
} from "../../commands/registry.js";
import type { CommandResult, PickerItem } from "../../commands/types.js";
import type { DisplayMessage } from "../conversation/types.js";
import type { ConversationBranch } from "../app/app-state-types.js";
import { ZERO_TOKENS } from "../app/app-state-types.js";
import type { AppCommandParams } from "../app/app-command-types.js";
import { writeClipboard } from "../../util/clipboard.js";

export function useCommandController(params: AppCommandParams) {
  const buildContext = useCallback(() => ({
    sessionId: params.mainSessionId.current,
    provider: params.provider,
    model: params.model,
    workdir: params.workdir,
    ...(params.effort !== undefined ? { effort: params.effort } : {}),
    skills: params.skillNames,
    currentTheme: params.themeName,
    isUndercover: params.isUndercover,
    coordinatorMode: params.coordinatorMode,
    activeAgent: params.activeAgent,
    addSystemMsg: params.addSystemMsg,
    copyText: writeClipboard,
    setAgent: (id: string) => {
      params.setActiveAgent(id);
      params.addSystemMsg(`Agent: ${getSessionAgent(id, params.workdir).name}`);
    },
    setProvider: params.setProvider,
    setModel: params.setModel,
    setEffort: params.setEffort,
    setTheme: (name: string) => {
      if (THEMES[name]) params.setThemeName(name);
    },
    setWorkdir: params.setWorkdir,
    toggleUndercover: () => params.setIsUndercover((value) => !value),
    toggleCoordinator: () => params.setCoordinatorMode((value) => !value),
    autopilotMode: params.autopilotMode,
    toggleAutopilot: () => {
      params.setAutopilotMode((value) => {
        const next = !value;
        params.addSystemMsg(
          next
            ? `Project Auto ON for ${params.workdir} — typed file changes are auto-approved; shell and sensitive operations still ask`
            : "Project Auto OFF — manual confirmation restored",
        );
        return next;
      });
    },
    startBackgroundTask: params.startBackgroundTask,
    cancelBackgroundTask: params.cancelBackgroundTask,
    bgTasks: params.bgTasks,
    showBgTask: (id: string) => {
      const task = params.bgTasks.find((candidate) => candidate.id === id);
      if (task) {
        params.addSystemMsg(
          `[bg:${id}] ${task.status}\n${task.output ?? "(no output yet)"}`,
        );
      }
    },
    openBtw: (question: string) => {
      params.overlay.setBtwState({
        question,
        answer: "",
        loading: true,
        frame: 0,
      });
      const interval = setInterval(() => {
        params.overlay.setBtwState((state) =>
          state ? { ...state, frame: state.frame + 1 } : state,
        );
      }, 80);
      params.btwFrameRef.current = interval;
      runAgent({
        provider: params.provider,
        model: params.model,
        workdir: params.workdir,
        messages: [
          ...params.history.slice(-10),
          { role: "user", content: `[BTW] ${question}` },
        ],
        system:
          "Answer this side question briefly and clearly. Be concise. Do NOT add to conversation history.",
      })
        .then((result) => {
          clearInterval(interval);
          params.btwFrameRef.current = null;
          params.overlay.setBtwState((state) =>
            state ? { ...state, answer: result.text, loading: false } : state,
          );
        })
        .catch((error) => {
          clearInterval(interval);
          params.btwFrameRef.current = null;
          params.overlay.setBtwState((state) =>
            state
              ? {
                  ...state,
                  answer: `Error: ${error instanceof Error ? error.message : String(error)}`,
                  loading: false,
                }
              : state,
          );
        });
    },
    showPicker: (
      title: string,
      items: PickerItem[],
      onSelect: (item: PickerItem) => void,
    ) => params.setPicker({ title, items, onSelect }),
    showPrompt: (
      title: string,
      placeholder: string,
      secret: boolean,
      onSubmit: (value: string) => void,
    ) => params.setPrompt({ title, placeholder, secret, onSubmit }),
    restoreSession: (
      messages: Array<{ role: "user" | "assistant"; content: string }>,
    ) => {
      const history: CoreMessage[] = messages.map((message) => ({
        role: message.role,
        content: message.content,
      }));
      params.setHistory(history);
      params.setCompletionProof(undefined);
      params.setMessages(messages.map((message) => ({
        role: message.role as DisplayMessage["role"],
        content: message.content,
        id: crypto.randomUUID(),
      })));
      params.addSystemMsg(`Session restored — ${messages.length} messages`);
    },
    messages: params.messages,
    checkpoints: params.checkpoints,
    popCheckpoints: async (count: number) => {
      if (params.checkpoints.length === 0) return;
      const index = Math.max(0, params.checkpoints.length - count);
      const checkpoint = params.checkpoints[index];
      if (!checkpoint) return;
      await snapshotManager.restoreToMark(checkpoint.mark);
      params.setMessages(checkpoint.messages);
      params.setHistory(checkpoint.history);
      params.setCompletionProof(undefined);
      params.setCheckpoints((checkpoints) => checkpoints.slice(0, index));
      params.addSystemMsg(
        `↩ Rolled back ${count} step${count > 1 ? "s" : ""}`,
      );
    },
    branches: params.branches.map((branch, index) => ({
      id: branch.id,
      name: branch.name,
      createdAt: branch.createdAt,
      messageCount: branch.messages.length,
      active: index === params.activeBranchIdx,
    })),
    activeBranchIdx: params.activeBranchIdx,
    createBranch: (name?: string) => {
      const nextName = name ?? `branch-${params.branches.length}`;
      const branch: ConversationBranch = {
        id: crypto.randomUUID(),
        name: nextName,
        messages: params.messages.slice(),
        history: params.history.slice(),
        tokens: { ...params.tokens },
        createdAt: Date.now(),
      };
      params.setBranches((branches) => {
        const updated = [...branches];
        updated[params.activeBranchIdx] = {
          ...updated[params.activeBranchIdx]!,
          messages: params.messages.slice(),
          history: params.history.slice(),
          tokens: { ...params.tokens },
        };
        return [...updated, branch];
      });
      params.setActiveBranchIdx(params.branches.length);
      params.addSystemMsg(`⎇ Switched to branch "${nextName}"`);
    },
    switchBranch: (index: number) => {
      if (
        index < 0 ||
        index >= params.branches.length ||
        index === params.activeBranchIdx
      ) return;
      params.setBranches((branches) => {
        const updated = [...branches];
        updated[params.activeBranchIdx] = {
          ...updated[params.activeBranchIdx]!,
          messages: params.messages.slice(),
          history: params.history.slice(),
          tokens: { ...params.tokens },
        };
        return updated;
      });
      const target = params.branches[index]!;
      params.setMessages(target.messages);
      params.setHistory(target.history);
      params.setTokens(target.tokens);
      params.setCompletionProof(undefined);
      params.setActiveBranchIdx(index);
      params.addSystemMsg(`⎇ Switched to branch "${target.name}"`);
    },
    deleteBranch: (name: string) => {
      if (name === "main") {
        params.addSystemMsg("Cannot delete main branch");
        return;
      }
      const index = params.branches.findIndex((branch) => branch.name === name);
      if (index === -1) {
        params.addSystemMsg(`Branch "${name}" not found`);
        return;
      }
      params.setBranches((branches) =>
        branches.filter((_, branchIndex) => branchIndex !== index),
      );
      if (params.activeBranchIdx >= index) {
        params.setActiveBranchIdx(Math.max(0, params.activeBranchIdx - 1));
      }
      params.addSystemMsg(`⎇ Deleted branch "${name}"`);
    },
    watchedPaths: params.watchedPaths,
    addWatch: (watchPath: string, prompt?: string) => {
      const absolute = watchPath.startsWith("/")
        ? watchPath
        : `${params.workdir}/${watchPath}`;
      if (params.watchCleanupRef.current.has(absolute)) {
        params.addSystemMsg(`Already watching: ${absolute}`);
        return;
      }
      const cleanup = fileWatcher.watch(absolute, (changedFile) => {
        params.addSystemMsg(
          `👁 ${changedFile.replace(params.workdir + "/", "")} changed`,
        );
      });
      params.watchCleanupRef.current.set(absolute, cleanup);
      params.setWatchedPaths((watched) => [
        ...watched,
        { path: absolute, ...(prompt !== undefined ? { prompt } : {}) },
      ]);
      params.addSystemMsg(`👁 Watching: ${absolute}`);
    },
    removeWatch: (watchPath?: string) => {
      if (!watchPath) {
        params.watchCleanupRef.current.forEach((cleanup) => cleanup());
        params.watchCleanupRef.current.clear();
        params.setWatchedPaths([]);
        params.addSystemMsg("👁 Stopped all watchers");
        return;
      }
      const absolute = watchPath.startsWith("/")
        ? watchPath
        : `${params.workdir}/${watchPath}`;
      params.watchCleanupRef.current.get(absolute)?.();
      params.watchCleanupRef.current.delete(absolute);
      params.setWatchedPaths((watched) =>
        watched.filter((entry) => entry.path !== absolute),
      );
      params.addSystemMsg(`👁 Stopped watching: ${absolute}`);
    },
    contextWindow:
      params.contextUsage?.contextWindow ??
      ProviderRegistry.get(params.provider)
        .listModels()
        .find((candidate) => candidate.id === params.model)?.contextWindow ??
      200_000,
    tokens: params.tokens,
    contextUsage: params.contextUsage,
    promptDiagnostics: params.promptDiagnostics,
    promptCacheHealth: params.promptCacheHealth,
    replayTo: async (index: number) => {
      const checkpoint = params.checkpoints[index];
      if (!checkpoint) return;
      await snapshotManager.restoreToMark(checkpoint.mark);
      params.setMessages(checkpoint.messages);
      params.setHistory(checkpoint.history);
      params.setCompletionProof(undefined);
      params.setCheckpoints((checkpoints) => checkpoints.slice(0, index + 1));
    },
    openDesign: (brief?: string) => {
      params.setDesignInitialBrief(brief?.trim() || undefined);
      params.overlay.setDesignWizardOpen(true);
    },
    startRemoteSession: () => params.remoteBridgeRef.current.start(),
    stopRemoteSession: () => params.remoteBridgeRef.current.stop(),
    remoteConnected: params.remoteConnected,
  }), [params]);

  const applyResult = useCallback((result: CommandResult) => {
    switch (result.type) {
      case "text":
        params.addSystemMsg(result.content);
        break;
      case "error":
        params.setMessages((messages) => [
          ...messages,
          { id: crypto.randomUUID(), role: "error", content: result.message },
        ]);
        break;
      case "picker":
        params.setPicker({
          title: result.title,
          items: result.items,
          onSelect: result.onSelect,
        });
        break;
      case "prompt":
        params.setPrompt({
          title: result.title,
          placeholder: result.placeholder,
          secret: result.secret,
          onSubmit: result.onSubmit,
        });
        break;
      case "clear":
        params.setMessages([]);
        params.setHistory([]);
        params.setTokens(ZERO_TOKENS);
        params.setContextUsage(undefined);
        params.setCompletionProof(undefined);
        params.setSessionTitle(undefined);
        params.isFirstMessage.current = true;
        params.extractedRef.current = false;
        params.addSystemMsg("History cleared");
        break;
      case "exit":
        params.exit();
    }
  }, [params]);

  const executeCommand = useCallback((raw: string): boolean => {
    const parsed = parseSlashCommand(raw);
    if (!parsed) return false;
    const command = getCommand(parsed.cmd);
    if (!command) {
      params.addSystemMsg(
        `Unknown command: /${parsed.cmd}  —  type /help to see all commands`,
      );
      return true;
    }
    const result = command.handler(parsed.args, buildContext());
    if (result instanceof Promise) {
      result
        .then(applyResult)
        .catch((error) => params.addSystemMsg(`[error] ${String(error)}`));
    } else {
      applyResult(result);
    }
    return true;
  }, [buildContext, applyResult, params.addSystemMsg]);

  const handleCmdExecute = useCallback((name: string) => {
    params.skipSubmitRef.current = true;
    params.setInput("");
    executeCommand(`/${name}`);
  }, [executeCommand]);

  const handleCmdFill = useCallback((name: string) => {
    params.setInput(`/${name} `);
  }, [params.setInput]);

  const handleEditRerun = useCallback((index: number, content: string) => {
    params.overlay.setEditingMsg(null);
    params.setMessages((messages) => {
      const next = messages.slice(0, index);
      next.push({ ...messages[index]!, content });
      return next;
    });
    const previousUserCount = params.messages
      .slice(0, index)
      .filter((message) => message.role === "user").length;
    const history: CoreMessage[] = [];
    let userCount = 0;
    for (const message of params.history) {
      if (message.role === "user") {
        if (userCount >= previousUserCount) break;
        userCount += 1;
      }
      history.push(message);
    }
    params.setHistory(history);
    setTimeout(() => params.submitRef.current(content), 30);
  }, [params]);

  return { executeCommand, handleCmdExecute, handleCmdFill, handleEditRerun };
}
