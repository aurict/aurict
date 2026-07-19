import { describe, expect, test } from "bun:test"
import { createApp } from "../src/app"
import { loadEnv } from "../src/env"
import { createMemoryStore } from "../src/store/memory"

const adminToken = "presence-admin-token-presence-admin-token"
const env = loadEnv({
  NODE_ENV: "test",
  JWT_SECRET: "test-secret-test-secret-test-secret-test-secret",
  ACTIVE_USERS_ADMIN_TOKEN: adminToken,
  ACTIVE_USERS_WINDOW_SECONDS: "90",
})

async function register(app: ReturnType<typeof createApp>, email: string) {
  const response = await app.request("/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password: "correct horse battery" }),
  })
  expect(response.status).toBe(201)
  return await response.json() as { accessToken: string }
}

describe("active user presence", () => {
  test("returns only the unique active-user count to an authorized operator", async () => {
    const app = createApp({ env, store: createMemoryStore() })
    const first = await register(app, "first@example.com")
    const second = await register(app, "second@example.com")

    for (const token of [first.accessToken, first.accessToken, second.accessToken]) {
      const heartbeat = await app.request("/presence/heartbeat", {
        method: "POST",
        headers: { authorization: `Bearer ${token}` },
      })
      expect(heartbeat.status).toBe(200)
    }

    const count = await app.request("/internal/active-users", {
      headers: { "x-aurict-admin-token": adminToken },
    })
    expect(count.status).toBe(200)
    expect((await count.json() as { activeUsers: number }).activeUsers).toBe(2)
  })

  test("does not disclose the count without the dedicated operator token", async () => {
    const app = createApp({ env, store: createMemoryStore() })
    expect((await app.request("/internal/active-users")).status).toBe(401)
  })
})
