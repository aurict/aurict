/* eslint-disable import/no-unresolved -- Bun provides this test module at runtime. */
import { describe, expect, it } from 'bun:test';
import { parseUnifiedDiff } from '../src/renderer/components/DiffView.js';

describe('unified diff parsing', () => {
  it('numbers context, removed and added lines from the hunk header', () => {
    const rows = parseUnifiedDiff([
      'diff --git a/app.ts b/app.ts',
      'index 1..2 100644',
      '--- a/app.ts',
      '+++ b/app.ts',
      '@@ -3,3 +3,3 @@ export',
      ' keep',
      '-old',
      '+new',
      ' tail',
    ].join('\n'));
    expect(rows.map((row) => [row.kind, row.oldLine, row.newLine, row.text])).toEqual([
      ['hunk', null, null, '@@ -3,3 +3,3 @@ export'],
      ['context', 3, 3, 'keep'],
      ['remove', 4, null, 'old'],
      ['add', null, 4, 'new'],
      ['context', 5, 5, 'tail'],
    ]);
  });

  it('treats a new file as additions only', () => {
    const rows = parseUnifiedDiff('--- /dev/null\n+++ b/new.ts\n@@ -0,0 +1,2 @@\n+a\n+b');
    expect(rows.filter((row) => row.kind === 'add').map((row) => row.newLine)).toEqual([1, 2]);
  });
});
