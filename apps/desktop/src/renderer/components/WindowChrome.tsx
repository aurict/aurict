/*  Minimal, profile-independent window controls (drag + close/minimize/
    maximize) for screens that render before the Titlebar mounts — the
    loading and error states. Matches .aur-titlebar's height so it looks like
    the main app's titlebar. */
import React from 'react';
import { WindowControls } from './Titlebar.js';

export function WindowChrome() {
  return (
    <div className="aur-window-chrome" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
      <WindowControls />
    </div>
  );
}
