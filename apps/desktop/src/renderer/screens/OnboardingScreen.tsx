import React, { useEffect, useMemo, useState } from 'react';
import type { ColorMode, ExperienceLayout, FontPair, ExperienceTheme, UserProfile, UserType } from '../../shared/ipc-types.js';
import { createProfile, FONT_OPTIONS, layoutOptions, THEME_OPTIONS, USER_TYPE_OPTIONS } from '../experience/registry.js';
import { resolveColorMode } from '../experience/appearance.js';
import { OnboardingModelStep, type ProviderModelPreference } from '../components/OnboardingModelStep.js';
import { WindowChrome } from '../components/WindowChrome.js';

const STEPS = ['Your focus', 'Your surface', 'AI defaults', 'Appearance', 'Typography'] as const;

interface Props {
  onComplete: (profile: UserProfile) => Promise<unknown>;
}

export function OnboardingScreen({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [userType, setUserType] = useState<UserType>('general');
  const [layout, setLayout] = useState<ExperienceLayout>('home');
  const [theme, setTheme] = useState<ExperienceTheme>('paper');
  const [colorMode, setColorMode] = useState<ColorMode>('system');
  const [fontPair, setFontPair] = useState<FontPair>('friendly');
  const [modelPreference, setModelPreference] = useState<ProviderModelPreference>({ providerId: null, modelId: null });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prefersDark, setPrefersDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
  const layouts = useMemo(() => layoutOptions(userType), [userType]);
  const resolvedColorMode = resolveColorMode(colorMode, prefersDark);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => setPrefersDark(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  const chooseType = (next: UserType) => {
    const profile = createProfile(next);
    setUserType(next);
    setLayout(profile.layout);
    setTheme(profile.theme);
    setFontPair(profile.fontPair);
  };

  const finish = async () => {
    if (saving) return;
    setError(null);
    setSaving(true);
    try {
      await onComplete(createProfile(userType, { layout, theme, colorMode, fontPair, preferredProviderId: modelPreference.providerId, preferredModelId: modelPreference.modelId }));
    } catch (saveError) {
      console.error('Failed to save onboarding profile', saveError);
      setError(saveError instanceof Error ? saveError.message : 'Aurict could not save your choices. Please try again.');
      setSaving(false);
    }
  };

  return (
    <main className="aur-experience aur-onboarding" data-theme={theme} data-font-pair={fontPair} data-color-mode={resolvedColorMode}>
      <WindowChrome />
      <div style={{ width: 860, maxWidth: '100%' }}>
        <ol aria-label="Onboarding progress" style={{ display: 'flex', justifyContent: 'center', gap: 8, margin: '0 0 26px', padding: 0, listStyle: 'none' }}>
          {STEPS.map((label, index) => <li aria-current={index === step ? 'step' : undefined} key={label} style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: index === step ? 'var(--accent)' : index < step ? 'var(--safe)' : 'var(--text-disabled)' }}>{index + 1}. {label}</li>)}
        </ol>
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 10 }}>Welcome to Hoprel by Aurict</div>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontWeight: 600, fontSize: 34, color: 'var(--text)' }}>{step === 0 ? 'What are you here to make?' : step === 1 ? 'Choose your starting surface' : step === 2 ? 'Choose your AI defaults' : step === 3 ? 'Make it feel like yours' : 'Choose your reading rhythm'}</h1>
          <p style={{ margin: '10px 0 0', fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--text-muted)' }}>Everything stays local and can be changed later in Settings.</p>
        </div>

        {step === 0 && <ChoiceGrid items={USER_TYPE_OPTIONS} selected={userType} onSelect={chooseType} />}
        {step === 1 && <ChoiceGrid items={layouts} selected={layout} onSelect={setLayout} />}
        {step === 2 && <OnboardingModelStep value={modelPreference} onChange={setModelPreference} />}
        {step === 3 && (
          <div className="aur-onboarding-appearance" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <ChoiceGrid items={THEME_OPTIONS} selected={theme} onSelect={setTheme} compact />
            <div style={{ padding: 18, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 10 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 12 }}>Color mode</div>
              {(['system', 'light', 'dark'] as ColorMode[]).map((mode) => <button key={mode} onClick={() => setColorMode(mode)} style={choiceButton(colorMode === mode)}>{mode === 'system' ? 'Follow system' : mode}</button>)}
              <ExperiencePreview layout={layout} />
            </div>
          </div>
        )}
        {step === 4 && <><ChoiceGrid items={FONT_OPTIONS} selected={fontPair} onSelect={setFontPair} /><ExperiencePreview layout={layout} typography /></>}

        {error && <div role="alert" className="aur-inline-error">{error}</div>}
        <div style={{ display: 'flex', justifyContent: step === 0 ? 'flex-end' : 'space-between', marginTop: 20 }}>
          {/**On step 0 there's nowhere to go back to, so the back button isn't
           * rendered at all (rather than disabled) — a disabled-but-visible button
           * caused "a brief visible flash" when navigating back to step 0, even in
           * the packaged production build. justifyContent switches to flex-end
           * when the button is absent so the continue button doesn't jump position
           * (no back button = no second flex child to space-between against).*/}
          {step > 0 && (
            <button
              onClick={() => setStep((current) => Math.max(0, current - 1))}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                padding: '9px 13px',
                color: 'var(--text)',
                background: 'transparent',
                border: '1px solid var(--border-strong)',
                borderRadius: 7,
                cursor: 'pointer' 
              }}>← back</button>
          )}
          {step < STEPS.length - 1 ? <button onClick={() => setStep((current) => current + 1)} disabled={step === 2 && (!modelPreference.providerId || !modelPreference.modelId)} style={primaryButton}>continue →</button> : <button onClick={() => { void finish(); }} disabled={saving} style={primaryButton}>{saving ? 'saving…' : 'enter Aurict →'}</button>}
        </div>
      </div>
    </main>
  );
}

function ChoiceGrid<T extends string>({ items, selected, onSelect, compact = false }: { items: Array<{ id: T; title: string; detail: string }>; selected: T; onSelect: (id: T) => void; compact?: boolean }) {
  return <div className="aur-choice-grid" data-compact={compact || undefined} role="radiogroup" style={{ display: 'grid', gridTemplateColumns: compact ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: 10 }}>{items.map((item) => <button key={item.id} type="button" aria-checked={selected === item.id} role="radio" onClick={() => onSelect(item.id)} style={{ minHeight: compact ? 64 : 116, padding: 16, textAlign: 'left', cursor: 'pointer', background: selected === item.id ? 'color-mix(in oklch, var(--accent) 12%, var(--bg-card))' : 'var(--bg-card)', border: `1px solid ${selected === item.id ? 'var(--accent)' : 'var(--border-subtle)'}`, borderRadius: 10, color: 'inherit' }}><div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, color: 'var(--text)', marginBottom: 6 }}>{item.title}</div><div style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, lineHeight: 1.5, color: 'var(--text-muted)' }}>{item.detail}</div></button>)}</div>;
}

function choiceButton(active: boolean): React.CSSProperties {
  return { display: 'block', width: '100%', marginTop: 8, textAlign: 'left', padding: '10px 11px', fontFamily: 'var(--font-mono)', fontSize: 12, color: active ? 'var(--text)' : 'var(--text-muted)', background: active ? 'color-mix(in oklch, var(--accent) 12%, transparent)' : 'transparent', border: `1px solid ${active ? 'var(--accent)' : 'var(--border-subtle)'}`, borderRadius: 6, cursor: 'pointer' };
}

const primaryButton: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 12.5, padding: '10px 18px', color: 'var(--accent-ink)', background: 'var(--accent)', border: 'none', borderRadius: 7, cursor: 'pointer' };

function ExperiencePreview({ layout, typography = false }: { layout: ExperienceLayout; typography?: boolean }) {
  const label = layout === 'finance' ? 'Finance desk' : layout === 'design' ? 'Studio canvas' : layout === 'developer' ? 'Code workspace' : 'Aurict home';
  return <div aria-label="Live appearance preview" style={{ marginTop: 18, overflow: 'hidden', border: '1px solid var(--border-strong)', borderRadius: 8, background: 'var(--bg)' }}>
    <div style={{ padding: '8px 10px', background: 'var(--bg-deep)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--titlebar-text)', fontFamily: 'var(--font-serif)', fontSize: 14, fontWeight: 600 }}>hoprel<span style={{ color: 'var(--accent)' }}>▊</span><small style={{ marginLeft: 5, color: 'var(--titlebar-muted)', fontFamily: 'var(--font-mono)', fontSize: 8.5 }}>by aurict</small></div>
    <div style={{ padding: 12, background: 'var(--bg-alt)' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '.07em' }}>{label}</div>
      <div style={{ marginTop: 6, fontFamily: 'var(--font-serif)', fontSize: typography ? 20 : 16, fontWeight: 600, color: 'var(--text)' }}>{typography ? 'A clear interface starts with type.' : 'Your workspace, in your theme.'}</div>
      <div style={{ marginTop: 6, fontFamily: typography ? 'var(--font-mono)' : 'var(--font-serif)', fontSize: 11, lineHeight: 1.45, color: 'var(--text-muted)' }}>{typography ? '0123456789 · formulas · code' : 'Readable surfaces, clear actions, and calm contrast.'}</div>
      <button type="button" tabIndex={-1} style={{ marginTop: 10, padding: '5px 8px', background: 'var(--accent)', border: 'none', borderRadius: 4, color: 'var(--accent-ink)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>Primary action</button>
    </div>
  </div>;
}
