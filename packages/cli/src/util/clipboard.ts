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
