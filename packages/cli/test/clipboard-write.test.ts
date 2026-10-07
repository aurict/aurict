/**
 * writeClipboard() tests — OSC 52 format/tmux wrapper and the Linux
 * native command fallback chain (wl-copy → xclip → xsel).
 *
 * NOTE: `mock.module("node:child_process", ...)` is NOT USED — in bun this
 * replaces the module GLOBALLY for ALL test files (no file-level isolation),
 * and it silently broke unrelated test files running in the same process
 * (e.g. the `git-context` tests, which run a real git command via
 * `execSync`/`spawnSync`) — this actually happened once, and led to
 * `writeClipboard` moving to dependency injection via the `exec` parameter.
 * Instead, a fake `exec` function is passed directly as an argument.
 */
import { describe, it, expect, beforeEach, afterEach } from "bun:test"
import { writeClipboard, linuxCopyCommands } from "../src/util/clipboard.js"

let writes: string[] = []
let originalWrite: typeof process.stdout.write
let originalIsTTY: boolean | undefined

beforeEach(() => {
  writes = []
  originalWrite = process.stdout.write.bind(process.stdout)
  originalIsTTY = process.stdout.isTTY
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(process.stdout as any).write = (chunk: string) => { writes.push(chunk); return true }
  process.stdout.isTTY = true
  delete process.env["TMUX"]
  delete process.env["STY"]
})

afterEach(() => {
  process.stdout.write = originalWrite
  process.stdout.isTTY = originalIsTTY
  delete process.env["TMUX"]
  delete process.env["STY"]
})

describe("writeClipboard — OSC 52", () => {
  const noopExec = () => ""

  it("writes an OSC52 sequence with base64-encoded text when stdout is a TTY", () => {
    writeClipboard("hello", noopExec)
    const expected = `\x1b]52;c;${Buffer.from("hello", "utf8").toString("base64")}\x07`
    expect(writes).toContain(expected)
  })

  it("wraps the sequence in a tmux passthrough when TMUX is set", () => {
    process.env["TMUX"] = "/tmp/tmux-1000/default,123,0"
    writeClipboard("hi", noopExec)
    const inner    = `\x1b]52;c;${Buffer.from("hi", "utf8").toString("base64")}\x07`
    const expected = `\x1bPtmux;\x1b${inner}\x1b\\`
    expect(writes).toContain(expected)
  })

  it("wraps the sequence in a tmux passthrough when STY (screen) is set", () => {
    process.env["STY"] = "12345.pts-0.host"
    writeClipboard("hi", noopExec)
    const inner    = `\x1b]52;c;${Buffer.from("hi", "utf8").toString("base64")}\x07`
    const expected = `\x1bPtmux;\x1b${inner}\x1b\\`
    expect(writes).toContain(expected)
  })

  it("does not write anything when stdout is not a TTY", () => {
    process.stdout.isTTY = false
    writeClipboard("nope", noopExec)
    expect(writes).toHaveLength(0)
  })
})

describe("linuxCopyCommands", () => {
  it("tries wl-copy, then xclip, then xsel in that order", () => {
    expect(linuxCopyCommands()).toEqual([
      "wl-copy", "xclip -selection clipboard", "xsel --clipboard --input",
    ])
  })
})

describe("writeClipboard — Linux native command fallback", () => {
  beforeEach(() => {
    process.stdout.isTTY = false // isolate OSC52 writing within this block
  })

  it("tries wl-copy first", () => {
    if (process.platform !== "linux") return
    const calls: Array<{ cmd: string; input: string | undefined }> = []
    writeClipboard("text", (cmd, opts) => { calls.push({ cmd, input: opts?.input }); return "" })
    expect(calls[0]).toEqual({ cmd: "wl-copy", input: "text" })
  })

  it("never pipes the helper's output, so a forking clipboard daemon cannot block", () => {
    if (process.platform !== "linux") return
    const seen: unknown[] = []
    writeClipboard("text", (_cmd, opts) => { seen.push(opts); return "" })
    expect(seen[0]).toMatchObject({ input: "text", stdio: ["pipe", "ignore", "ignore"] })
    expect((seen[0] as { timeout?: number }).timeout).toBeGreaterThan(0)
  })

  it("falls back to xclip if wl-copy is unavailable", () => {
    if (process.platform !== "linux") return
    const calls: string[] = []
    writeClipboard("text", (cmd) => {
      calls.push(cmd)
      if (cmd === "wl-copy") throw new Error("not found")
      return ""
    })
    expect(calls).toEqual(["wl-copy", "xclip -selection clipboard"])
  })

  it("falls back to xsel if wl-copy and xclip are both unavailable", () => {
    if (process.platform !== "linux") return
    const calls: string[] = []
    writeClipboard("text", (cmd) => {
      calls.push(cmd)
      if (cmd !== "xsel --clipboard --input") throw new Error("not found")
      return ""
    })
    expect(calls).toEqual(["wl-copy", "xclip -selection clipboard", "xsel --clipboard --input"])
  })

  it("does not throw when every native command is unavailable", () => {
    if (process.platform !== "linux") return
    expect(() => writeClipboard("text", () => { throw new Error("not found") })).not.toThrow()
  })

  it("stops trying further commands once one succeeds", () => {
    if (process.platform !== "linux") return
    const calls: string[] = []
    writeClipboard("text", (cmd) => { calls.push(cmd); return "" })
    expect(calls).toHaveLength(1)
  })
})
