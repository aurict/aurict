import type { IconName } from '../components/Icons.js';

export type CommandGroup = 'Session' | 'Workspace' | 'Create' | 'Navigate' | 'Appearance';

export interface CommandAction {
  id: string;
  title: string;
  detail: string;
  group: CommandGroup;
  icon: IconName;
  /** Slash name in the composer, without the leading "/". */
  slash?: string;
  /** Placeholder shown when the command expects text after it. */
  argument?: string;
  shortcut?: string;
  run: (args: string) => void;
}

export function matchCommands(commands: CommandAction[], query: string): CommandAction[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return commands;
  const scored = commands.map((command) => {
    const slash = command.slash?.toLowerCase() ?? '';
    const title = command.title.toLowerCase();
    const score = slash.startsWith(needle) ? 0 : title.startsWith(needle) ? 1 : slash.includes(needle) || title.includes(needle) ? 2 : command.detail.toLowerCase().includes(needle) ? 3 : -1;
    return { command, score };
  });
  return scored.filter((item) => item.score >= 0).sort((a, b) => a.score - b.score).map((item) => item.command);
}

/** "/design a landing page" → the design command with "a landing page". */
export function parseSlash(text: string, commands: CommandAction[]): { command: CommandAction; args: string } | null {
  const match = /^\/([a-z][\w-]*)(?:\s+([\s\S]*))?$/i.exec(text.trim());
  if (!match) return null;
  const command = commands.find((item) => item.slash?.toLowerCase() === match[1]?.toLowerCase());
  return command ? { command, args: (match[2] ?? '').trim() } : null;
}

/** The query being typed while the composer still holds only "/name". */
export function slashQuery(text: string): string | null {
  const match = /^\/([\w-]*)$/.exec(text);
  return match ? match[1] ?? '' : null;
}
