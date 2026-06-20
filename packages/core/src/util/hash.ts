import { createHash } from "node:crypto"
import { stat } from "node:fs/promises"

/**
 * Tool cache key, request deduplication için deterministic hash.
 * 
 * Nesne anahtarlarını sıralar → JSON stringify → SHA-256 → hex prefix.
 * Aynı argümanlar her zaman aynı hash'i üretir.
 */
export function hashArgs(args: Record<string, unknown>): string {
  const sorted = stableStringify(args)
  return createHash("sha256").update(sorted).digest("hex").slice(0, 16)
}

/**
 * Dosya içeriğinin hızlı hash'i — değişiklik tespiti için.
 * mtime + size kombinasyonu kullanır (içerik hash'inden çok daha hızlı).
 * Aynı mtime + size = aynı içerik (pratikte yeterli).
 */
export async function hashFileQuick(filePath: string): Promise<string> {
  try {
    const info = await stat(filePath)
    return `${info.size}:${info.mtimeMs}`
  } catch {
    return ""
  }
}

/**
 * Dosya içeriğinin tam hash'i — güvenlik açısından gerekli durumlarda.
 */
export async function hashFileContent(filePath: string): Promise<string> {
  try {
    const content = await Bun.file(filePath).arrayBuffer()
    return createHash("sha256").update(new Uint8Array(content)).digest("hex").slice(0, 16)
  } catch {
    return ""
  }
}

/**
 * String'in kısa hash'i — cache key olarak kullanıma uygun.
 */
export function hashString(text: string): string {
  return createHash("sha256").update(text).digest("hex").slice(0, 12)
}

// ─── Internal ────────────────────────────────────────────────────────────────

/**
 * Deterministic JSON stringify — anahtar sıralaması garanti edilir.
 * Nesting destekler, undefined/null/binary güvenli.
 */
function stableStringify(value: unknown): string {
  if (value === null || value === undefined) return "null"
  if (typeof value === "string") return JSON.stringify(value)
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  if (typeof value === "function") return '"[function]"'
  if (typeof value !== "object") return String(value)

  if (Array.isArray(value)) {
    return "[" + value.map(stableStringify).join(",") + "]"
  }

  // Object — anahtarları sırala
  const obj = value as Record<string, unknown>
  const keys = Object.keys(obj).sort()
  const pairs = keys.map((k) => JSON.stringify(k) + ":" + stableStringify(obj[k]))
  return "{" + pairs.join(",") + "}"
}
