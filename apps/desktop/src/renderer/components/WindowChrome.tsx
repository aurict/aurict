/*  Minimal, profile-independent window controls (drag + close/minimize/
    maximize) for screens that render before the Titlebar mounts — onboarding,
    loading, and error states previously had no way to move, minimize, or
    close the window. Styled to match .aur-titlebar (same height/background/
    border) so it looks identical to the main app's titlebar. Reuses
    TrafficDot from Titlebar.tsx to avoid duplicating that component. */
import React from 'react';
import { TrafficDot } from './Titlebar.js';

export function WindowChrome() {
  return (
    <div
      className="aur-window-chrome"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div style={{ display: 'flex', gap: 7, WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <TrafficDot label="Close window" color="var(--titlebar-control)" hoverColor="var(--danger)" onClick={() => window.aurict.window.close()} />
        <TrafficDot label="Minimize window" color="var(--titlebar-control)" hoverColor="var(--warning)" onClick={() => window.aurict.window.minimize()} />
        <TrafficDot label="Maximize or restore window" color="var(--titlebar-control)" hoverColor="var(--accent)" onClick={() => window.aurict.window.maximize()} />
      </div>
    </div>
  );
}