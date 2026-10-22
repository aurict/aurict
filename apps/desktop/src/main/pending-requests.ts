import type {
  ProviderInfo,
  SessionInfo,
  SessionMessage,
  SessionSearchResult,
  SkillInfo,
  ModelInfo,
  SessionAgentInfo,
  DesignSystemInfo,
  DesignSkillInfo,
  DesignMatchResult,
  DesignArtifactInfo,
  DesignArtifactLaunch,
  MemoryInfo,
} from '../shared/ipc-types.js';

export interface PendingRequest<T> {
  id: string;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
}

export type PendingQueue<T> = PendingRequest<T>[];

export function requestFromSidecar<T>(
  queue: PendingQueue<T>,
  label: string,
  send: (requestId: string) => void,
  timeoutMs = 15_000,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = crypto.randomUUID();
    const pending: PendingRequest<T> = {
      id,
      resolve,
      reject,
      timeout: setTimeout(() => {
        const index = queue.findIndex((p) => p.id === id);
        if (index >= 0) queue.splice(index, 1);
        reject(new Error(`${label} did not respond within ${Math.ceil(timeoutMs / 1_000)} seconds.`));
      }, timeoutMs),
    };
    queue.push(pending);
    try {
      send(id);
    } catch (error) {
      clearTimeout(pending.timeout);
      const index = queue.findIndex((p) => p.id === id);
      if (index >= 0) queue.splice(index, 1);
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  });
}

// ID-based counterparts to resolveNext/rejectNext: instead of trusting FIFO
// order, these look up the specific request the response actually belongs
// to. Needed because two concurrent requests of the same command type can
// have their responses arrive out of order (e.g. opening two sessions in
// quick succession) — matching by id prevents cross-wiring the results.
// An unknown/duplicate id is a silent no-op, not an error.
export function resolveById<T>(queue: PendingQueue<T>, id: string, value: T): void {
  const index = queue.findIndex((p) => p.id === id);
  if (index < 0) return;
  const [pending] = queue.splice(index, 1);
  if (!pending) return;
  clearTimeout(pending.timeout);
  pending.resolve(value);
}

export function rejectById<T>(queue: PendingQueue<T>, id: string, error: Error): void {
  const index = queue.findIndex((p) => p.id === id);
  if (index < 0) return;
  const [pending] = queue.splice(index, 1);
  if (!pending) return;
  clearTimeout(pending.timeout);
  pending.reject(error);
}

export function resolveNext<T>(queue: PendingQueue<T>, value: T): void {
  const pending = queue.shift();
  if (!pending) return;
  clearTimeout(pending.timeout);
  pending.resolve(value);
}

export function rejectNext<T>(queue: PendingQueue<T>, error: Error): void {
  const pending = queue.shift();
  if (!pending) return;
  clearTimeout(pending.timeout);
  pending.reject(error);
}

export function rejectQueue<T>(queue: PendingQueue<T>, error: Error): void {
  for (const pending of queue.splice(0)) {
    clearTimeout(pending.timeout);
    pending.reject(error);
  }
}

export interface PendingRequestRegistry {
  providerList: PendingQueue<ProviderInfo[]>;
  sessionList: PendingQueue<SessionInfo[]>;
  sessionSelect: PendingQueue<SessionMessage[]>;
  sessionNew: PendingQueue<string>;
  sessionRename: PendingQueue<{ id: string; title: string }>;
  sessionArchive: PendingQueue<{ id: string; archived: boolean }>;
  sessionBranch: PendingQueue<{ id: string; messages: SessionMessage[] }>;
  sessionSearch: PendingQueue<SessionSearchResult[]>;
  sessionDelete: PendingQueue<{ wasActive: boolean }>;
  skillsList: PendingQueue<SkillInfo[]>;
  modelList: PendingQueue<ModelInfo[]>;
  modelCurrent: PendingQueue<{ providerId: string; modelId: string }>;
  agentsList: PendingQueue<SessionAgentInfo[]>;
  skillsInstall: PendingQueue<{ id: string; name: string } | { error: string }>;
  skillsUninstall: PendingQueue<boolean>;
  designSystems: PendingQueue<DesignSystemInfo[]>;
  designSkills: PendingQueue<DesignSkillInfo[]>;
  designMatch: PendingQueue<DesignMatchResult>;
  designBuildPrompt: PendingQueue<{ prompt: string; outputDir: string }>;
  designArtifactList: PendingQueue<DesignArtifactInfo[]>;
  designArtifactCreate: PendingQueue<DesignArtifactLaunch>;
  designArtifactRetry: PendingQueue<DesignArtifactLaunch>;
  memoryList: PendingQueue<MemoryInfo[]>;
  memoryAdd: PendingQueue<MemoryInfo>;
  memoryRemove: PendingQueue<boolean>;
  memoryClear: PendingQueue<number>;
}

export function createPendingRequestRegistry(): PendingRequestRegistry {
  return {
    providerList: [], sessionList: [], sessionSelect: [], sessionNew: [],
    sessionRename: [], sessionArchive: [], sessionBranch: [], sessionSearch: [],
    sessionDelete: [], skillsList: [], modelList: [], modelCurrent: [],
    agentsList: [], skillsInstall: [], skillsUninstall: [], designSystems: [],
    designSkills: [], designMatch: [], designBuildPrompt: [], designArtifactList: [],
    designArtifactCreate: [], designArtifactRetry: [], memoryList: [], memoryAdd: [],
    memoryRemove: [], memoryClear: [],
  };
}
