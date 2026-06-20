import type { Context, Next } from "hono"
import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { join } from "node:path"
import { homedir } from "node:os"

const TOKEN_FILE = join(homedir(), ".aurict", "server-token")

function generateToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Buffer.from(bytes).toString("hex")
}

export function getOrCreateToken(): string {
  try {
    const t = readFileSync(TOKEN_FILE, "utf8").trim()
    if (t.length >= 32) return t
  } catch { /* dosya yok — ilk çalıştırma */ }

  const token = generateToken()
  mkdirSync(join(homedir(), ".aurict"), { recursive: true })
  writeFileSync(TOKEN_FILE, token, { mode: 0o600 })
  return token
}

let _activeToken: string | null = null

export function setActiveToken(token: string) {
  _activeToken = token
}

// Hono middleware — /v1/health hariç tüm endpoint'leri korur
export async function bearerAuth(c: Context, next: Next) {
  if (c.req.path === "/v1/health") return next()

  const header = c.req.header("authorization") ?? ""
  const token  = header.startsWith("Bearer ") ? header.slice(7) : null

  if (!token || token !== _activeToken) {
    return c.json({ error: "Unauthorized" }, 401)
  }
  return next()
}
