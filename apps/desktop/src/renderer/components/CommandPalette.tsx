import React, { useEffect, useMemo, useRef, useState } from 'react';
import { matchCommands, type CommandAction } from '../experience/commands.js';
import { Icon } from './Icons.js';

interface Props { commands: CommandAction[]; onClose: () => void }

export function CommandPalette({ commands, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [pendingCommand, setPendingCommand] = useState<CommandAction | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const results = useMemo(() => matchCommands(commands, query), [commands, query]);

  useEffect(() => { inputRef.current?.focus(); }, [pendingCommand]);
  useEffect(() => { setActive(0); }, [query]);

  const choose = (command: CommandAction | undefined) => {
    if (!command) return;
    if (command.argument) { setPendingCommand(command); setQuery(''); return; }
    onClose();
    command.run('');
  };
  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') { event.preventDefault(); if (pendingCommand) { setPendingCommand(null); setQuery(''); } else onClose(); return; }
    if (pendingCommand) {
      if (event.key === 'Enter' && query.trim()) { event.preventDefault(); onClose(); pendingCommand.run(query.trim()); }
      return;
    }
    if (event.key === 'ArrowDown') { event.preventDefault(); setActive((index) => Math.min(results.length - 1, index + 1)); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); setActive((index) => Math.max(0, index - 1)); }
    else if (event.key === 'Enter') { event.preventDefault(); choose(results[active]); }
  };

  return <div className="aur-dialog-backdrop aur-palette-backdrop" onMouseDown={onClose}>
    <div className="aur-palette" role="dialog" aria-modal="true" aria-label="Command palette" onMouseDown={(event) => event.stopPropagation()}>
      <label className="aur-palette-input">
        <Icon name={pendingCommand ? pendingCommand.icon : 'search'} />
        {pendingCommand && <span className="aur-palette-chip">{pendingCommand.title}</span>}
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder={pendingCommand?.argument ?? 'Search commands'}
          aria-label={pendingCommand?.argument ?? 'Search commands'}
          aria-controls={pendingCommand ? undefined : 'aur-palette-list'}
          aria-activedescendant={pendingCommand || !results[active] ? undefined : `aur-palette-${results[active]?.id}`}
          role="combobox"
          aria-expanded={!pendingCommand}
        />
      </label>
      {!pendingCommand && <ul id="aur-palette-list" role="listbox" aria-label="Commands">
        {results.map((command, index) => <React.Fragment key={command.id}>
          {command.group !== results[index - 1]?.group && !query && <li role="presentation" className="aur-popover-group">{command.group}</li>}
          <li id={`aur-palette-${command.id}`} role="option" aria-selected={index === active} data-active={index === active || undefined} onMouseEnter={() => setActive(index)} onClick={() => choose(command)}>
            <Icon name={command.icon} />
            <span><strong>{command.title}</strong><small>{command.detail}</small></span>
            {command.slash && <code>/{command.slash}</code>}
            {command.shortcut && <kbd>{command.shortcut}</kbd>}
          </li>
        </React.Fragment>)}
        {results.length === 0 && <li role="presentation" className="aur-popover-empty">No command matches “{query}”.</li>}
      </ul>}
      {pendingCommand && <p className="aur-palette-hint">Press Enter to run · Esc to go back</p>}
    </div>
  </div>;
}
