/* eslint-disable import/no-unresolved -- Bun provides this test module at runtime. */
import { describe, expect, it } from 'bun:test';
import { PRIMARY_NAVIGATION } from '../src/renderer/experience/navigation.js';
import { DEFAULT_SHORTCUTS, readShortcuts, screenForShortcut } from '../src/renderer/shortcuts.js';

describe('desktop navigation', () => {
  it('offers only Home and Memory as primary surfaces', () => {
    expect(PRIMARY_NAVIGATION.map((item) => item.id)).toEqual(['main', 'memory']);
  });

  it('maps every shortcut to a surface that still exists', () => {
    expect(screenForShortcut('openHome')).toBe('main');
    expect(screenForShortcut('openMemory')).toBe('memory');
    expect(screenForShortcut('openSettings')).toBe('settings');
  });

  it('drops saved shortcuts for removed surfaces', () => {
    const storage = new Map([['hoprel.shortcuts.v1', JSON.stringify({ openDesign: 'Ctrl+2', openFinance: 'Ctrl+3', newSession: 'Ctrl+T' })]]);
    const previous = globalThis.localStorage;
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key: string) => storage.get(key) ?? null } });
    try {
      expect(readShortcuts()).toEqual({ ...DEFAULT_SHORTCUTS, newSession: 'Ctrl+T' });
    } finally {
      Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: previous });
    }
  });
});
