import React, { useState, useEffect, useRef } from "react"
import { Box, Text, useInput } from "ink"
import { stripVTControlCharacters } from "node:util"
import { useTheme } from "../utils/theme.js"

// Güvenli paste boyutu: çok büyük paste'ler terminal'i kilitler
const MAX_PASTE_CHARS = 50_000

interface Props {
  value:              string
  onChange:           (v: string) => void
  onSubmit:           (v: string) => void
  disabled:           boolean
  history:            string[]
  onPasteTruncated?:  (originalLen: number, truncatedLen: number) => void
  onPasteStart?:      () => void
  onPasteEnd?:        () => void
}

function splitLines(v: string): string[] {
  const ls = v.split("\n")
  return ls.length > 0 ? ls : [""]
}

function wordLeft(line: string, col: number): number {
  let i = col
  while (i > 0 && /\s/.test(line[i - 1]!)) i--
  while (i > 0 && /\S/.test(line[i - 1]!)) i--
  return i
}

function wordRight(line: string, col: number): number {
  const len = line.length
  let i = col
  while (i < len && /\S/.test(line[i]!)) i++
  while (i < len && /\s/.test(line[i]!)) i++
  return i
}

// Paste metni için: ANSI strip + \r normalizasyon + boyut sınırı + bracketed paste cleanup
function sanitizePaste(raw: string): string {
  return stripVTControlCharacters(raw)
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\x1b\[200~/g, "")  // Bracketed paste start
    .replace(/\x1b\[201~/g, "")  // Bracketed paste end
    .replace(/\[200~/g, "")      // ESC'siz variant
    .replace(/\[201~/g, "")      // ESC'siz variant
    .slice(0, MAX_PASTE_CHARS)
}

// Normal input için: VT kaçış kodlarını sil, \r → \n dönüştür, bracketed paste cleanup
function sanitizeInput(raw: string): string {
  return stripVTControlCharacters(raw)
    .replace(/\r/g, "\n")
    .replace(/\x1b\[200~/g, "")
    .replace(/\x1b\[201~/g, "")
    .replace(/\[200~/g, "")
    .replace(/\[201~/g, "")
}

export function MultilineInput({ value, onChange, onSubmit, disabled, history, onPasteTruncated, onPasteStart, onPasteEnd }: Props) {
  const theme = useTheme()

  const [lines, setLines]   = useState<string[]>(() => splitLines(value))
  const [cursor, setCursor] = useState<{ row: number; col: number }>({ row: 0, col: 0 })
  const [hIdx, setHIdx]     = useState(-1)
  const draftRef            = useRef<string[]>([""])
  const isPastingRef        = useRef(false)
  const pasteBufferRef      = useRef("")
  const linesRef            = useRef(lines)
  const cursorRef           = useRef(cursor)
  
  // Keep refs in sync with state
  useEffect(() => { linesRef.current = lines }, [lines])
  useEffect(() => { cursorRef.current = cursor }, [cursor])

  // lines → value
  useEffect(() => {
    onChange(lines.join("\n"))
  }, [lines]) // eslint-disable-line react-hooks/exhaustive-deps

  // Dış value değişince (clear sonrası vb.) sync et
  const prevValueRef = useRef(value)
  useEffect(() => {
    const joined = lines.join("\n")
    if (value !== joined && value !== prevValueRef.current) {
      const next = splitLines(value)
      setLines(next)
      setCursor({ row: 0, col: 0 })
    }
    prevValueRef.current = value
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  // Paste işlemi: sanitize edilmiş metni imlece ekle
  function applyPaste(raw: string) {
    const normalized  = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
    const pasted      = sanitizePaste(raw)
    if (!pasted) return
    if (normalized.length > MAX_PASTE_CHARS) {
      onPasteTruncated?.(raw.length, pasted.length)
    }
    const pastedLines = pasted.split("\n")
    setLines(prev => {
      const next   = [...prev]
      const before = (next[cursor.row] ?? "").slice(0, cursor.col)
      const after  = (next[cursor.row] ?? "").slice(cursor.col)
      next[cursor.row] = before + pastedLines[0]!
      const rest = pastedLines.slice(1)
      if (rest.length > 0) {
        rest[rest.length - 1] = rest[rest.length - 1]! + after
        next.splice(cursor.row + 1, 0, ...rest)
      } else {
        next[cursor.row] += after
      }
      return next
    })
    const lastLine = pastedLines[pastedLines.length - 1]!
    setCursor(c => ({
      row: c.row + pastedLines.length - 1,
      col: pastedLines.length === 1 ? c.col + lastLine.length : lastLine.length,
    }))
  }

  useInput((input, key) => {
    if (disabled) return

    // ── SSH/tmux DEL karakteri (\x7f) ─────────────────────────────────────
    // Bazı terminal emülatörleri backspace yerine \x7f üretir
    if (!key.backspace && !key.delete && input.includes("\x7f")) {
      const count = (input.match(/\x7f/g) ?? []).length
      for (let i = 0; i < count; i++) {
        setLines(prev => {
          const next = [...prev]
          const line = next[cursor.row] ?? ""
          if (cursor.col > 0) {
            next[cursor.row] = line.slice(0, cursor.col - 1) + line.slice(cursor.col)
            setCursor(c => ({ ...c, col: Math.max(0, c.col - 1) }))
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

    // ── Bracketed paste sequence fragment'lerini ignore et ─────────────
    // Sanitize fonksiyonları bu karakterleri temizler, burada sadece ignore et
    if (
      input.includes("[200~") || input.includes("[201~") ||
      input === "\x1b" || input === "\x1b["
    ) {
      return
    }

    // ── Kitty CSI u: Shift+Enter = \x1b[13;2u ────────────────────────────
    if (input === "\x1b[13;2u") {
      setLines(prev => {
        const next  = [...prev]
        const line  = next[cursor.row] ?? ""
        next[cursor.row] = line.slice(0, cursor.col)
        next.splice(cursor.row + 1, 0, line.slice(cursor.col))
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

    // ── Shift+Enter / Ctrl+Enter: yeni satır ──────────────────────────────
    if ((key.return && key.shift) || (key.return && key.ctrl)) {
      setLines(prev => {
        const next = [...prev]
        const line = next[cursor.row] ?? ""
        next[cursor.row] = line.slice(0, cursor.col)
        next.splice(cursor.row + 1, 0, line.slice(cursor.col))
        return next
      })
      setCursor(c => ({ row: c.row + 1, col: 0 }))
      return
    }

    // ── Escape: çok satırlıysa tek satıra dönüştür ───────────────────────
    if (key.escape) {
      if (lines.length > 1) {
        const joined = lines.join(" ")
        setLines([joined])
        setCursor({ row: 0, col: Math.min(cursor.col, joined.length) })
      }
      return
    }

    // ── Yukarı ok ─────────────────────────────────────────────────────────
    if (key.upArrow) {
      if (cursor.row > 0) {
        setCursor(c => {
          const newRow = c.row - 1
          return { row: newRow, col: Math.min(c.col, (lines[newRow] ?? "").length) }
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

    // ── Aşağı ok ──────────────────────────────────────────────────────────
    if (key.downArrow) {
      if (cursor.row < lines.length - 1) {
        setCursor(c => {
          const newRow = c.row + 1
          return { row: newRow, col: Math.min(c.col, (lines[newRow] ?? "").length) }
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

    // ── Ctrl+Sol / Alt+B: kelime sola ─────────────────────────────────────
    // Terminale göre: \x1b[1;5D (xterm), \x1b[5D (vt), \x1bb (emacs Alt+B)
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

    // ── Ctrl+Sağ / Alt+F: kelime sağa ─────────────────────────────────────
    // Terminale göre: \x1b[1;5C (xterm), \x1b[5C (vt), \x1bf (emacs Alt+F)
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

    // ── Sol ok ────────────────────────────────────────────────────────────
    if (key.leftArrow) {
      setCursor(c => {
        if (c.col > 0) return { row: c.row, col: c.col - 1 }
        if (c.row > 0) return { row: c.row - 1, col: (lines[c.row - 1] ?? "").length }
        return c
      })
      return
    }

    // ── Sağ ok ────────────────────────────────────────────────────────────
    if (key.rightArrow) {
      setCursor(c => {
        const lineLen = (lines[c.row] ?? "").length
        if (c.col < lineLen) return { row: c.row, col: c.col + 1 }
        if (c.row < lines.length - 1) return { row: c.row + 1, col: 0 }
        return c
      })
      return
    }

    // ── Ctrl+Backspace / Ctrl+W: kelime sil ──────────────────────────────
    // \x17 = Ctrl+W (Unix), \x1b\x7f = Ctrl+Backspace (bazı terminaller)
    if ((key.backspace && key.ctrl) || input === "\x17" || input === "\x1b\x7f") {
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
      // Cursor'u önceden oku — setLines içinde async state olmasın
      const row = cursor.row
      const col = cursor.col
      setLines(prev => {
        const next = [...prev]
        const line = next[row] ?? ""
        if (col > 0) {
          next[row] = line.slice(0, col - 1) + line.slice(col)
          setCursor({ row, col: col - 1 })
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

    // ── Printable karakter / non-bracketed paste ──────────────────────────
    if (input && !key.ctrl && !key.meta) {
      const clean = sanitizeInput(input)
      if (!clean) return

      // SSH coalesced Enter: "text\r" formatında gelir — son \r Enter anlamına gelir
      // Örn: yavaş SSH'da "o" + Enter → "o\r" olarak birleşik gelir
      if (clean.length > 1 && clean.endsWith("\n") && !clean.slice(0, -1).includes("\n")) {
        const textPart = clean.slice(0, -1)
        const currentLines = [...linesRef.current]
        const line = currentLines[cursor.row] ?? ""
        currentLines[cursor.row] = line.slice(0, cursor.col) + textPart + line.slice(cursor.col)
        const text = currentLines.join("\n").trim()
        if (text) {
          setLines([""])
          setCursor({ row: 0, col: 0 })
          onSubmit(text)
        }
        return
      }

      // Non-bracketed paste: \n veya \r içeriyorsa paste olarak işle
      // (bracketed paste desteklemeyen terminal/SSH için)
      if (clean.includes("\n")) {
        applyPaste(clean)
        return
      }

      // Normal tek/çok karakter ekleme
      setLines(prev => {
        const next = [...prev]
        const line = next[cursor.row] ?? ""
        next[cursor.row] = line.slice(0, cursor.col) + clean + line.slice(cursor.col)
        return next
      })
      setCursor(c => ({ ...c, col: c.col + clean.length }))
    }
  }, { isActive: !disabled })

  return (
    <Box flexDirection="column" flexGrow={1} flexShrink={1}>
      {lines.map((line, i) => {
        // Çok satırlı input'ta satır numarası göster
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
        // İmleç satırı
        const safeCol = Math.min(cursor.col, line.length)
        const before  = line.slice(0, safeCol)
        const at      = line[safeCol] ?? " "
        const after   = line.slice(safeCol + 1)
        return (
          <Box key={i} flexDirection="row">
            {showLineNum && (
              <Text color={theme.accent} dimColor>{lineNum} │ </Text>
            )}
            <Text wrap="wrap">
              {before}
              <Text backgroundColor={theme.accent} color="black">{at}</Text>
              {after}
            </Text>
          </Box>
        )
      })}
    </Box>
  )
}
