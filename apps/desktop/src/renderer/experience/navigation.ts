export type Screen = 'main' | 'memory' | 'settings';
export type NavigationItem = { id: Screen; label: string };

// Settings is reached from the sidebar's account row and its shortcut, not the titlebar.
export const PRIMARY_NAVIGATION: NavigationItem[] = [{ id: 'main', label: 'Home' }, { id: 'memory', label: 'Memory' }];
