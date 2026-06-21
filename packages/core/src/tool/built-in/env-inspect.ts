/**
 * env_inspect — Ortam keşfi, shell komutu çalıştırmadan.
 *
 * Tek çağrıda şunları raporlar:
 *  - Kurulu runtime'lar (Node, Bun, Python, Go, Rust, Java, Deno, PHP, Ruby)
 *  - Env variable key'leri (değer değil — güvenlik)
 *  - workdir içindeki .env* dosyaları
 *  - Dinleyen portlar (Linux: /proc/net/tcp, macOS: skip)
 *  - Kullanılabilir araçlar (Docker, Git, Make, kubectl vb.)
 *  - Proje manifest'leri (package.json, Cargo.toml, pyproject.toml…)
 *
 * İzin gerektirmez. Bash çalıştırmaz.
 */

import { z }                          from "zod"
import { existsSync, readdirSync,
         readFileSync, statSync }      from "node:fs"
import { join }                        from "node:path"
import type { ToolDef, ToolContext, ExecuteResult } from "../types.js"

// ── Runtime binary adayları ───────────────────────────────────────────────────

const RUNTIME_CANDIDATES: Array<{ name: string; args: string[]; parse: (out: string) => string }> = [
  { name: "node",    args: ["--version"],  parse: (o) => o.trim() },
  { name: "bun",     args: ["--version"],  parse: (o) => o.trim() },
  { name: "deno",    args: ["--version"],  parse: (o) => o.split("\n")[0]?.trim() ?? o.trim() },
  { name: "python3", args: ["--version"],  parse: (o) => o.trim() },
  { name: "python",  args: ["--version"],  parse: (o) => o.trim() },
  { name: "go",      args: ["version"],    parse: (o) => o.replace("go version ", "").trim() },
  { name: "rustc",   args: ["--version"],  parse: (o) => o.trim() },
  { name: "java",    args: ["-version"],   parse: (o) => o.split("\n")[0]?.trim() ?? o.trim() },
  { name: "ruby",    args: ["--version"],  parse: (o) => o.trim() },
  { name: "php",     args: ["--version"],  parse: (o) => o.split("\n")[0]?.trim() ?? o.trim() },
]

// ── Araç binary yolları ───────────────────────────────────────────────────────

const TOOL_PATHS: Record<string, string[]> = {
  git:       ["/usr/bin/git",    "/usr/local/bin/git",    "/opt/homebrew/bin/git"],
  docker:    ["/usr/bin/docker", "/usr/local/bin/docker", "/opt/homebrew/bin/docker"],
  podman:    ["/usr/bin/podman", "/usr/local/bin/podman"],
  kubectl:   ["/usr/bin/kubectl","/usr/local/bin/kubectl","/opt/homebrew/bin/kubectl"],
  terraform: ["/usr/bin/terraform","/usr/local/bin/terraform","/opt/homebrew/bin/terraform"],
  make:      ["/usr/bin/make",   "/usr/local/bin/make"],
  cmake:     ["/usr/bin/cmake",  "/usr/local/bin/cmake"],
  gh:        ["/usr/bin/gh",     "/usr/local/bin/gh",     "/opt/homebrew/bin/gh"],
  jq:        ["/usr/bin/jq",     "/usr/local/bin/jq",     "/opt/homebrew/bin/jq"],
  curl:      ["/usr/bin/curl",   "/usr/local/bin/curl"],
  wget:      ["/usr/bin/wget",   "/usr/local/bin/wget"],
  ffmpeg:    ["/usr/bin/ffmpeg", "/usr/local/bin/ffmpeg"],
}

// ── Proje manifest'leri ───────────────────────────────────────────────────────

const MANIFESTS: Array<{ file: string; label: string }> = [
  { file: "package.json",    label: "Node/Bun" },
  { file: "Cargo.toml",      label: "Rust" },
  { file: "pyproject.toml",  label: "Python (pyproject)" },
  { file: "requirements.txt",label: "Python (requirements)" },
  { file: "go.mod",          label: "Go" },
  { file: "pom.xml",         label: "Java (Maven)" },
  { file: "build.gradle",    label: "Java (Gradle)" },
  { file: "Gemfile",         label: "Ruby" },
  { file: "composer.json",   label: "PHP" },
  { file: "mix.exs",         label: "Elixir" },
  { file: "pubspec.yaml",    label: "Dart/Flutter" },
  { file: "CMakeLists.txt",  label: "C/C++ (CMake)" },
  { file: "Makefile",        label: "Make" },
  { file: "deno.json",       label: "Deno" },
  { file: "bun.lockb",       label: "Bun lockfile" },
]

// ── Yardımcı: runtime spawn (3s timeout) ─────────────────────────────────────

function streamText(stream: number | ReadableStream<Uint8Array> | undefined): Promise<string> {
  if (!stream || typeof stream === "number") return Promise.resolve("")
  return new Response(stream).text()
}

async function spawnRuntime(name: string, args: string[]): Promise<string | null> {
  let proc: ReturnType<typeof Bun.spawn> | null = null
  try {
    proc = Bun.spawn([name, ...args], { stdout: "pipe", stderr: "pipe" })
    const readPromise = Promise.all([
      streamText(proc.stdout),
      streamText(proc.stderr),
    ])
    let timer: ReturnType<typeof setTimeout> | undefined
    const timeoutPromise = new Promise<null>((resolve) => {
      timer = setTimeout(() => {
        try { proc?.kill() } catch { /* ok */ }
        resolve(null)
      }, 3000)
    })
    const result = await Promise.race([readPromise, timeoutPromise])
    if (timer) clearTimeout(timer)
    if (result === null) return null
    const [stdout, stderr] = result
    return (stdout || stderr).trim() || null
  } catch {
    try { proc?.kill() } catch { /* ok */ }
    return null
  }
}

// ── Yardımcı: binary varlık kontrolü (PATH araması) ──────────────────────────

function findBinary(name: string, candidates: string[]): boolean {
  for (const p of candidates) {
    if (existsSync(p)) return true
  }
  // PATH'ten ara
  const pathDirs = (process.env["PATH"] ?? "").split(":")
  for (const dir of pathDirs) {
    if (existsSync(join(dir, name))) return true
  }
  return false
}

// ── Yardımcı: Linux /proc/net/tcp port'larını oku ────────────────────────────

function readListeningPorts(): number[] {
  const files = ["/proc/net/tcp", "/proc/net/tcp6"]
  const ports = new Set<number>()

  for (const file of files) {
    if (!existsSync(file)) continue
    try {
      const lines = readFileSync(file, "utf8").split("\n").slice(1) // başlık satırını atla
      for (const line of lines) {
        const parts = line.trim().split(/\s+/)
        if (parts.length < 4) continue
        const state = parts[3]
        if (state !== "0A") continue // 0A = LISTEN
        const localAddr = parts[1]
        if (!localAddr) continue
        const colonIdx = localAddr.lastIndexOf(":")
        if (colonIdx === -1) continue
        const portHex = localAddr.slice(colonIdx + 1)
        const port    = parseInt(portHex, 16)
        if (port > 0 && port < 65536) ports.add(port)
      }
    } catch { /* okuma başarısız — atla */ }
  }

  return [...ports].sort((a, b) => a - b)
}

// ── Yardımcı: ENV var gruplandırma ───────────────────────────────────────────

const SECRET_PATTERNS = [/_KEY$/, /_TOKEN$/, /_SECRET$/, /_PASSWORD$/, /_PASS$/, /_PWD$/]
const RELEVANT_KEYS   = [
  "NODE_ENV", "PORT", "HOST", "DATABASE_URL", "REDIS_URL", "MONGO_URL",
  "API_URL", "BASE_URL", "APP_ENV", "ENVIRONMENT", "LOG_LEVEL",
  "ANTHROPIC_API_KEY", "OPENAI_API_KEY", "GOOGLE_GENERATIVE_AI_KEY", "OPENROUTER_API_KEY",
  "AWS_REGION", "AWS_DEFAULT_REGION", "VERCEL_ENV", "NEXT_PUBLIC_API_URL",
]

// ── Tool tanımı ───────────────────────────────────────────────────────────────

export const envInspectTool: ToolDef = {
  id: "env_inspect",
  description:
    "Inspect the current environment without running shell commands or requiring permission.\n\n" +
    "Returns in a single call:\n" +
    "- Installed runtimes: Node, Bun, Python, Go, Rust, Java, Deno, Ruby, PHP\n" +
    "- Environment variable keys (secret values are masked)\n" +
    "- .env files present in workdir\n" +
    "- Open/listening ports (Linux only, via /proc/net/tcp)\n" +
    "- Available tools: Docker, Git, Make, kubectl, gh, jq, curl…\n" +
    "- Project manifest files detected\n\n" +
    "SECTIONS:\n" +
    "  runtimes — language runtime versions\n" +
    "  env      — environment variable keys\n" +
    "  ports    — listening TCP ports\n" +
    "  files    — .env files and project manifests\n" +
    "  tools    — available CLI tools\n\n" +
    "USE INSTEAD OF: 'which node', 'node --version', 'ls .env*', 'lsof -i', etc.\n" +
    "No shell execution required — no permission prompt.",

  parameters: z.object({
    sections: z.array(
      z.enum(["runtimes", "env", "ports", "files", "tools"])
    )
    .optional()
    .default(["runtimes", "env", "ports", "files", "tools"])
    .describe("Which sections to include (default: all)"),
  }),

  async execute(args, ctx: ToolContext): Promise<ExecuteResult> {
    const sections = (args["sections"] as string[]) ?? ["runtimes", "env", "ports", "files", "tools"]
    const lines: string[] = []

    // ── runtimes ──────────────────────────────────────────────────────────────
    if (sections.includes("runtimes")) {
      lines.push("## Runtimes")
      const results = await Promise.all(
        RUNTIME_CANDIDATES.map(async (r) => {
          const out = await spawnRuntime(r.name, r.args)
          return out ? `  ${r.name.padEnd(10)} ${r.parse(out)}` : null
        })
      )
      const found = results.filter(Boolean) as string[]
      if (found.length === 0) {
        lines.push("  (none detected)")
      } else {
        lines.push(...found)
      }
      lines.push("")
    }

    // ── env ───────────────────────────────────────────────────────────────────
    if (sections.includes("env")) {
      lines.push("## Environment Variables")
      const allKeys = Object.keys(process.env)

      // Önce ilgili key'leri göster
      const relevant: string[] = []
      const secrets:  string[] = []
      const other:    string[] = []

      for (const key of allKeys) {
        const isSecret = SECRET_PATTERNS.some((p) => p.test(key))
        if (RELEVANT_KEYS.includes(key)) {
          const val = isSecret ? "[secret]" : (process.env[key] ?? "")
          relevant.push(`  ${key.padEnd(28)} = ${val.slice(0, 60)}`)
        } else if (isSecret) {
          secrets.push(`  ${key.padEnd(28)} = [secret]`)
        } else {
          other.push(key)
        }
      }

      if (relevant.length > 0) {
        lines.push("  Relevant:")
        lines.push(...relevant)
      }
      if (secrets.length > 0) {
        lines.push("  Secrets set (values hidden):")
        lines.push(...secrets)
      }
      if (other.length > 0) {
        lines.push(`  Other: ${other.length} additional variables (PATH, TERM, etc.)`)
      }
      lines.push("")
    }

    // ── ports ─────────────────────────────────────────────────────────────────
    if (sections.includes("ports")) {
      lines.push("## Listening Ports")
      const isLinux = process.platform === "linux"
      if (!isLinux) {
        lines.push("  (port scan only available on Linux — /proc/net/tcp)")
      } else {
        const ports = readListeningPorts()
        if (ports.length === 0) {
          lines.push("  (none detected)")
        } else {
          // Bilinen port etiketleri
          const PORT_LABELS: Record<number, string> = {
            80: "HTTP", 443: "HTTPS", 3000: "dev server", 3001: "dev server",
            4000: "dev server", 5000: "dev server", 5173: "Vite", 8000: "HTTP-alt",
            8080: "HTTP-alt", 8443: "HTTPS-alt", 5432: "PostgreSQL", 3306: "MySQL",
            6379: "Redis", 27017: "MongoDB", 5672: "RabbitMQ", 9200: "Elasticsearch",
          }
          for (const port of ports) {
            const label = PORT_LABELS[port] ? `  (${PORT_LABELS[port]})` : ""
            lines.push(`  :${port}${label}`)
          }
        }
      }
      lines.push("")
    }

    // ── files ─────────────────────────────────────────────────────────────────
    if (sections.includes("files")) {
      lines.push("## Project Files")

      // .env* dosyaları
      try {
        const entries = readdirSync(ctx.workdir)
        const envFiles = entries.filter((f) => f.startsWith(".env"))
        if (envFiles.length > 0) {
          lines.push("  .env files:")
          for (const f of envFiles) {
            const fp   = join(ctx.workdir, f)
            let   size = ""
            try {
              const st = statSync(fp)
              size = `  (${st.size} bytes)`
            } catch { /* ok */ }
            lines.push(`    ${f}${size}`)
          }
        } else {
          lines.push("  .env files: (none)")
        }
      } catch { /* workdir okunamıyor */ }

      // Proje manifest'leri
      const found = MANIFESTS.filter((m) => existsSync(join(ctx.workdir, m.file)))
      if (found.length > 0) {
        lines.push("  Project manifests:")
        for (const m of found) {
          lines.push(`    ${m.file.padEnd(20)} [${m.label}]`)
        }
      }
      lines.push("")
    }

    // ── tools ─────────────────────────────────────────────────────────────────
    if (sections.includes("tools")) {
      lines.push("## Available Tools")
      const available:   string[] = []
      const unavailable: string[] = []

      for (const [name, paths] of Object.entries(TOOL_PATHS)) {
        if (findBinary(name, paths)) {
          available.push(name)
        } else {
          unavailable.push(name)
        }
      }

      if (available.length > 0) {
        lines.push(`  Available:   ${available.join("  ")}`)
      }
      if (unavailable.length > 0) {
        lines.push(`  Not found:   ${unavailable.join("  ")}`)
      }
      lines.push("")
    }

    return { output: lines.join("\n").trimEnd() }
  },
}
