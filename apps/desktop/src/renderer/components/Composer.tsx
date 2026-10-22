import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { ChatAttachment, FileTreeEntry } from '../../shared/ipc-types.js';
import type { useAgents } from '../hooks/useAgents.js';
import type { useChat } from '../hooks/useChat.js';
import type { useModelSelection } from '../hooks/useModelSelection.js';
import type { useProviders } from '../hooks/useProviders.js';
import { matchCommands, parseSlash, slashQuery, type CommandAction } from '../experience/commands.js';
import { Icon } from './Icons.js';
import { PopoverSelect } from './PopoverSelect.js';

interface Props {
  chat: ReturnType<typeof useChat>;
  agents: ReturnType<typeof useAgents>;
  providers: ReturnType<typeof useProviders>;
  modelSelection: ReturnType<typeof useModelSelection>;
  commands: CommandAction[];
  draft: string;
  onDraftChange: (value: string) => void;
  placeholder: string;
  workspace: string;
  onChooseWorkspace: () => Promise<unknown>;
  onOpenContext: () => void;
  onError: (message: string) => void;
}

type Suggestion = { id: string; label: string; detail?: string; pick: () => void };

const MAX_TEXTAREA_HEIGHT = 200;
const MENTION_PATTERN = /(^|\s)@([^\s@]*)$/;
const MAX_MENTIONS = 8;

export function Composer({ chat, agents, providers, modelSelection, commands, draft, onDraftChange, placeholder, workspace, onChooseWorkspace, onOpenContext, onError }: Props) {
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [caret, setCaret] = useState(0);
  const [active, setActive] = useState(0);
  const [dismissed, setDismissed] = useState<string | null>(null);
  const [files, setFiles] = useState<FileTreeEntry[] | null>(null);
  const [dragging, setDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const canSend = Boolean(draft.trim()) && !chat.pending;

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
  }, [draft]);

  const addAttachments = (paths: string[]) => {
    setAttachments((current) => [...current, ...paths.filter((path) => !current.some((existing) => existing.path === path)).map((path) => ({ path }))]);
  };
  const focusAt = (position: number) => window.requestAnimationFrame(() => { textareaRef.current?.focus(); textareaRef.current?.setSelectionRange(position, position); setCaret(position); });

  // One suggestion list at a time: slash commands while typing "/name", file mentions after "@".
  const mention = MENTION_PATTERN.exec(draft.slice(0, caret));
  const query = slashQuery(draft);
  const suggestions = useMemo<Suggestion[]>(() => {
    if (query !== null) {
      return matchCommands(commands.filter((command) => command.slash), query).map((command) => ({
        id: command.id, label: `/${command.slash}`, detail: command.argument ? `${command.title} · ${command.argument}` : command.title,
        pick: () => {
          if (command.argument) { onDraftChange(`/${command.slash} `); focusAt(command.slash!.length + 2); return; }
          onDraftChange('');
          command.run('');
        },
      }));
    }
    if (mention && files) {
      const needle = (mention[2] ?? '').toLowerCase();
      const start = caret - (mention[2] ?? '').length - 1;
      return files.filter((entry) => entry.type === 'file' && entry.path.toLowerCase().includes(needle))
        .sort((a, b) => Number(!a.name.toLowerCase().startsWith(needle)) - Number(!b.name.toLowerCase().startsWith(needle)))
        .slice(0, MAX_MENTIONS)
        .map((entry) => ({
          id: entry.path, label: entry.name, detail: entry.path,
          pick: () => {
            const next = `${draft.slice(0, start)}@${entry.path} ${draft.slice(caret)}`;
            onDraftChange(next);
            addAttachments([entry.path]);
            focusAt(start + entry.path.length + 2);
          },
        }));
    }
    return [];
  }, [query, mention?.[2], files, commands, draft, caret]);
  const menuKey = query !== null ? `/${query}` : mention ? `@${mention[2]}` : null;
  const menuOpen = suggestions.length > 0 && menuKey !== dismissed;

  // The file list loads the first time "@" is typed and is reused afterwards.
  const wantsFiles = Boolean(mention);
  useEffect(() => {
    if (!wantsFiles || files !== null) return;
    setFiles([]);
    void window.aurict.files.tree().then(setFiles).catch((reason: unknown) => onError(reason instanceof Error ? reason.message : 'Workspace files could not be listed.'));
  }, [wantsFiles, files, onError]);

  const send = () => {
    if (!canSend) return;
    const slash = parseSlash(draft, commands);
    if (slash) {
      if (slash.command.argument && !slash.args) { onError(`${slash.command.title} needs ${slash.command.argument.toLowerCase()}.`); return; }
      onDraftChange('');
      slash.command.run(slash.args);
      return;
    }
    chat.submit(draft, agents.agentId, undefined, undefined, undefined, attachments.length ? attachments : undefined);
    onDraftChange('');
    setAttachments([]);
  };
  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (menuOpen) {
      if (event.key === 'ArrowDown') { event.preventDefault(); setActive((index) => Math.min(suggestions.length - 1, index + 1)); return; }
      if (event.key === 'ArrowUp') { event.preventDefault(); setActive((index) => Math.max(0, index - 1)); return; }
      if (event.key === 'Enter' || event.key === 'Tab') { event.preventDefault(); suggestions[Math.min(active, suggestions.length - 1)]?.pick(); setActive(0); return; }
      if (event.key === 'Escape') { event.preventDefault(); setDismissed(menuKey); return; }
    }
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); send(); }
  };
  const attach = () => {
    void window.aurict.files.pickImages().then((picked) => addAttachments(picked.map((item) => item.path)))
      .catch((reason: unknown) => onError(reason instanceof Error ? reason.message : 'Images could not be attached.'));
  };
  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragging(false);
    const paths = [...event.dataTransfer.files].map((file) => window.aurict.files.pathForFile(file)).filter(Boolean);
    if (paths.length) addAttachments(paths);
  };

  const agent = agents.agents.find((item) => item.id === agents.agentId);
  const provider = providers.providers.find((item) => item.id === modelSelection.providerId);
  const model = modelSelection.models.find((item) => item.id === modelSelection.modelId);
  const modelOptions = [
    ...providers.providers.map((item) => ({ id: `provider:${item.id}`, label: item.name, detail: item.hasKey ? undefined : 'No key', group: 'Provider', selected: item.id === modelSelection.providerId })),
    ...modelSelection.models.map((item) => ({ id: `model:${item.id}`, label: item.name, group: provider ? `${provider.name} models` : 'Models', selected: item.id === modelSelection.modelId })),
  ];
  const folder = workspace.split(/[\\/]/).filter(Boolean).pop() ?? workspace;
  const usage = chat.contextUsage;
  const usedPercent = usage && usage.window > 0 ? Math.min(100, Math.round((usage.tokens / usage.window) * 100)) : null;

  return <div className="aur-composer-wrap">
    <div className="aur-composer" data-dragging={dragging || undefined} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop}>
      {menuOpen && <ul className="aur-popover-menu aur-composer-suggestions" data-placement="top" data-align="start" role="listbox" aria-label={query !== null ? 'Commands' : 'Workspace files'}>
        <li role="presentation" className="aur-popover-group">{query !== null ? 'Commands' : 'Files'}</li>
        {suggestions.map((item, index) => <li key={item.id} role="option" aria-selected={index === active} data-active={index === active || undefined} onMouseEnter={() => setActive(index)} onMouseDown={(event) => { event.preventDefault(); item.pick(); setActive(0); }}>
          <span><code>{item.label}</code>{item.detail && <small>{item.detail}</small>}</span>
        </li>)}
      </ul>}
      {attachments.length > 0 && <ul className="aur-attachments" aria-label="Attached files">
        {attachments.map((item) => { const name = item.path.split(/[\\/]/).pop() ?? item.path; return <li key={item.path} title={item.path}><Icon name="paperclip" size={12} /><span>{name}</span><button type="button" aria-label={`Remove ${name}`} onClick={() => setAttachments((current) => current.filter((existing) => existing.path !== item.path))}><Icon name="close" size={12} /></button></li>; })}
      </ul>}
      <textarea
        ref={textareaRef}
        aria-label="Message"
        aria-autocomplete="list"
        aria-expanded={menuOpen}
        value={draft}
        rows={1}
        placeholder={placeholder}
        onChange={(event) => { onDraftChange(event.target.value); setCaret(event.target.selectionStart); setActive(0); if (dismissed) setDismissed(null); }}
        onSelect={(event) => setCaret(event.currentTarget.selectionStart)}
        onKeyDown={onKeyDown}
      />
      <div className="aur-composer-toolbar">
        <button type="button" className="aur-icon-button aur-icon-button-outline" aria-label="Attach images" title="Attach images, or drop files here" onClick={attach}><Icon name="plus" /></button>
        <PopoverSelect label="Agent" icon="code" value={agent?.name ?? 'Agent'} disabled={agents.agents.length === 0} options={agents.agents.map((item) => ({ id: item.id, label: item.name, detail: item.description, selected: item.id === agents.agentId }))} onSelect={agents.setAgentId} />
        <button type="button" className="aur-context-ring" aria-label={usedPercent === null ? 'Show what this turn can use' : `Context ${usedPercent}% used. Show what this turn can use`} title={usage ? `${usage.tokens.toLocaleString()} of ${usage.window.toLocaleString()} tokens` : 'Context'} onClick={onOpenContext} data-level={usedPercent === null ? undefined : usedPercent >= 85 ? 'high' : usedPercent >= 60 ? 'medium' : 'low'}>
          <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true"><circle cx="10" cy="10" r="7.5" /><circle cx="10" cy="10" r="7.5" pathLength={100} strokeDasharray={`${usedPercent ?? 0} 100`} transform="rotate(-90 10 10)" /></svg>
          {usedPercent !== null && <span>{usedPercent}%</span>}
        </button>
        <span className="aur-composer-spacer" />
        <PopoverSelect label="Model" align="end" value={model?.name ?? (providers.loading ? 'Loading models…' : 'Choose a model')} options={modelOptions} onSelect={(id) => { if (id.startsWith('provider:')) modelSelection.selectProvider(id.slice('provider:'.length)); else modelSelection.selectModel(id.slice('model:'.length)); }} />
        {chat.pending
          ? <button type="button" className="aur-send-button" aria-label="Stop" title="Stop" onClick={chat.cancel}><Icon name="stop" /></button>
          : <button type="button" className="aur-send-button" aria-label="Send" title="Send (Enter)" disabled={!canSend} onClick={send}><Icon name="arrowUp" /></button>}
      </div>
    </div>
    <div className="aur-composer-meta">
      <button type="button" className="aur-chip-button" title={workspace} onClick={() => { void onChooseWorkspace().catch((reason: unknown) => onError(reason instanceof Error ? reason.message : 'Workspace could not be selected.')); }}><Icon name="folder" size={14} /><span>{folder || 'Select folder'}</span></button>
      <span role="status" aria-live="polite" className="aur-composer-status">{chat.pending ? <><span className="aur-status-dot aur-pulse" />{chat.statusMessage ?? 'Hoprel is working…'}</> : 'Type / for commands · @ to add a file'}</span>
    </div>
  </div>;
}
