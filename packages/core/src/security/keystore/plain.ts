import { existsSync, mkdirSync, accessSync, constants } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"
import type { KeyStore, KeystoreCapability } from "./types.js"
import { readJsonFileSync, writeJsonFileAtomicSync } from "../../storage/persisted-json.js"

/**
 * Plain-file fallback — `~/.aurict/keys.json` (chmod 0600).
 *
 * Native OS depoları erişilemezse (headless CI, container, readonly HOME)
 * API key sakımı için kullanılır. Bu güvenli değil (plain-text disk) ama
 * `~/.aurict/config.json`'da düz durmasından daha iyi: ayrı dosya, 0600.
 */

const FILE_MODE = 0o600

function filepath(): string {
  return join(homedir(), ".aurict", "keys.json")
}

function ensureDir(): void {
  const dir = join(homedir(), ".aurict")
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

function read(): Record<string, string> {
  const p = filepath()
  return readJsonFileSync<Record<string, string>>(p, {
    optional: true,
    description: "plain-file keystore",
    validate: isStringRecord,
  }) ?? {}
}

function write(data: Record<string, string>): boolean {
  ensureDir()
  const p = filepath()
  try {
    writeJsonFileAtomicSync(p, data, { mode: FILE_MODE })
    return true
  } catch {
    return false
  }
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value)
    && Object.values(value).every(entry => typeof entry === "string"))
}

export const plainFile: KeyStore = {
  async available() { return true },

  async get(key) {
    const data = read()
    return data[key] ?? null
  },

  async set(key, value) {
    const data = read()
    data[key] = value
    return write(data)
  },

  async delete(key) {
    const data = read()
    if (!(key in data)) return true
    delete data[key]
    return write(data)
  },
}

export async function plainKeystoreCapability(): Promise<KeystoreCapability> {
  const p = filepath()
  try {
    if (existsSync(p)) {
      accessSync(p, constants.R_OK | constants.W_OK)
    } else {
      ensureDir()
    }
    return {
      backend:   "plain-file",
      label:     `Plain file fallback (${p}, mode 0600)`,
      available: true,
      reason:    undefined,
    }
  } catch (err) {
    return {
      backend:   "plain-file",
      label:     "Plain file fallback",
      available: false,
      reason:    err instanceof Error ? err.message : String(err),
    }
  }
}
