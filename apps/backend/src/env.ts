import { z } from "zod"

const DEFAULT_JWT_SECRET = "dev-only-change-me-dev-only-change-me"
const booleanString = z.preprocess((value) => {
  if (value === "true") return true
  if (value === "false") return false
  return value
}, z.boolean())
const optionalString = (schema: z.ZodString) => z.preprocess((value) => value === "" ? undefined : value, schema.optional())

const envSchema = z.object({
  // Fails safe: an unset NODE_ENV means production, so dev-only shortcuts (test Firebase tokens,
  // action tokens echoed in responses, skipped device signature checks) need an explicit opt-in.
  NODE_ENV: z.enum(["development", "test", "production"]).default("production"),
  PORT: z.coerce.number().int().positive().default(8787),
  DATABASE_URL: z.string().url().optional(),
  DATABASE_MAX_CONNECTIONS: z.coerce.number().int().positive().max(50).default(10),
  DATABASE_IDLE_TIMEOUT_SECONDS: z.coerce.number().int().positive().max(300).default(20),
  DATABASE_CONNECT_TIMEOUT_SECONDS: z.coerce.number().int().positive().max(60).default(10),
  REDIS_URL: optionalString(z.string().url()),
  REDIS_CONNECT_TIMEOUT_SECONDS: z.coerce.number().int().positive().max(30).default(5),
  JWT_SECRET: z.string().min(32).default(DEFAULT_JWT_SECRET),
  JWT_PRIVATE_KEY: optionalString(z.string().min(32)),
  JWT_PUBLIC_KEY: optionalString(z.string().min(32)),
  ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  // Bound into every access token and checked on verification, so a token minted by another
  // service that shares the signing key is not accepted here.
  JWT_ISSUER: z.string().min(1).default("aurict-backend"),
  JWT_AUDIENCE: z.string().min(1).default("aurict-api"),
  REFRESH_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(60 * 60 * 24 * 30),
  DEVICE_LOGIN_TTL_SECONDS: z.coerce.number().int().positive().max(1800).default(600),
  DEVICE_LOGIN_POLL_INTERVAL_SECONDS: z.coerce.number().int().positive().max(30).default(5),
  DEVICE_LOGIN_VERIFICATION_URI: z.string().url().default("https://aurict.com/auth/device"),
  CORS_ORIGINS: z.string().default(""),
  TRUST_PROXY_HEADERS: booleanString.default(false),
  // Shared with the web app so it can pass the end user's IP for rate limiting (x-aurict-client-ip).
  TRUSTED_PROXY_SECRET: optionalString(z.string().min(32)),
  REQUEST_BODY_LIMIT_BYTES: z.coerce.number().int().positive().max(10_000_000).default(1_000_000),
  REQUEST_LOGS: booleanString.default(false),
  METRICS_TOKEN: optionalString(z.string().min(24)),
  ACTIVE_USERS_ADMIN_TOKEN: optionalString(z.string().min(32)),
  ACTIVE_USERS_WINDOW_SECONDS: z.coerce.number().int().positive().max(300).default(90),
  PUBLIC_OPENAPI: booleanString.default(false),
  REQUIRE_DEVICE_VERIFICATION: booleanString.default(true),
  FIREBASE_PROJECT_ID: optionalString(z.string().min(1)),
  // Transactional email (verification, password reset) through Resend's HTTP API.
  // Feedback reports can include up to 24 KB of conversation text; they are deleted after this.
  FEEDBACK_RETENTION_DAYS: z.coerce.number().int().positive().max(3650).default(90),
  RESEND_API_KEY: optionalString(z.string().min(10)),
  EMAIL_FROM: z.string().min(3).default("Aurict <no-reply@aurict.com>"),
  // Links in emails point at the web app, which owns the verify and reset pages.
  EMAIL_LINK_BASE_URL: z.string().url().default("https://aurict.com"),
  REMOTE_MAX_ACTIVE_SESSIONS: z.coerce.number().int().positive().max(10).default(1),
  REMOTE_MAX_TTL_SECONDS: z.coerce.number().int().positive().max(900).default(300),
  REMOTE_MAX_IDLE_SECONDS: z.coerce.number().int().positive().max(300).default(90),
  TURN_URIS: z.string().default(""),
  TURN_SHARED_SECRET: optionalString(z.string().min(16)),
  TURN_USERNAME_TTL_SECONDS: z.coerce.number().int().positive().max(3600).default(600),
})

export type BackendEnv = z.infer<typeof envSchema>

export function loadEnv(input: Record<string, string | undefined> = process.env): BackendEnv {
  const env = envSchema.parse(input)
  if (Boolean(env.JWT_PRIVATE_KEY) !== Boolean(env.JWT_PUBLIC_KEY)) {
    throw new Error("JWT_PRIVATE_KEY and JWT_PUBLIC_KEY must be set together (run scripts/generate-jwt-keys.ts).")
  }
  if (env.NODE_ENV === "production") {
    if (env.JWT_SECRET === DEFAULT_JWT_SECRET) {
      throw new Error("JWT_SECRET must be set to a non-default value in production.")
    }
    if (!env.DATABASE_URL) {
      throw new Error("DATABASE_URL is required in production.")
    }
    if (!env.CORS_ORIGINS) {
      throw new Error("CORS_ORIGINS must be explicitly configured in production.")
    }
  }
  return env
}
