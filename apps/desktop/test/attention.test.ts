/* eslint-disable import/no-unresolved -- Bun provides this test module at runtime. */
import { describe, expect, it } from 'bun:test';
import { attentionForChatEvent, attentionForPermission } from '../src/main/attention.js';

describe('background attention', () => {
  it('notifies only for finished, failed or blocked work', () => {
    expect(attentionForChatEvent({ turnId: 't', type: 'text-delta', delta: 'hi' })).toBeNull();
    expect(attentionForChatEvent({ turnId: 't', type: 'finish', text: 'Done.' })).toEqual({ title: 'Hoprel finished', body: 'Done.' });
    expect(attentionForChatEvent({ turnId: 't', type: 'error', message: 'Provider failed' })?.title).toBe('Hoprel needs attention');
    expect(attentionForPermission({ id: 'p', tool: 'bash', pattern: 'rm -rf dist' }).body).toBe('bash: rm -rf dist');
  });

  it('keeps notification bodies short', () => {
    const body = attentionForChatEvent({ turnId: 't', type: 'finish', text: 'x'.repeat(500) })?.body ?? '';
    expect(body.length).toBe(140);
    expect(body.endsWith('…')).toBe(true);
  });
});
