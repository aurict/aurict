import type { ToolContext } from "../../types.js"

/**
 * Aurict backend'ini çağıran tool'ların (legal) ortak HTTP client'ı.
 *
 * İstekler backend'in Ed25519-imzalı JWT access token'ıyla doğrulanır.
 */

const DEFAULT_BACKEND_URL = "https://api.aurict.com"
const REQUEST_TIMEOUT_MS = 15_000

export type AurictApiRequestOptions = {
  method?: "GET" | "POST"
  body?: RequestInit["body"]
}

export type AurictApiResult<T> =
  | { kind: "success"; data: T }
  | { kind: "not_authenticated" }
  | { kind: "authorization_rejected" }
  | { kind: "unavailable"; detail: string }
  | { kind: "error"; status: number; detail: string }

function baseUrl(): string {
  return process.env["AURICT_BACKEND_URL"]?.trim() || DEFAULT_BACKEND_URL
}

export async function callAurictApi<T>(
  ctx: ToolContext,
  path: string,
  options: AurictApiRequestOptions = {},
): Promise<AurictApiResult<T>> {
  let accessToken = ctx.backendAccessToken
  if (!accessToken && ctx.backendAccessTokenResolver) {
    try {
      accessToken = await ctx.backendAccessTokenResolver(ctx.signal)
    } catch (error) {
      return { kind: "unavailable", detail: error instanceof Error ? error.message : String(error) }
    }
  }
  if (!accessToken) return { kind: "not_authenticated" }

  const timeoutController = new AbortController()
  const timer = setTimeout(() => timeoutController.abort(), REQUEST_TIMEOUT_MS)
  const signal = typeof AbortSignal.any === "function"
    ? AbortSignal.any([ctx.signal, timeoutController.signal])
    : ctx.signal
  const request: RequestInit = {
    method: options.method ?? "GET",
    headers: { authorization: `Bearer ${accessToken}` },
    signal,
    ...(options.body === undefined ? {} : { body: options.body }),
  }

  let response: Response
  try {
    response = await fetch(new URL(path, baseUrl()), request)
  } catch (error) {
    return { kind: "unavailable", detail: error instanceof Error ? error.message : String(error) }
  } finally {
    clearTimeout(timer)
  }

  if (response.status === 401) return { kind: "authorization_rejected" }
  if (response.status === 502 || response.status === 503 || response.status === 504) {
    return { kind: "unavailable", detail: `HTTP ${response.status}` }
  }

  let body: unknown
  try {
    body = await response.json()
  } catch {
    return { kind: "error", status: response.status, detail: "Response was not valid JSON." }
  }

  if (!response.ok) {
    return { kind: "error", status: response.status, detail: extractErrorDetail(body, response.status) }
  }

  return { kind: "success", data: body as T }
}

/** FastAPI (`{"detail": "..."}`) ve Hono (`{"error":{"message":"..."}}`) hata şekillerini normalize eder. */
function extractErrorDetail(body: unknown, status: number): string {
  if (typeof body === "object" && body !== null) {
    const record = body as Record<string, unknown>
    if (typeof record["detail"] === "string") return record["detail"]
    if (typeof record["error"] === "string") return record["error"]
    if (typeof record["error"] === "object" && record["error"] !== null) {
      const message = (record["error"] as Record<string, unknown>)["message"]
      if (typeof message === "string") return message
    }
  }
  return `HTTP ${status}`
}

/** Auth, erişim ve servis hataları için tutarlı, kullanıcıya gösterilebilir mesaj. */
export function describeAurictApiFailure(result: Exclude<AurictApiResult<unknown>, { kind: "success" }>): string {
  switch (result.kind) {
    case "not_authenticated":
      return "Kullanıcı Aurict hesabına giriş yapmamış (veya oturumun süresi dolmuş). Bu veriye erişmek için önce giriş yapması gerekiyor — kullanıcıya bunu açıkça söyle, veriyi uydurma."
    case "authorization_rejected":
      return `Kullanıcı Aurict hesabında oturum açmış görünüyor, ancak Aurict API bu oturum belirtecini HTTP 401 ile reddetti. Bu, giriş yapılmadığı anlamına gelmez; servis tarafındaki belirteç doğrulaması veya yetki yapılandırması incelenmeli.`
    case "unavailable":
      return `Veri servisine şu an ulaşılamıyor (${result.detail}). Kullanıcıya servisin geçici olarak erişilemez olduğunu söyle, aynı sorguyu art arda tekrar deneme.`
    case "error":
      return `Veri servisi bir hata döndürdü (HTTP ${result.status}: ${result.detail}). Kullanıcıya bunu dürüstçe ilet.`
  }
}
