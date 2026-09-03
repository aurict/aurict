/* eslint-disable import/no-unresolved -- Bun provides this test module at runtime. */
import { afterEach, describe, expect, it } from 'bun:test';
import { mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createArtifactStore } from '../src/main/artifact-store.js';

/** Windows refuses symlink creation without Developer Mode or admin rights.
 *  Probe once so the symlink-escape case skips visibly instead of passing green
 *  without ever exercising the boundary it asserts. */
const CAN_SYMLINK = (() => {
  const probe = mkdtempSync(path.join(tmpdir(), 'aurict-symlink-probe-'));
  try {
    symlinkSync(probe, path.join(probe, 'link'), 'dir');
    return true;
  } catch {
    return false;
  } finally {
    rmSync(probe, { recursive: true, force: true });
  }
})();

const created: string[] = [];
afterEach(() => { for (const dir of created.splice(0)) rmSync(dir, { recursive: true, force: true }); });

describe('desktop artifact store', () => {
  it('returns metadata without exposing the file path and resolves only registered files', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'aurict-artifact-')); created.push(root);
    const designs = path.join(root, 'designs'); mkdirSync(designs);
    const output = path.join(designs, 'report.pdf'); writeFileSync(output, 'placeholder');
    const store = createArtifactStore(() => root, () => path.join(root, 'workspace'));
    store.register({ id: 'report-1', title: 'Report', kind: 'pdf', lifecycle: 'ready', source: 'aurict-managed', path: output, workspace: path.join(root, 'workspace'), createdAt: 1, updatedAt: 1 });

    expect(store.list()).toEqual([expect.objectContaining({ id: 'report-1', kind: 'pdf' })]);
    expect(JSON.stringify(store.list())).not.toContain(output);
    expect(store.resolve('report-1').path).toBe(output);
  });

  it('rejects a path outside the declared artifact root', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'aurict-artifact-')); const outsideRoot = mkdtempSync(path.join(tmpdir(), 'aurict-artifact-outside-')); created.push(root, outsideRoot);
    const outside = path.join(outsideRoot, 'outside.pdf'); writeFileSync(outside, 'placeholder');
    const store = createArtifactStore(() => root, () => path.join(root, 'workspace'));
    expect(() => store.register({ id: 'outside-1', title: 'Outside', kind: 'pdf', lifecycle: 'ready', source: 'aurict-managed', path: outside, workspace: root, createdAt: 1, updatedAt: 1 })).toThrow('outside its approved root');
  });

  // The following three tests cover the Sprint 02 artifact-security
  // scenarios: symlink escape, prefix-lookalike roots, and missing/
  // directory artifacts — see within()'s realpath fix in artifact-store.ts.
  it.skipIf(!CAN_SYMLINK)('rejects a symlink inside the root that points outside it', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'aurict-artifact-'));
    const outsideRoot = mkdtempSync(path.join(tmpdir(), 'aurict-artifact-outside-'));
    created.push(root, outsideRoot);
    const secretFile = path.join(outsideRoot, 'secret.pdf');
    writeFileSync(secretFile, 'placeholder');
    const designs = path.join(root, 'designs');
    mkdirSync(designs);
    const symlinkPath = path.join(designs, 'looks-legit.pdf');
    symlinkSync(secretFile, symlinkPath);

    const store = createArtifactStore(() => root, () => path.join(root, 'workspace'));
    expect(() => store.register({ id: 'sneaky-1', title: 'Sneaky', kind: 'pdf', lifecycle: 'ready', source: 'aurict-managed', path: symlinkPath, workspace: path.join(root, 'workspace'), createdAt: 1, updatedAt: 1 })).toThrow('outside its approved root');
  });

  it('rejects a root that merely looks like a prefix of the approved root', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'aurict-artifact-'));
    const lookalikeRoot = `${root}-evil`;
    mkdirSync(lookalikeRoot);
    created.push(root, lookalikeRoot);
    const lookalikeFile = path.join(lookalikeRoot, 'report.pdf');
    writeFileSync(lookalikeFile, 'placeholder');

    const store = createArtifactStore(() => root, () => path.join(root, 'workspace'));
    expect(() => store.register({ id: 'lookalike-1', title: 'Lookalike', kind: 'pdf', lifecycle: 'ready', source: 'aurict-managed', path: lookalikeFile, workspace: path.join(root, 'workspace'), createdAt: 1, updatedAt: 1 })).toThrow('outside its approved root');
  });

  it('rejects resolving an artifact whose file is missing or is a directory', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'aurict-artifact-'));
    created.push(root);
    const designs = path.join(root, 'designs');
    mkdirSync(designs);
    const goneFile = path.join(designs, 'will-be-deleted.pdf');
    writeFileSync(goneFile, 'placeholder');
    const folderPath = path.join(designs, 'a-folder');
    mkdirSync(folderPath);

    const store = createArtifactStore(() => root, () => path.join(root, 'workspace'));
    store.register({ id: 'missing-1', title: 'Missing', kind: 'pdf', lifecycle: 'ready', source: 'aurict-managed', path: goneFile, workspace: path.join(root, 'workspace'), createdAt: 1, updatedAt: 1 });
    store.register({ id: 'folder-1', title: 'Folder', kind: 'pdf', lifecycle: 'ready', source: 'aurict-managed', path: folderPath, workspace: path.join(root, 'workspace'), createdAt: 1, updatedAt: 1 });

    rmSync(goneFile); // dosya kaydedildikten SONRA kayboluyor (silindi/taşındı senaryosu)

    expect(() => store.resolve('missing-1')).toThrow('unavailable');
    expect(() => store.resolve('folder-1')).toThrow('unavailable');
  });
});
