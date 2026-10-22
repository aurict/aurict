import React, { useEffect, useState } from 'react';
import { useProviders } from '../hooks/useProviders.js';
import { usePolicy } from '../hooks/usePolicy.js';
import { useAgents } from '../hooks/useAgents.js';
import type { ColorMode, ExperienceLayout, ExperienceTheme, FontPair, UserProfile, UserType } from '../../shared/ipc-types.js';
import type { RemoteStatus } from '../../shared/ipc-types.js';
import { createProfile, FONT_OPTIONS, layoutOptions, THEME_OPTIONS, USER_TYPE_OPTIONS } from '../experience/registry.js';
import { DEFAULT_SHORTCUTS, eventShortcut, readShortcuts, saveShortcuts, type ShortcutAction } from '../shortcuts.js';
import { useToasts, ToastRegion } from '../components/ToastRegion.js';
import { useErrorToast } from '../hooks/useErrorToast.js';
import { useSkills } from '../hooks/useSkills.js';
import type { useSessions } from '../hooks/useSessions.js';
import { ConnectorSettings } from './settings/ConnectorSettings.js';
import { UsageSettings } from './settings/UsageSettings.js';

const COMING_SOON_POLICY = [
  { label: 'Warn on cross-directory writes', desc: 'apply_patch outside the active allowlist' },
  { label: 'Require approval for danger-tier bash', desc: 'rm, force-push, network calls' },
];

const sectionHeading: React.CSSProperties = {
  fontFamily: 'var(--font-ui)', fontSize: 13.5, fontWeight: 600, color: 'var(--text)', marginBottom: 10,
};

export type SettingsSection = 'appearance' | 'account' | 'providers' | 'connectors' | 'safety' | 'agents' | 'skills' | 'usage' | 'keyboard';

interface Props {
  section: SettingsSection;
  onSection: (section: SettingsSection) => void;
  sessions: ReturnType<typeof useSessions>;
  profile: UserProfile;
  onUpdateProfile: (changes: Partial<UserProfile>) => Promise<UserProfile>;
  onResetPreferences: () => Promise<void>;
  workspace: string;
  workspaceError: string | null;
  onChooseWorkspace: () => Promise<unknown>;
  providers: ReturnType<typeof useProviders>;
  agents: ReturnType<typeof useAgents>;
}

export function SettingsScreen({ section, onSection: setSection, sessions, profile, onUpdateProfile, onResetPreferences, workspace, workspaceError, onChooseWorkspace, providers, agents }: Props) {
  const policy = usePolicy();
  const { toasts, show: showToast, dismiss: dismissToast } = useToasts();
  useErrorToast(providers.error, providers.errorSeq, providers.refresh, showToast, dismissToast);
  // Workspace selection errors already surface as a toast at the App shell
  // level (Titlebar's "choose workspace" is global, not Settings-specific),
  // so this only needs the inline error text below — a second toast here
  // would duplicate the shell one for the exact same failure.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [keyDraft, setKeyDraft] = useState('');
  const [providerMessage, setProviderMessage] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const sections = [['appearance', 'Appearance'], ['account', 'Account & remote'], ['providers', 'Providers'], ['connectors', 'Connectors'], ['safety', 'Safety'], ['agents', 'Agents & preferences'], ['skills', 'Skills'], ['usage', 'Usage'], ['keyboard', 'Keyboard shortcuts']] as const;
  const visibleSections = sections.filter(([, label]) => label.toLowerCase().includes(query.trim().toLowerCase()));

  const submitKey = async (providerId: string) => {
    if (!keyDraft.trim()) return;
    setProviderMessage(null);
    try {
      await providers.setKey(providerId, keyDraft.trim());
      setKeyDraft('');
      setEditingId(null);
      setProviderMessage('Provider key saved locally.');
    } catch (error) {
      console.error('Failed to save provider key', error);
      setProviderMessage(error instanceof Error ? error.message : 'Provider key could not be saved.');
    }
  };

  return (
    <div className="aur-settings-shell">
      <nav className="aur-settings-nav" aria-label="Settings sections">
        <input aria-label="Search settings" value={query} onChange={(event) => setQuery(event.target.value.toLowerCase())} placeholder="Search settings" />
        {visibleSections.map(([id, label]) => <button key={id} type="button" aria-current={section === id ? 'page' : undefined} onClick={() => setSection(id)}>{label}</button>)}
      </nav>
      <div className="aur-settings-content">
        <h1 className="aur-page-title">{sections.find(([id]) => id === section)?.[1] ?? 'Settings'}</h1>
        <p className="aur-page-detail">Changes are saved locally and apply immediately.</p>

        {section === 'appearance' && <AppearanceSettings profile={profile} onUpdateProfile={onUpdateProfile} />}
        {section === 'account' && <><WorkspaceSettings workspace={workspace} error={workspaceError} onChooseWorkspace={onChooseWorkspace} /><RemoteControlSettings /></>}

        {section === 'providers' && <>
        <div style={sectionHeading}>Bring your own key</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'var(--control-bg)', borderRadius: 12, overflow: 'hidden', marginBottom: 32 }}>
          {providers.error && (
            <div role="alert" style={{ padding: '14px 16px', background: 'var(--bg-card)', fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--danger)' }}>
              {providers.error} <button type="button" className="aur-text-action" style={{ marginTop: 0 }} onClick={() => { void providers.refresh().catch((reason) => console.error('Provider retry failed', reason)); }}>Retry</button>
            </div>
          )}
          {!providers.error && providers.providers.length === 0 && (
            <div style={{ padding: '14px 16px', background: 'var(--bg-card)', fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--text-muted)' }}>
              Loading providers…
            </div>
          )}
          {providers.providers.map((p) => (
            <div key={p.id} style={{ background: 'var(--bg-card)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: p.hasKey ? 'var(--safe)' : 'var(--text-disabled)' }} />
                  <span style={{ fontFamily: 'var(--font-ui)', fontSize: 14.5, color: 'var(--text)' }}>{p.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12.5, color: 'var(--text-muted)' }}>
                    {p.hasKey ? 'Connected' : 'Not configured'}
                  </span>
                  <button
                    onClick={() => { setEditingId(editingId === p.id ? null : p.id); setKeyDraft(''); }}
                    style={{ fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 600, padding: '5px 10px', background: 'transparent', color: 'var(--text)', border: '1px solid var(--border-strong)', borderRadius: 8, cursor: 'pointer' }}
                  >
                    {p.hasKey ? 'Change key' : 'Add key'}
                  </button>
                </div>
              </div>
              {editingId === p.id && (
                <div style={{ display: 'flex', gap: 8, padding: '0 16px 14px' }}>
                  <input
                    type="password"
                    autoFocus
                    value={keyDraft}
                    onChange={(e) => setKeyDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') void submitKey(p.id); }}
                    placeholder="Paste API key"
                    style={{ flex: 1, fontFamily: 'var(--font-ui)', fontSize: 13, padding: '8px 10px', background: 'var(--bg-deep)', border: '1px solid var(--border-strong)', borderRadius: 8, color: 'var(--text)' }}
                  />
                  <button
                    onClick={() => { void submitKey(p.id); }}
                    style={{ fontFamily: 'var(--font-ui)', fontSize: 12.5, fontWeight: 600, padding: '8px 14px', background: 'var(--accent)', color: 'var(--accent-ink)', border: 'none', borderRadius: 8, cursor: 'pointer' }}
                  >
                    Save
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
        {providerMessage && <div role="status" className="aur-inline-status">{providerMessage}</div>}
        </>}

        {section === 'safety' && <>
        <div style={sectionHeading}>Permission policy</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'var(--control-bg)', borderRadius: 12, overflow: 'hidden', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--bg-card)' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: 14.5, color: 'var(--text)', marginBottom: 2 }}>Auto-allow safe commands</div>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12.5, color: 'var(--text-muted)' }}>Enabled by default for read-only tools and low-risk requests. Never writes files or runs destructive commands.</div>
            </div>
            <button
              type="button"
              aria-pressed={policy.policy.autoAllowSafe}
              aria-label="Auto-allow safe commands"
              onClick={() => { void policy.setAutoAllowSafe(!policy.policy.autoAllowSafe).catch((reason) => console.error('Policy update failed', reason)); }}
              style={{ width: 38, height: 22, padding: 0, border: 'none', borderRadius: 11, background: policy.policy.autoAllowSafe ? 'var(--accent)' : 'var(--control-hover)', position: 'relative', flexShrink: 0, cursor: 'pointer' }}
            >
              <div style={{ position: 'absolute', top: 2, left: policy.policy.autoAllowSafe ? 18 : 2, width: 18, height: 18, borderRadius: '50%', background: 'var(--bg-card)', transition: 'left .2s' }} />
            </button>
          </div>
          {COMING_SOON_POLICY.map((r) => (
            <div key={r.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--bg-card)', opacity: 0.5 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-ui)', fontSize: 14.5, color: 'var(--text)', marginBottom: 2 }}>{r.label}</div>
                <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12.5, color: 'var(--text-muted)' }}>{r.desc} · Coming soon</div>
              </div>
              <div style={{ width: 38, height: 22, borderRadius: 11, background: 'var(--control-hover)', position: 'relative', flexShrink: 0 }}>
                <div style={{ position: 'absolute', top: 2, left: 2, width: 18, height: 18, borderRadius: '50%', background: 'var(--bg-card)' }} />
              </div>
            </div>
          ))}
        </div>
        {policy.error && <div role="alert" className="aur-inline-error">{policy.error}</div>}
        </>}

        {section === 'agents' && <>
        <div style={sectionHeading}>Agent modes</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'var(--control-bg)', borderRadius: 12, overflow: 'hidden' }}>
          {agents.agents.map((a) => (
            <div key={a.id} style={{ padding: '13px 16px', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: a.color, flexShrink: 0 }} />
              <div>
                <div style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--text)' }}>{a.name}</div>
                <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{a.description}</div>
              </div>
            </div>
          ))}
        </div>
        <p style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--text-subtle)', marginTop: 10 }}>
          Selection happens per-turn from the composer's agent dropdown — this is a reference list, not a toggle.
        </p>

        <div style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid var(--border-subtle)' }}>
          <div style={sectionHeading}>Preferences</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, padding: '14px 16px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12 }}>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12.5, lineHeight: 1.5, color: 'var(--text-muted)' }}>Restore the default appearance and code workspace. Sessions, memory and provider keys are kept.</div>
            <button onClick={() => { setResetError(null); void onResetPreferences().catch((error) => setResetError(error instanceof Error ? error.message : 'Preferences could not be reset.')); }} style={{ flexShrink: 0, fontFamily: 'var(--font-ui)', fontSize: 12.5, padding: '7px 10px', color: 'var(--text)', background: 'transparent', border: '1px solid var(--border-strong)', borderRadius: 8, cursor: 'pointer' }}>Reset preferences</button>
          </div>
          {resetError && <div role="alert" className="aur-inline-error">{resetError}</div>}
        </div>
        </>}
        {section === 'skills' && <SkillsSettings />}
        {section === 'connectors' && <ConnectorSettings />}
        {section === 'usage' && <UsageSettings sessions={sessions} />}
        {section === 'keyboard' && <KeyboardSettings />}
      </div>
      <ToastRegion toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

function KeyboardSettings() {
  const [shortcuts, setShortcuts] = useState(readShortcuts);
  const update = (action: ShortcutAction, value: string) => { const next = { ...shortcuts, [action]: value }; if (Object.entries(next).some(([key, shortcut]) => key !== action && shortcut === value)) return; setShortcuts(next); saveShortcuts(next); };
  return <section aria-labelledby="keyboard-heading"><div id="keyboard-heading" style={sectionHeading}>Shortcuts</div><p style={{ fontFamily: 'var(--font-ui)', fontSize: 12.5, color: 'var(--text-muted)' }}>Select a shortcut, then press the new combination. Conflicting assignments are ignored.</p><div style={{ display: 'grid', gap: 1, background: 'var(--control-bg)', borderRadius: 12, overflow: 'hidden' }}>{(Object.entries(shortcuts) as Array<[ShortcutAction, string]>).map(([action, shortcut]) => <label key={action} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '12px 14px', background: 'var(--bg-card)', fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--text)' }}><span>{SHORTCUT_LABELS[action]}</span><input readOnly value={shortcut} onKeyDown={(event) => { event.preventDefault(); update(action, eventShortcut(event.nativeEvent)); }} style={{ width: 120, padding: '5px 7px', color: 'var(--text)', background: 'var(--bg-deep)', border: '1px solid var(--border-strong)', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 12, textAlign: 'center' }} /></label>)}</div><button type="button" className="aur-button" style={{ marginTop: 14 }} onClick={() => { setShortcuts(DEFAULT_SHORTCUTS); saveShortcuts(DEFAULT_SHORTCUTS); }}>Reset defaults</button></section>;
}

function WorkspaceSettings({ workspace, error, onChooseWorkspace }: { workspace: string; error: string | null; onChooseWorkspace: () => Promise<unknown> }) {
  const [message, setMessage] = useState<string | null>(null);
  const choose = async () => {
    setMessage(null);
    try {
      const result = await onChooseWorkspace();
      setMessage(result ? 'Workspace updated.' : 'Workspace selection was cancelled.');
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Workspace could not be changed.');
    }
  };
  return <section style={{ marginBottom: 20 }} aria-labelledby="workspace-heading">
    <div id="workspace-heading" style={sectionHeading}>Workspace</div>
    <div style={{ padding: 16, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12 }}>
      <div style={{ fontFamily: 'var(--font-ui)', fontSize: 17, color: 'var(--text)' }}>Active workspace</div>
      <div style={{ marginTop: 7, overflowWrap: 'anywhere', fontFamily: 'var(--font-mono)', fontSize: 12.5, lineHeight: 1.5, color: 'var(--text-muted)' }}>{workspace}</div>
      <button type="button" className="aur-button" style={{ marginTop: 14 }} onClick={() => { void choose(); }}>Choose workspace</button>
      {(message ?? error) && <div role={message === 'Workspace updated.' ? 'status' : 'alert'} className={message === 'Workspace updated.' ? 'aur-inline-status' : 'aur-inline-error'}>{message ?? error}</div>}
    </div>
  </section>;
}

function RemoteControlSettings() {
  const [status, setStatus] = useState<RemoteStatus>({ status: 'loading', message: 'Checking remote control status…' });
  const [copied, setCopied] = useState<'link' | 'code' | null>(null);
  const [copyError, setCopyError] = useState<string | null>(null);
  useEffect(() => {
    window.aurict.remote.action('status');
    return window.aurict.remote.onStatus(setStatus);
  }, []);
  const active = status.status === 'connected' || status.status === 'waitingForPhone' || status.status === 'creatingSession';
  const approval = status.verificationUriComplete && status.userCode
    ? { link: status.verificationUriComplete, code: status.userCode }
    : null;
  const copyApprovalValue = (kind: 'link' | 'code', value: string) => {
    setCopyError(null);
    void navigator.clipboard.writeText(value).then(() => {
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 1_800);
    }).catch((reason: unknown) => {
      console.error(`Failed to copy remote approval ${kind}`, reason);
      setCopyError('Could not copy automatically. Select the value and copy it manually.');
    });
  };
  return <section style={{ marginBottom: 32 }} aria-labelledby="remote-heading">
    <div id="remote-heading" style={sectionHeading}>Account & remote control</div>
    <div style={{ padding: 16, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12 }}>
      <div style={{ fontFamily: 'var(--font-ui)', fontSize: 17, color: 'var(--text)' }}>{status.email ? `Signed in as ${status.email}` : 'Connect your Aurict account'}</div>
      <p style={{ margin: '6px 0 14px', fontFamily: 'var(--font-ui)', fontSize: 12.5, lineHeight: 1.55, color: status.status === 'error' ? 'var(--danger)' : 'var(--text-muted)' }}>{status.message}</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {!status.email && <button type="button" className="aur-button aur-button-primary" onClick={() => window.aurict.remote.action('login')}>Sign in with browser</button>}
        {status.email && !active && <button type="button" className="aur-button aur-button-primary" onClick={() => window.aurict.remote.action('start')}>Connect phone</button>}
        {active && <button type="button" className="aur-button" onClick={() => window.aurict.remote.action('stop')}>Stop remote session</button>}
        {status.email && <button type="button" className="aur-button" onClick={() => window.aurict.remote.action('logout')}>Sign out</button>}
      </div>
      {approval && <div style={approvalPanelStyle}>
        <div style={approvalHeadingStyle}>Complete sign-in on any device</div>
        <p style={approvalBodyStyle}>If a browser did not open, copy this link into any browser and enter the code below.</p>
        <CopyableApprovalValue label="Approval link" value={approval.link} copied={copied === 'link'} onCopy={() => copyApprovalValue('link', approval.link)} />
        <CopyableApprovalValue label="Device code" value={approval.code} copied={copied === 'code'} onCopy={() => copyApprovalValue('code', approval.code)} />
        {copyError && <div role="alert" className="aur-inline-error" style={{ marginTop: 10 }}>{copyError}</div>}
      </div>}
      <p style={{ margin: '14px 0 0', fontFamily: 'var(--font-ui)', fontSize: 12, lineHeight: 1.5, color: 'var(--text-subtle)' }}>Browser approval creates a desktop-specific device identity. Remote control uses WebRTC; prompts and approvals travel directly between your devices, not through the signaling backend.</p>
    </div>
  </section>;
}

function CopyableApprovalValue({ label, value, copied, onCopy }: { label: string; value: string; copied: boolean; onCopy: () => void }) {
  return <label style={{ display: 'grid', gap: 5, marginTop: 12 }}>
    <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--text-subtle)', textTransform: 'none' }}>{label}</span>
    <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
      <input readOnly value={value} aria-label={label} onFocus={(event) => event.currentTarget.select()} style={approvalValueStyle} />
      <button type="button" className="aur-button" onClick={onCopy}>{copied ? 'Copied' : 'Copy'}</button>
    </div>
  </label>;
}

function AppearanceSettings({ profile, onUpdateProfile }: Pick<Props, 'profile' | 'onUpdateProfile'>) {
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const layouts = layoutOptions(profile.userType);

  const change = async (changes: Partial<UserProfile>) => {
    setError(null);
    setSaving(true);
    try {
      await onUpdateProfile(changes);
    } catch (saveError) {
      console.error('Failed to save appearance settings', saveError);
      setError('Appearance could not be saved. Your previous setting was restored.');
    } finally {
      setSaving(false);
    }
  };

  const changeUserType = (userType: UserType) => {
    const recommended = createProfile(userType, { theme: profile.theme, colorMode: profile.colorMode, fontPair: profile.fontPair });
    void change({ userType, layout: recommended.layout });
  };

  return <section style={{ marginBottom: 32 }} aria-labelledby="appearance-heading">
    <div id="appearance-heading" style={sectionHeading}>Appearance & starting surface</div>
    <div style={{ padding: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12 }}>
      <p style={{ margin: '0 0 16px', fontFamily: 'var(--font-ui)', fontSize: 12.5, lineHeight: 1.5, color: 'var(--text-muted)' }}>Changes are applied immediately and saved locally. The selected type changes your recommended starting surface without removing any work.</p>
      <div style={appearanceGrid}>
        <SettingSelect label="Theme" value={profile.theme} disabled={saving} onChange={(value) => { void change({ theme: value as ExperienceTheme }); }} options={THEME_OPTIONS.map((option) => ({ value: option.id, label: option.title }))} />
        <SettingSelect label="Color mode" value={profile.colorMode} disabled={saving} onChange={(value) => { void change({ colorMode: value as ColorMode }); }} options={[{ value: 'system', label: 'Follow system' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]} />
        <SettingSelect label="Reading font" value={profile.fontPair} disabled={saving} onChange={(value) => { void change({ fontPair: value as FontPair }); }} options={FONT_OPTIONS.map((option) => ({ value: option.id, label: option.title }))} />
        <SettingSelect label="User type" value={profile.userType} disabled={saving} onChange={(value) => changeUserType(value as UserType)} options={USER_TYPE_OPTIONS.map((option) => ({ value: option.id, label: option.title }))} />
        <SettingSelect label="Starting surface" value={profile.layout} disabled={saving} onChange={(value) => { void change({ layout: value as ExperienceLayout }); }} options={layouts.map((option) => ({ value: option.id, label: option.title }))} />
      </div>
      <AppearancePreview profile={profile} />
      {saving && <div style={{ marginTop: 12, fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--text-subtle)' }}>Saving appearance…</div>}
      {error && <div role="alert" style={{ marginTop: 12, fontFamily: 'var(--font-ui)', fontSize: 12, lineHeight: 1.5, color: 'var(--danger)' }}>{error}</div>}
    </div>
  </section>;
}

function AppearancePreview({ profile }: { profile: UserProfile }) {
  const layout = profile.layout === 'developer' ? 'Code workspace' : 'Hoprel home';
  return <div className="aur-appearance-preview" aria-label="Current appearance preview">
    <div><span>hoprel</span><small>by aurict</small></div>
    <strong>{layout}</strong>
    <p>Theme and typography apply immediately across your workspace.</p>
  </div>;
}

function SettingSelect({ label, value, disabled, onChange, options }: { label: string; value: string; disabled: boolean; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) {
  return <label style={{ display: 'block', minWidth: 0 }}>
    <span style={{ display: 'block', marginBottom: 6, fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--text-subtle)', textTransform: 'none' }}>{label}</span>
    <select value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} style={{ width: '100%', minHeight: 34, padding: '6px 8px', color: 'var(--text)', background: 'var(--bg-deep)', border: '1px solid var(--border-strong)', borderRadius: 8, fontFamily: 'var(--font-ui)', fontSize: 13 }}>
      {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  </label>;
}

const appearanceGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 };
const approvalPanelStyle: React.CSSProperties = { marginTop: 16, padding: 13, background: 'var(--bg-deep)', border: '1px solid var(--border-strong)', borderRadius: 8 };
const approvalHeadingStyle: React.CSSProperties = { fontFamily: 'var(--font-ui)', fontSize: 12.5, color: 'var(--text)', fontWeight: 600 };
const approvalBodyStyle: React.CSSProperties = { margin: '6px 0 0', fontFamily: 'var(--font-ui)', fontSize: 12, lineHeight: 1.5, color: 'var(--text-muted)' };
const approvalValueStyle: React.CSSProperties = { flex: 1, minWidth: 0, padding: '7px 8px', color: 'var(--text)', background: 'var(--control-bg)', border: '1px solid var(--border-strong)', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 12.5 };

const SHORTCUT_LABELS: Record<ShortcutAction, string> = { newSession: 'New session', openSettings: 'Open settings', openHome: 'Go to Home', openMemory: 'Go to Memory', commandPalette: 'Command palette' };

function SkillsSettings() {
  const { skills, error: listError, errorSeq: listErrorSeq, refresh, install, uninstall } = useSkills();
  const [source, setSource] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toasts, show: showToast, dismiss: dismissToast } = useToasts();
  useErrorToast(listError, listErrorSeq, refresh, showToast, dismissToast);

  const add = () => {
    const value = source.trim();
    if (!value || pending) return;
    setPending(true);
    setError(null);
    install(value).then((result) => {
      if ('error' in result) setError(result.error);
      else { setSource(''); showToast(`${result.name} installed`, 'success'); }
    }).catch((reason: unknown) => {
      console.error('Failed to install skill', reason);
      setError(reason instanceof Error ? reason.message : 'Skill could not be installed.');
    }).finally(() => setPending(false));
  };
  const remove = (id: string) => {
    setError(null);
    uninstall(id).catch((reason: unknown) => {
      console.error('Failed to uninstall skill', reason);
      setError(reason instanceof Error ? reason.message : 'Skill could not be removed.');
    });
  };

  return <section aria-labelledby="skills-heading">
    <div id="skills-heading" style={sectionHeading}>Skills</div>
    <p className="aur-settings-note">Framework and tool skills activate automatically when your stack is detected. Add your own from a SKILL.md URL or local path.</p>
    <div className="aur-settings-inline">
      <input aria-label="Skill source" value={source} onChange={(event) => setSource(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') add(); }} placeholder="SKILL.md URL or local path" />
      <button type="button" className="aur-button aur-button-primary" disabled={pending || !source.trim()} onClick={add}>{pending ? 'Installing…' : 'Add skill'}</button>
    </div>
    {error && <div role="alert" className="aur-inline-error">{error}</div>}
    <div className="aur-settings-group">
      {skills.length === 0 && !listError && <div className="aur-settings-row"><span className="aur-settings-note">Loading skills…</span></div>}
      {skills.map((skill) => <div key={skill.id} className="aur-settings-row">
        <span className={skill.active ? 'aur-status-dot' : 'aur-status-dot aur-status-dot-idle'} title={skill.active ? 'Active' : 'Inactive'} />
        <div><strong>{skill.name}</strong><small>{skill.description}</small></div>
        {skill.installed && <button type="button" className="aur-button aur-button-small" onClick={() => remove(skill.id)}>Remove</button>}
      </div>)}
    </div>
    <ToastRegion toasts={toasts} onDismiss={dismissToast} />
  </section>;
}
