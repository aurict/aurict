import { lookup } from "node:dns/promises"
import { isIP } from "node:net"

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308])
const SENSITIVE_REDIRECT_HEADERS = ["authorization", "cookie", "proxy-authorization"]

function isBlockedIpv4(address: string): boolean {
  const octets = address.split(".").map(Number)
  if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return true
  const [a, b] = octets as [number, number, number, number]
  return a === 0 || a === 10 || a === 127 || a >= 224
    || (a === 100 && b >= 64 && b <= 127)
    || (a === 169 && b === 254)
    || (a === 172 && b >= 16 && b <= 31)
    || (a === 192 && b === 168)
    || (a === 198 && (b === 18 || b === 19))
}

function isBlockedIp(address: string): boolean {
  if (isIP(address) === 4) return isBlockedIpv4(address)
  const normalized = address.toLowerCase()
  if (normalized.startsWith("::ffff:")) return isBlockedIpv4(normalized.slice(7))
  return normalized === "::" || normalized === "::1"
    || normalized.startsWith("fc") || normalized.startsWith("fd")
    || /^fe[89ab]/.test(normalized)
    || normalized.startsWith("2001:db8:")
}

export async function assertSafeRemoteUrl(input: string): Promise<URL> {
  let url: URL
  try {
    url = new URL(input)
  } catch {
    throw new Error("Invalid URL")
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http:// and https:// URLs are allowed")
  }
  if (url.username || url.password) throw new Error("Credentials in URLs are not allowed")
  const hostname = url.hostname.toLowerCase().replace(/\.$/, "")
  if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local")) {
    throw new Error("Local and private network targets are blocked")
  }

  const addresses = isIP(hostname)
    ? [{ address: hostname }]
    : await lookup(hostname, { all: true, verbatim: true })
  if (addresses.length === 0 || addresses.some(({ address }) => isBlockedIp(address))) {
    throw new Error("Local, private, and reserved network targets are blocked")
  }
  return url
}

function abortError(): Error {
  return Object.assign(new Error("The operation was aborted"), { name: "AbortError" })
}

/**
 * dns.promises.lookup() takes no AbortSignal, so a stuck resolver would outlive
 * the caller's timeout or cancellation and hang the whole request. Race the
 * policy check against the signal so callers always get a prompt AbortError.
 * The lookup itself keeps running detached; it holds no caller-visible state.
 */
export async function withAbort<T>(signal: AbortSignal | null | undefined, run: () => Promise<T>): Promise<T> {
  if (!signal) return run()
  if (signal.aborted) throw abortError()
  let onAbort: () => void = () => {}
  try {
    return await Promise.race([
      run(),
      new Promise<never>((_resolve, reject) => {
        onAbort = () => reject(abortError())
        signal.addEventListener("abort", onAbort, { once: true })
      }),
    ])
  } finally {
    signal.removeEventListener("abort", onAbort)
  }
}

export async function fetchWithUrlPolicy(
  input: string,
  init: RequestInit,
  opts: { followRedirects?: boolean; maxRedirects?: number } = {},
): Promise<Response> {
  const signal = init.signal
  let url = await withAbort(signal, () => assertSafeRemoteUrl(input))
  let request: RequestInit = { ...init, redirect: "manual" }
  const followRedirects = opts.followRedirects ?? true
  const maxRedirects = opts.maxRedirects ?? 5

  for (let redirects = 0; ; redirects++) {
    const response = await fetch(url, request)
    if (!REDIRECT_STATUSES.has(response.status) || !followRedirects) return response
    if (redirects >= maxRedirects) throw new Error(`Too many redirects (max ${maxRedirects})`)
    const location = response.headers.get("location")
    if (!location) return response

    const nextUrl = await withAbort(signal, () => assertSafeRemoteUrl(new URL(location, url).toString()))
    const headers = new Headers(request.headers)
    if (nextUrl.origin !== url.origin) {
      for (const name of SENSITIVE_REDIRECT_HEADERS) headers.delete(name)
    }
    const method = String(request.method ?? "GET").toUpperCase()
    if (response.status === 303 || ((response.status === 301 || response.status === 302) && method === "POST")) {
      request = { ...request, method: "GET", headers, body: null, redirect: "manual" }
    } else {
      request = { ...request, headers, redirect: "manual" }
    }
    url = nextUrl
  }
}

export async function readResponseTextLimited(response: Response, maxBytes: number): Promise<{ text: string; truncated: boolean }> {
  if (!response.body) return { text: "", truncated: false }
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let bytes = 0
  let text = ""
  let truncated = false
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const remaining = maxBytes - bytes
      if (remaining <= 0) {
        truncated = true
        await reader.cancel()
        break
      }
      const slice = value.byteLength > remaining ? value.subarray(0, remaining) : value
      bytes += slice.byteLength
      text += decoder.decode(slice, { stream: true })
      if (slice.byteLength < value.byteLength) {
        truncated = true
        await reader.cancel()
        break
      }
    }
    text += decoder.decode()
    return { text, truncated }
  } finally {
    reader.releaseLock()
  }
}
