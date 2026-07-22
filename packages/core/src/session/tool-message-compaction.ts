import type { CoreMessage } from "ai"

/**
 * Replaces the payload of every result part without breaking the tool-call ID
 * pairing required by strict providers such as Anthropic.
 */
export function clearToolMessageResults(
  message: Extract<CoreMessage, { role: "tool" }>,
  placeholder: string,
): Extract<CoreMessage, { role: "tool" }> {
  return {
    ...message,
    content: message.content.map((part) => {
      const { experimental_content: _discardedContent, ...rest } = part
      return { ...rest, result: placeholder }
    }),
  }
}
