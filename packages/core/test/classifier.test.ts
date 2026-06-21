import { describe, it, expect } from "bun:test"
import { classifyCommand } from "../src/terminal/classifier.js"

describe("classifyCommand", () => {
  // ── safe / read-only ──────────────────────────────────────────────────────

  it("ls is safe", () => {
    const r = classifyCommand("ls -la")
    expect(r.level).toBe("safe")
    expect(r.isReadOnly).toBe(true)
  })

  it("cat is safe", () => {
    const r = classifyCommand("cat package.json")
    expect(r.level).toBe("safe")
    expect(r.isReadOnly).toBe(true)
  })

  it("grep is safe", () => {
    const r = classifyCommand("grep -r 'TODO' src/")
    expect(r.level).toBe("safe")
    expect(r.isReadOnly).toBe(true)
  })

  it("git status is safe", () => {
    const r = classifyCommand("git status")
    expect(r.level).toBe("safe")
    expect(r.isReadOnly).toBe(true)
  })

  it("git log is safe", () => {
    const r = classifyCommand("git log --oneline -10")
    expect(r.level).toBe("safe")
    expect(r.isReadOnly).toBe(true)
  })

  it("tsc --noEmit is safe", () => {
    const r = classifyCommand("tsc --noEmit")
    expect(r.level).toBe("safe")
    expect(r.isReadOnly).toBe(true)
  })

  // ── danger ────────────────────────────────────────────────────────────────

  it("rm is danger", () => {
    const r = classifyCommand("rm file.txt")
    expect(r.level).toBe("danger")
    expect(r.isReadOnly).toBe(false)
  })

  it("rm -rf is danger", () => {
    const r = classifyCommand("rm -rf dist/")
    expect(r.level).toBe("danger")
    expect(r.isReadOnly).toBe(false)
    expect(r.reason).toMatch(/recursive/i)
  })

  it("sudo is danger", () => {
    const r = classifyCommand("sudo apt install foo")
    expect(r.level).toBe("danger")
  })

  it("kill is danger", () => {
    const r = classifyCommand("kill -9 1234")
    expect(r.level).toBe("danger")
  })

  it("shutdown is danger", () => {
    const r = classifyCommand("shutdown now")
    expect(r.level).toBe("danger")
  })

  // ── warning (mutating but not explicitly destructive) ─────────────────────

  it("git commit is warning", () => {
    const r = classifyCommand("git commit -m 'fix'")
    expect(r.level).toBe("warning")
    expect(r.isReadOnly).toBe(false)
  })

  it("bun install is warning", () => {
    const r = classifyCommand("bun install")
    expect(r.level).toBe("warning")
    expect(r.isReadOnly).toBe(false)
  })

  it("write redirection is warning even with read-only command", () => {
    const r = classifyCommand("cat package.json > copy.json")
    expect(r.level).toBe("warning")
    expect(r.reason).toMatch(/redirection/i)
  })

  it("heredoc is warning", () => {
    const r = classifyCommand("cat <<EOF\nhello\nEOF")
    expect(r.level).toBe("warning")
    expect(r.reason).toMatch(/heredoc/i)
  })

  it("command substitution is warning", () => {
    const r = classifyCommand("echo $(whoami)")
    expect(r.level).toBe("warning")
    expect(r.reason).toMatch(/substitution/i)
  })

  it("environment assignment is warning", () => {
    const r = classifyCommand("NODE_ENV=production node server.js")
    expect(r.level).toBe("warning")
    expect(r.reason).toMatch(/environment/i)
  })

  it("eval is warning", () => {
    const r = classifyCommand("eval $SCRIPT")
    expect(r.level).toBe("warning")
    expect(r.reason).toMatch(/eval/i)
  })

  // ── piped commands ────────────────────────────────────────────────────────

  it("safe pipe stays safe", () => {
    const r = classifyCommand("cat file.txt | grep error")
    expect(r.level).toBe("safe")
  })

  it("dangerous segment in pipe escalates to danger", () => {
    const r = classifyCommand("ls | rm -rf")
    expect(r.level).toBe("danger")
  })

  it("chained with && — one dangerous escalates whole command", () => {
    const r = classifyCommand("ls && rm file.txt")
    expect(r.level).toBe("danger")
  })

  // ── parsedExecutables ─────────────────────────────────────────────────────

  it("parses executables correctly", () => {
    const r = classifyCommand("ls | grep foo")
    expect(r.parsedExecutables).toContain("ls")
    expect(r.parsedExecutables).toContain("grep")
  })

  // ── edge cases ────────────────────────────────────────────────────────────

  it("empty command is safe", () => {
    const r = classifyCommand("")
    expect(r.level).toBe("safe")
    expect(r.isReadOnly).toBe(true)
  })

  it("whitespace-only is safe", () => {
    const r = classifyCommand("   ")
    expect(r.level).toBe("safe")
  })
})
