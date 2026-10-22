import React from 'react';
import type { SessionInfo } from '../../shared/ipc-types.js';
import { Icon } from './Icons.js';

export function SessionMetadata({ session }: { session: SessionInfo }) {
  const totalTokens = session.totalInputTokens + session.totalOutputTokens + session.totalCacheTokens;
  return <section className="aur-session-metadata"><span>Session</span><dl>
    <div><dt>Status</dt><dd>{session.status} · updated {formatRelativeTime(session.updatedAt)}</dd></div>
    <div><dt>Model</dt><dd>{session.provider ?? 'Unknown provider'} · {session.lastModel ?? 'pending'}</dd></div>
    <div><dt>Usage</dt><dd>{totalTokens.toLocaleString()} tokens · ${session.accumulatedCostUsd.toFixed(4)}</dd></div>
    {session.parentId && <div><dt>Branched from</dt><dd>{session.parentId.slice(0, 12)}</dd></div>}
  </dl></section>;
}

export function CenterTab({ label, active, dirty, onClick, onClose }: { label: string; active: boolean; dirty?: boolean; onClick: () => void; onClose?: () => void }) {
  return <div className="aur-center-tab" onClick={onClick} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onClick(); } }} aria-selected={active} role="tab" tabIndex={0}>
    {dirty && <span className="aur-changed-dot" />}
    <span>{label}</span>
    {onClose && <button type="button" aria-label={`Close ${label}`} onClick={(event) => { event.stopPropagation(); onClose(); }}><Icon name="close" size={12} /></button>}
  </div>;
}

function formatRelativeTime(ms: number): string { const minutes = Math.floor((Date.now() - ms) / 60_000); if (minutes < 1) return 'just now'; if (minutes < 60) return `${minutes}m ago`; const hours = Math.floor(minutes / 60); return hours < 24 ? `${hours}h ago` : `${Math.floor(hours / 24)}d ago`; }
