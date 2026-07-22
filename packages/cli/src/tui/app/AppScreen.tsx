import React, { useMemo } from "react";
import crypto from "node:crypto";
import {
  PlanGate,
  ProviderRegistry,
  SessionManager,
} from "@aurict/core";
import type { CoreMessage } from "@aurict/core";
import { CURRENT_VERSION } from "../../util/update-check.js";
import { DEFAULT_THEME, THEMES } from "../../utils/theme.js";
import {
  buildDesignPrompt,
  recordSkillUsed,
  recordSystemUsed,
  slugify,
} from "@aurict/core";
import type { DesignWizardResult } from "../DesignWizard.js";
import { TaskFloatingPanel } from "../TaskFloatingPanel.js";
import { TranscriptPane } from "../app-shell/TranscriptPane.js";
import { AppBottomBar } from "./AppBottomBar.js";
import { AppHeader } from "./AppHeader.js";
import { AppOverlayContents } from "./AppOverlayContents.js";
import { AppView } from "./AppView.js";
import type { AppScreenProps } from "./app-screen-types.js";
import { formatExitTranscript } from "../conversation/transcript-export.js";
import { transcriptOffsetForMessage } from "../conversation/search-model.js";

export function AppScreen(props: AppScreenProps) {
  const {
    termRows, termCols, terminalMeasured, themeName, keybindingContext,
    blockingOverlayOpen, focusLayer, composerInputActive, provider, model,
    workdir: workdirState, initialWorkdir: workdir, tokens, contextUsage, completionProof,
    loading, coordinatorMode, autopilotMode, activeTool, runActivity, tasks,
    taskSummary, runningBackgroundTaskCount, localServer, sandboxBackend, activeAgentCount, branch,
    activeAgent, skillNames, turnSkillNames, isUndercover, wasCompacted,
    remoteConnected, effort, showStartupBanner, updateInfo, sessionTitle,
    history, messages, streamingText, streamingReason, streamingError,
    scrollLocked, conversationOffsetRows, unseenCount, unseenLabel, measuredViewportRows,
    commandHistory, commandDefs, recentCmds, designInitialBrief, picker,
    prompt, question, permission, projectAutoPromptOpen,
    resolveProjectAutoPrompt, permissionQueueLength, transcriptDetails,
    input, composerQueue, inlineSuggestionActive, cmdFilter, mentionFilter,
    mainSessionId, btwFrameRef, setMeasuredViewportRows, setHistory,
    setMessages, setRecentCmds, setInput, setThemeName, setDesignInitialBrief,
    setPicker, setPrompt, addSystemMsg, executeCommand, handleSubmit,
    handleQueue, handleCmdExecute, handleCmdFill, handleEditRerun,
    handleQuestionAnswer, handleQuestionReject, handlePermission,
    handleScrollRange, scrollConversation, moveTranscriptDetail,
  } = props;
  const {
    quickSearchOpen, setQuickSearchOpen, transcriptSearchOpen, setTranscriptSearchOpen,
    cmdPaletteOpen, setCmdPaletteOpen,
    settingsOpen, setSettingsOpen, designWizardOpen, setDesignWizardOpen,
    historySearchOpen, setHistorySearchOpen, keyboardShortcutsOpen,
    setKeyboardShortcutsOpen, taskPanelOpen, setTaskPanelOpen,
    updateDismissed, attachInput, attachPath, attachments, editingMsg,
    setEditingMsg, planRequest, setPlanRequest, expandedContent,
    setExpandedContent, btwState, setBtwState, viewingSubagentId,
    setViewingSubagentId,
  } = props.overlay;

  const activeTheme = THEMES[themeName] ?? THEMES[DEFAULT_THEME]!;
  const currentContextWindow = useMemo(
    () => ProviderRegistry.get(provider)
      .listModels()
      .find((candidate) => candidate.id === model)?.contextWindow,
    [provider, model],
  );
  const subSessions = useMemo(() => viewingSubagentId
    ? SessionManager.list()
        .filter((session) => session.parentId === mainSessionId.current)
        .sort((left, right) => left.createdAt - right.createdAt)
    : [], [activeAgentCount, mainSessionId, viewingSubagentId]);
  const subIndex = subSessions.findIndex((session) => session.id === viewingSubagentId);
  const exitTranscript = useMemo(
    () => formatExitTranscript(messages, sessionTitle ?? "Aurict session"),
    [messages, sessionTitle],
  );
  return (
    <AppView
      rows={termRows}
      columns={termCols}
      theme={activeTheme}
      keybindingContext={keybindingContext}
      overlayOpen={blockingOverlayOpen}
      exitTranscript={exitTranscript}
      onTranscriptHeight={(rows) => setMeasuredViewportRows(Math.max(6, rows))}
      header={
        <AppHeader
          theme={activeTheme}
          subagent={viewingSubagentId ? {
            sessionId: viewingSubagentId,
            parentSessionId: mainSessionId.current,
            siblingIndex: subIndex + 1,
            siblingCount: subSessions.length,
            onClose: () => setViewingSubagentId(null),
            onPrev: () => {
              const previous = subSessions[
                (subIndex - 1 + subSessions.length) % subSessions.length
              ];
              if (previous) setViewingSubagentId(previous.id);
            },
            onNext: () => {
              const next = subSessions[(subIndex + 1) % subSessions.length];
              if (next) setViewingSubagentId(next.id);
            },
          } : null}
          cockpit={!viewingSubagentId && !showStartupBanner ? {
            provider,
            model,
            workdir: workdirState,
            tokens,
            contextTokens: contextUsage?.effectiveTokens ?? 0,
            loading,
            coordinatorMode,
            autopilotMode,
            cols: termCols,
            ...(contextUsage?.contextWindow !== undefined
              ? { contextWindow: contextUsage.contextWindow }
              : currentContextWindow !== undefined
                ? { contextWindow: currentContextWindow }
                : {}),
            ...(activeTool !== undefined ? { activeTool } : {}),
            ...(runActivity !== undefined ? { activity: runActivity } : {}),
            ...(tasks.length > 0 ? { taskSummary } : {}),
            ...(runningBackgroundTaskCount > 0 ? { bgTaskCount: runningBackgroundTaskCount } : {}),
            ...(localServer !== undefined ? { localServer } : {}),
            ...(sandboxBackend !== undefined ? { sandboxBackend } : {}),
            ...(activeAgentCount > 0 ? { activeAgentCount } : {}),
            ...(branch !== undefined ? { branch } : {}),
            ...(activeAgent !== undefined ? { activeAgent } : {}),
            ...(sessionTitle !== undefined ? { title: sessionTitle } : {}),
            ...(completionProof !== undefined ? { proof: completionProof } : {}),
          } : null}
          startup={showStartupBanner ? {
            version: `v${CURRENT_VERSION}`,
            provider,
            model,
            workdir,
            cols: termCols,
            rows: termRows,
          } : null}
          updateInfo={updateInfo}
          updateDismissed={updateDismissed}
          sessionTitle={sessionTitle}
          showSessionTitle={!viewingSubagentId && history.length > 0}
        />
      }
      transcript={
        <TranscriptPane
          visible={!viewingSubagentId}
          height={measuredViewportRows}
          width={Math.max(20, termCols - 9)}
          messages={messages}
          loading={loading}
          streamingText={streamingText}
          streamingReason={streamingReason}
          streamingError={streamingError}
          scrollLocked={scrollLocked}
          offsetRowsFromBottom={conversationOffsetRows}
          onScrollRange={handleScrollRange}
          onAnchorShift={scrollConversation}
          {...(unseenCount > 0 ? { unseenCount } : {})}
          {...(unseenLabel ? { unseenLabel } : {})}
          {...(activeTool !== undefined ? { activeTool } : {})}
          {...(runActivity !== undefined ? { activity: runActivity } : {})}
        />
      }
      overlay={
        <AppOverlayContents
          activeLayer={focusLayer}
          theme={activeTheme}
          keyboardShortcuts={keyboardShortcutsOpen
            ? { onClose: () => setKeyboardShortcutsOpen(false) }
            : null}
          historySearch={historySearchOpen ? {
            history: commandHistory,
            onClose: () => setHistorySearchOpen(false),
            onSelect: (text) => {
              setHistorySearchOpen(false);
              setInput(text);
            },
          } : null}
          transcriptSearch={transcriptSearchOpen ? {
            messages,
            onClose: () => setTranscriptSearchOpen(false),
            onSelect: (messageId) => {
              setTranscriptSearchOpen(false);
              props.setConversationOffsetRows(transcriptOffsetForMessage(
                messages,
                Math.max(20, termCols - 9),
                measuredViewportRows,
                messageId,
              ));
            },
          } : null}
          quickSearch={quickSearchOpen ? {
            onClose: () => setQuickSearchOpen(false),
            onSelect: (_sessionId, savedMessages) => {
              setQuickSearchOpen(false);
              const coreMessages: CoreMessage[] = savedMessages.map((message) => ({
                role: message.role,
                content: message.content,
              }));
              setHistory(coreMessages);
              setMessages(savedMessages.map((message) => ({
                role: message.role,
                content: message.content,
                id: crypto.randomUUID(),
              })));
              addSystemMsg(`Session loaded — ${savedMessages.length} messages`);
            },
          } : null}
          commandPalette={cmdPaletteOpen ? {
            commands: commandDefs,
            recentCommands: recentCmds,
            onClose: () => setCmdPaletteOpen(false),
            onSelect: (command, args, action) => {
              setCmdPaletteOpen(false);
              setRecentCmds((previous) => [
                command.name,
                ...previous.filter((name) => name !== command.name),
              ].slice(0, 10));
              const raw = `/${command.name}${args ? ` ${args}` : ""}`;
              if (action === "run") {
                setInput("");
                executeCommand(raw);
              } else {
                setInput(raw);
              }
            },
          } : null}
          settings={settingsOpen ? {
            provider,
            model,
            currentTheme: themeName,
            workdir: workdirState,
            onTheme: (name) => {
              if (THEMES[name]) setThemeName(name);
            },
            onClose: () => setSettingsOpen(false),
          } : null}
          designWizard={designWizardOpen ? {
            workdir: workdirState,
            ...(designInitialBrief !== undefined ? { initialBrief: designInitialBrief } : {}),
            onClose: () => {
              setDesignWizardOpen(false);
              setDesignInitialBrief(undefined);
            },
            onLaunch: (result: DesignWizardResult) => {
              setDesignWizardOpen(false);
              setDesignInitialBrief(undefined);
              recordSystemUsed(result.systemId);
              recordSkillUsed(result.skillId);
              const designPrompt = buildDesignPrompt({
                brief: result.brief,
                systemId: result.systemId,
                skillId: result.skillId,
                workdir: workdirState,
                outputSlug: slugify(result.brief),
              });
              void handleSubmit(designPrompt);
            },
          } : null}
          planApproval={planRequest ? {
            request: planRequest,
            onDecide: (approvedSteps) => {
              const id = planRequest.id;
              setPlanRequest(null);
              PlanGate.respond(id, approvedSteps === null
                ? { type: "rejected" }
                : { type: "approved", approvedSteps });
            },
          } : null}
          messageEdit={editingMsg ? {
            original: editingMsg.content,
            onCancel: () => setEditingMsg(null),
            onSubmit: (newText) => handleEditRerun(editingMsg.msgIndex, newText),
          } : null}
          picker={picker ? {
            title: picker.title,
            items: picker.items,
            onSelect: (item) => {
              const onSelect = picker.onSelect;
              setPicker(null);
              setTimeout(() => onSelect(item), 10);
            },
            onCancel: () => setPicker(null),
          } : null}
          prompt={prompt ? {
            title: prompt.title,
            placeholder: prompt.placeholder,
            secret: prompt.secret,
            onSubmit: (value) => {
              const onSubmit = prompt.onSubmit;
              setPrompt(null);
              onSubmit(value);
            },
            onCancel: () => setPrompt(null),
          } : null}
          question={question ? {
            request: question,
            onAnswer: handleQuestionAnswer,
            onReject: handleQuestionReject,
          } : null}
          attachmentInput={attachInput ? { path: attachPath } : null}
          expandedOutput={expandedContent ? {
            content: expandedContent.content,
            toolName: expandedContent.toolName,
            onClose: () => setExpandedContent(null),
            ...(expandedContent.kind !== undefined ? { kind: expandedContent.kind } : {}),
            ...(expandedContent.rawDiff ? { rawDiff: expandedContent.rawDiff } : {}),
            ...(expandedContent.filePath ? { filePath: expandedContent.filePath } : {}),
            ...(expandedContent.totalLines !== undefined
              ? { totalLines: expandedContent.totalLines }
              : {}),
            ...(transcriptDetails.length > 1 ? {
              onPrevious: () => moveTranscriptDetail(-1),
              onNext: () => moveTranscriptDetail(1),
            } : {}),
          } : null}
          btw={btwState ? {
            question: btwState.question,
            answer: btwState.answer,
            loading: btwState.loading,
            frame: btwState.frame,
            onClose: () => {
              setBtwState(null);
              if (btwFrameRef.current) clearInterval(btwFrameRef.current);
              btwFrameRef.current = null;
            },
          } : null}
        />
      }
      bottom={
        <AppBottomBar
          agentStatus={{
            inputActive: composerInputActive,
            viewingSessionId: viewingSubagentId,
            onViewAgent: setViewingSubagentId,
          }}
          commandSuggest={{
            filter: cmdFilter ?? "",
            commands: commandDefs,
            isActive: cmdFilter !== null && composerInputActive,
            onExecute: handleCmdExecute,
            onFill: handleCmdFill,
          }}
          fileMention={mentionFilter !== null ? {
            filter: mentionFilter,
            workdir: workdirState,
            isActive: composerInputActive,
            onSelect: (path) => setInput((previous) =>
              previous.replace(/@([\w./~-]*)$/, `@${path}`),
            ),
          } : null}
          attachmentNames={attachments.map((attachment) => attachment.name)}
          projectAuto={projectAutoPromptOpen && !permission ? {
            workdir: workdirState,
            onDecide: resolveProjectAutoPrompt,
          } : null}
          permission={permission ? {
            request: permission,
            onDecide: handlePermission,
            queueLength: permissionQueueLength,
          } : null}
          composer={{
            visible: viewingSubagentId === null,
            active: composerInputActive,
            value: input,
            onChange: setInput,
            onSubmit: handleSubmit,
            onQueue: handleQueue,
            working: loading,
            history: commandHistory,
            queue: composerQueue,
            inlineSuggestionActive,
            onInputTruncated: (original, truncated) => addSystemMsg(
              `Input truncated: ${original.toLocaleString()} → ${truncated.toLocaleString()} chars`,
            ),
            onCopied: (characters) => addSystemMsg(
              `📋 Copied (${characters.toLocaleString()} chars)`,
            ),
          }}
          status={terminalMeasured ? {
            skills: skillNames,
            turnSkills: turnSkillNames,
            sandboxBackend,
            autopilotMode,
            cols: termCols,
            scrollLocked,
            remoteConnected,
            selectionHint: props.selectionHintVisible,
            ...(runningBackgroundTaskCount > 0 ? { bgTaskCount: runningBackgroundTaskCount } : {}),
            ...(tasks.length > 0 ? { taskSummary } : {}),
          } : null}
        />
      }
      sidePanel={taskPanelOpen && tasks.length > 0 && !viewingSubagentId
        ? <TaskFloatingPanel tasks={tasks} onClose={() => setTaskPanelOpen(false)} />
        : undefined}
    />
  );
}
