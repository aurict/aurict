import { useCallback, useEffect, useState } from 'react';
import type { UserProfile } from '../../shared/ipc-types.js';
import { createProfile } from '../experience/registry.js';

// There is no onboarding flow: a missing or reset profile is replaced by the
// default code-workspace profile, and every choice lives in Settings.
async function loadOrCreateProfile(): Promise<UserProfile> {
  const saved = await window.aurict.onboarding.get();
  if (saved) return saved;
  const profile = createProfile('developer');
  await window.aurict.onboarding.save(profile);
  return profile;
}

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      setProfile(await loadOrCreateProfile());
    } catch (loadError) {
      console.error('Failed to load profile', loadError);
      setError(loadError instanceof Error ? loadError.message : 'Hoprel could not load your saved preferences.');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const update = useCallback(async (changes: Partial<UserProfile>) => {
    if (!profile) throw new Error('Preferences are not loaded yet');
    const next = { ...profile, ...changes };
    setProfile(next);
    try {
      await window.aurict.onboarding.save(next);
      return next;
    } catch (error) {
      setProfile(profile);
      throw error;
    }
  }, [profile]);

  const reset = useCallback(async () => {
    await window.aurict.onboarding.reset();
    await load();
  }, [load]);

  return { profile, loading, error, reload: load, update, reset };
}
