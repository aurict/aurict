import { z } from "zod"

const DEFAULT_JWT_SECRET = "dev-only-change-me-dev-only-change-me"
const booleanString = z.preprocess((value) => {
  if (value === "true") return true
  if (value === "false") return false
  return value
}, z.boolean())
const optionalString = (schema: z.ZodString) => z.preprocess((value) => value === "" ? undefined : value, schema.optional())

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
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
  REFRESH_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(60 * 60 * 24 * 30),
  DEVICE_LOGIN_TTL_SECONDS: z.coerce.number().int().positive().max(1800).default(600),
  DEVICE_LOGIN_POLL_INTERVAL_SECONDS: z.coerce.number().int().positive().max(30).default(5),
  DEVICE_LOGIN_VERIFICATION_URI: z.string().url().default("https://aurict.com/auth/device"),
  CORS_ORIGINS: z.string().default(""),
  TRUST_PROXY_HEADERS: booleanString.default(false),
  REQUEST_BODY_LIMIT_BYTES: z.coerce.number().int().positive().max(10_000_000).default(1_000_000),
  REQUEST_LOGS: booleanString.default(false),
  METRICS_TOKEN: optionalString(z.string().min(24)),
  PUBLIC_OPENAPI: booleanString.default(false),
  REQUIRE_DEVICE_VERIFICATION: booleanString.default(true),
  FIREBASE_PROJECT_ID: optionalString(z.string().min(1)),
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
