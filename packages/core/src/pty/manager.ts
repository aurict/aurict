// ─── PTY Manager ───────────────────────────────────────────────────────────
// Bun.spawn ile gerçek process yönetimi.
// node-pty gibi binary bağımlılığı yok — Bun native API kullanıyoruz.

const MAX_BUFFER  = 2 * 1024 * 1024 // 2 MB ring buffer
const MAX_SESSION = 20               // maksimum eş zamanlı session

export interface PtySession {
  id:          string
  pid:         number
  command:     string
  args:        string[]
  cwd:         string
  status:      "running" | "exited"
  outputBuffer: string
  exitCode?:   number | undefined
  startedAt:   number
}

interface InternalSession extends PtySession {
  proc: ReturnType<typeof Bun.spawn>
  readPromise: Promise<void>
}

interface PtyCreateOptions {
  inheritEnv?: boolean
}

class PtyManager {
  private sessions = new Map<string, InternalSession>()

  /** Yeni process başlat — stdout+stderr'ı buffer'a toplar */
  async create(
    command:  string,
    args:     string[] = [],
    cwd?:     string,
    env?:     Record<string, string>,
    options:  PtyCreateOptions = {},
  ): Promise<PtySession> {
    if (this.sessions.size >= MAX_SESSION) {
      // En eski exited session'ı temizle
      this.cleanup()
      if (this.sessions.size >= MAX_SESSION) {
        throw new Error(`Too many active terminal sessions (max ${MAX_SESSION})`)
      }
    }

    const id = crypto.randomUUID()
    const effectiveCwd = cwd ?? process.cwd()

    const proc = Bun.spawn([command, ...args], {
      cwd:   effectiveCwd,
      env:   env
        ? (options.inheritEnv === false ? env : { ...process.env, ...env })
        : process.env,
      stdin: "pipe",
      stdout: "pipe",
      stderr: "pipe",
    })

    const session: InternalSession = {
      id,
      pid:          proc.pid,
      command,
      args,
      cwd:          effectiveCwd,
      status:       "running",
      outputBuffer: "",
      startedAt:    Date.now(),
      proc,
      readPromise:  Promise.resolve(),
    }

    // stdout + stderr okuma
    const appendOutput = (chunk: string) => {
      session.outputBuffer += chunk
      // Ring buffer: 2MB aşıldıysa başından kes
      if (session.outputBuffer.length > MAX_BUFFER) {
        session.outputBuffer = session.outputBuffer.slice(
          session.outputBuffer.length - MAX_BUFFER,
        )
      }
    }

    const decoder = new TextDecoder()

    const readStream = async (stream: ReadableStream<Uint8Array> | null) => {
      if (!stream) return
      for await (const chunk of stream) {
        appendOutput(decoder.decode(chunk, { stream: true }))
      }
    }

    session.readPromise = Promise.all([
      readStream(proc.stdout),
      readStream(proc.stderr),
    ]).then(async () => {
      const code = await proc.exited
      session.status   = "exited"
      session.exitCode = code
    }).catch(() => {
      session.status = "exited"
    })

    this.sessions.set(id, session)
    return this.toPublic(session)
  }

  /** Çalışan process'e stdin yaz */
  write(id: string, data: string): void {
    const s = this.sessions.get(id)
    if (!s || s.status !== "running") return
    if (s.proc.stdin && typeof s.proc.stdin !== 'number') {
      s.proc.stdin.write(data)
    }
  }

  /** Process'i sonlandır */
  kill(id: string): void {
    const s = this.sessions.get(id)
    if (!s) return
    try { s.proc.kill() } catch { /* sessiz kapat */ }
    s.status = "exited"
  }

  /** Session bilgisini döndür */
  get(id: string): PtySession | undefined {
    const s = this.sessions.get(id)
    return s ? this.toPublic(s) : undefined
  }

  /** Tüm session'ları listele */
  list(): PtySession[] {
    return [...this.sessions.values()].map((s) => this.toPublic(s))
  }

  /** Sonlanmış session'ları temizle */
  cleanup(): void {
    for (const [id, s] of this.sessions) {
      if (s.status === "exited") this.sessions.delete(id)
    }
  }

  /** Process bitene kadar bekle (timeout ile) */
  async wait(id: string, timeoutMs: number): Promise<PtySession & { timedOut?: boolean }> {
    const s = this.sessions.get(id)
    if (!s) throw new Error(`Session not found: ${id}`)

    if (s.status === "exited") return this.toPublic(s)

    let done = false
    let resolveTimeout: (val: PtySession & { timedOut: boolean }) => void
    const timeoutPromise = new Promise<PtySession & { timedOut: boolean }>((res) => {
      resolveTimeout = res
    })

    const timer = setTimeout(() => {
      if (!done) {
        resolveTimeout({ ...this.toPublic(s), timedOut: true })
      }
    }, timeoutMs)

    const result = await Promise.race([
      s.readPromise.then(() => this.toPublic(s)),
      timeoutPromise
    ])

    done = true
    clearTimeout(timer)
    return result
  }

  private toPublic(s: InternalSession): PtySession {
    return {
      id:           s.id,
      pid:          s.pid,
      command:      s.command,
      args:         s.args,
      cwd:          s.cwd,
      status:       s.status,
      outputBuffer: s.outputBuffer,
      exitCode:     s.exitCode,
      startedAt:    s.startedAt,
    }
  }
}

export const ptyManager = new PtyManager()
