import React, { useState } from 'react';
import type { SessionInfo } from '../../../shared/ipc-types.js';
import type { useSessions } from '../../hooks/useSessions.js';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const BUDGET_KEY = 'hoprel.usage.weeklyBudgetUsd';

export interface UsageTotals { sessions: number; turns: number; tokens: number; costUsd: number }

export function usageTotals(sessions: SessionInfo[], since = 0): UsageTotals {
  return sessions.filter((session) => session.updatedAt >= since).reduce((sum, session) => ({
    sessions: sum.sessions + 1,
    turns: sum.turns + session.turnCount,
    tokens: sum.tokens + session.totalInputTokens + session.totalOutputTokens + session.totalCacheTokens,
    costUsd: sum.costUsd + session.accumulatedCostUsd,
  }), { sessions: 0, turns: 0, tokens: 0, costUsd: 0 });
}

// The budget is a personal reminder kept in this browser profile; storage may be unavailable.
function readBudget(): number | null {
  try { const value = Number(localStorage.getItem(BUDGET_KEY)); return Number.isFinite(value) && value > 0 ? value : null; } catch { return null; }
}
function writeBudget(value: number | null): void {
  try { if (value) localStorage.setItem(BUDGET_KEY, String(value)); else localStorage.removeItem(BUDGET_KEY); } catch (error) { console.warn('Budget could not be saved', error); }
}

const usd = (value: number) => `$${value.toFixed(value >= 10 ? 2 : 4)}`;
const tokens = (value: number) => (value >= 1_000_000 ? `${(value / 1_000_000).toFixed(1)}M` : value >= 1_000 ? `${(value / 1_000).toFixed(1)}k` : String(value));

export function UsageSettings({ sessions }: { sessions: ReturnType<typeof useSessions> }) {
  const [budget, setBudget] = useState<number | null>(readBudget);
  const [now] = useState(() => Date.now());
  const week = usageTotals(sessions.sessions, now - WEEK_MS);
  const all = usageTotals(sessions.sessions);
  const top = [...sessions.sessions].sort((a, b) => b.accumulatedCostUsd - a.accumulatedCostUsd).slice(0, 8);
  const overBudget = budget !== null && week.costUsd > budget;

  return <section aria-labelledby="usage-heading">
    <div id="usage-heading" className="aur-settings-heading">Usage</div>
    <p className="aur-settings-note">Estimated from token counts recorded for your {sessions.sessions.length} most recent sessions. Provider invoices are the source of truth.</p>
    <div className="aur-usage-grid">
      <div className="aur-usage-tile"><small>Last 7 days</small><strong>{usd(week.costUsd)}</strong><span>{tokens(week.tokens)} tokens · {week.turns} turns</span></div>
      <div className="aur-usage-tile"><small>Recent sessions</small><strong>{usd(all.costUsd)}</strong><span>{tokens(all.tokens)} tokens · {all.sessions} sessions</span></div>
    </div>
    {overBudget && <div role="alert" className="aur-inline-error">This week’s estimated spend ({usd(week.costUsd)}) is above your {usd(budget ?? 0)} budget.</div>}
    <label className="aur-settings-inline aur-budget">
      <span>Weekly budget (USD)</span>
      <input type="number" min={0} step={1} inputMode="decimal" value={budget ?? ''} placeholder="No budget" onChange={(event) => { const value = event.target.value ? Number(event.target.value) : null; const next = value && value > 0 ? value : null; setBudget(next); writeBudget(next); }} />
    </label>

    <div className="aur-settings-heading" style={{ marginTop: 24 }}>Most expensive sessions</div>
    <div className="aur-settings-group">
      {top.length === 0 && <div className="aur-settings-row"><span className="aur-settings-note">No sessions yet.</span></div>}
      {top.map((session) => <div key={session.id} className="aur-settings-row">
        <div><strong>{session.title ?? 'Untitled session'}</strong><small>{session.lastModel ?? 'Unknown model'} · {session.turnCount} turns · {tokens(session.totalInputTokens + session.totalOutputTokens + session.totalCacheTokens)} tokens</small></div>
        <span className="aur-usage-cost">{usd(session.accumulatedCostUsd)}</span>
      </div>)}
    </div>
  </section>;
}
