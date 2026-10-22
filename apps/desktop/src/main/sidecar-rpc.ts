import { RPC_METHODS, type RpcMethod } from '../shared/ipc-types.js';

interface PendingCall {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
}

export function isRpcMethod(value: unknown): value is RpcMethod {
  return typeof value === 'string' && (RPC_METHODS as readonly string[]).includes(value);
}

// One request/response channel for every feature added after the original
// per-command queues: calls are matched by requestId, time out, and are all
// rejected together when the sidecar restarts.
export function createRpcClient(send: (requestId: string, method: RpcMethod, params: unknown) => void) {
  const pending = new Map<string, PendingCall>();

  const call = (method: unknown, params: unknown, timeoutMs = 30_000): Promise<unknown> => {
    if (!isRpcMethod(method)) return Promise.reject(new Error(`Unknown runtime method: ${String(method)}`));
    return new Promise((resolve, reject) => {
      const requestId = crypto.randomUUID();
      const timeout = setTimeout(() => {
        pending.delete(requestId);
        reject(new Error(`${method} did not respond within ${Math.ceil(timeoutMs / 1_000)} seconds.`));
      }, timeoutMs);
      pending.set(requestId, { resolve, reject, timeout });
      try {
        send(requestId, method, params);
      } catch (error) {
        clearTimeout(timeout);
        pending.delete(requestId);
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  };

  const settle = (requestId: string, result: unknown, error?: string) => {
    const entry = pending.get(requestId);
    if (!entry) return;
    pending.delete(requestId);
    clearTimeout(entry.timeout);
    if (error !== undefined) entry.reject(new Error(error));
    else entry.resolve(result);
  };

  const rejectAll = (error: Error) => {
    for (const entry of pending.values()) {
      clearTimeout(entry.timeout);
      entry.reject(error);
    }
    pending.clear();
  };

  return { call, settle, rejectAll, size: () => pending.size };
}
