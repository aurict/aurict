import { createMailer, type Mailer } from "./email/mailer"
import { Hono } from "hono"
import { createDbClient, type BackendDb } from "./db/client"
import { loadEnv, type BackendEnv } from "./env"
import { bodyLimit } from "./middleware/body-limit"
import { errorResponse, requestContext } from "./middleware/errors"
import { createPostgresRateLimiter } from "./middleware/postgres-rate-limit"
import { createMemoryRateLimiter, type RateLimiter } from "./middleware/rate-limit"
import { createRedisRateLimiter } from "./middleware/redis-rate-limit"
import { corsPolicy, securityHeaders } from "./middleware/security"
import { createMemoryMetrics, observeRequest, type MetricsSink } from "./observability/metrics"
import { createMemoryStore } from "./store/memory"
import { createPostgresRepository } from "./store/postgres"
import { createMemoryRepository, type BackendRepository } from "./store/repository"
import type { BackendStore } from "./store/types"
import type { AppBindings } from "./types"
import { authRoutes } from "./routes/auth"
import { deviceRoutes } from "./routes/devices"
import { feedbackRoutes } from "./routes/feedback"
import { healthRoutes } from "./routes/health"
import { legalRoutes } from "./legal/routes"
import { remoteRoutes } from "./routes/remote"
import { secretRoutes } from "./routes/secrets"
import { trustRoutes } from "./routes/trust"
import { presenceRoutes } from "./routes/presence"

export type CreateAppOptions = {
  env?: BackendEnv
  store?: BackendStore
  db?: BackendDb
  repo?: BackendRepository
  rateLimiter?: RateLimiter
  metrics?: MetricsSink
  mailer?: Mailer
}

export function createApp(options: CreateAppOptions = {}) {
  const env = options.env ?? loadEnv()
  const store = options.store ?? createMemoryStore()
  const db = options.db ?? createDbClient(env)
  const repo = options.repo ?? (db ? createPostgresRepository(db.db) : createMemoryRepository(store))
  const rateLimiter = options.rateLimiter ?? createRedisRateLimiter(env) ?? (db ? createPostgresRateLimiter(db) : createMemoryRateLimiter())
  const metrics = options.metrics ?? createMemoryMetrics()
  const mailer = options.mailer ?? createMailer(env)
  if (env.NODE_ENV === "production" && !mailer.configured) {
    console.warn("RESEND_API_KEY is not set: email verification and password reset emails will not be delivered.")
  }
  const app = new Hono<AppBindings>()
  let lastExpirySweepAt = 0

  app.onError((error, c) => errorResponse(c, error))
  app.use("*", requestContext)
  app.use("*", async (c, next) => {
    c.set("env", env)
    c.set("store", store)
    c.set("repo", repo)
    c.set("rateLimiter", rateLimiter)
    c.set("metrics", metrics)
    c.set("mailer", mailer)
    if (db) c.set("db", db)
    const timestamp = Date.now()
    if (timestamp - lastExpirySweepAt > 30_000) {
      lastExpirySweepAt = timestamp
      await repo.markExpiredRemoteSessions(new Date(timestamp))
      await repo.purgeSecretCiphertexts(new Date(timestamp))
    }
    await next()
  })
  app.use("*", securityHeaders)
  app.use("*", corsPolicy)
  app.use("*", bodyLimit)
  app.use("*", observeRequest)

  app.route("/", healthRoutes)
  app.route("/", authRoutes)
  app.route("/", presenceRoutes)
  app.route("/", deviceRoutes)
  app.route("/", trustRoutes)
  app.route("/", secretRoutes)
  app.route("/", remoteRoutes)
  app.route("/", feedbackRoutes)
  app.route("/", legalRoutes)

  return app
}
