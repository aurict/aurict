import type { Screen } from './experience/navigation.js';

export type ShortcutAction = 'newSession' | 'openSettings' | 'openHome' | 'openMemory' | 'commandPalette';
export const DEFAULT_SHORTCUTS: Record<ShortcutAction, string> = { newSession: 'Ctrl+N', openSettings: 'Ctrl+,', openHome: 'Ctrl+1', openMemory: 'Ctrl+2', commandPalette: 'Ctrl+K' };
const storageKey = 'hoprel.shortcuts.v1';
// Saved maps can still hold actions for removed surfaces; only known actions are kept.
export function readShortcuts(): Record<ShortcutAction, string> {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? '{}') as Record<string, unknown>;
    const known = Object.entries(saved).filter(([action, value]) => action in DEFAULT_SHORTCUTS && typeof value === 'string');
    return { ...DEFAULT_SHORTCUTS, ...Object.fromEntries(known) };
  } catch { return DEFAULT_SHORTCUTS; }
}
export function saveShortcuts(value: Record<ShortcutAction, string>) { localStorage.setItem(storageKey, JSON.stringify(value)); }
export function eventShortcut(event: KeyboardEvent) { const key = event.key.length === 1 ? event.key.toUpperCase() : event.key; return `${event.ctrlKey || event.metaKey ? 'Ctrl+' : ''}${event.altKey ? 'Alt+' : ''}${event.shiftKey ? 'Shift+' : ''}${key}`; }
export function screenForShortcut(action: ShortcutAction): Screen | null { return action === 'openSettings' ? 'settings' : action === 'openHome' ? 'main' : action === 'openMemory' ? 'memory' : null; }
// Display form for hints in the UI ("⌘N" on macOS, "Ctrl+N" elsewhere).
export function shortcutLabel(shortcut: string): string { return navigator.platform.toLowerCase().includes('mac') ? shortcut.replace('Ctrl+', '⌘').replace('Alt+', '⌥').replace('Shift+', '⇧') : shortcut; }
