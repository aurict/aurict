import { describe, expect, it } from "bun:test"
import { glyph, prefersAsciiGlyphs, terminalText } from "../src/tui/terminal-glyphs.js"

function withEnv(name: string, value: string | undefined, run: () => void): void {
  const previous = process.env[name]
  if (value === undefined) delete process.env[name]
  else process.env[name] = value
  try {
    run()
  } finally {
    if (previous === undefined) delete process.env[name]
    else process.env[name] = previous
  }
}

describe("terminal glyph fallback", () => {
  it("uses the brand glyph set by default", () => {
    withEnv("TERM", "xterm-256color", () => {
      withEnv("AURICT_ASCII", undefined, () => {
        expect(prefersAsciiGlyphs()).toBe(false)
        expect(glyph("assistant")).toBe("◇")
      })
    })
  })

  it("uses ASCII-safe glyphs when explicitly requested", () => {
    withEnv("AURICT_ASCII", "1", () => {
      expect(prefersAsciiGlyphs()).toBe(true)
      expect(glyph("assistant")).toBe("*")
      expect(glyph("write")).toBe("+")
      expect(terminalText("⚠ ✗ failed · retry → now…")).toBe("! x failed . retry > now.")
    })
  })

  it("covers the Codex cell glyphs in both sets", () => {
    withEnv("TERM", "xterm-256color", () => {
      withEnv("AURICT_ASCII", undefined, () => {
        expect([glyph("prompt"), glyph("bullet"), glyph("close"), glyph("check"), glyph("box"), glyph("stop")]).toEqual(["›", "•", "└", "✔", "□", "■"])
      })
    })
    withEnv("AURICT_ASCII", "1", () => {
      expect([glyph("prompt"), glyph("bullet"), glyph("gap"), glyph("box"), glyph("stop"), glyph("running")]).toEqual([">", "-", ":", "[ ]", "#", "o"])
      expect(terminalText("└ ⋮ ✔ □ ■ ◦")).toBe("` : v [ ] # o")
    })
  })

  it("falls back for dumb terminals and non-UTF locales", () => {
    withEnv("AURICT_ASCII", undefined, () => {
      withEnv("TERM", "dumb", () => expect(prefersAsciiGlyphs()).toBe(true))
      withEnv("TERM", "xterm", () => {
        withEnv("LC_ALL", "C", () => expect(prefersAsciiGlyphs()).toBe(true))
      })
    })
  })
})
