import type { CoreMessage } from "ai"
import { extractFilePaths, extractText } from "./context-compactor.js"

export interface ErrorChain {
  error: string
  fix: string
  files: string[]
  lesson: string
}

export function extractErrorChains(messages: CoreMessage[]): ErrorChain[] {
  const chains: ErrorChain[] = []
  let currentError: string | null = null
  let errorFiles: string[] = []
  let errorMsgStart = -1

  for (let index = 0; index < messages.length; index++) {
    const message = messages[index]!
    const text = extractText(message)
    if (message.role === "tool" && /error|failed|exception|cannot find|unable to/i.test(text)) {
      currentError = text.slice(0, 500)
      errorFiles = extractFilePaths(text)
      errorMsgStart = index
    }

    if (
      currentError
      && message.role === "assistant"
      && index > errorMsgStart
      && /fixed the|fixed by|resolved the|solved the|now works|corrected the/i.test(text)
    ) {
      chains.push({
        error: currentError,
        fix: text.slice(0, 500),
        files: errorFiles,
        lesson: `Error "${currentError.slice(0, 100)}..." was fixed by: ${text.slice(0, 200)}`,
      })
      currentError = null
      errorFiles = []
      errorMsgStart = -1
    }
  }

  return chains
}

export function addProtectedErrors(summary: string, chains: ErrorChain[]): string {
  if (chains.length === 0) return summary
  return summary + [
    "\n\n[PROTECTED ERROR CHAINS — DO NOT FORGET]",
    ...chains.slice(0, 5).map((chain, index) => `${index + 1}. ${chain.lesson}`),
  ].join("\n")
}
