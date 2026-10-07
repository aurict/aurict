/**
 * Keybindings — Default bindings
 *
 * Default key mappings for Aurict. Organized by context.
 * The user can override these via ~/.aurict/keybindings.json.
 *
 * Every context should have all actions (empty array = unbound). For
 * convenience, we spread empty defaults via `emptyBindings()` and only
 * write the overrides.
 */

import type { Action, ContextBindings, Context } from "./types.js"

// ── Full action list (for generating empty defaults) ────────────────────────

export const ALL_ACTIONS: readonly Action[] = [
  // Quit / cancel
  "quit", "abort", "cancel", "exit",
  // Submit / confirm
  "submit", "approve", "deny", "confirm",
  // Navigation
  "nav.up", "nav.down", "nav.left", "nav.right",
  "nav.top", "nav.bottom", "nav.next", "nav.prev",
  "nav.first", "nav.last",
  // History
  "history.up", "history.down",
  // Autocomplete
  "autocomplete.next", "autocomplete.prev", "autocomplete.close",
  // Editing
  "edit.delete-word-back", "edit.delete-word-forward",
  "edit.delete-line", "edit.clear", "edit.swap",
  "edit.cursor-start", "edit.cursor-end",
  "edit.cursor-prev", "edit.cursor-next",
  // Multiline
  "multiline.newline", "multiline.toggle",
  // Chat
  "chat.new", "chat.clear", "chat.copy", "chat.paste", "chat.queue-toggle",
  // UI
  "ui.toggle-tasks", "ui.toggle-companion", "ui.toggle-btw",
  "ui.show-help", "ui.show-keys", "ui.show-models",
  "ui.show-skills", "ui.show-memory", "ui.show-session",
  "ui.command-palette",
  // Picker
  "picker.next", "picker.prev", "picker.filter",
  // Message
  "msg.expand", "msg.collapse", "msg.copy", "msg.regenerate",
  "msg.edit", "msg.delete",
  // Scroll
  "scroll.up", "scroll.down", "scroll.page-up", "scroll.page-down",
  "scroll.top", "scroll.bottom",
  // Diff
  "diff.next-hunk", "diff.prev-hunk", "diff.toggle-view",
] as const

export const ALL_CONTEXTS: readonly Context[] = [
  "global", "ready", "streaming", "permission", "question",
  "picker", "autocomplete", "history", "task-panel", "modal",
] as const

function emptyBindings(): Record<Action, string[]> {
  const obj: Partial<Record<Action, string[]>> = {}
  for (const a of ALL_ACTIONS) obj[a] = []
  return obj as Record<Action, string[]>
}

export { emptyBindings }

// ── Default bindings ─────────────────────────────────────────────────────────

export const DEFAULT_BINDINGS: ContextBindings = {
  // ── global — always active ─────────────────────────────────────────────
  global: {
    ...emptyBindings(),
    "quit":                       ["ctrl+c"],
    "abort":                      ["ctrl+x"],
    "exit":                       ["ctrl+d"],
    "edit.clear":                 ["ctrl+l"],
    "edit.cursor-start":          ["ctrl+a"],
    "edit.cursor-end":            ["ctrl+e"],
    "multiline.toggle":           ["ctrl+o"],
    "ui.toggle-tasks":            ["ctrl+t"],
    "ui.show-help":               ["ctrl+?"],
    "ui.show-keys":               ["ctrl+k"],
    "ui.command-palette":         ["ctrl+/"],
  },

  // ── ready — chat input focused ───────────────────────────────────────────
  ready: {
    ...emptyBindings(),
    "submit":                     ["enter"],
    "abort":                      ["ctrl+c"],
    "cancel":                     ["escape"],
    "exit":                       ["ctrl+d"],
    "multiline.newline":          ["shift+enter"],
    "multiline.toggle":           ["ctrl+o"],
    "edit.clear":                 ["ctrl+l"],
    "edit.cursor-start":          ["ctrl+a", "home"],
    "edit.cursor-end":            ["ctrl+e", "end"],
    "edit.delete-word-back":      ["ctrl+w"],
    "edit.delete-word-forward":   ["alt+d"],
    "edit.delete-line":           ["ctrl+u"],
    "edit.cursor-prev":           ["left"],
    "edit.cursor-next":           ["right"],
    "nav.left":                   ["left"],
    "nav.right":                  ["right"],
    "edit.swap":                  ["ctrl+t"],
    "ui.toggle-tasks":            ["ctrl+t"],
    "ui.show-help":               ["ctrl+?"],
    "ui.show-keys":               ["ctrl+k"],
    "ui.command-palette":         ["ctrl+/"],
    "history.up":                 ["up"],
    "history.down":               ["down"],
    "autocomplete.next":          ["tab", "ctrl+n"],
    "autocomplete.prev":          ["shift+tab", "ctrl+p"],
    "autocomplete.close":         ["escape"],
    "chat.queue-toggle":          ["ctrl+q"],
  },

  // ── streaming — while the model is responding (input locked) ────────────────────
  streaming: {
    ...emptyBindings(),
    "abort":                      ["escape", "ctrl+x"],
    "quit":                       ["ctrl+c"],
    "exit":                       ["ctrl+d"],
    "nav.up":                     ["up"],
    "nav.down":                   ["down"],
    "scroll.up":                  ["shift+up"],
    "scroll.down":                ["shift+down"],
    "scroll.page-up":             ["pageup"],
    "scroll.page-down":           ["pagedown"],
    "msg.expand":                 ["ctrl+o"],
    "ui.toggle-tasks":            ["ctrl+t"],
    "ui.show-help":               ["ctrl+?"],
  },

  // ── permission — y/n choice ─────────────────────────────────────────────
  permission: {
    ...emptyBindings(),
    "approve":                    ["y", "enter"],
    "deny":                       ["n", "escape"],
    "confirm":                    ["y"],
    "nav.up":                     ["up"],
    "nav.down":                   ["down"],
    "cancel":                     ["escape"],
    "quit":                       ["ctrl+c"],
  },

  // ── question — question prompt ─────────────────────────────────────────
  question: {
    ...emptyBindings(),
    "submit":                     ["enter"],
    "cancel":                     ["escape"],
    "nav.up":                     ["up"],
    "nav.down":                   ["down"],
    "quit":                       ["ctrl+c"],
    "exit":                       ["ctrl+d"],
  },

  // ── picker — model/provider selector ─────────────────────────────────────
  picker: {
    ...emptyBindings(),
    "submit":                     ["enter"],
    "cancel":                     ["escape", "q"],
    "nav.up":                     ["up", "k"],
    "nav.down":                   ["down", "j"],
    "nav.top":                    ["g"],
    "nav.bottom":                 ["G"],
    "picker.filter":              ["/"],
    "quit":                       ["ctrl+c"],
    "exit":                       ["ctrl+d"],
  },

  // ── autocomplete — / command completion open ─────────────────────────────
  autocomplete: {
    ...emptyBindings(),
    "autocomplete.next":          ["tab", "down", "ctrl+n"],
    "autocomplete.prev":          ["shift+tab", "up", "ctrl+p"],
    "autocomplete.close":         ["escape"],
    "submit":                     ["enter"],
    "cancel":                     ["escape"],
    "nav.up":                     ["up"],
    "nav.down":                   ["down"],
    "quit":                       ["ctrl+c"],
    "exit":                       ["ctrl+d"],
  },

  // ── history — ↑/↓ history navigation ──────────────────────────────────
  history: {
    ...emptyBindings(),
    "history.up":                 ["up"],
    "history.down":               ["down"],
    "submit":                     ["enter"],
    "cancel":                     ["escape"],
    "nav.up":                     ["up"],
    "nav.down":                   ["down"],
    "quit":                       ["ctrl+c"],
    "exit":                       ["ctrl+d"],
  },

  // ── task-panel — the floating task panel is open ──────────────────────────────
  "task-panel": {
    ...emptyBindings(),
    "ui.toggle-tasks":            ["escape", "ctrl+t"],
    "submit":                     ["enter"],
    "cancel":                     ["escape"],
    "nav.up":                     ["up"],
    "nav.down":                   ["down"],
    "quit":                       ["ctrl+c"],
  },

  // ── modal — a modal like help/btw/skills is open ─────────────────────────────
  modal: {
    ...emptyBindings(),
    "cancel":                     ["escape", "q"],
    "diff.toggle-view":           ["v"],
    "diff.next-hunk":             ["n"],
    "diff.prev-hunk":             ["p"],
    "nav.up":                     ["up", "k"],
    "nav.down":                   ["down", "j"],
    "quit":                       ["ctrl+c"],
  },
}
