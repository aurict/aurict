import React, { useState } from 'react';
import type { ChatActivity } from '../hooks/useChat.js';
import { Icon } from './Icons.js';
import type { ChatAttachment } from '../../shared/ipc-types.js';

interface ActivityProps { activities: ChatActivity[]; pending: boolean; }

export function TaskActivity({ activities, pending }: ActivityProps) {
  const [open, setOpen] = useState(true);
  if (activities.length === 0) return null;
  const latest = activities[activities.length - 1];
  if (!latest) return null;
  return <section className="aur-task-activity" aria-label="Task activity"><button type="button" className="aur-task-activity-summary" aria-expanded={open} onClick={() => setOpen((value) => !value)}><span className={pending ? 'aur-pulse' : undefined} data-status={latest.status} /><span>{pending ? 'Hoprel is working' : 'Task activity'}</span><small>{latest.label}</small><Icon name={open ? 'chevronDown' : 'chevronRight'} size={14} /></button>{open && <ol>{activities.slice(-6).map((item) => <li key={item.id} data-status={item.status}><span aria-hidden="true" /><div><strong>{item.label}</strong>{item.detail && <small>{item.detail}</small>}</div><time>{item.status === 'active' ? 'now' : item.status}</time></li>)}</ol>}</section>;
}

interface ContextProps {
  agent: string;
  model: string;
  provider: string;
  session: string;
  attachments: ChatAttachment[];
  details?: React.ReactNode;
  onClose: () => void;
}

export function ContextDrawer({ agent, model, provider, session, attachments, details, onClose }: ContextProps) {
  return <aside className="aur-context-drawer" aria-label="Task context"><header><div><span>Turn context</span><strong>What Hoprel can use</strong></div><button type="button" className="aur-icon-button" aria-label="Close task context" onClick={onClose}><Icon name="close" /></button></header><dl><div><dt>Agent</dt><dd>{agent}</dd></div><div><dt>Provider</dt><dd>{provider}</dd></div><div><dt>Model</dt><dd>{model}</dd></div><div><dt>Session</dt><dd>{session}</dd></div></dl><ContextList label="Attachments" empty="No files added to this turn." items={attachments.map((attachment) => attachment.path.split('/').pop() ?? attachment.path)} />{details}<p>Workspace tools can only act through the visible approval flow when permission is required.</p></aside>;
}
function ContextList({ label, empty, items }: { label: string; empty: string; items: string[] }) { return <section><span>{label}</span>{items.length ? <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul> : <p>{empty}</p>}</section>; }
