import React, { useEffect, useState } from 'react';
import type { RemoteStatus, SessionInfo } from '../../shared/ipc-types.js';
import type { useSessions } from '../hooks/useSessions.js';
import { useErrorToast } from '../hooks/useErrorToast.js';
import { readShortcuts, shortcutLabel } from '../shortcuts.js';
import { ConfirmDialog, PromptDialog } from './Dialog.js';
import { Icon } from './Icons.js';
import { ToastRegion, useToasts } from './ToastRegion.js';
import { VirtualSessionList } from './VirtualSessionList.js';

interface Props {
  sessions: ReturnType<typeof useSessions>;
  workspace: string;
  settingsActive: boolean;
  onOpenSession: () => void;
  onOpenSettings: () => void;
  onConnectPhone: () => void;
}

interface ConfirmAction { title: string; description: string; confirmLabel: string; onConfirm: () => void }

export function Sidebar({ sessions, workspace, settingsActive, onOpenSession, onOpenSettings, onConnectPhone }: Props) {
  const [query, setQuery] = useState('');
  const [renameId, setRenameId] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState('');
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const { toasts, show: showToast, dismiss: dismissToast } = useToasts();
  useErrorToast(sessions.error, sessions.errorSeq, sessions.retryAction, showToast, dismissToast);
  const workspaceName = workspace.split(/[\\/]/).filter(Boolean).pop() ?? workspace;
  const report = (fallback: string) => (error: unknown) => showToast(error instanceof Error ? error.message : fallback, 'error');

  const search = (value: string) => {
    setQuery(value);
    void sessions.search(value).catch(report('Search failed'));
  };
  const open = (id: string) => { sessions.select(id); onOpenSession(); };
  const commitRename = () => {
    const id = renameId; const title = titleDraft.trim();
    setRenameId(null);
    if (!id || !title) return;
    void sessions.rename(id, title).then(() => showToast('Session renamed', 'success')).catch(report('Session could not be renamed'));
  };
  const branch = (session: SessionInfo) => { void sessions.branch(session.id).then(() => { onOpenSession(); showToast('Branched session is ready', 'success'); }).catch(report('Session could not be branched')); };
  const archive = (session: SessionInfo) => { void sessions.archive(session.id, session.status !== 'archived').then(() => showToast(session.status === 'archived' ? 'Session restored' : 'Session archived', 'success')).catch(report('Session could not be updated')); };

  return <aside className="aur-sidebar" aria-label="Sessions">
    <div className="aur-sidebar-brand"><span>hoprel</span><small>by aurict</small></div>
    <div className="aur-sidebar-actions">
      <button type="button" className="aur-sidebar-new" onClick={() => { sessions.create(); onOpenSession(); }}>
        <Icon name="plus" /><span>New session</span><kbd>{shortcutLabel(readShortcuts().newSession)}</kbd>
      </button>
      <label className="aur-search-field">
        <Icon name="search" />
        <input aria-label="Search session history" value={query} onChange={(event) => search(event.target.value)} placeholder="Search" />
      </label>
    </div>

    {query.trim()
      ? <div className="aur-sidebar-results">
        {sessions.searchResults.length === 0
          ? <p className="aur-sidebar-empty">No matching messages.</p>
          : sessions.searchResults.map((result) => <button key={result.sessionId} type="button" className="aur-session-row" onClick={() => { open(result.sessionId); setQuery(''); }}>
            <strong>{result.title ?? 'Untitled session'}</strong>
            <small>{result.matchCount} {result.matchCount === 1 ? 'match' : 'matches'} · {result.excerpt}</small>
          </button>)}
      </div>
      : <>
        <h2 className="aur-sidebar-heading">Sessions</h2>
        <VirtualSessionList
          sessions={sessions.sessions}
          activeId={sessions.activeId}
          workspace={workspaceName}
          onSelect={open}
          onRename={(session) => { setRenameId(session.id); setTitleDraft(session.title ?? ''); }}
          onBranch={branch}
          onArchive={archive}
          onRemove={(session) => setConfirmAction({ title: 'Delete session?', description: `Delete ${session.title ?? 'this session'} and its local conversation history?`, confirmLabel: 'Delete session', onConfirm: () => sessions.remove(session.id) })}
        />
      </>}

    <AccountRow settingsActive={settingsActive} onOpenSettings={onOpenSettings} onConnectPhone={onConnectPhone} />

    {renameId && <PromptDialog title="Rename session" description="This changes only the local session title." label="Session title" placeholder="Project exploration" confirmLabel="Rename" value={titleDraft} onCancel={() => setRenameId(null)} onChange={setTitleDraft} onConfirm={commitRename} />}
    {confirmAction && <ConfirmDialog title={confirmAction.title} description={confirmAction.description} confirmLabel={confirmAction.confirmLabel} tone="danger" onCancel={() => setConfirmAction(null)} onConfirm={() => { const action = confirmAction.onConfirm; setConfirmAction(null); action(); }} />}
    <ToastRegion toasts={toasts} onDismiss={dismissToast} />
  </aside>;
}

function AccountRow({ settingsActive, onOpenSettings, onConnectPhone }: { settingsActive: boolean; onOpenSettings: () => void; onConnectPhone: () => void }) {
  const [status, setStatus] = useState<RemoteStatus | null>(null);
  useEffect(() => {
    const unsubscribe = window.aurict.remote.onStatus(setStatus);
    window.aurict.remote.action('status');
    return unsubscribe;
  }, []);
  const name = status?.email ?? 'Local workspace';
  const phoneConnected = status?.status === 'connected';
  return <div className="aur-account-row">
    <span className="aur-avatar" aria-hidden="true">{name.charAt(0).toUpperCase()}</span>
    <div><strong>{name}</strong><small>{phoneConnected ? 'Phone connected' : status?.email ? 'Aurict account' : 'Not signed in'}</small></div>
    <button type="button" className="aur-icon-button" aria-label={phoneConnected ? 'Phone connected. Manage remote control' : 'Connect phone'} aria-pressed={phoneConnected} title={phoneConnected ? 'Phone connected' : 'Connect phone'} onClick={onConnectPhone}><Icon name="phone" /></button>
    <button type="button" className="aur-icon-button" aria-label="Open settings" aria-current={settingsActive ? 'page' : undefined} onClick={onOpenSettings}><Icon name="gear" /></button>
  </div>;
}
