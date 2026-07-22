import { describe, expect, it } from "bun:test"
import {
  displayColumnToOffset,
  displayWidth,
  offsetToDisplayColumn,
  padDisplayEnd,
  truncateDisplayMiddle,
  truncateDisplayWidth,
} from "../src/tui/terminal-text/display-width.js"
import {
  graphemeCount,
  nextGraphemeBoundary,
  previousGraphemeBoundary,
} from "../src/tui/terminal-text/graphemes.js"
import { verticalCursorOffset } from "../src/tui/terminal-text/cursor-map.js"
import { wrapStyledSegments } from "../src/tui/terminal-text/wrap-segments.js"
import { terminalHyperlink } from "../src/tui/terminal-text/hyperlink.js"
import { cursorLineParts, inputPointFromTerminal } from "../src/tui/multiline-input-layout.js"
import { wordLeft, wordRight } from "../src/tui/multiline-input-model.js"
import { alignToolRow } from "../src/tui/conversation/tool-row-model.js"

describe("terminal Unicode text primitives", () => {
  it("emits OSC 8 only for explicitly safe link schemes", () => {
    expect(terminalHyperlink("docs", "https://example.com")).toContain("\x1b]8;;https://example.com")
    expect(terminalHyperlink("unsafe", "javascript:alert(1)")).toBe("unsafe")
    expect(terminalHyperlink("control", "https://example.com\x07bad")).not.toContain("\x07bad")
  })

  it("measures terminal cells instead of UTF-16 code units", () => {
    expect(displayWidth("日本")).toBe(4)
    expect(displayWidth("🙂")).toBe(2)
    expect(displayWidth("e\u0301")).toBe(1)
    expect(displayWidth("👨‍👩‍👧‍👦")).toBe(2)
    expect(graphemeCount("🇹🇷e\u0301👨‍👩‍👧‍👦")).toBe(3)
  })

  it("moves only across whole grapheme clusters", () => {
    const value = "A👨‍👩‍👧‍👦e\u0301🇹🇷Z"
    const familyEnd = 1 + "👨‍👩‍👧‍👦".length
    expect(nextGraphemeBoundary(value, 1)).toBe(familyEnd)
    expect(previousGraphemeBoundary(value, familyEnd)).toBe(1)
    expect(nextGraphemeBoundary(value, familyEnd)).toBe(familyEnd + "e\u0301".length)
  })

  it("maps mouse columns and vertical movement to valid string offsets", () => {
    expect(displayColumnToOffset("A界B", 1)).toBe(1)
    expect(displayColumnToOffset("A界B", 2)).toBe(2)
    expect(offsetToDisplayColumn("A界B", 2)).toBe(3)
    expect(verticalCursorOffset("ab界", "🙂x", "ab界".length)).toBe("🙂x".length)
    expect(inputPointFromTerminal(6, 1, { row: 0, col: 0, width: 20, height: 1 }, ["A界B"]))
      .toEqual({ row: 0, col: "A界B".length })
  })

  it("truncates and pads by display width without splitting clusters", () => {
    expect(truncateDisplayWidth("ab🙂cd", 5)).toBe("ab🙂…")
    expect(displayWidth(truncateDisplayMiddle("日本語-file.ts", 10))).toBeLessThanOrEqual(10)
    expect(displayWidth(padDisplayEnd("界", 5))).toBe(5)
    expect(cursorLineParts("x👨‍👩‍👧‍👦y", 1)).toEqual({
      before: "x",
      at: "👨‍👩‍👧‍👦",
      after: "y",
    })
  })

  it("wraps styled rows on display-cell boundaries and preserves style", () => {
    const rows = wrapStyledSegments([
      { text: "ab", tone: "plain" },
      { text: "界🙂c", tone: "accent" },
    ], 4)
    expect(rows.map((row) => row.map((part) => part.text).join(""))).toEqual(["ab界", "🙂c"])
    expect(rows[1]?.[0]?.tone).toBe("accent")
    expect(rows.every((row) => displayWidth(row.map((part) => part.text).join("")) <= 4)).toBe(true)

    const indented = wrapStyledSegments([{ text: "  abcdef" }], 4)
    expect(indented.map((row) => row.map((part) => part.text).join(""))).toEqual(["  ab", "cdef"])
  })

  it("keeps word navigation and tool alignment Unicode-safe", () => {
    const value = "foo 👩🏽‍💻 bar"
    expect(wordLeft(value, value.length)).toBe(value.lastIndexOf("bar"))
    expect(wordLeft(value, value.lastIndexOf("bar"))).toBe(4)
    expect(wordRight(value, 4)).toBe(value.lastIndexOf("bar"))

    const row = alignToolRow("ara", "日本語 dosyaları", "2.4s", 36)
    expect(row.layout).toBe("stacked")
    expect(displayWidth(`  ${row.action}${row.spacer}${row.metadata}`)).toBeLessThanOrEqual(36)
    expect(displayWidth(`    ${row.subject}`)).toBeLessThanOrEqual(36)
  })
})
