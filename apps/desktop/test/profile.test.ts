/* eslint-disable import/no-unresolved -- Bun provides this test module at runtime. */
import { describe, expect, it } from 'bun:test';
import { normalizeProfile } from '../src/main/profile.js';
import type { UserProfile } from '../src/shared/ipc-types.js';

// Profiles saved before the Design and Finance screens were removed still
// carry those values on disk; they must load instead of forcing onboarding.
function legacy(profile: Record<string, unknown>): Partial<UserProfile> {
  return profile as Partial<UserProfile>;
}

describe('profile normalization', () => {
  it('maps legacy designer and finance users to general users on the home layout', () => {
    expect(normalizeProfile(legacy({ userType: 'designer', layout: 'design' }))).toMatchObject({ userType: 'general', layout: 'home' });
    expect(normalizeProfile(legacy({ userType: 'finance', layout: 'finance' }))).toMatchObject({ userType: 'general', layout: 'home' });
  });

  it('replaces the removed ledger theme and keeps other appearance choices', () => {
    expect(normalizeProfile(legacy({ userType: 'finance', theme: 'ledger', colorMode: 'dark', fontPair: 'technical' }))).toMatchObject({ theme: 'oxblood', colorMode: 'dark', fontPair: 'technical' });
    expect(normalizeProfile(legacy({ userType: 'designer', theme: 'studio' }))).toMatchObject({ theme: 'studio' });
  });

  it('keeps current profiles unchanged and rejects unknown user types', () => {
    expect(normalizeProfile({ userType: 'developer', layout: 'home', theme: 'slate' })).toMatchObject({ userType: 'developer', layout: 'home', theme: 'slate' });
    expect(normalizeProfile(legacy({ userType: 'astronaut' }))).toBeNull();
  });
});
