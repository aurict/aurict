import { contextBridge, ipcRenderer, webUtils } from 'electron';
import type {
  AurictWindowApi,
  ChatEvent,
  ChatAttachment,
  ChatSubmitPayload,
  PermissionRequestPayload,
  PermissionDecision,
  ProviderInfo,
  CustomProviderDef,
  SessionInfo,
  SessionMessage,
  SessionSearchResult,
  SkillInfo,
  FileTreeEntry,
  ModelInfo,
  SessionAgentInfo,
  Policy,
  DesignSystemInfo,
  DesignSkillInfo,
  DesignMatchResult,
  DesignOutputInfo,
  MemoryInfo,
  MemoryCategory,
  MemoryScope,
  WorkspaceInfo,
  SidecarStatus,
  RemoteStatus,
  UserProfile,
  DesignArtifactInfo,
  DesignArtifactLaunch,
  ArtifactInfo,
  RuntimeEvent,
} from './shared/ipc-types.js';

// Narrow, typed bridge — the renderer never touches ipcRenderer directly.
const api: AurictWindowApi = {
  window: {
    close: () => ipcRenderer.send('window:close'),
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
  },
  chat: {
    submit: (payload: ChatSubmitPayload) => ipcRenderer.send('chat:submit', payload),
    cancel: (turnId: string) => ipcRenderer.send('chat:cancel', turnId),
    onEvent: (cb: (event: ChatEvent) => void) => {
      const listener = (_e: Electron.IpcRendererEvent, event: ChatEvent) => cb(event);
      ipcRenderer.on('chat:event', listener);
      return () => ipcRenderer.removeListener('chat:event', listener);
    },
  },
  permission: {
    onRequest: (cb: (request: PermissionRequestPayload) => void) => {
      const listener = (_e: Electron.IpcRendererEvent, request: PermissionRequestPayload) => cb(request);
      ipcRenderer.on('permission:request', listener);
      return () => ipcRenderer.removeListener('permission:request', listener);
    },
    respond: (id: string, decision: PermissionDecision) => ipcRenderer.send('permission:respond', { id, decision }),
  },
  provider: {
    list: () => ipcRenderer.invoke('provider:list') as Promise<ProviderInfo[]>,
    setKey: (providerId: string, apiKey: string) => ipcRenderer.invoke('provider:set-key', { providerId, apiKey }) as Promise<void>,
    setCustom: (id: string, def: CustomProviderDef) => ipcRenderer.invoke('provider:set-custom', { id, def }) as Promise<void>,
    models: (providerId: string) => ipcRenderer.invoke('provider:models', providerId) as Promise<ModelInfo[]>,
    currentModel: () => ipcRenderer.invoke('provider:current-model') as Promise<{ providerId: string; modelId: string }>,
    selectModel: (providerId: string, modelId: string) => ipcRenderer.invoke('provider:select-model', { providerId, modelId }) as Promise<void>,
  },
  agents: {
    list: () => ipcRenderer.invoke('agents:list') as Promise<SessionAgentInfo[]>,
  },
  session: {
    list: () => ipcRenderer.invoke('session:list') as Promise<SessionInfo[]>,
    select: (id: string) => ipcRenderer.invoke('session:select', { id }) as Promise<SessionMessage[]>,
    create: () => ipcRenderer.invoke('session:new') as Promise<string>,
    rename: (id: string, title: string) => ipcRenderer.invoke('session:rename', { id, title }) as Promise<{ id: string; title: string }>,
    archive: (id: string, archived: boolean) => ipcRenderer.invoke('session:archive', { id, archived }) as Promise<{ id: string; archived: boolean }>,
    branch: (id: string) => ipcRenderer.invoke('session:branch', id) as Promise<{ id: string; messages: SessionMessage[] }>,
    search: (query: string) => ipcRenderer.invoke('session:search', query) as Promise<SessionSearchResult[]>,
    remove: (id: string) => ipcRenderer.invoke('session:delete', id) as Promise<{ wasActive: boolean }>,
  },
  skills: {
    list: () => ipcRenderer.invoke('skills:list') as Promise<SkillInfo[]>,
    install: (url: string) => ipcRenderer.invoke('skills:install', url) as Promise<{ id: string; name: string } | { error: string }>,
    uninstall: (id: string) => ipcRenderer.invoke('skills:uninstall', id) as Promise<boolean>,
  },
  files: {
    tree: () => ipcRenderer.invoke('files:tree') as Promise<FileTreeEntry[]>,
    read: (path: string) => ipcRenderer.invoke('files:read', path) as Promise<string>,
    write: (path: string, content: string) => ipcRenderer.invoke('files:write', { path, content }) as Promise<void>,
    create: (path: string) => ipcRenderer.invoke('files:create', path) as Promise<{ ok: boolean; error?: string }>,
    mkdir: (path: string) => ipcRenderer.invoke('files:mkdir', path) as Promise<{ ok: boolean; error?: string }>,
    delete: (path: string) => ipcRenderer.invoke('files:delete', path) as Promise<{ ok: boolean; error?: string }>,
    rename: (oldPath: string, newPath: string) => ipcRenderer.invoke('files:rename', { oldPath, newPath }) as Promise<{ ok: boolean; error?: string }>,
    pickImages: () => ipcRenderer.invoke('files:pick-images') as Promise<ChatAttachment[]>,
    // Dropped files no longer expose File.path in sandboxed renderers.
    pathForFile: (file: File) => webUtils.getPathForFile(file),
  },
  rpc: (method, params) => ipcRenderer.invoke('rpc', method, params) as never,
  runtimeEvents: {
    on: (cb: (event: RuntimeEvent) => void) => {
      const listener = (_e: Electron.IpcRendererEvent, event: RuntimeEvent) => cb(event);
      ipcRenderer.on('runtime:event', listener);
      return () => ipcRenderer.removeListener('runtime:event', listener);
    },
  },
  transcript: {
    export: (format: 'markdown' | 'html') => ipcRenderer.invoke('transcript:export', format) as Promise<boolean>,
  },
  workdir: () => ipcRenderer.invoke('workdir') as Promise<string>,
  workspace: {
    get: () => ipcRenderer.invoke('workspace:get') as Promise<WorkspaceInfo>,
    choose: () => ipcRenderer.invoke('workspace:choose') as Promise<WorkspaceInfo | null>,
    onChanged: (cb: (workspace: WorkspaceInfo) => void) => {
      const listener = (_e: Electron.IpcRendererEvent, workspace: WorkspaceInfo) => cb(workspace);
      ipcRenderer.on('workspace:changed', listener);
      return () => ipcRenderer.removeListener('workspace:changed', listener);
    },
  },
  runtime: {
    getStatus: () => ipcRenderer.invoke('runtime:status') as Promise<SidecarStatus>,
    retry: () => ipcRenderer.invoke('runtime:retry') as Promise<SidecarStatus>,
    onStatus: (cb: (status: SidecarStatus) => void) => {
      const listener = (_e: Electron.IpcRendererEvent, status: SidecarStatus) => cb(status);
      ipcRenderer.on('runtime:status', listener);
      return () => ipcRenderer.removeListener('runtime:status', listener);
    },
  },
  remote: {
    action: (action) => ipcRenderer.send('remote:action', action),
    onStatus: (cb) => { const listener = (_event: Electron.IpcRendererEvent, status: RemoteStatus) => cb(status); ipcRenderer.on('remote:status', listener); return () => ipcRenderer.removeListener('remote:status', listener); },
  },
  onboarding: {
    get: () => ipcRenderer.invoke('onboarding:get') as Promise<UserProfile | null>,
    save: (profile: UserProfile) => ipcRenderer.invoke('onboarding:save', profile) as Promise<void>,
    reset: () => ipcRenderer.invoke('onboarding:reset') as Promise<void>,
  },
  policy: {
    get: () => ipcRenderer.invoke('policy:get') as Promise<Policy>,
    set: (policy: Policy) => ipcRenderer.invoke('policy:set', policy) as Promise<void>,
  },
  design: {
    listSystems: () => ipcRenderer.invoke('design:list-systems') as Promise<DesignSystemInfo[]>,
    listSkills: () => ipcRenderer.invoke('design:list-skills') as Promise<DesignSkillInfo[]>,
    match: (brief: string) => ipcRenderer.invoke('design:match', brief) as Promise<DesignMatchResult>,
    buildPrompt: (spec: { brief: string; systemId: string; skillId: string }) =>
      ipcRenderer.invoke('design:build-prompt', spec) as Promise<{ prompt: string; outputDir: string }>,
    listOutputs: () => ipcRenderer.invoke('design:list-outputs') as Promise<DesignOutputInfo[]>,
    readOutput: (slug: string) => ipcRenderer.invoke('design:read-output', slug) as Promise<string>,
    listArtifacts: () => ipcRenderer.invoke('design:artifact:list') as Promise<DesignArtifactInfo[]>,
    createArtifact: (spec: { brief: string; systemId: string; skillId: string; title?: string }) =>
      ipcRenderer.invoke('design:artifact:create', spec) as Promise<DesignArtifactLaunch>,
    retryArtifact: (id: string) => ipcRenderer.invoke('design:artifact:retry', id) as Promise<DesignArtifactLaunch>,
  },
  artifact: {
    list: () => ipcRenderer.invoke('artifact:list') as Promise<ArtifactInfo[]>,
    previewUrl: (id: string) => ipcRenderer.invoke('artifact:preview-url', id) as Promise<string>,
    reveal: (id: string) => ipcRenderer.invoke('artifact:reveal', id) as Promise<void>,
    readText: (id: string) => ipcRenderer.invoke('artifact:read-text', id) as Promise<string>,
    export: (id: string) => ipcRenderer.invoke('artifact:export', id) as Promise<boolean>,
  },
  memory: {
    list: () => ipcRenderer.invoke('memory:list') as Promise<MemoryInfo[]>,
    add: (data: { content: string; category: MemoryCategory; scope: MemoryScope }) =>
      ipcRenderer.invoke('memory:add', data) as Promise<MemoryInfo>,
    remove: (id: string) => ipcRenderer.invoke('memory:remove', id) as Promise<boolean>,
    clear: (scope?: MemoryScope) => ipcRenderer.invoke('memory:clear', scope) as Promise<number>,
  },
};

contextBridge.exposeInMainWorld('aurict', api);
