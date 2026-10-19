import React from 'react';
import type { FinanceConversation } from '../../shared/ipc-types.js';

interface Props {
  conversations: FinanceConversation[];
  activeId: string | null;
  pending: boolean;
  onCreate: () => void;
  onSelect: (id: string) => void;
  onRemove: (conversation: FinanceConversation) => void;
}

const statusLabel: Record<FinanceConversation['status'], string> = {
  active: 'working', complete: 'complete', 'needs-review': 'needs review', failed: 'failed', cancelled: 'cancelled',
};

export function FinanceConversationList({ conversations, activeId, pending, onCreate, onSelect, onRemove }: Props) {
  return <aside className="aur-finance-left" style={railStyle}>
    <button type="button" onClick={onCreate} disabled={pending} style={newButtonStyle}>+ new research</button>
    <div style={labelStyle}>finance conversations</div>
    <div style={listStyle}>
      {conversations.length === 0 && <p style={emptyStyle}>No research conversations yet.</p>}
      {conversations.map((conversation) => {
        const active = conversation.id === activeId;
        return <div key={conversation.id} style={{ ...itemStyle, ...(active ? activeItemStyle : {}) }}>
          <button type="button" onClick={() => onSelect(conversation.id)} disabled={pending} style={selectButtonStyle}>
            <strong style={titleStyle}>{conversation.title}</strong>
            <span style={metaStyle}>{statusLabel[conversation.status]} · {new Date(conversation.updatedAt).toLocaleDateString('en-US')}</span>
          </button>
          <button type="button" aria-label={`Delete ${conversation.title} research conversation`} disabled={pending} onClick={() => onRemove(conversation)} style={removeButtonStyle}>×</button>
        </div>;
      })}
    </div>
    <p style={noteStyle}>Finance Desk conversations are separate from workspace sessions. Calculations use calculator; BIST/TLREF data comes from cited web sources.</p>
  </aside>;
}

const railStyle: React.CSSProperties = { width: 248, minWidth: 248, display: 'flex', flexDirection: 'column', padding: 14, background: 'var(--bg-alt)', borderRight: '1px solid var(--border-subtle)', minHeight: 0 };
const newButtonStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: 'var(--accent-ink)', background: 'var(--accent)', border: 'none', borderRadius: 7, cursor: 'pointer' };
const labelStyle: React.CSSProperties = { margin: '18px 4px 8px', fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-subtle)' };
const listStyle: React.CSSProperties = { display: 'grid', alignContent: 'start', gap: 5, overflowY: 'auto' };
const emptyStyle: React.CSSProperties = { margin: '10px 4px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-subtle)' };
const itemStyle: React.CSSProperties = { display: 'flex', alignItems: 'flex-start', gap: 5, padding: 7, border: '1px solid transparent', borderRadius: 7 };
const activeItemStyle: React.CSSProperties = { background: 'color-mix(in oklch, var(--accent) 13%, transparent)', borderColor: 'color-mix(in oklch, var(--accent) 26%, transparent)' };
const selectButtonStyle: React.CSSProperties = { flex: 1, minWidth: 0, display: 'grid', gap: 4, padding: 0, color: 'var(--text)', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' };
const titleStyle: React.CSSProperties = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-serif)', fontSize: 14, fontWeight: 600 };
const metaStyle: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-subtle)' };
const removeButtonStyle: React.CSSProperties = { width: 18, height: 18, padding: 0, color: 'var(--text-subtle)', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 17, lineHeight: 1 };
const noteStyle: React.CSSProperties = { margin: 'auto 4px 2px', paddingTop: 14, borderTop: '1px solid var(--border-subtle)', fontFamily: 'var(--font-mono)', fontSize: 10.5, lineHeight: 1.5, color: 'var(--text-subtle)' };
