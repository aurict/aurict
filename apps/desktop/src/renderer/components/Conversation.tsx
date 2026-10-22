import React, { useState } from 'react';
import type { useAgents } from '../hooks/useAgents.js';
import type { useChat } from '../hooks/useChat.js';
import { useErrorToast } from '../hooks/useErrorToast.js';
import type { useModelSelection } from '../hooks/useModelSelection.js';
import type { usePermission } from '../hooks/usePermission.js';
import type { useProviders } from '../hooks/useProviders.js';
import type { useSessions } from '../hooks/useSessions.js';
import { ApprovalCard, needsApprovalModal } from './ApprovalModal.js';
import { ChatTimeline } from './ChatTimeline.js';
import { Composer } from './Composer.js';
import { ContextDrawer } from './TaskActivity.js';
import { ToastRegion, useToasts } from './ToastRegion.js';
import { SessionMetadata } from './WorkspaceChrome.js';
import type { CommandAction } from '../experience/commands.js';

export interface ConversationCopy {
  headline: string;
  detail: string;
  placeholder: string;
  prompts: Array<{ title: string; prompt: string }>;
}

interface Props {
  copy: ConversationCopy;
  chat: ReturnType<typeof useChat>;
  sessions: ReturnType<typeof useSessions>;
  agents: ReturnType<typeof useAgents>;
  providers: ReturnType<typeof useProviders>;
  modelSelection: ReturnType<typeof useModelSelection>;
  permission: ReturnType<typeof usePermission>;
  onEnableAutoApproveSafe: () => Promise<void>;
  commands: CommandAction[];
  workspace: string;
  onChooseWorkspace: () => Promise<unknown>;
}

export function Conversation({ copy, chat, sessions, agents, providers, modelSelection, permission, onEnableAutoApproveSafe, commands, workspace, onChooseWorkspace }: Props) {
  const [draft, setDraft] = useState('');
  const [contextOpen, setContextOpen] = useState(false);
  const { toasts, show: showToast, dismiss: dismissToast } = useToasts();
  useErrorToast(providers.error, providers.errorSeq, providers.refresh, showToast, dismissToast);
  useErrorToast(agents.error, agents.errorSeq, agents.refresh, showToast, dismissToast);
  useErrorToast(modelSelection.error, modelSelection.errorSeq, null, showToast, dismissToast);

  const session = sessions.sessions.find((item) => item.id === sessions.activeId) ?? null;
  const empty = chat.messages.length === 0 && !chat.pending;
  const inlineApproval = permission.current && !needsApprovalModal(permission.current, true) ? permission.current : null;
  const workspaceName = workspace.split(/[\\/]/).filter(Boolean).pop() ?? workspace;

  const composer = <Composer
    chat={chat}
    agents={agents}
    providers={providers}
    modelSelection={modelSelection}
    commands={commands}
    draft={draft}
    onDraftChange={setDraft}
    placeholder={copy.placeholder}
    workspace={workspace}
    onChooseWorkspace={onChooseWorkspace}
    onOpenContext={() => setContextOpen(true)}
    onError={(message) => showToast(message, 'error')}
  />;

  return <div className="aur-conversation" data-empty={empty || undefined}>
    {empty
      ? <div className="aur-empty-state">
        <h1>{copy.headline}</h1>
        <p>{copy.detail}</p>
        {composer}
        <div className="aur-suggestions" aria-label="Suggestions">
          {copy.prompts.map((prompt) => <button key={prompt.title} type="button" className="aur-chip-button" onClick={() => setDraft(prompt.prompt)}>{prompt.title}</button>)}
        </div>
      </div>
      : <>
        <ChatTimeline
          sessionId={sessions.activeId}
          messages={chat.messages}
          activities={chat.activities}
          pending={chat.pending}
          onRetry={chat.retryLast}
          header={<header className="aur-conversation-header"><h1>{session?.title ?? 'New session'}</h1><small>{workspaceName} · {session ? new Date(session.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Today'}</small></header>}
        />
        <div className="aur-conversation-dock">
          {inlineApproval && <ApprovalCard key={inlineApproval.id} request={inlineApproval} onRespond={permission.respond} onEnableAutoApproveSafe={onEnableAutoApproveSafe} />}
          {composer}
        </div>
      </>}
    {contextOpen && <ContextDrawer
      agent={agents.agents.find((agent) => agent.id === agents.agentId)?.name ?? 'Hoprel'}
      provider={providers.providers.find((provider) => provider.id === modelSelection.providerId)?.name ?? 'Not configured'}
      model={modelSelection.models.find((model) => model.id === modelSelection.modelId)?.name ?? 'Not selected'}
      session={session?.title ?? 'New session'}
      attachments={chat.contextAttachments}
      details={session ? <SessionMetadata session={session} /> : null}
      onClose={() => setContextOpen(false)}
    />}
    <ToastRegion toasts={toasts} onDismiss={dismissToast} />
  </div>;
}
