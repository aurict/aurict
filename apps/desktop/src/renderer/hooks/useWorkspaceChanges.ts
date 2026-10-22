import { useCallback, useEffect, useRef, useState } from 'react';
import type { CheckpointInfo, WorkspaceStatus } from '../../shared/ipc-types.js';
import { useAsyncError } from './useAsyncError.js';

const EMPTY: WorkspaceStatus = { repository: false, branch: null, files: [] };

// Working-tree status and per-turn checkpoints. Refreshes when a turn ends and
// whenever the runtime records a checkpoint, so the panel follows the agent.
export function useWorkspaceChanges(turnPending: boolean, workspace: string) {
  const [status, setStatus] = useState<WorkspaceStatus>(EMPTY);
  const [checkpoints, setCheckpoints] = useState<CheckpointInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const { error, errorSeq, fail, clear } = useAsyncError();
  const wasPending = useRef(turnPending);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [nextStatus, nextCheckpoints] = await Promise.all([window.aurict.rpc('git/status', {}), window.aurict.rpc('checkpoint/list', {})]);
      setStatus(nextStatus);
      setCheckpoints(nextCheckpoints);
      clear();
    } catch (reason) {
      fail(reason, 'Workspace changes could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [clear, fail]);

  useEffect(() => { void refresh(); }, [refresh, workspace]);
  useEffect(() => {
    if (wasPending.current && !turnPending) void refresh();
    wasPending.current = turnPending;
  }, [turnPending, refresh]);
  useEffect(() => window.aurict.runtimeEvents.on((event) => { if (event.type === 'checkpoint:created') void refresh(); }), [refresh]);

  return { status, checkpoints, loading, error, errorSeq, refresh };
}
