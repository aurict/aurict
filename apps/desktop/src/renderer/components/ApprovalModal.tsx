import React, { useEffect, useRef, useState } from 'react';
import type { PermissionRequestPayload, PermissionDecision } from '../../shared/ipc-types.js';
import { Icon } from './Icons.js';

interface Props {
  request: PermissionRequestPayload;
  onRespond: (decision: PermissionDecision) => void;
  onEnableAutoApproveSafe: () => Promise<void>;
}

const LEVEL_LABEL = { safe: 'Low risk', warning: 'Needs review', danger: 'High risk' } as const;

// Danger-level requests, and requests that arrive while the conversation is not
// on screen, use the modal; everything else is answered inline above the composer.
export function needsApprovalModal(request: PermissionRequestPayload, conversationVisible: boolean): boolean {
  return !conversationVisible || request.level === 'danger';
}

export function ApprovalCard({ request, onRespond, onEnableAutoApproveSafe, titleId }: Props & { titleId?: string }) {
  const level = request.level ?? 'warning';
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [enablingAutoApprove, setEnablingAutoApprove] = useState(false);
  const [autoApproveError, setAutoApproveError] = useState<string | null>(null);
  const canAutoApprove = level === 'safe';

  const enableAutoApprove = async () => {
    if (!canAutoApprove || enablingAutoApprove) return;
    setEnablingAutoApprove(true);
    setAutoApproveError(null);
    try {
      await onEnableAutoApproveSafe();
      onRespond('allow_once');
    } catch (error) {
      console.error('Failed to enable safe auto-approval', error);
      setAutoApproveError(error instanceof Error ? error.message : 'Safe auto-approval could not be enabled.');
    } finally {
      setEnablingAutoApprove(false);
    }
  };
  const copy = () => { void navigator.clipboard.writeText(request.pattern).then(() => { setCopied(true); window.setTimeout(() => setCopied(false), 1_800); }).catch((error: unknown) => console.error('Failed to copy command', error)); };

  return <section className="aur-approval" data-level={level} aria-labelledby={titleId}>
    <header>
      <strong id={titleId}>{request.summary ?? `Allow ${request.tool}?`}</strong>
      <span className="aur-badge" data-tone={level}>{LEVEL_LABEL[level]}</span>
    </header>
    <p>{request.reason ?? 'This action needs your approval.'}</p>
    <div className="aur-approval-command" data-expanded={expanded || undefined}>
      <code>{request.pattern}</code>
      <button type="button" className="aur-icon-button" aria-label={copied ? 'Copied' : 'Copy command'} onClick={copy}><Icon name={copied ? 'check' : 'copy'} size={14} /></button>
    </div>
    {request.pattern.length > 160 && <button type="button" className="aur-text-action" onClick={() => setExpanded((value) => !value)}>{expanded ? 'Show less' : 'Show full command'}</button>}
    {autoApproveError && <div role="alert" className="aur-inline-error">{autoApproveError}</div>}
    <footer>
      <small>{request.tool}</small>
      <button type="button" className="aur-button" onClick={() => onRespond('deny')}>Deny</button>
      <button type="button" className="aur-button aur-button-primary" onClick={() => onRespond('allow_once')}>Allow once</button>
      {canAutoApprove && <button type="button" className="aur-button" disabled={enablingAutoApprove} title="Allow this and future safe actions automatically. Writes, destructive commands and warnings still ask." onClick={() => { void enableAutoApprove(); }}>{enablingAutoApprove ? 'Enabling…' : 'Always allow safe'}</button>}
    </footer>
  </section>;
}

export function ApprovalModal({ request, onRespond, onEnableAutoApproveSafe }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialogRef.current?.querySelector<HTMLButtonElement>('footer button')?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onRespond('deny');
      if (event.key !== 'Tab') return;
      const controls = dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled])');
      if (!controls?.length) return;
      const first = controls.item(0); const last = controls.item(controls.length - 1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onRespond]);

  return <div className="aur-dialog-backdrop" data-strong>
    <div ref={dialogRef} className="aur-approval-dialog" role="dialog" aria-modal="true" aria-labelledby="aur-approval-title">
      <ApprovalCard request={request} onRespond={onRespond} onEnableAutoApproveSafe={onEnableAutoApproveSafe} titleId="aur-approval-title" />
    </div>
  </div>;
}
