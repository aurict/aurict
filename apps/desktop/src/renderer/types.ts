export type AssistantBlock =
  | { type: 'text'; content: string }
  | { type: 'tool'; id: string; tool: string; argsSummary: string; pending: boolean; result?: string; durationMs?: number; liveOutput?: string };

export interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'error';
  content: string;
  blocks?: AssistantBlock[];
  pending?: boolean;
}

/** Best-effort one-line summary of a tool call's args, for display next to the tool name. */
export function summarizeToolArgs(args: unknown): string {
  if (typeof args !== 'object' || args === null) return String(args ?? '');
  const obj = args as Record<string, unknown>;
  const preferredKeys = ['path', 'command', 'pattern', 'query', 'url'];
  for (const key of preferredKeys) {
    if (typeof obj[key] === 'string') return (obj[key] as string).slice(0, 80);
  }
  const first = Object.values(obj).find((v) => typeof v === 'string');
  return first ? String(first).slice(0, 80) : JSON.stringify(args).slice(0, 80);
}
