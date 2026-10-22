import React, { useState } from 'react';
import type { ChangedFile } from '../../shared/ipc-types.js';
import type { useWorkspaceChanges } from '../hooks/useWorkspaceChanges.js';
import { Icon } from './Icons.js';

export interface PanelConfirm { title: string; description: string; confirmLabel: string; onConfirm: () => void }

interface Props {
  changes: ReturnType<typeof useWorkspaceChanges>;
  activeDiff: string | null;
  onOpenDiff: (path: string) => void;
  onRevertFile: (path: string) => void;
  onAskHoprel: (prompt: string) => void;
  confirm: (action: PanelConfirm) => void;
  promptFor: (request: { title: string; description: string; label: string; placeholder: string; confirmLabel: string; onSubmit: (value: string) => void }) => void;
  notify: (message: string, tone: 'success' | 'error') => void;
}

const STATUS_LETTER: Record<ChangedFile['status'], string> = { modified: 'M', added: 'A', deleted: 'D', renamed: 'R', untracked: 'U' };
const message = (reason: unknown, fallback: string) => (reason instanceof Error ? reason.message : fallback);

export function ChangesPanel({ changes, activeDiff, onOpenDiff, onRevertFile, onAskHoprel, confirm, promptFor, notify }: Props) {
  const [commitMessage, setCommitMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const { status, checkpoints } = changes;
  const totals = status.files.reduce((sum, file) => ({ additions: sum.additions + file.additions, deletions: sum.deletions + file.deletions }), { additions: 0, deletions: 0 });

  const act = async (work: () => Promise<string>, failure: string) => {
    setBusy(true);
    try { notify(await work(), 'success'); await changes.refresh(); }
    catch (reason) { notify(message(reason, failure), 'error'); }
    finally { setBusy(false); }
  };
  const commit = () => void act(async () => {
    const result = await window.aurict.rpc('git/commit', { message: commitMessage });
    setCommitMessage('');
    return `Committed ${result.commit}`;
  }, 'The commit failed.');
  const newBranch = () => promptFor({ title: 'Create branch', description: 'Creates the branch from the current commit and switches to it. Uncommitted changes come along.', label: 'Branch name', placeholder: 'feature/desktop-redesign', confirmLabel: 'Create branch', onSubmit: (name) => void act(async () => { await window.aurict.rpc('git/createBranch', { name }); return `Switched to ${name}`; }, 'The branch could not be created.') });
  const pullRequest = () => promptFor({ title: 'Open pull request', description: `Pushes ${status.branch ?? 'this branch'} to origin and opens a pull request with the GitHub CLI.`, label: 'Title', placeholder: 'Describe the change', confirmLabel: 'Push and open', onSubmit: (title) => void act(async () => { const result = await window.aurict.rpc('git/pullRequest', { title, body: '' }); return result.url ? `Pull request opened: ${result.url}` : 'Pull request opened'; }, 'The pull request could not be opened.') });
  const restore = (id: string, files: number) => confirm({ title: 'Undo edits from this turn?', description: `Hoprel's file edits from this turn (${files} ${files === 1 ? 'file' : 'files'}) and every later turn are undone. The conversation is kept.`, confirmLabel: 'Undo edits', onConfirm: () => void act(async () => { const result = await window.aurict.rpc('checkpoint/restore', { id }); return `Restored ${result.restored.length} ${result.restored.length === 1 ? 'file' : 'files'}`; }, 'The checkpoint could not be restored.') });

  if (!status.repository) {
    return <div className="aur-inspector-body">
      <div className="aur-inspector-heading"><h2>Changes</h2></div>
      <p className="aur-inspector-empty">{changes.loading ? 'Checking this workspace…' : 'This workspace is not a Git repository. Checkpoints below still let you undo Hoprel’s edits.'}</p>
      <CheckpointList checkpoints={checkpoints} busy={busy} onRestore={restore} />
    </div>;
  }

  return <div className="aur-inspector-body">
    <div className="aur-inspector-heading">
      <h2>{status.files.length > 0 ? 'Changed files' : 'No changes'}</h2>
      {status.files.length > 0 && <span className="aur-diff-stat"><b>+{totals.additions}</b> <i>−{totals.deletions}</i></span>}
      <button type="button" className="aur-icon-button" aria-label="Refresh changes" title="Refresh" disabled={changes.loading} onClick={() => void changes.refresh()}><Icon name="restore" size={14} /></button>
    </div>
    {status.branch && <p className="aur-branch-line"><Icon name="branch" size={13} /><code>{status.branch}</code></p>}
    <ul className="aur-change-list">
      {status.files.map((file) => <li key={file.path} aria-current={activeDiff === file.path ? 'true' : undefined}>
        <button type="button" onClick={() => onOpenDiff(file.path)} title={file.path}>
          <span className="aur-change-status" data-status={file.status}>{STATUS_LETTER[file.status]}</span>
          <span className="aur-change-path">{file.path.split('/').pop()}<small>{file.path.includes('/') ? file.path.slice(0, file.path.lastIndexOf('/')) : ''}</small></span>
          <span className="aur-diff-stat">{file.binary ? 'binary' : <><b>+{file.additions}</b> <i>−{file.deletions}</i></>}</span>
        </button>
        <span className="aur-file-actions"><button type="button" aria-label={`Revert ${file.path}`} title="Revert file" onClick={() => onRevertFile(file.path)}><Icon name="restore" size={13} /></button></span>
      </li>)}
    </ul>

    {status.files.length > 0 && <div className="aur-commit-box">
      <textarea aria-label="Commit message" rows={2} value={commitMessage} placeholder="Commit message" onChange={(event) => setCommitMessage(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && (event.metaKey || event.ctrlKey) && commitMessage.trim()) commit(); }} />
      <div>
        <button type="button" className="aur-button aur-button-small" onClick={() => onAskHoprel('Suggest a concise conventional commit message for the current uncommitted changes. Reply with the message only.')}><Icon name="sparkle" size={13} />Suggest</button>
        <span className="aur-composer-spacer" />
        <button type="button" className="aur-button aur-button-primary aur-button-small" disabled={busy || !commitMessage.trim()} onClick={commit}><Icon name="commit" size={13} />Commit all</button>
      </div>
    </div>}
    <div className="aur-git-actions">
      <button type="button" className="aur-button aur-button-small" disabled={busy} onClick={newBranch}><Icon name="branch" size={13} />New branch</button>
      <button type="button" className="aur-button aur-button-small" disabled={busy || !status.branch} onClick={pullRequest}><Icon name="export" size={13} />Pull request</button>
    </div>
    <CheckpointList checkpoints={checkpoints} busy={busy} onRestore={restore} />
  </div>;
}

function CheckpointList({ checkpoints, busy, onRestore }: { checkpoints: ReturnType<typeof useWorkspaceChanges>['checkpoints']; busy: boolean; onRestore: (id: string, files: number) => void }) {
  return <section className="aur-checkpoints" aria-label="Checkpoints">
    <div className="aur-inspector-heading"><h2>Checkpoints</h2></div>
    {checkpoints.length === 0 && <p className="aur-inspector-empty">Each turn that edits files saves a checkpoint here.</p>}
    <ul>{checkpoints.map((checkpoint) => <li key={checkpoint.id}>
      <div><strong>{checkpoint.prompt || 'Turn'}</strong><small>{new Date(checkpoint.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} · {checkpoint.files.length} {checkpoint.files.length === 1 ? 'file' : 'files'}</small></div>
      <button type="button" className="aur-button aur-button-small" disabled={busy} onClick={() => onRestore(checkpoint.id, checkpoint.files.length)}>Restore</button>
    </li>)}</ul>
  </section>;
}
