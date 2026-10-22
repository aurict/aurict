import type { UserType } from '../../shared/ipc-types.js';
import type { ConversationCopy } from '../components/Conversation.js';

export const CONVERSATION_COPY: Record<UserType, ConversationCopy> = {
  general: {
    headline: 'What should we work on?',
    detail: 'Explore an idea, plan a task, or research a question. Hoprel adapts as the work gets specific.',
    placeholder: 'Ask Hoprel anything',
    prompts: [
      { title: 'Explore an idea', prompt: 'Help me explore this idea: ' },
      { title: 'Plan something', prompt: 'Help me plan: ' },
      { title: 'Understand a topic', prompt: 'Explain this topic clearly: ' },
    ],
  },
  developer: {
    headline: 'What should we build?',
    detail: 'Fix, refactor, review, or explain code in this workspace. Every change goes through your approval.',
    placeholder: 'Ask Hoprel to build, review, or explain',
    prompts: [
      { title: 'Plan a change', prompt: 'Plan this code change: ' },
      { title: 'Diagnose a bug', prompt: 'Help me diagnose: ' },
      { title: 'Explain a system', prompt: 'Explain this codebase area: ' },
    ],
  },
  product: {
    headline: 'What should we decide?',
    detail: 'Start from the customer problem, make trade-offs explicit, then turn the result into a brief.',
    placeholder: 'Describe the customer, decision, or outcome',
    prompts: [
      { title: 'Shape a feature', prompt: 'Help me shape this product feature. Start with the user problem, constraints, alternatives, success signals, and open questions: ' },
      { title: 'Make a decision', prompt: 'Help me make this product decision. Compare the options, trade-offs, risks, and a recommended next step: ' },
      { title: 'Write a brief', prompt: 'Create a concise product brief with problem, audience, scope, non-goals, acceptance criteria, and open questions: ' },
    ],
  },
  operator: {
    headline: 'What should run smoother?',
    detail: 'Turn a process, document, or business question into a routine with clear owners and next actions.',
    placeholder: 'Describe the process, report, or routine',
    prompts: [
      { title: 'Improve a routine', prompt: 'Improve this recurring workflow. Identify inputs, owners, bottlenecks, controls, and a practical new routine: ' },
      { title: 'Prepare a document', prompt: 'Help me prepare this operational document. Clarify its audience, purpose, required facts, structure, and review checklist: ' },
      { title: 'Analyze a process', prompt: 'Analyze this business process. Summarize the current state, failure points, risks, metrics, and prioritized improvements: ' },
    ],
  },
};
