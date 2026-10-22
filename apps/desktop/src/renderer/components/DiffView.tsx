import React, { useEffect, useState } from 'react';
import { Icon } from './Icons.js';

export type DiffLine = { kind: 'add' | 'remove' | 'context' | 'hunk' | 'meta'; text: string; oldLine: number | null; newLine: number | null };

/** Splits a unified diff into display rows with old/new line numbers. */
export function parseUnifiedDiff(patch: string): DiffLine[] {
  const rows: DiffLine[] = [];
  let oldLine = 0;
  let newLine = 0;
  for (const text of patch.split('\n')) {
    const hunk = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(text);
    if (hunk) {
      oldLine = Number(hunk[1]);
      newLine = Number(hunk[2]);
      rows.push({ kind: 'hunk', text, oldLine: null, newLine: null });
    } else if (/^(diff |index |--- |\+\+\+ |new file|deleted file|similarity|rename |\\ No newline)/.test(text)) {
      if (text.startsWith('\\')) rows.push({ kind: 'meta', text, oldLine: null, newLine: null });
    } else if (text.startsWith('+')) {
      rows.push({ kind: 'add', text: text.slice(1), oldLine: null, newLine: newLine++ });
    } else if (text.startsWith('-')) {
      rows.push({ kind: 'remove', text: text.slice(1), oldLine: oldLine++, newLine: null });
    } else if (rows.length > 0 && text !== '') {
      rows.push({ kind: 'context', text: text.slice(1), oldLine: oldLine++, newLine: newLine++ });
    }
  }
  return rows;
}

interface Props { path: string; onRevert: (path: string) => void; onOpenFile: (path: string) => void }

export function DiffView({ path, onRevert, onOpenFile }: Props) {
  const [patch, setPatch] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setPatch(null); setError(null);
    window.aurict.rpc('git/fileDiff', { path })
      .then((result) => { if (!cancelled) setPatch(result.patch); })
      .catch((reason: unknown) => { if (!cancelled) setError(reason instanceof Error ? reason.message : 'The diff could not be loaded.'); });
    return () => { cancelled = true; };
  }, [path]);

  const rows = patch ? parseUnifiedDiff(patch) : [];
  const additions = rows.filter((row) => row.kind === 'add').length;
  const deletions = rows.filter((row) => row.kind === 'remove').length;

  return <section className="aur-diff-view" aria-label={`Changes in ${path}`}>
    <header>
      <Icon name="file" size={14} />
      <code>{path}</code>
      <span className="aur-diff-stat"><b>+{additions}</b> <i>−{deletions}</i></span>
      <button type="button" className="aur-button aur-button-small" onClick={() => onOpenFile(path)}>Open file</button>
      <button type="button" className="aur-button aur-button-small" onClick={() => onRevert(path)}>Revert file</button>
    </header>
    {error && <p className="aur-preview-error" role="alert">{error}</p>}
    {!error && patch === null && <p className="aur-preview-empty">Loading changes…</p>}
    {!error && patch !== null && rows.length === 0 && <p className="aur-preview-empty">No textual changes in this file.</p>}
    {rows.length > 0 && <div className="aur-diff-scroll"><table className="aur-diff-table">
      <tbody>{rows.map((row, index) => <tr key={index} data-kind={row.kind}>
        <td className="aur-diff-num">{row.oldLine ?? ''}</td>
        <td className="aur-diff-num">{row.newLine ?? ''}</td>
        <td className="aur-diff-sign">{row.kind === 'add' ? '+' : row.kind === 'remove' ? '−' : ''}</td>
        <td className="aur-diff-code">{row.text || ' '}</td>
      </tr>)}</tbody>
    </table></div>}
  </section>;
}
