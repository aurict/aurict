import { getEncoding, type TiktokenEncoding } from "js-tiktoken"
import { createHash } from "node:crypto"
import type { CoreMessage } from "ai"

const MODEL_ENCODINGS: Record<string, TiktokenEncoding> = {
  // Anthropic (cl100k_base yaklaşımı)
  "claude-opus-4-8":            "cl100k_base",
  "claude-sonnet-4-6":          "cl100k_base",
  "claude-haiku-4-5-20251001":  "cl100k_base",
  // OpenAI — GPT-4o ve sonrası o200k_base kullanır
  "gpt-4o":                     "o200k_base",
  "gpt-4o-mini":                "o200k_base",
  "o3":                         "o200k_base",
  "o3-mini":                    "o200k_base",
  "o4-mini":                    "o200k_base",
  "gpt-4-turbo":                "cl100k_base",
  "gpt-4":                      "cl100k_base",
  "gpt-3.5-turbo":              "cl100k_base",
}

const cache = new Map<TiktokenEncoding, ReturnType<typeof getEncoding>>()
const tokenCountCache = new Map<string, number>()
const TOKEN_CACHE_LIMIT = 2_000
const ATTACHMENT_TOKEN_ESTIMATE = 1_200
let tokenCacheHits = 0
let tokenCacheMisses = 0

function getEncoder(encoding: TiktokenEncoding) {
  if (!cache.has(encoding)) {
    cache.set(encoding, getEncoding(encoding))
  }
  return cache.get(encoding)!
}

function isTiktokenEncoding(value: string): value is TiktokenEncoding {
  return value === "cl100k_base" || value === "o200k_base"
}

function resolveEncoding(modelId: string, preferredEncoding?: string): TiktokenEncoding {
  if (preferredEncoding && isTiktokenEncoding(preferredEncoding)) return preferredEncoding
  if (MODEL_ENCODINGS[modelId]) return MODEL_ENCODINGS[modelId]!
  // OpenRouter format: "provider/model-name"
  if (modelId.includes("/")) {
    const sub = modelId.split("/")[1] ?? ""
    if (sub.startsWith("gpt-4o") || sub.startsWith("o3") || sub.startsWith("o4")) return "o200k_base"
    if (sub.startsWith("claude")) return "cl100k_base"
  }
  return "cl100k_base"
}

export function countTokens(text: string, modelId?: string, preferredEncoding?: string): number {
  const encoding = resolveEncoding(modelId ?? "", preferredEncoding)
  const key = `${encoding}\0${text.length}\0${createHash("sha1").update(text).digest("hex")}`
  const cached = tokenCountCache.get(key)
  if (cached !== undefined) {
    tokenCacheHits++
    return cached
  }
  tokenCacheMisses++
  const count = getEncoder(encoding).encode(text).length
  tokenCountCache.set(key, count)
  if (tokenCountCache.size > TOKEN_CACHE_LIMIT) tokenCountCache.delete(tokenCountCache.keys().next().value!)
  return count
}

export function countMessageTokens(message: CoreMessage, modelId?: string, preferredEncoding?: string): number {
  return countTokens(tokenizableMessageText(message), modelId, preferredEncoding)
    + countMessageAttachments(message) * ATTACHMENT_TOKEN_ESTIMATE
    + 4
}

export function tokenizableMessageText(message: CoreMessage): string {
  if (typeof message.content === "string") return message.content
  return message.content
    .map(part => tokenizablePart(part as unknown as Record<string, unknown>))
    .filter(Boolean)
    .join("\n")
}

export function countMessageAttachments(message: CoreMessage): number {
  if (!Array.isArray(message.content)) return 0
  return message.content.filter(part => part.type === "image" || part.type === "file").length
}

export function countAttachmentsInMessages(messages: CoreMessage[]): number {
  return messages.reduce((sum, message) => sum + countMessageAttachments(message), 0)
}

export function tokenCacheStats(): { hits: number; misses: number; entries: number } {
  return { hits: tokenCacheHits, misses: tokenCacheMisses, entries: tokenCountCache.size }
}

export function clearTokenCache(): void {
  tokenCountCache.clear()
  tokenCacheHits = 0
  tokenCacheMisses = 0
}

export function estimateMessages(
  messages: Array<{ role: string; content: string }>,
  modelId?: string,
  preferredEncoding?: string,
): number {
  return messages.reduce((sum, m) => sum + countTokens(m.content, modelId, preferredEncoding) + 4, 0)
}

function tokenizablePart(part: Record<string, unknown>): string {
  const type = String(part["type"] ?? "")
  if (type === "text" || type === "reasoning") return String(part["text"] ?? "")
  if (type === "image") return "[image attachment]"
  if (type === "file") return `[file attachment: ${String(part["mimeType"] ?? "unknown")}]`
  if (type === "redacted-reasoning") return "[redacted reasoning]"
  if (type === "tool-call") return `${String(part["toolName"] ?? "tool")} ${semanticSerialize(part["args"])}`
  if (type === "tool-result") {
    const multipart = part["experimental_content"]
    const payload = Array.isArray(multipart)
      ? multipart.map(item => tokenizablePart(item as Record<string, unknown>)).join("\n")
      : semanticSerialize(part["result"])
    return `${String(part["toolName"] ?? "tool")} ${payload}`
  }
  return semanticSerialize(part)
}

function semanticSerialize(value: unknown): string {
  if (value === null || value === undefined) return ""
  if (typeof value === "string") {
    if (/^(?:data:[^,]+;base64,)?[A-Za-z0-9+/]{512,}={0,2}$/.test(value)) return `[binary ${value.length} chars]`
    return value
  }
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  if (value instanceof Uint8Array || value instanceof ArrayBuffer) return "[binary data]"
  if (value instanceof URL) return value.toString()
  if (Array.isArray(value)) return value.map(item => semanticSerialize(item)).filter(Boolean).join(" ")
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .filter(([name]) => !/^(?:data|image|base64)$/i.test(name))
      .map(([name, item]) => `${name}:${semanticSerialize(item)}`)
      .filter(entry => !entry.endsWith(":"))
      .join(" ")
  }
  return ""
}
