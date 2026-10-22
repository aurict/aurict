import type { ChatEvent, PermissionRequestPayload } from '../shared/ipc-types.js';

export interface AttentionNotice { title: string; body: string }

const MAX_BODY = 140;
const clip = (text: string) => (text.length > MAX_BODY ? `${text.slice(0, MAX_BODY - 1)}…` : text);

// Decides which runtime events deserve a system notification when the window
// is not focused. Streaming events never do; finished, failed and blocked work does.
export function attentionForChatEvent(event: ChatEvent): AttentionNotice | null {
  if (event.type === 'finish') return { title: 'Hoprel finished', body: clip(event.text.trim() || 'The task is complete.') };
  if (event.type === 'error') return { title: 'Hoprel needs attention', body: clip(event.message) };
  return null;
}

export function attentionForPermission(request: PermissionRequestPayload): AttentionNotice {
  return { title: 'Approval needed', body: clip(request.summary ?? `${request.tool}: ${request.pattern}`) };
}
