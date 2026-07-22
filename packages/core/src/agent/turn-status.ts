import type { CoreMessage } from "ai"

export type TurnStatusState = "done" | "continuing" | "blocked"

export interface TurnStatus {
  state: TurnStatusState
  reason: string
}

const OPEN = /<aurict_status\s+state=["'](done|continuing|blocked)["']\s*>/i
const CLOSE = /<\/aurict_status\s*>/i
const MAX_BOUNDARY = 64

export function extractTurnStatus(text: string): { text: string; status?: TurnStatus } {
  const open = OPEN.exec(text)
  if (!open?.[1]) return { text }
  const remainder = text.slice(open.index + open[0].length)
  const close = CLOSE.exec(remainder)
  if (!close) return { text: text.slice(0, open.index).trimEnd() }
  const suffix = remainder.slice(close.index + close[0].length)
  return {
    text: `${text.slice(0, open.index)}${suffix}`.trimEnd(),
    status: { state: open[1].toLowerCase() as TurnStatusState, reason: remainder.slice(0, close.index).trim().slice(0, 500) },
  }
}

export function stripTurnStatusFromMessages(messages: CoreMessage[]): CoreMessage[] {
  return messages.map(message => {
    if (message.role !== "assistant") return message
    if (typeof message.content === "string") return { ...message, content: extractTurnStatus(message.content).text }
    return {
      ...message,
      content: message.content.map(part => part.type === "text"
        ? { ...part, text: extractTurnStatus(part.text).text }
        : part),
    }
  })
}

export function createTurnStatusFilter(): {
  feed(delta: string): string
  flush(): string
  status(): TurnStatus | undefined
} {
  let buffer = ""
  let captured: TurnStatus | undefined
  let inside = false
  let state: TurnStatusState | undefined

  const feed = (delta: string): string => {
    let visible = ""
    buffer += delta
    while (buffer) {
      if (inside) {
        const close = CLOSE.exec(buffer)
        if (!close) return visible
        captured = { state: state!, reason: buffer.slice(0, close.index).trim().slice(0, 500) }
        buffer = buffer.slice(close.index + close[0].length)
        inside = false
        state = undefined
        continue
      }
      const open = OPEN.exec(buffer)
      if (open?.[1]) {
        visible += buffer.slice(0, open.index)
        buffer = buffer.slice(open.index + open[0].length)
        state = open[1].toLowerCase() as TurnStatusState
        inside = true
        continue
      }
      const boundary = buffer.lastIndexOf("<")
      if (boundary >= 0 && buffer.length - boundary <= MAX_BOUNDARY) {
        visible += buffer.slice(0, boundary)
        buffer = buffer.slice(boundary)
      } else {
        visible += buffer
        buffer = ""
      }
      return visible
    }
    return visible
  }

  const flush = (): string => {
    const visible = inside || buffer.startsWith("<aurict_status") ? "" : buffer
    buffer = ""
    inside = false
    state = undefined
    return visible
  }

  return { feed, flush, status: () => captured }
}
