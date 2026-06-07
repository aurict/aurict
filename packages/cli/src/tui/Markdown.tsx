import React, { useState, useEffect } from "react"
import { Box, Text } from "ink"
import { tokenizeLine, detectLang, C, type Lang } from "../utils/highlight.js"

function useTerminalCols(): number {
  const [cols, setCols] = useState(() => process.stdout.columns ?? 80)
  useEffect(() => {
    const handler = () => setCols(process.stdout.columns ?? 80)
    process.stdout.on("resize", handler)
    return () => { process.stdout.off("resize", handler) }
  }, [])
  return cols
}

interface Props { content: string }

// ── Block tipleri ─────────────────────────────────────────────────────────────

type Align = "left" | "center" | "right"

type Block =
  | { kind: "code";  lang: Lang; hint: string; body: string }
  | { kind: "h1";    text: string }
  | { kind: "h2";    text: string }
  | { kind: "h3";    text: string }
  | { kind: "hr" }
  | { kind: "quote"; lines: string[] }
  | { kind: "list";  items: ListItem[]; ordered: boolean }
  | { kind: "table"; header: string[]; align: Align[]; rows: string[][] }
  | { kind: "text";  lines: string[] }

interface ListItem {
  text:    string
  checked: boolean | null   // null = regular, true = [x], false = [ ]
  indent:  number
}

// ── Parser ────────────────────────────────────────────────────────────────────

function parseAlign(cell: string): Align {
  const s = cell.trim()
  if (s.startsWith(":") && s.endsWith(":")) return "center"
  if (s.endsWith(":"))   return "right"
  return "left"
}

function isTableSep(line: string): boolean {
  return /^\|?[\s\-:|]+\|/.test(line)
}

function parseTableRow(line: string): string[] {
  return line.replace(/^\||\|$/g, "").split("|").map(c => c.trim())
}

function parseListItem(raw: string): ListItem {
  // indent seviyesi (2 boşluk = 1 indent)
  const indent = Math.floor((raw.match(/^(\s*)/)?.[1]?.length ?? 0) / 2)
  const stripped = raw.replace(/^\s*[*\-]\s/, "").replace(/^\s*\d+\.\s/, "")

  // task list detection: [ ] veya [x]
  const taskMatch = stripped.match(/^\[([x ])\]\s(.*)$/i)
  if (taskMatch) {
    return { text: taskMatch[2]!, checked: taskMatch[1]!.toLowerCase() === "x", indent }
  }
  return { text: stripped, checked: null, indent }
}

function parseBlocks(content: string): Block[] {
  const blocks: Block[] = []
  // Kod bloklarını ayır
  const codeRe = /```(\w*)\n([\s\S]*?)```/g
  const parts: Array<{ kind: "code"; lang: string; body: string } | { kind: "raw"; text: string }> = []
  let last = 0, m: RegExpExecArray | null
  while ((m = codeRe.exec(content)) !== null) {
    if (m.index > last) parts.push({ kind: "raw", text: content.slice(last, m.index) })
    parts.push({ kind: "code", lang: m[1] ?? "", body: (m[2] ?? "").replace(/\n$/, "") })
    last = m.index + m[0].length
  }
  if (last < content.length) parts.push({ kind: "raw", text: content.slice(last) })

  for (const part of parts) {
    if (part.kind === "code") {
      blocks.push({ kind: "code", lang: detectLang(part.lang), hint: part.lang, body: part.body })
      continue
    }

    const lines = part.text.split("\n")
    let i = 0
    while (i < lines.length) {
      const line = lines[i]!

      // Başlıklar
      if (/^# /.test(line))     { blocks.push({ kind: "h1", text: line.slice(2).trim() }); i++; continue }
      if (/^## /.test(line))    { blocks.push({ kind: "h2", text: line.slice(3).trim() }); i++; continue }
      if (/^### /.test(line))   { blocks.push({ kind: "h3", text: line.slice(4).trim() }); i++; continue }
      if (/^#{4,} /.test(line)) { blocks.push({ kind: "h3", text: line.replace(/^#+\s/, "").trim() }); i++; continue }

      // Yatay çizgi
      if (/^---+$/.test(line.trim()) || /^\*\*\*+$/.test(line.trim())) {
        blocks.push({ kind: "hr" }); i++; continue
      }

      // Alıntı
      if (line.startsWith("> ")) {
        const quoteLines: string[] = []
        while (i < lines.length && (lines[i]!.startsWith("> ") || lines[i]!.startsWith(">"))) {
          quoteLines.push(lines[i]!.replace(/^> ?/, ""))
          i++
        }
        blocks.push({ kind: "quote", lines: quoteLines }); continue
      }

      // Tablo: başlık satırı | ... |, sonraki satır separator
      if (line.includes("|") && i + 1 < lines.length && isTableSep(lines[i + 1]!)) {
        const header = parseTableRow(line)
        const alignRow = parseTableRow(lines[i + 1]!)
        const align = alignRow.map(parseAlign)
        i += 2
        const rows: string[][] = []
        while (i < lines.length && lines[i]!.includes("|")) {
          rows.push(parseTableRow(lines[i]!))
          i++
        }
        blocks.push({ kind: "table", header, align, rows }); continue
      }

      // Liste (sırasız + task list) — nested destekli (indent)
      if (/^(\s*)[*\-] /.test(line)) {
        const items: ListItem[] = []
        while (i < lines.length && /^(\s*)[*\-] /.test(lines[i]!)) {
          items.push(parseListItem(lines[i]!))
          i++
        }
        blocks.push({ kind: "list", items, ordered: false }); continue
      }

      // Sıralı liste
      if (/^(\s*)\d+\. /.test(line)) {
        const items: ListItem[] = []
        let idx = 1
        while (i < lines.length && /^(\s*)\d+\. /.test(lines[i]!)) {
          const raw = lines[i]!
          const indent = Math.floor((raw.match(/^(\s*)/)?.[1]?.length ?? 0) / 2)
          items.push({ text: raw.replace(/^\s*\d+\.\s/, ""), checked: null, indent })
          i++; idx++
        }
        blocks.push({ kind: "list", items, ordered: true }); continue
      }

      // Normal metin
      const textLines: string[] = []
      while (
        i < lines.length &&
        !/^#+ /.test(lines[i]!) &&
        !/^---+$/.test(lines[i]!.trim()) &&
        !/^\*\*\*+$/.test(lines[i]!.trim()) &&
        !lines[i]!.startsWith("> ") &&
        !/^(\s*)[*\-] /.test(lines[i]!) &&
        !/^(\s*)\d+\. /.test(lines[i]!) &&
        !/^```/.test(lines[i]!) &&
        !(lines[i]!.includes("|") && i + 1 < lines.length && isTableSep(lines[i + 1] ?? ""))
      ) {
        textLines.push(lines[i]!)
        i++
      }
      if (textLines.length) blocks.push({ kind: "text", lines: textLines })
    }
  }
  return blocks
}

// ── Inline renderer ───────────────────────────────────────────────────────────

function renderInline(text: string, key: number): React.ReactNode {
  const parts: React.ReactNode[] = []
  // Bold, italic, strikethrough, inline code, link — includes __ and _ variants
  const re = /(\[([^\]]+)\]\(([^)]+)\)|`[^`\n]+`|\*\*[^*\n]+\*\*|__[^_\n]+__|_[^_\n]+_|\*[^*\n]+\*|~~[^~\n]+~~)/g
  let cur = 0, m: RegExpExecArray | null, k = 0

  while ((m = re.exec(text)) !== null) {
    if (m.index > cur) parts.push(<Text key={k++}>{text.slice(cur, m.index)}</Text>)
    const tok = m[0]!

    if (tok.startsWith("[")) {
      // Link: [label](url)
      const label = m[2]!
      const url   = m[3]!
      const short = url.length > 40 ? url.slice(0, 37) + "…" : url
      parts.push(
        <Text key={k++}>
          <Text color="#7ab4e8" underline>{label}</Text>
          <Text color="#52525b" dimColor>{" ("}{short}{")"}</Text>
        </Text>
      )
    } else if (tok.startsWith("**") || tok.startsWith("__")) {
      parts.push(<Text key={k++} bold>{tok.slice(2, -2)}</Text>)
    } else if (tok.startsWith("~~")) {
      parts.push(<Text key={k++} strikethrough>{tok.slice(2, -2)}</Text>)
    } else if (tok.startsWith("*") || tok.startsWith("_")) {
      parts.push(<Text key={k++} italic>{tok.slice(1, -1)}</Text>)
    } else {
      // inline code
      parts.push(<Text key={k++} color={C.string}>{tok.slice(1, -1)}</Text>)
    }
    cur = m.index + tok.length
  }
  if (cur < text.length) parts.push(<Text key={k++}>{text.slice(cur)}</Text>)
  return <Text key={key}>{parts}</Text>
}

// ── Syntax highlight satırı ───────────────────────────────────────────────────

function SyntaxLine({ line, lang }: { line: string; lang: Lang }) {
  const tokens = tokenizeLine(line, lang)
  return (
    <Text>
      {tokens.map((tok, i) =>
        tok.bold
          ? <Text key={i} color={tok.color} bold>{tok.text}</Text>
          : <Text key={i} color={tok.color}>{tok.text}</Text>
      )}
    </Text>
  )
}

// ── Tablo renderer ─────────────────────────────────────────────────────────────

function TableView({
  header, align, rows, termWidth,
}: { header: string[]; align: Align[]; rows: string[][]; termWidth: number }) {
  const cols = header.length
  // Her sütun için max genişlik hesapla
  const colWidths = header.map((h, ci) => {
    const dataMax = rows.reduce((mx, row) => Math.max(mx, (row[ci] ?? "").length), 0)
    return Math.max(h.length, dataMax, 3)
  })

  // Toplam genişlik kontrolü — terminal genişliğini aşmaması için küçült
  const totalW = colWidths.reduce((s, w) => s + w + 3, 1)
  if (totalW > termWidth - 2) {
    const scale = (termWidth - 2 - cols * 3 - 1) / colWidths.reduce((s, w) => s + w, 0)
    colWidths.forEach((_, i) => { colWidths[i] = Math.max(3, Math.floor(colWidths[i]! * scale)) })
  }

  const pad = (s: string, w: number, a: Align): string => {
    const text = s.length > w ? s.slice(0, w - 1) + "…" : s
    const pad   = w - text.length
    if (a === "center") {
      const l = Math.floor(pad / 2), r = pad - l
      return " ".repeat(l) + text + " ".repeat(r)
    }
    if (a === "right") return " ".repeat(pad) + text
    return text + " ".repeat(pad)
  }

  const top  = "┌" + colWidths.map(w => "─".repeat(w + 2)).join("┬") + "┐"
  const sep  = "├" + colWidths.map(w => "─".repeat(w + 2)).join("┼") + "┤"
  const bot  = "└" + colWidths.map(w => "─".repeat(w + 2)).join("┴") + "┘"
  const row  = (cells: string[], a: Align[]) =>
    "│" + cells.map((c, i) => " " + pad(c, colWidths[i]!, a[i] ?? "left") + " ").join("│") + "│"

  const headerLine = row(header, header.map(() => "left"))
  const dataLines  = rows.map(r => row(
    colWidths.map((_, i) => r[i] ?? ""),
    align,
  ))

  return (
    <Box flexDirection="column" marginY={1} marginLeft={1}>
      <Text color="#3b4048">{top}</Text>
      <Text color="#3b4048">{"│"}<Text bold color="#e2e2e8">{headerLine.slice(1, -1)}</Text>{"│"}</Text>
      <Text color="#3b4048">{sep}</Text>
      {dataLines.map((dl, i) => (
        <Text key={i} color="#3b4048">{"│"}<Text color="#c9d1d9">{dl.slice(1, -1)}</Text>{"│"}</Text>
      ))}
      <Text color="#3b4048">{bot}</Text>
    </Box>
  )
}

// ── Render ────────────────────────────────────────────────────────────────────

export function Markdown({ content }: Props) {
  const blocks    = parseBlocks(content)
  const termWidth = useTerminalCols()

  return (
    <Box flexDirection="column">
      {blocks.map((b, bi) => {
        switch (b.kind) {

          case "h1":
            return (
              <Box key={bi} flexDirection="column" marginTop={1} marginBottom={0}>
                <Box gap={1}>
                  <Text bold color="#e2e2e8">{renderInline(b.text, 0)}</Text>
                </Box>
                <Text color="#3b4048">{"─".repeat(Math.min(b.text.length + 2, termWidth - 4))}</Text>
              </Box>
            )

          case "h2":
            return (
              <Box key={bi} marginTop={1} marginBottom={0} gap={1}>
                <Text bold color="#7ab4e8">◆</Text>
                <Text bold color="#e2e2e8">{renderInline(b.text, 0)}</Text>
              </Box>
            )

          case "h3":
            return (
              <Box key={bi} marginTop={1} marginBottom={0} gap={1}>
                <Text color="#5a7a9a">▸</Text>
                <Text bold color="#c9d1d9">{renderInline(b.text, 0)}</Text>
              </Box>
            )

          case "hr":
            return (
              <Box key={bi} marginY={1}>
                <Text color="#3b4048">{"─".repeat(Math.min(60, termWidth - 4))}</Text>
              </Box>
            )

          case "quote":
            return (
              <Box key={bi} flexDirection="column" paddingLeft={2} marginY={1}
                   borderStyle="single" borderColor="#52525b"
                   borderTop={false} borderBottom={false} borderRight={false}>
                {b.lines.map((l, li) => (
                  <Text key={li} color="#8b949e" italic>{l}</Text>
                ))}
              </Box>
            )

          case "list":
            return (
              <Box key={bi} flexDirection="column" paddingLeft={1}>
                {b.items.map((item, ii) => {
                  const indent = item.indent * 2

                  if (item.checked === true) {
                    // ✓ tamamlanmış task
                    return (
                      <Box key={ii} gap={1} paddingLeft={indent}>
                        <Text color="#3fb950">●</Text>
                        <Text color="#8b949e" strikethrough>{item.text}</Text>
                      </Box>
                    )
                  }
                  if (item.checked === false) {
                    // ○ yapılmamış task
                    return (
                      <Box key={ii} gap={1} paddingLeft={indent}>
                        <Text color="#52525b">○</Text>
                        {renderInline(item.text, ii)}
                      </Box>
                    )
                  }
                  // Normal liste maddesi
                  return (
                    <Box key={ii} gap={1} paddingLeft={indent}>
                      <Text color="#7ab4e8">{b.ordered ? `${ii + 1}.` : "•"}</Text>
                      {renderInline(item.text, ii)}
                    </Box>
                  )
                })}
              </Box>
            )

          case "table":
            return (
              <TableView
                key={bi}
                header={b.header}
                align={b.align}
                rows={b.rows}
                termWidth={termWidth}
              />
            )

          case "code":
            return (
              <Box key={bi} flexDirection="column" borderStyle="round"
                   borderColor="#3b4048" marginY={1} paddingX={1} marginLeft={1}>
                {b.hint && <Text color="#52525b" dimColor>{b.hint}</Text>}
                {b.body.split("\n").map((line, li) => (
                  <Box key={li} gap={1}>
                    <Text color="#52525b" dimColor>{String(li + 1).padStart(3)}</Text>
                    <Text color="#52525b" dimColor>│</Text>
                    <SyntaxLine line={line} lang={b.lang as Lang} />
                  </Box>
                ))}
              </Box>
            )

          case "text":
          default:
            return (
              <Box key={bi} flexDirection="column">
                {(b as { kind: "text"; lines: string[] }).lines.map((line, li) =>
                  renderInline(line, li)
                )}
              </Box>
            )
        }
      })}
    </Box>
  )
}
