import { execSync } from "node:child_process"
import { writeFileSync, unlinkSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"

export type ClipboardResult =
  | { type: "image"; base64: string; mimeType: string; name: string }
  | { type: "text"; text: string }
  | { type: "empty" }
  | { type: "error"; message: string }

function isMac(): boolean  { return process.platform === "darwin" }
function isLinux(): boolean { return process.platform === "linux" }

// OSC 52: a command telling the terminal directly to "write this to the system
// clipboard". Works even over SSH/tmux (the one reliable path in cases native
// commands can't reach) — if the terminal doesn't support it, it's silently
// ignored (harmless). If sent without a tmux/screen passthrough wrapper, tmux
// tries to interpret it itself and corrupts it, so it's wrapped with
// \x1bPtmux;...\x1b\\ whenever the TMUX/STY env vars are present.
function writeOsc52(text: string): void {
  if (!process.stdout.isTTY) return
  const sequence = `\x1b]52;c;${Buffer.from(text, "utf8").toString("base64")}\x07`
  process.stdout.write(
    process.env["TMUX"] || process.env["STY"]
      ? `\x1bPtmux;\x1b${sequence}\x1b\\`
      : sequence,
  )
}

export function linuxCopyCommands(): string[] {
  return ["wl-copy", "xclip -selection clipboard", "xsel --clipboard --input"]
}

type ExecFn = (
  command: string,
  options?: { input?: string; stdio?: ["pipe", "ignore", "ignore"]; timeout?: number },
) => Buffer | string

// wl-copy and xclip fork a daemon that keeps serving the selection. The
// daemon inherits the child's stdout/stderr, so piping them would make
// execSync wait for the daemon to exit; discard them instead, and never let a
// clipboard helper block the UI for long.
const COPY_EXEC_OPTIONS = { stdio: ["pipe", "ignore", "ignore"] as ["pipe", "ignore", "ignore"], timeout: 2_000 }

/**
 * Writes text to the system clipboard. OSC 52 is always tried (SSH/tmux-safe,
 * instant); then a platform-specific native command is tried best-effort. If
 * none of them work, it fails silently — copying is a background convenience,
 * not a critical operation.
 *
 * The `exec` parameter exists purely for test dependency injection (globally
 * faking the real `child_process` via `mock.module` silently breaks unrelated
 * test files running in the SAME process — e.g. tests that run a real git
 * command — since bun has no cross-file isolation for it).
 */
export function writeClipboard(text: string, exec: ExecFn = execSync): void {
  writeOsc52(text)

  try {
    if (isMac()) {
      exec("pbcopy", { input: text, ...COPY_EXEC_OPTIONS })
      return
    }
    if (isLinux()) {
      for (const cmd of linuxCopyCommands()) {
        try {
          exec(cmd, { input: text, ...COPY_EXEC_OPTIONS })
          return
        } catch { /* try the next command */ }
      }
    }
  } catch { /* OSC 52 was already tried; silently move on if no native command is available */ }
}

export function readClipboard(): ClipboardResult {
  try {
    if (isMac()) return readMacClipboard()
    if (isLinux()) return readLinuxClipboard()
    return { type: "error", message: "Clipboard not supported on this platform." }
  } catch (err) {
    return { type: "error", message: err instanceof Error ? err.message : String(err) }
  }
}

function readMacClipboard(): ClipboardResult {
  // Check if clipboard contains image via AppleScript
  const script = `
    set t to (clipboard info) as string
    if t contains "«class PNGf»" or t contains "«class TIFF»" or t contains "JPEG picture" then
      return "image"
    else
      return "text"
    end if
  `
  let kind: string
  try {
    kind = execSync(`osascript -e '${script.trim()}'`, { encoding: "utf8" }).trim()
  } catch {
    kind = "text"
  }

  if (kind === "image") {
    // Save clipboard image to temp file as PNG
    const tmp = join(tmpdir(), `aurict-clip-${Date.now()}.png`)
    try {
      execSync(
        `osascript -e 'set f to POSIX file "${tmp}"' -e 'set d to (clipboard)' -e 'write (clipboard as «class PNGf») to (open for access f with write permission)' -e 'close access f'`,
        { encoding: "utf8" }
      )
    } catch {
      // Fallback: try screencapture -c approach
      try {
        execSync(`osascript -e 'tell app "Finder" to set the clipboard to (read clipboard as «class PNGf»)'`)
      } catch { /* ignore */ }
    }

    try {
      const { readFileSync } = require("node:fs")
      const buf    = readFileSync(tmp) as Buffer
      const base64 = buf.toString("base64")
      try { unlinkSync(tmp) } catch { /* ignore */ }
      if (base64.length > 0) {
        return { type: "image", base64, mimeType: "image/png", name: `clipboard-${Date.now()}.png` }
      }
    } catch { /* fallthrough */ }
    return { type: "error", message: "Could not read image from clipboard. Try saving it to a file first." }
  }

  // Text clipboard
  try {
    const text = execSync("pbpaste", { encoding: "utf8" })
    return text ? { type: "text", text } : { type: "empty" }
  } catch {
    return { type: "empty" }
  }
}

function readLinuxClipboard(): ClipboardResult {
  // Try xclip first, then xsel
  const tools = [
    { cmd: "xclip -selection clipboard -t image/png -o", mime: "image/png" },
    { cmd: "xclip -selection clipboard -t image/jpeg -o", mime: "image/jpeg" },
  ]

  for (const { cmd, mime } of tools) {
    try {
      const buf    = execSync(cmd)
      const base64 = buf.toString("base64")
      if (base64.length > 10) {
        return { type: "image", base64, mimeType: mime, name: `clipboard-${Date.now()}.${mime.split("/")[1]}` }
      }
    } catch { /* try next */ }
  }

  // Try text
  for (const cmd of ["xclip -selection clipboard -o", "xsel --clipboard --output", "wl-paste"]) {
    try {
      const text = execSync(cmd, { encoding: "utf8" })
      return text ? { type: "text", text } : { type: "empty" }
    } catch { /* try next */ }
  }

  return { type: "empty" }
}
