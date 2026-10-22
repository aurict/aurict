import React, { useEffect, useId, useRef, useState } from 'react';
import { Icon, type IconName } from './Icons.js';

export interface PopoverOption { id: string; label: string; detail?: string | undefined; group?: string | undefined; selected?: boolean | undefined }

interface Props {
  label: string;
  value: string;
  options: PopoverOption[];
  onSelect: (id: string) => void;
  icon?: IconName;
  disabled?: boolean;
  placement?: 'top' | 'bottom';
  align?: 'start' | 'end';
}

// A listbox popover that replaces native <select>s in the composer and toolbars:
// arrow keys move, Enter/Space choose, Escape or an outside click closes.
export function PopoverSelect({ label, value, options, onSelect, icon, disabled = false, placement = 'top', align = 'start' }: Props) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();
  // Parents rebuild `options` every render; read them through a ref so opening
  // the menu is the only thing that resets the highlighted row.
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    if (!open) return;
    const selected = optionsRef.current.findIndex((option) => option.selected);
    setActive(selected >= 0 ? selected : 0);
    listRef.current?.focus();
    const onPointerDown = (event: MouseEvent) => { if (!rootRef.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  const close = () => { setOpen(false); triggerRef.current?.focus(); };
  const choose = (index: number) => { const option = options[index]; if (!option) return; onSelect(option.id); close(); };
  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown') { event.preventDefault(); setActive((index) => Math.min(options.length - 1, index + 1)); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); setActive((index) => Math.max(0, index - 1)); }
    else if (event.key === 'Home') { event.preventDefault(); setActive(0); }
    else if (event.key === 'End') { event.preventDefault(); setActive(options.length - 1); }
    else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); choose(active); }
    else if (event.key === 'Escape' || event.key === 'Tab') { event.preventDefault(); close(); }
  };

  return <div className="aur-popover" ref={rootRef}>
    <button ref={triggerRef} type="button" className="aur-chip-button" aria-label={label} aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? listId : undefined} disabled={disabled} onClick={() => setOpen((value) => !value)}>
      {icon && <Icon name={icon} />}<span>{value}</span><Icon name="chevronDown" size={12} />
    </button>
    {open && <ul ref={listRef} id={listId} className="aur-popover-menu" data-placement={placement} data-align={align} role="listbox" aria-label={label} tabIndex={-1} aria-activedescendant={`${listId}-${active}`} onKeyDown={onKeyDown}>
      {options.map((option, index) => <React.Fragment key={option.id}>
        {option.group && option.group !== options[index - 1]?.group && <li role="presentation" className="aur-popover-group">{option.group}</li>}
        <li id={`${listId}-${index}`} role="option" aria-selected={Boolean(option.selected)} data-active={index === active || undefined} onMouseEnter={() => setActive(index)} onClick={() => choose(index)}>
          <span>{option.label}{option.detail && <small>{option.detail}</small>}</span>
          {option.selected && <Icon name="check" size={14} />}
        </li>
      </React.Fragment>)}
      {options.length === 0 && <li role="presentation" className="aur-popover-empty">Nothing to choose yet</li>}
    </ul>}
  </div>;
}
