import type { CoreMessage } from "ai"
import { extractFilePaths, extractText } from "./context-compactor.js"

export const PROTECTED_FACTS_MARKER = "[Protected context facts]"

export interface ProtectedContextFacts {
  files: string[]
  errors: string[]
  verification: string[]
  decisions: string[]
  nextSteps: string[]
}

export function extractProtectedContextFacts(messages: CoreMessage[]): ProtectedContextFacts {
  const files = new Set<string>()
  const errors: string[] = []
  const verification: string[] = []
  const decisions: string[] = []
  const nextSteps: string[] = []

  for (const message of messages) {
    const text = extractText(message)
    for (const file of extractFilePaths(text)) files.add(file)
    collect(text, /\b(error|failed|exception|cannot find|typeerror|syntaxerror|enoent)\b/i, errors, 6)
    collect(text, /\b(tsc|typecheck|test|lint|playwright|vitest|bun test|passed|failed|✓|0 fail)\b/i, verification, 8)
    collect(text, /\b(decided|decision|chose|selected|we will|we'll|karar|seçtik|uygulayacağız)\b/i, decisions, 6)
    collect(text, /\b(next step|remaining|todo|still need|not verified|kalan|sıradaki|henüz|devam)\b/i, nextSteps, 6)
  }
  return { files: [...files].slice(0, 12), errors, verification, decisions, nextSteps }
}

export function formatProtectedContextFacts(facts: ProtectedContextFacts): string {
  const sections = [
    facts.files.length ? `FILES:\n${facts.files.map(item => `- ${item}`).join("\n")}` : "",
    facts.verification.length ? `VERIFICATION:\n${facts.verification.map(item => `- ${item}`).join("\n")}` : "",
    facts.errors.length ? `ERRORS:\n${facts.errors.map(item => `- ${item}`).join("\n")}` : "",
    facts.decisions.length ? `DECISIONS:\n${facts.decisions.map(item => `- ${item}`).join("\n")}` : "",
    facts.nextSteps.length ? `NEXT_STEPS:\n${facts.nextSteps.map(item => `- ${item}`).join("\n")}` : "",
  ].filter(Boolean)
  return sections.length ? `${PROTECTED_FACTS_MARKER}\n${sections.join("\n\n")}` : ""
}

export function injectProtectedFacts(messages: CoreMessage[], protectedFacts: string): CoreMessage[] {
  if (messages.some(message => extractText(message).includes(PROTECTED_FACTS_MARKER))) return messages
  const firstNonSystem = messages.findIndex(message => message.role !== "system")
  const insertAt = firstNonSystem === -1 ? messages.length : firstNonSystem
  return [
    ...messages.slice(0, insertAt),
    { role: "user", content: PROTECTED_FACTS_MARKER },
    { role: "assistant", content: protectedFacts },
    ...messages.slice(insertAt),
  ]
}

function collect(text: string, pattern: RegExp, target: string[], limit: number): void {
  for (const rawLine of text.split(/\r?\n/)) {
    if (target.length >= limit) return
    const line = rawLine.trim()
    if (line.length < 8 || !pattern.test(line)) continue
    const compact = line.replace(/\s+/g, " ").slice(0, 220)
    if (!target.includes(compact)) target.push(compact)
  }
}
