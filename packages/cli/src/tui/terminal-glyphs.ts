export type GlyphName =
  | "assistant"
  | "user"
  | "system"
  | "thinking"
  | "tool"
  | "search"
  | "write"
  | "web"
  | "agent"
  | "quote"
  | "bullet"
  | "done"
  | "todo"
  | "open"
  | "close"
  | "headingMajor"
  | "headingMinor"
  | "patch"
  | "working"
  | "paused"
  | "error"
  | "action"
  | "separator"
  | "branch"
  | "ellipsis"
  | "divider"
  | "statusOn"
  | "statusOff"
  | "statusTiny"
  | "treeMid"
  | "treeEnd"

const UNICODE_GLYPHS: Record<GlyphName, string> = {
  assistant: "◇", user: "◆", system: "·", thinking: "∴", tool: "›",
  search: "⌕", write: "✦", web: "↗", agent: "◇", quote: "│",
  bullet: "•", done: "●", todo: "○", open: "┌", close: "└",
  headingMajor: "◆", headingMinor: "▸", patch: "±", working: "◌",
  paused: "⏸", error: "✗", action: "→", separator: "│", branch: "⌥",
  ellipsis: "…", divider: "─", statusOn: "●", statusOff: "○", statusTiny: "·",
  treeMid: "├", treeEnd: "└",
}

const ASCII_GLYPHS: Record<GlyphName, string> = {
  assistant: "*", user: ">", system: "-", thinking: "~", tool: ">",
  search: "?", write: "+", web: ">", agent: "*", quote: "|",
  bullet: "-", done: "x", todo: "o", open: "+", close: "+",
  headingMajor: ">", headingMinor: ">", patch: "+", working: "o",
  paused: "P", error: "x", action: ">", separator: "|", branch: "b",
  ellipsis: ".", divider: "-", statusOn: "*", statusOff: "o", statusTiny: ".",
  treeMid: "|", treeEnd: "`",
}

export function prefersAsciiGlyphs(): boolean {
  const locale = process.env["LC_ALL"] ?? process.env["LC_CTYPE"] ?? process.env["LANG"] ?? ""
  return process.env["AURICT_ASCII"] === "1"
    || process.env["TERM"] === "dumb"
    || (locale.length > 0 && !/utf-?8/i.test(locale))
}

export function glyph(name: GlyphName): string {
  return (prefersAsciiGlyphs() ? ASCII_GLYPHS : UNICODE_GLYPHS)[name]
}

/** Last-mile guard for UI decorations on non-Unicode terminals. */
export function terminalText(value: string): string {
  if (!prefersAsciiGlyphs()) return value
  return value
    .replace(/[◆◇▸›↗→]/g, ">")
    .replace(/❯/g, ">")
    .replace(/⌕/g, "?")
    .replace(/[✦±]/g, "+")
    .replace(/∴/g, "~")
    .replace(/│/g, "|")
    .replace(/•/g, "-")
    .replace(/●/g, "x")
    .replace(/[○◌]/g, "o")
    .replace(/✗/g, "x")
    .replace(/⚠/g, "!")
    .replace(/⏸/g, "P")
    .replace(/⌥/g, "b")
    .replace(/[·…⋯—]/g, ".")
    .replace(/−/g, "-")
    .replace(/─/g, "-")
    .replace(/⌃/g, "^")
    .replace(/⇧/g, "S-")
    .replace(/⏎/g, "Enter")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
}
