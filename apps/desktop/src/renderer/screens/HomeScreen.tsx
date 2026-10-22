import React from 'react';
import type { UserType } from '../../shared/ipc-types.js';
import { Conversation } from '../components/Conversation.js';
import { CONVERSATION_COPY } from '../experience/copy.js';

type ConversationProps = Omit<React.ComponentProps<typeof Conversation>, 'copy'>;

// The chat-first starting surface for every layout except the code workspace;
// product and operations differ only in their copy and suggestions.
export function HomeScreen({ userType, ...props }: ConversationProps & { userType: UserType }) {
  return <main className="aur-screen"><Conversation copy={CONVERSATION_COPY[userType]} {...props} /></main>;
}
