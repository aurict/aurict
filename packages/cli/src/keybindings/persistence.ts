/**
 * Keybindings — Persistence
 *
 * Kullanıcı keybinding override'larını ~/.aurict/keybindings.json dosyasında
 * saklar. Dosya yoksa veya bozuksa sessizce default'a düşer.
 */

import * as fs from "node:fs"
import * as os from "node:os"
import * as path from "node:path"
import type { BindingOverride, KeybindingsConfig } from "./types.js"
import { validateOverride } from "./validate.js"

// ── Paths ────────────────────────────────────────────────────────────────────

const CONFIG_DIR  = path.join(os.homedir(), ".aurict")
const CONFIG_FILE = path.join(CONFIG_DIR, "keybindings.json")

/** Config dosya yolunu döner (test ve inspect için). */
export function getKeybindingsPath(): string {
  return CONFIG_FILE
}

// ── Platform detection ───────────────────────────────────────────────────────

export function detectPlatform(): "mac" | "win" | "linux" {
  const p = process.platform
  if (p === "darwin") return "mac"
  if (p === "win32")  return "win"
  return "linux"
}

// ── Load ─────────────────────────────────────────────────────────────────────

export interface LoadResult {
  /** Override'lar (action → key string) */
  bindings: BindingOverride
  /** Config'den okunan platform (opsiyonel) */
  platform?: "mac" | "win" | "linux" | undefined
  /** Hata varsa burada */
  error?:   string | undefined
  /** Kaynak dosya yolu (yoksa undefined) */
  source?:  string | undefined
}

/**
 * Kullanıcı config dosyasını yükler. Dosya yoksa boş override döner.
 * Bozuk JSON veya validation hatası varsa hata döner ama yine de
 * kısmi override'ı kullanmaya çalışır.
 */
export function loadKeybindings(): LoadResult {
  if (!fs.existsSync(CONFIG_FILE)) {
    return { bindings: {}, source: undefined }
  }

  let raw: string
  try {
    raw = fs.readFileSync(CONFIG_FILE, "utf8")
  } catch (e) {
    return {
      bindings: {},
      error: `could not read ${CONFIG_FILE}: ${(e as Error).message}`,
    }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch (e) {
    return {
      bindings: {},
      error: `invalid JSON in ${CONFIG_FILE}: ${(e as Error).message}`,
    }
  }

  if (typeof parsed !== "object" || parsed === null) {
    return {
      bindings: {},
      error: `${CONFIG_FILE} is not an object`,
    }
  }

  const cfg = parsed as Partial<KeybindingsConfig>

  // Validate
  const override = cfg.bindings ?? {}
  const validation = validateOverride(override)
  if (!validation.valid) {
    return {
      bindings: override,
      platform: cfg.platform,
      error: `validation issues: ${validation.issues.map(i => JSON.stringify(i)).join("; ")}`,
    }
  }

  return {
    bindings: override,
    platform: cfg.platform,
    source: CONFIG_FILE,
  }
}

// ── Save ─────────────────────────────────────────────────────────────────────

export interface SaveResult {
  ok:      boolean
  path?:   string | undefined
  error?:  string | undefined
}

/**
 * Override'ları dosyaya yazar. Atomic write (tmp + rename) yapar.
 * Başarısız olursa dosyayı bozmaz.
 */
export function saveKeybindings(
  override: BindingOverride,
  options: { platform?: "mac" | "win" | "linux" } = {},
): SaveResult {
  // Validation önce
  const validation = validateOverride(override)
  if (!validation.valid) {
    return {
      ok: false,
      error: `invalid bindings: ${validation.issues.map(i => JSON.stringify(i)).join("; ")}`,
    }
  }

  // Dizin yoksa oluştur
  try {
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true })
    }
  } catch (e) {
    return {
      ok: false,
      error: `could not create ${CONFIG_DIR}: ${(e as Error).message}`,
    }
  }

  const cfg: KeybindingsConfig = {
    version: 1,
    bindings: override,
    ...(options.platform !== undefined ? { platform: options.platform } : {}),
  }

  const json = JSON.stringify(cfg, null, 2) + "\n"
  const tmpFile = CONFIG_FILE + ".tmp"

  try {
    fs.writeFileSync(tmpFile, json, "utf8")
    fs.renameSync(tmpFile, CONFIG_FILE)
    return { ok: true, path: CONFIG_FILE }
  } catch (e) {
    // Cleanup tmp file
    try { if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile) } catch {}
    return {
      ok: false,
      error: `could not write ${CONFIG_FILE}: ${(e as Error).message}`,
    }
  }
}

// ── Reset ────────────────────────────────────────────────────────────────────

/** Config dosyasını siler (default'a dön). */
export function resetKeybindings(): boolean {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      fs.unlinkSync(CONFIG_FILE)
    }
    return true
  } catch {
    return false
  }
}
