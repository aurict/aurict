/**
 * Synchronized terminal output (DEC mode 2026).
 *
 * Ink emits one frame as several writes (erase previous frame, write new
 * static rows, write the live frame). Terminals may paint between those
 * writes, which shows up as flicker or a torn frame on fast streams. This
 * wrapper coalesces every stdout write made in the same tick into one write
 * wrapped in begin/end synchronized-update markers. Terminals without mode
 * 2026 ignore the markers, so the only observable change there is fewer
 * writes.
 *
 * Ink routes console output to stderr between "erase frame" and "redraw
 * frame" stdout writes. The stderr wrapper flushes pending stdout first so
 * that sequence reaches the terminal in order; otherwise the erase would run
 * below the message and leave stale frame rows behind.
 */

const BEGIN_SYNC = "\x1b[?2026h"
const END_SYNC = "\x1b[?2026l"

type WriteCallback = (error?: Error | null) => void
type WriteFunction = (
  chunk: string | Uint8Array,
  encodingOrCallback?: BufferEncoding | WriteCallback,
  callback?: WriteCallback,
) => boolean

export function synchronizedOutputEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env["AURICT_SYNC_OUTPUT"] !== "0" && env["TERM"] !== "dumb"
}

function withWrite(stream: NodeJS.WriteStream, write: WriteFunction): NodeJS.WriteStream {
  return new Proxy(stream, {
    get(target, property) {
      if (property === "write") return write
      const value = Reflect.get(target, property, target) as unknown
      return typeof value === "function" ? (value as (...args: unknown[]) => unknown).bind(target) : value
    },
  })
}

function callbackOf(encodingOrCallback?: BufferEncoding | WriteCallback, callback?: WriteCallback) {
  return typeof encodingOrCallback === "function" ? encodingOrCallback : callback
}

export function createSynchronizedOutput(
  stdout: NodeJS.WriteStream,
  stderr: NodeJS.WriteStream,
): { stdout: NodeJS.WriteStream; stderr: NodeJS.WriteStream } {
  let buffer = ""
  let callbacks: WriteCallback[] = []
  let scheduled = false

  const flush = () => {
    scheduled = false
    if (!buffer) return
    const data = buffer
    const pending = callbacks
    buffer = ""
    callbacks = []
    stdout.write(`${BEGIN_SYNC}${data}${END_SYNC}`, (error) => {
      for (const callback of pending) callback(error)
    })
  }

  const writeStdout: WriteFunction = (chunk, encodingOrCallback, callback) => {
    buffer += typeof chunk === "string" ? chunk : Buffer.from(chunk).toString("utf8")
    const done = callbackOf(encodingOrCallback, callback)
    if (done) callbacks.push(done)
    if (!scheduled) {
      scheduled = true
      queueMicrotask(flush)
    }
    return true
  }

  const writeStderr: WriteFunction = (chunk, encodingOrCallback, callback) => {
    flush()
    const done = callbackOf(encodingOrCallback, callback)
    return done ? stderr.write(chunk, done) : stderr.write(chunk)
  }

  // A synchronous process exit skips pending microtasks; never drop a frame.
  process.on("exit", flush)

  return { stdout: withWrite(stdout, writeStdout), stderr: withWrite(stderr, writeStderr) }
}
