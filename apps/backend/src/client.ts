export type ApiResult<T> = T & { ok: true }
export type ApiErrorResult = { ok: false; error: { code: string; message: string; requestId: string; issues?: Array<{ path: string; message: string }> } }

export class AurictBackendClient {
  constructor(private readonly baseUrl: string, private accessToken?: string) {}

  setAccessToken(token: string | undefined) {
    this.accessToken = token
  }

  register(email: string, password: string) {
    return this.request<{ accessToken: string; refreshToken: string; tokenType: "Bearer" }>("/auth/register", {
      method: "POST",
      body: { email, password },
    })
  }

  login(email: string, password: string) {
    return this.request<{ accessToken: string; refreshToken: string; tokenType: "Bearer" }>("/auth/login", {
      method: "POST",
      body: { email, password },
    })
  }

  startDeviceLogin(clientName = "Aurict CLI") {
    return this.request<{
      deviceCode: string
      userCode: string
      verificationUri: string
      verificationUriComplete: string
      expiresAt: string
      intervalSeconds: number
    }>("/auth/device/start", {
      method: "POST",
      body: { clientName, platform: "cli" },
    })
  }

  pollDeviceLogin(deviceCode: string) {
    return this.request<{
      status: "pending" | "approved"
      intervalSeconds?: number
      accessToken?: string
      refreshToken?: string
      tokenType?: "Bearer"
    }>("/auth/device/poll", {
      method: "POST",
      body: { deviceCode },
    })
  }

  approveDeviceLogin(userCode: string) {
    return this.request<{ status: "approved"; clientName: string; expiresAt: string }>("/auth/device/approve", {
      method: "POST",
      body: { userCode },
    })
  }

  denyDeviceLogin(userCode: string) {
    return this.request<{ status: "denied" }>("/auth/device/deny", {
      method: "POST",
      body: { userCode },
    })
  }

  me() {
    return this.request<{ user: { id: string; email: string; createdAt: string } }>("/auth/me")
  }

  listDevices() {
    return this.request<{ devices: unknown[] }>("/devices")
  }

  createSecretTransfer(body: unknown) {
    return this.request<{ transfer: unknown }>("/secrets/transfers", { method: "POST", body })
  }

  createRemoteSession(body: unknown) {
    return this.request<{ session: unknown }>("/remote/sessions", { method: "POST", body })
  }

  async request<T>(path: string, options: { method?: string; body?: unknown; headers?: Record<string, string> } = {}): Promise<ApiResult<T> | ApiErrorResult> {
    const headers: Record<string, string> = { ...options.headers }
    if (options.body !== undefined) headers["content-type"] = "application/json"
    if (this.accessToken) headers.authorization = `Bearer ${this.accessToken}`
    const res = await fetch(new URL(path, this.baseUrl), {
      method: options.method ?? "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    })
    return await res.json() as ApiResult<T> | ApiErrorResult
  }
}
