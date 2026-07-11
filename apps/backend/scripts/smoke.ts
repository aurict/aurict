type Json = Record<string, any>

const baseUrl = process.env.AURICT_BACKEND_URL ?? "http://127.0.0.1:8787"
const email = process.env.AURICT_SMOKE_EMAIL ?? `smoke-${Date.now()}@example.com`
const password = process.env.AURICT_SMOKE_PASSWORD ?? "correct horse battery smoke"
const metricsToken = process.env.METRICS_TOKEN

async function main() {
  await expectOk("health", request("/health"))
  await expectOk("ready", request("/ready"))

  const metrics = await request("/metrics", metricsToken ? { headers: { authorization: `Bearer ${metricsToken}` } } : undefined)
  if (metricsToken) assertStatus("metrics", metrics.response.status, 200)

  const registered = await expectOk("register", request("/auth/register", {
    method: "POST",
    body: { email, password },
  }), 201)

  await expectOk("login", request("/auth/login", {
    method: "POST",
    body: { email, password },
  }))

  const refreshed = await expectOk("refresh", request("/auth/refresh", {
    method: "POST",
    body: { refreshToken: registered.refreshToken },
  }))

  const replay = await request("/auth/refresh", {
    method: "POST",
    body: { refreshToken: registered.refreshToken },
  })
  assertStatus("refresh replay rejected", replay.response.status, 401)

  await expectOk("logout", request("/auth/logout", {
    method: "POST",
    body: { refreshToken: refreshed.refreshToken },
  }))

  console.log(JSON.stringify({ ok: true, baseUrl, email }))
}

async function request(path: string, init: { method?: string; headers?: Record<string, string>; body?: unknown } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: init.method ?? "GET",
    headers: {
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...init.headers,
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
  })
  const text = await response.text()
  let body: Json = {}
  if (text) body = JSON.parse(text) as Json
  return { response, body }
}

async function expectOk(name: string, resultPromise: Promise<{ response: Response; body: Json }>, status = 200) {
  const result = await resultPromise
  assertStatus(name, result.response.status, status)
  if (result.body.ok !== true) throw new Error(`${name} did not return ok=true`)
  return result.body
}

function assertStatus(name: string, actual: number, expected: number) {
  if (actual !== expected) throw new Error(`${name} expected HTTP ${expected}, got ${actual}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
