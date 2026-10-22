import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react"
import { measureElement, useCursor, type DOMElement } from "../design-system/renderer.js"
import { measureAbsolutePosition } from "../event-system/measure-position.js"
import { wrapLine } from "../event-system/wrap-line.js"
import { displayWidth } from "../terminal-text/display-width.js"

interface Options {
  boxRef: RefObject<DOMElement | null>
  lines: string[]
  cursor: { row: number; col: number }
  active: boolean
}

type Position = { x: number; y: number }

/** Ink's root node keeps layout listeners here (what `useBoxMetrics` subscribes through). */
type InkRoot = DOMElement & { internal_layoutListeners?: Set<() => void> }

/**
 * Places the real terminal cursor at the composer caret, as Codex does,
 * instead of painting a block. Terminals then draw their own cursor and IME
 * composition appears at the right cell. Rows above the caret are counted
 * with the same wrapping Ink uses for `<Text wrap="wrap">`.
 *
 * Ink hands the cursor to the terminal in an insertion effect, which runs
 * before layout is known, so the position has to be ready at render time:
 * it is measured after each layout and kept in state, and a change re-renders
 * this component so the frame that shows it carries the new position.
 * Layout changes elsewhere (a status row appearing, the footer changing) move
 * the composer without re-rendering it, so every root layout pass re-measures.
 */
export function useTerminalCursor({ boxRef, lines, cursor, active }: Options): void {
  const { setCursorPosition } = useCursor()
  const [position, setPosition] = useState<Position>()
  setCursorPosition(active ? position : undefined)

  const measure = useRef(() => {})
  measure.current = () => {
    const node = boxRef.current
    if (!active || !node) return
    const origin = measureAbsolutePosition(node)
    const width = Math.max(1, measureElement(node).width)
    let row = 0
    for (let index = 0; index < cursor.row; index++) row += Math.max(1, wrapLine(lines[index] ?? "", width).length)
    const before = wrapLine((lines[cursor.row] ?? "").slice(0, cursor.col), width)
    let x = displayWidth(before[before.length - 1] ?? "")
    row += before.length - 1
    // A caret exactly at the right edge sits at the start of the next row.
    if (x >= width) { row += 1; x = 0 }
    const next = { x: origin.col + x, y: origin.row + row }
    setPosition((previous) => previous?.x === next.x && previous.y === next.y ? previous : next)
  }

  useLayoutEffect(() => measure.current())

  useEffect(() => {
    let root = boxRef.current as InkRoot | null
    while (root?.parentNode) root = root.parentNode as InkRoot
    if (!root || root.nodeName !== "ink-root") return
    const listeners = (root.internal_layoutListeners ??= new Set())
    // Refs attach after the layout notification in the same commit, so measure on the next microtask.
    const listener = () => queueMicrotask(() => measure.current())
    listeners.add(listener)
    return () => { listeners.delete(listener) }
  }, [boxRef])
}
