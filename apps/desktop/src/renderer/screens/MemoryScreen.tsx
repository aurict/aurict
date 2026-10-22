import React, { useState } from 'react';
import { useMemory } from '../hooks/useMemory.js';
import type { MemoryCategory, MemoryScope, MemoryInfo } from '../../shared/ipc-types.js';
import { ToastRegion, useToasts } from '../components/ToastRegion.js';
import { useErrorToast } from '../hooks/useErrorToast.js';
import { Icon } from '../components/Icons.js';

const sectionHeading: React.CSSProperties = {
  fontFamily: 'var(--font-ui)', fontSize: 13.5, fontWeight: 600, color: 'var(--text)', marginBottom: 10,
};

const CATEGORIES: MemoryCategory[] = ['preference', 'project', 'fact', 'decision', 'pattern'];
const CATEGORY_COLOR: Record<MemoryCategory, string> = {
  preference: 'var(--accent)',
  project: 'var(--safe)',
  fact: 'var(--text-muted)',
  decision: 'var(--warning)',
  pattern: 'var(--accent)',
};

function formatDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function MemoryScreen() {
  const memory = useMemory();
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<MemoryCategory>('fact');
  const [scope, setScope] = useState<MemoryScope>('project');
  const { toasts, show: showToast, dismiss: dismissToast } = useToasts();
  useErrorToast(memory.error, memory.errorSeq, memory.retryAction, showToast, dismissToast);

  const handleAdd = () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    memory.add(trimmed, category, scope);
    setContent('');
  };

  const project = memory.memories.filter((m) => m.scope === 'project');
  const global = memory.memories.filter((m) => m.scope === 'global');

  return (
    <div style={{ flex: 1, overflowY: 'auto', position: 'relative', background: 'var(--bg)' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 32px 64px' }}>
        <h1 className="aur-page-title">Memory</h1>
        <p className="aur-page-detail">Facts, preferences and decisions Hoprel remembers across sessions. The agent reads and writes the same store.</p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
            placeholder="Remember something…"
            style={{ flex: 1, fontFamily: 'var(--font-ui)', fontSize: 13, padding: '9px 12px', background: 'var(--bg-card)', border: '1px solid var(--border-strong)', borderRadius: 8, color: 'var(--text)' }}
          />
          <select value={category} onChange={(e) => setCategory(e.target.value as MemoryCategory)} style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--text)', background: 'var(--bg-card)', border: '1px solid var(--border-strong)', borderRadius: 8, padding: '0 8px' }}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
          <select value={scope} onChange={(e) => setScope(e.target.value as MemoryScope)} style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--text)', background: 'var(--bg-card)', border: '1px solid var(--border-strong)', borderRadius: 8, padding: '0 8px' }}>
            <option value="project">Project</option>
            <option value="global">Global</option>
          </select>
          <button
            onClick={handleAdd}
            disabled={!content.trim()}
            style={{ fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 600, padding: '9px 16px', background: content.trim() ? 'var(--accent)' : 'var(--control-hover)', color: content.trim() ? 'var(--accent-ink)' : 'var(--text-subtle)', border: 'none', borderRadius: 8, cursor: content.trim() ? 'pointer' : 'default' }}
          >
            Remember
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 28, marginBottom: 12 }}>
          <div style={sectionHeading}>Project ({project.length})</div>
          {project.length > 0 && (
            <button type="button" onClick={() => memory.clear('project')} style={{ minHeight: 24, padding: 0, fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--danger)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
              Clear project memories
            </button>
          )}
        </div>
        <MemoryList entries={project} onRemove={memory.remove} />

        <div style={{ ...sectionHeading, marginTop: 28 }}>Global ({global.length})</div>
        <MemoryList entries={global} onRemove={memory.remove} />
      </div>
      <ToastRegion toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

function MemoryList({ entries, onRemove }: { entries: MemoryInfo[]; onRemove: (id: string) => void }) {
  if (entries.length === 0) {
    return (
      <div style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--text-subtle)', padding: '8px 0' }}>
        Nothing remembered yet
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'var(--control-bg)', borderRadius: 12, overflow: 'hidden' }}>
      {entries.map((m) => (
        <div key={m.id} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, padding: '12px 16px', background: 'var(--bg-card)' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11.5, fontWeight: 600, color: CATEGORY_COLOR[m.category], textTransform: 'capitalize' }}>{m.category}</span>
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11.5, color: 'var(--text-subtle)' }}>{formatDate(m.timestamp)} · {m.source}</span>
            </div>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 14, color: 'var(--text)', lineHeight: 1.5 }}>{m.content}</div>
          </div>
          <button type="button" aria-label={`Remove memory: ${m.content}`} onClick={() => onRemove(m.id)} className="aur-icon-button"><Icon name="close" size={14} /></button>
        </div>
      ))}
    </div>
  );
}
