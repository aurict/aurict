/**
 * Large pastes stay out of the composer: the draft shows one compact token
 * (`[Pasted text #1 · 240 lines]`) and the full text is restored on submit.
 * A token the user edited no longer matches and is sent as typed.
 */
export const LARGE_PASTE_LINES = 6
export const LARGE_PASTE_CHARS = 1000

export function isLargePaste(text: string): boolean {
  if (text.length > LARGE_PASTE_CHARS) return true
  let lines = 1
  for (const char of text) if (char === "\n" && ++lines >= LARGE_PASTE_LINES) return true
  return false
}

export function pastePlaceholder(id: number, text: string): string {
  const lines = text.split("\n").length
  const size = lines > 1 ? `${lines} lines` : `${text.length.toLocaleString("en-US")} chars`
  return `[Pasted text #${id} · ${size}]`
}

export function expandPastePlaceholders(text: string, pastes: ReadonlyMap<string, string>): string {
  let expanded = text
  for (const [placeholder, content] of pastes) expanded = expanded.split(placeholder).join(content)
  return expanded
}
