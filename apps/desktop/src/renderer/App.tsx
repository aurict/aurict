import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Titlebar, type Screen } from './components/Titlebar.js';
import { ApprovalModal, needsApprovalModal } from './components/ApprovalModal.js';
import { CommandPalette } from './components/CommandPalette.js';
import { ConfirmDialog } from './components/Dialog.js';
import { Sidebar } from './components/Sidebar.js';
import { MainScreen, type InspectorTab } from './screens/MainScreen.js';
import { MemoryScreen } from './screens/MemoryScreen.js';
import { SettingsScreen, type SettingsSection } from './screens/SettingsScreen.js';
import { HomeScreen } from './screens/HomeScreen.js';
import { usePermission } from './hooks/usePermission.js';
import { usePolicy } from './hooks/usePolicy.js';
import { useWorkdir } from './hooks/useWorkdir.js';
import { useProviders } from './hooks/useProviders.js';
import { useAgents } from './hooks/useAgents.js';
import { useModelSelection } from './hooks/useModelSelection.js';
import { useChat } from './hooks/useChat.js';
import { useSessions } from './hooks/useSessions.js';
import { useProfile } from './hooks/useProfile.js';
import { applyAppearance, resolveColorMode } from './experience/appearance.js';
import type { CommandAction } from './experience/commands.js';
import { AppStateScreen } from './components/AppStateScreen.js';
import { ArtifactRail } from './components/ArtifactRail.js';
import { useArtifacts } from './hooks/useArtifacts.js';
import { eventShortcut, readShortcuts, screenForShortcut, shortcutLabel, type ShortcutAction } from './shortcuts.js';
import { ToastRegion, useToasts } from './components/ToastRegion.js';
import { useErrorToast } from './hooks/useErrorToast.js';

// Panel visibility is a per-viewer convenience; storage may be unavailable.
function readPanel(key: string, fallback: boolean): boolean {
  try { const value = localStorage.getItem(key); return value === null ? fallback : value === '1'; } catch { return fallback; }
}
function writePanel(key: string, open: boolean): void {
  try { localStorage.setItem(key, open ? '1' : '0'); } catch (error) { console.warn('Panel state could not be saved', error); }
}

function usePanel(key: string, fallback: boolean) {
  const [open, setOpen] = useState(() => readPanel(key, fallback));
  const set = useCallback((next: boolean) => { writePanel(key, next); setOpen(next); }, [key]);
  return [open, set] as const;
}

interface Confirmation { title: string; description: string; confirmLabel: string; onConfirm: () => void }

export function App() {
  const [screen, setScreen] = useState<Screen>('main');
  const [settingsSection, setSettingsSection] = useState<SettingsSection>('appearance');
  const [sidebarOpen, setSidebarOpen] = usePanel('hoprel.sidebar.open', true);
  const [inspectorOpen, setInspectorOpen] = usePanel('hoprel.inspector.open', true);
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>('changes');
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const permission = usePermission();
  const policy = usePolicy();
  const workdir = useWorkdir();
  const providers = useProviders();
  const agents = useAgents();
  const modelSelection = useModelSelection();
  // Chat lives at the shell level so the sidebar, Home and the code workspace
  // share one transcript and session.
  const chat = useChat();
  const sessions = useSessions(chat.restoreHistory, chat.resetForNewSession);
  const preferences = useProfile();
  const artifacts = useArtifacts();
  // Workspace selection is triggered from the titlebar and composer, which are
  // shared by every screen, so its error surface lives at the shell level.
  const { toasts, show: showToast, dismiss: dismissToast } = useToasts();
  useErrorToast(workdir.error, workdir.errorSeq, workdir.reload, showToast, dismissToast);
  const profile = preferences.profile;
  const codeWorkspace = profile?.layout === 'developer';

  const openSettings = useCallback((section: SettingsSection = 'appearance') => { setSettingsSection(section); setScreen('settings'); }, []);
  const openInspector = useCallback((tab: InspectorTab) => {
    setScreen('main');
    if (!codeWorkspace) { showToast('The inspector is part of the code workspace. Switch the starting surface in Settings > Appearance.', 'info'); return; }
    setInspectorOpen(true);
    setInspectorTab(tab);
  }, [codeWorkspace, setInspectorOpen, showToast]);

  const commands = useMemo<CommandAction[]>(() => {
    const shortcuts = readShortcuts();
    const fail = (fallback: string) => (reason: unknown) => showToast(reason instanceof Error ? reason.message : fallback, 'error');
    const exportTranscript = (format: 'markdown' | 'html') => void window.aurict.transcript.export(format)
      .then((saved) => { if (saved) showToast('Conversation exported', 'success'); })
      .catch(fail('The conversation could not be exported.'));
    const undoLastTurn = () => void window.aurict.rpc('checkpoint/list', {}).then((list) => {
      const latest = list[0];
      if (!latest) { showToast('No file edits to undo in this session.', 'info'); return; }
      setConfirmation({
        title: 'Undo the last turn’s edits?',
        description: `Restores ${latest.files.length} ${latest.files.length === 1 ? 'file' : 'files'} Hoprel changed for “${latest.prompt}”. The conversation is kept.`,
        confirmLabel: 'Undo edits',
        onConfirm: () => void window.aurict.rpc('checkpoint/restore', { id: latest.id })
          .then((result) => showToast(`Restored ${result.restored.length} ${result.restored.length === 1 ? 'file' : 'files'}`, 'success'))
          .catch(fail('The edits could not be undone.')),
      });
    }).catch(fail('Checkpoints could not be loaded.'));
    const design = (brief: string) => {
      setScreen('main');
      void window.aurict.design.match(brief)
        .then((match) => window.aurict.design.createArtifact({ brief, systemId: match.systemId, skillId: match.skillId }))
        .then(({ prompt, artifact }) => chat.submit(prompt, undefined, artifact.id, `Create design: ${brief}`, 'create'))
        .catch(fail('The design could not be started.'));
    };
    const ask = (text: string) => { setScreen('main'); chat.submit(text, agents.agentId); };
    const toggleColorMode = () => {
      if (!profile) return;
      const current = resolveColorMode(profile.colorMode, window.matchMedia('(prefers-color-scheme: dark)').matches);
      void preferences.update({ colorMode: current === 'dark' ? 'light' : 'dark' }).catch(fail('Appearance could not be saved.'));
    };
    return [
      { id: 'new-session', title: 'New session', detail: 'Start a fresh conversation', group: 'Session', icon: 'plus', slash: 'new', shortcut: shortcutLabel(shortcuts.newSession), run: () => { sessions.create(); setScreen('main'); } },
      { id: 'undo', title: 'Undo last turn', detail: 'Restore the files Hoprel edited in the last turn', group: 'Session', icon: 'restore', slash: 'undo', run: undoLastTurn },
      { id: 'export-md', title: 'Export as Markdown', detail: 'Save this conversation as a .md file', group: 'Session', icon: 'export', slash: 'export', run: () => exportTranscript('markdown') },
      { id: 'export-html', title: 'Export as HTML', detail: 'Save this conversation as a web page', group: 'Session', icon: 'export', run: () => exportTranscript('html') },
      { id: 'changes', title: 'Review changes', detail: 'Changed files, diffs and checkpoints', group: 'Workspace', icon: 'branch', slash: 'diff', run: () => openInspector('changes') },
      { id: 'review', title: 'Ask for a code review', detail: 'Hoprel reviews the uncommitted changes', group: 'Workspace', icon: 'check', slash: 'review', run: () => ask('Review the uncommitted changes in this workspace. List bugs and risks first, each with a file:line reference, then smaller suggestions.') },
      { id: 'commit', title: 'Commit changes', detail: 'Write a message and commit everything', group: 'Workspace', icon: 'commit', slash: 'commit', run: () => openInspector('changes') },
      { id: 'terminal', title: 'Run a command', detail: 'Open the terminal panel', group: 'Workspace', icon: 'terminal', slash: 'terminal', run: () => openInspector('terminal') },
      { id: 'workspace', title: 'Choose workspace', detail: 'Open another folder', group: 'Workspace', icon: 'folder', run: () => void workdir.choose().catch(fail('Workspace could not be selected.')) },
      { id: 'design', title: 'Design from a brief', detail: 'Generate an HTML prototype as an artifact', group: 'Create', icon: 'sparkle', slash: 'design', argument: 'Describe what to design', run: design },
      { id: 'home', title: 'Go to Home', detail: 'The conversation', group: 'Navigate', icon: 'home', shortcut: shortcutLabel(shortcuts.openHome), run: () => setScreen('main') },
      { id: 'memory', title: 'Go to Memory', detail: 'What Hoprel remembers', group: 'Navigate', icon: 'memory', slash: 'memory', shortcut: shortcutLabel(shortcuts.openMemory), run: () => setScreen('memory') },
      { id: 'settings', title: 'Open settings', detail: 'Appearance, models and safety', group: 'Navigate', icon: 'gear', slash: 'settings', shortcut: shortcutLabel(shortcuts.openSettings), run: () => openSettings() },
      { id: 'connectors', title: 'Manage connectors', detail: 'Add or switch MCP servers', group: 'Navigate', icon: 'plug', slash: 'mcp', run: () => openSettings('connectors') },
      { id: 'usage', title: 'Usage and cost', detail: 'Tokens and spend across sessions', group: 'Navigate', icon: 'chart', slash: 'cost', run: () => openSettings('usage') },
      { id: 'phone', title: 'Connect phone', detail: 'Control this workspace from your phone', group: 'Navigate', icon: 'phone', run: () => openSettings('account') },
      { id: 'sidebar', title: sidebarOpen ? 'Hide sidebar' : 'Show sidebar', detail: 'Sessions list', group: 'Appearance', icon: 'sidebar', run: () => setSidebarOpen(!sidebarOpen) },
      { id: 'color-mode', title: 'Toggle light and dark', detail: 'Switch the color mode', group: 'Appearance', icon: 'sun', run: toggleColorMode },
    ];
  }, [agents.agentId, chat, openInspector, openSettings, preferences, profile, sessions, setSidebarOpen, showToast, sidebarOpen, workdir]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const shortcut = eventShortcut(event);
      const match = (Object.entries(readShortcuts()) as Array<[ShortcutAction, string]>).find(([, value]) => value === shortcut);
      if (!match) return;
      // The palette opens from anywhere, including while typing.
      if (match[0] === 'commandPalette') { event.preventDefault(); setPaletteOpen((open) => !open); return; }
      if ((event.target as HTMLElement | null)?.matches('input, textarea, select')) return;
      event.preventDefault();
      if (match[0] === 'newSession') { sessions.create(); setScreen('main'); } else { const next = screenForShortcut(match[0]); if (next) setScreen(next); }
    };
    window.addEventListener('keydown', onKeyDown); return () => window.removeEventListener('keydown', onKeyDown);
  }, [sessions]);

  useEffect(() => {
    if (!profile) return;
    const root = document.documentElement;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      applyAppearance(root, profile, media.matches);
    };
    apply();
    if (profile.colorMode !== 'system') return;
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [profile]);

  if (preferences.loading) {
    return <AppStateScreen title="Preparing your workspace" detail="Loading your local Aurict setup…" busy />;
  }

  if (preferences.error || !profile) {
    return <AppStateScreen
      title="Your setup needs attention"
      detail={preferences.error ?? 'Your preferences could not be loaded.'}
      action={{ label: 'Try again', onClick: () => { void preferences.reload(); } }}
      secondaryAction={{ label: 'Reset preferences', onClick: () => { void preferences.reset().catch((error) => console.error('Preferences reset failed', error)); } }}
    />;
  }

  const showCodeWorkspace = screen === 'main' && codeWorkspace;
  const enableAutoApproveSafe = () => policy.setAutoAllowSafe(true);
  const conversation = {
    chat, sessions, agents, providers, modelSelection, permission, commands,
    onEnableAutoApproveSafe: enableAutoApproveSafe,
    workspace: workdir.workdir,
    onChooseWorkspace: workdir.choose,
  };

  return (
    <div className="aur-app-shell">
      <Titlebar
        screen={screen}
        onNavigate={setScreen}
        workdir={workdir.workdir}
        onChooseWorkdir={workdir.choose}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        inspectorOpen={inspectorOpen}
        onToggleInspector={showCodeWorkspace ? () => setInspectorOpen(!inspectorOpen) : undefined}
        onOpenPalette={() => setPaletteOpen(true)}
      />

      <div className="aur-app-body">
        {sidebarOpen && <Sidebar sessions={sessions} workspace={workdir.workdir} settingsActive={screen === 'settings'} onOpenSession={() => setScreen('main')} onOpenSettings={() => openSettings()} onConnectPhone={() => openSettings('account')} />}
        {screen === 'main' && (codeWorkspace
          ? <MainScreen {...conversation} inspectorOpen={inspectorOpen} inspectorTab={inspectorTab} onInspectorTab={setInspectorTab} artifacts={artifacts.artifacts} activeArtifactId={artifacts.activeId} onSelectArtifact={artifacts.select} />
          : <HomeScreen {...conversation} userType={profile.userType} />)}
        {screen === 'memory' && <MemoryScreen />}
        {screen === 'settings' && <SettingsScreen section={settingsSection} onSection={setSettingsSection} profile={profile} onUpdateProfile={preferences.update} onResetPreferences={preferences.reset} workspace={workdir.workdir} workspaceError={workdir.error} onChooseWorkspace={workdir.choose} providers={providers} agents={agents} sessions={sessions} />}
      </div>

      {permission.current && needsApprovalModal(permission.current, screen === 'main') && (
        <ApprovalModal request={permission.current} onRespond={permission.respond} onEnableAutoApproveSafe={enableAutoApproveSafe} />
      )}
      {paletteOpen && <CommandPalette commands={commands} onClose={() => setPaletteOpen(false)} />}
      {confirmation && <ConfirmDialog title={confirmation.title} description={confirmation.description} confirmLabel={confirmation.confirmLabel} tone="danger" onCancel={() => setConfirmation(null)} onConfirm={() => { const action = confirmation.onConfirm; setConfirmation(null); action(); }} />}
      <ArtifactRail artifacts={artifacts.artifacts} activeId={artifacts.activeId} open={artifacts.open} onClose={() => artifacts.setOpen(false)} onSelect={artifacts.select} onRetry={(artifact) => { if (artifact.prompt) chat.submit(artifact.prompt, undefined, artifact.id, `Retry artifact: ${artifact.title}`, 'iterate'); }} listError={artifacts.error} onRetryList={() => { void artifacts.refresh(); }} />
      <ToastRegion toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
