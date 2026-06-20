/**
 * Keybindings — format helper for /keys command
 *
 * Default binding'leri text formatına çevirir (CLI komut çıktısı için).
 */

import { DEFAULT_BINDINGS, ALL_ACTIONS } from "./defaults.js"
import { detectPlatform } from "./persistence.js"
import { formatKey, parseKeyString } from "../tui/design-system/Kbd.js"
import type { Context } from "./types.js"

/** Platform sembol eşlemesi (Kbd.tsx ile aynı). */
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
 * Belirli context için binding'leri formatlanmış olarak döner.
 * Boş array olanları filtreler.
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

/**
 * Tüm context'ler için binding'leri gruplanmış text olarak döner.
 * /keys komut çıktısı için.
 */
export function formatAllBindings(overrides: Record<string, string> = {}): string {
  const lines: string[] = ["Keybindings:"]
  const contexts: Context[] = ["global", "ready", "streaming", "permission", "picker", "modal"]

  for (const ctx of contexts) {
    const items = formatBindingsForContext(ctx, overrides)
    if (items.length === 0) continue
    lines.push("")
    lines.push(`  [${ctx}]`)
    // En geniş action adını bul, hizalama için
    const maxAction = Math.min(28, Math.max(...items.map(i => i.action.length)))
    for (const { action, display, source } of items) {
      const marker = source === "user" ? "★" : " "
      lines.push(`    ${marker} ${display.padEnd(14)} ${action.padEnd(maxAction + 2)}`)
    }
  }

  lines.push("")
  lines.push("  ★ = custom override (in ~/.aurict/keybindings.json)")
  lines.push("  To override: edit the JSON file with { \"quit\": \"ctrl+q\" } format.")
  return lines.join("\n")
}
