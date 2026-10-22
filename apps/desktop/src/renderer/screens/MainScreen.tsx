import React, { useCallback, useEffect, useState } from 'react';
import type { ArtifactInfo } from '../../shared/ipc-types.js';
import { ChangesPanel, type PanelConfirm } from '../components/ChangesPanel.js';
import { CodeEditorTab } from '../components/CodeEditorTab.js';
import { Conversation } from '../components/Conversation.js';
import { ConfirmDialog, PromptDialog } from '../components/Dialog.js';
import { DiffView } from '../components/DiffView.js';
import { Icon } from '../components/Icons.js';
import { TerminalPanel } from '../components/TerminalPanel.js';
import { ToastRegion, useToasts } from '../components/ToastRegion.js';
import { CenterTab } from '../components/WorkspaceChrome.js';
import { CONVERSATION_COPY } from '../experience/copy.js';
import { useErrorToast } from '../hooks/useErrorToast.js';
import { useFileTree } from '../hooks/useFileTree.js';
import { useWorkspaceChanges } from '../hooks/useWorkspaceChanges.js';

type ConversationProps = Omit<React.ComponentProps<typeof Conversation>, 'copy'>;
export type InspectorTab = 'changes' | 'files' | 'terminal' | 'tasks' | 'artifacts';

interface MainScreenProps extends ConversationProps {
  inspectorOpen: boolean;
  inspectorTab: InspectorTab;
  onInspectorTab: (tab: InspectorTab) => void;
  artifacts: ArtifactInfo[];
  activeArtifactId: string | null;
  onSelectArtifact: (id: string) => void;
}

interface PromptRequest { title: string; description: string; label: string; placeholder: string; confirmLabel: string; onSubmit: (value: string) => void }

// Center tabs: the conversation, open files ("path") and diffs ("diff:path").
const DIFF_PREFIX = 'diff:';
const LEVEL_LABEL = { safe: 'Low risk', warning: 'Needs review', danger: 'High risk' } as const;

export function MainScreen({ inspectorOpen, inspectorTab, onInspectorTab, artifacts, activeArtifactId, onSelectArtifact, ...conversation }: MainScreenProps) {
  const { permission, chat, agents, workspace } = conversation;
  const fileTree = useFileTree();
  const changes = useWorkspaceChanges(chat.pending, workspace);
  const [tabs, setTabs] = useState<string[]>([]);
  const [activeCenterTab, setActiveCenterTab] = useState<string>('chat');
  const [dirtyFiles, setDirtyFiles] = useState<Record<string, boolean>>({});
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [confirmAction, setConfirmAction] = useState<PanelConfirm | null>(null);
  const [prompt, setPrompt] = useState<PromptRequest | null>(null);
  const [promptValue, setPromptValue] = useState('');
  const { toasts, show: showToast, dismiss: dismissToast } = useToasts();
  useErrorToast(fileTree.error, fileTree.errorSeq, fileTree.refresh, showToast, dismissToast);
  useErrorToast(changes.error, changes.errorSeq, () => { void changes.refresh(); }, showToast, dismissToast);
  // Approvals are answered inline in the conversation, so bring it forward
  // when a request arrives while a file or diff tab is in front.
  const pendingRequestId = permission.current?.id;
  useEffect(() => { if (pendingRequestId) setActiveCenterTab('chat'); }, [pendingRequestId]);

  const openTab = (id: string) => {
    setTabs((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setActiveCenterTab(id);
  };

  const closeTabNow = (id: string) => {
    setTabs((prev) => prev.filter((tab) => tab !== id));
    setDirtyFiles((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setActiveCenterTab((cur) => (cur === id ? 'chat' : cur));
  };
  const closeTab = (id: string) => {
    if (!dirtyFiles[id]) { closeTabNow(id); return; }
    setConfirmAction({ title: 'Discard unsaved changes?', description: `${id} has changes that have not been saved. This cannot be undone.`, confirmLabel: 'Close without saving', onConfirm: () => closeTabNow(id) });
  };
  const handleFileDirtyChange = useCallback((path: string, dirty: boolean) => {
    setDirtyFiles((prev) => ({ ...prev, [path]: dirty }));
  }, []);

  const askPrompt = (request: PromptRequest) => { setPromptValue(''); setPrompt(request); };
  const createEntry = (kind: 'file' | 'folder') => askPrompt({
    title: `Create ${kind}`, description: 'The path is relative to the active workspace.', label: `${kind === 'file' ? 'File' : 'Folder'} path`,
    placeholder: kind === 'file' ? 'src/example.ts' : 'src/components', confirmLabel: kind === 'file' ? 'Create file' : 'Create folder',
    onSubmit: (name) => {
      const create = kind === 'file' ? window.aurict.files.create(name) : window.aurict.files.mkdir(name);
      void create.then((res) => {
        if (!res.ok) { showToast(res.error ?? `Failed to create ${kind}`, 'error'); return; }
        fileTree.refresh();
        if (kind === 'file') openTab(name);
        showToast(`${kind === 'file' ? 'File' : 'Folder'} created`, 'success');
      });
    },
  });
  const handleDeleteFile = (path: string) => setConfirmAction({
    title: 'Delete file?', description: `${path} will be permanently removed from this workspace.`, confirmLabel: 'Delete file',
    onConfirm: () => {
      void window.aurict.files.delete(path).then((res) => {
        if (!res.ok) { showToast(res.error ?? 'Failed to delete file', 'error'); return; }
        fileTree.refresh();
        closeTabNow(path);
        showToast('File deleted', 'success');
      });
    },
  });
  const revertFile = (path: string) => {
    const file = changes.status.files.find((item) => item.path === path);
    setConfirmAction({
      title: file?.status === 'untracked' ? 'Delete new file?' : 'Revert file?',
      description: file?.status === 'untracked' ? `${path} is not tracked by Git, so reverting deletes it. This cannot be undone.` : `${path} goes back to the last commit. Uncommitted edits in it are lost.`,
      confirmLabel: file?.status === 'untracked' ? 'Delete file' : 'Revert file',
      onConfirm: () => {
        void window.aurict.rpc('git/revertFile', { path }).then(() => {
          closeTabNow(`${DIFF_PREFIX}${path}`);
          fileTree.refresh();
          void changes.refresh();
          showToast(`${path} reverted`, 'success');
        }).catch((reason: unknown) => showToast(reason instanceof Error ? reason.message : 'The file could not be reverted.', 'error'));
      },
    });
  };
  const startRename = (path: string) => { setRenamingPath(path); setRenameDraft(path); };
  const commitRename = () => {
    const oldPath = renamingPath;
    const newPath = renameDraft.trim();
    setRenamingPath(null);
    if (!oldPath || !newPath || newPath === oldPath) return;
    void window.aurict.files.rename(oldPath, newPath).then((res) => {
      if (!res.ok) { showToast(res.error ?? 'Failed to rename file', 'error'); return; }
      fileTree.refresh();
      setTabs((prev) => prev.map((p) => (p === oldPath ? newPath : p)));
      setActiveCenterTab((cur) => (cur === oldPath ? newPath : cur));
      showToast('File renamed', 'success');
    });
  };
  const askHoprel = (text: string) => { setActiveCenterTab('chat'); chat.submit(text, agents.agentId); };

  const activeIsDiff = activeCenterTab.startsWith(DIFF_PREFIX) && tabs.includes(activeCenterTab);
  const activeIsFile = !activeIsDiff && activeCenterTab !== 'chat' && tabs.includes(activeCenterTab);

  return (
    <div className="aur-workspace">
      <main className="aur-workspace-center">
        {tabs.length > 0 && <div className="aur-center-tabs" role="tablist" aria-label="Open documents">
          <CenterTab label="Chat" active={activeCenterTab === 'chat'} onClick={() => setActiveCenterTab('chat')} />
          {tabs.map((id) => {
            const diff = id.startsWith(DIFF_PREFIX);
            const path = diff ? id.slice(DIFF_PREFIX.length) : id;
            return <CenterTab key={id} label={`${diff ? 'Diff · ' : ''}${path.split('/').pop() ?? path}`} active={activeCenterTab === id} dirty={Boolean(dirtyFiles[id])} onClick={() => setActiveCenterTab(id)} onClose={() => closeTab(id)} />;
          })}
        </div>}
        {activeIsDiff
          ? <DiffView path={activeCenterTab.slice(DIFF_PREFIX.length)} onRevert={revertFile} onOpenFile={openTab} />
          : activeIsFile
            ? <CodeEditorTab path={activeCenterTab} onDirtyChange={handleFileDirtyChange} />
            : <Conversation copy={CONVERSATION_COPY.developer} {...conversation} />}
      </main>

      {inspectorOpen && <aside className="aur-inspector" aria-label="Inspector">
        <div className="aur-inspector-tabs" role="tablist" aria-label="Inspector sections">
          <InspectorTabButton id="changes" label="Changes" count={changes.status.files.length} active={inspectorTab} onSelect={onInspectorTab} />
          <InspectorTabButton id="files" label="Files" active={inspectorTab} onSelect={onInspectorTab} />
          <InspectorTabButton id="terminal" label="Terminal" active={inspectorTab} onSelect={onInspectorTab} />
          <InspectorTabButton id="tasks" label="Tasks" count={permission.pendingCount} active={inspectorTab} onSelect={onInspectorTab} />
          <InspectorTabButton id="artifacts" label="Artifacts" count={artifacts.length} active={inspectorTab} onSelect={onInspectorTab} />
        </div>

        {inspectorTab === 'changes' && <ChangesPanel
          changes={changes}
          activeDiff={activeIsDiff ? activeCenterTab.slice(DIFF_PREFIX.length) : null}
          onOpenDiff={(path) => openTab(`${DIFF_PREFIX}${path}`)}
          onRevertFile={revertFile}
          onAskHoprel={askHoprel}
          confirm={setConfirmAction}
          promptFor={askPrompt}
          notify={(message, tone) => showToast(message, tone)}
        />}

        {inspectorTab === 'files' && <div className="aur-inspector-body">
          <div className="aur-inspector-heading">
            <h2>Files</h2>
            <button type="button" className="aur-icon-button" aria-label="New file" title="New file" onClick={() => createEntry('file')}><Icon name="file" size={14} /></button>
            <button type="button" className="aur-icon-button" aria-label="New folder" title="New folder" onClick={() => createEntry('folder')}><Icon name="folder" size={14} /></button>
          </div>
          {fileTree.files.length === 0 && <p className="aur-inspector-empty">No files found in this workspace.</p>}
          <ul className="aur-file-tree">
            {fileTree.files.map((f) => (
              <li key={f.path} style={{ paddingLeft: f.depth * 14 }} data-changed={f.changed || undefined}>
                {renamingPath === f.path ? (
                  <input
                    autoFocus
                    aria-label={`New name for ${f.name}`}
                    value={renameDraft}
                    onChange={(e) => setRenameDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setRenamingPath(null); }}
                    onBlur={commitRename}
                  />
                ) : (
                  <>
                    <button type="button" aria-label={f.type === 'file' ? `Open ${f.name}` : f.name} disabled={f.type !== 'file'} onClick={() => openTab(f.path)}>
                      <Icon name={f.type === 'dir' ? 'folder' : 'file'} size={14} />
                      <span>{f.name}</span>
                      {f.changed && <><span className="aur-changed-dot" /><span className="aur-visually-hidden">changed</span></>}
                    </button>
                    {f.type === 'file' && <span className="aur-file-actions">
                      <button type="button" aria-label={`Rename ${f.name}`} onClick={() => startRename(f.path)}><Icon name="pencil" size={13} /></button>
                      <button type="button" aria-label={`Delete ${f.name}`} onClick={() => handleDeleteFile(f.path)}><Icon name="trash" size={13} /></button>
                    </span>}
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>}

        {inspectorTab === 'terminal' && <TerminalPanel workspace={workspace} />}

        {inspectorTab === 'tasks' && <div className="aur-inspector-body">
          <div className="aur-inspector-heading"><h2>Pending approvals</h2></div>
          {permission.queue.length === 0 && <p className="aur-inspector-empty">No pending approvals.</p>}
          {permission.queue.map((q, i) => (
            <div key={q.id} className="aur-task-card" data-level={q.level ?? 'warning'}>
              <div><span className="aur-badge" data-tone={q.level ?? 'warning'}>{LEVEL_LABEL[q.level ?? 'warning']}</span><code>{q.tool}</code>{i === 0 && <small>Waiting</small>}</div>
              <p>{q.summary ?? q.pattern}</p>
            </div>
          ))}
        </div>}

        {inspectorTab === 'artifacts' && <div className="aur-inspector-body">
          <div className="aur-inspector-heading"><h2>Artifacts</h2></div>
          {artifacts.length === 0 && <p className="aur-inspector-empty">Files Hoprel creates in a session appear here.</p>}
          <ul className="aur-artifact-list">
            {artifacts.map((artifact) => <li key={artifact.id}>
              <button type="button" aria-current={artifact.id === activeArtifactId ? 'true' : undefined} onClick={() => onSelectArtifact(artifact.id)}>
                <Icon name="artifact" size={14} /><span>{artifact.title}</span><small>{artifact.lifecycle}</small>
              </button>
            </li>)}
          </ul>
        </div>}
      </aside>}

      {confirmAction && (
        <ConfirmDialog
          confirmLabel={confirmAction.confirmLabel}
          description={confirmAction.description}
          onCancel={() => setConfirmAction(null)}
          onConfirm={() => { const action = confirmAction.onConfirm; setConfirmAction(null); action(); }}
          title={confirmAction.title}
          tone="danger"
        />
      )}
      {prompt && (
        <PromptDialog
          confirmLabel={prompt.confirmLabel}
          description={prompt.description}
          label={prompt.label}
          onCancel={() => setPrompt(null)}
          onChange={setPromptValue}
          onConfirm={() => { const value = promptValue.trim(); const submit = prompt.onSubmit; setPrompt(null); if (value) submit(value); }}
          placeholder={prompt.placeholder}
          title={prompt.title}
          value={promptValue}
        />
      )}
      <ToastRegion onDismiss={dismissToast} toasts={toasts} />
    </div>
  );
}

function InspectorTabButton({ id, label, count = 0, active, onSelect }: { id: InspectorTab; label: string; count?: number; active: InspectorTab; onSelect: (tab: InspectorTab) => void }) {
  return <button type="button" role="tab" aria-selected={active === id} onClick={() => onSelect(id)}>{label}{count > 0 && <span className="aur-count">{count}</span>}</button>;
}
