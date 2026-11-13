/**
 * Resolves the post-login target against this origin and keeps only same-origin paths.
 * String prefix checks are not enough: browsers treat "/\\evil.com" and "/<tab>/evil.com"
 * as "//evil.com", a different host.
 */
// During server rendering there is no window; any fixed origin gives the same result for
// relative paths and still rejects every absolute or protocol-relative one.
const SERVER_ORIGIN = "https://origin.invalid"

export function sanitizeNextPath(value: string | null, origin: string = typeof window === "undefined" ? SERVER_ORIGIN : window.location.origin) {
  if (!value) return "/"
  try {
    const url = new URL(value, origin)
    if (url.origin !== origin) return "/"
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return "/"
  }
}
