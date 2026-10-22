import React, { useEffect, useState } from 'react';
import type { SidecarStatus } from '../../shared/ipc-types.js';
import { PRIMARY_NAVIGATION, type Screen } from '../experience/navigation.js';
import { Icon } from './Icons.js';
import { readShortcuts, shortcutLabel } from '../shortcuts.js';

export type { Screen } from '../experience/navigation.js';

interface Props {
  screen: Screen;
  onNavigate: (screen: Screen) => void;
  workdir: string;
  onChooseWorkdir: () => Promise<unknown>;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  inspectorOpen?: boolean | undefined;
  onToggleInspector?: (() => void) | undefined;
  onOpenPalette: () => void;
}

const noDrag = { WebkitAppRegion: 'no-drag' } as React.CSSProperties;

export function Titlebar({ screen, onNavigate, workdir, onChooseWorkdir, sidebarOpen, onToggleSidebar, inspectorOpen = false, onToggleInspector, onOpenPalette }: Props) {
  const [status, setStatus] = useState<SidecarStatus>({ connected: false, message: 'connecting' });

  useEffect(() => {
    void window.aurict.runtime.getStatus().then(setStatus).catch((error) => setStatus({ connected: false, message: String(error) }));
    return window.aurict.runtime.onStatus(setStatus);
  }, []);

  const folder = workdir.split(/[\\/]/).filter(Boolean).pop() ?? workdir;

  // The bar itself is a drag region; only interactive controls opt out.
  return (
    <header className="aur-titlebar" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
      <div className="aur-titlebar-left">
        <WindowControls />
        <button type="button" className="aur-icon-button" style={noDrag} aria-label={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'} aria-pressed={sidebarOpen} onClick={onToggleSidebar}><Icon name="sidebar" /></button>
      </div>

      <nav className="aur-segmented" aria-label="Primary" style={noDrag}>
        {PRIMARY_NAVIGATION.map((item) => (
          <button key={item.id} type="button" aria-current={screen === item.id ? 'page' : undefined} onClick={() => onNavigate(item.id)}>{item.label}</button>
        ))}
      </nav>

      <div className="aur-titlebar-right">
        <button type="button" className="aur-icon-button" style={noDrag} aria-label="Open command palette" title={`Commands (${shortcutLabel(readShortcuts().commandPalette)})`} onClick={onOpenPalette}><Icon name="command" /></button>
        <button type="button" className="aur-workspace-chip" style={noDrag} title={workdir} aria-label={`Workspace ${workdir}. Choose another workspace`} onClick={() => { void onChooseWorkdir().catch((reason) => console.error('Workspace selection failed', reason)); }}>
          <Icon name="folder" /><span>{folder}</span><Icon name="chevronDown" size={12} />
        </button>
        <span className="aur-connection" role="status" title={status.connected ? 'Connected to the local runtime' : status.message ?? 'Disconnected'}>
          <span className={status.connected ? 'aur-status-dot' : 'aur-status-dot aur-status-dot-off'} />
          <span className="aur-visually-hidden">{status.connected ? 'Connected' : status.message ?? 'Disconnected'}</span>
        </span>
        {/* Don't setStatus from retry()'s return value — it is a snapshot taken
          before the sidecar finishes restarting; onStatus delivers the real state. */}
        {!status.connected && <button type="button" className="aur-button aur-button-small" style={noDrag} onClick={() => { void window.aurict.runtime.retry(); }}>Retry</button>}
        {onToggleInspector && <button type="button" className="aur-icon-button" style={noDrag} aria-label={inspectorOpen ? 'Hide inspector' : 'Show inspector'} aria-pressed={inspectorOpen} onClick={onToggleInspector}><Icon name="inspector" /></button>}
      </div>
    </header>
  );
}

// Shared with WindowChrome so screens that render before the Titlebar
// (loading and error states) keep the same window controls.
export function WindowControls() {
  return <div className="aur-window-controls" style={noDrag}>
    <button type="button" aria-label="Close window" data-control="close" onClick={() => window.aurict.window.close()} />
    <button type="button" aria-label="Minimize window" data-control="minimize" onClick={() => window.aurict.window.minimize()} />
    <button type="button" aria-label="Maximize or restore window" data-control="maximize" onClick={() => window.aurict.window.maximize()} />
  </div>;
}
