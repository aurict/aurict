import { useCallback } from "react";
import crypto from "node:crypto";
import {
  ProviderRegistry,
  fileWatcher,
  getSessionAgent,
  runAgent,
} from "@aurict/core";
import type { CoreMessage } from "@aurict/core";
import { THEMES } from "../../utils/theme.js";
import {
  getCommand,
  parseSlashCommand,
  suggestCommands,
} from "../../commands/registry.js";
import type { CommandResult, PickerItem } from "../../commands/types.js";
import type { DisplayMessage } from "../conversation/types.js";
import type { ConversationBranch } from "../app/app-state-types.js";
import { ZERO_TOKENS } from "../app/app-state-types.js";
import type { AppCommandParams } from "../app/app-command-types.js";
import { writeClipboard } from "../../util/clipboard.js";
import { checkpointChangedFiles, restoreCheckpointFiles, rewindChoiceItems } from "../app/turn-checkpoints.js";

export function useCommandController(params: AppCommandParams) {
  /** Returns the conversation (and optionally files) to before checkpoint `index`. */
  const rewindTo = useCallback(async (index: number, restoreFiles: boolean): Promise<string[]> => {
    const checkpoint = params.checkpoints[index];
    if (!checkpoint) return [];
    if (params.loading) {
      params.addSystemMsg("Stop the running turn (Esc) before rewinding.");
      return [];
    }
    let restored: string[] = [];
    if (restoreFiles) {
      try {
        restored = await restoreCheckpointFiles(checkpoint);
      } catch (error) {
        params.addSystemMsg(`⚠ File restore failed: ${error instanceof Error ? error.message : String(error)} · conversation not rewound`);
        return [];
      }
    }
    params.setMessages(checkpoint.messages);
    params.setHistory(checkpoint.history);
    params.setCompletionProof(undefined);
    params.setCheckpoints((checkpoints) => checkpoints.slice(0, index));
    params.setInput(checkpoint.prompt);
    params.addSystemMsg(
      `↩ Rewound to before "${checkpoint.label}" · ${restoreFiles ? `${restored.length} file${restored.length === 1 ? "" : "s"} restored` : "files left as they are"} · the prompt is back in the composer`,
    );
    return restored;
  }, [params]);

  /** Asks whether to restore files when the agent changed any since the checkpoint. */
  const requestRewind = useCallback((index: number) => {
    const checkpoint = params.checkpoints[index];
    if (!checkpoint) return;
    const files = checkpointChangedFiles(checkpoint);
    if (files.length === 0) {
      void rewindTo(index, false);
      return;
    }
    params.setPicker({
      title: `Rewind to before "${checkpoint.label}"`,
      items: rewindChoiceItems(files),
      onSelect: (item) => {
        if (item.id !== "cancel") void rewindTo(index, item.id === "files");
      },
    });
  }, [params, rewindTo]);

  const buildContext = useCallback(() => ({
    sessionId: params.mainSessionId.current,
    provider: params.provider,
    model: params.model,
    workdir: params.workdir,
    ...(params.effort !== undefined ? { effort: params.effort } : {}),
    history: params.history,
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
    toggleAutopilot: () => params.setApprovalMode(params.approvalMode === "ask" ? "auto" : "ask"),
    approvalMode: params.approvalMode,
    setApprovalMode: params.setApprovalMode,
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
    showDiff: (rawDiff: string, title: string) => {
      params.overlay.closePrimaryOverlays();
      params.overlay.setExpandedContent({ content: rawDiff, toolName: title, kind: "diff", rawDiff });
    },
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
    rewindTo,
    requestRewind,
    checkpointFiles: (index: number) => {
      const checkpoint = params.checkpoints[index];
      return checkpoint ? checkpointChangedFiles(checkpoint) : [];
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
    openDesign: (brief?: string) => {
      params.setDesignInitialBrief(brief?.trim() || undefined);
      params.overlay.setDesignWizardOpen(true);
    },
    startRemoteSession: () => params.remoteBridgeRef.current.start(),
    stopRemoteSession: () => params.remoteBridgeRef.current.stop(),
    remoteConnected: params.remoteConnected,
  }), [params, rewindTo, requestRewind]);

  const applyResult = useCallback((result: CommandResult) => {
    switch (result.type) {
      case "text":
        if (result.content.trim()) params.addSystemMsg(result.content);
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
      case "new":
      case "clear":
        params.setMessages([]);
        params.setHistory([]);
        params.setTokens(ZERO_TOKENS);
        params.setContextUsage(undefined);
        params.setCompletionProof(undefined);
        params.setSessionTitle(undefined);
        params.isFirstMessage.current = true;
        params.extractedRef.current = false;
        if (result.type === "new") {
          params.mainSessionId.current = crypto.randomUUID();
          params.setCheckpoints([]);
          params.addSystemMsg("New session started · the previous one is in /resume");
        } else {
          params.addSystemMsg("History cleared");
        }
        break;
      case "exit":
        params.exit();
    }
  }, [params]);

  const executeCommand = useCallback((raw: string): boolean => {
    let parsed: ReturnType<typeof parseSlashCommand>;
    try {
      parsed = parseSlashCommand(raw);
    } catch (error) {
      applyResult({
        type: "error",
        message: error instanceof Error ? error.message : String(error),
      });
      return true;
    }
    if (!parsed) return false;
    const command = getCommand(parsed.cmd);
    if (!command) {
      const suggestions = suggestCommands(parsed.cmd);
      const hint = suggestions.length > 0
        ? ` Did you mean ${suggestions.map((name) => `/${name}`).join(", ")}?`
        : " Type /help to see all commands.";
      applyResult({ type: "error", message: `Unknown command: /${parsed.cmd}.${hint}` });
      return true;
    }
    const result = command.handler(parsed.args, buildContext());
    if (result instanceof Promise) {
      result
        .then(applyResult)
        .catch((error) => applyResult({
          type: "error",
          message: error instanceof Error ? error.message : String(error),
        }));
    } else {
      applyResult(result);
    }
    return true;
  }, [buildContext, applyResult]);

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

  return { executeCommand, handleCmdExecute, handleCmdFill, handleEditRerun, requestRewind };
}
