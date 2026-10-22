import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { SessionInfo } from '../../shared/ipc-types.js';
import { Icon } from './Icons.js';

interface Props { sessions: SessionInfo[]; activeId: string | null; workspace: string; onSelect: (id: string) => void; onRename: (session: SessionInfo) => void; onBranch: (session: SessionInfo) => void; onArchive: (session: SessionInfo) => void; onRemove: (session: SessionInfo) => void; }

export function VirtualSessionList({ sessions, activeId, workspace, onSelect, onRename, onBranch, onArchive, onRemove }: Props) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({ count: sessions.length, getScrollElement: () => parentRef.current, estimateSize: () => 58, overscan: 8 });
  if (sessions.length === 0) return <p className="aur-sidebar-empty">No sessions yet. Start one to see it here.</p>;
  return <div ref={parentRef} className="aur-session-list"><div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>{virtualizer.getVirtualItems().map((row) => {
    const session = sessions[row.index]; if (!session) return null;
    const title = session.title ?? 'Untitled session';
    const archived = session.status === 'archived';
    return <div key={session.id} ref={virtualizer.measureElement} data-index={row.index} style={{ position: 'absolute', inset: '0 0 auto', transform: `translateY(${row.start}px)` }}>
      <article role="button" tabIndex={0} className="aur-session-row" aria-current={session.id === activeId ? 'true' : undefined} data-archived={archived || undefined} onClick={() => onSelect(session.id)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(session.id); } }}>
        <strong>{title}</strong>
        <small>{archived ? 'Archived · ' : ''}{workspace} · {relative(session.updatedAt)} · {session.turnCount} {session.turnCount === 1 ? 'turn' : 'turns'}</small>
        <span className="aur-session-actions">
          <button type="button" aria-label={`Branch ${title}`} title="Branch" onClick={(event) => { event.stopPropagation(); onBranch(session); }}><Icon name="branch" size={14} /></button>
          <button type="button" aria-label={`${archived ? 'Restore' : 'Archive'} ${title}`} title={archived ? 'Restore' : 'Archive'} onClick={(event) => { event.stopPropagation(); onArchive(session); }}><Icon name={archived ? 'restore' : 'archive'} size={14} /></button>
          <button type="button" aria-label={`Rename ${title}`} title="Rename" onClick={(event) => { event.stopPropagation(); onRename(session); }}><Icon name="pencil" size={14} /></button>
          <button type="button" aria-label={`Delete ${title}`} title="Delete" onClick={(event) => { event.stopPropagation(); onRemove(session); }}><Icon name="trash" size={14} /></button>
        </span>
      </article>
    </div>;
  })}</div></div>;
}

function relative(time: number) {
  const minutes = Math.floor((Date.now() - time) / 60_000);
  if (minutes < 1) return 'Now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return hours < 48 ? 'Yesterday' : new Date(time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
