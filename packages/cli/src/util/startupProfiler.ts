/**
 * Aurict startup profiler — minimal, zero-cost-when-disabled phase tracker.
 *
 * Two modes:
 * 1. **Detailed profile** (`AURICT_PROFILE_STARTUP=1`): takes a perf.mark +
 *    memory snapshot for every `profileCheckpoint` call, and prints a timeline
 *    in human or JSON format on program exit.
 * 2. **Disabled (default)**: `profileCheckpoint` is a no-op, `profileReport`
 *    returns an empty string. Production cost is ~0.
 *
 * This is a parallel adaptation of the `startupProfiler.ts` pattern; the goal
 * is to make the Aurict binary's (`@aurict/cli` native binary) startup phases
 * visible and to diagnose the slowest step in the
 * `loadConfig` → `bootstrap` → `App.render` chain.
 *
 * Usage:
 *   import { profileCheckpoint, profileReport } from "./util/startupProfiler.js"
 *   profileCheckpoint("config_loader_loaded")
 *   // ...
 *   profileCheckpoint("app_rendered")
 *   // On exit:
 *   const text = profileReport("text")  // or "json"
 *   if (text) console.error(text)
 *
 * Note: uses Node's `perf_hooks` API — Bun also supports `perf_hooks`
 * without bugs, so no extra dependency is needed.
 */

import { performance } from "node:perf_hooks"

const ENV_FLAG = "AURICT_PROFILE_STARTUP"
const enabled = process.env[ENV_FLAG] === "1" || process.env[ENV_FLAG] === "true"

interface Phase {
  name: string
  ts: number            // perf.now() ms — Monotonic time from process start
  memory?: NodeJS.MemoryUsage
}

const phases: Phase[] = []

if (enabled) {
  // First phase — this module being loaded
  phases.push({
    name: "startup_profiler_loaded",
    ts: performance.now(),
    memory: process.memoryUsage(),
  })
}

/**
 * Checkpoint — records the current phase. No-op when disabled.
 *
 * The same name can be used more than once (e.g. a two-step init).
 */
export function profileCheckpoint(name: string): void {
  if (!enabled) return
  performance.mark(name)
  phases.push({
    name,
    ts: performance.now(),
    memory: process.memoryUsage(),
  })
}

/** Duration between phases (milliseconds). Returns an empty string when disabled. */
export function profileReport(format: "text" | "json" = "text"): string {
  if (!enabled || phases.length === 0) return ""
  if (format === "json") {
    return JSON.stringify({ phases }, null, 2)
  }

  const lines: string[] = ["Aurict startup profile"]
  lines.push("─".repeat(60))
  let prev: Phase | undefined
  for (const phase of phases) {
    const delta = prev ? phase.ts - prev.ts : 0
    const rssMb = phase.memory ? (phase.memory.rss / 1024 / 1024).toFixed(1) : "?"
    const absFromStart = phase.ts.toFixed(1).padStart(8)
    const deltaStr = (prev ? `+${delta.toFixed(1)}` : "──").padStart(7)
    lines.push(`${absFromStart}ms  ${deltaStr}ms  rSS=${rssMb}MB  ${phase.name}`)
    prev = phase
  }
  const total = prev ? prev.ts - phases[0]!.ts : 0
  lines.push("─".repeat(60))
  lines.push(`total: ${total.toFixed(1)}ms across ${phases.length} phase(s)`)
  return lines.join("\n")
}

/**
 * Write the profile to process exit. Skipped when disabled.
 * The calling module should hook this up via `process.on("exit")`.
 */
export function flushProfileReportOnExit(): void {
  if (!enabled) return
  process.on("exit", () => {
    const text = profileReport("text")
    if (text) {
      // stderr — doesn't corrupt the stdout TUI
      process.stderr.write("\n" + text + "\n")
    }
  })
}
