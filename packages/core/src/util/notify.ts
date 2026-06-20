import { execSync } from "child_process"

type NotifyLevel = "info" | "success" | "error"

function platform(): "mac" | "linux" | "other" {
  if (process.platform === "darwin") return "mac"
  if (process.platform === "linux")  return "linux"
  return "other"
}

function sendNative(title: string, body: string, level: NotifyLevel): void {
  try {
    if (platform() === "mac") {
      const icon = level === "error" ? "⚠️" : "✓"
      execSync(
        `osascript -e 'display notification "${body.replace(/"/g, "'")}" with title "${icon} ${title}"'`,
        { stdio: "ignore", timeout: 3000 }
      )
    } else if (platform() === "linux") {
      const urgency = level === "error" ? "critical" : "normal"
      execSync(
        `notify-send -u ${urgency} "Aurict: ${title}" "${body.replace(/"/g, "'")}"`,
        { stdio: "ignore", timeout: 3000 }
      )
    }
  } catch { /* bildirim çalışmazsa sessizce geç */ }
}

/**
 * Kullanıcıya bildirim gönder.
 * Terminal bell her zaman çalınır. Native bildirim platform'a göre.
 */
export function notify(title: string, body = "", level: NotifyLevel = "info"): void {
  // Terminal bell — her platformda çalışır, terminal focus'daysa duyulur
  process.stdout.write("\x07")
  // Native OS bildirimi
  sendNative(title, body || title, level)
}

export function notifyTaskDone(prompt: string, durationMs: number): void {
  const dur = durationMs >= 60_000
    ? `${Math.round(durationMs / 60_000)}m`
    : `${Math.round(durationMs / 1000)}s`
  const short = prompt.slice(0, 60) + (prompt.length > 60 ? "…" : "")
  notify("Task completed", `${short} (${dur})`, "success")
}

export function notifyError(prompt: string): void {
  const short = prompt.slice(0, 60) + (prompt.length > 60 ? "…" : "")
  notify("Task failed", short, "error")
}
