/**
 * process_monitor — Port ve proses durumu, shell olmadan.
 *
 * Linux: /proc/net/tcp + /proc/<pid>/status okur.
 * macOS: proclar için lsof fallback (spawn'la, tek komut).
 *
 * Üç mod:
 *  ports — Tüm dinleyen portlar + proses adları (mümkünse)
 *  procs — İsim/pattern ile çalışan proses arama
 *  port  — Belirli bir portun açık olup olmadığı
 */

import { z }                                        from "zod"
import { existsSync, readFileSync, readdirSync }    from "node:fs"
import type { ToolDef, ToolContext, ExecuteResult } from "../types.js"

// ── Bilinen port etiketleri ───────────────────────────────────────────────────

const PORT_LABELS: Record<number, string> = {
  21:    "FTP",
  22:    "SSH",
  25:    "SMTP",
  53:    "DNS",
  80:    "HTTP",
  443:   "HTTPS",
  3000:  "dev-server",
  3001:  "dev-server",
  3306:  "MySQL",
  4000:  "dev-server",
  4200:  "Angular dev",
  5000:  "dev-server",
  5173:  "Vite",
  5174:  "Vite",
  5432:  "PostgreSQL",
  5672:  "RabbitMQ",
  6379:  "Redis",
  8000:  "HTTP-alt",
  8080:  "HTTP-alt",
  8443:  "HTTPS-alt",
  8888:  "Jupyter",
  9000:  "PHP-FPM/SonarQube",
  9200:  "Elasticsearch",
  27017: "MongoDB",
  27018: "MongoDB",
  11211: "Memcached",
  15672: "RabbitMQ UI",
}

// ── Linux: /proc/net/tcp okuma ────────────────────────────────────────────────

interface ProcPort {
  port:    number
  pid?:    number | undefined
  proc?:   string | undefined
  inode?:  string | undefined
}

function readProcNetTcp(): ProcPort[] {
  const results: ProcPort[] = []
  const files = ["/proc/net/tcp", "/proc/net/tcp6"]

  // önce inode → pid eşlemesi kur
  const inodeToPid = new Map<string, number>()

  try {
    for (const pid of readdirSync("/proc")) {
      if (!/^\d+$/.test(pid)) continue
      const fdDir = `/proc/${pid}/fd`
      if (!existsSync(fdDir)) continue
      try {
        for (const fd of readdirSync(fdDir)) {
          try {
            // readlink ile socket inode'unu oku
            const proc = Bun.spawnSync(["readlink", `/proc/${pid}/fd/${fd}`])
            const link  = proc.stdout.toString().trim()
            const match = link.match(/^socket:\[(\d+)\]$/)
            if (match) inodeToPid.set(match[1]!, parseInt(pid))
          } catch { /* ok */ }
        }
      } catch { /* fdDir okunamıyor — izin yok */ }
    }
  } catch { /* /proc yoksa skip */ }

  for (const file of files) {
    if (!existsSync(file)) continue
    try {
      const lines = readFileSync(file, "utf8").split("\n").slice(1)
      for (const line of lines) {
        const parts = line.trim().split(/\s+/)
        if (parts.length < 10) continue
        const state = parts[3]
        if (state !== "0A") continue   // 0A = LISTEN

        const localAddr = parts[1]
        if (!localAddr) continue
        const colonIdx  = localAddr.lastIndexOf(":")
        if (colonIdx === -1) continue
        const portHex   = localAddr.slice(colonIdx + 1)
        const port      = parseInt(portHex, 16)
        if (port <= 0 || port >= 65536) continue

        const inode = parts[9]
        const pid   = inode ? inodeToPid.get(inode) : undefined

        let procName: string | undefined
        if (pid) {
          try {
            procName = readFileSync(`/proc/${pid}/comm`, "utf8").trim()
          } catch { /* ok */ }
        }

        results.push({ port, pid, proc: procName, inode })
      }
    } catch { /* ok */ }
  }

  // Deduplicate by port
  const seen = new Set<number>()
  return results.filter((p) => {
    if (seen.has(p.port)) return false
    seen.add(p.port)
    return true
  }).sort((a, b) => a.port - b.port)
}

// ── Linux: /proc/<pid>/status okuma ──────────────────────────────────────────

interface ProcEntry {
  pid:    number
  name:   string
  state:  string
  vmRss?: number   // KB
  ppid:   number
  cmdline: string
}

function readProcEntries(pattern: string): ProcEntry[] {
  const results: ProcEntry[] = []
  const regex = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")

  try {
    for (const pid of readdirSync("/proc")) {
      if (!/^\d+$/.test(pid)) continue
      const statusPath = `/proc/${pid}/status`
      if (!existsSync(statusPath)) continue

      try {
        const status  = readFileSync(statusPath, "utf8")
        const name    = status.match(/^Name:\s+(.+)$/m)?.[1]?.trim() ?? ""
        if (!regex.test(name)) continue

        const state   = status.match(/^State:\s+(.+)$/m)?.[1]?.trim() ?? "?"
        const vmRss   = parseInt(status.match(/^VmRSS:\s+(\d+)/m)?.[1] ?? "0")
        const ppid    = parseInt(status.match(/^PPid:\s+(\d+)/m)?.[1] ?? "0")

        let cmdline = ""
        try {
          cmdline = readFileSync(`/proc/${pid}/cmdline`, "utf8")
                      .replace(/\0/g, " ")
                      .trim()
                      .slice(0, 200)
        } catch { /* ok */ }

        results.push({ pid: parseInt(pid), name, state, vmRss, ppid, cmdline })
      } catch { /* ok */ }
    }
  } catch { /* /proc yoksa */ }

  return results
}

// ── macOS fallback: lsof spawn ────────────────────────────────────────────────

async function macosListenPorts(): Promise<Array<{ port: number; proc: string; pid: number }>> {
  try {
    const proc = Bun.spawn(["lsof", "-nP", "-iTCP", "-sTCP:LISTEN"], {
      stdout: "pipe", stderr: "pipe",
    })
    const out  = await new Response(proc.stdout).text()
    const exit = await proc.exited
    if (exit !== 0) return []

    const results: Array<{ port: number; proc: string; pid: number }> = []
    for (const line of out.split("\n").slice(1)) {
      const parts = line.trim().split(/\s+/)
      if (parts.length < 9) continue
      const name    = parts[0] ?? ""
      const pid     = parseInt(parts[1] ?? "0")
      const address = parts[8] ?? ""
      const portStr = address.split(":").pop()
      const port    = portStr ? parseInt(portStr) : 0
      if (port > 0 && port < 65536) {
        results.push({ port, proc: name, pid })
      }
    }
    return results
  } catch {
    return []
  }
}

// ── Yardımcı: boyut formatı ───────────────────────────────────────────────────

function humanMem(kb: number): string {
  if (kb < 1024)        return `${kb} KB`
  if (kb < 1024 * 1024) return `${(kb / 1024).toFixed(1)} MB`
  return `${(kb / 1024 / 1024).toFixed(2)} GB`
}

// ── Tool tanımı ───────────────────────────────────────────────────────────────

export const processMonitorTool: ToolDef = {
  id: "process_monitor",
  description:
    "Check running processes and open ports without shell execution or permission.\n\n" +
    "ACTIONS:\n" +
    "  ports  — List all listening TCP ports with process name (if readable)\n" +
    "  procs  — Search running processes by name pattern\n" +
    "  port   — Check if a specific port is in use\n\n" +
    "PLATFORM:\n" +
    "  Linux: reads /proc/net/tcp and /proc/<pid>/status directly\n" +
    "  macOS: uses lsof -iTCP (may require a single permission)\n\n" +
    "USE INSTEAD OF: 'ps aux | grep node', 'lsof -i :3000', 'netstat -tlnp'\n\n" +
    "EXAMPLE:\n" +
    "  port: { action: 'port', port: 3000 }          → is port 3000 open?\n" +
    "  ports: { action: 'ports' }                     → all listening ports\n" +
    "  procs: { action: 'procs', pattern: 'node' }    → all node processes",

  parameters: z.object({
    action:  z.enum(["ports", "procs", "port"])
               .describe("Action to perform"),
    port:    z.number().optional()
               .describe("Port number to check (for action='port')"),
    pattern: z.string().optional()
               .describe("Process name pattern — case-insensitive substring (for action='procs', e.g. 'node', 'python', 'bun')"),
  }),

  async execute(args, ctx: ToolContext): Promise<ExecuteResult> {
    const action  = String(args["action"])
    const isLinux = process.platform === "linux"
    const isMac   = process.platform === "darwin"

    // ── ports ─────────────────────────────────────────────────────────────────
    if (action === "ports") {
      const lines: string[] = ["Listening ports:\n"]

      if (isLinux) {
        const ports = readProcNetTcp()
        if (ports.length === 0) {
          lines.push("  (none detected)")
        } else {
          for (const p of ports) {
            const label   = PORT_LABELS[p.port] ? ` (${PORT_LABELS[p.port]})` : ""
            const procStr = p.proc ? `  ← ${p.proc}${p.pid ? ` [${p.pid}]` : ""}` : ""
            lines.push(`  :${p.port}${label}${procStr}`)
          }
        }
      } else if (isMac) {
        const ports = await macosListenPorts()
        if (ports.length === 0) {
          lines.push("  (none detected or lsof unavailable)")
        } else {
          for (const p of ports) {
            const label = PORT_LABELS[p.port] ? ` (${PORT_LABELS[p.port]})` : ""
            lines.push(`  :${p.port}${label}  ← ${p.proc} [${p.pid}]`)
          }
        }
      } else {
        lines.push(`  Port scanning not supported on ${process.platform}`)
      }

      return { output: lines.join("\n") }
    }

    // ── port ──────────────────────────────────────────────────────────────────
    if (action === "port") {
      const portNum = typeof args["port"] === "number" ? args["port"] : parseInt(String(args["port"] ?? "0"))
      if (!portNum || portNum <= 0 || portNum >= 65536) {
        return { output: "", error: "port must be a valid port number (1-65535)" }
      }

      const label = PORT_LABELS[portNum] ? ` (${PORT_LABELS[portNum]})` : ""

      if (isLinux) {
        const ports  = readProcNetTcp()
        const found  = ports.find((p) => p.port === portNum)
        if (!found) {
          return { output: `Port :${portNum}${label} — NOT in use` }
        }
        const procStr = found.proc ? ` by ${found.proc}${found.pid ? ` [PID ${found.pid}]` : ""}` : ""
        return { output: `Port :${portNum}${label} — IN USE${procStr}` }

      } else if (isMac) {
        const ports = await macosListenPorts()
        const found = ports.find((p) => p.port === portNum)
        if (!found) return { output: `Port :${portNum}${label} — NOT in use` }
        return { output: `Port :${portNum}${label} — IN USE by ${found.proc} [PID ${found.pid}]` }

      } else {
        // Generic: net.createServer ile test
        const result = await new Promise<boolean>((resolve) => {
          try {
            import("node:net").then(({ createServer }) => {
              const srv = createServer() as any
              srv.once("error", () => resolve(true))      // port meşgul
              srv.once("listening", () => { srv.close(); resolve(false) })  // boş
              srv.listen(portNum, "127.0.0.1")
            }).catch(() => resolve(false))
          } catch { resolve(false) }
        })
        return { output: `Port :${portNum}${label} — ${result ? "IN USE" : "NOT in use"}` }
      }
    }

    // ── procs ─────────────────────────────────────────────────────────────────
    if (action === "procs") {
      const pattern = args["pattern"] ? String(args["pattern"]) : ""
      if (!pattern) return { output: "", error: "pattern is required for action='procs'" }

      if (isLinux) {
        const entries = readProcEntries(pattern)
        if (entries.length === 0) {
          return { output: `No processes matching '${pattern}'` }
        }
        const lines: string[] = [`Processes matching '${pattern}' (${entries.length}):\n`]
        for (const e of entries) {
          const mem = e.vmRss ? `  mem:${humanMem(e.vmRss)}` : ""
          lines.push(`  [${e.pid}] ${e.name}${mem}`)
          if (e.cmdline) lines.push(`    ${e.cmdline}`)
        }
        return { output: lines.join("\n") }

      } else if (isMac) {
        // macOS: ps -ax ile
        try {
          const proc = Bun.spawn(["ps", "-axo", "pid,pcpu,pmem,rss,comm"], {
            stdout: "pipe", stderr: "pipe",
          })
          const out  = await new Response(proc.stdout).text()
          const regx = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")
          const matching = out.split("\n").filter((l) => regx.test(l))

          if (matching.length === 0) {
            return { output: `No processes matching '${pattern}'` }
          }
          return { output: [`Processes matching '${pattern}':\n`, ...matching.map((l) => `  ${l}`)].join("\n") }
        } catch {
          return { output: "", error: "ps command failed" }
        }
      } else {
        return { output: "", error: `Process listing not supported on ${process.platform}` }
      }
    }

    return { output: "", error: `Unknown action: ${action}` }
  },
}
