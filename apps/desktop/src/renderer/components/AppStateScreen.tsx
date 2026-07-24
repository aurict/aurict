import React from 'react';
import { WindowChrome } from './WindowChrome.js';

interface Props {
  title: string;
  detail: string;
  action?: { label: string; onClick: () => void; };
  secondaryAction?: { label: string; onClick: () => void; };
  busy?: boolean;
}

export function AppStateScreen({ title, detail, action, secondaryAction, busy = false }: Props) {
  return <main className="aur-state-screen" aria-live="polite">
    <WindowChrome />
    <div className="aur-state-card">
      <div className="aur-state-brand">hoprel<span className={busy ? 'aur-pulse' : undefined}>▊</span><small>by aurict</small></div>
      <h1>{title}</h1>
      <p>{detail}</p>
      {(action || secondaryAction) && <div className="aur-state-actions">
        {action && <button className="aur-button aur-button-primary" type="button" onClick={action.onClick}>{action.label}</button>}
        {secondaryAction && <button className="aur-button" type="button" onClick={secondaryAction.onClick}>{secondaryAction.label}</button>}
      </div>}
    </div>
  </main>;
}
