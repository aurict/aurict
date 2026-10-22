import type { ExperienceLayout, ExperienceTheme, FontPair, UserProfile, UserType } from '../../shared/ipc-types.js';

export const USER_TYPE_OPTIONS: Array<{ id: UserType; title: string; detail: string; layout: ExperienceLayout }> = [
  { id: 'general', title: 'Explore Aurict', detail: 'Get help with everyday tasks, ideas, research, and planning.', layout: 'home' },
  { id: 'developer', title: 'Developer', detail: 'Fix, refactor, review, and ship code from a workspace.', layout: 'developer' },
  { id: 'product', title: 'Product / founder', detail: 'Turn product ideas into specs, flows, and build-ready plans.', layout: 'product' },
  { id: 'operator', title: 'Operations / business', detail: 'Analyze work, prepare documents, and automate routines.', layout: 'operations' },
];

export const THEME_OPTIONS: Array<{ id: ExperienceTheme; title: string; detail: string }> = [
  { id: 'oxblood', title: 'Aurict red', detail: 'The Aurict accent, warm and focused.' },
  { id: 'paper', title: 'Paper', detail: 'Warm, quiet, and approachable.' },
  { id: 'slate', title: 'Slate', detail: 'Neutral and information-dense.' },
  { id: 'studio', title: 'Studio', detail: 'Expressive violet for creative work.' },
  { id: 'forest', title: 'Forest', detail: 'Calm green for product work.' },
  { id: 'contrast', title: 'High contrast', detail: 'Maximum readability and clarity.' },
];

export const FONT_OPTIONS: Array<{ id: FontPair; title: string; detail: string }> = [
  { id: 'system', title: 'System', detail: 'Native platform typography.' },
  { id: 'modern', title: 'Modern', detail: 'Clean sans with compact technical text.' },
  { id: 'editorial', title: 'Editorial', detail: 'Serif-led reading and visual work.' },
  { id: 'technical', title: 'Technical', detail: 'Dense numbers and code-friendly detail.' },
  { id: 'friendly', title: 'Friendly', detail: 'Soft, approachable everyday writing.' },
];

export function layoutOptions(userType: UserType): Array<{ id: ExperienceLayout; title: string; detail: string }> {
  if (userType === 'developer') return [{ id: 'developer', title: 'Code workspace', detail: 'Files, tasks, chat, and agent controls.' }, { id: 'home', title: 'Chat focus', detail: 'A quieter starting point with workspace tools on demand.' }];
  if (userType === 'product') return [{ id: 'product', title: 'Product hub', detail: 'Briefs, decisions, plans, and prototypes.' }, { id: 'home', title: 'Calm home', detail: 'Start from an outcome or question.' }];
  if (userType === 'operator') return [{ id: 'operations', title: 'Operations desk', detail: 'Routines, reports, and recurring work.' }, { id: 'home', title: 'Calm home', detail: 'Start from a task or question.' }];
  return [{ id: 'home', title: 'Calm home', detail: 'A friendly starting place for questions and recent work.' }];
}

export function createProfile(userType: UserType, overrides: Partial<UserProfile> = {}): UserProfile {
  const type = USER_TYPE_OPTIONS.find((option) => option.id === userType);
  if (!type) throw new Error(`Unknown user type: ${userType}`);
  const theme: ExperienceTheme = 'oxblood';
  const fontPair: FontPair = 'system';
  return {
    userType,
    layout: type.layout,
    theme,
    colorMode: 'system',
    fontPair,
    preferredProviderId: null,
    preferredModelId: null,
    onboardingVersion: 3,
    completedAt: Date.now(),
    ...overrides,
  };
}
