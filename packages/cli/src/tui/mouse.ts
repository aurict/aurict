/**
 * Mouse desteği — xterm escape sequence parser
 *
 * Terminal mouse raporlamasını etkinleştirir ve temel click/scroll event'lerini
 * parse eder. Ink'in useInput'u ile çakışmamak için raw stdin stream'ine
 * doğrudan listener eklenir.
 *
 * Desteklenen protokoller:
 *   - X10 (\x1b[M<b><x><y>)
 *   - SGR (\x1b[<n;n;nM ve \x1b[<n;n;nm)
 */

import { useEffect } from "react"

export type MouseButton = "left" | "right" | "middle" | "scroll-up" | "scroll-down"

export interface MouseEvent {
  type:   "click" | "release" | "scroll"
  button: MouseButton
  x:      number   // 1-based terminal column
  y:      number   // 1-based terminal row
}

type MouseHandler = (e: MouseEvent) => void

const handlers = new Set<MouseHandler>()
let enabled = false

function enableMouseTracking(): () => void {
  if (enabled) return () => {}
  enabled = true
  // SGR extended mouse protocol (1006) — daha geniş terminal desteği
  process.stdout.write("\x1b[?1000h")  // normal button events
  process.stdout.write("\x1b[?1006h")  // SGR mode

  const onData = (raw: Buffer | string) => {
    const str = typeof raw === "string" ? raw : raw.toString("binary")
    parseMouseEvents(str)
  }

  process.stdin.on("data", onData)

  return () => {
    process.stdout.write("\x1b[?1006l")
    process.stdout.write("\x1b[?1000l")
    process.stdin.off("data", onData)
    enabled = false
  }
}

function parseMouseEvents(input: string): void {
  if (handlers.size === 0) return

  // SGR format: \x1b[<Pb;Px;PyM (press) or \x1b[<Pb;Px;Pym (release)
  const sgrRe = /\x1b\[<(\d+);(\d+);(\d+)([Mm])/g
  let m: RegExpExecArray | null
  while ((m = sgrRe.exec(input)) !== null) {
    const [, b, x, y, type] = m
    const button  = parseInt(b!, 10)
    const col     = parseInt(x!, 10)
    const row     = parseInt(y!, 10)
    const release = type === "m"
    const evt     = decodeSGRButton(button, col, row, release)
    if (evt) dispatch(evt)
  }

  // X10 format: \x1b[M<b><x><y>
  let i = 0
  while (i < input.length) {
    const esc = input.indexOf("\x1b[M", i)
    if (esc === -1 || esc + 5 > input.length) break
    const b = input.charCodeAt(esc + 3) - 32
    const x = input.charCodeAt(esc + 4) - 32
    const y = input.charCodeAt(esc + 5) - 32
    const evt = decodeX10Button(b, x, y)
    if (evt) dispatch(evt)
    i = esc + 6
  }
}

function decodeSGRButton(b: number, x: number, y: number, release: boolean): MouseEvent | null {
  const scrollBit = (b & 64) !== 0
  const btn       = b & 3
  if (scrollBit) {
    return { type: "scroll", button: btn === 0 ? "scroll-up" : "scroll-down", x, y }
  }
  const button: MouseButton = btn === 0 ? "left" : btn === 1 ? "middle" : "right"
  return { type: release ? "release" : "click", button, x, y }
}

function decodeX10Button(b: number, x: number, y: number): MouseEvent | null {
  if (b < 0 || x < 1 || y < 1) return null
  const scrollBit = (b & 64) !== 0
  const btn       = b & 3
  if (scrollBit) {
    return { type: "scroll", button: btn === 0 ? "scroll-up" : "scroll-down", x, y }
  }
  if (btn === 3) return { type: "release", button: "left", x, y }
  const button: MouseButton = btn === 0 ? "left" : btn === 1 ? "middle" : "right"
  return { type: "click", button, x, y }
}

function dispatch(evt: MouseEvent): void {
  for (const h of handlers) h(evt)
}

// ── React hook ────────────────────────────────────────────────────────────────

let cleanupFn: (() => void) | null = null

export function useMouseEvents(handler: MouseHandler): void {
  useEffect(() => {
    if (handlers.size === 0) {
      cleanupFn = enableMouseTracking()
    }
    handlers.add(handler)

    return () => {
      handlers.delete(handler)
      if (handlers.size === 0 && cleanupFn) {
        cleanupFn()
        cleanupFn = null
      }
    }
  }, [handler])
}

export function useMouseClick(
  button: MouseButton | MouseButton[],
  handler: (e: MouseEvent) => void,
): void {
  const buttons = Array.isArray(button) ? button : [button]
  useMouseEvents((e) => {
    if (e.type === "click" && buttons.includes(e.button)) handler(e)
  })
}
