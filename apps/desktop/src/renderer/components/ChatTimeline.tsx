import type { ReactNode } from 'react';
import type { ChatActivity } from '../hooks/useChat.js';
import { useChatAutoScroll } from '../hooks/useChatAutoScroll.js';
import type { DisplayMessage } from '../types.js';
import { ChatTranscript } from './ChatTranscript.js';
import { Icon } from './Icons.js';
import { TaskActivity } from './TaskActivity.js';

interface Props {
  sessionId?: string | null;
  messages: DisplayMessage[];
  activities: ChatActivity[];
  pending: boolean;
  onRetry: () => boolean;
  header?: ReactNode;
}

export function ChatTimeline({ sessionId = null, messages, activities, pending, onRetry, header }: Props) {
  const chatScroll = useChatAutoScroll({ sessionId, messages, activities, pending });

  return <div className="aur-timeline">
    <div ref={chatScroll.viewportRef} onScroll={chatScroll.onScroll} className="aur-timeline-scroll">
      <div className="aur-timeline-content">
        {header}
        <ChatTranscript messages={messages} onRetry={onRetry} />
        <TaskActivity activities={activities} pending={pending} />
      </div>
    </div>
    {chatScroll.showJumpToLatest && (
      <button type="button" className="aur-jump-latest" onClick={chatScroll.scrollToLatest}><Icon name="chevronDown" size={14} />Latest</button>
    )}
  </div>;
}
