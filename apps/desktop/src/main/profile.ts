import type { ColorMode, ExperienceLayout, ExperienceTheme, FontPair, UserProfile, UserType } from '../shared/ipc-types.js';

const USER_TYPES: UserType[] = ['general', 'developer', 'product', 'operator'];
const LAYOUTS: ExperienceLayout[] = ['home', 'developer', 'product', 'operations'];
const THEMES: ExperienceTheme[] = ['oxblood', 'paper', 'slate', 'studio', 'forest', 'contrast'];
// Designer and finance profiles predate the removal of the Design and Finance
// screens; they keep working as general users instead of being sent back to onboarding.
const LEGACY_USER_TYPES: Record<string, UserType> = { designer: 'general', finance: 'general' };
const COLOR_MODES: ColorMode[] = ['system', 'light', 'dark'];
const FONT_PAIRS: FontPair[] = ['editorial', 'modern', 'technical', 'friendly', 'system'];

function defaultLayout(userType: UserType): ExperienceLayout {
  if (userType === 'general') return 'home';
  if (userType === 'developer') return 'developer';
  if (userType === 'product') return 'product';
  return 'operations';
}

function defaultProfile(userType: UserType = 'general'): UserProfile {
  return {
    userType,
    layout: defaultLayout(userType),
    theme: 'oxblood',
    colorMode: 'system',
    fontPair: 'system',
    preferredProviderId: null,
    preferredModelId: null,
    onboardingVersion: 3,
    completedAt: Date.now(),
  };
}

export function normalizeProfile(profile: Partial<UserProfile>): UserProfile | null {
  const userType = profile.userType ? LEGACY_USER_TYPES[profile.userType] ?? profile.userType : undefined;
  if (!userType || !USER_TYPES.includes(userType)) return null;
  const fallback = defaultProfile(userType);
  return {
    userType,
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
