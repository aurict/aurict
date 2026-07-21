import { app, BrowserWindow, dialog, ipcMain, protocol, screen, shell } from 'electron';
import path from 'node:path';
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync, existsSync, statSync, unlinkSync, renameSync, mkdirSync, openSync, closeSync, copyFileSync } from 'node:fs';
import started from 'electron-squirrel-startup';
import type {
  SidecarCommand,
  SidecarMessage,
  ProviderInfo,
  SessionInfo,
  SessionMessage,
  SessionSearchResult,
  SkillInfo,
  PermissionDecision,
  CustomProviderDef,
  ChatSubmitPayload,
  ModelInfo,
  SessionAgentInfo,
  Policy,
  DesignSystemInfo,
  DesignSkillInfo,
  DesignMatchResult,
  DesignOutputInfo,
  DesignArtifactInfo,
  DesignArtifactLaunch,
  MemoryInfo,
  MemoryCategory,
  MemoryScope,
  WorkspaceInfo,
  SidecarStatus,
  UserProfile,
  UserType,
  ExperienceLayout,
  ExperienceTheme,
  ColorMode,
  FontPair,
  FinanceCalculationRequest,
  FinanceCalculationResult,
  ArtifactInfo,
  RemoteStatus,
} from './shared/ipc-types.js';
import { createFinanceStore } from './main/finance-store.js';
import { rejectNext, rejectQueue, requestFromSidecar, resolveNext, type PendingQueue } from './main/pending-requests.js';
import { createDesktopStores, isDirectory } from './main/desktop-stores.js';
import { markChangedFiles, readFileTree, resolveWithinRoot } from './main/workspace-files.js';
import { createArtifactStore } from './main/artifact-store.js';

if (started) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;
let sidecar: ChildProcessWithoutNullStreams | null = null;
let activeWorkdir = process.cwd();
let isQuitting = false;
let runtimeSuspended = false;
let restartAttempts = 0;
let restartTimer: NodeJS.Timeout | null = null;
let runtimeStatus: SidecarStatus = { connected: false, message: 'starting' };
const financeStore = createFinanceStore(() => app.getPath('userData'));
const artifactStore = createArtifactStore(() => app.getPath('userData'), () => activeWorkdir);

const USER_TYPES: UserType[] = ['general', 'developer', 'product', 'designer', 'operator', 'finance'];
const LAYOUTS: ExperienceLayout[] = ['home', 'developer', 'product', 'design', 'operations', 'finance'];
const THEMES: ExperienceTheme[] = ['oxblood', 'paper', 'slate', 'studio', 'forest', 'ledger', 'contrast'];
const COLOR_MODES: ColorMode[] = ['system', 'light', 'dark'];
const FONT_PAIRS: FontPair[] = ['editorial', 'modern', 'technical', 'friendly', 'system'];

function defaultLayout(userType: UserType): ExperienceLayout {
  if (userType === 'general') return 'home';
  if (userType === 'developer') return 'developer';
  if (userType === 'product') return 'product';
  if (userType === 'designer') return 'design';
  if (userType === 'operator') return 'operations';
  return 'finance';
}

function defaultProfile(userType: UserType = 'general'): UserProfile {
  return {
    userType,
    layout: defaultLayout(userType),
    theme: userType === 'finance' ? 'ledger' : userType === 'designer' ? 'studio' : userType === 'general' ? 'paper' : 'oxblood',
    colorMode: 'system',
    fontPair: userType === 'finance' ? 'technical' : userType === 'designer' ? 'editorial' : 'modern',
    preferredProviderId: null,
    preferredModelId: null,
    onboardingVersion: 3,
    completedAt: Date.now(),
  };
}

function normalizeProfile(profile: Partial<UserProfile>): UserProfile | null {
  if (!profile.userType || !USER_TYPES.includes(profile.userType)) return null;
  const fallback = defaultProfile(profile.userType);
  return {
    userType: profile.userType,
    layout: profile.layout && LAYOUTS.includes(profile.layout) ? profile.layout : fallback.layout,
    theme: profile.theme && THEMES.includes(profile.theme) ? profile.theme : fallback.theme,
    colorMode: profile.colorMode && COLOR_MODES.includes(profile.colorMode) ? profile.colorMode : fallback.colorMode,
    fontPair: profile.fontPair && FONT_PAIRS.includes(profile.fontPair) ? profile.fontPair : fallback.fontPair,
    preferredProviderId: typeof profile.preferredProviderId === 'string' ? profile.preferredProviderId : null,
    preferredModelId: typeof profile.preferredModelId === 'string' ? profile.preferredModelId : null,
    onboardingVersion: typeof profile.onboardingVersion === 'number' ? profile.onboardingVersion : 1,
    completedAt: typeof profile.completedAt === 'number' ? profile.completedAt : Date.now(),
  };
}

const desktopStores = createDesktopStores(() => app.getPath('userData'), normalizeProfile);

function currentWorkspace(): WorkspaceInfo {
  const store = desktopStores.readWorkspace();
  return { path: activeWorkdir, recent: (store.recent ?? []).filter(isDirectory) };
}

function notifyWorkspaceChanged(): void {
  if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.webContents.isDestroyed()) mainWindow.webContents.send('workspace:changed', currentWorkspace());
}

function setRuntimeStatus(status: SidecarStatus): void {
  runtimeStatus = status;
  if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.webContents.isDestroyed()) mainWindow.webContents.send('runtime:status', status);
}

const pendingProviderList: PendingQueue<ProviderInfo[]> = [];
const pendingSessionList: PendingQueue<SessionInfo[]> = [];
const pendingSessionSelect: PendingQueue<SessionMessage[]> = [];
const pendingSessionNew: PendingQueue<string> = [];
const pendingSessionRename: PendingQueue<{ id: string; title: string }> = [];
const pendingSessionArchive: PendingQueue<{ id: string; archived: boolean }> = [];
const pendingSessionBranch: PendingQueue<{ id: string; messages: SessionMessage[] }> = [];
const pendingSessionSearch: PendingQueue<SessionSearchResult[]> = [];
const pendingSessionDelete: PendingQueue<{ wasActive: boolean }> = [];
const pendingSkillsList: PendingQueue<SkillInfo[]> = [];
const pendingModelList: PendingQueue<ModelInfo[]> = [];
const pendingModelCurrent: PendingQueue<{ providerId: string; modelId: string }> = [];
const pendingAgentsList: PendingQueue<SessionAgentInfo[]> = [];
const pendingSkillsInstall: PendingQueue<{ id: string; name: string } | { error: string }> = [];
const pendingSkillsUninstall: PendingQueue<boolean> = [];
const pendingDesignSystems: PendingQueue<DesignSystemInfo[]> = [];
const pendingDesignSkills: PendingQueue<DesignSkillInfo[]> = [];
const pendingDesignMatch: PendingQueue<DesignMatchResult> = [];
const pendingDesignBuildPrompt: PendingQueue<{ prompt: string; outputDir: string }> = [];
const pendingDesignArtifactList: PendingQueue<DesignArtifactInfo[]> = [];
const pendingDesignArtifactCreate: PendingQueue<DesignArtifactLaunch> = [];
const pendingDesignArtifactRetry: PendingQueue<DesignArtifactLaunch> = [];
const pendingMemoryList: PendingQueue<MemoryInfo[]> = [];
const pendingMemoryAdd: PendingQueue<MemoryInfo> = [];
const pendingMemoryRemove: PendingQueue<boolean> = [];
const pendingMemoryClear: PendingQueue<number> = [];
const pendingFinanceCalculations: PendingQueue<FinanceCalculationResult> = [];

function repoRoot(): string {
  // app.getAppPath() is apps/desktop (the dir containing this package's
  // package.json) in dev mode — anchor from there rather than __dirname,
  // whose depth depends on Vite's build output layout.
  return path.join(app.getAppPath(), '..', '..');
}

function sidecarLaunch(): { command: string; args: string[]; env: NodeJS.ProcessEnv } {
  const sharedEnv = {
    ...process.env,
    AURICT_DESIGN_DATA_DIR: designsDir(),
    AURICT_STATE_DIR: path.join(app.getPath('userData'), 'core'),
    AURICT_REMOTE_STATE_DIR: path.join(app.getPath('userData'), 'remote'),
    AURICT_REMOTE_DEVICE_NAME: `Hoprel by Aurict (${process.platform})`,
    AURICT_REMOTE_PLATFORM: 'desktop',
  };
  if (app.isPackaged) {
    const executable = process.platform === 'win32' ? 'aurict-sidecar.exe' : 'aurict-sidecar';
    return {
      command: path.join(process.resourcesPath, executable),
      args: ['--ipc-server'],
      env: { ...sharedEnv, AURICT_ASSET_DIR: path.join(process.resourcesPath, 'aurict-data') },
    };
  }
  return {
    command: 'bun',
    args: ['run', path.join(repoRoot(), 'packages', 'cli', 'src', 'index.ts'), '--ipc-server'],
    env: sharedEnv,
  };
}

function spawnSidecar(): ChildProcessWithoutNullStreams {
  const launch = sidecarLaunch();
  const child = spawn(launch.command, launch.args, {
    cwd: activeWorkdir,
    env: launch.env,
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  let buffer = '';
  child.stdout.setEncoding('utf8');
  child.stdout.on('data', (chunk: string) => {
    buffer += chunk;
    let idx: number;
    while ((idx = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 1);
      if (!line) continue;
      try {
        handleSidecarMessage(JSON.parse(line) as SidecarMessage);
      } catch (err) {
        console.error('[aurict] malformed sidecar message:', line, err);
      }
    }
  });
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', (chunk: string) => console.error('[sidecar]', chunk.trimEnd()));
  child.once('spawn', () => setRuntimeStatus({ connected: true }));
  child.once('error', (error) => {
    if (sidecar === child) {
      console.error('[aurict] sidecar failed to start', error);
      setRuntimeStatus({ connected: false, message: 'sidecar failed to start' });
    }
  });
  child.once('exit', (code, signal) => {
    if (sidecar !== child) return;
    sidecar = null;
    const message = `sidecar exited (${code ?? signal ?? 'unknown'})`;
    console.error(`[aurict] ${message}`);
    setRuntimeStatus({ connected: false, message });
    rejectPendingRequests(new Error(`Aurict runtime stopped before completing the request (${code ?? signal ?? 'unknown'}).`));
    scheduleSidecarRestart();
  });

  return child;
}

function sendToSidecar(cmd: SidecarCommand): void {
  if (!sidecar || sidecar.stdin.destroyed) {
    throw new Error('Aurict runtime is unavailable. It is restarting; try again shortly.');
  }
  sidecar.stdin.write(JSON.stringify(cmd) + '\n');
}

function startSidecar(): void {
  if (isQuitting || runtimeSuspended || sidecar) return;
  setRuntimeStatus({ connected: false, message: 'starting' });
  sidecar = spawnSidecar();
}

function scheduleSidecarRestart(): void {
  if (isQuitting || runtimeSuspended || restartTimer || restartAttempts >= 3) return;
  const delay = 1_000 * 2 ** restartAttempts;
  restartAttempts += 1;
  setRuntimeStatus({ connected: false, message: `reconnecting in ${Math.ceil(delay / 1_000)}s` });
  restartTimer = setTimeout(() => {
    restartTimer = null;
    startSidecar();
  }, delay);
}

function restartSidecar(): void {
  restartAttempts = 0;
  if (restartTimer) clearTimeout(restartTimer);
  restartTimer = null;
  const previous = sidecar;
  sidecar = null;
  previous?.kill();
  startSidecar();
}

function rejectPendingRequests(error: Error): void {
  rejectQueue(pendingProviderList, error); rejectQueue(pendingSessionList, error);
  rejectQueue(pendingSessionSelect, error); rejectQueue(pendingSessionNew, error);
  rejectQueue(pendingSessionDelete, error); rejectQueue(pendingSkillsList, error);
  rejectQueue(pendingModelList, error); rejectQueue(pendingModelCurrent, error);
  rejectQueue(pendingAgentsList, error); rejectQueue(pendingSkillsInstall, error);
  rejectQueue(pendingSkillsUninstall, error); rejectQueue(pendingDesignSystems, error);
  rejectQueue(pendingDesignSkills, error); rejectQueue(pendingDesignMatch, error);
  rejectQueue(pendingDesignBuildPrompt, error); rejectQueue(pendingDesignArtifactList, error);
  rejectQueue(pendingDesignArtifactCreate, error); rejectQueue(pendingDesignArtifactRetry, error);
  rejectQueue(pendingMemoryList, error); rejectQueue(pendingMemoryAdd, error);
  rejectQueue(pendingMemoryRemove, error); rejectQueue(pendingMemoryClear, error);
  rejectQueue(pendingFinanceCalculations, error);
}

function handleSidecarMessage(msg: SidecarMessage): void {
  restartAttempts = 0;
  if (!runtimeStatus.connected) setRuntimeStatus({ connected: true });
  switch (msg.type) {
    case 'chat:event':
      if (msg.event.type === 'artifact:updated') {
        artifactStore.register(msg.event.artifact as ArtifactInfo & { path: string });
      }
      if (msg.event.type === 'finance-research-audit') {
        financeStore.recordResearchAudit(msg.event.researchId, msg.event.audit);
      }
      mainWindow?.webContents.send('chat:event', msg.event);
      return;
    case 'remote:status':
      mainWindow?.webContents.send('remote:status', msg);
      return;
    case 'permission:request':
      if (desktopStores.readPolicy().autoAllowSafe && msg.request.level === 'safe') {
        sendToSidecar({ type: 'permission:respond', id: msg.request.id, decision: 'allow_once' });
        return;
      }
      mainWindow?.webContents.send('permission:request', msg.request);
      return;
    case 'provider:list-result':
      resolveNext(pendingProviderList, msg.providers);
      return;
    case 'session:list-result':
      resolveNext(pendingSessionList, msg.sessions);
      return;
    case 'session:select-result':
      resolveNext(pendingSessionSelect, msg.messages);
      return;
    case 'session:new-result':
      resolveNext(pendingSessionNew, msg.id);
      return;
    case 'session:rename-result':
      resolveNext(pendingSessionRename, { id: msg.id, title: msg.title });
      return;
    case 'session:archive-result':
      resolveNext(pendingSessionArchive, { id: msg.id, archived: msg.archived });
      return;
    case 'session:branch-result':
      resolveNext(pendingSessionBranch, { id: msg.id, messages: msg.messages });
      return;
    case 'session:search-result':
      resolveNext(pendingSessionSearch, msg.results);
      return;
    case 'session:delete-result':
      resolveNext(pendingSessionDelete, { wasActive: msg.wasActive });
      return;
    case 'skills:list-result':
      resolveNext(pendingSkillsList, msg.skills);
      return;
    case 'model:list-result':
      resolveNext(pendingModelList, msg.models);
      return;
    case 'model:list-error':
      rejectNext(pendingModelList, new Error(msg.message));
      return;
    case 'model:current-result':
      resolveNext(pendingModelCurrent, { providerId: msg.providerId, modelId: msg.modelId });
      return;
    case 'agents:list-result':
      resolveNext(pendingAgentsList, msg.agents);
      return;
    case 'skills:install-result':
      resolveNext(pendingSkillsInstall, msg.result);
      return;
    case 'skills:uninstall-result':
      resolveNext(pendingSkillsUninstall, msg.ok);
      return;
    case 'design:list-systems-result':
      resolveNext(pendingDesignSystems, msg.systems);
      return;
    case 'design:list-skills-result':
      resolveNext(pendingDesignSkills, msg.skills);
      return;
    case 'design:match-result':
      resolveNext(pendingDesignMatch, msg.match);
      return;
    case 'design:build-prompt-result':
      resolveNext(pendingDesignBuildPrompt, { prompt: msg.prompt, outputDir: msg.outputDir });
      return;
    case 'design:artifact:list-result':
      resolveNext(pendingDesignArtifactList, msg.artifacts);
      return;
    case 'design:artifact:create-result':
      resolveNext(pendingDesignArtifactCreate, msg.result);
      return;
    case 'design:artifact:retry-result':
      resolveNext(pendingDesignArtifactRetry, msg.result);
      return;
    case 'memory:list-result':
      resolveNext(pendingMemoryList, msg.memories);
      return;
    case 'memory:add-result':
      resolveNext(pendingMemoryAdd, msg.memory);
      return;
    case 'memory:remove-result':
      resolveNext(pendingMemoryRemove, msg.ok);
      return;
    case 'memory:clear-result':
      resolveNext(pendingMemoryClear, msg.removed);
      return;
    case 'finance:calculate-result': {
      if (pendingFinanceCalculations.length === 0) {
        console.error('[aurict] received an unexpected finance calculation result');
        return;
      }
      if (msg.error) {
        const pending = pendingFinanceCalculations.shift();
        if (pending) {
          clearTimeout(pending.timeout);
          pending.reject(new Error(msg.error));
        }
        return;
      }
      if (!msg.result) {
        const pending = pendingFinanceCalculations.shift();
        if (pending) {
          clearTimeout(pending.timeout);
          pending.reject(new Error('Finance runtime returned no calculation result'));
        }
        return;
      }
      resolveNext(pendingFinanceCalculations, msg.result);
      return;
    }
  }
}

// Clamp the initial window size to the primary display's available work area
// (excludes the taskbar/dock) instead of a fixed 1360x840. On small/short
// displays the fixed size pushed onboarding content past the visible area
// with no way to reach it — see fix/onboarding-window-sizing.
const createWindow = () => {
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
  const windowWidth = Math.min(1360, screenWidth);
  const windowHeight = Math.min(840, screenHeight);

  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    minWidth: Math.min(960, screenWidth),
    minHeight: Math.min(640, screenHeight),
    frame: false,
    backgroundColor: '#0d0a09',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }
};

// ── Window control IPC (Faz 1) ──────────────────────────────────────────────
ipcMain.on('window:close', () => mainWindow?.close());
ipcMain.on('window:minimize', () => mainWindow?.minimize());
ipcMain.on('window:maximize', () => {
  if (!mainWindow) return;
  if (mainWindow.isMaximized()) mainWindow.unmaximize();
  else mainWindow.maximize();
});

// ── Chat/permission IPC (Faz 2) ──────────────────────────────────────────────
ipcMain.on('chat:submit', (_e, payload: ChatSubmitPayload) => {
  try {
    sendToSidecar({ type: 'chat:submit', payload });
  } catch (error) {
    _e.sender.send('chat:event', {
      type: 'error',
      turnId: payload.turnId,
      message: error instanceof Error ? error.message : String(error),
    });
  }
});
ipcMain.on('chat:cancel', (_e, turnId: string) => {
  try {
    sendToSidecar({ type: 'chat:cancel', turnId });
  } catch (error) {
    _e.sender.send('chat:event', {
      type: 'error',
      turnId,
      message: error instanceof Error ? error.message : String(error),
    });
  }
});
ipcMain.on('remote:action', (_event, action: 'login' | 'start' | 'stop' | 'logout' | 'status') => {
  try { sendToSidecar({ type: 'remote:action', action }); }
  catch (error) { _event.sender.send('remote:status', { status: 'error', message: error instanceof Error ? error.message : String(error) } satisfies RemoteStatus); }
});
ipcMain.on('permission:respond', (_e, { id, decision }: { id: string; decision: PermissionDecision }) => {
  try {
    sendToSidecar({ type: 'permission:respond', id, decision });
  } catch (error) {
    console.error('[aurict] permission response could not be delivered', error);
  }
});
ipcMain.handle('provider:list', () => {
  return requestFromSidecar(pendingProviderList, 'Provider list', () => sendToSidecar({ type: 'provider:list' }));
});
ipcMain.handle('provider:set-key', (_e, { providerId, apiKey }: { providerId: string; apiKey: string }) => {
  sendToSidecar({ type: 'provider:set-key', providerId, apiKey });
});
ipcMain.handle('provider:set-custom', (_e, { id, def }: { id: string; def: CustomProviderDef }) => {
  sendToSidecar({ type: 'provider:set-custom', id, def });
});
ipcMain.handle('session:list', () => {
  return requestFromSidecar(pendingSessionList, 'Session list', () => sendToSidecar({ type: 'session:list' }));
});
ipcMain.handle('session:select', (_e, { id }: { id: string }) => {
  return requestFromSidecar(pendingSessionSelect, 'Session history', () => sendToSidecar({ type: 'session:select', id }));
});
ipcMain.handle('session:new', () => {
  return requestFromSidecar(pendingSessionNew, 'New session', () => sendToSidecar({ type: 'session:new' }));
});
ipcMain.handle('session:rename', (_e, { id, title }: { id: string; title: string }) => {
  return requestFromSidecar(pendingSessionRename, 'Session rename', () => sendToSidecar({ type: 'session:rename', id, title }));
});
ipcMain.handle('session:archive', (_e, { id, archived }: { id: string; archived: boolean }) => {
  return requestFromSidecar(pendingSessionArchive, 'Session archive', () => sendToSidecar({ type: 'session:archive', id, archived }));
});
ipcMain.handle('session:branch', (_e, id: string) => requestFromSidecar(pendingSessionBranch, 'Session branch', () => sendToSidecar({ type: 'session:branch', id })));
ipcMain.handle('session:search', (_e, query: string) => requestFromSidecar(pendingSessionSearch, 'Session search', () => sendToSidecar({ type: 'session:search', query })));
ipcMain.handle('session:delete', (_e, id: string) => {
  return requestFromSidecar(pendingSessionDelete, 'Delete session', () => sendToSidecar({ type: 'session:delete', id }));
});
ipcMain.handle('skills:list', () => {
  return requestFromSidecar(pendingSkillsList, 'Skill list', () => sendToSidecar({ type: 'skills:list' }));
});
ipcMain.handle('provider:models', (_e, providerId: string) => {
  return requestFromSidecar(pendingModelList, 'Model list', () => sendToSidecar({ type: 'model:list', providerId }));
});
ipcMain.handle('provider:current-model', () => {
  return requestFromSidecar(pendingModelCurrent, 'Current model', () => sendToSidecar({ type: 'model:get-current' }));
});
ipcMain.handle('provider:select-model', (_e, { providerId, modelId }: { providerId: string; modelId: string }) => {
  sendToSidecar({ type: 'model:select', providerId, modelId });
});
ipcMain.handle('agents:list', () => {
  return requestFromSidecar(pendingAgentsList, 'Agent list', () => sendToSidecar({ type: 'agents:list' }));
});
ipcMain.handle('skills:install', (_e, url: string) => {
  return requestFromSidecar(pendingSkillsInstall, 'Skill installation', () => sendToSidecar({ type: 'skills:install', url }), 30_000);
});
ipcMain.handle('skills:uninstall', (_e, id: string) => {
  return requestFromSidecar(pendingSkillsUninstall, 'Skill removal', () => sendToSidecar({ type: 'skills:uninstall', id }));
});
ipcMain.handle('design:list-systems', () => {
  return requestFromSidecar(pendingDesignSystems, 'Design systems', () => sendToSidecar({ type: 'design:list-systems' }));
});
ipcMain.handle('design:list-skills', () => {
  return requestFromSidecar(pendingDesignSkills, 'Design skills', () => sendToSidecar({ type: 'design:list-skills' }));
});
ipcMain.handle('design:match', (_e, brief: string) => {
  return requestFromSidecar(pendingDesignMatch, 'Design matching', () => sendToSidecar({ type: 'design:match', brief }));
});
ipcMain.handle('design:build-prompt', (_e, spec: { brief: string; systemId: string; skillId: string }) => {
  return requestFromSidecar(pendingDesignBuildPrompt, 'Design prompt', () => sendToSidecar({ type: 'design:build-prompt', ...spec }));
});
ipcMain.handle('design:artifact:list', () => {
  return requestFromSidecar(pendingDesignArtifactList, 'Design artifacts', () => sendToSidecar({ type: 'design:artifact:list' }));
});
ipcMain.handle('design:artifact:create', (_e, spec: { brief: string; systemId: string; skillId: string; title?: string }) => {
  return requestFromSidecar(pendingDesignArtifactCreate, 'Design artifact', () => sendToSidecar({ type: 'design:artifact:create', ...spec }), 30_000);
});
ipcMain.handle('design:artifact:retry', (_e, id: string) => {
  return requestFromSidecar(pendingDesignArtifactRetry, 'Design retry', () => sendToSidecar({ type: 'design:artifact:retry', id }), 30_000);
});
ipcMain.handle('memory:list', () => {
  return requestFromSidecar(pendingMemoryList, 'Memory list', () => sendToSidecar({ type: 'memory:list' }));
});
ipcMain.handle('memory:add', (_e, data: { content: string; category: MemoryCategory; scope: MemoryScope }) => {
  return requestFromSidecar(pendingMemoryAdd, 'Save memory', () => sendToSidecar({ type: 'memory:add', ...data }));
});
ipcMain.handle('memory:remove', (_e, id: string) => {
  return requestFromSidecar(pendingMemoryRemove, 'Remove memory', () => sendToSidecar({ type: 'memory:remove', id }));
});
ipcMain.handle('memory:clear', (_e, scope?: MemoryScope) => {
  return requestFromSidecar(pendingMemoryClear, 'Clear memory', () => sendToSidecar({ type: 'memory:clear', ...(scope ? { scope } : {}) }));
});

// ── Files/workdir IPC (Faz 4) — handled directly in main, no sidecar needed ──
ipcMain.handle('files:tree', async () => {
  const root = activeWorkdir;
  const entries = readFileTree(root);
  return markChangedFiles(root, entries);
});
ipcMain.handle('files:read', (_e, relPath: string) => {
  const root = activeWorkdir;
  return readFileSync(resolveWithinRoot(root, relPath), 'utf8');
});
ipcMain.handle('files:write', (_e, { path: relPath, content }: { path: string; content: string }) => {
  const root = activeWorkdir;
  writeFileSync(resolveWithinRoot(root, relPath), content, 'utf8');
});
ipcMain.handle('files:create', (_e, relPath: string) => {
  try {
    // 'wx' fails if the file already exists, instead of silently truncating it.
    const fd = openSync(resolveWithinRoot(activeWorkdir, relPath), 'wx');
    closeSync(fd);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
});
ipcMain.handle('files:mkdir', (_e, relPath: string) => {
  try {
    mkdirSync(resolveWithinRoot(activeWorkdir, relPath), { recursive: false });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
});
ipcMain.handle('files:delete', (_e, relPath: string) => {
  try {
    unlinkSync(resolveWithinRoot(activeWorkdir, relPath));
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
});
ipcMain.handle('files:rename', (_e, { oldPath, newPath }: { oldPath: string; newPath: string }) => {
  try {
    const root = activeWorkdir;
    renameSync(resolveWithinRoot(root, oldPath), resolveWithinRoot(root, newPath));
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
});
ipcMain.handle('files:pick-images', async () => {
  const options = {
    title: 'Add design reference images',
    properties: ['openFile', 'multiSelections'] as Array<'openFile' | 'multiSelections'>,
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'] }],
  };
  const result = mainWindow
    ? await dialog.showOpenDialog(mainWindow, options)
    : await dialog.showOpenDialog(options);
  return result.filePaths.map((filePath) => ({ path: filePath }));
});
ipcMain.handle('workdir', () => activeWorkdir);
ipcMain.handle('workspace:get', () => currentWorkspace());
ipcMain.handle('workspace:choose', async () => {
  const options = {
    title: 'Choose Aurict workspace',
    defaultPath: activeWorkdir,
    properties: ['openDirectory'] as Array<'openDirectory'>,
  };
  const result = mainWindow
    ? await dialog.showOpenDialog(mainWindow, options)
    : await dialog.showOpenDialog(options);
  if (result.canceled || !result.filePaths[0]) return null;

  activeWorkdir = path.resolve(result.filePaths[0]);
  desktopStores.writeWorkspace(activeWorkdir);
  notifyWorkspaceChanged();
  restartSidecar();
  return currentWorkspace();
});
ipcMain.handle('runtime:status', () => runtimeStatus);
ipcMain.handle('artifact:list', () => artifactStore.list());
ipcMain.handle('artifact:preview-url', (_event, id: string) => {
  artifactStore.resolve(id);
  return `aurict-artifact://${encodeURIComponent(id)}`;
});
ipcMain.handle('artifact:reveal', (_event, id: string) => {
  const artifact = artifactStore.resolve(id);
  shell.showItemInFolder(artifact.path);
});
ipcMain.handle('artifact:read-text', (_event, id: string) => {
  const artifact = artifactStore.resolve(id);
  if (!['markdown', 'code', 'table', 'document'].includes(artifact.kind)) {
    throw new Error('This artifact cannot be copied as text.');
  }
  return readFileSync(artifact.path, 'utf8');
});
ipcMain.handle('artifact:export', async (_event, id: string) => {
  const artifact = artifactStore.resolve(id);
  const result = mainWindow ? await dialog.showSaveDialog(mainWindow, { defaultPath: artifact.title }) : await dialog.showSaveDialog({ defaultPath: artifact.title });
  if (result.canceled || !result.filePath) return false;
  copyFileSync(artifact.path, result.filePath);
  return true;
});
ipcMain.handle('runtime:retry', () => {
  restartAttempts = 0;
  restartSidecar();
  return runtimeStatus;
});
ipcMain.handle('onboarding:get', () => desktopStores.readOnboarding());
ipcMain.handle('onboarding:save', (_e, profile: UserProfile) => {
  const normalized = normalizeProfile(profile);
  if (!normalized) throw new Error('Invalid onboarding profile');
  desktopStores.saveOnboarding(normalized);
});
ipcMain.handle('onboarding:reset', () => desktopStores.resetOnboarding());
ipcMain.handle('finance:research:list', () => financeStore.listResearch());
ipcMain.handle('finance:research:create', (_e, question: string) => financeStore.createResearch(question));
ipcMain.handle('finance:research:remove', (_e, id: string) => financeStore.removeResearch(id));
ipcMain.handle('finance:calculate', (_e, request: FinanceCalculationRequest) => {
  return requestFromSidecar(
    pendingFinanceCalculations,
    'Finance calculation',
    () => sendToSidecar({ type: 'finance:calculate', request }),
    30_000,
  ).then((result) => financeStore.saveCalculation(result).result);
});
ipcMain.handle('finance:calculations:list', () => financeStore.listCalculations());
ipcMain.handle('finance:calculations:remove', (_e, id: string) => financeStore.removeCalculation(id));

// ── Local policy IPC (Faz 8) ─────────────────────────────────────────────────
ipcMain.handle('policy:get', () => desktopStores.readPolicy());
ipcMain.handle('policy:set', (_e, policy: Policy) => desktopStores.writePolicy(policy));

// ── Design outputs (Faz 10) — pure fs, no sidecar needed ────────────────────
function designsDir(): string {
  return path.join(app.getPath('userData'), 'designs');
}
ipcMain.handle('design:list-outputs', () => {
  const dir = designsDir();
  if (!existsSync(dir)) return [] as DesignOutputInfo[];
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(path.join(dir, d.name, 'index.html')))
    .map((d) => ({ slug: d.name, createdAt: statSync(path.join(dir, d.name)).birthtimeMs }))
    .sort((a, b) => b.createdAt - a.createdAt);
});
ipcMain.handle('design:read-output', (_e, slug: string) => {
  return readFileSync(resolveWithinRoot(designsDir(), path.join(slug, 'index.html')), 'utf8');
});

app.on('ready', () => {
  protocol.handle('aurict-artifact', async (request) => {
    const id = decodeURIComponent(new URL(request.url).hostname);
    const artifact = artifactStore.resolve(id);
    return new Response(readFileSync(artifact.path), { headers: { 'content-type': artifact.mimeType ?? 'application/octet-stream' } });
  });
  const stored = desktopStores.readWorkspace().current;
  const fallback = app.isPackaged ? app.getPath('documents') : process.cwd();
  activeWorkdir = isDirectory(stored) ? stored : fallback;
  desktopStores.writeWorkspace(activeWorkdir);
  startSidecar();
  createWindow();
});

app.on('window-all-closed', () => {
  runtimeSuspended = true;
  if (process.platform !== 'darwin') isQuitting = true;
  sidecar?.kill();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  runtimeSuspended = false;
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
  startSidecar();
});

app.on('before-quit', () => {
  isQuitting = true;
  if (restartTimer) clearTimeout(restartTimer);
  sidecar?.kill();
});
