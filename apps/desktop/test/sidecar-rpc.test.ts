/* eslint-disable import/no-unresolved -- Bun provides this test module at runtime. */
import { describe, expect, it } from 'bun:test';
import { createRpcClient } from '../src/main/sidecar-rpc.js';

describe('sidecar rpc client', () => {
  it('resolves and rejects calls by request id', async () => {
    const sent: string[] = [];
    const client = createRpcClient((requestId) => sent.push(requestId));
    const first = client.call('checkpoint/list', {});
    const second = client.call('git/status', {});
    client.settle(sent[1] as string, { files: [] });
    client.settle(sent[0] as string, undefined, 'boom');
    await expect(second).resolves.toEqual({ files: [] });
    await expect(first).rejects.toThrow('boom');
    expect(client.size()).toBe(0);
  });

  it('refuses methods outside the allowlist without sending', async () => {
    const sent: string[] = [];
    const client = createRpcClient((requestId) => sent.push(requestId));
    await expect(client.call('fs:delete-everything', {})).rejects.toThrow('Unknown runtime method');
    expect(sent).toHaveLength(0);
  });

  it('rejects every pending call when the runtime restarts', async () => {
    const client = createRpcClient(() => undefined);
    const pending = client.call('checkpoint/list', {});
    client.rejectAll(new Error('restarting'));
    await expect(pending).rejects.toThrow('restarting');
  });
});
