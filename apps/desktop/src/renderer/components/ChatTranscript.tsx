import React, { useState } from 'react';
import type { AssistantBlock, DisplayMessage } from '../types.js';
import { Icon } from './Icons.js';
import { MarkdownMessage } from './MarkdownMessage.js';

type ToolBlock = Extract<AssistantBlock, { type: 'tool' }>;
type Segment = { type: 'text'; content: string } | { type: 'tools'; tools: ToolBlock[] };

interface Props {
  messages: DisplayMessage[];
  onRetry: () => boolean;
}

export function ChatTranscript({ messages, onRetry }: Props) {
  return <>{messages.map((message) => <ChatBubble key={message.id} message={message} {...(message.role === 'error' ? { onRetry } : {})} />)}</>;
}

function ChatBubble({ message, onRetry }: { message: DisplayMessage; onRetry?: () => boolean }) {
  if (message.role === 'user') return <div className="aur-message-user">{message.content}</div>;
  if (message.role === 'error') return <div className="aur-message-error" role="alert"><span>{message.content}</span>{onRetry && <button type="button" className="aur-button aur-button-small" onClick={onRetry}>Retry last task</button>}</div>;
  return <article className="aur-message-assistant" aria-busy={message.pending || undefined}>
    <span className={message.pending ? 'aur-assistant-avatar aur-pulse' : 'aur-assistant-avatar'} aria-hidden="true">h</span>
    <div className="aur-message-body">
      {/* Restored history carries plain content without stream blocks. */}
      {!message.blocks?.length && message.content.trim() && <MarkdownMessage content={message.content} />}
      {segments(message.blocks ?? []).map((segment, index) => segment.type === 'text' ? <MarkdownMessage key={index} content={segment.content} /> : <ToolGroup key={index} tools={segment.tools} />)}
      {!message.pending && <CopyMessageButton message={message} />}
    </div>
  </article>;
}

// Consecutive tool calls collapse into one expandable card.
function segments(blocks: AssistantBlock[]): Segment[] {
  const result: Segment[] = [];
  for (const block of blocks) {
    const last = result[result.length - 1];
    if (block.type === 'text') result.push({ type: 'text', content: block.content });
    else if (last?.type === 'tools') last.tools.push(block);
    else result.push({ type: 'tools', tools: [block] });
  }
  return result;
}

function ToolGroup({ tools }: { tools: ToolBlock[] }) {
  const [open, setOpen] = useState(false);
  const running = tools.find((tool) => tool.pending);
  const names = [...new Set(tools.map((tool) => tool.tool))].join(', ');
  const summary = running ? `Running ${running.tool} · ${running.argsSummary}` : `${tools.length} ${tools.length === 1 ? 'step' : 'steps'} · ${names}`;
  return <div className="aur-tool-group" data-open={open || undefined}>
    <button type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
      <Icon name={open ? 'chevronDown' : 'chevronRight'} size={14} />
      <Icon name="terminal" size={14} />
      <span>{summary}</span>
      {running ? <span className="aur-status-dot aur-pulse" /> : <Icon name="check" size={14} className="aur-tool-done" />}
    </button>
    {!open && running?.liveOutput && <pre className="aur-tool-live" aria-live="off">{running.liveOutput.split('\n').slice(-12).join('\n')}</pre>}
    {open && <ol>{tools.map((tool) => <li key={tool.id}>
      <div><code>{tool.tool}</code><span>{tool.argsSummary}</span><small>{tool.pending ? 'Running…' : tool.durationMs !== undefined ? `${tool.durationMs} ms` : 'Done'}</small></div>
      {(tool.result ?? tool.liveOutput) && <pre>{tool.result ?? tool.liveOutput}</pre>}
    </li>)}</ol>}
  </div>;
}

function CopyMessageButton({ message }: { message: DisplayMessage }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    const text = (message.blocks ?? []).map((block) => block.type === 'text' ? block.content : `${block.tool}: ${block.result ?? block.argsSummary}`).join('\n\n').trim();
    if (!text) return;
    void navigator.clipboard.writeText(text).then(() => { setCopied(true); window.setTimeout(() => setCopied(false), 1_800); }).catch((error: unknown) => console.error('Failed to copy assistant message', error));
  };
  return <button type="button" className="aur-message-copy" onClick={copy}><Icon name={copied ? 'check' : 'copy'} size={13} />{copied ? 'Copied' : 'Copy'}</button>;
}
