import React, { useEffect, useRef, useState } from 'react';
import { Icon } from './Icons.js';

interface Run { id: string; command: string; output: string; exitCode: number | null; running: boolean }

const MAX_RUNS = 20;
const MAX_OUTPUT = 20_000;

// Runs one-off commands in the workspace and streams their output. The runtime
// spawns them without a TTY, so interactive programs (editors, prompts) are not supported.
export function TerminalPanel({ workspace }: { workspace: string }) {
  const [runs, setRuns] = useState<Run[]>([]);
  const [command, setCommand] = useState('');
  const [error, setError] = useState<string | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => window.aurict.runtimeEvents.on((event) => {
    if (event.type === 'shell:output') setRuns((current) => current.map((run) => (run.id === event.id ? { ...run, output: `${run.output}${event.text}`.slice(-MAX_OUTPUT) } : run)));
    if (event.type === 'shell:exit') setRuns((current) => current.map((run) => (run.id === event.id ? { ...run, running: false, exitCode: event.code } : run)));
  }), []);
  useEffect(() => { outputRef.current?.scrollTo({ top: outputRef.current.scrollHeight }); }, [runs]);

  const start = () => {
    const text = command.trim();
    if (!text) return;
    setError(null);
    void window.aurict.rpc('shell/run', { command: text })
      .then(({ id }) => { setRuns((current) => [...current, { id, command: text, output: '', exitCode: null, running: true }].slice(-MAX_RUNS)); setCommand(''); })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'The command could not start.'));
  };

  const folder = workspace.split(/[\\/]/).filter(Boolean).pop() ?? workspace;
  return <div className="aur-inspector-body aur-terminal">
    <div className="aur-inspector-heading">
      <h2>Terminal</h2>
      {runs.length > 0 && <button type="button" className="aur-icon-button" aria-label="Clear finished commands" title="Clear" onClick={() => setRuns((current) => current.filter((run) => run.running))}><Icon name="trash" size={14} /></button>}
    </div>
    <div ref={outputRef} className="aur-terminal-output" role="log" aria-live="polite">
      {runs.length === 0 && <p className="aur-inspector-empty">Run a command in {folder}. Output streams here; interactive programs are not supported.</p>}
      {runs.map((run) => <section key={run.id}>
        <header><code>$ {run.command}</code>{run.running
          ? <button type="button" className="aur-button aur-button-small" onClick={() => void window.aurict.rpc('shell/kill', { id: run.id })}>Stop</button>
          : <span className="aur-badge" data-tone={run.exitCode === 0 ? 'safe' : 'danger'}>{run.exitCode === null ? 'Stopped' : `Exit ${run.exitCode}`}</span>}</header>
        {run.output && <pre>{run.output}</pre>}
      </section>)}
    </div>
    {error && <div role="alert" className="aur-inline-error">{error}</div>}
    <form className="aur-terminal-input" onSubmit={(event) => { event.preventDefault(); start(); }}>
      <span aria-hidden="true">$</span>
      <input aria-label="Command" value={command} onChange={(event) => setCommand(event.target.value)} placeholder="bun test" spellCheck={false} />
      <button type="submit" className="aur-icon-button" aria-label="Run command" disabled={!command.trim()}><Icon name="arrowUp" size={14} /></button>
    </form>
  </div>;
}
