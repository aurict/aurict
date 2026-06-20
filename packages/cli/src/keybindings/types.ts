/**
 * Keybindings — Type definitions
 *
 * Context-aware, rebindable keybinding sistemi için temel tipler.
 *
 * Hiyerarşi:
 *   Context (uygulama modu) → Action (intent) → KeyCombo (fiziksel tuş)
 *
 *   Context.READY    → Action.submit   → "enter"
 *   Context.READY    → Action.cancel   → "escape"
 *   Context.PERMISSION → Action.approve → "y"
 *
 * Kullanıcı ~/.aurict/keybindings.json dosyasında action→key eşlemesini
 * override edebilir (örn. `{"submit": "tab"}`).
 */

// ── Context (uygulama modu) ───────────────────────────────────────────────────
// Hangi modda olunduğunu belirtir; belirli context'lerde farklı keybind'lar
// aktif olabilir.

export type Context =
  | "global"         // her zaman aktif
  | "ready"          // chat input odakta
  | "streaming"      // model streaming cevap verirken
  | "permission"     // permission prompt açık
  | "question"       // question prompt açık
  | "picker"         // model/provider picker açık
  | "autocomplete"   // / komutu otomatik tamamlama açık
  | "history"        // ↑/↓ ile history navigasyonu
  | "task-panel"     // task floating panel açık
  | "modal"          // modal açık (btw panel, help, vb.)

// ── Action (intent) ──────────────────────────────────────────────────────────
// Kullanıcının niyeti — UI'dan bağımsız. Default keybind'lar ve override'lar
// bu action üzerinden eşlenir.

export type Action =
  // Çıkış / iptal
  | "quit" | "abort" | "cancel" | "exit"
  // Gönder / onayla
  | "submit" | "approve" | "deny" | "confirm"
  // Navigasyon
  | "nav.up" | "nav.down" | "nav.left" | "nav.right"
  | "nav.top" | "nav.bottom" | "nav.next" | "nav.prev"
  | "nav.first" | "nav.last"
  // Geçmiş (chat history)
  | "history.up" | "history.down"
  // Otomatik tamamlama
  | "autocomplete.next" | "autocomplete.prev" | "autocomplete.close"
  // Düzenleme
  | "edit.delete-word-back" | "edit.delete-word-forward"
  | "edit.delete-line" | "edit.clear" | "edit.swap"
  | "edit.cursor-start" | "edit.cursor-end"
  | "edit.cursor-prev" | "edit.cursor-next"
  // Çok satırlı
  | "multiline.newline" | "multiline.toggle"
  // Chat
  | "chat.new" | "chat.clear" | "chat.copy" | "chat.paste" | "chat.queue-toggle"
  // TUI
  | "ui.toggle-tasks" | "ui.toggle-companion" | "ui.toggle-btw"
  | "ui.show-help" | "ui.show-keys" | "ui.show-models"
  | "ui.show-skills" | "ui.show-memory" | "ui.show-session"
  | "ui.command-palette"
  // Picker
  | "picker.next" | "picker.prev" | "picker.filter"
  // Mesaj işlemleri
  | "msg.expand" | "msg.collapse" | "msg.copy" | "msg.regenerate"
  | "msg.edit" | "msg.delete"
  // Scroll
  | "scroll.up" | "scroll.down" | "scroll.page-up" | "scroll.page-down"
  | "scroll.top" | "scroll.bottom"
  // Diff
  | "diff.next-hunk" | "diff.prev-hunk" | "diff.toggle-view"

// ── KeyCombo (fiziksel tuş) ──────────────────────────────────────────────────

export interface KeyCombo {
  /** ctrl, alt, shift, meta modifier'ları */
  ctrl?:  boolean
  alt?:   boolean
  shift?: boolean
  meta?:  boolean
  /** Tuş ismi: "a", "enter", "up", "tab", "f1", "/" vb. */
  key:    string
}

// ── Binding (action → key eşlemesi) ───────────────────────────────────────────

/** Kullanıcının override'ı: action → key string (örn. "ctrl+s") */
export type BindingOverride = Record<string, string>

/** Context bazlı binding: her context için action → key eşlemesi */
export type ContextBindings = Record<Context, Record<Action, string[]>>

// ── Resolver result ──────────────────────────────────────────────────────────

export interface ResolvedBinding {
  /** Gösterilecek tuş kombinasyonu (display string) */
  key:       string
  /** Gerçek tuş kombinasyonu (key event matching için) */
  combo:     KeyCombo
  /** Kaynak: default mı, override mı */
  source:    "default" | "user"
  /** Bind edilen action */
  action:    Action
  /** Hangi context'te arandı */
  context:   Context
}

// ── Hook API ─────────────────────────────────────────────────────────────────

export interface UseBindingOptions {
  /** Key event'te basıldığında (input, key olaylarından geçer) */
  action:   Action
  /** Hangi context'te aranacağı (boş = "global") */
  context?: Context
  /** Trigger callback */
  onTrigger: () => void
  /** Pasif — sadece display için */
  passive?:  boolean
}

export interface UseBindingHintsOptions {
  /** Gösterilecek action'lar (sırayla) */
  actions:  Array<{ action: Action; label?: string; context?: Context }>
}

export interface UseBindingHintsResult {
  hints: Array<{
    action:    Action
    label:     string
    key:       string
    display:   string
  }>
}

// ── Configuration dosyası ───────────────────────────────────────────────────

export interface KeybindingsConfig {
  /** Action → key eşlemesi (string list, ilk öncelikli) */
  bindings: BindingOverride
  /** Aktif platform override (mac/win/linux) — farklı sembol gösterimi */
  platform?: "mac" | "win" | "linux"
  /** Rehber gösterme tercihi */
  showInStatusBar?: boolean
  /** Versiyon (gelecekteki migration'lar için) */
  version:  1
}

// ── Validation ───────────────────────────────────────────────────────────────

export type ValidationIssue =
  | { kind: "unknown-action"; action: string }
  | { kind: "unknown-context"; context: string }
  | { kind: "invalid-key-syntax"; key: string; reason: string }
  | { kind: "duplicate-binding"; action: string; keys: string[] }
  | { kind: "missing-binding"; action: Action; context: Context }

export interface ValidationResult {
  valid:   boolean
  issues:  ValidationIssue[]
}
