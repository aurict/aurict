import React, { useCallback, useEffect, useState } from 'react';
import type { McpServerInfo } from '../../../shared/ipc-types.js';
import { ConfirmDialog } from '../../components/Dialog.js';
import { ToastRegion, useToasts } from '../../components/ToastRegion.js';

const STATUS_LABEL: Record<McpServerInfo['status'], string> = { connected: 'Connected', connecting: 'Connecting', disconnected: 'Not connected', error: 'Failed', disabled: 'Off' };

/** Splits a command line on spaces while keeping "quoted parts" together. */
export function splitCommandLine(line: string): string[] {
  return [...line.matchAll(/"([^"]*)"|'([^']*)'|(\S+)/g)].map((match) => match[1] ?? match[2] ?? match[3] ?? '');
}

export function ConnectorSettings() {
  const [servers, setServers] = useState<McpServerInfo[] | null>(null);
  const [name, setName] = useState('');
  const [kind, setKind] = useState<'command' | 'url'>('command');
  const [target, setTarget] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const { toasts, show: showToast, dismiss: dismissToast } = useToasts();

  const refresh = useCallback(() => {
    window.aurict.rpc('mcpServer/list', {}).then((list) => { setServers(list); setError(null); })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Connectors could not be loaded.'));
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const run = async (work: () => Promise<unknown>, success: string): Promise<boolean> => {
    setBusy(true);
    setError(null);
    try { await work(); showToast(success, 'success'); refresh(); return true; }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'The connector could not be updated.'); return false; }
    finally { setBusy(false); }
  };
  const add = () => {
    const parts = splitCommandLine(target);
    const server = kind === 'url' ? { url: target.trim() } : { command: parts[0] ?? '', args: parts.slice(1) };
    void run(() => window.aurict.rpc('mcpServer/save', { name: name.trim(), server }), `${name.trim()} added`).then((saved) => { if (saved) { setName(''); setTarget(''); } });
  };

  return <section aria-labelledby="connectors-heading">
    <div id="connectors-heading" className="aur-settings-heading">MCP servers</div>
    <p className="aur-settings-note">Connectors give Hoprel extra tools through the Model Context Protocol. Servers from <code>~/.aurict/mcp.json</code> can be edited here; servers from the project’s <code>.aurict/mcp.json</code> are read-only.</p>
    <div className="aur-settings-group">
      {servers === null && !error && <div className="aur-settings-row"><span className="aur-settings-note">Loading connectors…</span></div>}
      {servers?.length === 0 && <div className="aur-settings-row"><span className="aur-settings-note">No connectors yet. Add one below.</span></div>}
      {servers?.map((server) => <div key={server.name} className="aur-settings-row">
        <span className={server.status === 'connected' ? 'aur-status-dot' : server.status === 'error' ? 'aur-status-dot aur-status-dot-off' : 'aur-status-dot aur-status-dot-idle'} title={STATUS_LABEL[server.status]} />
        <div>
          <strong>{server.name} {server.scope === 'project' && <span className="aur-badge">Project</span>}</strong>
          <small><code>{server.target}</code></small>
          <small>{STATUS_LABEL[server.status]}{server.status === 'connected' ? ` · ${server.toolCount} ${server.toolCount === 1 ? 'tool' : 'tools'}` : ''}{server.error ? ` · ${server.error}` : ''}</small>
        </div>
        {server.scope === 'global' && <>
          <button type="button" className="aur-toggle" role="switch" aria-checked={server.enabled} aria-label={`${server.enabled ? 'Turn off' : 'Turn on'} ${server.name}`} disabled={busy} onClick={() => void run(() => window.aurict.rpc('mcpServer/setEnabled', { name: server.name, enabled: !server.enabled }), `${server.name} ${server.enabled ? 'turned off' : 'turned on'}`)}><span /></button>
          <button type="button" className="aur-button aur-button-small" disabled={busy} onClick={() => setRemoving(server.name)}>Remove</button>
        </>}
      </div>)}
    </div>

    <div className="aur-settings-heading" style={{ marginTop: 24 }}>Add a connector</div>
    <form className="aur-connector-form" onSubmit={(event) => { event.preventDefault(); if (name.trim() && target.trim()) add(); }}>
      <label><span>Name</span><input value={name} onChange={(event) => setName(event.target.value)} placeholder="github" /></label>
      <div className="aur-segmented aur-segmented-inline" role="radiogroup" aria-label="Connection type">
        <button type="button" role="radio" aria-checked={kind === 'command'} aria-current={kind === 'command' ? 'page' : undefined} onClick={() => setKind('command')}>Command</button>
        <button type="button" role="radio" aria-checked={kind === 'url'} aria-current={kind === 'url' ? 'page' : undefined} onClick={() => setKind('url')}>URL</button>
      </div>
      <label><span>{kind === 'url' ? 'Server URL' : 'Command'}</span><input value={target} onChange={(event) => setTarget(event.target.value)} placeholder={kind === 'url' ? 'https://example.com/mcp' : 'npx -y @modelcontextprotocol/server-github'} spellCheck={false} /></label>
      <button type="submit" className="aur-button aur-button-primary" disabled={busy || !name.trim() || !target.trim()}>Add connector</button>
    </form>
    <p className="aur-settings-note">Environment variables and headers (for example API tokens) are not stored from this form; add them in <code>~/.aurict/mcp.json</code>.</p>
    {error && <div role="alert" className="aur-inline-error">{error}</div>}
    {removing && <ConfirmDialog title={`Remove ${removing}?`} description="The server is disconnected and removed from your global configuration." confirmLabel="Remove" tone="danger" onCancel={() => setRemoving(null)} onConfirm={() => { const target = removing; setRemoving(null); void run(() => window.aurict.rpc('mcpServer/remove', { name: target }), `${target} removed`); }} />}
    <ToastRegion toasts={toasts} onDismiss={dismissToast} />
  </section>;
}
