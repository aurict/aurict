/**
 * Keybindings — format helper for /keys command
 *
 * Converts default bindings into text format (for CLI command output).
 */

import { DEFAULT_BINDINGS, ALL_ACTIONS } from "./defaults.js"
import { detectPlatform } from "./persistence.js"
import { formatKey, parseKeyString } from "../tui/design-system/Kbd.js"
import type { Context } from "./types.js"
import { shortcutColumns } from "../tui/KeyboardShortcuts.js"

/** Platform symbol mapping (same as Kbd.tsx). */
function platformLabel(pf: ReturnType<typeof detectPlatform>): "macos" | "linux" | "windows" {
  if (pf === "mac")  return "macos"
  if (pf === "win")  return "windows"
  return "linux"
}

export interface FormattedBinding {
  action:   string
  key:      string
  source:   "default" | "user"
  display:  string  // platform-aware formatted
}

/**
 * Returns the formatted bindings for a given context.
 * Filters out ones with an empty array.
 */
export function formatBindingsForContext(
  context: Context,
  overrides: Record<string, string> = {},
): FormattedBinding[] {
  const out: FormattedBinding[] = []
  const bindings = DEFAULT_BINDINGS[context]
  const pf = platformLabel(detectPlatform())

  for (const action of ALL_ACTIONS) {
    const override = overrides[action]
    let keys: string[]
    let source: "default" | "user"
    if (override !== undefined) {
      keys = [override]
      source = "user"
    } else {
      keys = bindings[action]
      source = "default"
    }
    if (keys.length === 0) continue

    const key = keys[0]!
    const sym = parseKeyString(key)
    if (!sym) continue
    const display = formatKey(sym, pf)

    out.push({ action, key, source, display })
  }

  return out
}

/** The diff viewer is the only surface driven by this binding table, so only its keys are customizable. */
const CUSTOMIZABLE_ACTIONS = ["diff.next-hunk", "diff.prev-hunk", "diff.toggle-view"] as const

/**
 * The /keys reference: the keys Aurict actually binds (the same table as the
 * "?" overlay), then the diff-viewer keys that ~/.aurict/keybindings.json can change.
 */
export function formatAllBindings(overrides: Record<string, string> = {}): string {
  const lines: string[] = ["Keybindings:"]
  const idle = shortcutColumns(false)
  const running = shortcutColumns(true)
  for (const [index, column] of idle.entries()) {
    const extra = running[index]!.rows.filter(([key, label]) => !column.rows.some(([idleKey, idleLabel]) => idleKey === key && idleLabel === label))
    const rows = [...column.rows, ...extra.map(([key, label]) => [key, `${label} (while working)`] as const)]
    const width = Math.max(...rows.map(([key]) => key.length)) + 2
    lines.push("", `  ${column.title}`, ...rows.map(([key, label]) => `    ${key.padEnd(width)}${label}`))
  }
  const diff = formatBindingsForContext("modal", overrides).filter((item) => (CUSTOMIZABLE_ACTIONS as readonly string[]).includes(item.action))
  if (diff.length > 0) {
    lines.push("", "  Diff viewer (customizable)")
    for (const { action, display, source } of diff) lines.push(`  ${source === "user" ? "★" : " "} ${display.padEnd(14)}${action}`)
  }
  lines.push("", "  ★ = custom override in ~/.aurict/keybindings.json, e.g. { \"diff.next-hunk\": \"j\" }")
  return lines.join("\n")
}
