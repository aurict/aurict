/**
 * Keybindings — Default bindings
 *
 * Aurict için varsayılan key eşlemeleri. Context bazlı organize edilmiş.
 * Kullanıcı ~/.aurict/keybindings.json ile override edebilir.
 *
 * Her context'te tüm action'lar olmalı (boş array = bağlanmamış). Pratik için
 * `emptyBindings()` ile boş default'ları spread edip sadece override'ları yazıyoruz.
 */

import type { Action, ContextBindings, Context } from "./types.js"

// ── Tüm action listesi (boş default üretmek için) ────────────────────────────

export const ALL_ACTIONS: readonly Action[] = [
  // Çıkış / iptal
  "quit", "abort", "cancel", "exit",
  // Gönder / onayla
  "submit", "approve", "deny", "confirm",
  // Navigasyon
  "nav.up", "nav.down", "nav.left", "nav.right",
  "nav.top", "nav.bottom", "nav.next", "nav.prev",
  "nav.first", "nav.last",
  // Geçmiş
  "history.up", "history.down",
  // Autocomplete
  "autocomplete.next", "autocomplete.prev", "autocomplete.close",
  // Düzenleme
  "edit.delete-word-back", "edit.delete-word-forward",
  "edit.delete-line", "edit.clear", "edit.swap",
  "edit.cursor-start", "edit.cursor-end",
  "edit.cursor-prev", "edit.cursor-next",
  // Çok satırlı
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
  // Mesaj
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
  // ── global — her zaman aktif ─────────────────────────────────────────────
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

  // ── ready — chat input odakta ───────────────────────────────────────────
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

  // ── streaming — model cevap verirken (input kilitli) ────────────────────
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

  // ── permission — y/n seçim ─────────────────────────────────────────────
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

  // ── picker — model/provider seçici ─────────────────────────────────────
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

  // ── autocomplete — / komutu tamamlama açık ─────────────────────────────
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

  // ── history — ↑/↓ history navigasyonu ──────────────────────────────────
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

  // ── task-panel — task floating panel açık ──────────────────────────────
  "task-panel": {
    ...emptyBindings(),
    "ui.toggle-tasks":            ["escape", "ctrl+t"],
    "submit":                     ["enter"],
    "cancel":                     ["escape"],
    "nav.up":                     ["up"],
    "nav.down":                   ["down"],
    "quit":                       ["ctrl+c"],
  },

  // ── modal — help/btw/skills vb. modal açık ─────────────────────────────
  modal: {
    ...emptyBindings(),
    "cancel":                     ["escape", "q"],
    "nav.up":                     ["up", "k"],
    "nav.down":                   ["down", "j"],
    "quit":                       ["ctrl+c"],
  },
}
