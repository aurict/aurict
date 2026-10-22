/* eslint-disable import/no-unresolved -- Bun provides this test module at runtime. */
import { describe, expect, it } from 'bun:test';
import { splitCommandLine } from '../src/renderer/screens/settings/ConnectorSettings.js';
import { usageTotals } from '../src/renderer/screens/settings/UsageSettings.js';
import type { SessionInfo } from '../src/shared/ipc-types.js';

const session = (updatedAt: number, cost: number): SessionInfo => ({ id: String(updatedAt), title: null, createdAt: updatedAt, updatedAt, status: 'complete', parentId: null, turnCount: 2, totalInputTokens: 100, totalOutputTokens: 50, totalCacheTokens: 10, accumulatedCostUsd: cost, provider: null, lastModel: null });

describe('settings helpers', () => {
  it('splits connector command lines and keeps quoted arguments together', () => {
    expect(splitCommandLine('npx -y @scope/server --root "My Projects"')).toEqual(['npx', '-y', '@scope/server', '--root', 'My Projects']);
    expect(splitCommandLine("uvx mcp-server-git --repo '/tmp/a b'")).toEqual(['uvx', 'mcp-server-git', '--repo', '/tmp/a b']);
  });

  it('sums usage only for sessions inside the window', () => {
    const totals = usageTotals([session(1_000, 0.5), session(5_000, 1.25)], 2_000);
    expect(totals).toEqual({ sessions: 1, turns: 2, tokens: 160, costUsd: 1.25 });
    expect(usageTotals([session(1_000, 0.5), session(5_000, 1.25)]).costUsd).toBe(1.75);
  });
});
