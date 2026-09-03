/**
 * Central terminal-mode registry.
 *
 * Every feature that writes a "turn on mode" escape sequence to the
 * terminal (bracketed paste, mouse tracking, focus reporting, ...)
 * registers its enable/disable pair here. When the process terminates via
 * SIGINT/SIGTERM/exit (React effect cleanups are not guaranteed to run —
 * Ink's `exit()` or a signal-based termination can skip synchronous
 * cleanup), this module writes the disable sequence for EVERY registered mode.
 *
 * Why this is needed: on exit via Ctrl+C (SIGINT), the bracketed-paste
 * disable sequence was never written (only "exit"/"SIGTERM" were listened
 * to) — `\x1b[200~`/`\x1b[201~` could leak as visible garbage text in the
 * next terminal session. Mouse tracking had no process-level cleanup at
 * all, relying solely on React effect unmount.
 */

interface ModeEntry {
  enable:  string
  disable: string
}

const activeModes = new Map<string, ModeEntry>()
let signalsRegistered = false

function restoreAll(): void {
  for (const { disable } of activeModes.values()) {
    try { process.stdout.write(disable) } catch { /* stdout may already be closed */ }
  }
  activeModes.clear()
}

function ensureSignalHandlers(): void {
  if (signalsRegistered) return
  signalsRegistered = true
  process.on("exit", restoreAll)
  process.on("SIGINT", restoreAll)
  process.on("SIGTERM", restoreAll)
}

/**
 * Enables and registers a terminal mode.
 * @param id Unique identifier for the mode (e.g. "mouse-tracking", "bracketed-paste").
 * @param enableSequence  The enable sequence to write to the terminal immediately.
 * @param disableSequence The sequence to write on normal shutdown or process exit.
 * @returns A cleanup function that disables the mode and removes it from the
 *          registry (called from a React effect cleanup; if closed normally,
 *          it won't be written again on process exit).
 */
export function registerTerminalMode(
  id: string,
  enableSequence: string,
  disableSequence: string,
): () => void {
  ensureSignalHandlers()
  process.stdout.write(enableSequence)
  activeModes.set(id, { enable: enableSequence, disable: disableSequence })

  let cleaned = false
  return () => {
    if (cleaned) return
    cleaned = true
    activeModes.delete(id)
    try { process.stdout.write(disableSequence) } catch { /* ignore */ }
  }
}

/** Read-only id → disable-sequence map of the currently active modes. */
export function getActiveModes(): ReadonlyMap<string, string> {
  const projected = new Map<string, string>()
  for (const [id, entry] of activeModes) projected.set(id, entry.disable)
  return projected
}

/**
 * Re-writes the enable sequence of every currently active mode to the
 * terminal. After a tmux detach/reattach or an SSH disconnect, the remote
 * terminal's mode state may have been reset — this is called when data
 * arrives after a long silence on stdin, to make sure modes like mouse
 * tracking/bracketed paste are active again.
 */
export function reassertActiveModes(): void {
  for (const { enable } of activeModes.values()) {
    try { process.stdout.write(enable) } catch { /* ignore */ }
  }
}

/** Test-only: resets module-level state. */
export function __resetForTest(): void {
  activeModes.clear()
  signalsRegistered = false
  const emitter = process as NodeJS.EventEmitter
  emitter.off("exit", restoreAll)
  emitter.off("SIGINT", restoreAll)
  emitter.off("SIGTERM", restoreAll)
}

/** Test-only: triggers restoreAll without sending a real signal. */
export function __triggerRestoreForTest(): void {
  restoreAll()
}
