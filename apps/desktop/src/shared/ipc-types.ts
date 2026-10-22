// Shared wire-protocol types between the Electron renderer/main processes and
// the Bun sidecar (packages/cli --ipc-server). Intentionally hand-rolled and
// self-contained — apps/desktop never imports @aurict/core directly (see the
// plan's "Bun sidecar" architecture note), so these mirror only the narrow
// slice of core's shapes that actually crosses the process boundary.

export interface ChatAttachment {
  path: string;
  content?: string;
}
export type ArtifactKind = 'pdf' | 'html' | 'image' | 'markdown' | 'code' | 'table' | 'document' | 'unknown';
export type ArtifactLifecycle = 'generating' | 'ready' | 'failed' | 'unavailable';
export type ArtifactSource = 'workspace' | 'aurict-managed';
export interface ArtifactInfo { id: string; title: string; kind: ArtifactKind; lifecycle: ArtifactLifecycle; source: ArtifactSource; workspace: string; mimeType?: string; createdAt: number; updatedAt: number; sessionId?: string; tool?: string; prompt?: string; error?: string; previousId?: string; }

export interface ChatSubmitPayload {
  turnId: string;
  text: string;
  attachments?: ChatAttachment[];
  agentId?: string;
  artifactId?: string;
  artifactIntent?: 'create' | 'iterate' | 'promote';
  displayText?: string;
}

export type ChatTurnEvent = { turnId: string } & (
  | { type: 'text-delta'; delta: string; isReasoning?: boolean }
  | { type: 'tool-call'; id: string; tool: string; args: unknown }
  | { type: 'tool-result'; id: string; result: string; durationMs: number }
  | { type: 'chunk'; text: string }
  | { type: 'step-finish' }
  | { type: 'phase'; phase: 'accepted' | 'preparing_attachments' | 'preparing_context' | 'resolving_model' | 'waiting_for_provider' }
  | { type: 'compaction'; beforeTokens: number; afterTokens: number; threshold: number; reason: 'history_limit' | 'message_limit' | 'effective_context_limit' }
  | { type: 'provider-fallback'; from: string; to: string }
  | { type: 'stream-restart' }
  | { type: 'usage'; contextTokens: number; contextWindow: number }
  | { type: 'finish'; text: string; sessionId?: string; finishReason?: string }
  | { type: 'error'; message: string }
);

export type ChatEvent = ChatTurnEvent | { type: 'artifact:updated'; artifact: ArtifactInfo };

export interface PermissionRequestPayload {
  id: string;
  tool: string;
  pattern: string;
  level?: 'safe' | 'warning' | 'danger';
  reason?: string;
  summary?: string;
}

export type PermissionDecision = 'allow' | 'allow_directory' | 'allow_once' | 'allow_partial' | 'deny';

export interface ProviderInfo {
  id: string;
  name: string;
  hasKey: boolean;
}

export interface ModelInfo {
  id: string;
  name: string;
  contextWindow: number;
  maxOutput: number;
  supportsTools: boolean;
  supportsVision: boolean;
}

export interface SessionAgentInfo {
  id: string;
  name: string;
  description: string;
  color: string;
}

export interface CustomProviderDef {
  name: string;
  baseUrl: string;
  apiKey: string;
  defaultModel: string;
}

export interface SessionInfo {
  id: string;
  title: string | null;
  createdAt: number;
  updatedAt: number;
  status: string;
  parentId: string | null;
  turnCount: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCacheTokens: number;
  accumulatedCostUsd: number;
  provider: string | null;
  lastModel: string | null;
}

export interface SessionMessage {
  role: 'user' | 'assistant';
  content: string;
}
export interface SessionSearchResult { sessionId: string; title: string | null; updatedAt: number; matchCount: number; excerpt: string; }

export interface SkillInfo {
  id: string;
  name: string;
  description: string;
  active: boolean;
  installed: boolean;
}

export interface Policy {
  autoAllowSafe: boolean;
}

export interface WorkspaceInfo {
  path: string;
  recent: string[];
}

export interface SidecarStatus {
  connected: boolean;
  message?: string;
  // Set only when the main process has exhausted its automatic 1s/2s/4s
  // reconnect attempts and is waiting on a manual retry. Screens use this
  // (not every transient blip) to decide when a stale, silently-broken
  // request deserves its own error toast.
  giveUp?: boolean;
}
export interface RemoteStatus { status: string; message: string; email?: string; sessionId?: string; verificationUriComplete?: string; userCode?: string; }

export type UserType = 'general' | 'developer' | 'product' | 'operator';
export type ExperienceLayout = 'home' | 'developer' | 'product' | 'operations';
export type ExperienceTheme = 'oxblood' | 'paper' | 'slate' | 'studio' | 'forest' | 'contrast';
export type ColorMode = 'system' | 'light' | 'dark';
export type FontPair = 'editorial' | 'modern' | 'technical' | 'friendly' | 'system';

export interface UserProfile {
  userType: UserType;
  layout: ExperienceLayout;
  theme: ExperienceTheme;
  colorMode: ColorMode;
  fontPair: FontPair;
  preferredProviderId: string | null;
  preferredModelId: string | null;
  onboardingVersion: number;
  completedAt: number;
}

export interface DesignSystemInfo {
  id: string;
  name: string;
  category: string;
  tagline: string;
}

export interface DesignSkillInfo {
  id: string;
  name: string;
  description: string;
  mode: string;
}

export interface DesignMatchResult {
  systemId: string;
  skillId: string;
  systemScore: number;
  skillScore: number;
  alternativeIds: string[];
}

export interface DesignOutputInfo {
  slug: string;
  createdAt: number;
}

export type DesignArtifactStatus = 'draft' | 'generating' | 'ready' | 'failed';

export interface DesignArtifactRevision {
  id: string;
  createdAt: number;
  summary?: string;
  htmlFile: string;
}

export interface DesignArtifactInfo {
  id: string;
  title: string;
  brief: string;
  workspace: string;
  systemId: string;
  skillId: string;
  status: DesignArtifactStatus;
  createdAt: number;
  updatedAt: number;
  error?: string;
  revisions: DesignArtifactRevision[];
}

export interface DesignArtifactLaunch {
  artifact: DesignArtifactInfo;
  prompt: string;
}

export type MemoryCategory = 'preference' | 'project' | 'fact' | 'decision' | 'pattern';
export type MemoryScope = 'global' | 'project';

export interface MemoryInfo {
  id: string;
  content: string;
  category: MemoryCategory;
  scope: MemoryScope;
  project?: string;
  timestamp: number;
  source: 'auto' | 'manual' | 'tool';
  tags?: string[];
}

// ── Runtime RPC (features added with the 2026 redesign) ─────────────────────
// Method names follow the planned app-server protocol (docs/app-server-plan.md)
// so they can move over unchanged.

export interface CheckpointInfo { id: string; prompt: string; createdAt: number; files: string[] }
export type ChangeStatus = 'modified' | 'added' | 'deleted' | 'renamed' | 'untracked';
export interface ChangedFile { path: string; status: ChangeStatus; additions: number; deletions: number; binary: boolean }
export interface WorkspaceStatus { repository: boolean; branch: string | null; files: ChangedFile[] }
export interface McpServerConfigInfo { command?: string; args?: string[]; env?: Record<string, string>; url?: string; headers?: Record<string, string>; enabled?: boolean }
export interface McpServerInfo { name: string; scope: 'global' | 'project'; enabled: boolean; status: 'connected' | 'connecting' | 'disconnected' | 'error' | 'disabled'; toolCount: number; error?: string; target: string }

export interface RpcMethods {
  'checkpoint/list': { params: Record<string, never>; result: CheckpointInfo[] };
  'checkpoint/restore': { params: { id: string }; result: { restored: string[] } };
  'git/status': { params: Record<string, never>; result: WorkspaceStatus };
  'git/fileDiff': { params: { path: string }; result: { patch: string } };
  'git/revertFile': { params: { path: string }; result: Record<string, never> };
  'git/commit': { params: { message: string; paths?: string[] }; result: { commit: string } };
  'git/createBranch': { params: { name: string }; result: Record<string, never> };
  'git/pullRequest': { params: { title: string; body: string }; result: { url: string } };
  'mcpServer/list': { params: Record<string, never>; result: McpServerInfo[] };
  'mcpServer/save': { params: { name: string; server: McpServerConfigInfo }; result: Record<string, never> };
  'mcpServer/remove': { params: { name: string }; result: { removed: boolean } };
  'mcpServer/setEnabled': { params: { name: string; enabled: boolean }; result: Record<string, never> };
  'session/export': { params: { format: 'markdown' | 'html' }; result: { content: string; filename: string } };
  'shell/run': { params: { command: string }; result: { id: string } };
  'shell/kill': { params: { id: string }; result: Record<string, never> };
}
export type RpcMethod = keyof RpcMethods;
export const RPC_METHODS = ['checkpoint/list', 'checkpoint/restore', 'git/status', 'git/fileDiff', 'git/revertFile', 'git/commit', 'git/createBranch', 'git/pullRequest', 'mcpServer/list', 'mcpServer/save', 'mcpServer/remove', 'mcpServer/setEnabled', 'session/export', 'shell/run', 'shell/kill'] as const satisfies readonly RpcMethod[];

// Pushed by the runtime outside a chat turn.
export type RuntimeEvent =
  | { type: 'shell:output'; id: string; text: string }
  | { type: 'shell:exit'; id: string; code: number | null }
  | { type: 'checkpoint:created'; checkpoint: CheckpointInfo };

export interface FileTreeEntry {
  name: string;
  path: string;
  depth: number;
  type: 'dir' | 'file';
  changed: boolean;
}

export interface AurictWindowApi {
  window: {
    close(): void;
    minimize(): void;
    maximize(): void;
  };
  chat: {
    submit(payload: ChatSubmitPayload): void;
    cancel(turnId: string): void;
    onEvent(cb: (event: ChatEvent) => void): () => void;
  };
  permission: {
    onRequest(cb: (request: PermissionRequestPayload) => void): () => void;
    respond(id: string, decision: PermissionDecision): void;
  };
  provider: {
    list(): Promise<ProviderInfo[]>;
    setKey(providerId: string, apiKey: string): Promise<void>;
    setCustom(id: string, def: CustomProviderDef): Promise<void>;
    models(providerId: string): Promise<ModelInfo[]>;
    currentModel(): Promise<{ providerId: string; modelId: string }>;
    selectModel(providerId: string, modelId: string): Promise<void>;
  };
  agents: {
    list(): Promise<SessionAgentInfo[]>;
  };
  session: {
    list(): Promise<SessionInfo[]>;
    select(id: string): Promise<SessionMessage[]>;
    create(): Promise<string>;
    rename(id: string, title: string): Promise<{ id: string; title: string }>;
    archive(id: string, archived: boolean): Promise<{ id: string; archived: boolean }>;
    branch(id: string): Promise<{ id: string; messages: SessionMessage[] }>;
    search(query: string): Promise<SessionSearchResult[]>;
    remove(id: string): Promise<{ wasActive: boolean }>;
  };
  skills: {
    list(): Promise<SkillInfo[]>;
    install(url: string): Promise<{ id: string; name: string } | { error: string }>;
    uninstall(id: string): Promise<boolean>;
  };
  files: {
    tree(): Promise<FileTreeEntry[]>;
    read(path: string): Promise<string>;
    write(path: string, content: string): Promise<void>;
    create(path: string): Promise<{ ok: boolean; error?: string }>;
    mkdir(path: string): Promise<{ ok: boolean; error?: string }>;
    delete(path: string): Promise<{ ok: boolean; error?: string }>;
    rename(oldPath: string, newPath: string): Promise<{ ok: boolean; error?: string }>;
    pickImages(): Promise<ChatAttachment[]>;
    pathForFile(file: File): string;
  };
  rpc<M extends RpcMethod>(method: M, params: RpcMethods[M]['params']): Promise<RpcMethods[M]['result']>;
  runtimeEvents: {
    on(cb: (event: RuntimeEvent) => void): () => void;
  };
  transcript: {
    export(format: 'markdown' | 'html'): Promise<boolean>;
  };
  workdir(): Promise<string>;
  workspace: {
    get(): Promise<WorkspaceInfo>;
    choose(): Promise<WorkspaceInfo | null>;
    onChanged(cb: (workspace: WorkspaceInfo) => void): () => void;
  };
  runtime: {
    getStatus(): Promise<SidecarStatus>;
    retry(): Promise<SidecarStatus>;
    onStatus(cb: (status: SidecarStatus) => void): () => void;
  };
  remote: {
    action(action: 'login' | 'start' | 'stop' | 'logout' | 'status'): void;
    onStatus(cb: (status: RemoteStatus) => void): () => void;
  };
  onboarding: {
    get(): Promise<UserProfile | null>;
    save(profile: UserProfile): Promise<void>;
    reset(): Promise<void>;
  };
  policy: {
    get(): Promise<Policy>;
    set(policy: Policy): Promise<void>;
  };
  design: {
    listSystems(): Promise<DesignSystemInfo[]>;
    listSkills(): Promise<DesignSkillInfo[]>;
    match(brief: string): Promise<DesignMatchResult>;
    buildPrompt(spec: { brief: string; systemId: string; skillId: string }): Promise<{ prompt: string; outputDir: string }>;
    listOutputs(): Promise<DesignOutputInfo[]>;
    readOutput(slug: string): Promise<string>;
    listArtifacts(): Promise<DesignArtifactInfo[]>;
    createArtifact(spec: { brief: string; systemId: string; skillId: string; title?: string }): Promise<DesignArtifactLaunch>;
    retryArtifact(id: string): Promise<DesignArtifactLaunch>;
  };
  artifact: {
    list(): Promise<ArtifactInfo[]>;
    previewUrl(id: string): Promise<string>;
    reveal(id: string): Promise<void>;
    readText(id: string): Promise<string>;
    export(id: string): Promise<boolean>;
  };
  memory: {
    list(): Promise<MemoryInfo[]>;
    add(data: { content: string; category: MemoryCategory; scope: MemoryScope }): Promise<MemoryInfo>;
    remove(id: string): Promise<boolean>;
    clear(scope?: MemoryScope): Promise<number>;
  };
}

// ── Sidecar stdio protocol (main process <-> Bun sidecar, JSON-lines) ───────
// Every line written to the sidecar's stdin / read from its stdout is exactly
// one JSON object matching one of these shapes.

// requestId correlates a command with its result: the desktop side
// generates one per request and the sidecar echoes it back unchanged.
// Commands/results with no response (chat:submit, remote:status, etc.)
// don't need one — only request/response pairs that go through the
// pending-request registry do.

export type SidecarCommand =
  | { type: 'chat:submit'; payload: ChatSubmitPayload }
  | { type: 'chat:cancel'; turnId: string }
  | { type: 'permission:respond'; id: string; decision: PermissionDecision }
  | { type: 'provider:list'; requestId: string }
  | { type: 'provider:set-key'; providerId: string; apiKey: string }
  | { type: 'provider:set-custom'; id: string; def: CustomProviderDef }
  | { type: 'session:list'; requestId: string }
  | { type: 'session:select'; id: string; requestId: string }
  | { type: 'session:new'; requestId: string }
  | { type: 'session:rename'; id: string; title: string; requestId: string }
  | { type: 'session:archive'; id: string; archived: boolean; requestId: string }
  | { type: 'session:branch'; id: string; requestId: string }
  | { type: 'session:search'; query: string; requestId: string }
  | { type: 'session:delete'; id: string; requestId: string }
  | { type: 'skills:list'; requestId: string }
  | { type: 'skills:install'; url: string; requestId: string }
  | { type: 'skills:uninstall'; id: string; requestId: string }
  | { type: 'model:list'; providerId: string; requestId: string }
  | { type: 'model:get-current'; requestId: string }
  | { type: 'model:select'; providerId: string; modelId: string }
  | { type: 'agents:list'; requestId: string }
  | { type: 'design:list-systems'; requestId: string }
  | { type: 'design:list-skills'; requestId: string }
  | { type: 'design:match'; brief: string; requestId: string }
  | { type: 'design:build-prompt'; brief: string; systemId: string; skillId: string; requestId: string }
  | { type: 'design:artifact:list'; requestId: string }
  | { type: 'design:artifact:create'; brief: string; systemId: string; skillId: string; title?: string; requestId: string }
  | { type: 'design:artifact:retry'; id: string; requestId: string }
  | { type: 'memory:list'; requestId: string }
  | { type: 'memory:add'; content: string; category: MemoryCategory; scope: MemoryScope; requestId: string }
  | { type: 'memory:remove'; id: string; requestId: string }
  | { type: 'memory:clear'; scope?: MemoryScope; requestId: string }
  | { type: 'remote:action'; action: 'login' | 'start' | 'stop' | 'logout' | 'status' }
  | { type: 'rpc'; method: RpcMethod; params: unknown; requestId: string };

export type SidecarMessage =
  | { type: 'rpc-result'; requestId: string; result?: unknown; error?: string }
  | { type: 'runtime:event'; event: RuntimeEvent }
  | { type: 'chat:event'; event: ChatEvent }
  | { type: 'permission:request'; request: PermissionRequestPayload }
  | { type: 'provider:list-result'; providers: ProviderInfo[]; requestId: string }
  | { type: 'session:list-result'; sessions: SessionInfo[]; requestId: string }
  | { type: 'session:select-result'; messages: SessionMessage[]; requestId: string }
  | { type: 'session:new-result'; id: string; requestId: string }
  | { type: 'session:rename-result'; id: string; title: string; requestId: string }
  | { type: 'session:archive-result'; id: string; archived: boolean; requestId: string }
  | { type: 'session:branch-result'; id: string; messages: SessionMessage[]; requestId: string }
  | { type: 'session:search-result'; results: SessionSearchResult[]; requestId: string }
  | { type: 'session:delete-result'; id: string; wasActive: boolean; requestId: string }
  | { type: 'skills:list-result'; skills: SkillInfo[]; requestId: string }
  | { type: 'skills:install-result'; result: { id: string; name: string } | { error: string }; requestId: string }
  | { type: 'skills:uninstall-result'; ok: boolean; requestId: string }
  | { type: 'model:list-result'; models: ModelInfo[]; requestId: string }
  | { type: 'model:list-error'; message: string; requestId: string }
  | { type: 'model:current-result'; providerId: string; modelId: string; requestId: string }
  | { type: 'agents:list-result'; agents: SessionAgentInfo[]; requestId: string }
  | { type: 'design:list-systems-result'; systems: DesignSystemInfo[]; requestId: string }
  | { type: 'design:list-skills-result'; skills: DesignSkillInfo[]; requestId: string }
  | { type: 'design:match-result'; match: DesignMatchResult; requestId: string }
  | { type: 'design:build-prompt-result'; prompt: string; outputDir: string; requestId: string }
  | { type: 'design:artifact:list-result'; artifacts: DesignArtifactInfo[]; requestId: string }
  | { type: 'design:artifact:create-result'; result: DesignArtifactLaunch; requestId: string }
  | { type: 'design:artifact:retry-result'; result: DesignArtifactLaunch; requestId: string }
  | { type: 'memory:list-result'; memories: MemoryInfo[]; requestId: string }
  | { type: 'memory:add-result'; memory: MemoryInfo; requestId: string }
  | { type: 'memory:remove-result'; ok: boolean; requestId: string }
  | { type: 'memory:clear-result'; removed: number; requestId: string }
  | { type: 'remote:status'; status: string; message: string; email?: string; sessionId?: string; verificationUriComplete?: string; userCode?: string };