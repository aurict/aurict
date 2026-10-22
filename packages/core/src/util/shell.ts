import { existsSync }  from "node:fs"
import { spawnSync }   from "node:child_process"

export interface ShellConfig {
  executable: string   // "bash" | tam yol | "powershell"
  flag:       string   // "-c"   | "-Command"
  isUnix:     boolean  // bash/sh ise true
}

let _cache: ShellConfig | null = null

/**
 * Mevcut platformda en iyi shell'i döner.
 *
 * Linux/macOS → her zaman { executable: "bash", flag: "-c", isUnix: true }
 * Windows     → Git Bash / MSYS2 / PATH bash aratar; bulamazsa PowerShell
 */
export function getShell(): ShellConfig {
  if (_cache) return _cache

  if (process.platform !== "win32") {
    return (_cache = { executable: "bash", flag: "-c", isUnix: true })
  }

  // Windows öncelik sırası:
  // 1. BASH env var (kullanıcı elle ayarlamış)
  // 2. Git for Windows  (en yaygın)
  // 3. MSYS2
  // 4. PATH'te bash (WSL entegrasyonu, Scoop, Chocolatey)
  // 5. PowerShell fallback

  const candidates = [
    process.env["BASH"] ?? "",
    "C:\\Program Files\\Git\\bin\\bash.exe",
    "C:\\Program Files\\Git\\usr\\bin\\bash.exe",
    "C:\\msys64\\usr\\bin\\bash.exe",
    "C:\\msys2\\usr\\bin\\bash.exe",
  ].filter(Boolean)

  for (const p of candidates) {
    if (existsSync(p)) {
      return (_cache = { executable: p, flag: "-c", isUnix: true })
    }
  }

  // PATH'te bash var mı? (WSL, Scoop, Chocolatey kurulumları)
  try {
    const r = spawnSync("bash", ["--version"], { timeout: 2000, stdio: "pipe" })
    if (r.status === 0) {
      return (_cache = { executable: "bash", flag: "-c", isUnix: true })
    }
  } catch { /* bash PATH'te yok */ }

  // Son çare: PowerShell
  return (_cache = { executable: "powershell", flag: "-Command", isUnix: false })
}
