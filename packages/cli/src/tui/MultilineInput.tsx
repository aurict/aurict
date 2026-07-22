import React, { useState, useEffect, useRef, useLayoutEffect } from "react"
import { Box, Text, useInput, measureElement, type DOMElement } from "ink"
import { useTheme } from "../utils/theme.js"
import { useMouseEvents } from "./mouse.js"
import { measureAbsolutePosition } from "./event-system/measure-position.js"
import { writeClipboard } from "../util/clipboard.js"
import {
  MAX_DRAFT_CHARS,
  MAX_DRAFT_LINES,
  inputWasTruncated,
  limitInputInsertion,
  sanitizeInput,
  sanitizePaste,
} from "./input-limits.js"
import { extractRange, splitLines, wordLeft, wordRight, type LocalPoint } from "./multiline-input-model.js"
import { cursorLineParts, inputPointFromTerminal } from "./multiline-input-layout.js"
import { verticalCursorOffset } from "./terminal-text/cursor-map.js"
import {
  clampGraphemeBoundary,
  graphemeCount,
  nextGraphemeBoundary,
  previousGraphemeBoundary,
} from "./terminal-text/graphemes.js"
import { useInputUndo } from "./hooks/useInputUndo.js"

export { extractRange, type LocalPoint } from "./multiline-input-model.js"

interface Props {
  value:              string
  onChange:           (v: string) => void
  onSubmit:           (v: string) => void
  onQueue?:           ((v: string) => void) | undefined
  disabled:           boolean
  history:            string[]
  inlineSuggestionActive?: boolean
  onInputTruncated?:  (originalLen: number, truncatedLen: number) => void
  onCopied?:          (charCount: number) => void
  placeholder?:       string | undefined
}

export function MultilineInput({ value, onChange, onSubmit, onQueue, disabled, history, inlineSuggestionActive = false, onInputTruncated, onCopied, placeholder }: Props) {
  const theme = useTheme()

  const [lines, setLines]   = useState<string[]>(() => splitLines(sanitizePaste(value)))
  const [cursor, setCursor] = useState<{ row: number; col: number }>({ row: 0, col: 0 })
  const [hIdx, setHIdx]     = useState(-1)
  const draftRef            = useRef<string[]>([""])
  const linesRef            = useRef(lines)
  const cursorRef           = useRef(cursor)
  const boxRef              = useRef<DOMElement>(null)
  const boundsRef           = useRef({ row: 0, col: 0, width: 0, height: 0 })
  const dragStartRef        = useRef<LocalPoint | null>(null)
  const hasReportedLimitRef = useRef(false)

  // Keep refs in sync with state
  useEffect(() => { linesRef.current = lines }, [lines])
  useEffect(() => { cursorRef.current = cursor }, [cursor])
  const inputUndo = useInputUndo({ linesRef, cursorRef, setLines, setCursor })
  useEffect(() => {
    if (lines.join("\n").length < MAX_DRAFT_CHARS && lines.length < MAX_DRAFT_LINES) {
      hasReportedLimitRef.current = false
    }
  }, [lines])

  // Update the input box's absolute on-screen bounds after every render
  // — needed so click/release events (absolute terminal coordinates from
  // mouse.ts) can be converted to a local row/col.
  useLayoutEffect(() => {
    if (!boxRef.current) return
    const pos  = measureAbsolutePosition(boxRef.current)
    const size = measureElement(boxRef.current)
    boundsRef.current = { row: pos.row, col: pos.col, width: size.width, height: size.height }
  })

  useMouseEvents((e) => {
    if (disabled) return
    if (e.type === "click") {
      dragStartRef.current = inputPointFromTerminal(e.x, e.y, boundsRef.current, linesRef.current)
      return
    }
    if (e.type === "release") {
      const start = dragStartRef.current
      dragStartRef.current = null
      const end = inputPointFromTerminal(e.x, e.y, boundsRef.current, linesRef.current)
      if (!start || !end) return
      if (start.row === end.row && start.col === end.col) {
        // No drag — a plain click: position the cursor there.
        setCursor({ row: end.row, col: end.col })
        return
      }
      const text = extractRange(linesRef.current, start, end)
      if (text) {
        writeClipboard(text)
        onCopied?.(graphemeCount(text))
      }
    }
  })

  // lines → value
  useEffect(() => {
    onChange(lines.join("\n"))
  }, [lines]) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync when the external value changes (e.g. after clear)
  const prevValueRef = useRef(value)
  useEffect(() => {
    const joined = lines.join("\n")
    if (value !== joined && value !== prevValueRef.current) {
      const next = splitLines(sanitizePaste(value))
      setLines(next)
      const lastRow = Math.max(0, next.length - 1)
      setCursor({ row: lastRow, col: (next[lastRow] ?? "").length })
    }
    prevValueRef.current = value
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  // Paste operation: insert the sanitized text at the cursor
  function applyPaste(raw: string) {
    const cleaned = sanitizeInput(raw)
    const currentLines = linesRef.current
    const pasted = limitInputInsertion(
      sanitizePaste(raw),
      currentLines.join("\n").length,
      currentLines.length,
    )
    if (inputWasTruncated(raw, cleaned, pasted) && !hasReportedLimitRef.current) {
      hasReportedLimitRef.current = true
      onInputTruncated?.(raw.length, pasted.length)
    }
    if (!pasted) return
    const pastedLines = pasted.split("\n")
    const currentCursor = cursorRef.current
    const next = [...currentLines]
    const currentLine = next[currentCursor.row] ?? ""
    const currentCol = clampGraphemeBoundary(currentLine, currentCursor.col)
    const before = currentLine.slice(0, currentCol)
    const after = currentLine.slice(currentCol)
    next[currentCursor.row] = before + pastedLines[0]!
    const rest = pastedLines.slice(1)
    if (rest.length > 0) {
      rest[rest.length - 1] = rest[rest.length - 1]! + after
      next.splice(currentCursor.row + 1, 0, ...rest)
    } else {
      next[currentCursor.row] += after
    }
    linesRef.current = next
    setLines(next)
    const lastLine = pastedLines[pastedLines.length - 1]!
    const nextCursor = {
      row: currentCursor.row + pastedLines.length - 1,
      col: pastedLines.length === 1 ? currentCol + lastLine.length : lastLine.length,
    }
    cursorRef.current = nextCursor
    setCursor(nextCursor)
  }

  useInput((input, key) => {
    if (disabled) return

    if ((key.ctrl || key.meta) && input.toLowerCase() === "z") {
      if (key.shift || key.meta) inputUndo.redo()
      else inputUndo.undo()
      return
    }

    // Catch sequences here that slip past the emit-level filter.
    // When Ink consumes \x1b as an ESC keypress, the remaining "[<65;206;45M"
    // part arrives as a separate useInput event and gets written into the text.
    if (/^\[<\d+;\d+;\d+[Mm]/.test(input)) return  // SGR remainder (ESC consumed)
    if (/^\x1b\[<\d+;\d+;\d+[Mm]/.test(input)) return  // SGR full
    if (/^\[M[\s\S]/.test(input)) return  // X10 remainder

    // Some terminal emulators produce \x7f instead of backspace
    if (!key.backspace && !key.delete && input.includes("\x7f")) {
      inputUndo.checkpoint()
      const count = (input.match(/\x7f/g) ?? []).length
      for (let i = 0; i < count; i++) {
        setLines(prev => {
          const next = [...prev]
          const line = next[cursor.row] ?? ""
          if (cursor.col > 0) {
            const newCol = previousGraphemeBoundary(line, cursor.col)
            next[cursor.row] = line.slice(0, newCol) + line.slice(cursor.col)
            setCursor(c => ({ ...c, col: newCol }))
          } else if (cursor.row > 0) {
            const prevLine = next[cursor.row - 1] ?? ""
            next[cursor.row - 1] = prevLine + line
            next.splice(cursor.row, 1)
            setCursor({ row: cursor.row - 1, col: prevLine.length })
          }
          return next
        })
      }
      return
    }

    // A full paste event's marker + content can arrive together; marker-only
    // fragments are ignored, and events with content are applied as a paste.
    if (
      input.includes("\x1b[200~") || input.includes("\x1b[201~") ||
      input.includes("[200~") || input.includes("[201~")
    ) {
      inputUndo.checkpoint()
      applyPaste(input)
      return
    }
    if (input === "\x1b" || input === "\x1b[") {
      return
    }

    if (inlineSuggestionActive && (key.upArrow || key.downArrow || key.tab || key.return)) {
      return
    }

    if (key.tab && onQueue) {
      const text = lines.join("\n").trim()
      if (!text) return
      setLines([""])
      setCursor({ row: 0, col: 0 })
      setHIdx(-1)
      draftRef.current = [""]
      onQueue(text)
      return
    }

    // ── Kitty CSI u: Shift+Enter = \x1b[13;2u ────────────────────────────
    if (input === "\x1b[13;2u") {
      inputUndo.checkpoint()
      setLines(prev => {
        const next  = [...prev]
        const line  = next[cursor.row] ?? ""
        const col = clampGraphemeBoundary(line, cursor.col)
        next[cursor.row] = line.slice(0, col)
        next.splice(cursor.row + 1, 0, line.slice(col))
        return next
      })
      setCursor(c => ({ row: c.row + 1, col: 0 }))
      return
    }

    // ── Submit ────────────────────────────────────────────────────────────
    if (key.return && !key.shift && !key.ctrl && !key.meta) {
      const text = lines.join("\n").trim()
      if (!text) return
      setLines([""])
      setCursor({ row: 0, col: 0 })
      setHIdx(-1)
      draftRef.current = [""]
      onSubmit(text)
      return
    }

    // ── Shift+Enter / Ctrl+Enter: new line ──────────────────────────────
    if ((key.return && key.shift) || (key.return && key.ctrl)) {
      inputUndo.checkpoint()
      setLines(prev => {
        const next = [...prev]
        const line = next[cursor.row] ?? ""
        const col = clampGraphemeBoundary(line, cursor.col)
        next[cursor.row] = line.slice(0, col)
        next.splice(cursor.row + 1, 0, line.slice(col))
        return next
      })
      setCursor(c => ({ row: c.row + 1, col: 0 }))
      return
    }

    // ── Escape: collapse to a single line if multi-line ───────────────────
    if (key.escape) {
      if (lines.length > 1) {
        inputUndo.checkpoint()
        const joined = lines.join(" ")
        setLines([joined])
        setCursor({ row: 0, col: clampGraphemeBoundary(joined, cursor.col) })
      }
      return
    }

    // ── Up arrow ─────────────────────────────────────────────────────────
    if (key.upArrow) {
      if (cursor.row > 0) {
        setCursor(c => {
          const newRow = c.row - 1
          return { row: newRow, col: verticalCursorOffset(lines[c.row] ?? "", lines[newRow] ?? "", c.col) }
        })
        return
      }
      if (history.length === 0) return
      if (hIdx === -1) {
        draftRef.current = [...lines]
        const next = history.length - 1
        setHIdx(next)
        const ls = splitLines(history[next] ?? "")
        setLines(ls)
        setCursor({ row: ls.length - 1, col: (ls[ls.length - 1] ?? "").length })
      } else {
        const next = Math.max(0, hIdx - 1)
        setHIdx(next)
        const ls = splitLines(history[next] ?? "")
        setLines(ls)
        setCursor({ row: ls.length - 1, col: (ls[ls.length - 1] ?? "").length })
      }
      return
    }

    // ── Down arrow ──────────────────────────────────────────────────────────
    if (key.downArrow) {
      if (cursor.row < lines.length - 1) {
        setCursor(c => {
          const newRow = c.row + 1
          return { row: newRow, col: verticalCursorOffset(lines[c.row] ?? "", lines[newRow] ?? "", c.col) }
        })
        return
      }
      if (hIdx === -1) return
      const next = hIdx + 1
      if (next >= history.length) {
        setHIdx(-1)
        const draft = draftRef.current
        setLines(draft)
        setCursor({ row: draft.length - 1, col: (draft[draft.length - 1] ?? "").length })
      } else {
        setHIdx(next)
        const ls = splitLines(history[next] ?? "")
        setLines(ls)
        setCursor({ row: ls.length - 1, col: (ls[ls.length - 1] ?? "").length })
      }
      return
    }

    // ── Ctrl+Left / Alt+B: word left ─────────────────────────────────────
    // Depending on terminal: \x1b[1;5D (xterm), \x1b[5D (vt), \x1bb (emacs Alt+B)
    if (
      input === "\x1b[1;5D" || input === "\x1b[5D" || input === "\x1bb" ||
      input === "\x1b[1;3D" || (key.ctrl && key.leftArrow)
    ) {
      setCursor(c => {
        const line = lines[c.row] ?? ""
        const newCol = wordLeft(line, c.col)
        if (newCol === 0 && c.col === 0 && c.row > 0) {
          const prevRow = c.row - 1
          return { row: prevRow, col: (lines[prevRow] ?? "").length }
        }
        return { row: c.row, col: newCol }
      })
      return
    }

    // ── Ctrl+Right / Alt+F: word right ─────────────────────────────────────
    // Depending on terminal: \x1b[1;5C (xterm), \x1b[5C (vt), \x1bf (emacs Alt+F)
    if (
      input === "\x1b[1;5C" || input === "\x1b[5C" || input === "\x1bf" ||
      input === "\x1b[1;3C" || (key.ctrl && key.rightArrow)
    ) {
      setCursor(c => {
        const line = lines[c.row] ?? ""
        const newCol = wordRight(line, c.col)
        if (newCol === line.length && c.col === line.length && c.row < lines.length - 1) {
          return { row: c.row + 1, col: 0 }
        }
        return { row: c.row, col: newCol }
      })
      return
    }

    // ── Left arrow ────────────────────────────────────────────────────────────
    if (key.leftArrow) {
      setCursor(c => {
        if (c.col > 0) return { row: c.row, col: previousGraphemeBoundary(lines[c.row] ?? "", c.col) }
        if (c.row > 0) return { row: c.row - 1, col: (lines[c.row - 1] ?? "").length }
        return c
      })
      return
    }

    // ── Right arrow ────────────────────────────────────────────────────────────
    if (key.rightArrow) {
      setCursor(c => {
        const line = lines[c.row] ?? ""
        if (c.col < line.length) return { row: c.row, col: nextGraphemeBoundary(line, c.col) }
        if (c.row < lines.length - 1) return { row: c.row + 1, col: 0 }
        return c
      })
      return
    }

    // ── Ctrl+Backspace / Ctrl+W / Alt+Backspace: delete word ──────────────
    // Ink normalizes Ctrl/Alt+Backspace differently across terminal families;
    // keep both parsed-key and defensive raw-sequence variants.
    if (
      (key.backspace && key.ctrl) || (key.delete && key.meta) || (key.ctrl && input === "w") ||
      input === "\x17" || input === "\x1b\x7f" || input === "\x08" || input === "\x1b[127;5u"
    ) {
      inputUndo.checkpoint()
      const row = cursor.row
      const col = cursor.col
      setLines(prev => {
        const next  = [...prev]
        const line  = next[row] ?? ""
        const newCol = wordLeft(line, col)
        next[row] = line.slice(0, newCol) + line.slice(col)
        setCursor({ row, col: newCol })
        return next
      })
      return
    }

    // ── Backspace ─────────────────────────────────────────────────────────
    if (key.backspace || key.delete) {
      inputUndo.checkpoint()
      // Read the cursor beforehand — avoid async state inside setLines
      const row = cursor.row
      const col = cursor.col
      setLines(prev => {
        const next = [...prev]
        const line = next[row] ?? ""
        if (col > 0) {
          const newCol = previousGraphemeBoundary(line, col)
          next[row] = line.slice(0, newCol) + line.slice(col)
          setCursor({ row, col: newCol })
        } else if (row > 0) {
          const prevLine = next[row - 1] ?? ""
          next[row - 1] = prevLine + line
          next.splice(row, 1)
          setCursor({ row: row - 1, col: prevLine.length })
        }
        return next
      })
      return
    }

    // ── Printable character / non-bracketed paste ──────────────────────────
    if (input && !key.ctrl && !key.meta) {
      const clean = sanitizeInput(input)
      if (!clean) return
      inputUndo.checkpoint()

      // SSH coalesced Enter: arrives as "text\r" — the trailing \r means Enter
      // e.g. on slow SSH, "o" + Enter arrives combined as "o\r"
      if (clean.length > 1 && clean.endsWith("\n") && !clean.slice(0, -1).includes("\n")) {
        const textPart = clean.slice(0, -1)
        const currentLines = [...linesRef.current]
        const line = currentLines[cursor.row] ?? ""
        const col = clampGraphemeBoundary(line, cursor.col)
        currentLines[cursor.row] = line.slice(0, col) + textPart + line.slice(col)
        const text = currentLines.join("\n").trim()
        if (text) {
          setLines([""])
          setCursor({ row: 0, col: 0 })
          onSubmit(text)
        }
        return
      }

      // Route every printable event through the same cap. Some terminals and
      // SSH sessions deliver a non-bracketed paste as one long plain event.
      applyPaste(input)
    }
  }, { isActive: !disabled })

  return (
    <Box ref={boxRef} flexDirection="column" flexGrow={1} flexShrink={1}>
      {lines.map((line, i) => {
        // Show line numbers in a multi-line input
        const showLineNum = lines.length > 1
        const lineNumWidth = String(lines.length).length
        const lineNum = showLineNum ? String(i + 1).padStart(lineNumWidth, " ") : ""

        if (i !== cursor.row || disabled) {
          return (
            <Box key={i} flexDirection="row">
              {showLineNum && (
                <Text color={theme.textDim} dimColor>{lineNum} │ </Text>
              )}
              <Text wrap="wrap">{line || " "}</Text>
            </Box>
          )
        }
        // Cursor line
        // Note: nested <Text> inside <Text wrap="wrap"> creates a separate Yoga node,
        // breaking inline flow and causing stacked rendering after history navigation.
        // Instead, use three sibling <Text> components in a flexDirection="row" Box.
        const { before, at, after } = cursorLineParts(line, cursor.col)
        return (
          <Box key={i} flexDirection="row">
            {showLineNum && (
              <Text color={theme.accent} dimColor>{lineNum} │ </Text>
            )}
            <Text>{before}</Text>
            <Text backgroundColor={theme.accent} color={theme.accentInk ?? theme.bgHighlight}>{at}</Text>
            {after ? <Text>{after}</Text> : !line && placeholder ? <Text color={theme.textDim} dimColor>{placeholder}</Text> : null}
          </Box>
        )
      })}
    </Box>
  )
}
