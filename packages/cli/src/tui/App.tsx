import React, { useMemo, useRef } from "react";
import { allCommands } from "../commands/registry.js";
import { useApp } from "./design-system/renderer.js";
import { useOverlayState } from "./hooks/useOverlayState.js";
import { useBackgroundTasks } from "./hooks/useBackgroundTasks.js";
import { useAppLifecycle } from "./hooks/useAppLifecycle.js";
import { useSystemRequestHandlers } from "./hooks/useSystemRequestHandlers.js";
import { useExternalEditor } from "./hooks/useExternalEditor.js";
import { useAppKeyboard } from "./hooks/useAppKeyboard.js";
import { useCommandController } from "./hooks/useCommandController.js";
import { useAgentSubmit } from "./hooks/useAgentSubmit.js";
import { useRemoteController } from "./hooks/useRemoteController.js";
import { useAppFocusModel } from "./hooks/useAppFocusModel.js";
import { useConversationViewport } from "./hooks/useConversationViewport.js";
import { useTranscriptDetails } from "./hooks/useTranscriptDetails.js";
import { useComposerSuggestions } from "./hooks/useComposerSuggestions.js";
import { useAppState } from "./hooks/useAppState.js";
import { AppScreen } from "./app/AppScreen.js";
import type { AppProps as Props } from "./app/app-props.js";
import { configuredSandboxBackend } from "./app/app-environment.js";
import { useTerminalAttention } from "./hooks/useTerminalAttention.js";
import { useProjectAutoMode } from "./hooks/useProjectAutoMode.js";
import { useModeAwareExit } from "./hooks/useModeAwareExit.js";
import { useResumeSession } from "./hooks/useResumeSession.js";
import { summarizeTasks } from "./app/task-summary.js";
import { formatRecentHistory } from "./app/history-context.js";
import { useTransientFlag } from "./hooks/useTransientFlag.js";
import { approvalModeFrom } from "./approval-mode.js";

export function App({
  initialProvider,
  initialModel,
  initialTheme,
  workdir,
  system,
  undercover,
  updatePromise,
  localServer,
  tuiMode = "fullscreen",
  resumeSessionId,
  onExitSummary,
  servicesReady,
}: Props) {
  const inkExit = useApp().exit;

  const overlay = useOverlayState();
  const {
    keyboardShortcutsOpen,
    setAttachInput,
    setAttachPath,
    attachments,
    setAttachments,
    setPlanRequest,
    viewingSubagentId,
  } = overlay;

  const {
    provider, setProviderState, model, setModelState, effort, setEffort,
    termCols, termRows, setTermSize, terminalMeasured,
    setTerminalMeasured, messages, setMessages, addSystemMsg, input, setInput,
    loading, setLoading, permissionQueue, setPermissionQueue, permission,
    question, setQuestion, picker, setPicker, prompt, setPrompt, tokens,
    setTokens, history, setHistory, historyRef, skillNames, setSkillNames,
    turnSkillNames, setTurnSkillNames, tasks, setTasks, commandHistory,
    setCommandHistory, startupBannerVisible, setStartupBannerVisible,
    streamingText, setStreamingText, streamingReason, setStreamingReason,
    streamingError, setStreamingError, activeTool, setActiveTool, runActivity,
    setRunActivity, themeName, setThemeName, sessionTitle, setSessionTitle,
    isUndercover, setIsUndercover, coordinatorMode, setCoordinatorMode,
    activeAgent, setActiveAgent, workdirState, setWorkdirState, composerQueue,
    setComposerQueue, branch, setBranch, wasCompacted, setWasCompacted,
    contextUsage, setContextUsage, completionProof, setCompletionProof,
    promptDiagnostics, setPromptDiagnostics,
    promptCacheHealth, setPromptCacheHealth, activeAgentCount,
    setActiveAgentCount, updateInfo, autopilotMode, setAutopilotMode,
    fullAccess, setFullAccess, fullAccessRef,
    projectAutoPromptOpen, setProjectAutoPromptOpen,
    recentCmds, setRecentCmds, designInitialBrief, setDesignInitialBrief,
    watchedPaths, setWatchedPaths, checkpoints, setCheckpoints, branches,
    setBranches, activeBranchIdx, setActiveBranchIdx, remoteStatus,
    setRemoteStatus, submitRef, autopilotRef, watchCleanupRef, mainSessionId,
    extractedRef, isFirstMessage, latestToolCallRef, btwFrameRef, skipSubmitRef,
    abortControllerRef, loadingRef, autoContinueRef, autoContinueSubmittingRef,
    remoteRuntimeRef, remoteBridgeRef, streamTextRef, streamReasonRef,
    streamTimerRef, tokenRateRef, lastTokenTimeRef, turnHadToolRef,
    turnAssistantIdRef,
  } = useAppState({ initialProvider, initialModel, initialTheme, workdir, updatePromise });
  const { exit, exiting } = useModeAwareExit(inkExit, tuiMode, () => onExitSummary?.({
    sessionId: mainSessionId.current, tokens, turns: commandHistory.length,
  }));
  useResumeSession({ sessionId: resumeSessionId, mainSessionId, setHistory, setMessages, addSystemMsg });
  const {
    overlayOpen,
    focusLayer,
    keybindingContext,
    blockingOverlayOpen,
    composerInputActive,
  } = useAppFocusModel({
    overlay,
    permission,
    projectAutoPromptOpen,
    question,
    picker,
    prompt,
    loading,
  });
  useTerminalAttention({ loading, permission, sessionTitle });

  const {
    details: transcriptDetails,
    selectedId: selectedTranscriptDetailId,
    openDetail: openTranscriptDetail,
    moveDetail: moveTranscriptDetail,
  } = useTranscriptDetails(messages, overlay);
  const { tasks: bgTasks, startBackgroundTask, cancelBackgroundTask } =
    useBackgroundTasks({
      provider,
      model,
      workdir: workdirState,
      parentSessionId: mainSessionId.current,
      getParentContext: () => formatRecentHistory(historyRef.current),
    });

  const remoteConnected = remoteStatus === "connected";

  const {
    scrollLocked, setScrollLocked, scrollLockedRef, conversationOffsetRows,
    setConversationOffsetRows, measuredViewportRows, setMeasuredViewportRows,
    unseenCount, unseenLabel, scrollConversation, handleScrollRange, pageConversation,
  } = useConversationViewport({
    messages,
    terminalRows: termRows,
    overlayOpen,
    viewingSubagent: viewingSubagentId !== null,
    pickerOpen: picker !== null,
    permissionOpen: permission !== null,
    questionOpen: question !== null,
    mouseScroll: tuiMode === "fullscreen",
  });

  const commandDefs = allCommands();
  const { cmdFilter, mentionFilter, inlineSuggestionActive } =
    useComposerSuggestions(input, focusLayer, workdirState, commandDefs);

  const showStartupBanner = !viewingSubagentId && startupBannerVisible;
  const taskSummary = useMemo(() => summarizeTasks(tasks), [tasks]);
  const sandboxBackend = useMemo(() => configuredSandboxBackend(), []);
  const selectionHintVisible = useTransientFlag(10_000);

  const inputRef = useRef(input);
  const { resolvePrompt: resolveProjectAutoPrompt, setApprovalMode } = useProjectAutoMode({
    workdir: workdirState,
    autopilotRef,
    setAutopilotMode,
    fullAccessRef,
    setFullAccess,
    setPromptOpen: setProjectAutoPromptOpen,
    addSystemMsg,
  });
  const approvalMode = approvalModeFrom(autopilotMode, fullAccess);
  const openExternalEditor = useExternalEditor({
    inputRef,
    loadingRef,
    setInput,
    addSystemMsg,
  });
  useAppLifecycle({
    initialProvider,
    workdir: workdirState,
    input,
    loading,
    autopilotRef,
    fullAccessRef,
    inputRef,
    loadingRef,
    mainSessionId,
    remoteRuntimeRef,
    setTermSize,
    setTerminalMeasured,
    setMeasuredViewportRows,
    setConversationOffsetRows,
    setQuestion,
    setActiveAgentCount,
    setPermissionQueue,
    setSkillNames,
    setTasks,
    setPlanRequest,
    setMessages,
    setIsUndercover,
    setBranch,
    addSystemMsg,
  });
  const {
    setProvider,
    setModel,
    handlePermission,
    handleQuestionAnswer,
    handleQuestionReject,
    handleAttachSubmit,
  } = useSystemRequestHandlers({
    permission,
    question,
    abortControllerRef,
    setProviderState,
    setModelState,
    setInput,
    setPermissionQueue,
    setQuestion,
    setAttachInput,
    setAttachPath,
    setAttachments,
    addSystemMsg,
  });


  const {
    executeCommand, handleCmdExecute, handleCmdFill, handleEditRerun, requestRewind,
  } = useCommandController({
    provider,
    loading,
    model,
    workdir: workdirState,
    effort,
    skillNames,
    themeName,
    isUndercover,
    coordinatorMode,
    activeAgent,
    autopilotMode,
    approvalMode,
    setApprovalMode,
    messages,
    history,
    tokens,
    contextUsage,
    promptDiagnostics,
    promptCacheHealth,
    checkpoints,
    branches,
    activeBranchIdx,
    watchedPaths,
    remoteConnected,
    bgTasks,
    overlay,
    mainSessionId,
    btwFrameRef,
    watchCleanupRef,
    remoteBridgeRef,
    skipSubmitRef,
    submitRef,
    isFirstMessage,
    extractedRef,
    setProvider,
    setModel,
    setEffort,
    setActiveAgent,
    setThemeName,
    setWorkdir: setWorkdirState,
    setIsUndercover,
    setCoordinatorMode,
    startBackgroundTask,
    cancelBackgroundTask,
    setPicker,
    setPrompt,
    setHistory,
    setMessages,
    setCheckpoints,
    setBranches,
    setActiveBranchIdx,
    setTokens,
    setWatchedPaths,
    setContextUsage,
    setCompletionProof,
    setSessionTitle,
    setDesignInitialBrief,
    setInput,
    addSystemMsg,
    exit,
  });

  const keyboardHint = useAppKeyboard({
    exit,
    tuiMode,
    setPicker,
    checkpoints,
    requestRewind,
    composerQueue,
    setComposerQueue,
    focusLayer,
    loading,
    overlayOpen,
    updateAvailable: updateInfo !== null,
    inlineSuggestionActive,
    workdir: workdirState,
    activeAgent,
    commandHistory,
    tasks,
    messages,
    transcriptDetails,
    selectedTranscriptDetailId,
    permission,
    projectAutoPromptOpen,
    resolveProjectAutoPrompt,
    pickerOpen: picker !== null,
    questionOpen: question !== null,
    overlay,
    mainSessionId, loadingRef, inputRef, abortControllerRef, streamTextRef,
    streamReasonRef, latestToolCallRef, btwFrameRef,
    setPermissionQueue,
    setMessages,
    setStreamingText,
    setStreamingReason,
    setScrollLocked,
    setConversationOffsetRows,
    setInput,
    setAttachments,
    setActiveAgent,
    addSystemMsg,
    handleAttachSubmit,
    openExternalEditor,
    scrollConversation,
    pageConversation,
    openTranscriptDetail,
  });
  const { handleSubmit, handleQueue } = useAgentSubmit({
    servicesReady,
    provider,
    model,
    workdir: workdirState,
    system,
    undercover: isUndercover || (undercover ?? false),
    effort,
    activeAgent,
    coordinatorMode,
    loading,
    history,
    messages,
    attachments,
    checkpoints,
    executeCommand,
    addSystemMsg,
    mainSessionId,
    historyRef,
    extractedRef,
    isFirstMessage,
    skipSubmitRef,
    submitRef,
    abortControllerRef,
    remoteRuntimeRef,
    autoContinueRef,
    autoContinueSubmittingRef,
    scrollLockedRef,
    streamTextRef,
    streamReasonRef,
    streamTimerRef,
    tokenRateRef,
    lastTokenTimeRef,
    turnHadToolRef,
    turnAssistantIdRef,
    latestToolCallRef,
    setInput,
    setStartupBannerVisible,
    setScrollLocked,
    setConversationOffsetRows,
    setAttachments,
    setComposerQueue,
    setCommandHistory,
    setSessionTitle,
    setStreamingError,
    setTurnSkillNames,
    setRunActivity,
    setLoading,
    setMessages,
    setStreamingText,
    setStreamingReason,
    setActiveTool,
    setCheckpoints,
    setWasCompacted,
    setContextUsage,
    setCompletionProof,
    setPromptDiagnostics,
    setPromptCacheHealth,
    setTokens,
    setHistory,
  });
  useRemoteController({
    handleSubmit,
    remoteRuntimeRef,
    remoteBridgeRef,
    abortControllerRef,
    setRemoteStatus,
    setPermissionQueue,
    addSystemMsg,
  });

  return (
    <AppScreen
      tuiMode={tuiMode}
      exiting={exiting}
      termRows={termRows}
      termCols={termCols}
      terminalMeasured={terminalMeasured}
      themeName={themeName}
      keybindingContext={keybindingContext}
      blockingOverlayOpen={blockingOverlayOpen}
      focusLayer={focusLayer}
      composerInputActive={composerInputActive}
      overlay={overlay}
      provider={provider}
      model={model}
      workdir={workdirState}
      initialWorkdir={workdir}
      tokens={tokens}
      contextUsage={contextUsage}
      completionProof={completionProof}
      loading={loading}
      coordinatorMode={coordinatorMode}
      autopilotMode={autopilotMode}
      approvalMode={approvalMode}
      keyboardHint={keyboardHint}
      activeTool={activeTool}
      runActivity={runActivity}
      tasks={tasks}
      taskSummary={taskSummary}
      runningBackgroundTaskCount={bgTasks.filter((task) => task.status === "running").length}
      localServer={localServer}
      sandboxBackend={sandboxBackend}
      activeAgentCount={activeAgentCount}
      branch={branch}
      activeAgent={activeAgent}
      skillNames={skillNames}
      turnSkillNames={turnSkillNames}
      isUndercover={isUndercover}
      wasCompacted={wasCompacted}
      remoteConnected={remoteConnected}
      effort={effort}
      showStartupBanner={showStartupBanner}
      updateInfo={updateInfo}
      sessionTitle={sessionTitle}
      history={history}
      messages={messages}
      streamingText={streamingText}
      streamingReason={streamingReason}
      streamingError={streamingError}
      scrollLocked={scrollLocked}
      conversationOffsetRows={conversationOffsetRows}
      unseenCount={unseenCount}
      unseenLabel={unseenLabel}
      selectionHintVisible={selectionHintVisible && tuiMode === "fullscreen"}
      measuredViewportRows={measuredViewportRows}
      commandHistory={commandHistory}
      commandDefs={commandDefs}
      recentCmds={recentCmds}
      designInitialBrief={designInitialBrief}
      picker={picker}
      prompt={prompt}
      question={question}
      permission={permission}
      projectAutoPromptOpen={projectAutoPromptOpen}
      resolveProjectAutoPrompt={resolveProjectAutoPrompt}
      permissionQueueLength={permissionQueue.length}
      transcriptDetails={transcriptDetails}
      input={input}
      composerQueue={composerQueue}
      inlineSuggestionActive={inlineSuggestionActive}
      cmdFilter={cmdFilter}
      mentionFilter={mentionFilter}
      mainSessionId={mainSessionId}
      btwFrameRef={btwFrameRef}
      setMeasuredViewportRows={setMeasuredViewportRows}
      setConversationOffsetRows={setConversationOffsetRows}
      setHistory={setHistory}
      setMessages={setMessages}
      setRecentCmds={setRecentCmds}
      setInput={setInput}
      setThemeName={setThemeName}
      setDesignInitialBrief={setDesignInitialBrief}
      setPicker={setPicker}
      setPrompt={setPrompt}
      addSystemMsg={addSystemMsg}
      executeCommand={executeCommand}
      handleSubmit={handleSubmit}
      handleQueue={handleQueue}
      handleCmdExecute={handleCmdExecute}
      handleCmdFill={handleCmdFill}
      handleEditRerun={handleEditRerun}
      handleQuestionAnswer={handleQuestionAnswer}
      handleQuestionReject={handleQuestionReject}
      handlePermission={handlePermission}
      handleScrollRange={handleScrollRange}
      scrollConversation={scrollConversation}
      moveTranscriptDetail={moveTranscriptDetail}
    />
  );
}
